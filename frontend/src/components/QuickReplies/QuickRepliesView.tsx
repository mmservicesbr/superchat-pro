import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { QuickReply } from '../../types';
import { Zap, Plus, Trash2, Copy, Check } from 'lucide-react';

export const QuickRepliesView: React.FC = () => {
  const { token } = useAuth();
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchReplies = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/quick-replies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReplies(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReplies();
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta resposta rápida?')) return;
    try {
      await fetch(`/api/quick-replies/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchReplies();
    } catch (err) {
      console.error(err);
    }
  };

  const copyShortcut = (id: string, shortcut: string) => {
    navigator.clipboard.writeText(shortcut);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div style={{ flex: 1, padding: '28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Respostas Rápidas</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Atalhos para agilizar o tempo de resposta dos atendentes no chat digitando <code style={{ color: 'var(--primary)', background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px' }}>/atalho</code>.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={18} /> Novo Atalho
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
        {replies.map(r => (
          <div
            key={r.id}
            style={{
              backgroundColor: 'var(--bg-sidebar)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {r.shortcut}
                </span>
                <span style={{ fontWeight: 600, fontSize: '0.94rem' }}>{r.title}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => copyShortcut(r.id, r.shortcut)}
                  className="btn-icon"
                  style={{ width: '32px', height: '32px' }}
                  title="Copiar atalho"
                >
                  {copiedId === r.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="btn-icon"
                  style={{ width: '32px', height: '32px', color: '#f87171' }}
                  title="Excluir"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.2)',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.86rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.4
            }}>
              {r.message}
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Nova Resposta Rápida</h3>
              <button onClick={() => setShowAddModal(false)} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const shortcut = (form.elements.namedItem('shortcut') as HTMLInputElement).value;
              const title = (form.elements.namedItem('title') as HTMLInputElement).value;
              const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;

              const res = await fetch('/api/quick-replies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ shortcut, title, message })
              });
              if (res.ok) {
                setShowAddModal(false);
                fetchReplies();
              }
            }}>
              <div className="modal-body">
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Atalho (com barra)</label>
                  <input name="shortcut" required placeholder="Ex: /pix ou /horario" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Título / Descrição</label>
                  <input name="title" required placeholder="Ex: Chave PIX e Instruções" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Texto da Mensagem</label>
                  <textarea name="message" rows={4} required placeholder="Dica: use {nome} para o nome do cliente e {atendente} para seu nome" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Resposta Rápida</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
