import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  BarChart3, 
  Menu as MenuIcon, 
  RefreshCw, 
  Calendar, 
  Filter, 
  Download 
} from 'lucide-react';

export const PipelineReportView: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  if (loading || !data) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        <RefreshCw size={24} style={{ animation: 'spin 1.5s linear infinite', marginRight: '8px' }} />
        Carregando Funil de Vendas...
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      backgroundColor: '#f8fafc',
      color: '#1e293b',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      
      {/* 1. TOP FUNNEL BANNER (Exact SingleChat Screenshot 4) */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '36px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          backgroundColor: '#64748b',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <BarChart3 size={26} />
        </div>
        <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
          Nenhum dado disponível para exibir o funil
        </span>
      </div>

      {/* 2. ROW 1: Valor x Etapa & Motivos de Perdas (Screenshot 4) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Card: Valor x Etapa */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.96rem', color: '#0f172a' }}>Valor x Etapa</span>
            <button style={{ color: '#94a3b8', padding: '4px' }} title="Opções do Gráfico">
              <MenuIcon size={18} />
            </button>
          </div>

          {/* SVG Empty / Minimal Bar Graph */}
          <div style={{ position: 'relative', width: '100%', height: '220px' }}>
            <svg viewBox="0 0 700 220" style={{ width: '100%', height: '100%' }}>
              {/* Grid Lines */}
              <line x1="40" y1="30" x2="680" y2="30" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="70" x2="680" y2="70" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="110" x2="680" y2="110" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="150" x2="680" y2="150" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="190" x2="680" y2="190" stroke="#e2e8f0" strokeWidth="1" />

              {/* Y Axis */}
              <text x="25" y="34" fontSize="11" fill="#94a3b8" textAnchor="end">2</text>
              <text x="25" y="74" fontSize="11" fill="#94a3b8" textAnchor="end">1.5</text>
              <text x="25" y="114" fontSize="11" fill="#94a3b8" textAnchor="end">1</text>
              <text x="25" y="154" fontSize="11" fill="#94a3b8" textAnchor="end">0.5</text>
              <text x="25" y="194" fontSize="11" fill="#94a3b8" textAnchor="end">0</text>

              {/* Bottom stage labels */}
              <text x="160" y="210" fontSize="11" fill="#64748b" textAnchor="middle">R$ 0</text>
              <text x="360" y="210" fontSize="11" fill="#64748b" textAnchor="middle">R$ 0</text>
              <text x="560" y="210" fontSize="11" fill="#64748b" textAnchor="middle">R$ 0</text>
            </svg>
          </div>
        </div>

        {/* Card: Motivos de Perdas */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.96rem', color: '#0f172a' }}>Motivos de Perdas</span>
            <button style={{ color: '#94a3b8', padding: '4px' }} title="Opções do Gráfico">
              <MenuIcon size={18} />
            </button>
          </div>

          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            color: '#64748b',
            fontSize: '0.86rem'
          }}>
            Sem dados disponíveis
          </div>
        </div>

      </div>

      {/* 3. ROW 2: Performance Usuários Table (Screenshot 4) */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        overflowX: 'auto'
      }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '18px' }}>
          Performance Usuários
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>
              <th style={{ padding: '12px 14px' }}>Usuário</th>
              <th style={{ padding: '12px 14px' }}>Abertos</th>
              <th style={{ padding: '12px 14px' }}>Vl Aberto</th>
              <th style={{ padding: '12px 14px' }}>Ganho</th>
              <th style={{ padding: '12px 14px' }}>Vl Ganho</th>
              <th style={{ padding: '12px 14px' }}>%</th>
              <th style={{ padding: '12px 14px' }}>Perdido</th>
              <th style={{ padding: '12px 14px' }}>Vl Perdido</th>
              <th style={{ padding: '12px 14px' }}>Ciclo médio de vendas (dias)</th>
              <th style={{ padding: '12px 14px' }}>Taxa de negócios ganhos</th>
            </tr>
          </thead>
          <tbody>
            {data.userPerformance && data.userPerformance.map((u: any, idx: number) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f8fafc', color: '#1e293b' }}>
                <td style={{ padding: '14px', fontWeight: 600 }}>{u.user}</td>
                <td style={{ padding: '14px' }}>{u.abertos}</td>
                <td style={{ padding: '14px', color: '#0284c7', fontWeight: 600 }}>{u.vlAberto}</td>
                <td style={{ padding: '14px', color: '#16a34a', fontWeight: 700 }}>{u.ganho}</td>
                <td style={{ padding: '14px', color: '#16a34a', fontWeight: 700 }}>{u.vlGanho}</td>
                <td style={{ padding: '14px', fontWeight: 700 }}>{u.taxaGanho}</td>
                <td style={{ padding: '14px', color: '#dc2626' }}>{u.perdido}</td>
                <td style={{ padding: '14px', color: '#dc2626' }}>{u.vlPerdido}</td>
                <td style={{ padding: '14px', color: '#64748b' }}>{u.cicloMedio}</td>
                <td style={{ padding: '14px' }}>
                  <span style={{
                    backgroundColor: '#dcfce7',
                    color: '#16a34a',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '0.78rem'
                  }}>
                    {u.taxaGanho}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
