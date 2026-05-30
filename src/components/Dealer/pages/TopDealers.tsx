'use client';
import { useState, useEffect, useCallback } from 'react';
import { Medal, TrendingUp, Calendar, Store, FileSpreadsheet } from 'lucide-react';
import { dealerApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import type { MemberTier } from '@/lib/types';
import ExportModal from '@/components/Shared/ExportModal';
import { I } from '@/lib/iconMap';

type Range = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

const TIER_CONFIG: Record<MemberTier, { color: string; bg: string; icon: string }> = {
  Silver:   { color: '#475569', bg: '#F1F5F9', icon: '' },
  Gold:     { color: '#92400E', bg: '#FFFBEB', icon: '' },
  Platinum: { color: '#5B21B6', bg: '#F5F3FF', icon: '' },
  Diamond:  { color: '#1D4ED8', bg: '#EFF6FF', icon: '' },
};

const RANK_COLORS = ['#F59E0B', '#94A3B8', '#CD7F32', '#6B7280'];

export default function TopDealers() {
  const C = useThemePalette();
  const [topList, setTopList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('monthly');
  const [fromDate, setFromDate] = useState('2024-01-01');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [showExport, setShowExport] = useState(false);

  const getDateRange = useCallback(() => {
    const now = new Date();
    const end = now.toISOString().split('T')[0];
    let start: string;
    if (range === 'custom') {
      start = fromDate;
    } else {
      const d = new Date(now);
      if (range === 'weekly') d.setDate(d.getDate() - 7);
      else if (range === 'monthly') d.setMonth(d.getMonth() - 1);
      else if (range === 'quarterly') d.setMonth(d.getMonth() - 3);
      else if (range === 'yearly') d.setFullYear(d.getFullYear() - 1);
      start = d.toISOString().split('T')[0];
    }
    return { from: start, to: range === 'custom' ? toDate : end };
  }, [range, fromDate, toDate]);

  useEffect(() => {
    const { from, to } = getDateRange();
    setLoading(true);
    dealerApi.getTop({ from, to, limit: '10' })
      .then(res => setTopList(Array.isArray(res) ? res : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range, fromDate, toDate, getDateRange]);

  const maxVal = topList[0]
    ? topList[0].periodElectricians
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
      <ExportModal
        show={showExport}
        onClose={() => setShowExport(false)}
        title="Top Dealers"
        fileName="top-dealers"
        getData={() => topList.map((d, idx) => ({
          Rank: idx + 1,
          Name: d.name,
          Phone: d.phone,
          DealerCode: d.dealerCode,
          Town: d.town,
          State: d.state,
          Tier: d.tier,
          TotalElectricians: d.electricianCount,
          PeriodElectricians: d.periodElectricians,
          MonthlyTarget: d.monthlyTarget ?? 0,
          AchievedTarget: d.achievedTarget ?? 0,
        }))}
      />
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', borderRadius: 18, padding: '22px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 24px rgba(59,130,246,0.25)' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Medal size={26} /> Top Dealers
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
            {rangeLabels[range]} — Top 10 by Electricians Added
          </div>
        </div>
        <button
          onClick={() => setShowExport(true)}
          style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 10, padding: '9px 18px', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <FileSpreadsheet size={14} /> Export
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: C.card, borderRadius: 14, padding: '16px 20px', border: `1px solid ${C.border}`, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['weekly', 'monthly', 'quarterly', 'yearly', 'custom'] as Range[]).map(r => (
            <button key={r} onClick={() => setRange(r)}
              style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: range === r ? '#3B82F6' : C.bg, color: range === r ? 'white' : C.muted, transition: 'all 0.2s' }}>
              {r === 'weekly' ? 'Weekly' : r === 'monthly' ? 'Monthly' : r === 'quarterly' ? 'Quarterly' : r === 'yearly' ? 'Yearly' : 'Custom'}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Calendar size={14} style={{ color: C.muted }} />
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={inputStyle} />
            <span style={{ color: C.muted, fontSize: 12 }}>to</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={inputStyle} />
          </div>
        )}

        <div style={{ marginLeft: 'auto' }} />
      </div>

      {/* Top 3 Podium */}
      {topList.length >= 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[topList[1], topList[0], topList[2]].map((d, i) => {
            const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
            const tier = TIER_CONFIG[d.tier as MemberTier] ?? TIER_CONFIG['Silver'];
            const val = d.periodElectricians;
            const podiumH = rank === 1 ? 90 : rank === 2 ? 70 : 55;
            return (
              <div key={d.id} style={{ background: C.card, borderRadius: 16, padding: '20px 16px', border: `2px solid ${rank === 1 ? '#3B82F6' : C.border}`, textAlign: 'center', boxShadow: rank === 1 ? '0 8px 24px rgba(59,130,246,0.2)' : '0 2px 8px rgba(0,0,0,0.04)', position: 'relative' }}>
                {rank === 1 && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I name='Crown' size={22} /></div>}
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: tier.bg, border: `3px solid ${RANK_COLORS[rank - 1]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px auto 10px' }}>
                  <Store size={22} style={{ color: tier.color }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 2 }}>{d.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{d.town} • {d.tier}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: RANK_COLORS[rank - 1] }}>
                  {val.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>Electricians</div>
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
        {topList.map((d, idx) => {
          const tier = TIER_CONFIG[d.tier as MemberTier] ?? TIER_CONFIG['Silver'];
          const val = d.periodElectricians;
          const pct = Math.round((val / maxVal) * 100);
          const rankColor = idx < 3 ? RANK_COLORS[idx] : C.muted;
          const displayVal = val.toLocaleString('en-IN');
          return (
            <div key={d.id} style={{ padding: '14px 20px', borderBottom: idx < topList.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', gap: 14, transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = C.bg}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: idx < 3 ? rankColor + '22' : C.bg, border: `2px solid ${rankColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: rankColor, flexShrink: 0 }}>
                {idx + 1}
              </div>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: tier.bg, border: `2px solid ${tier.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Store size={18} style={{ color: tier.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{d.name}</span>
                  <span style={{ background: tier.bg, color: tier.color, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>{tier.icon} {d.tier}</span>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{d.town}, {d.state} • {d.dealerCode}</div>
                <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${rankColor}, ${rankColor}99)`, borderRadius: 3, transition: 'width 0.8s ease' }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: rankColor }}>{displayVal}</div>
                <div style={{ fontSize: 10, color: C.muted }}>Electricians</div>
              </div>
              <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{d.electricianCount}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>Total</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
