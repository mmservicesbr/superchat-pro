import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

export const quickRepliesRouter = Router();
quickRepliesRouter.use(authMiddleware);

quickRepliesRouter.get('/', (req: AuthenticatedRequest, res) => {
  const companyId = req.user!.companyId;
  const replies = db.prepare(`SELECT * FROM quick_replies WHERE company_id = ? ORDER BY shortcut ASC`).all(companyId);
  res.json(replies);
});

quickRepliesRouter.post('/', (req: AuthenticatedRequest, res) => {
  const companyId = req.user!.companyId;
  const { shortcut, title, message } = req.body;

  if (!shortcut || !title || !message) {
    res.status(400).json({ error: 'Atalho, título e mensagem são obrigatórios' });
    return;
  }

  const id = `qr_${uuidv4().substring(0, 8)}`;
  db.prepare(`
    INSERT INTO quick_replies (id, company_id, shortcut, title, message)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, companyId, shortcut.startsWith('/') ? shortcut : `/${shortcut}`, title, message);

  res.status(201).json({ id, shortcut, title, message });
});

quickRepliesRouter.delete('/:id', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  db.prepare(`DELETE FROM quick_replies WHERE id = ? AND company_id = ?`).run(id, companyId);
  res.json({ success: true });
});
