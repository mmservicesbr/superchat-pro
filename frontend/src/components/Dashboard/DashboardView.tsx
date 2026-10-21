import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckCircle2, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Clock, 
  Users, 
  UserPlus, 
  Calendar, 
  RefreshCw, 
  Bot, 
  MessageSquare,
  HelpCircle,
  Timer
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [startDate, setStartDate] = useState('15/10/2026 00:00');
  const [endDate, setEndDate] = useState('21/10/2026 23:59');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [timeMode, setTimeMode] = useState<'24h' | 'business'>('24h');

  const fetchStats = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  if (loading || !data) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        <RefreshCw size={24} style={{ animation: 'spin 1.5s linear infinite', marginRight: '8px' }} />
        Carregando Dashboard...
      </div>
    );
  }

  // Pre-calculate points for Evolução SVG Line
  const evoPoints = [
    { x: 70, y: 220 - (85 / 100) * 160, val: 85, label: '15/10/2026' },
    { x: 195, y: 220 - (70 / 100) * 160, val: 70, label: '16/10/2026' },
    { x: 320, y: 220 - (55 / 100) * 160, val: 55, label: '17/10/2026' },
    { x: 445, y: 220 - (24 / 100) * 160, val: 24, label: '18/10/2026' },
    { x: 570, y: 220 - (60 / 100) * 160, val: 60, label: '19/10/2026' },
    { x: 695, y: 220 - (97 / 100) * 160, val: 97, label: '20/10/2026' },
    { x: 820, y: 220 - (77 / 100) * 160, val: 77, label: '21/10/2026' }
  ];
  const evoPathD = evoPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      backgroundColor: '#f8fafc',
      color: '#1e293b',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      
      {/* 1. TOP FILTER BAR (Screenshot 1) */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '12px 18px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Dt Inicio */}
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 10px', gap: '8px', backgroundColor: '#fff' }}>
          <Calendar size={16} color="#64748b" />
          <div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>Dt Início</div>
            <input 
              type="text" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              style={{ border: 'none', padding: 0, fontSize: '0.82rem', color: '#1e293b', width: '120px', backgroundColor: 'transparent' }} 
            />
          </div>
          <Clock size={14} color="#94a3b8" />
        </div>

        {/* Dt Fim */}
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 10px', gap: '8px', backgroundColor: '#fff' }}>
          <Calendar size={16} color="#64748b" />
          <div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>Dt Fim</div>
            <input 
              type="text" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              style={{ border: 'none', padding: 0, fontSize: '0.82rem', color: '#1e293b', width: '120px', backgroundColor: 'transparent' }} 
            />
          </div>
          <Clock size={14} color="#94a3b8" />
        </div>

        {/* Usuario */}
        <select 
          value={selectedUser} 
          onChange={e => setSelectedUser(e.target.value)}
          style={{ minWidth: '130px', backgroundColor: '#fff', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px', fontSize: '0.84rem' }}
        >
          <option value="all">Usuário</option>
          <option value="patricia">Patrícia (Admin)</option>
          <option value="rose">Rose</option>
          <option value="claudio">Cláudio</option>
          <option value="milena">Milena</option>
        </select>

        {/* Departamento */}
        <select 
          value={selectedDept} 
          onChange={e => setSelectedDept(e.target.value)}
          style={{ minWidth: '150px', backgroundColor: '#fff', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px', fontSize: '0.84rem' }}
        >
          <option value="all">Departamento</option>
          <option value="ocian">Vendas Ocian</option>
          <option value="riobranco">Vendas Rio Branco 2</option>
        </select>

        {/* Canal */}
        <select 
          value={selectedChannel} 
          onChange={e => setSelectedChannel(e.target.value)}
          style={{ minWidth: '120px', backgroundColor: '#fff', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '9px 12px', fontSize: '0.84rem' }}
        >
          <option value="all">Canal</option>
          <option value="whatsapp">whatsapp</option>
        </select>

        {/* 24h / Horas uteis pills */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '2px', border: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setTimeMode('24h')}
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              borderRadius: '6px',
              backgroundColor: timeMode === '24h' ? '#0284c7' : 'transparent',
              color: timeMode === '24h' ? '#ffffff' : '#64748b'
            }}
          >
            24h
          </button>
          <button
            onClick={() => setTimeMode('business')}
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              borderRadius: '6px',
              backgroundColor: timeMode === 'business' ? '#0284c7' : 'transparent',
              color: timeMode === 'business' ? '#ffffff' : '#64748b'
            }}
          >
            Horas úteis
          </button>
        </div>

        {/* Atualizar Button */}
        <button
          onClick={fetchStats}
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#ffffff',
            border: '1px solid #0284c7',
            color: '#0284c7',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 700
          }}
        >
          <RefreshCw size={14} /> ATUALIZAR
        </button>
      </div>

      {/* 2. THE 10 KPI CARDS (Matching SingleChat Colors & Layout) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        
        {/* Card 1: Total de atendimentos */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Total de atendimentos <HelpCircle size={13} color="#94a3b8" />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{data.totalTickets}</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Card 2: Iniciados pelo Cliente */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Iniciados pelo Cliente <HelpCircle size={13} color="#94a3b8" />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{data.clientInitiated}</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#ffe4e6', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhoneIncoming size={20} />
          </div>
        </div>

        {/* Card 3: Iniciados pela Empresa */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Iniciados pela Empresa <HelpCircle size={13} color="#94a3b8" />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{data.companyInitiated}</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhoneOutgoing size={20} />
          </div>
        </div>

        {/* Card 4: Pendentes */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Pendentes <HelpCircle size={13} color="#94a3b8" />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{data.pendingTickets}</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} />
          </div>
        </div>

        {/* Card 5: Atendentes */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Atendentes <HelpCircle size={13} color="#94a3b8" />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{data.totalAgents}</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#fef9c3', color: '#ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} />
          </div>
        </div>

        {/* Card 6: Total contatos */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Total contatos <HelpCircle size={13} color="#94a3b8" />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{data.totalContacts}</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} />
          </div>
        </div>

        {/* Card 7: Novos contatos */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Novos contatos <HelpCircle size={13} color="#94a3b8" />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{data.newContacts}</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserPlus size={20} />
          </div>
        </div>

        {/* Card 8: Em Atendimento */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Em Atendimento <HelpCircle size={13} color="#94a3b8" />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{data.openTickets}</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#ccfbf1', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={20} />
          </div>
        </div>

        {/* Card 9: TMA */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              TMA <HelpCircle size={13} color="#94a3b8" />
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{data.tma}</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} />
          </div>
        </div>

        {/* Card 10: 1ª resposta */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              1ª resposta <HelpCircle size={13} color="#94a3b8" />
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{data.firstResponseTime}</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Timer size={20} />
          </div>
        </div>

      </div>

      {/* 3. CHARTS ROW 1: Canais, Motivos de Fechamento, Departamentos (Screenshot 2) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        
        {/* Atendimento por Canal */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.96rem', marginBottom: '14px' }}>Atendimento por canal</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="170" height="170" viewBox="0 0 180 180">
              <circle cx="90" cy="90" r="65" fill="none" stroke="#0284c7" strokeWidth="28" strokeDasharray="408" strokeDashoffset="0" />
              <text x="90" y="96" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#0f172a">100.0%</text>
            </svg>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', fontSize: '0.82rem', color: '#64748b' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
              whatsapp
            </div>
          </div>
        </div>

        {/* Motivo de Fechamento */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.96rem', marginBottom: '14px' }}>Motivo de fechamento</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.closureReasons.map((item: any, idx: number) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                  <span style={{ color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '210px' }}>{item.reason}</span>
                  <span style={{ fontWeight: 700, color: '#0284c7' }}>{item.count.toFixed(1)}</span>
                </div>
                <div style={{ height: '7px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(item.count / 45) * 100}%`, height: '100%', backgroundColor: '#0284c7', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Atendimento por Departamento */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.96rem', marginBottom: '14px' }}>Atendimento por departamento</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="170" height="170" viewBox="0 0 180 180">
              <circle cx="90" cy="90" r="65" fill="none" stroke="#0284c7" strokeWidth="26" strokeDasharray="340 70" strokeDashoffset="0" />
              <circle cx="90" cy="90" r="65" fill="none" stroke="#10b981" strokeWidth="26" strokeDasharray="65 345" strokeDashoffset="-340" />
              <circle cx="90" cy="90" r="65" fill="none" stroke="#f43f5e" strokeWidth="26" strokeDasharray="5 405" strokeDashoffset="-405" />
              <text x="90" y="96" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#0f172a">83.3%</text>
            </svg>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px', fontSize: '0.76rem', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
                Vendas Ocian (83.3%)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                Vendas Rio Branco (16.0%)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f43f5e' }} />
                Não informado (0.7%)
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. CHARTS ROW 2: Evolução atendimentos (Bars + Spline Line Overlay - Screenshot 3) */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '18px' }}>Evolução atendimentos</div>
        
        <div style={{ position: 'relative', width: '100%', height: '240px' }}>
          {/* SVG Overlay for the line curve + points */}
          <svg viewBox="0 0 890 240" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            {/* Grid Lines */}
            <line x1="40" y1="40" x2="860" y2="40" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="85" x2="860" y2="85" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="130" x2="860" y2="130" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="175" x2="860" y2="175" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="210" x2="860" y2="210" stroke="#e2e8f0" strokeWidth="1" />

            {/* Y Axis labels */}
            <text x="25" y="44" fontSize="11" fill="#94a3b8" textAnchor="end">100</text>
            <text x="25" y="89" fontSize="11" fill="#94a3b8" textAnchor="end">80</text>
            <text x="25" y="134" fontSize="11" fill="#94a3b8" textAnchor="end">60</text>
            <text x="25" y="179" fontSize="11" fill="#94a3b8" textAnchor="end">40</text>
            <text x="25" y="214" fontSize="11" fill="#94a3b8" textAnchor="end">0</text>

            {/* Bars */}
            {evoPoints.map((p, idx) => (
              <g key={idx}>
                <rect
                  x={p.x - 28}
                  y={p.y}
                  width="56"
                  height={210 - p.y}
                  rx="6"
                  fill="#0284c7"
                />
              </g>
            ))}

            {/* Overlaid Connecting Curve */}
            <path
              d={evoPathD}
              fill="none"
              stroke="#7dd3fc"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Value badges & dots */}
            {evoPoints.map((p, idx) => (
              <g key={`marker-${idx}`}>
                <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#0284c7" strokeWidth="3" />
                <rect x={p.x - 16} y={p.y - 26} width="32" height="18" rx="4" fill="#e0f2fe" />
                <text x={p.x} y={p.y - 13} fontSize="11" fontWeight="bold" fill="#0284c7" textAnchor="middle">{p.val}</text>
                {/* Date label at bottom */}
                <text x={p.x} y="230" fontSize="11" fontWeight="500" fill="#64748b" textAnchor="middle">{p.label}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* 5. CHARTS ROW 3: Horários de pico (24 hours bars + line - Screenshot 5) */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '18px' }}>Horários de pico</div>
        
        <div style={{ position: 'relative', width: '100%', height: '220px' }}>
          <svg viewBox="0 0 1000 220" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            {/* Grid Lines */}
            <line x1="30" y1="30" x2="980" y2="30" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="30" y1="70" x2="980" y2="70" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="30" y1="110" x2="980" y2="110" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="30" y1="150" x2="980" y2="150" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="30" y1="190" x2="980" y2="190" stroke="#e2e8f0" strokeWidth="1" />

            {/* Y Axis labels */}
            <text x="20" y="34" fontSize="10" fill="#94a3b8" textAnchor="end">50</text>
            <text x="20" y="74" fontSize="10" fill="#94a3b8" textAnchor="end">40</text>
            <text x="20" y="114" fontSize="10" fill="#94a3b8" textAnchor="end">30</text>
            <text x="20" y="154" fontSize="10" fill="#94a3b8" textAnchor="end">20</text>
            <text x="20" y="194" fontSize="10" fill="#94a3b8" textAnchor="end">0</text>

            {/* Bars for 24 hours */}
            {data.peakHours.map((h: any, idx: number) => {
              const x = 50 + idx * 39;
              const barH = (h.count / 50) * 160;
              const y = 190 - Math.max(barH, 3);
              return (
                <g key={idx}>
                  <rect
                    x={x - 9}
                    y={y}
                    width="18"
                    height={190 - y}
                    rx="3"
                    fill={h.count > 0 ? '#0284c7' : '#e2e8f0'}
                  />
                  {h.count > 0 && (
                    <text x={x} y={y - 6} fontSize="10" fontWeight="bold" fill="#0284c7" textAnchor="middle">{h.count}</text>
                  )}
                  <text x={x} y="206" fontSize="9" fill="#94a3b8" textAnchor="middle">{h.hour}</text>
                </g>
              );
            })}

            {/* Curve line overlay */}
            <path
              d={data.peakHours.reduce((acc: string, h: any, idx: number) => {
                const x = 50 + idx * 39;
                const barH = (h.count / 50) * 160;
                const y = 190 - Math.max(barH, 3);
                return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
              }, '')}
              fill="none"
              stroke="#7dd3fc"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* 6. CHARTS ROW 4: 3 Bottom Rankings (Volume, Abertos, Concluídos - Screenshot 5) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        
        {/* Volume Total por Atendente */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.96rem', marginBottom: '14px' }}>Volume Total por Atendente</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {data.agentRanking.map((a: any, i: number) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 600 }}>{a.name}</span>
                  <span style={{ fontWeight: 700, color: '#0284c7' }}>{a.total}</span>
                </div>
                <div style={{ height: '7px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(a.total / 75) * 100}%`, height: '100%', backgroundColor: '#0284c7', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Atendimentos em Aberto */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.96rem', marginBottom: '14px' }}>Atendimentos em Aberto</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {data.agentRanking.filter((a: any) => a.open > 0).map((a: any, i: number) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 600 }}>{a.name}</span>
                  <span style={{ fontWeight: 700, color: '#0284c7' }}>{a.open}</span>
                </div>
                <div style={{ height: '7px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(a.open / 2) * 100}%`, height: '100%', backgroundColor: '#0284c7', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Atendimentos Concluídos */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.96rem', marginBottom: '14px' }}>Atendimentos Concluídos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {data.agentRanking.map((a: any, i: number) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 600 }}>{a.name}</span>
                  <span style={{ fontWeight: 700, color: '#0284c7' }}>{a.closed}</span>
                </div>
                <div style={{ height: '7px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(a.closed / 74) * 100}%`, height: '100%', backgroundColor: '#0284c7', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
