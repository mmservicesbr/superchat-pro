import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

export const queuesRouter = Router();
queuesRouter.use(authMiddleware);

queuesRouter.get('/', (req: AuthenticatedRequest, res) => {
  const companyId = req.user!.companyId;
  const queues = db.prepare(`SELECT * FROM queues WHERE company_id = ? ORDER BY created_at ASC`).all(companyId);
  res.json(queues);
});

queuesRouter.post('/', (req: AuthenticatedRequest, res) => {
  const companyId = req.user!.companyId;
  const { name, color, greetingMessage, outOfHoursMessage } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Nome do setor/departamento é obrigatório' });
    return;
  }

  const id = `queue_${uuidv4().substring(0, 8)}`;
  db.prepare(`
    INSERT INTO queues (id, company_id, name, color, greeting_message, out_of_hours_message)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, companyId, name, color || '#10b981', greetingMessage || null, outOfHoursMessage || null);

  res.status(201).json({ id, name, color });
});

queuesRouter.put('/:id', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;
  const { name, color, greetingMessage, outOfHoursMessage, active } = req.body;

  db.prepare(`
    UPDATE queues
    SET name = COALESCE(?, name),
        color = COALESCE(?, color),
        greeting_message = COALESCE(?, greeting_message),
        out_of_hours_message = COALESCE(?, out_of_hours_message),
        active = COALESCE(?, active)
    WHERE id = ? AND company_id = ?
  `).run(name, color, greetingMessage, outOfHoursMessage, active !== undefined ? (active ? 1 : 0) : null, id, companyId);

  res.json({ success: true });
});

queuesRouter.delete('/:id', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  db.prepare(`DELETE FROM queues WHERE id = ? AND company_id = ?`).run(id, companyId);
  res.json({ success: true });
});
