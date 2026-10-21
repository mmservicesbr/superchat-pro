import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import { LoginView } from './components/Auth/LoginView';
import { Sidebar } from './components/Sidebar';
import { LiveChatView } from './components/LiveChat/LiveChatView';
import { KanbanView } from './components/Kanban/KanbanView';
import { DashboardView } from './components/Dashboard/DashboardView';
import { ConnectionsView } from './components/Connections/ConnectionsView';
import { QueuesView } from './components/Queues/QueuesView';
import { QuickRepliesView } from './components/QuickReplies/QuickRepliesView';
import { UsersView } from './components/Users/UsersView';
import { CompaniesView } from './components/Companies/CompaniesView';

export const App: React.FC = () => {
  const { user, token, isLoading } = useAuth();
  const { socket } = useSocket();
  const [currentTab, setCurrentTab] = useState<string>('chat');
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Fetch pending tickets count for the badge
  const updatePendingCount = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/tickets?status=pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingCount(data.length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    updatePendingCount();
  }, [token, currentTab]);

  useEffect(() => {
    if (!socket) return;
    socket.on('ticketCreated', updatePendingCount);
    socket.on('ticketUpdated', updatePendingCount);
    return () => {
      socket.off('ticketCreated', updatePendingCount);
      socket.off('ticketUpdated', updatePendingCount);
    };
  }, [socket]);

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-sans)'
      }}>
        Inicializando SingleChat Pro...
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        pendingCount={pendingCount}
      />
      <main className="main-view">
        {currentTab === 'chat' && <LiveChatView />}
        {currentTab === 'kanban' && <KanbanView />}
        {currentTab === 'dashboard' && <DashboardView />}
        {currentTab === 'whatsapp' && <ConnectionsView />}
        {currentTab === 'queues' && <QueuesView />}
        {currentTab === 'quickReplies' && <QuickRepliesView />}
        {currentTab === 'users' && <UsersView />}
        {currentTab === 'companies' && <CompaniesView />}
      </main>
    </div>
  );
};
