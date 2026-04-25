'use client';
import { useState, useEffect } from 'react';
import { CreditCard, Eye, Banknote, DollarSign, TrendingUp, ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { walletApi, redemptionApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import ExportModal from '@/components/Shared/ExportModal';

type Tab = 'wallet' | 'withdrawal';

function WalletTab() {
  const C = useThemePalette();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<any | null>(null);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    walletApi.getTransactions({ userRole: 'electrician', limit: '500' })
      .then(res => setRows(Array.isArray(res) ? res : (res as any).data ?? []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = rows.filter(r =>
    (r.userId ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.description ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const credits = rows.filter(r => r.type === 'credit').reduce((a, r) => a + Number(r.amount), 0);
  const debits = rows.filter(r => r.type === 'debit').reduce((a, r) => a + Number(r.amount), 0);
  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text, boxSizing: 'border-box' };

  return (
    <>
      <ExportModal show={showExport} onClose={() => setShowExport(false)} title="Electrician Wallet" fileName="electrician-wallet" getData={() => rows.map(r => ({ UserId: r.userId, Type: r.type, Source: r.source, Description: r.description, Amount: r.amount, BalanceAfter: r.balanceAfter, Date: r.createdAt }))} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[{ label: 'Credits', value: `₹${credits.toLocaleString('en-IN')}`, color: '#065F46', bg: '#D1FAE5', Icon: ArrowDownLeft }, { label: 'Debits', value: `₹${debits.toLocaleString('en-IN')}`, color: '#991B1B', bg: '#FEE2E2', Icon: ArrowUpRight }, { label: 'Net Balance', value: `₹${(credits - debits).toLocaleString('en-IN')}`, color: '#1D4ED8', bg: '#EFF6FF', Icon: Wallet }].map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}><s.Icon size={20} /></div>
            <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{s.value}</div><div style={{ fontSize: 12, color: s.color, fontWeight: 700 }}>{s.label}</div></div>
          </div>
        ))}
      </div>
      <div style={{ background: C.card, borderRadius: 14, padding: '12px 16px', border: `1px solid ${C.border}`, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..." style={{ ...inp, flex: 1 }} />
        <span style={{ fontSize: 13, color: C.muted }}>{filtered.length} results</span>
        <button onClick={() => setShowExport(true)} style={{ background: C.red, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Export</button>
      </div>
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {loading ? <div style={{ padding: '40px', textAlign: 'center', color: C.muted }}>Loading...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
              {['User ID', 'Type', 'Source', 'Description', 'Amount', 'Balance After', 'Date', 'Actions'].map(h => (
                <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: C.muted }}>No transactions found</td></tr>
              : filtered.map(row => (
                <tr key={row.id} style={{ borderBottom: `1px solid ${C.border}` }} onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = C.hoverRow} onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>{row.userId?.slice(0, 8)}…</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ background: row.type === 'credit' ? '#D1FAE5' : '#FEE2E2', color: row.type === 'credit' ? '#065F46' : '#991B1B', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{row.type}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{row.source}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{row.description || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 800, color: row.type === 'credit' ? '#10B981' : '#EF4444' }}>{row.type === 'credit' ? '+' : '-'}₹{Number(row.amount).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: C.text }}>₹{Number(row.balanceAfter).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{new Date(row.createdAt).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '12px 16px' }}><button onClick={() => setView(row)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, padding: '5px 9px', cursor: 'pointer', color: C.muted }}><Eye size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {view && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setView(null)}>
          <div style={{ background: C.card, borderRadius: 16, width: 480, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.2)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Transaction Details</div>
              <button onClick={() => setView(null)} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: C.muted, fontSize: 15 }}>✕</button>
            </div>
            <div style={{ padding: 22, display: 'grid', gap: 8 }}>
              {[['User ID', view.userId], ['Type', view.type], ['Source', view.source], ['Description', view.description || '—'], ['Amount', `₹${Number(view.amount).toLocaleString('en-IN')}`], ['Balance After', `₹${Number(view.balanceAfter).toLocaleString('en-IN')}`], ['Date', new Date(view.createdAt).toLocaleDateString('en-IN')]].map(([k, v]) => (
                <div key={k} style={{ background: C.bg, borderRadius: 9, padding: '10px 14px', fontSize: 13, color: C.text }}><span style={{ color: C.muted, fontWeight: 600 }}>{k}: </span>{v}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function WithdrawalTab() {
  const C = useThemePalette();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<any | null>(null);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    redemptionApi.getAll({ limit: '500' })
      .then(res => setRows(Array.isArray(res) ? res : (res as any).data ?? []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = rows.filter(r =>
    (r.userName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.userId ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const payouts = rows.filter(r => r.status === 'approved').reduce((a, r) => a + Number(r.amount ?? 0), 0);
  const pending = rows.filter(r => r.status === 'pending').reduce((a, r) => a + Number(r.amount ?? 0), 0);
  const statusMap: Record<string, { bg: string; color: string; label: string }> = {
    approved: { bg: '#D1FAE5', color: '#065F46', label: 'Approved' },
    pending: { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
    rejected: { bg: '#FEE2E2', color: '#991B1B', label: 'Rejected' },
  };
  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text, boxSizing: 'border-box' };

  return (
    <>
      <ExportModal show={showExport} onClose={() => setShowExport(false)} title="Electrician Redemptions" fileName="electrician-redemptions" getData={() => rows.map(r => ({ UserId: r.userId, UserName: r.userName, Type: r.type, Amount: r.amount, Status: r.status, Date: r.requestedAt }))} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[{ label: 'Total Approved', value: `₹${payouts.toLocaleString('en-IN')}`, color: '#065F46', bg: '#D1FAE5', Icon: DollarSign }, { label: 'Pending', value: `₹${pending.toLocaleString('en-IN')}`, color: '#92400E', bg: '#FEF3C7', Icon: Banknote }, { label: 'Transactions', value: String(rows.length), color: '#1D4ED8', bg: '#EFF6FF', Icon: CreditCard }, { label: 'Rejected', value: String(rows.filter(r => r.status === 'rejected').length), color: '#991B1B', bg: '#FEE2E2', Icon: TrendingUp }].map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}><s.Icon size={20} /></div>
            <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{s.value}</div><div style={{ fontSize: 12, color: s.color, fontWeight: 700 }}>{s.label}</div></div>
          </div>
        ))}
      </div>
      <div style={{ background: C.card, borderRadius: 14, padding: '12px 16px', border: `1px solid ${C.border}`, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user..." style={{ ...inp, flex: 1 }} />
        <span style={{ fontSize: 13, color: C.muted }}>{filtered.length} results</span>
        <button onClick={() => setShowExport(true)} style={{ background: C.red, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Export</button>
      </div>
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {loading ? <div style={{ padding: '40px', textAlign: 'center', color: C.muted }}>Loading...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
              {['User', 'Type', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
                <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: C.muted }}>No redemptions found</td></tr>
              : filtered.map(row => {
                const s = statusMap[row.status] ?? statusMap['pending'];
                return (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${C.border}` }} onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = C.hoverRow} onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: C.text }}>{row.userName || row.userId?.slice(0, 8)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{row.type}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 800, color: C.text }}>₹{Number(row.amount ?? 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 16px' }}><span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{s.label}</span></td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{new Date(row.requestedAt).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '12px 16px' }}><button onClick={() => setView(row)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, padding: '5px 9px', cursor: 'pointer', color: C.muted }}><Eye size={13} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {view && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setView(null)}>
          <div style={{ background: C.card, borderRadius: 16, width: 480, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.2)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Redemption Details</div>
              <button onClick={() => setView(null)} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: C.muted, fontSize: 15 }}>✕</button>
            </div>
            <div style={{ padding: 22, display: 'grid', gap: 8 }}>
              {[['User', view.userName || view.userId], ['Type', view.type], ['Amount', `₹${Number(view.amount ?? 0).toLocaleString('en-IN')}`], ['Status', view.status], ['UPI ID', view.upiId || '—'], ['Date', new Date(view.requestedAt).toLocaleDateString('en-IN')]].map(([k, v]) => (
                <div key={k} style={{ background: C.bg, borderRadius: 9, padding: '10px 14px', fontSize: 13, color: C.text }}><span style={{ color: C.muted, fontWeight: 600 }}>{k}: </span>{v}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ElectricianFinance() {
  const C = useThemePalette();
  const [tab, setTab] = useState<Tab>('wallet');
  const btn = (id: Tab): React.CSSProperties => ({ padding: '7px 20px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: tab === id ? 'none' : `1px solid ${C.border}`, background: tab === id ? C.red : C.surface, color: tab === id ? '#fff' : C.muted, transition: 'all 0.15s' });
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <div style={{ background: 'linear-gradient(135deg,#064E3B,#065F46)', borderRadius: 16, padding: '22px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CreditCard size={26} color="#fff" /></div>
        <div><h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Finance</h1><p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>Wallet history and redemption requests</p></div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button style={btn('wallet')} onClick={() => setTab('wallet')}>Wallet History</button>
        <button style={btn('withdrawal')} onClick={() => setTab('withdrawal')}>Redemptions</button>
      </div>
      {tab === 'wallet' ? <WalletTab /> : <WithdrawalTab />}
    </div>
  );
}
