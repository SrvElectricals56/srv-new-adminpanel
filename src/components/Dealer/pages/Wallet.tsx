'use client';
import { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { walletApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import ExportModal from '@/components/Shared/ExportModal';

interface Transaction {
  id: string;
  userId: string;
  userRole: string;
  type: string;
  source: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export default function WalletHistory() {
  const C = useThemePalette();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    walletApi.getTransactions({ userRole: 'dealer', limit: '500' }).then(res => {
      setTransactions(Array.isArray(res) ? res : (res as any).data ?? []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = transactions.filter(t =>
    filterType === 'all' || t.type === filterType
  );

  const totalCredit = filtered.filter(t => t.type === 'credit').reduce((a, t) => a + Number(t.amount), 0);
  const totalDebit = filtered.filter(t => t.type === 'debit').reduce((a, t) => a + Number(t.amount), 0);

  const inputStyle: React.CSSProperties = { padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><Wallet size={24} style={{ color: C.red }} /> Wallet History</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>Track all dealer wallet transactions and balance</p>
        </div>
        <button onClick={() => setShowExport(true)} style={{ background: C.red, color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Export</button>
      </div>
      <ExportModal show={showExport} onClose={() => setShowExport(false)} title="Dealer Wallet" fileName="dealer-wallet" getData={() => transactions.map(t => ({ UserId: t.userId, Type: t.type, Source: t.source, Description: t.description, Amount: t.amount, BalanceBefore: t.balanceBefore, BalanceAfter: t.balanceAfter, Date: t.createdAt }))} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Credit', value: `₹${totalCredit.toLocaleString('en-IN')}`, color: '#10B981', bg: '#D1FAE5', Icon: ArrowDownLeft },
          { label: 'Total Debit', value: `₹${totalDebit.toLocaleString('en-IN')}`, color: '#EF4444', bg: '#FEE2E2', Icon: ArrowUpRight },
          { label: 'Net Amount', value: `₹${(totalCredit - totalDebit).toLocaleString('en-IN')}`, color: '#3B82F6', bg: '#EFF6FF', Icon: Wallet },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}><s.Icon size={20} /></div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.card, borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}`, marginBottom: 18, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={inputStyle}>
          <option value="all">All Types</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
        <span style={{ fontSize: 13, color: C.muted, marginLeft: 'auto' }}>{filtered.length} transactions</span>
      </div>

      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: C.muted }}>Loading...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                {['Date', 'User ID', 'Type', 'Source', 'Description', 'Amount', 'Balance After'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: C.muted }}>No transactions found</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = C.hoverRow}
                  onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: C.muted }}>{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>{t.userId.slice(0, 8)}…</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ background: t.type === 'credit' ? '#D1FAE5' : '#FEE2E2', color: t.type === 'credit' ? '#065F46' : '#991B1B', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {t.type === 'credit' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                      {t.type === 'credit' ? 'Credit' : 'Debit'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: C.muted }}>{t.source}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: C.text }}>{t.description || '—'}</td>
                  <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 800, color: t.type === 'credit' ? '#10B981' : '#EF4444' }}>
                    {t.type === 'credit' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: C.text }}>₹{Number(t.balanceAfter).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
