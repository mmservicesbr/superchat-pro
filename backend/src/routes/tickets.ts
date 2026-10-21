import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { getIO } from '../sockets/socketManager.js';

export const ticketsRouter = Router();
ticketsRouter.use(authMiddleware);

ticketsRouter.get('/', (req: AuthenticatedRequest, res) => {
  const companyId = req.user!.companyId;
  const { status, queueId, search, kanbanStage } = req.query;

  let query = `
    SELECT 
      t.*,
      c.name as contact_name,
      c.phone as contact_phone,
      c.email as contact_email,
      c.avatar_url as contact_avatar,
      c.tags as contact_tags,
      c.notes as contact_notes,
      u.name as user_name,
      u.email as user_email,
      q.name as queue_name,
      q.color as queue_color
    FROM tickets t
    JOIN contacts c ON t.contact_id = c.id
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN queues q ON t.queue_id = q.id
    WHERE t.company_id = ?
  `;
  const params: any[] = [companyId];

  if (status && status !== 'all') {
    query += ` AND t.status = ?`;
    params.push(status);
  }

  if (queueId && queueId !== 'all') {
    query += ` AND t.queue_id = ?`;
    params.push(queueId);
  }

  if (kanbanStage && kanbanStage !== 'all') {
    query += ` AND t.kanban_stage = ?`;
    params.push(kanbanStage);
  }

  if (search) {
    query += ` AND (c.name LIKE ? OR c.phone LIKE ? OR t.last_message LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += ` ORDER BY t.last_message_at DESC`;

  const tickets = db.prepare(query).all(...params);

  // Parse contact_tags from JSON string
  const formatted = tickets.map((t: any) => ({
    ...t,
    contact_tags: t.contact_tags ? JSON.parse(t.contact_tags) : []
  }));

  res.json(formatted);
});

ticketsRouter.post('/', (req: AuthenticatedRequest, res) => {
  const companyId = req.user!.companyId;
  const { name, phone, email, queueId, initialMessage } = req.body;

  if (!name || !phone) {
    res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    return;
  }

  // Check if contact already exists
  let contact = db.prepare(`SELECT * FROM contacts WHERE company_id = ? AND phone = ?`).get(companyId, phone) as any;
  if (!contact) {
    const contactId = `cont_${uuidv4().substring(0, 8)}`;
    db.prepare(`
      INSERT INTO contacts (id, company_id, name, phone, email, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(contactId, companyId, name, phone, email || null, '[]');
    contact = { id: contactId, name, phone, email, tags: '[]' };
  }

  const ticketId = `tick_${uuidv4().substring(0, 8)}`;
  const protocol = `PROT-${Date.now().toString().slice(-8)}`;
  const messageContent = initialMessage || 'Olá, atendimento iniciado via painel.';

  db.prepare(`
    INSERT INTO tickets (id, company_id, contact_id, user_id, queue_id, status, kanban_stage, last_message, protocol)
    VALUES (?, ?, ?, ?, ?, 'open', 'leads', ?, ?)
  `).run(ticketId, companyId, contact.id, req.user!.id, queueId || null, messageContent, protocol);

  const messageId = `msg_${uuidv4().substring(0, 8)}`;
  db.prepare(`
    INSERT INTO messages (id, ticket_id, sender_type, sender_name, message_type, content, read)
    VALUES (?, ?, 'agent', ?, 'chat', ?, 1)
  `).run(messageId, ticketId, req.user!.name, messageContent);

  // Notify socket
  try {
    const io = getIO();
    io.to(`company_${companyId}`).emit('ticketCreated', { ticketId, companyId });
  } catch (err) {}

  res.status(201).json({ id: ticketId, protocol });
});

// Accept ticket (Puxar conversa da fila)
ticketsRouter.put('/:id/accept', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const companyId = req.user!.companyId;

  db.prepare(`
    UPDATE tickets 
    SET user_id = ?, status = 'open', updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND company_id = ?
  `).run(userId, id, companyId);

  // Insert internal system message
  const msgId = `msg_${uuidv4().substring(0, 8)}`;
  db.prepare(`
    INSERT INTO messages (id, ticket_id, sender_type, sender_name, message_type, content, is_internal)
    VALUES (?, ?, 'system', 'Sistema', 'chat', ?, 1)
  `).run(msgId, id, `Atendimento assumido por ${req.user!.name}`);

  try {
    const io = getIO();
    io.to(`company_${companyId}`).emit('ticketUpdated', { ticketId: id, status: 'open', userId });
    io.to(`ticket_${id}`).emit('ticketUpdated', { ticketId: id, status: 'open', userId });
  } catch (err) {}

  res.json({ success: true });
});

// Transfer ticket
ticketsRouter.put('/:id/transfer', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { targetUserId, targetQueueId, note } = req.body;
  const companyId = req.user!.companyId;

  db.prepare(`
    UPDATE tickets 
    SET user_id = ?, queue_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND company_id = ?
  `).run(targetUserId || null, targetQueueId || null, id, companyId);

  if (note) {
    const noteId = `msg_${uuidv4().substring(0, 8)}`;
    db.prepare(`
      INSERT INTO messages (id, ticket_id, sender_type, sender_name, message_type, content, is_internal)
      VALUES (?, ?, 'agent', ?, 'note', ?, 1)
    `).run(noteId, id, req.user!.name, `Transferência: ${note}`);
  }

  try {
    const io = getIO();
    io.to(`company_${companyId}`).emit('ticketUpdated', { ticketId: id });
    io.to(`ticket_${id}`).emit('ticketUpdated', { ticketId: id });
  } catch (err) {}

  res.json({ success: true });
});

// Resolve ticket (Finalizar)
ticketsRouter.put('/:id/resolve', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  const companyId = req.user!.companyId;

  db.prepare(`
    UPDATE tickets 
    SET status = 'closed', kanban_stage = 'ganho', rating = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND company_id = ?
  `).run(rating || 5, id, companyId);

  // System message
  const msgId = `msg_${uuidv4().substring(0, 8)}`;
  db.prepare(`
    INSERT INTO messages (id, ticket_id, sender_type, sender_name, message_type, content, is_internal)
    VALUES (?, ?, 'system', 'Sistema', 'chat', ?, 1)
  `).run(msgId, id, `Atendimento finalizado por ${req.user!.name}`);

  try {
    const io = getIO();
    io.to(`company_${companyId}`).emit('ticketUpdated', { ticketId: id, status: 'closed' });
    io.to(`ticket_${id}`).emit('ticketUpdated', { ticketId: id, status: 'closed' });
  } catch (err) {}

  res.json({ success: true });
});

// Kanban stage change (Drag & Drop)
ticketsRouter.put('/:id/kanban', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { stage } = req.body;
  const companyId = req.user!.companyId;

  db.prepare(`
    UPDATE tickets 
    SET kanban_stage = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND company_id = ?
  `).run(stage, id, companyId);

  try {
    const io = getIO();
    io.to(`company_${companyId}`).emit('ticketUpdated', { ticketId: id, kanbanStage: stage });
  } catch (err) {}

  res.json({ success: true });
});

// Update tags
ticketsRouter.put('/:id/tags', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { tags } = req.body;
  const companyId = req.user!.companyId;

  const ticket = db.prepare(`SELECT contact_id FROM tickets WHERE id = ? AND company_id = ?`).get(id, companyId) as any;
  if (ticket) {
    db.prepare(`UPDATE contacts SET tags = ? WHERE id = ?`).run(JSON.stringify(tags || []), ticket.contact_id);
  }

  res.json({ success: true });
});
