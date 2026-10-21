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
    socket.on('whatsappStatus', fetchConnections);
    return () => {
      socket.off('whatsappStatus', fetchConnections);
    };
  }, [socket]);

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

              {/* High Tech QR Graphic */}
              <div style={{
                margin: '20px auto',
                padding: '16px',
                background: '#ffffff',
                borderRadius: '16px',
                display: 'inline-block',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
              }}>
                <svg width="200" height="200" viewBox="0 0 200 200">
                  {/* Outer corner anchors */}
                  <rect x="10" y="10" width="50" height="50" fill="#000" rx="8" />
                  <rect x="20" y="20" width="30" height="30" fill="#fff" rx="4" />
                  <rect x="27" y="27" width="16" height="16" fill="#10b981" rx="2" />

                  <rect x="140" y="10" width="50" height="50" fill="#000" rx="8" />
                  <rect x="150" y="20" width="30" height="30" fill="#fff" rx="4" />
                  <rect x="157" y="27" width="16" height="16" fill="#10b981" rx="2" />

                  <rect x="10" y="140" width="50" height="50" fill="#000" rx="8" />
                  <rect x="20" y="150" width="30" height="30" fill="#fff" rx="4" />
                  <rect x="27" y="157" width="16" height="16" fill="#10b981" rx="2" />

                  {/* QR Matrix Pattern */}
                  {[
                    [70, 20], [90, 20], [110, 20],
                    [70, 40], [100, 50], [120, 40],
                    [20, 80], [40, 90], [60, 70], [80, 80], [100, 90], [130, 80], [160, 90],
                    [30, 110], [60, 120], [90, 110], [110, 120], [140, 110], [170, 120],
                    [70, 140], [100, 150], [120, 140], [150, 150],
                    [80, 170], [110, 160], [140, 170], [170, 170]
                  ].map(([x, y], idx) => (
                    <rect key={idx} x={x} y={y} width="14" height="14" fill="#1e293b" rx="2" />
                  ))}

                  {/* Center SingleChat Logo Stamp */}
                  <rect x="80" y="80" width="40" height="40" fill="#10b981" rx="8" />
                  <path d="M 92 90 L 108 90 L 108 102 L 98 102 L 95 107 L 95 102 L 92 102 Z" fill="#ffffff" />
                </svg>
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
