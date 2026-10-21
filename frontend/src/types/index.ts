export interface User {
  id: string;
  companyId: string;
  companyName?: string;
  companyPlan?: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'supervisor' | 'agent';
  status: 'online' | 'offline' | 'busy';
  avatarUrl?: string;
}

export interface Ticket {
  id: string;
  company_id: string;
  contact_id: string;
  user_id: string | null;
  queue_id: string | null;
  status: 'pending' | 'open' | 'closed';
  kanban_stage: 'leads' | 'triagem' | 'negociacao' | 'aguardando' | 'ganho' | 'perdido';
  last_message: string | null;
  last_message_at: string;
  unread_count: number;
  protocol: string;
  rating?: number;
  created_at: string;
  updated_at: string;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  contact_avatar?: string;
  contact_tags: string[];
  contact_notes?: string;
  user_name?: string;
  user_email?: string;
  queue_name?: string;
  queue_color?: string;
}

export interface Message {
  id: string;
  ticket_id: string;
  sender_type: 'contact' | 'agent' | 'system';
  sender_name?: string;
  message_type: 'chat' | 'image' | 'audio' | 'document' | 'note';
  content: string;
  media_url?: string;
  media_name?: string;
  is_internal: number;
  read: number;
  created_at: string;
}

export interface Queue {
  id: string;
  company_id: string;
  name: string;
  color: string;
  greeting_message?: string;
  out_of_hours_message?: string;
  active: number;
  created_at: string;
}

export interface WhatsAppConnection {
  id: string;
  company_id: string;
  name: string;
  phone_number?: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'QRCODE';
  qr_code_data?: string;
  is_default: number;
  updated_at: string;
  created_at: string;
}

export interface QuickReply {
  id: string;
  company_id: string;
  shortcut: string;
  title: string;
  message: string;
}

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  plan: string;
  max_agents: number;
  max_whatsapp: number;
  active: number;
  users_count?: number;
  tickets_count?: number;
  whatsapp_count?: number;
  created_at: string;
}

export interface DashboardStats {
  pendingTickets: number;
  openTickets: number;
  closedTickets: number;
  totalTickets: number;
  avgWaitTime: string;
  avgServiceTime: string;
  satisfactionScore: string;
  byQueue: { name: string; color: string; count: number }[];
  byAgent: { name: string; avatar_url?: string; count: number }[];
  whatsapp: { total: number; connected: number };
}
