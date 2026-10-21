import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { WhatsAppConnection } from '../../types';
import { Smartphone, QrCode, Power, Trash2, Plus, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const ConnectionsView: React.FC = () => {
  const { token } = useAuth();
  const { socket } = useSocket();
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeQrModal, setActiveQrModal] = useState<WhatsAppConnection | null>(null);
  const [qrCountdown, setQrCountdown] = useState(30);

  const fetchConnections = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/whatsapp', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConnections(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    const handleStatus = (data: any) => {
      fetchConnections();
      if (activeQrModal && data.id === activeQrModal.id) {
        if (data.status === 'QRCODE' && data.qrCodeData) {
          setActiveQrModal(prev => prev ? { ...prev, qr_code_data: data.qrCodeData, status: 'QRCODE' } : null);
        } else if (data.status === 'CONNECTED') {
          setActiveQrModal(null);
        }
      }
    };
    socket.on('whatsappStatus', handleStatus);
    return () => {
      socket.off('whatsappStatus', handleStatus);
    };
  }, [socket, activeQrModal?.id]);

  // Request QR code
  const handleRequestQr = async (conn: WhatsAppConnection) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/whatsapp/${conn.id}/qrcode`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveQrModal({ ...conn, qr_code_data: data.qrCodeData });
        setQrCountdown(30);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Simulate scanning QR Code
  const handleSimulateScan = async (connId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/whatsapp/${connId}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phoneNumber: '+55 (11) 98765-4321' })
      });
      setActiveQrModal(null);
      fetchConnections();
    } catch (err) {
      console.error(err);
    }
  };

  // Disconnect
  const handleDisconnect = async (connId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/whatsapp/${connId}/disconnect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchConnections();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete
  const handleDelete = async (connId: string) => {
    if (!token || !confirm('Deseja realmente remover esta conexão?')) return;
    try {
      await fetch(`/api/whatsapp/${connId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchConnections();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ flex: 1, padding: '28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Conexões WhatsApp</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Gerencie as linhas de WhatsApp conectadas para atendimento multiatendente simultâneo.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          <Plus size={18} /> Nova Conexão
        </button>
      </div>

      {/* Grid of Connections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {connections.map(conn => {
          const isConnected = conn.status === 'CONNECTED';
          return (
            <div
              key={conn.id}
              style={{
                backgroundColor: 'var(--bg-sidebar)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: isConnected ? '#10b981' : '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Smartphone size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{conn.name}</h3>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {conn.phone_number || 'Número não vinculado'}
                    </div>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: isConnected ? '#10b981' : '#f87171'
                }}>
                  {isConnected ? 'CONECTADO' : 'DESCONECTADO'}
                </span>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Última sincronização: {new Date(conn.updated_at).toLocaleString()}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                {!isConnected ? (
                  <button
                    onClick={() => handleRequestQr(conn)}
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <QrCode size={16} /> Conectar QR Code
                  </button>
                ) : (
                  <button
                    onClick={() => handleDisconnect(conn.id)}
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', color: '#f87171' }}
                  >
                    <Power size={16} /> Desconectar
                  </button>
                )}

                <button
                  onClick={() => handleDelete(conn.id)}
                  className="btn-icon"
                  title="Excluir Conexão"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Code Modal */}
      {activeQrModal && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Conectar WhatsApp via QR Code</h3>
              <button onClick={() => setActiveQrModal(null)} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div className="modal-body" style={{ alignItems: 'center' }}>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                Abra o WhatsApp no seu celular, vá em <b>Aparelhos Conectados &gt; Conectar um aparelho</b> e aponte a câmera:
              </p>

              {/* Real WhatsApp QR Code Image */}
              <div style={{
                margin: '20px auto',
                padding: '16px',
                background: '#ffffff',
                borderRadius: '16px',
                display: 'inline-block',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
                minWidth: '220px',
                minHeight: '220px'
              }}>
                {activeQrModal.qr_code_data && activeQrModal.qr_code_data.startsWith('data:image') ? (
                  <img
                    src={activeQrModal.qr_code_data}
                    alt="WhatsApp QR Code"
                    style={{ width: '220px', height: '220px', display: 'block', borderRadius: '8px' }}
                  />
                ) : (
                  <div style={{ width: '220px', height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#1e293b' }}>
                    <RefreshCw size={32} style={{ marginBottom: '12px', animation: 'pulse-soft 1.5s infinite' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Gerando QR Code...</span>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                O QR Code expira automaticamente a cada 30 segundos.
              </div>

              {/* Fast Simulate Scan Button */}
              <button
                onClick={() => handleSimulateScan(activeQrModal.id)}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
              >
                <CheckCircle size={16} /> Simular Leitura do QR Code
              </button>
            </div>
            <div className="modal-footer">
              <button onClick={() => setActiveQrModal(null)} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Connection Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Nova Linha de Atendimento</h3>
              <button onClick={() => setShowAddModal(false)} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const name = (form.elements.namedItem('name') as HTMLInputElement).value;

              const res = await fetch('/api/whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name })
              });
              if (res.ok) {
                setShowAddModal(false);
                fetchConnections();
              }
            }}>
              <div className="modal-body">
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Identificação do WhatsApp</label>
                  <input name="name" required placeholder="Ex: WhatsApp Vendas 02" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Criar Conexão</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
