import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Ticket } from '../../types';
import confetti from 'canvas-confetti';
import { ArrowLeft, ArrowRight, MessageSquare, Clock, Phone, Tag, CheckCircle2 } from 'lucide-react';

interface ColumnConfig {
  id: 'leads' | 'triagem' | 'negociacao' | 'aguardando' | 'ganho';
  title: string;
  color: string;
}

const COLUMNS: ColumnConfig[] = [
  { id: 'leads', title: 'Novos Leads', color: '#3b82f6' },
  { id: 'triagem', title: 'Em Triagem', color: '#8b5cf6' },
  { id: 'negociacao', title: 'Negociação / Proposta', color: '#f59e0b' },
  { id: 'aguardando', title: 'Aguardando Cliente', color: '#06b6d4' },
  { id: 'ganho', title: 'Fechado / Ganho', color: '#10b981' }
];

export const KanbanView: React.FC = () => {
  const { token } = useAuth();
  const { socket } = useSocket();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const fetchTickets = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/tickets?status=all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    socket.on('ticketUpdated', fetchTickets);
    socket.on('ticketCreated', fetchTickets);
    return () => {
      socket.off('ticketUpdated', fetchTickets);
      socket.off('ticketCreated', fetchTickets);
    };
  }, [socket]);

  const moveStage = async (ticketId: string, currentStage: string, direction: 'prev' | 'next') => {
    const colIds = COLUMNS.map(c => c.id);
    const currentIndex = colIds.indexOf(currentStage as any);
    if (currentIndex === -1) return;

    let targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex < 0 || targetIndex >= colIds.length) return;

    const targetStage = colIds[targetIndex];

    if (targetStage === 'ganho') {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
    }

    try {
      await fetch(`/api/tickets/${ticketId}/kanban`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ stage: targetStage })
      });
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '20px 28px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-sidebar)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Kanban CRM de Atendimento</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
            Acompanhe a evolução de cada lead e cliente nas etapas de atendimento e negociação.
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {COLUMNS.map((col, colIdx) => {
          const colTickets = tickets.filter(t => (t.kanban_stage || 'leads') === col.id);
          return (
            <div key={col.id} className="kanban-col">
              <div className="kanban-col-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: col.color }} />
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{col.title}</span>
                </div>
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)'
                }}>
                  {colTickets.length}
                </span>
              </div>

              {/* Cards list */}
              <div className="kanban-cards">
                {colTickets.length === 0 ? (
                  <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Nenhum cartão nesta etapa
                  </div>
                ) : (
                  colTickets.map(ticket => (
                    <div key={ticket.id} className="kanban-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{ticket.contact_name}</div>
                        {ticket.queue_name && (
                          <span
                            className="queue-badge"
                            style={{ backgroundColor: ticket.queue_color || '#10b981', fontSize: '0.65rem' }}
                          >
                            {ticket.queue_name}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <Phone size={13} /> {ticket.contact_phone}
                      </div>

                      <div style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-muted)',
                        background: 'rgba(0, 0, 0, 0.2)',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        marginBottom: '10px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {ticket.last_message || 'Sem mensagens recentes'}
                      </div>

                      {/* Card Tags */}
                      {ticket.contact_tags && ticket.contact_tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          {ticket.contact_tags.map((t, idx) => (
                            <span key={idx} className="tag-badge">#{t}</span>
                          ))}
                        </div>
                      )}

                      {/* Card Controls */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        paddingTop: '10px'
                      }}>
                        <button
                          disabled={colIdx === 0}
                          onClick={() => moveStage(ticket.id, col.id, 'prev')}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', opacity: colIdx === 0 ? 0.3 : 1 }}
                          title="Mover para a etapa anterior"
                        >
                          <ArrowLeft size={13} />
                        </button>

                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {ticket.user_name ? ticket.user_name.split(' ')[0] : 'Sem atendente'}
                        </span>

                        <button
                          disabled={colIdx === COLUMNS.length - 1}
                          onClick={() => moveStage(ticket.id, col.id, 'next')}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', opacity: colIdx === COLUMNS.length - 1 ? 0.3 : 1 }}
                          title="Avançar para a próxima etapa"
                        >
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
