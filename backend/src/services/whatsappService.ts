import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  proto
} from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'node:path';
import fs from 'node:fs';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { getIO } from '../sockets/socketManager.js';

interface ActiveSession {
  sock: any;
  companyId: string;
}

const activeSessions = new Map<string, ActiveSession>();

const sessionsBaseDir = path.resolve(process.cwd(), 'data', 'sessions');
if (!fs.existsSync(sessionsBaseDir)) {
  fs.mkdirSync(sessionsBaseDir, { recursive: true });
}

export async function initWhatsAppSession(connectionId: string, companyId: string) {
  // If already active, close previous
  if (activeSessions.has(connectionId)) {
    try {
      activeSessions.get(connectionId)!.sock.end(undefined);
    } catch (e) {}
    activeSessions.delete(connectionId);
  }

  const sessionFolder = path.join(sessionsBaseDir, connectionId);
  if (!fs.existsSync(sessionFolder)) {
    fs.mkdirSync(sessionFolder, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }) as any,
    printQRInTerminal: false,
    auth: state,
    browser: ['SingleChat Pro', 'Chrome', '124.0.0']
  });

  activeSessions.set(connectionId, { sock, companyId });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // QR Code emitted
    if (qr) {
      try {
        const base64Qr = await QRCode.toDataURL(qr, { margin: 2, scale: 7 });

        db.prepare(`
          UPDATE whatsapp_connections
          SET status = 'QRCODE', qr_code_data = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(base64Qr, connectionId);

        const io = getIO();
        io.to(`company_${companyId}`).emit('whatsappStatus', {
          id: connectionId,
          status: 'QRCODE',
          qrCodeData: base64Qr
        });
      } catch (err) {
        console.error('[Baileys] Error generating QR data URL:', err);
      }
    }

    // Connected successfully
    if (connection === 'open') {
      const jid = sock.user?.id || '';
      const rawNumber = jid.split(':')[0] || jid.split('@')[0];
      const formattedPhone = `+${rawNumber}`;

      db.prepare(`
        UPDATE whatsapp_connections
        SET status = 'CONNECTED', phone_number = ?, qr_code_data = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(formattedPhone, connectionId);

      try {
        const io = getIO();
        io.to(`company_${companyId}`).emit('whatsappStatus', {
          id: connectionId,
          status: 'CONNECTED',
          phoneNumber: formattedPhone
        });
      } catch (err) {}
      console.log(`[WhatsApp] Conexão ${connectionId} conectada com sucesso! Número: ${formattedPhone}`);
    }

    // Connection closed
    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (statusCode === DisconnectReason.loggedOut) {
        console.log(`[WhatsApp] Conexão ${connectionId} deslogada do aparelho.`);
        // Remove session directory
        try {
          fs.rmSync(sessionFolder, { recursive: true, force: true });
        } catch (e) {}

        db.prepare(`
          UPDATE whatsapp_connections
          SET status = 'DISCONNECTED', qr_code_data = NULL, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(connectionId);

        activeSessions.delete(connectionId);

        try {
          const io = getIO();
          io.to(`company_${companyId}`).emit('whatsappStatus', {
            id: connectionId,
            status: 'DISCONNECTED'
          });
        } catch (err) {}
      } else if (shouldReconnect) {
        console.log(`[WhatsApp] Reconectando ${connectionId}...`);
        setTimeout(() => {
          initWhatsAppSession(connectionId, companyId).catch(console.error);
        }, 3000);
      }
    }
  });

  // Listen for incoming WhatsApp messages
  sock.ev.on('messages.upsert', async ({ messages: incomingList, type }) => {
    if (type !== 'notify') return;

    for (const msg of incomingList) {
      // Ignore messages sent by self or broadcast status updates
      if (msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') continue;

      const remoteJid = msg.key.remoteJid;
      if (!remoteJid || !remoteJid.endsWith('@s.whatsapp.net')) continue;

      const rawPhone = remoteJid.replace('@s.whatsapp.net', '');
      const contactPhone = `+${rawPhone}`;
      const contactName = msg.pushName || `Cliente ${rawPhone.slice(-4)}`;

      // Extract message content
      let content = '';
      let messageType: 'chat' | 'audio' | 'image' | 'document' = 'chat';

      if (msg.message?.conversation) {
        content = msg.message.conversation;
      } else if (msg.message?.extendedTextMessage?.text) {
        content = msg.message.extendedTextMessage.text;
      } else if (msg.message?.audioMessage) {
        content = 'Mensagem de voz';
        messageType = 'audio';
      } else if (msg.message?.imageMessage) {
        content = msg.message.imageMessage.caption || 'Foto';
        messageType = 'image';
      } else if (msg.message?.documentMessage) {
        content = msg.message.documentMessage.fileName || 'Documento';
        messageType = 'document';
      }

      if (!content) continue;

      // 1. Find or create Contact
      let contact = db.prepare(`
        SELECT * FROM contacts WHERE company_id = ? AND (phone = ? OR phone LIKE ?)
      `).get(companyId, contactPhone, `%${rawPhone}%`) as any;

      if (!contact) {
        const contactId = `cont_${uuidv4().substring(0, 8)}`;
        db.prepare(`
          INSERT INTO contacts (id, company_id, name, phone, tags)
          VALUES (?, ?, ?, ?, '[]')
        `).run(contactId, companyId, contactName, contactPhone);
        contact = { id: contactId, name: contactName, phone: contactPhone, tags: '[]' };
      }

      // 2. Find active Ticket or create a new one (in pending queue)
      let ticket = db.prepare(`
        SELECT * FROM tickets 
        WHERE company_id = ? AND contact_id = ? AND status IN ('pending', 'open')
        ORDER BY updated_at DESC LIMIT 1
      `).get(companyId, contact.id) as any;

      const messageId = `msg_${uuidv4().substring(0, 8)}`;

      if (!ticket) {
        const ticketId = `tick_${uuidv4().substring(0, 8)}`;
        const protocol = `PROT-${Date.now().toString().slice(-8)}`;

        // Assign default queue if exists
        const defaultQueue = db.prepare(`SELECT id, greeting_message FROM queues WHERE company_id = ? ORDER BY created_at ASC LIMIT 1`).get(companyId) as any;

        db.prepare(`
          INSERT INTO tickets (id, company_id, contact_id, queue_id, status, kanban_stage, last_message, protocol, unread_count)
          VALUES (?, ?, ?, ?, 'pending', 'leads', ?, ?, 1)
        `).run(ticketId, companyId, contact.id, defaultQueue ? defaultQueue.id : null, content, protocol);

        ticket = { id: ticketId, company_id: companyId, contact_id: contact.id, status: 'pending', protocol };

        // Auto-reply greeting from URA if queue has one
        if (defaultQueue?.greeting_message) {
          setTimeout(async () => {
            await sendWhatsAppMessage(connectionId, contactPhone, defaultQueue.greeting_message);
          }, 1500);
        }
      } else {
        db.prepare(`
          UPDATE tickets
          SET last_message = ?, last_message_at = CURRENT_TIMESTAMP, unread_count = unread_count + 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(content, ticket.id);
      }

      // 3. Save message
      db.prepare(`
        INSERT INTO messages (id, ticket_id, sender_type, sender_name, message_type, content, read)
        VALUES (?, ?, 'contact', ?, ?, ?, 0)
      `).run(messageId, ticket.id, contactName, messageType, content);

      const savedMessage = {
        id: messageId,
        ticket_id: ticket.id,
        sender_type: 'contact',
        sender_name: contactName,
        message_type: messageType,
        content,
        read: 0,
        created_at: new Date().toISOString()
      };

      // 4. Emit to Sockets
      try {
        const io = getIO();
        io.to(`ticket_${ticket.id}`).emit('newMessage', savedMessage);
        io.to(`company_${companyId}`).emit('ticketMessageUpdate', {
          ticketId: ticket.id,
          lastMessage: content,
          updatedAt: new Date().toISOString(),
          incrementUnread: true
        });
        io.to(`company_${companyId}`).emit('ticketCreated', { ticketId: ticket.id });
      } catch (err) {}
    }
  });

  return sock;
}

