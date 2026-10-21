import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, 
  MessageSquare, 
  Calendar, 
  Bell, 
  Play, 
  Pause, 
  ChevronDown, 
  LogOut, 
  User, 
  ShieldCheck 
} from 'lucide-react';

interface TopBarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingCount: number;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean | ((prev: boolean) => boolean)) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  setCurrentTab,
  pendingCount,
  isSidebarExpanded,
  setIsSidebarExpanded
}) => {
  const { user, logout, updateStatus } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  if (!user) return null;

  const handleTogglePause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    updateStatus(nextPaused ? 'busy' : 'online');
  };

  return (
    <header style={{
      height: '56px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      zIndex: 60,
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
    }}>
      {/* Left side: Hamburger & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={() => setIsSidebarExpanded(prev => !prev)}
          style={{
            padding: '6px',
            borderRadius: '6px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #f1f5f9'
          }}
          title="Alternar Menu"
        >
          <Menu size={20} />
        </button>

        <div 
          onClick={() => setCurrentTab('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '1rem',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
          }}>
            SC
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Single<span style={{ color: '#0284c7' }}>Chat</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Action Pill, Flag, Icons & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        
        {/* Blue Atendimentos Pill Button (SingleChat Primary Quick Action) */}
        <button
          onClick={() => setCurrentTab('chat')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: currentTab === 'chat' ? '#0284c7' : '#f0f9ff',
            color: currentTab === 'chat' ? '#ffffff' : '#0284c7',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '0.84rem',
            fontWeight: 700,
            transition: 'all 0.2s ease',
            boxShadow: currentTab === 'chat' ? '0 2px 6px rgba(2, 132, 199, 0.3)' : 'none'
          }}
        >
          <MessageSquare size={16} />
          <span>Atendimentos</span>
          {pendingCount > 0 && (
            <span style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: '9999px',
              marginLeft: '2px'
            }}>
              {pendingCount}
            </span>
          )}
        </button>

        {/* Brazil Flag */}
        <div 
          style={{ fontSize: '1.25rem', cursor: 'pointer', padding: '2px 4px', borderRadius: '4px' }}
          title="Idioma: Português (Brasil)"
        >
          🇧🇷
        </div>

        {/* Internal Chat / Messages icon */}
        <button
          onClick={() => setCurrentTab('chat')}
          style={{ color: '#64748b', padding: '6px', borderRadius: '6px' }}
          title="Mensagens internas"
        >
          <MessageSquare size={18} />
        </button>

        {/* Calendar / Schedule icon */}
        <button
          onClick={() => setCurrentTab('kanban')}
          style={{ color: '#64748b', padding: '6px', borderRadius: '6px' }}
          title="Agenda e Compromissos"
        >
          <Calendar size={18} />
        </button>

        {/* Notification Bell */}
        <button
          style={{ color: '#64748b', padding: '6px', borderRadius: '6px', position: 'relative' }}
          title="Notificações do Sistema"
        >
          <Bell size={18} />
          {pendingCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              backgroundColor: '#ef4444',
              borderRadius: '50%'
            }} />
          )}
        </button>

        {/* Play / Pause Agent Status Button */}
        <button
          onClick={handleTogglePause}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: isPaused ? '#fef2f2' : '#f0fdf4',
            color: isPaused ? '#dc2626' : '#16a34a',
            border: isPaused ? '1px solid #fecaca' : '1px solid #bbf7d0'
          }}
          title={isPaused ? 'Você está em Pausa (Clique para ficar Online)' : 'Você está Online (Clique para Pausar)'}
        >
          {isPaused ? <Play size={14} fill="#dc2626" /> : <Pause size={14} fill="#16a34a" />}
        </button>

        {/* Vertical divider */}
        <div style={{ height: '24px', width: '1px', backgroundColor: '#e2e8f0' }} />

        {/* User Profile dropdown */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '8px',
              transition: 'background-color 0.2s'
            }}
          >
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: '#e2e8f0',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                {user.name.substring(0, 2).toUpperCase()}
              </div>
              <span style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                backgroundColor: isPaused ? '#f59e0b' : '#10b981',
                border: '2px solid #ffffff'
              }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: '70px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>
                {user.name}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'lowercase', marginTop: '2px' }}>
                {user.role}
              </span>
            </div>

            <ChevronDown size={14} color="#94a3b8" />
          </div>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div style={{
              position: 'absolute',
              top: '46px',
              right: 0,
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '6px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              width: '180px',
              zIndex: 100
            }}>
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', fontSize: '0.78rem', color: '#64748b' }}>
                Conectado como <b style={{ color: '#0f172a' }}>{user.email}</b>
              </div>
              
              <button
                onClick={() => { updateStatus('online'); setIsPaused(false); setShowUserMenu(false); }}
                style={{ width: '100%', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#16a34a' }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                Online
              </button>

              <button
                onClick={() => { updateStatus('busy'); setIsPaused(true); setShowUserMenu(false); }}
                style={{ width: '100%', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#d97706' }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d97706' }} />
                Pausa / Ocupado
              </button>

              <button
                onClick={() => { updateStatus('offline'); setIsPaused(true); setShowUserMenu(false); }}
                style={{ width: '100%', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#94a3b8' }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#94a3b8' }} />
                Offline
              </button>

              <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }} />

              <button
                onClick={logout}
                style={{ width: '100%', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#dc2626' }}
              >
                <LogOut size={14} /> Sair do Sistema
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
