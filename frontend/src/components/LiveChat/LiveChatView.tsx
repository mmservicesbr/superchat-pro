import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Ticket, Message, Queue, QuickReply } from '../../types';
import confetti from 'canvas-confetti';
import { 
  Search, 
  Send, 
  Mic, 
  Paperclip, 
  Smile, 
  UserPlus, 
  CheckCheck, 
  Lock, 
  Share2, 
  CheckCircle, 
  Tag as TagIcon, 
  Clock, 
  Phone, 
  Mail, 
  FileText,
  Play,
  Square,
  Sparkles,
  Bot,
  UserCheck
} from 'lucide-react';

export const LiveChatView: React.FC = () => {
  const { user, token } = useAuth();
  const { socket } = useSocket();

  // State
  const [statusTab, setStatusTab] = useState<'open' | 'pending' | 'closed'>('open');
  const [selectedQueue, setSelectedQueue] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Aux data
  const [queues, setQueues] = useState<Queue[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  // Modals
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveRating, setResolveRating] = useState(5);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<any>(null);

  // Fetch tickets
  const fetchTickets = async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (statusTab) params.append('status', statusTab);
      if (selectedQueue !== 'all') params.append('queueId', selectedQueue);
      if (search) params.append('search', search);

      const res = await fetch(`/api/tickets?${params.toString()}`, {
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

  // Fetch queues & quick replies
  useEffect(() => {
    if (!token) return;
    fetch('/api/queues', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setQueues(data))
      .catch(console.error);

    fetch('/api/quick-replies', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setQuickReplies(data))
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    fetchTickets();
  }, [token, statusTab, selectedQueue, search]);

  // Fetch messages when ticket selected
  useEffect(() => {
    if (!selectedTicket || !token) return;

    fetch(`/api/messages/${selectedTicket.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        scrollToBottom();
      })
      .catch(console.error);

    // Join socket room
    if (socket) {
      socket.emit('joinTicket', selectedTicket.id);
    }

    return () => {
      if (socket && selectedTicket) {
        socket.emit('leaveTicket', selectedTicket.id);
      }
    };
  }, [selectedTicket?.id, token, socket]);

  // Real-time socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      if (selectedTicket && msg.ticket_id === selectedTicket.id) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      }
      fetchTickets();
    };

    const handleTicketUpdated = (data: any) => {
      fetchTickets();
      if (selectedTicket && data.ticketId === selectedTicket.id) {
        // Refresh selected ticket info
        fetch(`/api/tickets?status=all`, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.json())
          .then(all => {
            const updated = all.find((t: any) => t.id === selectedTicket.id);
            if (updated) setSelectedTicket(updated);
          });
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('ticketUpdated', handleTicketUpdated);
    socket.on('ticketCreated', fetchTickets);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('ticketUpdated', handleTicketUpdated);
      socket.off('ticketCreated', fetchTickets);
    };
  }, [socket, selectedTicket, token]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !selectedTicket || !token) return;

    const content = inputMessage.trim();
    setInputMessage('');
    setShowQuickReplies(false);

    try {
      const res = await fetch(`/api/messages/${selectedTicket.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          messageType: 'chat',
          isInternal: isInternalNote ? 1 : 0
        })
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages(prev => [...prev, newMsg]);
        setIsInternalNote(false);
        scrollToBottom();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Simulate audio recording
  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds(s => s + 1);
    }, 1000);
  };

  const cancelRecording = () => {
    setIsRecording(false);
    clearInterval(recordingTimerRef.current);
    setRecordingSeconds(0);
  };

  const finishRecording = async () => {
    if (!selectedTicket || !token) return;
    setIsRecording(false);
    clearInterval(recordingTimerRef.current);

    const seconds = recordingSeconds || 3;
    setRecordingSeconds(0);

    try {
      const res = await fetch(`/api/messages/${selectedTicket.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: `Mensagem de voz gravada (${seconds}s)`,
          messageType: 'audio',
          isInternal: 0
        })
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Simulate Customer Reply
  const simulateCustomerMessage = async () => {
    if (!selectedTicket || !token) return;
    try {
      const simulatedReplies = [
        'Perfeito! Consegue me mandar o link de pagamento?',
        'Obrigado pelo retorno rápido, vou verificar aqui.',
        'Ótimo atendimento! Já fiz o PIX agora mesmo.',
        'Qual o prazo de entrega após a confirmação?'
      ];
      const randomContent = simulatedReplies[Math.floor(Math.random() * simulatedReplies.length)];

      await fetch(`/api/messages/${selectedTicket.id}/simulate-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: randomContent })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Accept ticket
  const handleAcceptTicket = async () => {
    if (!selectedTicket || !token) return;
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/accept`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setStatusTab('open');
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Resolve ticket
  const handleResolveTicket = async () => {
    if (!selectedTicket || !token) return;
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating: resolveRating })
      });
      if (res.ok) {
        setShowResolveModal(false);
        // Confetti celebration
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        setSelectedTicket(null);
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Apply Quick Reply
  const applyQuickReply = (qr: QuickReply) => {
    let replaced = qr.message
      .replace('{nome}', selectedTicket?.contact_name || 'Cliente')
      .replace('{atendente}', user?.name || 'Atendente');
    setInputMessage(replaced);
    setShowQuickReplies(false);
  };

  return (
    <div className="chat-split-view">
      {/* COLUMN 1: Tickets List */}
      <div className="tickets-column">
        <div className="tickets-header">
          <div className="tickets-header-top">
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Atendimentos</h2>
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <UserPlus size={15} /> Novo
            </button>
          </div>

          {/* Status Tabs */}
          <div className="status-tabs">
            <button
              className={`status-tab ${statusTab === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusTab('pending')}
            >
              Aguardando
              <span className="badge">
                {tickets.filter(t => t.status === 'pending').length}
              </span>
            </button>
            <button
              className={`status-tab ${statusTab === 'open' ? 'active' : ''}`}
              onClick={() => setStatusTab('open')}
            >
              Atendendo
            </button>
            <button
              className={`status-tab ${statusTab === 'closed' ? 'active' : ''}`}
              onClick={() => setStatusTab('closed')}
            >
              Resolvidos
            </button>
          </div>

          {/* Search & Queue Filter */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar cliente, número..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '32px', width: '100%', fontSize: '0.82rem', padding: '8px 10px 8px 32px' }}
              />
            </div>
            <select
              value={selectedQueue}
              onChange={e => setSelectedQueue(e.target.value)}
              style={{ fontSize: '0.78rem', padding: '6px 8px', maxWidth: '110px' }}
            >
              <option value="all">Setor: Todos</option>
              {queues.map(q => (
                <option key={q.id} value={q.id}>{q.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tickets List Items */}
        <div className="tickets-list">
          {tickets.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Nenhum atendimento nesta fila.
            </div>
          ) : (
            tickets.map(ticket => {
              const isSelected = selectedTicket?.id === ticket.id;
              return (
                <div
                  key={ticket.id}
                  className={`ticket-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="avatar">
                    {ticket.contact_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="ticket-info">
                    <div className="ticket-top">
                      <div className="ticket-name">{ticket.contact_name}</div>
                      <div className="ticket-time">
                        {new Date(ticket.last_message_at || ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="ticket-preview">
                      {ticket.last_message || 'Iniciou uma conversa'}
                    </div>
                    <div className="ticket-tags-row">
                      {ticket.queue_name && (
                        <span
                          className="queue-badge"
                          style={{ backgroundColor: ticket.queue_color || '#10b981' }}
                        >
                          {ticket.queue_name}
                        </span>
                      )}
                      {ticket.contact_tags && ticket.contact_tags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="tag-badge">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  {ticket.unread_count > 0 && (
                    <div className="unread-badge">{ticket.unread_count}</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* COLUMN 2: Chat Area */}
      {selectedTicket ? (
        <div className="chat-column">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-user">
              <div className="avatar" style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700
              }}>
                {selectedTicket.contact_name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{selectedTicket.contact_name}</h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{selectedTicket.protocol}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: '10px' }}>
                  <span>{selectedTicket.contact_phone}</span>
                  {selectedTicket.user_name && (
                    <span>• Atendente: <b>{selectedTicket.user_name}</b></span>
                  )}
                </div>
              </div>
            </div>

            <div className="chat-header-actions">
              {/* If pending ticket, show accept button */}
              {selectedTicket.status === 'pending' && (
                <button
                  onClick={handleAcceptTicket}
                  className="btn-primary"
                  style={{ padding: '8px 14px', fontSize: '0.84rem' }}
                >
                  <UserCheck size={16} /> Assumir Atendimento
                </button>
              )}

              <button
                onClick={() => setShowTransferModal(true)}
                className="btn-secondary"
                title="Transferir para outro atendente ou setor"
              >
                <Share2 size={16} /> Transferir
              </button>

              <button
                onClick={() => setShowTagsModal(true)}
                className="btn-secondary"
                title="Gerenciar Etiquetas"
              >
                <TagIcon size={16} /> Tags
              </button>

              {selectedTicket.status !== 'closed' && (
                <button
                  onClick={() => setShowResolveModal(true)}
                  className="btn-primary"
                  style={{ background: '#059669' }}
                  title="Concluir atendimento"
                >
                  <CheckCircle size={16} /> Finalizar
                </button>
              )}
            </div>
          </div>

          {/* Messages Timeline */}
          <div className="chat-timeline">
            {messages.map(msg => {
              const isOutbound = msg.sender_type === 'agent';
              const isInternal = msg.is_internal === 1;

              return (
                <div
                  key={msg.id}
                  className={`message-wrapper ${isInternal ? 'internal' : isOutbound ? 'outbound' : 'inbound'}`}
                >
                  <div className="message-bubble">
                    {isInternal && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px', fontSize: '0.78rem' }}>
                        <Lock size={12} /> Nota Interna Privada ({msg.sender_name})
                      </div>
                    )}

                    {/* Chat Text */}
                    {msg.message_type === 'chat' && <div>{msg.content}</div>}

                    {/* Audio Player Simulator */}
                    {msg.message_type === 'audio' && (
                      <div className="audio-player-mock">
                        <button className="audio-play-btn">
                          <Play size={14} fill="#fff" />
                        </button>
                        <div className="audio-waveform">
                          {[40, 70, 30, 90, 60, 100, 45, 80, 50, 85, 30, 95, 60, 40].map((h, i) => (
                            <div key={i} className="wave-bar" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                        <span style={{ fontSize: '0.74rem', opacity: 0.8 }}>0:08</span>
                      </div>
                    )}
                  </div>

                  <div className="message-meta">
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isOutbound && !isInternal && (
                      <CheckCheck size={14} style={{ color: msg.read ? '#38bdf8' : 'var(--text-muted)' }} />
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies Dropdown Popover */}
          {showQuickReplies && (
            <div style={{
              position: 'absolute',
              bottom: '80px',
              left: '20px',
              background: 'var(--bg-sidebar)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '10px',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 100,
              width: '360px',
              maxHeight: '240px',
              overflowY: 'auto'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                Respostas Rápidas (Selecione para preencher)
              </div>
              {quickReplies.map(qr => (
                <div
                  key={qr.id}
                  onClick={() => applyQuickReply(qr)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    borderBottom: '1px solid rgba(255,255,255,0.04)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{qr.shortcut} - {qr.title}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {qr.message}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chat Footer / Input Controls */}
          <div className="chat-footer">
            <div className="chat-footer-controls">
              <button
                className={`btn-icon ${isInternalNote ? 'active' : ''}`}
                onClick={() => setIsInternalNote(!isInternalNote)}
                title="Escrever Nota Interna (somente a equipe vê)"
                style={isInternalNote ? { background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', borderColor: '#f59e0b' } : {}}
              >
                <Lock size={18} />
              </button>

              <button
                className="btn-icon"
                onClick={() => setShowQuickReplies(!showQuickReplies)}
                title="Respostas Rápidas"
              >
                <Sparkles size={18} />
              </button>

              {/* Live Test Customer Simulation Button */}
              <button
                onClick={simulateCustomerMessage}
                className="btn-secondary"
                style={{ fontSize: '0.76rem', padding: '4px 10px', marginLeft: 'auto', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.3)' }}
                title="Simular uma mensagem de resposta do cliente para testar em tempo real"
              >
                <Bot size={14} /> Simular Resposta do Cliente
              </button>
            </div>

            {/* Input Row */}
            <div className="chat-input-row">
              {isRecording ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  borderRadius: '22px',
                  padding: '8px 20px'
                }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse-soft 1s infinite' }} />
                  <span style={{ fontSize: '0.9rem', color: '#fca5a5', fontWeight: 600 }}>
                    Gravando Áudio... {recordingSeconds}s
                  </span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                    <button onClick={cancelRecording} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                      Cancelar
                    </button>
                    <button onClick={finishRecording} className="btn-primary" style={{ padding: '4px 14px', fontSize: '0.8rem' }}>
                      Enviar Áudio
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <textarea
                    rows={1}
                    className="chat-textarea"
                    placeholder={isInternalNote ? "🔒 Digite uma nota interna visível apenas para os atendentes..." : "Digite uma mensagem (ou '/' para respostas rápidas)..."}
                    value={inputMessage}
                    onChange={e => {
                      setInputMessage(e.target.value);
                      if (e.target.value === '/') setShowQuickReplies(true);
                      else if (!e.target.value.startsWith('/')) setShowQuickReplies(false);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    style={isInternalNote ? { borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.05)' } : {}}
                  />

                  <button
                    onClick={startRecording}
                    className="btn-icon"
                    title="Gravar Mensagem de Voz"
                  >
                    <Mic size={18} />
                  </button>

                  <button
                    onClick={() => handleSendMessage()}
                    className="btn-primary"
                    style={{ borderRadius: '22px', padding: '11px 18px' }}
                  >
                    <Send size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          gap: '12px'
        }}>
          <Bot size={48} style={{ opacity: 0.3 }} />
          <p style={{ fontSize: '1.05rem', fontWeight: 600 }}>Selecione uma conversa para começar a atender</p>
          <p style={{ fontSize: '0.84rem' }}>Ou clique em "Novo" para iniciar um contato direto.</p>
        </div>
      )}

      {/* Right Drawer: Contact Details */}
      {selectedTicket && (
        <div className="contact-detail-column">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Dados do Contato</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Nome Completo</label>
              <div style={{ fontSize: '0.94rem', fontWeight: 600 }}>{selectedTicket.contact_name}</div>
            </div>

            <div>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Telefone / WhatsApp</label>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} /> {selectedTicket.contact_phone}
              </div>
            </div>

            {selectedTicket.contact_email && (
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>E-mail</label>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} /> {selectedTicket.contact_email}
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Protocolo</label>
              <div style={{ fontSize: '0.86rem', color: 'var(--primary)', fontWeight: 600 }}>
                {selectedTicket.protocol}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Etiquetas</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {selectedTicket.contact_tags && selectedTicket.contact_tags.length > 0 ? (
                  selectedTicket.contact_tags.map((tag, i) => (
                    <span key={i} className="tag-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nenhuma etiqueta</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Finalizar Atendimento */}
      {showResolveModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Finalizar Atendimento</h3>
              <button onClick={() => setShowResolveModal(false)} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Deseja registrar uma nota de satisfação (CSAT) antes de encerrar o chamado de <b>{selectedTicket?.contact_name}</b>?
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', margin: '14px 0' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setResolveRating(star)}
                    style={{
                      fontSize: '1.8rem',
                      opacity: star <= resolveRating ? 1 : 0.3,
                      transition: 'transform 0.1s'
                    }}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowResolveModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleResolveTicket} className="btn-primary">Confirmar e Finalizar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Novo Atendimento */}
      {showNewTicketModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Iniciar Novo Atendimento</h3>
              <button onClick={() => setShowNewTicketModal(false)} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const name = (form.elements.namedItem('name') as HTMLInputElement).value;
              const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
              const initialMessage = (form.elements.namedItem('initialMessage') as HTMLInputElement).value;

              const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name, phone, initialMessage })
              });
              if (res.ok) {
                setShowNewTicketModal(false);
                fetchTickets();
              }
            }}>
              <div className="modal-body">
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Nome do Cliente</label>
                  <input name="name" required placeholder="Ex: Roberto Gomes" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Telefone WhatsApp</label>
                  <input name="phone" required placeholder="Ex: +55 (11) 98888-7777" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Mensagem Inicial</label>
                  <textarea name="initialMessage" rows={3} placeholder="Olá! Como posso ajudar?" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowNewTicketModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Criar Atendimento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
