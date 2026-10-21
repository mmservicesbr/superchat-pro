import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { Users, Plus, Trash2, Shield, UserCheck, Mail } from 'lucide-react';

export const UsersView: React.FC = () => {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este usuário da equipe?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao remover');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ flex: 1, padding: '28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Equipe & Atendentes</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Gerencie os operadores, supervisores e permissões de acesso ao atendimento.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={18} /> Novo Atendente
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
        {users.map(u => (
          <div
            key={u.id}
            style={{
              backgroundColor: 'var(--bg-sidebar)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {u.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{u.name}</h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={12} /> {u.email}
                  </div>
                </div>
              </div>

              {currentUser?.id !== u.id && (
                <button
                  onClick={() => handleDelete(u.id)}
                  className="btn-icon"
                  style={{ width: '32px', height: '32px', color: '#f87171' }}
                  title="Remover usuário"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{
                fontSize: '0.74rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: u.role === 'superadmin' ? 'rgba(239, 68, 68, 0.15)' : u.role === 'admin' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: u.role === 'superadmin' ? '#ef4444' : u.role === 'admin' ? '#818cf8' : '#10b981'
              }}>
                {u.role}
              </span>

              <span style={{ fontSize: '0.78rem', color: u.status === 'online' ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: u.status === 'online' ? '#10b981' : '#64748b' }} />
                {u.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Cadastrar Novo Atendente</h3>
              <button onClick={() => setShowAddModal(false)} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const name = (form.elements.namedItem('name') as HTMLInputElement).value;
              const email = (form.elements.namedItem('email') as HTMLInputElement).value;
              const password = (form.elements.namedItem('password') as HTMLInputElement).value;
              const role = (form.elements.namedItem('role') as HTMLSelectElement).value;

              const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name, email, password, role })
              });
              if (res.ok) {
                setShowAddModal(false);
                fetchUsers();
              } else {
                const err = await res.json();
                alert(err.error || 'Erro ao cadastrar');
              }
            }}>
              <div className="modal-body">
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Nome Completo</label>
                  <input name="name" required placeholder="Ex: Fernanda Lima" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>E-mail de Login</label>
                  <input type="email" name="email" required placeholder="fernanda@empresa.com" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Senha Provisória</label>
                  <input type="password" name="password" required placeholder="••••••" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Nível de Permissão</label>
                  <select name="role" defaultValue="agent" style={{ width: '100%' }}>
                    <option value="agent">Atendente (atende apenas seus chamados)</option>
                    <option value="supervisor">Supervisor (visualiza toda a equipe)</option>
                    <option value="admin">Administrador da Empresa</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Usuário</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
