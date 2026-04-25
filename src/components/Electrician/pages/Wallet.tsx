'use client';
import { useState, useEffect } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { walletApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import ExportModal from '@/components/Shared/ExportModal';

export default function ElectricianWallet() {
  const C = useThemePalette();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    walletApi.getTransactions({ userRole: 'electrician', limit: '500' })
      .then(res => setTransactions(Array.isArray(res) ? res : (res as any).data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = transactions.filter(t => {
    const matchSearch = (t.userId ?? '').toLowerCase().includes(search.toLowerCase()) || (t.description ?? '').toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || t.type === filterType;
    return matchSearch && matchType;
  });

  const totalCredits = transactions.filter(t => t.type === 'credit').reduce((a, t) => a + Number(t.amount), 0);
  const totalDebits = transactions.filter(t => t.type === 'debit').reduce((a, t) => a + Number(t.amount), 0);

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><Wallet size={24} style={{ color: C.red }} /> Wallet History</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>Track electrician wallet transactions</p>
        </div>
        <button onClick={() => setShowExport(true)} style={{ background: C.red, color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Export</button>
      </div>
      <ExportModal show={showExport} onClose={() => setShowExport(false)} title="Electrician Wallet" fileName="electrician-wallet" getData={() => transactions.map(t => ({ UserId: t.userId, Type: t.type, Source: t.source, Description: t.description, Amount: t.amount, BalanceBefore: t.balanceBefore, BalanceAfter: t.balanceAfter, Date: t.createdAt }))} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 22 }}>
        <div style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#065F46' }}><ArrowDownLeft size={20} /></div>
          <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>₹{totalCredits.toLocaleString('en-IN')}</div><div style={{ fontSize: 12, color: '#065F46', fontWeight: 700 }}>Total Credits</div></div>
        </div>
        <div style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#991B1B' }}><ArrowUpRight size={20} /></div>
          <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>₹{totalDebits.toLocaleString('en-IN')}</div><div style={{ fontSize: 12, color: '#991B1B', fontWeight: 700 }}>Total Debits</div></div>
        </div>
        <div style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8' }}><Wallet size={20} /></div>
          <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>₹{(totalCredits - totalDebits).toLocaleString('en-IN')}</div><div style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 700 }}>Net Balance</div></div>
        </div>
      </div>

      <div style={{ background: C.card, borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}`, marginBottom: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, flex: 1, minWidth: 220 }} />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
          <option value="all">All Types</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
        <span style={{ fontSize: 13, color: C.muted, marginLeft: 'auto' }}>{filtered.length} results</span>
      </div>

      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {loading ? <div style={{ padding: '40px', textAlign: 'center', color: C.muted }}>Loading...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                {['User ID', 'Type', 'Source', 'Description', 'Amount', 'Balance After', 'Date'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: C.muted }}>No transactions found</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} style={{ borderBottom: `1px solid ${C.border}` }} onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = C.hoverRow} onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>{t.userId?.slice(0, 8)}…</td>
                  <td style={{ padding: '13px 16px', textAlign: 'center' }}><span style={{ background: t.type === 'credit' ? '#D1FAE5' : '#FEE2E2', color: t.type === 'credit' ? '#065F46' : '#991B1B', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>{t.type === 'credit' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}{t.type === 'credit' ? 'Credit' : 'Debit'}</span></td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: C.muted }}>{t.source}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: C.muted }}>{t.description || '—'}</td>
                  <td style={{ padding: '13px 16px', textAlign: 'right', fontSize: 14, fontWeight: 800, color: t.type === 'credit' ? '#10B981' : '#EF4444' }}>{t.type === 'credit' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '13px 16px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: C.text }}>₹{Number(t.balanceAfter).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: C.muted }}>{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
