import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { getIO } from '../sockets/socketManager.js';

export const liveMonitoringRouter = Router();
liveMonitoringRouter.use(authMiddleware);

liveMonitoringRouter.get('/overview', (req: AuthenticatedRequest, res) => {
  const companyId = req.user!.companyId;

  // Active agents status
  const agents = db.prepare(`
    SELECT 
      u.id, 
      u.name, 
      u.email, 
      u.role, 
      u.status, 
      u.avatar_url,
      (SELECT COUNT(*) FROM tickets t WHERE t.user_id = u.id AND t.status = 'open') as active_tickets
    FROM users u
    WHERE u.company_id = ?
    ORDER BY u.status ASC, active_tickets DESC
  `).all(companyId);

  // Tickets currently waiting in queue
  const waitingTickets = db.prepare(`
    SELECT 
      t.*,
      c.name as contact_name,
      c.phone as contact_phone,
      q.name as queue_name,
      q.color as queue_color
    FROM tickets t
    JOIN contacts c ON t.contact_id = c.id
    LEFT JOIN queues q ON t.queue_id = q.id
    WHERE t.company_id = ? AND t.status = 'pending'
    ORDER BY t.created_at ASC
  `).all(companyId);

  // Tickets currently in active chat
  const inServiceTickets = db.prepare(`
    SELECT 
      t.*,
      c.name as contact_name,
      c.phone as contact_phone,
      u.name as agent_name,
      q.name as queue_name,
      q.color as queue_color
    FROM tickets t
    JOIN contacts c ON t.contact_id = c.id
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN queues q ON t.queue_id = q.id
    WHERE t.company_id = ? AND t.status = 'open'
    ORDER BY t.last_message_at DESC
  `).all(companyId);

  res.json({
    agents,
    waitingTickets,
    inServiceTickets,
    liveStats: {
      onlineAgents: agents.filter((a: any) => a.status === 'online').length,
      busyAgents: agents.filter((a: any) => a.active_tickets > 0).length,
      waitingCount: waitingTickets.length,
      inServiceCount: inServiceTickets.length
    }
  });
});

// Intervene: supervisor takes over ticket
liveMonitoringRouter.post('/takeover/:ticketId', (req: AuthenticatedRequest, res) => {
  const { ticketId } = req.params;
  const companyId = req.user!.companyId;
  const supervisorId = req.user!.id;
  const supervisorName = req.user!.name;

  db.prepare(`
    UPDATE tickets 
    SET user_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND company_id = ?
  `).run(supervisorId, ticketId, companyId);

  // Insert notification message
  const msgId = `msg_${uuidv4().substring(0, 8)}`;
  db.prepare(`
    INSERT INTO messages (id, ticket_id, sender_type, sender_name, message_type, content, is_internal)
    VALUES (?, ?, 'system', 'Supervisão', 'chat', ?, 1)
  `).run(msgId, ticketId, `⚠️ O Supervisor ${supervisorName} assumiu este atendimento.`);

  try {
    const io = getIO();
    io.to(`company_${companyId}`).emit('ticketUpdated', { ticketId });
    io.to(`ticket_${ticketId}`).emit('ticketUpdated', { ticketId });
  } catch (err) {}

  res.json({ success: true, supervisorName });
});

// Whisper: send secret note to the agent
liveMonitoringRouter.post('/whisper/:ticketId', (req: AuthenticatedRequest, res) => {
  const { ticketId } = req.params;
  const { content } = req.body;
  const companyId = req.user!.companyId;

  const msgId = `msg_${uuidv4().substring(0, 8)}`;
  db.prepare(`
    INSERT INTO messages (id, ticket_id, sender_type, sender_name, message_type, content, is_internal)
    VALUES (?, ?, 'agent', ?, 'note', ?, 1)
  `).run(msgId, ticketId, `Sussurro de ${req.user!.name}`, `🤫 [SUSSURRO DE SUPERVISÃO]: ${content}`);

  const whisperMsg = {
    id: msgId,
    ticket_id: ticketId,
    sender_type: 'agent',
    sender_name: `Sussurro (${req.user!.name})`,
    message_type: 'note',
    content: `🤫 [SUSSURRO]: ${content}`,
    is_internal: 1,
    read: 1,
    created_at: new Date().toISOString()
  };

  try {
    const io = getIO();
    io.to(`ticket_${ticketId}`).emit('newMessage', whisperMsg);
  } catch (err) {}

  res.json({ success: true });
});
