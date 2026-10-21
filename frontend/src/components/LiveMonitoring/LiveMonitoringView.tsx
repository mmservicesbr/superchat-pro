import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { 
  Radio, 
  Users, 
  Clock, 
  MessageSquare, 
  Eye, 
  Share2, 
  PhoneCall, 
  ShieldAlert, 
  Send, 
  Sparkles,
  Bot
} from 'lucide-react';

export const LiveMonitoringView: React.FC = () => {
  const { token, user } = useAuth();
  const { socket } = useSocket();
  const [data, setData] = useState<any>(null);
  const [activeSpyTicket, setActiveSpyTicket] = useState<any>(null);
  const [spyMessages, setSpyMessages] = useState<any[]>([]);
  const [whisperText, setWhisperText] = useState('');
  const [showWhisperModal, setShowWhisperModal] = useState<any>(null);

  const fetchOverview = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/live-monitoring/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 5000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    socket.on('ticketCreated', fetchOverview);
    socket.on('ticketUpdated', fetchOverview);
    socket.on('newMessage', () => {
      fetchOverview();
      if (activeSpyTicket) {
        fetch(`/api/messages/${activeSpyTicket.id}`, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.json())
          .then(msgs => setSpyMessages(msgs));
      }
    });
    return () => {
      socket.off('ticketCreated', fetchOverview);
      socket.off('ticketUpdated', fetchOverview);
    };
  }, [socket, activeSpyTicket?.id]);

  // Open Spy Chat
  const openSpy = async (ticket: any) => {
    setActiveSpyTicket(ticket);
    const res = await fetch(`/api/messages/${ticket.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const msgs = await res.json();
      setSpyMessages(msgs);
    }
  };

  // Supervisor takes over
  const handleTakeover = async (ticketId: string) => {
    if (!confirm('Deseja assumir o controle deste atendimento?')) return;
    try {
      await fetch(`/api/live-monitoring/takeover/${ticketId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveSpyTicket(null);
      fetchOverview();
    } catch (err) {
      console.error(err);
    }
  };

  // Send Whisper
  const handleSendWhisper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whisperText.trim() || !showWhisperModal) return;
    try {
      await fetch(`/api/live-monitoring/whisper/${showWhisperModal.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: whisperText.trim() })
      });
      setWhisperText('');
      setShowWhisperModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (!data) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Carregando painel Ao Vivo...
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: '26px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '22px', backgroundColor: '#0b0f19' }}>
      
      {/* Title & Live Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse-soft 1s infinite' }} />
              Supervisão Ao Vivo
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>Monitoramento de Atendimentos</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '4px' }}>
            Espie conversas em tempo real, envie sussurros privados para orientar seus atendentes ou assuma chamados críticos.
          </p>
        </div>

        {/* Live Counters */}
        <div style={{ display: 'flex', gap: '14px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '8px 16px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Atendentes Online</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981' }}>{data.liveStats.onlineAgents}</div>
          </div>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '8px 16px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Em Atendimento</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#3b82f6' }}>{data.liveStats.inServiceCount}</div>
          </div>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '8px 16px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Aguardando Fila</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b' }}>{data.liveStats.waitingCount}</div>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Left Column: Fila de Espera (Aguardando) */}
        <div style={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
              <Clock size={18} /> Fila de Espera ({data.waitingTickets.length})
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Aguardando primeiro contato</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '460px', overflowY: 'auto' }}>
            {data.waitingTickets.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                ✅ Nenhum cliente na fila de espera no momento.
              </div>
            ) : (
              data.waitingTickets.map((t: any) => (
                <div
                  key={t.id}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>{t.contact_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t.contact_phone}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--primary)', marginTop: '2px' }}>
                      Setor: <b>{t.queue_name || 'Geral'}</b>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleTakeover(t.id)}
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      Puxar Chamado
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Em Atendimento (Ao Vivo) */}
        <div style={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
              <Radio size={18} /> Conversas Ativas ({data.inServiceTickets.length})
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Supervisionar operadores</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '460px', overflowY: 'auto' }}>
            {data.inServiceTickets.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                Nenhum atendimento em andamento no momento.
              </div>
            ) : (
              data.inServiceTickets.map((t: any) => (
                <div
                  key={t.id}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.94rem' }}>{t.contact_name}</span>
                      <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px' }}>
                        Atendente: {t.agent_name || 'Desconhecido'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Última msg: <i>"{t.last_message || '...'}"</i>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openSpy(t)}
                      className="btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                      title="Espiar conversa em tempo real"
                    >
                      <Eye size={14} /> Espiar
                    </button>
                    <button
                      onClick={() => setShowWhisperModal(t)}
                      className="btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '0.78rem', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                      title="Enviar sussurro confidencial ao atendente"
                    >
                      🤫 Sussurrar
                    </button>
                    <button
                      onClick={() => handleTakeover(t.id)}
                      className="btn-primary"
                      style={{ padding: '6px 10px', fontSize: '0.78rem', background: '#dc2626' }}
                      title="Assumir o controle da conversa"
                    >
                      Intervir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* MODAL: Espiar Conversa (Spy View) */}
      {activeSpyTicket && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Eye size={20} color="#10b981" />
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Modo Espião: {activeSpyTicket.contact_name}</h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Atendente responsável: <b>{activeSpyTicket.agent_name}</b> (O cliente não sabe que você está assistindo)
                  </div>
                </div>
              </div>
              <button onClick={() => setActiveSpyTicket(null)} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
            
            <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {spyMessages.map(m => (
                <div key={m.id} style={{
                  marginBottom: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.sender_type === 'agent' ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    backgroundColor: m.is_internal ? 'rgba(245, 158, 11, 0.15)' : m.sender_type === 'agent' ? '#047857' : '#1e293b',
                    color: '#fff',
                    maxWidth: '80%'
                  }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '2px' }}>{m.sender_name}</div>
                    <div>{m.content}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button
                onClick={() => handleTakeover(activeSpyTicket.id)}
                className="btn-primary"
                style={{ background: '#dc2626' }}
              >
                Assumir Atendimento Agora
              </button>
              <button onClick={() => setActiveSpyTicket(null)} className="btn-secondary">
                Fechar Espião
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Sussurrar ao Atendente */}
      {showWhisperModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>🤫 Enviar Sussurro de Supervisão</h3>
              <button onClick={() => setShowWhisperModal(null)} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleSendWhisper}>
              <div className="modal-body">
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  O sussurro aparece apenas para o atendente <b>{showWhisperModal.agent_name}</b> na tela de chat dele, com um alerta amarelo discreto. O cliente <b>{showWhisperModal.contact_name}</b> não vê.
                </p>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Instrução confidencial</label>
                  <textarea
                    rows={3}
                    required
                    value={whisperText}
                    onChange={e => setWhisperText(e.target.value)}
                    placeholder="Ex: Ofereça 10% de desconto no plano anual ou feche em 3x sem juros..."
                    style={{ width: '100%', borderColor: '#f59e0b' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowWhisperModal(null)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary" style={{ background: '#f59e0b', color: '#000' }}>Enviar Sussurro</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
