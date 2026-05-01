'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Share2, X } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { referralApi, settingsApi } from '@/lib/api';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';

interface ReferralRecord {
  id: string;
  userName: string;
  phone: string;
  referralCode: string;
  referredCount: number;
  bonusEarned: number;
  status: 'active' | 'inactive';
}

const INITIAL_CONFIG = { referrerBonus: 500, refereeBonus: 250, maxReferrals: 0, baseLinkUrl: 'https://srvelectricals.in/ref/' };
const numberInputValue = (value: number | null | undefined) => value === 0 || value === null || value === undefined ? '' : value;

export default function Referrals({ role }: { role?: import('@/lib/types').AdminRole }) {
  const C = useThemePalette();
  const canEdit = role === 'super_admin' || role === 'admin';
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'codes' | 'config'>('codes');
  const [search, setSearch] = useState('');
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [configSaved, setConfigSaved] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);

  // Load referral config from settings
  useEffect(() => {
    settingsApi.getAll().then((rows: any[]) => {
      const map: Record<string, string> = {};
      (rows ?? []).forEach((r: any) => { map[r.key] = r.value; });
      setConfig({
        referrerBonus: Number(map['referral_referrer_bonus'] ?? INITIAL_CONFIG.referrerBonus),
        refereeBonus: Number(map['referral_referee_bonus'] ?? INITIAL_CONFIG.refereeBonus),
        maxReferrals: Number(map['referral_max_referrals'] ?? INITIAL_CONFIG.maxReferrals),
        baseLinkUrl: map['referral_base_link_url'] ?? INITIAL_CONFIG.baseLinkUrl,
      });
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const loadReferrals = async () => {
      try {
        const res = await referralApi.getAll({ limit: '200' });
        const data = Array.isArray(res) ? res : (res as any).data ?? [];
        setReferrals(data.map((r: any, i: number) => ({
          id: r.id ?? String(i + 1),
          userName: r.userName ?? r.user_name ?? r.name ?? 'Unknown',
          phone: r.phone ?? '',
          referralCode: r.referralCode ?? r.referral_code ?? '',
          referredCount: r.referredCount ?? r.referred_count ?? 0,
          bonusEarned: r.bonusEarned ?? r.bonus_earned ?? 0,
          status: r.status ?? 'active',
        })));
      } catch (err) {
        console.error('Failed to load referrals:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReferrals();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return referrals;
    const q = search.toLowerCase();
    return referrals.filter(r => r.userName.toLowerCase().includes(q) || r.phone.includes(q) || r.referralCode.toLowerCase().includes(q));
  }, [referrals, search]);

  const stats = useMemo(() => ({
    total: referrals.length,
    successful: referrals.reduce((s, r) => s + r.referredCount, 0),
    bonusGiven: referrals.reduce((s, r) => s + r.bonusEarned, 0),
    conversionRate: referrals.length > 0 ? ((referrals.filter(r => r.referredCount > 0).length / referrals.length) * 100).toFixed(1) + '%' : '0%',
  }), [referrals]);

  const handleDeactivate = async () => {
    if (deactivateId === null) return;
    try {
      await referralApi.update(deactivateId, { status: 'inactive' });
      setReferrals(prev => prev.map(r => r.id === deactivateId ? { ...r, status: 'inactive' } : r));
    } catch (err) { console.error(err); }
    setDeactivateId(null);
  };

  const handleSaveConfig = async () => {
    if (!canEdit) return;
    setConfigSaving(true);
    try {
      await Promise.all([
        settingsApi.update('referral_referrer_bonus', String(config.referrerBonus)),
        settingsApi.update('referral_referee_bonus', String(config.refereeBonus)),
        settingsApi.update('referral_max_referrals', String(config.maxReferrals)),
        settingsApi.update('referral_base_link_url', config.baseLinkUrl),
      ]);
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
    } catch (err) { console.error(err); }
    finally { setConfigSaving(false); }
  };

  const inputStyle = { padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' as const };
  const labelStyle = { fontSize: 12, fontWeight: 600 as const, color: C.muted, marginBottom: 5, display: 'block' as const };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 24 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #4338CA, #6366F1)', borderRadius: 16, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Share2 size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Referral Management</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Manage the referral system and codes</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Referrals', value: stats.total, bg: 'rgba(255,255,255,0.15)', color: '#fff' },
            { label: 'Successful', value: stats.successful, bg: 'rgba(99,102,241,0.3)', color: '#C7D2FE' },
            { label: 'Bonus Given', value: `${stats.bonusGiven.toLocaleString()} pts`, bg: 'rgba(34,197,94,0.2)', color: '#86EFAC' },
            { label: 'Conversion', value: stats.conversionRate, bg: 'rgba(245,158,11,0.25)', color: '#FCD34D' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '10px 18px', textAlign: 'center', minWidth: 72 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: C.card, borderRadius: 10, padding: 4, border: `1px solid ${C.border}`, width: 'fit-content' }}>
        {(['codes', 'config'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 24px', borderRadius: 7, border: 'none', background: activeTab === tab ? '#4338CA' : 'transparent', color: activeTab === tab ? '#fff' : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {tab === 'codes' ? '🔗 Referral Codes' : '⚙️ Config'}
          </button>
        ))}
      </div>

      {activeTab === 'codes' && (
        <>
          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 360, marginBottom: 20 }}>
            <Search size={15} color={C.muted} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, code..." style={{ ...inputStyle, paddingLeft: 34 }} />
          </div>

          {/* Table */}
          <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: C.shadow }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                    {['User Name', 'Phone', 'Referral Code', 'Referred Count', 'Bonus Earned', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = C.hoverRow)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>{r.userName}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: C.muted }}>{r.phone}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, background: C.accentSoft, color: C.accentText, border: `1px solid ${C.accentSoftBorder}`, padding: '3px 10px', borderRadius: 6 }}>{r.referralCode}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: C.text }}>{r.referredCount}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#4338CA' }}>{r.bonusEarned.toLocaleString()} pts</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: r.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: r.status === 'active' ? '#16A34A' : '#DC2626', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' as const }}>{r.status}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {r.status === 'active' && (
                          <button onClick={() => setDeactivateId(r.id)} style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: 'rgba(239,68,68,0.12)', color: '#DC2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <X size={12} /> Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: C.muted, fontSize: 14 }}>No referral records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'config' && (
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, maxWidth: 560 }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Referral Configuration</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Configure bonus points and referral settings</div>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Referrer Bonus Points</label>
                <input type="number" value={numberInputValue(config.referrerBonus)} onChange={e => setConfig(c => ({ ...c, referrerBonus: e.target.value === '' ? 0 : Number(e.target.value) }))} min={0} placeholder="0" style={inputStyle} />
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Points given to the person who referred</div>
              </div>
              <div>
                <label style={labelStyle}>Referee Bonus Points</label>
                <input type="number" value={numberInputValue(config.refereeBonus)} onChange={e => setConfig(c => ({ ...c, refereeBonus: e.target.value === '' ? 0 : Number(e.target.value) }))} min={0} placeholder="0" style={inputStyle} />
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Points given to the new user who joined</div>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Max Referrals Per User <span style={{ fontWeight: 400 }}>(0 = unlimited)</span></label>
              <input type="number" value={numberInputValue(config.maxReferrals)} onChange={e => setConfig(c => ({ ...c, maxReferrals: e.target.value === '' ? 0 : Number(e.target.value) }))} min={0} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Referral Link Base URL</label>
              <input value={config.baseLinkUrl} onChange={e => setConfig(c => ({ ...c, baseLinkUrl: e.target.value }))} placeholder="https://..." style={inputStyle} />
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Example: {config.baseLinkUrl}RAMESH10</div>
            </div>
            {configSaved && (
              <div style={{ padding: '10px', borderRadius: 8, background: 'rgba(34,197,94,0.15)', color: '#16A34A', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>✓ Configuration saved successfully!</div>
            )}
            <button onClick={handleSaveConfig} disabled={!canEdit || configSaving} style={{ padding: '11px', borderRadius: 9, border: 'none', background: configSaving ? '#9CA3AF' : 'linear-gradient(135deg, #4338CA, #6366F1)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: !canEdit || configSaving ? 'not-allowed' : 'pointer', opacity: canEdit ? 1 : 0.7 }}>
              {configSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        show={deactivateId !== null}
        title="Deactivate Referral Code"
        message={`Deactivate referral code for "${referrals.find(r => r.id === deactivateId)?.userName}"?`}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateId(null)}
        confirmText="Deactivate"
        type="danger"
      />
    </div>
  );
}
