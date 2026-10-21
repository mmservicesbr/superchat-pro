import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { getIO } from '../sockets/socketManager.js';
import { initWhatsAppSession, disconnectSession } from '../services/whatsappService.js';

export const whatsappRouter = Router();
whatsappRouter.use(authMiddleware);

whatsappRouter.get('/', (req: AuthenticatedRequest, res) => {
  const companyId = req.user!.companyId;
  const connections = db.prepare(`SELECT * FROM whatsapp_connections WHERE company_id = ? ORDER BY is_default DESC, created_at ASC`).all(companyId);
  res.json(connections);
});

whatsappRouter.post('/', (req: AuthenticatedRequest, res) => {
  const companyId = req.user!.companyId;
  const { name, phoneNumber } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Nome da conexão é obrigatório' });
    return;
  }

  const id = `conn_${uuidv4().substring(0, 8)}`;
  db.prepare(`
    INSERT INTO whatsapp_connections (id, company_id, name, phone_number, status, is_default)
    VALUES (?, ?, ?, ?, 'DISCONNECTED', 0)
  `).run(id, companyId, name, phoneNumber || null);

  res.status(201).json({ id, name, status: 'DISCONNECTED' });
});

// Request QR Code (Inicia a sessão Baileys real)
whatsappRouter.post('/:id/qrcode', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  try {
    // Inicia Baileys para gerar o QR code real
    await initWhatsAppSession(id, companyId);
    res.json({ id, status: 'CONNECTING', message: 'Gerando QR Code...' });
  } catch (err: any) {
    console.error('Erro ao iniciar sessão Baileys:', err);
    res.status(500).json({ error: 'Erro ao inicializar conexão do WhatsApp' });
  }
});

// Desconectar sessão Baileys
whatsappRouter.post('/:id/disconnect', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  disconnectSession(id);

  db.prepare(`
    UPDATE whatsapp_connections
    SET status = 'DISCONNECTED', qr_code_data = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND company_id = ?
  `).run(id, companyId);

  try {
    const io = getIO();
    io.to(`company_${companyId}`).emit('whatsappStatus', { id, status: 'DISCONNECTED' });
  } catch (err) {}

  res.json({ success: true, status: 'DISCONNECTED' });
});

// Deletar conexão
whatsappRouter.delete('/:id', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  disconnectSession(id);

  db.prepare(`DELETE FROM whatsapp_connections WHERE id = ? AND company_id = ?`).run(id, companyId);
  res.json({ success: true });
});
