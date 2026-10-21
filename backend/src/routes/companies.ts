import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

export const companiesRouter = Router();
companiesRouter.use(authMiddleware);

// Only superadmin can manage companies
companiesRouter.get('/', (req: AuthenticatedRequest, res) => {
  if (req.user!.role !== 'superadmin') {
    res.status(403).json({ error: 'Acesso restrito ao Super Administrador' });
    return;
  }

  const companies = db.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id) as users_count,
      (SELECT COUNT(*) FROM tickets t WHERE t.company_id = c.id) as tickets_count,
      (SELECT COUNT(*) FROM whatsapp_connections w WHERE w.company_id = c.id) as whatsapp_count
    FROM companies c
    ORDER BY c.created_at DESC
  `).all();

  res.json(companies);
});

companiesRouter.post('/', (req: AuthenticatedRequest, res) => {
  if (req.user!.role !== 'superadmin') {
    res.status(403).json({ error: 'Acesso restrito ao Super Administrador' });
    return;
  }

  const { name, cnpj, plan = 'Profissional', maxAgents = 10, maxWhatsapp = 3 } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Nome da empresa é obrigatório' });
    return;
  }

  const id = `comp_${uuidv4().substring(0, 8)}`;
  db.prepare(`
    INSERT INTO companies (id, name, cnpj, plan, max_agents, max_whatsapp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, cnpj || null, plan, maxAgents, maxWhatsapp);

  res.status(201).json({ id, name, plan, maxAgents, maxWhatsapp });
});

companiesRouter.put('/:id', (req: AuthenticatedRequest, res) => {
  if (req.user!.role !== 'superadmin') {
    res.status(403).json({ error: 'Acesso restrito ao Super Administrador' });
    return;
  }

  const { id } = req.params;
  const { name, cnpj, plan, maxAgents, maxWhatsapp, active } = req.body;

  db.prepare(`
    UPDATE companies
    SET name = COALESCE(?, name),
        cnpj = COALESCE(?, cnpj),
        plan = COALESCE(?, plan),
        max_agents = COALESCE(?, max_agents),
        max_whatsapp = COALESCE(?, max_whatsapp),
        active = COALESCE(?, active)
    WHERE id = ?
  `).run(name, cnpj, plan, maxAgents, maxWhatsapp, active !== undefined ? (active ? 1 : 0) : null, id);

  res.json({ success: true });
});
