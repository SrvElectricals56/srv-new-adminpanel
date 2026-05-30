'use client';
import { useEffect, useMemo, useState } from 'react';
import { Medal, TrendingUp, FileSpreadsheet } from 'lucide-react';
import { appUserApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import type { AppUser } from '@/lib/types';
import ExportModal from '@/components/Shared/ExportModal';

type SortBy = 'points' | 'wallet' | 'redemptions';

export default function TopUsers() {
  const C = useThemePalette();
  const [rows, setRows] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('points');
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    appUserApi.getAll({ limit: '500' })
      .then(res => setRows(Array.isArray(res) ? res : (res as any).data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const topRows = useMemo(() => {
    const pick = (row: AppUser) => sortBy === 'points' ? row.totalPoints ?? 0 : sortBy === 'wallet' ? row.walletBalance ?? 0 : row.totalRedemptions ?? 0;
    return [...rows]
      .filter(row => row.status === 'active')
      .sort((a, b) => pick(b) - pick(a))
      .slice(0, 10);
  }, [rows, sortBy]);

  const maxValue = topRows.length ? (sortBy === 'points' ? topRows[0].totalPoints ?? 0 : sortBy === 'wallet' ? topRows[0].walletBalance ?? 0 : topRows[0].totalRedemptions ?? 0) : 1;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <ExportModal show={showExport} onClose={() => setShowExport(false)} title="Top Users" fileName="top-users" getData={() => topRows.map((row, index) => ({ Rank: index + 1, Name: row.name, Code: row.userCode, City: row.city ?? '', State: row.state ?? '', Points: row.totalPoints ?? 0, WalletBalance: row.walletBalance ?? 0, Redemptions: row.totalRedemptions ?? 0 }))} />
      <div style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', borderRadius: 18, padding: '22px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}><Medal size={26} /> Top Users</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', marginTop: 4 }}>Top 10 active customers by {sortBy}</div>
        </div>
        <button onClick={() => setShowExport(true)} style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 10, padding: '9px 18px', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><FileSpreadsheet size={14} /> Export</button>
      </div>
      <div style={{ background: C.card, borderRadius: 14, padding: '16px 20px', border: `1px solid ${C.border}`, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['points', 'wallet', 'redemptions'] as SortBy[]).map(item => (
            <button key={item} onClick={() => setSortBy(item)} style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: sortBy === item ? C.red : C.bg, color: sortBy === item ? 'white' : C.muted, cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>{item}</button>
          ))}
        </div>
        <div style={{ fontSize: 13, color: C.muted }}>{topRows.length} ranked</div>
      </div>
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={16} style={{ color: C.red }} />
          <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Leaderboard</span>
        </div>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Loading...</div> : topRows.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>No users found</div> : topRows.map((row, index) => {
          const value = sortBy === 'points' ? row.totalPoints ?? 0 : sortBy === 'wallet' ? row.walletBalance ?? 0 : row.totalRedemptions ?? 0;
          const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
          return (
            <div key={row.id} style={{ padding: '14px 20px', borderBottom: index < topRows.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: index < 3 ? '#FEF3C7' : C.bg, color: index < 3 ? '#92400E' : C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900 }}>{index + 1}</div>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{row.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{row.name}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{row.userCode}</span>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{[row.city, row.state].filter(Boolean).join(', ') || 'No location'}</div>
                <div style={{ height: 6, background: C.border, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${C.red}, ${C.redDark})` }} />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: C.red }}>{value.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 11, color: C.muted, textTransform: 'capitalize' }}>{sortBy}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
