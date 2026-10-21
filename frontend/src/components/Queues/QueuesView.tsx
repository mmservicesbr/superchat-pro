import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Queue } from '../../types';
import { Layers, Plus, Trash2, Edit3, MessageSquare, Bot } from 'lucide-react';

export const QueuesView: React.FC = () => {
  const { token } = useAuth();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchQueues = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/queues', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQueues(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este departamento?')) return;
    try {
      await fetch(`/api/queues/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchQueues();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ flex: 1, padding: '28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Filas & Chatbot URA</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Configure os departamentos da empresa e as mensagens de saudação e triagem automática.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={18} /> Novo Departamento
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {queues.map(q => (
          <div
            key={q.id}
            style={{
              backgroundColor: 'var(--bg-sidebar)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: q.color }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{q.name}</h3>
              </div>
              <button
                onClick={() => handleDelete(q.id)}
                className="btn-icon"
                style={{ width: '32px', height: '32px', color: '#f87171' }}
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Bot size={13} /> Mensagem de Triagem Automática
              </label>
              <div style={{
                background: 'rgba(0,0,0,0.2)',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                color: 'var(--text-secondary)',
                marginTop: '6px'
              }}>
                {q.greeting_message || 'Nenhuma mensagem personalizada.'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Novo Departamento</h3>
              <button onClick={() => setShowAddModal(false)} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const name = (form.elements.namedItem('name') as HTMLInputElement).value;
              const color = (form.elements.namedItem('color') as HTMLInputElement).value;
              const greetingMessage = (form.elements.namedItem('greetingMessage') as HTMLTextAreaElement).value;

              const res = await fetch('/api/queues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name, color, greetingMessage })
              });
              if (res.ok) {
                setShowAddModal(false);
                fetchQueues();
              }
            }}>
              <div className="modal-body">
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Nome do Departamento</label>
                  <input name="name" required placeholder="Ex: Financeiro / Cobrança" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Cor de Identificação</label>
                  <input type="color" name="color" defaultValue="#10b981" style={{ width: '60px', height: '40px', padding: '2px', cursor: 'pointer' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Mensagem Automática de Saudação</label>
                  <textarea name="greetingMessage" rows={3} placeholder="Olá! Você está no setor Comercial. Como podemos te ajudar?" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Criar Departamento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
