import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { getIO } from '../sockets/socketManager.js';

export const messagesRouter = Router();
messagesRouter.use(authMiddleware);

messagesRouter.get('/:ticketId', (req: AuthenticatedRequest, res) => {
  const { ticketId } = req.params;

  // Mark messages as read
  db.prepare(`UPDATE messages SET read = 1 WHERE ticket_id = ? AND sender_type = 'contact'`).run(ticketId);
  db.prepare(`UPDATE tickets SET unread_count = 0 WHERE id = ?`).run(ticketId);

  const messages = db.prepare(`
    SELECT * FROM messages
    WHERE ticket_id = ?
    ORDER BY created_at ASC
  `).all(ticketId);

  res.json(messages);
});

messagesRouter.post('/:ticketId', (req: AuthenticatedRequest, res) => {
  const { ticketId } = req.params;
  const { content, messageType = 'chat', mediaUrl, mediaName, isInternal = 0 } = req.body;

  if (!content) {
    res.status(400).json({ error: 'Conteúdo da mensagem é obrigatório' });
    return;
  }

  const messageId = `msg_${uuidv4().substring(0, 8)}`;
  const senderName = req.user!.name;

  db.prepare(`
    INSERT INTO messages (id, ticket_id, sender_type, sender_name, message_type, content, media_url, media_name, is_internal, read)
    VALUES (?, ?, 'agent', ?, ?, ?, ?, ?, ?, 1)
  `).run(messageId, ticketId, senderName, messageType, content, mediaUrl || null, mediaName || null, isInternal ? 1 : 0);

  // Update ticket last_message
  if (!isInternal) {
    let preview = content;
    if (messageType === 'audio') preview = '🎵 Áudio gravado';
    else if (messageType === 'image') preview = '📷 Imagem';
    else if (messageType === 'document') preview = '📄 Documento';

    db.prepare(`
      UPDATE tickets
      SET last_message = ?, last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(preview, ticketId);
  }

  const newMessage = {
    id: messageId,
    ticket_id: ticketId,
    sender_type: 'agent',
    sender_name: senderName,
    message_type: messageType,
    content,
    media_url: mediaUrl,
    media_name: mediaName,
    is_internal: isInternal ? 1 : 0,
    read: 1,
    created_at: new Date().toISOString()
  };

  try {
    const io = getIO();
    io.to(`ticket_${ticketId}`).emit('newMessage', newMessage);
    io.to(`company_${req.user!.companyId}`).emit('ticketMessageUpdate', {
      ticketId,
      lastMessage: isInternal ? undefined : content,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {}

  res.status(201).json(newMessage);
});

// Endpoint to simulate incoming customer message (useful for testing real-time live chat!)
messagesRouter.post('/:ticketId/simulate-customer', (req: AuthenticatedRequest, res) => {
  const { ticketId } = req.params;
  const { content, messageType = 'chat' } = req.body;

  const ticket = db.prepare(`
    SELECT t.*, c.name as contact_name
    FROM tickets t
    JOIN contacts c ON t.contact_id = c.id
    WHERE t.id = ?
  `).get(ticketId) as any;

  if (!ticket) {
    res.status(404).json({ error: 'Atendimento não encontrado' });
    return;
  }

  const messageId = `msg_${uuidv4().substring(0, 8)}`;
  db.prepare(`
    INSERT INTO messages (id, ticket_id, sender_type, sender_name, message_type, content, read)
    VALUES (?, ?, 'contact', ?, ?, ?, 0)
  `).run(messageId, ticketId, ticket.contact_name, messageType, content || 'Resposta de teste do cliente');

  db.prepare(`
    UPDATE tickets
    SET last_message = ?, last_message_at = CURRENT_TIMESTAMP, unread_count = unread_count + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(content, ticketId);

  const incoming = {
    id: messageId,
    ticket_id: ticketId,
    sender_type: 'contact',
    sender_name: ticket.contact_name,
    message_type: messageType,
    content: content || 'Resposta de teste do cliente',
    read: 0,
    created_at: new Date().toISOString()
  };

  try {
    const io = getIO();
    io.to(`ticket_${ticketId}`).emit('newMessage', incoming);
    io.to(`company_${req.user!.companyId}`).emit('ticketMessageUpdate', {
      ticketId,
      lastMessage: content,
      updatedAt: new Date().toISOString(),
      incrementUnread: true
    });
  } catch (err) {}

  res.json(incoming);
});
