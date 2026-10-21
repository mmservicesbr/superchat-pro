import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, ShieldCheck, Zap, Lock, Mail, ArrowRight } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@singlechat.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar no sistema');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('123456');
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(circle at 50% 20%, #172554 0%, #0a0d14 60%)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'rgba(15, 21, 35, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '36px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: '16px',
            boxShadow: '0 0 24px rgba(16, 185, 129, 0.4)'
          }}>
            <MessageSquare size={28} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.5px' }}>SingleChat Pro</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
            Plataforma Multiatendente & WhatsApp
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '0.86rem',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              E-mail de Acesso
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '42px', width: '100%' }}
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '42px', width: '100%' }}
                placeholder="••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px', height: '46px' }}
          >
            {loading ? 'Entrando...' : (
              <>
                Entrar no Painel <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Fast Switch Demo Profiles */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px', textAlign: 'center' }}>
            Acesso Rápido de Demonstração (Senha: 123456):
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => fillCredentials('admin@singlechat.com')}
              className="btn-secondary"
              style={{ flex: 1, fontSize: '0.75rem', padding: '6px 4px', justifyContent: 'center' }}
            >
              👑 SuperAdmin
            </button>
            <button
              onClick={() => fillCredentials('ana@singlechat.com')}
              className="btn-secondary"
              style={{ flex: 1, fontSize: '0.75rem', padding: '6px 4px', justifyContent: 'center' }}
            >
              💼 Comercial
            </button>
            <button
              onClick={() => fillCredentials('carlos@singlechat.com')}
              className="btn-secondary"
              style={{ flex: 1, fontSize: '0.75rem', padding: '6px 4px', justifyContent: 'center' }}
            >
              🛠️ Suporte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
