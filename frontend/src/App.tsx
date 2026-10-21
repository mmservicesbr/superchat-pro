import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import { LoginView } from './components/Auth/LoginView';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { LiveChatView } from './components/LiveChat/LiveChatView';
import { KanbanView } from './components/Kanban/KanbanView';
import { DashboardView } from './components/Dashboard/DashboardView';
import { LiveMonitoringView } from './components/LiveMonitoring/LiveMonitoringView';
import { PipelineReportView } from './components/Reports/PipelineReportView';
import { ConnectionsView } from './components/Connections/ConnectionsView';
import { QueuesView } from './components/Queues/QueuesView';
import { QuickRepliesView } from './components/QuickReplies/QuickRepliesView';
import { UsersView } from './components/Users/UsersView';
import { CompaniesView } from './components/Companies/CompaniesView';

const getTabFromHash = (): string => {
  const hash = window.location.hash;
  if (hash.includes('home-dashboard')) return 'dashboard';
  if (hash.includes('tickets') || hash.includes('chat')) return 'chat';
  if (hash.includes('ao-vivo')) return 'ao-vivo';
  if (hash.includes('kanban')) return 'kanban';
  if (hash.includes('reports') || hash.includes('pipeline-steps-work')) return 'reports';
  if (hash.includes('connections') || hash.includes('whatsapp')) return 'whatsapp';
  if (hash.includes('departments') || hash.includes('queues')) return 'queues';
  if (hash.includes('tasks') || hash.includes('quickReplies')) return 'quickReplies';
  if (hash.includes('users') || hash.includes('settings')) return 'users';
  if (hash.includes('companies')) return 'companies';
  return 'dashboard';
};

export const App: React.FC = () => {
  const { user, token, isLoading } = useAuth();
  const { socket } = useSocket();
  const [currentTab, setCurrentTab] = useState<string>(getTabFromHash);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);

  // Sync state with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentTab(getTabFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when tab changes
  const handleTabChange = (newTab: string) => {
    setCurrentTab(newTab);
    const hashes: Record<string, string> = {
      dashboard: '#/home-dashboard',
      chat: '#/tickets',
      'ao-vivo': '#/ao-vivo',
      kanban: '#/kanban',
      reports: '#/reports/pipeline-steps-work',
      whatsapp: '#/connections',
      queues: '#/departments',
      quickReplies: '#/tasks',
      users: '#/users',
      companies: '#/companies'
    };
    if (hashes[newTab]) {
      window.location.hash = hashes[newTab];
    }
  };

  // Fetch pending tickets count for the top bar and sidebar badges
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
        backgroundColor: '#0f172a',
        color: '#94a3b8',
        fontFamily: 'var(--font-sans)',
        fontSize: '1rem',
        fontWeight: 600
      }}>
        Inicializando SingleChat...
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      {/* SingleChat Top Navigation Bar */}
      <TopBar
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        pendingCount={pendingCount}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
      />

      {/* Main Container: Sidebar + Content */}
      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={handleTabChange}
          pendingCount={pendingCount}
          isExpanded={isSidebarExpanded}
          setIsExpanded={setIsSidebarExpanded}
        />

        <main style={{ flex: 1, display: 'flex', height: '100%', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
          {currentTab === 'dashboard' && <DashboardView />}
          {currentTab === 'chat' && <LiveChatView />}
          {currentTab === 'ao-vivo' && <LiveMonitoringView />}
          {currentTab === 'kanban' && <KanbanView />}
          {currentTab === 'reports' && <PipelineReportView />}
          {currentTab === 'whatsapp' && <ConnectionsView />}
          {currentTab === 'queues' && <QueuesView />}
          {currentTab === 'quickReplies' && <QuickRepliesView />}
          {currentTab === 'users' && <UsersView />}
          {currentTab === 'companies' && <CompaniesView />}
        </main>
      </div>
    </div>
  );
};