export async function sendWhatsAppMessage(connectionId: string, toPhone: string, text: string) {
  const session = activeSessions.get(connectionId);
  if (!session || !session.sock) {
    // If connection not in memory, try to find default active connection
    const defaultConn = Array.from(activeSessions.values())[0];
    if (defaultConn) {
      return sendMessageWithSock(defaultConn.sock, toPhone, text);
    }
    throw new Error('Nenhuma sessão do WhatsApp ativa no momento');
  }

  return sendMessageWithSock(session.sock, toPhone, text);
}

async function sendMessageWithSock(sock: any, toPhone: string, text: string) {
  const cleanPhone = toPhone.replace(/\D/g, '');
  const jid = `${cleanPhone}@s.whatsapp.net`;
  return await sock.sendMessage(jid, { text });
}

export function disconnectSession(connectionId: string) {
  const session = activeSessions.get(connectionId);
  if (session && session.sock) {
    try {
      session.sock.logout();
    } catch (e) {}
    activeSessions.delete(connectionId);
  }
}

// Auto-reconnect all previously connected sessions on system startup
export function restoreActiveSessions() {
  const savedSessions = db.prepare(`
    SELECT id, company_id FROM whatsapp_connections
    WHERE status = 'CONNECTED'
  `).all() as { id: string; company_id: string }[];

  for (const s of savedSessions) {
    const sessionDir = path.join(sessionsBaseDir, s.id);
    if (fs.existsSync(sessionDir)) {
      console.log(`[WhatsApp] Restaurando sessão do WhatsApp ${s.id}...`);
      initWhatsAppSession(s.id, s.company_id).catch(console.error);
    }
  }
}
