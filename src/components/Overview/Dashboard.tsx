'use client';
import { useState, useEffect } from 'react';
import { Bolt, Store, ScanLine, Star, Users, AlertTriangle, ChartColumn, Medal, CreditCard, Gift, MessageCircle, X, Check, Award, Trophy, Gem, FileText, IndianRupee, UserRound, UserCog, Smartphone } from 'lucide-react';
import { analyticsApi, appUserApi, counterboyApi, dealerApi, electricianApi, redemptionApi, scanApi, supportApi } from '@/lib/api';
import type { AdminRole } from '@/lib/types';
import { getPermissions } from '@/lib/permissions';
import { useThemePalette } from '@/lib/theme';
import { formatISTDateTime, formatISTDate, formatISTDateTimeFull, formatISTTime } from '@/lib/dateIST';

interface DashboardProps {
  role: AdminRole;
  adminName?: string;
  onNavigate?: (page: string, subPage?: string) => void;
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIER_COLORS: Record<string, string> = {
  Silver: '#94A3B8', Gold: '#F59E0B', Platinum: '#8B5CF6', Diamond: '#3B82F6',
};

export default function Dashboard({ role, adminName = 'Admin', onNavigate }: DashboardProps) {
  const C = useThemePalette();
  const [hovered, setHovered] = useState<number | null>(null);
  const [showFinanceChoice, setShowFinanceChoice] = useState(false);
  const permissions = getPermissions(role);

  // Real data state
  const [stats, setStats] = useState<any>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [pendingRedemptions, setPendingRedemptions] = useState<any[]>([]);
  const [scanChartData, setScanChartData] = useState<{ day: string; value: number }[]>([]);
  const [tierData, setTierData] = useState<Record<string, number>>({});
  const [pendingEnquiries, setPendingEnquiries] = useState(0);
  const [roleCounts, setRoleCounts] = useState({
    dealers: 0,
    customers: 0,
    counterboys: 0,
  });
  const [appInstallCounts, setAppInstallCounts] = useState({
    installed: 0,
    notInstalled: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashData, scansData, redemptionsData, scanStatsData, userStatsData, supportData, dealerStats, customerStats, counterboyStats, installedElectricians, notInstalledElectricians] = await Promise.all([
          analyticsApi.getDashboard(),
          scanApi.getAll({ limit: '5' }),
          redemptionApi.getAll({ status: 'pending', limit: '5' }),
          analyticsApi.getScanStats(),
          analyticsApi.getUserStats(),
          supportApi.getAll({ status: 'open', limit: '1' }),
          dealerApi.getStats().catch(() => null),
          appUserApi.getStats().catch(() => null),
          counterboyApi.getStats().catch(() => null),
          electricianApi.getAll({ page: '1', limit: '1', appInstalled: 'true' }).catch(() => null),
          electricianApi.getAll({ page: '1', limit: '1', appInstalled: 'false' }).catch(() => null),
        ]);
        setStats(dashData);
        setRoleCounts({
          dealers: Number(dealerStats?.total ?? dashData?.totalDealers ?? 0),
          customers: Number(customerStats?.total ?? 0),
          counterboys: Number(counterboyStats?.total ?? 0),
        });
        setAppInstallCounts({
          installed: Number((installedElectricians as any)?.total ?? 0),
          notInstalled: Number((notInstalledElectricians as any)?.total ?? 0),
        });
        setRecentScans(Array.isArray(scansData) ? scansData : (scansData as any).data ?? []);
        setPendingRedemptions(Array.isArray(redemptionsData) ? redemptionsData : (redemptionsData as any).data ?? []);

        // Real scan chart — last 7 days
        const last7 = scanStatsData?.last7Days ?? [];
        setScanChartData(last7.map((d: any) => ({ day: d.day, value: d.total })));

        // Real tier distribution from userStats
        const tiers: Record<string, number> = { Silver: 0, Gold: 0, Platinum: 0, Diamond: 0 };
        (userStatsData?.tierDistribution ?? []).forEach((t: any) => {
          const key = t.tier ? t.tier.charAt(0).toUpperCase() + t.tier.slice(1).toLowerCase() : '';
          if (key in tiers) tiers[key] = parseInt(t.count ?? t.electrician_count ?? 0);
        });
        setTierData(tiers);

        // Pending enquiries count
        setPendingEnquiries((supportData as any)?.total ?? 0);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleApproveRedemption = async (id: string) => {
    try {
      await redemptionApi.approve(id);
      setPendingRedemptions(prev => prev.filter(r => r.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleRejectRedemption = async (id: string) => {
    try {
      await redemptionApi.reject(id, 'Rejected by admin');
      setPendingRedemptions(prev => prev.filter(r => r.id !== id));
    } catch (err) { console.error(err); }
  };

  const totalUsers =
    Number(stats?.totalElectricians ?? 0) +
    roleCounts.dealers +
    roleCounts.customers +
    roleCounts.counterboys;

  const statCards = [
    { label: 'Total Users', value: totalUsers.toLocaleString('en-IN'), Icon: Users, change: 'Electricians, Dealers, Customers & Counter Boys', up: true, color: '#7C3AED', bg: '#F5F3FF', navigateTo: 'dashboard' },
    {
      label: 'App Status',
      value: null,
      Icon: Smartphone,
      change: 'Installed / Not Installed',
      up: true,
      color: '#1D4ED8',
      bg: '#E0F2FE',
      navigateTo: 'electricians',
      installed: appInstallCounts.installed,
      notInstalled: appInstallCounts.notInstalled,
    },
    { label: 'Total Electricians', value: stats?.totalElectricians?.toLocaleString('en-IN') ?? '—', Icon: Bolt, change: 'All registered', up: true, color: '#1D4ED8', bg: '#FFF0F0', navigateTo: 'electricians' },
    { label: 'Total Dealers', value: roleCounts.dealers.toLocaleString('en-IN'), Icon: Store, change: 'All registered', up: true, color: '#3B82F6', bg: '#EFF6FF', navigateTo: 'dealers' },
    { label: 'Customers', value: roleCounts.customers.toLocaleString('en-IN'), Icon: UserRound, change: 'All registered', up: true, color: '#0F766E', bg: '#CCFBF1', navigateTo: 'app-users' },
    { label: 'Counter Boys', value: roleCounts.counterboys.toLocaleString('en-IN'), Icon: UserCog, change: 'All registered', up: true, color: '#92400E', bg: '#FEF3C7', navigateTo: 'counterboys' },
    { label: 'Scans Today', value: stats?.totalScansToday?.toLocaleString('en-IN') ?? '—', Icon: ScanLine, change: 'Today', up: true, color: '#10B981', bg: '#D1FAE5', navigateTo: 'electricians', subPage: 'scans' },
    { label: 'Points Awarded', value: stats?.totalPointsAwarded ? `${(stats.totalPointsAwarded / 1000).toFixed(0)}K` : '—', Icon: Star, change: 'Total all-time', up: true, color: '#F59E0B', bg: '#FFFBEB', navigateTo: 'points-config' },
    { label: 'Finance', value: null, Icon: CreditCard, change: 'Electrician, Dealer, Customer & Counter Boy', up: true, color: '#065F46', bg: '#D1FAE5', navigateTo: 'finance-choice', valueIcon: IndianRupee },
    { label: 'Active Users', value: stats?.activeUsers?.toLocaleString('en-IN') ?? '—', Icon: Users, change: 'Currently active', up: true, color: '#0369A1', bg: '#F0F9FF', navigateTo: 'electricians' },
    { label: 'Top Electricians', value: null, Icon: Medal, change: 'View leaderboard', up: true, color: '#F59E0B', bg: '#FFFBEB', navigateTo: 'electricians', subPage: 'top', valueIcon: Trophy },
    { label: 'Top Dealers', value: null, Icon: Store, change: 'View leaderboard', up: true, color: '#3B82F6', bg: '#EFF6FF', navigateTo: 'dealers', subPage: 'top', valueIcon: Award },
  ];

  // Real chart data — fallback to empty bars if not loaded yet
  const chartBars = scanChartData.length > 0
    ? scanChartData
    : WEEK_DAYS.map(day => ({ day, value: 0 }));
  const maxBar = Math.max(...chartBars.map(d => d.value), 1);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      {/* Finance Choice Modal */}
      {showFinanceChoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowFinanceChoice(false)}>
          <div style={{ background: C.card, borderRadius: 20, width: 520, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.25)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#065F46' }}><CreditCard size={18} /></div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Finance</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Which finance page would you like to open?</div>
                </div>
              </div>
              <button onClick={() => setShowFinanceChoice(false)} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}><X size={16} /></button>
            </div>
            <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Electrician', Icon: Bolt, nav: 'electricians' },
                { label: 'Dealer', Icon: Store, nav: 'dealers' },
                { label: 'Customer', Icon: Users, nav: 'app-users' },
                { label: 'Counter Boy', Icon: FileText, nav: 'counterboys' },
              ].map(item => (
                <button key={item.label} onClick={() => { setShowFinanceChoice(false); onNavigate && onNavigate(item.nav, 'finance'); }}
                  style={{ background: C.surface, border: `2px solid ${C.border}`, borderRadius: 14, padding: '20px 16px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FFF0F0'; (e.currentTarget as HTMLButtonElement).style.borderColor = C.red; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = C.surface; (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; }}>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}><item.Icon size={28} /></div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Wallet, payments and redemptions</div>
                </button>
              ))}
            </div>
            <div style={{ padding: '0 24px 20px' }}>
              <button onClick={() => setShowFinanceChoice(false)} style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div style={{ background: C.heroGradient, borderRadius: 20, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 30px rgba(15,23,42,0.2)' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 4 }}>Welcome back, {adminName}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>SRV Electricals Admin Portal — {formatISTDateTimeFull(new Date().toISOString()).split(',').slice(0,2).join(',')}</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div onClick={() => onNavigate && onNavigate('redemptions')} style={{ textAlign: 'center', padding: '10px 20px', background: 'rgba(29,78,216,0.25)', borderRadius: 12, border: '1px solid rgba(29,78,216,0.3)', cursor: 'pointer' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}><AlertTriangle size={20} /> {stats?.pendingRedemptions ?? 0}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Pending Action</div>
          </div>
          <div onClick={() => onNavigate && onNavigate('enquiry-support')} style={{ textAlign: 'center', padding: '10px 20px', background: 'rgba(124,58,237,0.25)', borderRadius: 12, border: '1px solid rgba(124,58,237,0.3)', cursor: 'pointer' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#C4B5FD', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}><MessageCircle size={20} /> {pendingEnquiries}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Pending Enquiries</div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 16, padding: '15px 16px', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s', cursor: 'pointer' }}
            onClick={() => { if (s.navigateTo === 'finance-choice') { setShowFinanceChoice(true); return; } onNavigate && s.navigateTo && onNavigate(s.navigateTo, (s as any).subPage); }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}><s.Icon size={18} /></div>
              <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>↑</span>
            </div>
            {'installed' in s ? (
              <div style={{ display: 'grid', gap: 6, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.text }}>App Installed</span>
                  <span style={{ fontSize: 19, fontWeight: 900, color: '#065F46' }}>{loading ? '...' : Number(s.installed ?? 0).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.text }}>Not Installed</span>
                  <span style={{ fontSize: 19, fontWeight: 900, color: '#92400E' }}>{loading ? '...' : Number(s.notInstalled ?? 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>{loading ? '...' : s.valueIcon ? <s.valueIcon size={24} style={{ color: s.color }} /> : s.value}</div>
            )}
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 10.5, color: '#10B981', fontWeight: 600, lineHeight: 1.25 }}>{s.change}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Scan Activity Chart */}
        <div onClick={() => onNavigate && onNavigate('electricians', 'scans')} style={{ background: C.card, borderRadius: 16, padding: 22, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}><ChartColumn size={18} style={{ color: C.red }} /> Scan Activity — This Week</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Daily scan count</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 120 }}>
            {chartBars.map((d, i) => (
              <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 2, flex: 1, position: 'relative' }}>
                  {hovered === i && (
                    <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', background: C.text, color: 'white', fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6, whiteSpace: 'nowrap', marginBottom: 4, zIndex: 10 }}>{d.value} scans</div>
                  )}
                  <div style={{ width: '100%', height: `${Math.max(4, (d.value / maxBar) * 110)}px`, background: C.red, borderRadius: 3, opacity: hovered === i ? 1 : 0.8 }} />
                </div>
                <div style={{ textAlign: 'center', fontSize: 10, color: C.muted, fontWeight: 700, marginTop: 4 }}>{d.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tier Distribution */}
        <div onClick={() => onNavigate && onNavigate('electricians')} style={{ background: C.card, borderRadius: 16, padding: 22, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><Medal size={18} style={{ color: '#F59E0B' }} /> Tier Distribution</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Electricians by tier</div>
          {loading ? (
            <div style={{ color: C.muted, fontSize: 13 }}>Loading...</div>
          ) : (
            ['Silver', 'Gold', 'Platinum', 'Diamond'].map(tier => {
              const tierIconMap: Record<string, React.ReactNode> = { Silver: <Medal size={16} />, Gold: <Award size={16} />, Platinum: <Trophy size={16} />, Diamond: <Gem size={16} /> };
              const total = stats?.totalElectricians || 1;
              const count = tierData[tier] ?? 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={tier} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>{tierIconMap[tier]} {tier}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{count} <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: 8, background: C.bg, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: TIER_COLORS[tier], borderRadius: 4 }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Scans + Pending Redemptions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Scans */}
        <div onClick={() => onNavigate && onNavigate('electricians', 'scans')} style={{ background: C.card, borderRadius: 16, padding: 22, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}><Bolt size={18} style={{ color: C.red }} /> Recent Scans</div>
          {loading ? <div style={{ color: C.muted, fontSize: 13 }}>Loading...</div> :
            recentScans.length === 0 ? <div style={{ textAlign: 'center', padding: '24px 0', color: C.muted, fontSize: 14 }}>No scans yet</div> :
            recentScans.slice(0, 5).map((s: any, i: number) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 4 ? `1px solid ${C.bg}` : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: C.red, fontSize: 14, flexShrink: 0 }}>{(s.userName || 'U')[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.userName || 'Unknown'}</div>
                  <div style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.productName || s.productId}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#F59E0B' }}>+{s.points} pts</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{formatISTTime(s.scannedAt)}</div>
                </div>
              </div>
            ))
          }
        </div>

        {/* Pending Redemptions */}
        <div style={{ background: C.card, borderRadius: 16, padding: 22, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div onClick={() => onNavigate && onNavigate('redemptions')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, cursor: 'pointer' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}><Gift size={18} style={{ color: '#7C3AED' }} /> Pending Redemptions</div>
            {pendingRedemptions.length > 0 && <span style={{ background: '#FFF0F0', color: C.red, fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>{pendingRedemptions.length} pending</span>}
          </div>
          {loading ? <div style={{ color: C.muted, fontSize: 13 }}>Loading...</div> :
            pendingRedemptions.length === 0 ? <div style={{ textAlign: 'center', padding: '24px 0', color: C.muted, fontSize: 14 }}>All caught up!</div> :
            pendingRedemptions.map((r: any, i: number) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < pendingRedemptions.length - 1 ? `1px solid ${C.bg}` : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#7C3AED', fontSize: 14, flexShrink: 0 }}>{(r.userName || 'U')[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{r.userName || r.userId}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{r.type} · {r.points} pts {r.amount ? `→ ₹${r.amount}` : ''}</div>
                </div>
                {permissions.canEdit && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => handleApproveRedemption(r.id)} style={{ background: '#D1FAE5', color: '#065F46', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Check size={14} /></button>
                    <button onClick={() => handleRejectRedemption(r.id)} style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14} /></button>
                  </div>
                )}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

