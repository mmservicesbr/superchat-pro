import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DashboardStats } from '../../types';
import { 
  BarChart3, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Smile, 
  Smartphone, 
  TrendingUp, 
  Users,
  Award
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, [token]);

  if (!stats) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Carregando métricas...
      </div>
    );
  }

  return (
    <div className="dashboard-view">
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Métricas & Relatórios de Atendimento</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Indicadores de desempenho operacional, tempo de resposta e produtividade da equipe em tempo real.
        </p>
      </div>

      {/* Stats KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <MessageSquare size={26} />
          </div>
          <div>
            <div className="stat-val">{stats.totalTickets}</div>
            <div className="stat-lbl">Total de Atendimentos</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <Clock size={26} />
          </div>
          <div>
            <div className="stat-val">{stats.pendingTickets}</div>
            <div className="stat-lbl">Aguardando na Fila</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <CheckCircle size={26} />
          </div>
          <div>
            <div className="stat-val">{stats.closedTickets}</div>
            <div className="stat-lbl">Finalizados com Sucesso</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Smile size={26} />
          </div>
          <div>
            <div className="stat-val">{stats.satisfactionScore} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 5.0</span></div>
            <div className="stat-lbl">Satisfação Média (CSAT)</div>
          </div>
        </div>
      </div>

      {/* Operational Speed Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
        <div style={{
          backgroundColor: 'var(--bg-sidebar)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
            Tempo Médio de Espera (TME)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
            {stats.avgWaitTime}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Tempo médio até o cliente ser atendido por um humano
          </p>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-sidebar)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
            Tempo Médio de Atendimento (TMA)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6' }}>
            {stats.avgServiceTime}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Duração média das conversas até o encerramento do protocolo
          </p>
        </div>
      </div>

      {/* Two Column Section: Queues distribution & Agent Ranking */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Workload by Queue */}
        <div style={{
          backgroundColor: 'var(--bg-sidebar)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px'
        }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>
            Distribuição por Departamento
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {stats.byQueue.map((q, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600 }}>{q.name}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{q.count} chamados</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-card)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${stats.totalTickets > 0 ? (q.count / stats.totalTickets) * 100 : 0}%`,
                    height: '100%',
                    backgroundColor: q.color || '#10b981',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Agents */}
        <div style={{
          backgroundColor: 'var(--bg-sidebar)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px'
        }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="#f59e0b" /> Ranking de Atendentes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats.byAgent.map((agent, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 800, color: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : 'var(--text-muted)', width: '18px' }}>
                    #{idx + 1}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{agent.name}</span>
                </div>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  backgroundColor: 'var(--primary-light)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)'
                }}>
                  {agent.count} atendimentos
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
