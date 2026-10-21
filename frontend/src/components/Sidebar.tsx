import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutGrid, 
  MessageSquare, 
  Search, 
  Radio, 
  Contact, 
  Users, 
  Briefcase, 
  CheckSquare, 
  Send, 
  Bot, 
  BarChart3, 
  Smartphone, 
  Settings,
  ChevronRight,
  ChevronLeft,
  Building2,
  Kanban
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingCount: number;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean | ((prev: boolean) => boolean)) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  setCurrentTab, 
  pendingCount,
  isExpanded,
  setIsExpanded
}) => {
  const { user } = useAuth();

  if (!user) return null;

  // Exact 13 items in order from SingleChat screenshot
  const navItems = [
    { id: 'dashboard', hash: '#/home-dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'chat', hash: '#/tickets', label: 'Atendimentos', icon: MessageSquare, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'kanban', hash: '#/kanban', label: 'Kanban CRM', icon: Kanban },
    { id: 'ao-vivo', hash: '#/ao-vivo', label: 'Ao Vivo', icon: Radio, isLive: true },
    { id: 'reports', hash: '#/reports/pipeline-steps-work', label: 'Funil & Vendas', icon: BarChart3 },
    { id: 'users', hash: '#/users', label: 'Equipe & Usuários', icon: Users },
    { id: 'queues', hash: '#/departments', label: 'Departamentos', icon: Briefcase },
    { id: 'quickReplies', hash: '#/tasks', label: 'Respostas & Tarefas', icon: CheckSquare },
    { id: 'whatsapp', hash: '#/connections', label: 'Conexões WhatsApp', icon: Smartphone },
  ];

  if (user.role === 'superadmin') {
    navItems.push({ id: 'companies', hash: '#/companies', label: 'Empresas (SaaS)', icon: Building2 });
  }

  const handleNavClick = (item: any) => {
    setCurrentTab(item.id);
    if (item.hash) {
      window.location.hash = item.hash;
    }
  };

  return (
    <aside style={{
      width: isExpanded ? '210px' : '60px',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '8px 0',
      transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 50,
      userSelect: 'none',
      flexShrink: 0
    }}>
      {/* Navigation Rail */}
      <nav style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: isExpanded ? '0 8px' : '0 6px',
        overflowY: 'auto'
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              title={!isExpanded ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: isExpanded ? '9px 12px' : '9px',
                justifyContent: isExpanded ? 'flex-start' : 'center',
                borderRadius: '8px',
                backgroundColor: isActive ? '#f0f9ff' : 'transparent',
                color: isActive ? '#0284c7' : '#64748b',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.84rem',
                position: 'relative',
                transition: 'all 0.15s ease',
                border: 'none',
                cursor: 'pointer',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.color = '#0f172a';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                }
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={19} strokeWidth={isActive ? 2.3 : 1.7} />
                {item.isLive && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444'
                  }} />
                )}
              </div>

              {isExpanded && (
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, textAlign: 'left' }}>
                  {item.label}
                </span>
              )}

              {item.badge && (
                <span style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  marginLeft: 'auto'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Row: Settings & Sidebar Collapse Toggle Arrow (Screenshot 1 & 5) */}
      <div style={{
        padding: isExpanded ? '8px 8px 4px 8px' : '8px 6px 4px 6px',
        borderTop: '1px solid #f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <button
          onClick={() => { setCurrentTab('users'); window.location.hash = '#/settings'; }}
          title={!isExpanded ? 'Configurações' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: isExpanded ? '9px 12px' : '9px',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            borderRadius: '8px',
            color: '#64748b',
            fontSize: '0.84rem',
            border: 'none',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          <Settings size={19} strokeWidth={1.7} />
          {isExpanded && <span>Configurações</span>}
        </button>

        {/* The collapse/expand circle arrow visible at the bottom of screenshot 1, 2, 3, 5 */}
        <button
          onClick={() => setIsExpanded(prev => !prev)}
          title={isExpanded ? 'Recolher menu' : 'Expandir menu'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: '50%',
            color: '#0284c7',
            backgroundColor: '#f0f9ff',
            border: '1px solid #e0f2fe',
            cursor: 'pointer',
            margin: '6px auto 2px auto',
            width: '28px',
            height: '28px'
          }}
        >
          {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
    </aside>
  );
};
