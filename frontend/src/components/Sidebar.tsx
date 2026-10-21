import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  MessageSquare, 
  Kanban, 
  BarChart3, 
  Smartphone, 
  Layers, 
  Zap, 
  Users, 
  Building2, 
  LogOut,
  ChevronRight,
  Menu
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, pendingCount }) => {
  const { user, logout, updateStatus } = useAuth();
  const [isExpanded, setIsExpanded] = React.useState(true);

  if (!user) return null;

  const navItems = [
    { id: 'chat', label: 'Atendimento', icon: MessageSquare, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'kanban', label: 'Kanban CRM', icon: Kanban },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'whatsapp', label: 'Conexões WhatsApp', icon: Smartphone },
    { id: 'queues', label: 'Filas & URA', icon: Layers },
    { id: 'quickReplies', label: 'Respostas Rápidas', icon: Zap },
    { id: 'users', label: 'Equipe & Usuários', icon: Users },
  ];

  if (user.role === 'superadmin') {
    navItems.push({ id: 'companies', label: 'Empresas (SaaS)', icon: Building2 });
  }

  return (
    <aside className={`sidebar ${isExpanded ? 'expanded' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-logo">
        <div className="logo-badge" onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: 'pointer' }}>
          <MessageSquare size={22} />
        </div>
        {isExpanded && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="logo-text">SingleChat</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
              {user.companyPlan || 'Pro'}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentTab(item.id)}
              title={!isExpanded ? item.label : undefined}
            >
              <Icon size={20} />
              {isExpanded && <span>{item.label}</span>}
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            {user.name.substring(0, 2).toUpperCase()}
            <div className={`status-dot ${user.status}`} />
          </div>
          {isExpanded && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
                <select
                  value={user.status}
                  onChange={(e) => updateStatus(e.target.value as any)}
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    border: 'none',
                    color: user.status === 'online' ? '#10b981' : user.status === 'busy' ? '#f59e0b' : '#94a3b8'
                  }}
                >
                  <option value="online">Online</option>
                  <option value="busy">Ocupado</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className="btn-secondary"
          style={{ width: '100%', justifyContent: isExpanded ? 'flex-start' : 'center', padding: '8px' }}
          title="Sair do sistema"
        >
          <LogOut size={16} />
          {isExpanded && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};
