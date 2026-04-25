'use client';
import { useState, useMemo, useEffect } from 'react';
import { Trophy, TrendingUp, Calendar } from 'lucide-react';
import { electricianApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import type { MemberTier } from '@/lib/types';
import ExportModal from '@/components/Shared/ExportModal';

type Range = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
type SortBy = 'points' | 'scans' | 'redemptions';

const TIER_CONFIG: Record<MemberTier, { color: string; bg: string; icon: string }> = {
  Silver:   { color: '#475569', bg: '#F1F5F9', icon: '🥈' },
  Gold:     { color: '#92400E', bg: '#FFFBEB', icon: '🥇' },
  Platinum: { color: '#5B21B6', bg: '#F5F3FF', icon: '🏆' },
  Diamond:  { color: '#1D4ED8', bg: '#EFF6FF', icon: '💎' },
};

const RANK_COLORS = ['#F59E0B', '#94A3B8', '#CD7F32', '#6B7280'];

// Simulate date-based filtering by multiplying points with a range factor
function getFilteredData(electricians: any[], range: Range, from: string, to: string, sortBy: SortBy) {
  const factors: Record<Range, number> = {
    weekly: 0.08,
    monthly: 0.3,
    quarterly: 0.6,
    yearly: 1,
    custom: 0.5,
  };
  const factor = range === 'custom'
    ? Math.min(1, Math.max(0.05, (new Date(to).getTime() - new Date(from).getTime()) / (365 * 24 * 60 * 60 * 1000)))
    : factors[range];

  return [...electricians]
    .filter(e => e.status === 'active')
    .map(e => ({
      ...e,
      periodPoints: Math.round(e.totalPoints * factor),
      periodScans: Math.round(e.totalScans * factor),
      periodRedemptions: Math.round(e.totalRedemptions * factor),
    }))
    .sort((a, b) => {
      if (sortBy === 'points') return b.periodPoints - a.periodPoints;
      if (sortBy === 'scans') return b.periodScans - a.periodScans;
      return b.periodRedemptions - a.periodRedemptions;
    })
    .slice(0, 10);
}

export default function TopElectricians() {
  const C = useThemePalette();
  const [range, setRange] = useState<Range>('monthly');
  const [sortBy, setSortBy] = useState<SortBy>('points');
  const [fromDate, setFromDate] = useState('2024-01-01');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [allElectricians, setAllElectricians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    electricianApi.getAll({ limit: '500' }).then(res => {
      setAllElectricians(Array.isArray(res) ? res : (res as any).data ?? []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const topList = useMemo(() => getFilteredData(allElectricians, range, fromDate, toDate, sortBy), [allElectricians, range, fromDate, toDate, sortBy]);

  const maxVal = topList[0]
    ? sortBy === 'points' ? topList[0].periodPoints
    : sortBy === 'scans' ? topList[0].periodScans
    : topList[0].periodRedemptions
    : 1;

  const rangeLabels: Record<Range, string> = {
    weekly: 'This Week', monthly: 'This Month',
    quarterly: 'This Quarter', yearly: 'This Year', custom: 'Custom Range',
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8,
    fontSize: 13, outline: 'none', background: C.inputBg, color: C.text,
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, #F59E0B, #D97706)`, borderRadius: 18, padding: '22px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 24px rgba(245,158,11,0.25)' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Trophy size={26} /> Top Electricians
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
            {rangeLabels[range]} — Top 10 performers by {sortBy}
          </div>
        </div>
        <div style={{ fontSize: 40, fontWeight: 900, color: 'rgba(255,255,255,0.2)' }}>🏆</div>
      </div>

      {/* Filters */}
      <div style={{ background: C.card, borderRadius: 14, padding: '16px 20px', border: `1px solid ${C.border}`, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Range tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['weekly', 'monthly', 'quarterly', 'yearly', 'custom'] as Range[]).map(r => (
            <button key={r} onClick={() => setRange(r)}
              style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: range === r ? '#F59E0B' : C.bg, color: range === r ? 'white' : C.muted, transition: 'all 0.2s' }}>
              {r === 'weekly' ? 'Weekly' : r === 'monthly' ? 'Monthly' : r === 'quarterly' ? 'Quarterly' : r === 'yearly' ? 'Yearly' : 'Custom'}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {range === 'custom' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Calendar size={14} style={{ color: C.muted }} />
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={inputStyle} />
            <span style={{ color: C.muted, fontSize: 12 }}>to</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={inputStyle} />
          </div>
        )}

        {/* Sort by */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {(['points', 'scans', 'redemptions'] as SortBy[]).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              style={{ padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: sortBy === s ? C.red : C.bg, color: sortBy === s ? 'white' : C.muted, transition: 'all 0.2s', textTransform: 'capitalize' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      {topList.length >= 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[topList[1], topList[0], topList[2]].map((e, i) => {
            const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
            const tier = TIER_CONFIG[e.tier as MemberTier] ?? TIER_CONFIG['Silver'];
            const val = sortBy === 'points' ? e.periodPoints : sortBy === 'scans' ? e.periodScans : e.periodRedemptions;
            const podiumH = rank === 1 ? 90 : rank === 2 ? 70 : 55;
            return (
              <div key={e.id} style={{ background: C.card, borderRadius: 16, padding: '20px 16px', border: `2px solid ${rank === 1 ? '#F59E0B' : C.border}`, textAlign: 'center', boxShadow: rank === 1 ? '0 8px 24px rgba(245,158,11,0.2)' : '0 2px 8px rgba(0,0,0,0.04)', position: 'relative' }}>
                {rank === 1 && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 22 }}>👑</div>}
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg, ${tier.bg}, ${tier.color}22)`, border: `3px solid ${RANK_COLORS[rank - 1]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px auto 10px', fontSize: 20, fontWeight: 900, color: tier.color }}>
                  {e.name[0]}
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 2 }}>{e.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{e.city} • {e.tier}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: RANK_COLORS[rank - 1] }}>{val.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 11, color: C.muted, textTransform: 'capitalize' }}>{sortBy}</div>
                {/* Podium bar */}
                <div style={{ height: podiumH, background: `linear-gradient(180deg, ${RANK_COLORS[rank - 1]}33, ${RANK_COLORS[rank - 1]}11)`, borderRadius: 8, marginTop: 12, border: `1px solid ${RANK_COLORS[rank - 1]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  #{rank}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard */}
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={16} style={{ color: C.red }} />
          <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Full Leaderboard</span>
        </div>
        {topList.map((e, idx) => {
          const tier = TIER_CONFIG[e.tier as MemberTier] ?? TIER_CONFIG['Silver'];
          const val = sortBy === 'points' ? e.periodPoints : sortBy === 'scans' ? e.periodScans : e.periodRedemptions;
          const pct = Math.round((val / maxVal) * 100);
          const rankColor = idx < 3 ? RANK_COLORS[idx] : C.muted;
          return (
            <div key={e.id} style={{ padding: '14px 20px', borderBottom: idx < topList.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', gap: 14, transition: 'background 0.2s' }}
              onMouseEnter={e2 => (e2.currentTarget as HTMLDivElement).style.background = C.bg}
              onMouseLeave={e2 => (e2.currentTarget as HTMLDivElement).style.background = 'transparent'}>
              {/* Rank */}
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: idx < 3 ? rankColor + '22' : C.bg, border: `2px solid ${rankColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: rankColor, flexShrink: 0 }}>
                {idx + 1}
              </div>
              {/* Avatar */}
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: tier.bg, border: `2px solid ${tier.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: tier.color, flexShrink: 0 }}>
                {e.name[0]}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{e.name}</span>
                  <span style={{ background: tier.bg, color: tier.color, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>{tier.icon} {e.tier}</span>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{e.city}, {e.state} • {e.electricianCode}</div>
                {/* Progress bar */}
                <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${rankColor}, ${rankColor}99)`, borderRadius: 3, transition: 'width 0.8s ease' }} />
                </div>
              </div>
              {/* Stats */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: rankColor }}>{val.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 10, color: C.muted, textTransform: 'capitalize' }}>{sortBy}</div>
              </div>
              {/* Extra stats */}
              <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{e.periodScans}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>Scans</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>₹{e.walletBalance.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>Wallet</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
