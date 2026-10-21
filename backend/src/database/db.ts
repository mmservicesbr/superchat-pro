import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'singlechat.sqlite');
export const db = new DatabaseSync(dbPath);

export function initDatabase() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cnpj TEXT,
      plan TEXT DEFAULT 'Profissional',
      max_agents INTEGER DEFAULT 10,
      max_whatsapp INTEGER DEFAULT 3,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      company_id TEXT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('superadmin', 'admin', 'supervisor', 'agent')) NOT NULL DEFAULT 'agent',
      status TEXT CHECK(status IN ('online', 'offline', 'busy')) NOT NULL DEFAULT 'offline',
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS queues (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#10b981',
      greeting_message TEXT,
      out_of_hours_message TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_queues (
      user_id TEXT NOT NULL,
      queue_id TEXT NOT NULL,
      PRIMARY KEY (user_id, queue_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (queue_id) REFERENCES queues(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS whatsapp_connections (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone_number TEXT,
      status TEXT DEFAULT 'DISCONNECTED',
      qr_code_data TEXT,
      is_default INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#3b82f6',
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      avatar_url TEXT,
      tags TEXT DEFAULT '[]',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      user_id TEXT,
      queue_id TEXT,
      status TEXT CHECK(status IN ('pending', 'open', 'closed')) DEFAULT 'pending',
      kanban_stage TEXT DEFAULT 'leads',
      last_message TEXT,
      last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      unread_count INTEGER DEFAULT 0,
      protocol TEXT,
      rating INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (queue_id) REFERENCES queues(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      sender_type TEXT CHECK(sender_type IN ('contact', 'agent', 'system')) NOT NULL,
      sender_name TEXT,
      message_type TEXT CHECK(message_type IN ('chat', 'image', 'audio', 'document', 'note')) DEFAULT 'chat',
      content TEXT NOT NULL,
      media_url TEXT,
      media_name TEXT,
      is_internal INTEGER DEFAULT 0,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quick_replies (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      shortcut TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );
  `);

  seedDefaultData();
}

function seedDefaultData() {
  const check = db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number };
  if (check && check.count > 0) {
    return; // Already seeded
  }

  const salt = bcrypt.genSaltSync(10);
  const defaultPassword = bcrypt.hashSync('123456', salt);

  // 1. Create Default Company
  const companyId = 'comp_demo_1';
  db.prepare(`
    INSERT INTO companies (id, name, cnpj, plan, max_agents, max_whatsapp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(companyId, 'Empresa Matriz Demo', '12.345.678/0001-90', 'Enterprise', 20, 5);

  // 2. Create Users
  // SuperAdmin (dono da plataforma)
  db.prepare(`
    INSERT INTO users (id, company_id, name, email, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('user_superadmin', companyId, 'Super Administrador', 'admin@singlechat.com', defaultPassword, 'superadmin', 'online');

  // Atendente 1
  db.prepare(`
    INSERT INTO users (id, company_id, name, email, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('user_agent_1', companyId, 'Ana Silva (Comercial)', 'ana@singlechat.com', defaultPassword, 'agent', 'online');

  // Atendente 2
  db.prepare(`
    INSERT INTO users (id, company_id, name, email, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('user_agent_2', companyId, 'Carlos Eduardo (Suporte)', 'carlos@singlechat.com', defaultPassword, 'agent', 'online');

  // 3. Create Queues (Departamentos / URA)
  const qComercial = 'queue_comercial';
  const qSuporte = 'queue_suporte';
  const qFinanceiro = 'queue_financeiro';

  db.prepare(`
    INSERT INTO queues (id, company_id, name, color, greeting_message)
    VALUES (?, ?, ?, ?, ?)
  `).run(qComercial, companyId, 'Comercial & Vendas', '#10b981', 'Olá! Bem-vindo ao setor Comercial. Como posso ajudar com sua compra hoje?');

  db.prepare(`
    INSERT INTO queues (id, company_id, name, color, greeting_message)
    VALUES (?, ?, ?, ?, ?)
  `).run(qSuporte, companyId, 'Suporte Técnico', '#3b82f6', 'Olá! Você está no Suporte Técnico. Qual dúvida ou problema você gostaria de solucionar?');

  db.prepare(`
    INSERT INTO queues (id, company_id, name, color, greeting_message)
    VALUES (?, ?, ?, ?, ?)
  `).run(qFinanceiro, companyId, 'Financeiro', '#f59e0b', 'Olá! Setor Financeiro. Precisa de 2ª via de boleto ou nota fiscal?');

  // 4. Create Tags
  db.prepare(`INSERT INTO tags (id, company_id, name, color) VALUES (?, ?, ?, ?)`).run('tag_1', companyId, 'Lead Quente', '#ef4444');
  db.prepare(`INSERT INTO tags (id, company_id, name, color) VALUES (?, ?, ?, ?)`).run('tag_2', companyId, 'Cliente VIP', '#8b5cf6');
  db.prepare(`INSERT INTO tags (id, company_id, name, color) VALUES (?, ?, ?, ?)`).run('tag_3', companyId, 'Aguardando PIX', '#10b981');
  db.prepare(`INSERT INTO tags (id, company_id, name, color) VALUES (?, ?, ?, ?)`).run('tag_4', companyId, 'Dúvida Técnica', '#3b82f6');

  // 5. Create WhatsApp Connection (Pronta para QR Code)
  db.prepare(`
    INSERT INTO whatsapp_connections (id, company_id, name, phone_number, status, is_default)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('conn_whats_1', companyId, 'WhatsApp Principal Atendimento', '+55 (11) 98765-4321', 'CONNECTED', 1);

  // 6. Create Quick Replies
  db.prepare(`
    INSERT INTO quick_replies (id, company_id, shortcut, title, message)
    VALUES (?, ?, ?, ?, ?)
  `).run('qr_1', companyId, '/ola', 'Saudação Padrão', 'Olá {nome}, tudo bem? Sou o {atendente} da SingleChat. Como posso te auxiliar agora?');

  db.prepare(`
    INSERT INTO quick_replies (id, company_id, shortcut, title, message)
    VALUES (?, ?, ?, ?, ?)
  `).run('qr_2', companyId, '/pix', 'Dados PIX', 'Nossa chave PIX CNPJ é: 12.345.678/0001-90 (SingleChat Soluções Digitais). Após o pagamento, por favor nos envie o comprovante.');

  db.prepare(`
    INSERT INTO quick_replies (id, company_id, shortcut, title, message)
    VALUES (?, ?, ?, ?, ?)
  `).run('qr_3', companyId, '/horario', 'Horário de Atendimento', 'Nosso atendimento funciona de segunda a sexta, das 08h às 18h, e aos sábados das 09h às 13h.');

  // 7. Create Sample Contacts & Tickets & Messages
  const contact1 = 'cont_1';
  db.prepare(`
    INSERT INTO contacts (id, company_id, name, phone, email, tags)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(contact1, companyId, 'Mariana Costa', '+55 (11) 99123-4567', 'mariana@exemplo.com', JSON.stringify(['Lead Quente', 'Cliente VIP']));

  const ticket1 = 'tick_1';
  db.prepare(`
    INSERT INTO tickets (id, company_id, contact_id, user_id, queue_id, status, kanban_stage, last_message, protocol)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(ticket1, companyId, contact1, 'user_superadmin', qComercial, 'open', 'negociacao', 'Gostaria de saber se vocês têm o plano anual com desconto?', 'PROT-20261021-001');

  db.prepare(`
    INSERT INTO messages (id, ticket_id, sender_type, sender_name, message_type, content, read)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('msg_1', ticket1, 'contact', 'Mariana Costa', 'chat', 'Olá, bom dia! Vi o sistema de vocês e adorei a proposta.', 1);

  db.prepare(`
    INSERT INTO messages (id, ticket_id, sender_type, sender_name, message_type, content, read)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('msg_2', ticket1, 'agent', 'Super Administrador', 'chat', 'Bom dia Mariana! Tudo bem? Fico muito feliz pelo seu interesse.', 1);

  db.prepare(`
    INSERT INTO messages (id, ticket_id, sender_type, sender_name, message_type, content, read)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('msg_3', ticket1, 'contact', 'Mariana Costa', 'chat', 'Gostaria de saber se vocês têm o plano anual com desconto?', 1);

  // Sample Pending Ticket (Fila de Espera)
  const contact2 = 'cont_2';
  db.prepare(`
    INSERT INTO contacts (id, company_id, name, phone, email, tags)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(contact2, companyId, 'Lucas Mendonça', '+55 (21) 98877-6655', 'lucas@empresa.com.br', JSON.stringify(['Aguardando PIX']));

  const ticket2 = 'tick_2';
  db.prepare(`
    INSERT INTO tickets (id, company_id, contact_id, user_id, queue_id, status, kanban_stage, last_message, protocol, unread_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(ticket2, companyId, contact2, null, qSuporte, 'pending', 'triagem', 'Meu boleto não gerou o código de barras, consegue me mandar por aqui?', 'PROT-20261021-002', 1);

  db.prepare(`
    INSERT INTO messages (id, ticket_id, sender_type, sender_name, message_type, content, read)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('msg_4', ticket2, 'contact', 'Lucas Mendonça', 'chat', 'Meu boleto não gerou o código de barras, consegue me mandar por aqui?', 0);

  // Sample Closed Ticket
  const contact3 = 'cont_3';
  db.prepare(`
    INSERT INTO contacts (id, company_id, name, phone, email, tags)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(contact3, companyId, 'Fernanda Alencar', '+55 (31) 97766-5544', 'fernanda@alencar.adv.br', JSON.stringify(['Dúvida Técnica']));

  const ticket3 = 'tick_3';
  db.prepare(`
    INSERT INTO tickets (id, company_id, contact_id, user_id, queue_id, status, kanban_stage, last_message, protocol, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(ticket3, companyId, contact3, 'user_agent_2', qSuporte, 'closed', 'ganho', 'Muito obrigada, atendimento nota 10!', 'PROT-20261021-003', 5);

  db.prepare(`
    INSERT INTO messages (id, ticket_id, sender_type, sender_name, message_type, content, read)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('msg_5', ticket3, 'contact', 'Fernanda Alencar', 'chat', 'Muito obrigada, atendimento nota 10!', 1);
}
