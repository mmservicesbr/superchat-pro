import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Company } from '../../types';
import { Building2, Plus, Users, Smartphone, MessageSquare, ShieldCheck, CheckCircle, Ban } from 'lucide-react';

export const CompaniesView: React.FC = () => {
  const { token, user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchCompanies = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/companies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [token]);

  const toggleStatus = async (comp: Company) => {
    try {
      await fetch(`/api/companies/${comp.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ active: comp.active ? 0 : 1 })
      });
      fetchCompanies();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ flex: 1, padding: '28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase' }}>
            <ShieldCheck size={16} /> Painel Super Administrador (Revenda SaaS)
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '2px' }}>Gestão de Empresas Clientes</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Cadastre novas empresas contratantes, defina os planos e os limites de atendentes e números de WhatsApp.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={18} /> Cadastrar Empresa
        </button>
      </div>

      {/* Companies Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {companies.map(comp => (
          <div
            key={comp.id}
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
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800
                }}>
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{comp.name}</h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    CNPJ: {comp.cnpj || 'Não informado'}
                  </div>
                </div>
              </div>

              <span style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: comp.active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: comp.active ? '#10b981' : '#f87171'
              }}>
                {comp.active ? 'ATIVA' : 'SUSPENSA'}
              </span>
            </div>

            {/* Metrics per company */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Plano</div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--primary)' }}>{comp.plan}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Atendentes</div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>{comp.users_count || 0} / {comp.max_agents}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>WhatsApp</div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>{comp.whatsapp_count || 0} / {comp.max_whatsapp}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Criada em: {new Date(comp.created_at).toLocaleDateString()}
              </span>

              <button
                onClick={() => toggleStatus(comp)}
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '5px 12px' }}
              >
                {comp.active ? (
                  <>
                    <Ban size={13} color="#f87171" /> Suspender
                  </>
                ) : (
                  <>
                    <CheckCircle size={13} color="#10b981" /> Reativar
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Cadastrar Nova Empresa (Cliente)</h3>
              <button onClick={() => setShowAddModal(false)} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const name = (form.elements.namedItem('name') as HTMLInputElement).value;
              const cnpj = (form.elements.namedItem('cnpj') as HTMLInputElement).value;
              const plan = (form.elements.namedItem('plan') as HTMLSelectElement).value;
              const maxAgents = parseInt((form.elements.namedItem('maxAgents') as HTMLInputElement).value, 10);
              const maxWhatsapp = parseInt((form.elements.namedItem('maxWhatsapp') as HTMLInputElement).value, 10);

              const res = await fetch('/api/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name, cnpj, plan, maxAgents, maxWhatsapp })
              });
              if (res.ok) {
                setShowAddModal(false);
                fetchCompanies();
              }
            }}>
              <div className="modal-body">
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Razão Social / Nome Fantasia</label>
                  <input name="name" required placeholder="Ex: Imobiliária Aliança Ltda" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>CNPJ (opcional)</label>
                  <input name="cnpj" placeholder="00.000.000/0001-00" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Plano Contratado</label>
                  <select name="plan" defaultValue="Profissional" style={{ width: '100%' }}>
                    <option value="Básico">Básico (até 3 atendentes / 1 WhatsApp)</option>
                    <option value="Profissional">Profissional (até 10 atendentes / 3 WhatsApps)</option>
                    <option value="Enterprise">Enterprise (até 25 atendentes / 5 WhatsApps)</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Limite de Atendentes</label>
                    <input type="number" name="maxAgents" defaultValue={10} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Limite de WhatsApps</label>
                    <input type="number" name="maxWhatsapp" defaultValue={3} style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Criar Empresa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
