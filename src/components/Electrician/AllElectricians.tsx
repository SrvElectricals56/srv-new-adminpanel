'use client';
import { useState, useEffect } from 'react';
import { Users, Star, ScanLine, Wallet, Trash2, SlidersHorizontal, Calendar } from 'lucide-react';
import { electricianApi, dealerApi } from '@/lib/api';
import type { Electrician, MemberTier, UserStatus, AdminRole } from '@/lib/types';
import { getPermissions } from '@/lib/permissions';
import { useThemePalette } from '@/lib/theme';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import AlertDialog from '@/components/Shared/AlertDialog';

interface ElectriciansProps {
  role: AdminRole;
}

const TIER_CONFIG: Record<MemberTier, { bg: string; color: string; icon: string; bar: string }> = {
  Silver: { bg: '#F1F5F9', color: '#475569', icon: '🥈', bar: '#94A3B8' },
  Gold: { bg: '#FFFBEB', color: '#92400E', icon: '🥇', bar: '#F59E0B' },
  Platinum: { bg: '#F5F3FF', color: '#5B21B6', icon: '🏆', bar: '#8B5CF6' },
  Diamond: { bg: '#EFF6FF', color: '#1D4ED8', icon: '💎', bar: '#3B82F6' },
};

const STATUS_CONFIG: Record<UserStatus, { bg: string; color: string; label: string }> = {
  active: { bg: '#D1FAE5', color: '#065F46', label: 'Active' },
  pending: { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
  inactive: { bg: '#FEE2E2', color: '#991B1B', label: 'Inactive' },
};

function ViewModal({ el, onClose, onEdit, permissions }: { el: Electrician; onClose: () => void; onEdit: () => void; permissions: any }) {
  const C = useThemePalette();
  const tier = TIER_CONFIG[el.tier];
  const status = STATUS_CONFIG[el.status];
  return (
    <div style={{ position: 'fixed', inset: 0, background: C.overlay, backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: 20, width: 560, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: C.heroGradient, padding: '24px 28px', borderRadius: '20px 20px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, overflow: 'hidden', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: 'white' }}>
                {el.profileImage ? <img src={el.profileImage} alt={el.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : el.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{el.name}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{el.electricianCode} · {el.phone}</div>
                {el.email && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>✉️ {el.email}</div>}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', color: 'white', fontSize: 16 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <span style={{ background: tier.bg, color: tier.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{tier.icon} {el.tier}</span>
            <span style={{ background: status.bg, color: status.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{status.label}</span>
            <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>⚡ Electrician</span>
            {el.bankLinked && <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>🏦 Bank Linked</span>}
          </div>
        </div>

        <div style={{ padding: 28 }}>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 22 }}>
            {[
              { label: 'Total Points', value: el.totalPoints.toLocaleString('en-IN'), Icon: Star, color: '#F59E0B' },
              { label: 'Total Scans', value: el.totalScans, Icon: ScanLine, color: '#3B82F6' },
              { label: 'Wallet Balance', value: `₹${el.walletBalance}`, Icon: Wallet, color: '#10B981' },
            ].map((s, i) => (
              <div key={i} style={{ background: C.bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, color: s.color }}><s.Icon size={20} /></div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{s.value}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
            {[
              { label: 'City', value: el.city }, { label: 'District', value: el.district },
              { label: 'State', value: el.state }, { label: 'Dealer', value: el.dealerName },
              { label: 'Email', value: el.email || '—' },
              { label: 'Dealer ID', value: el.dealerId ? el.dealerId.toUpperCase() : '—' },
              { label: 'Joined', value: new Date(el.joinedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
              { label: 'Category', value: 'Electrician' },
              { label: 'UPI ID', value: el.upiId || '—' },
              { label: 'Total Redemptions', value: el.totalRedemptions },
            ].map((d, i) => (
              <div key={i} style={{ background: C.bg, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 2, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>{d.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{String(d.value)}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {permissions.canEdit && (
              <button onClick={onEdit} style={{ flex: 1, background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}>✏️ Edit Electrician</button>
            )}
            <button onClick={onClose} style={{ background: C.bg, color: C.muted, border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditModal({ el, onClose, onSave, dealers = [] }: { el: Electrician | null; onClose: () => void; onSave: (data: Partial<Electrician>) => void; dealers?: { id: string; name: string; dealerCode: string }[] }) {
  const C = useThemePalette();
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`,
    borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface,
    color: C.text, boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em',
  };
  const isAdd = !el;

  // Auto-generate unique electrician code using state prefix
  const generateCode = () => {
    const STATE_CODES: Record<string, string> = {
      'Punjab': 'PB', 'Haryana': 'HR', 'Delhi': 'DL', 'Rajasthan': 'RJ',
      'Uttar Pradesh': 'UP', 'Gujarat': 'GJ', 'Maharashtra': 'MH',
      'Madhya Pradesh': 'MP', 'Bihar': 'BR', 'West Bengal': 'WB',
      'Tamil Nadu': 'TN', 'Karnataka': 'KA', 'Telangana': 'TG',
      'Andhra Pradesh': 'AP', 'Kerala': 'KL', 'Odisha': 'OD',
    };
    const stateCode = STATE_CODES[form.state ?? ''] ?? (form.state ?? 'XX').substring(0, 2).toUpperCase();
    const cityCode = String(Math.floor(Math.random() * 90000) + 10000);
    const seq = String(Math.floor(Math.random() * 900) + 100).padStart(3, '0');
    return `${stateCode}${cityCode}-${seq}`;
  };

  const [form, setForm] = useState<Partial<Electrician>>(() => {
    if (el) return el;
    // Auto-generate code on first render for new electrician
    const stateCode = 'XX';
    const cityCode = String(Math.floor(Math.random() * 90000) + 10000);
    const seq = String(Math.floor(Math.random() * 900) + 100).padStart(3, '0');
    const autoCode = `${stateCode}${cityCode}-${seq}`;
    return {
      name: '', profileImage: '', phone: '', email: '', city: '', state: '', district: '',
      electricianCode: autoCode,
      tier: 'Silver', status: 'active', dealerId: '', dealerName: '', bankLinked: false,
      upiId: '', walletBalance: 0, totalPoints: 0, totalScans: 0, totalRedemptions: 0,
      recentActivity: 'Just joined', joinedDate: new Date().toISOString().split('T')[0],
    };
  });
  const f = (k: keyof Electrician, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const handleImageFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => f('profileImage', String(reader.result ?? ''));
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.overlay, backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: 20, width: 620, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{isAdd ? '➕ Add New Electrician' : `✏️ Edit — ${el?.name}`}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{isAdd ? 'Fill in all details to register a new electrician' : 'Update electrician profile and settings'}</div>
          </div>
          <button onClick={onClose} style={{ background: C.bg, border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>🖼️ Profile Photo</div>
            </div>
            {form.profileImage && (
              <div style={{ gridColumn: '1/-1', lineHeight: 0 }}>
                <img src={form.profileImage} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', display: 'block', border: `1px solid ${C.border}` }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Profile Photo URL</label>
              <input style={inputStyle} value={form.profileImage ?? ''} onChange={e => f('profileImage', e.target.value)} placeholder="https://..." />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Choose From Files</label>
              <input type="file" accept="image/*" onChange={handleImageFile} style={{ ...inputStyle, padding: '6px 10px' }} />
            </div>

            {/* Personal Info */}
            <div style={{ gridColumn: '1/-1' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>👤 Personal Information</div>
            </div>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} value={form.name ?? ''} onChange={e => {
                const val = e.target.value;
                if (/^[a-zA-Z\s]*$/.test(val) || val === '') f('name', val);
              }} placeholder="e.g. Harshvardhan Singh" />
            </div>
            <div>
              <label style={labelStyle}>Phone Number *</label>
              <input style={inputStyle} type="tel" maxLength={10} value={form.phone ?? ''} onChange={e => {
                const val = e.target.value;
                if (/^\d*$/.test(val)) f('phone', val);
              }} placeholder="10-digit mobile number" />
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input style={inputStyle} type="email" value={form.email ?? ''} onChange={e => f('email', e.target.value.trim())} placeholder="e.g. name@example.com" />
            </div>
            <div>
              <label style={labelStyle}>Electrician Code</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...inputStyle, flex: 1, background: C.bg, color: C.text, fontFamily: 'monospace', fontWeight: 700 }}
                  value={form.electricianCode ?? ''}
                  readOnly
                  placeholder="Auto-generated"
                />
                <button
                  type="button"
                  onClick={() => f('electricianCode', generateCode())}
                  style={{ padding: '0 14px', background: C.red, color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  🔄 Generate
                </button>
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Auto-generated unique code. Click to regenerate.</div>
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <input style={inputStyle} value="Electrician" readOnly />
            </div>

            {/* Location */}
            <div style={{ gridColumn: '1/-1', marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>📍 Location</div>
            </div>
            <div>
              <label style={labelStyle}>City *</label>
              <input style={inputStyle} value={form.city ?? ''} onChange={e => {
                const val = e.target.value;
                if (/^[a-zA-Z\s]*$/.test(val) || val === '') f('city', val);
              }} placeholder="City name" />
            </div>
            <div>
              <label style={labelStyle}>District</label>
              <input style={inputStyle} value={form.district ?? ''} onChange={e => {
                const val = e.target.value;
                if (/^[a-zA-Z\s]*$/.test(val) || val === '') f('district', val);
              }} placeholder="District" />
            </div>
            <div>
              <label style={labelStyle}>State *</label>
              <input style={inputStyle} value={form.state ?? ''} onChange={e => {
                const val = e.target.value;
                if (/^[a-zA-Z\s]*$/.test(val) || val === '') f('state', val);
              }} placeholder="State" />
            </div>

            {/* Dealer & Account */}
            <div style={{ gridColumn: '1/-1', marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>🏬 Dealer & Account</div>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Dealer</label>
              <select style={inputStyle} value={form.dealerId ?? ''} onChange={e => {
                const selected = dealers.find(d => d.id === e.target.value);
                f('dealerId', e.target.value || null);
                f('dealerName', selected?.name ?? '');
              }}>
                <option value="">— No Dealer —</option>
                {dealers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.dealerCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tier</label>
              <select style={inputStyle} value={form.tier ?? 'Silver'} onChange={e => f('tier', e.target.value as MemberTier)}>
                {(['Silver','Gold','Platinum','Diamond'] as MemberTier[]).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status ?? 'active'} onChange={e => f('status', e.target.value as UserStatus)}>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>UPI ID</label>
              <input style={inputStyle} value={form.upiId ?? ''} onChange={e => f('upiId', e.target.value)} placeholder="name@bank" />
            </div>
            <div>
              <label style={labelStyle}>Bank Linked</label>
              <select style={inputStyle} value={form.bankLinked ? 'yes' : 'no'} onChange={e => f('bankLinked', e.target.value === 'yes')}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            {!isAdd && (
              <>
                <div>
                  <label style={labelStyle}>Total Points</label>
                  <input style={inputStyle} type="number" value={form.totalPoints ?? ''} onChange={e => f('totalPoints', e.target.value === '' ? '' : +e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label style={labelStyle}>Wallet Balance (₹)</label>
                  <input style={inputStyle} type="number" value={form.walletBalance ?? ''} onChange={e => f('walletBalance', e.target.value === '' ? '' : +e.target.value)} placeholder="0" />
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button onClick={() => onSave(form)} style={{ flex: 1, background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}>
              {isAdd ? '✅ Add Electrician' : '💾 Save Changes'}
            </button>
            <button onClick={onClose} style={{ background: C.bg, color: C.muted, border: 'none', borderRadius: 10, padding: '13px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Electricians({ role }: ElectriciansProps) {
  const C = useThemePalette();
  const [data, setData] = useState<Electrician[]>([]);
  const [dealers, setDealers] = useState<{ id: string; name: string; dealerCode: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [elecRes, dealRes] = await Promise.all([
        electricianApi.getAll({ limit: '500' }),
        dealerApi.getAll({ limit: '500' }),
      ]);
      const dealData = Array.isArray(dealRes) ? dealRes : (dealRes as any).data ?? [];
      setDealers(dealData.map((d: any) => ({ id: d.id, name: d.name, dealerCode: d.dealerCode })));

      const rawElecs = Array.isArray(elecRes) ? elecRes : (elecRes as any).data ?? [];
      // Map dealerName from joined dealer object or from dealData lookup
      const dealerMap = new Map(dealData.map((d: any) => [d.id, d.name]));
      setData(rawElecs.map((e: any) => ({
        ...e,
        dealerName: e.dealerName ?? e.dealer?.name ?? (e.dealerId ? dealerMap.get(e.dealerId) : null) ?? '—',
        recentActivity: e.recentActivity ?? e.lastActivityAt ?? 'N/A',
      })));
    } catch (err) {
      console.error('Failed to load electricians:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Auto-refresh when tab becomes visible (two-way sync with app)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadData(); };
    document.addEventListener('visibilitychange', onVisible);
    // Poll every 30 seconds for real-time updates
    const interval = setInterval(loadData, 30000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, []);

  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBank, setFilterBank] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [viewing, setViewing] = useState<Electrician | null>(null);
  const [editing, setEditing] = useState<Electrician | null | undefined>(undefined);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'error' });

  const permissions = getPermissions(role);
  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' };

  // Unique values for dropdowns
  const uniqueStates = ['all', ...Array.from(new Set(data.map(e => e.state))).sort()];
  const uniqueCategories = ['all', ...Array.from(new Set(data.map(e => e.subCategory))).sort()];

  const filtered = data.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = e.name.toLowerCase().includes(q) || e.phone.includes(q) || e.city.toLowerCase().includes(q) || e.electricianCode.toLowerCase().includes(q) || e.dealerName.toLowerCase().includes(q);
    const joinedDate = new Date(e.joinedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    let matchDate = true;
    if (dateFilter === 'today') matchDate = joinedDate.getTime() >= today.getTime();
    else if (dateFilter === 'yesterday') matchDate = joinedDate.getTime() >= yesterday.getTime() && joinedDate.getTime() < today.getTime();
    else if (dateFilter === 'week') matchDate = joinedDate.getTime() >= weekAgo.getTime();
    else if (dateFilter === 'month') matchDate = joinedDate.getTime() >= monthAgo.getTime();
    else if (dateFilter === 'custom' && customDateRange.from && customDateRange.to) {
      const fromDate = new Date(customDateRange.from);
      const toDate = new Date(customDateRange.to);
      toDate.setHours(23, 59, 59, 999);
      matchDate = joinedDate.getTime() >= fromDate.getTime() && joinedDate.getTime() <= toDate.getTime();
    }
    
    return matchSearch && matchDate
      && (filterTier === 'all' || e.tier === filterTier)
      && (filterStatus === 'all' || e.status === filterStatus)
      && (filterState === 'all' || e.state === filterState)
      && (filterCategory === 'all' || e.subCategory === filterCategory)
      && (filterBank === 'all' || (filterBank === 'linked' ? e.bankLinked : !e.bankLinked));
  });

  const handleSave = async (form: Partial<Electrician>) => {
    if (!form.name?.trim() || !form.phone?.trim() || !form.city?.trim() || !form.state?.trim()) {
      setAlertDialog({ show: true, title: 'Required Fields Missing', message: 'Please fill all required fields: Name, Phone, City, and State', type: 'error' });
      return;
    }
    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      setAlertDialog({ show: true, title: 'Invalid Phone Number', message: 'Phone number must be exactly 10 digits', type: 'error' });
      return;
    }
    const electricianData = {
      name: form.name,
      phone: form.phone,
      email: form.email && form.email.trim() !== '' ? form.email.trim() : undefined,
      city: form.city,
      state: form.state,
      district: form.district,
      electricianCode: form.electricianCode,
      tier: form.tier,
      status: form.status,
      dealerId: form.dealerId && form.dealerId.trim() !== '' ? form.dealerId : undefined,
      subCategory: form.subCategory || 'General Electrician',
      bankLinked: form.bankLinked,
      upiId: form.upiId && form.upiId.trim() !== '' ? form.upiId : undefined,
      profileImage: form.profileImage && form.profileImage.trim() !== '' ? form.profileImage : undefined,
      // Points and wallet — always include so admin changes reflect immediately
      totalPoints: typeof form.totalPoints === 'number' ? form.totalPoints : undefined,
      walletBalance: typeof form.walletBalance === 'number' ? form.walletBalance : undefined,
      totalScans: typeof form.totalScans === 'number' ? form.totalScans : undefined,
    };
    try {
      if (showAdd) {
        await electricianApi.create(electricianData);
        setShowAdd(false);
      } else {
        await electricianApi.update(editing!.id, electricianData);
        setEditing(undefined);
      }
      await loadData();
    } catch (err: any) {
      setAlertDialog({ show: true, title: 'Error', message: err.message || 'Operation failed', type: 'error' });
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      try {
        await electricianApi.delete(deleteConfirm.id);
        setDeleteConfirm({ show: false, id: null });
        await loadData();
      } catch (err: any) {
        setAlertDialog({ show: true, title: 'Error', message: err.message || 'Delete failed', type: 'error' });
      }
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      {viewing && <ViewModal el={viewing} onClose={() => setViewing(null)} onEdit={() => { setEditing(viewing); setViewing(null); }} permissions={permissions} />}
      {(editing !== undefined || showAdd) && (
        <EditModal el={showAdd ? null : editing!} dealers={dealers} onClose={() => { setEditing(undefined); setShowAdd(false); }} onSave={handleSave} />
      )}
      <AlertDialog show={alertDialog.show} title={alertDialog.title} message={alertDialog.message} type={alertDialog.type} onClose={() => setAlertDialog({ ...alertDialog, show: false })} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4 }}>⚡ Electricians</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>Manage all registered electricians, tiers and points</p>
        </div>
        {permissions.canCreate && (
          <button onClick={() => setShowAdd(true)} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            ＋ Add Electrician
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Total', value: data.length, Icon: Users, color: '#3B82F6', bg: '#EFF6FF' },
          ...(['Silver','Gold','Platinum','Diamond'] as MemberTier[]).map(t => {
            const tierIcons = { Silver: '🥈', Gold: '🥇', Platinum: '🏆', Diamond: '💎' };
            return {
              label: t, 
              value: data.filter(e => e.tier === t).length, 
              Icon: () => <span style={{ fontSize: 18 }}>{tierIcons[t]}</span>, 
              color: TIER_CONFIG[t].color, 
              bg: TIER_CONFIG[t].bg,
            };
          }),
        ].map((s, i) => (
          <div key={i} onClick={() => setFilterTier(i === 0 ? 'all' : s.label)} style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}`, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}><s.Icon size={18} /></div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{s.value}</div>
                <div style={{ fontSize: 11, color: s.color, fontWeight: 700 }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: C.card, borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}`, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', position: 'relative' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search name, phone, city, code, dealer..." style={{ ...inputStyle, flex: 1 }} onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.red} onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />

        {/* Date Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={14} style={{ color: dateFilter !== 'all' ? C.red : C.muted }} />
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value as any)}
            style={{ padding: '9px 12px', border: `1.5px solid ${dateFilter !== 'all' ? C.red : C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.surface, color: C.text, cursor: 'pointer', minWidth: 120 }}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {dateFilter === 'custom' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" value={customDateRange.from} onChange={e => setCustomDateRange(prev => ({ ...prev, from: e.target.value }))}
              style={{ padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', background: C.surface, color: C.text }} />
            <span style={{ color: C.muted, fontSize: 12 }}>to</span>
            <input type="date" value={customDateRange.to} onChange={e => setCustomDateRange(prev => ({ ...prev, to: e.target.value }))}
              style={{ padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', background: C.surface, color: C.text }} />
          </div>
        )}

        {/* Active filter count badge */}
        {(filterTier !== 'all' || filterStatus !== 'all' || filterState !== 'all' || filterCategory !== 'all' || filterBank !== 'all' || dateFilter !== 'all') && (
          <button onClick={() => { setFilterTier('all'); setFilterStatus('all'); setFilterState('all'); setFilterCategory('all'); setFilterBank('all'); setDateFilter('all'); setCustomDateRange({ from: '', to: '' }); }}
            style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.red}`, background: '#FFF0F0', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
            ✕ Clear Filters
          </button>
        )}

        {/* Filter icon button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowFilterPopup(p => !p)}
            style={{
              width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${showFilterPopup || (filterTier !== 'all' || filterStatus !== 'all' || filterState !== 'all' || filterCategory !== 'all' || filterBank !== 'all') ? C.red : C.border}`,
              background: showFilterPopup || (filterTier !== 'all' || filterStatus !== 'all' || filterState !== 'all' || filterCategory !== 'all' || filterBank !== 'all') ? '#FFF0F0' : C.card,
              color: showFilterPopup || (filterTier !== 'all' || filterStatus !== 'all' || filterState !== 'all' || filterCategory !== 'all' || filterBank !== 'all') ? C.red : C.muted,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative',
            }}
          >
            <SlidersHorizontal size={17} />
            {(filterTier !== 'all' || filterStatus !== 'all' || filterState !== 'all' || filterCategory !== 'all' || filterBank !== 'all') && (
              <span style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: C.red, color: 'white', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {[filterTier, filterStatus, filterState, filterCategory, filterBank].filter(f => f !== 'all').length}
              </span>
            )}
          </button>

          {/* Filter Modal - Centered Overlay */}
          {showFilterPopup && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowFilterPopup(false)}>
              <div style={{ background: C.card, borderRadius: 20, width: 460, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.25)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.red }}>
                      <SlidersHorizontal size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Filter Electricians</div>
                      <div style={{ fontSize: 12, color: C.muted }}>Narrow down results by category</div>
                    </div>
                  </div>
                  <button onClick={() => setShowFilterPopup(false)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
                {/* Body */}
                <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { label: 'Tier', value: filterTier, set: setFilterTier, options: [['all','All Tiers'],['Silver','🥈 Silver'],['Gold','🥇 Gold'],['Platinum','🏆 Platinum'],['Diamond','💎 Diamond']] },
                    { label: 'Status', value: filterStatus, set: setFilterStatus, options: [['all','All Status'],['active','✅ Active'],['pending','⏳ Pending'],['inactive','❌ Inactive']] },
                    { label: 'State', value: filterState, set: setFilterState, options: [['all','All States'], ...uniqueStates.filter(s => s !== 'all').map(s => [s, s])] },
                    { label: 'Category', value: filterCategory, set: setFilterCategory, options: [['all','All Categories'], ...uniqueCategories.filter(c => c !== 'all').map(c => [c, c])] },
                    { label: 'Bank Account', value: filterBank, set: setFilterBank, options: [['all','All'],['linked','🏦 Linked'],['not_linked','❌ Not Linked']] },
                  ].map(f => (
                    <div key={f.label}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{f.label}</div>
                      <select value={f.value} onChange={e => f.set(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${f.value !== 'all' ? C.red : C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text, cursor: 'pointer' }}>
                        {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                {/* Footer */}
                <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10 }}>
                  <button onClick={() => { setFilterTier('all'); setFilterStatus('all'); setFilterState('all'); setFilterCategory('all'); setFilterBank('all'); setDateFilter('all'); setCustomDateRange({ from: '', to: '' }); }}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Reset All
                  </button>
                  <button onClick={() => setShowFilterPopup(false)}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <span style={{ fontSize: 13, color: C.muted, whiteSpace: 'nowrap' }}>{filtered.length} of {data.length}</span>
      </div>

      {/* Table */}
      {loading && <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>Loading electricians...</div>}
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
              {['Electrician','Electrician Code','Location','Tier','Points','Scans','Wallet','Status','Last Active','Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => {
              const tier = TIER_CONFIG[e.tier];
              const status = STATUS_CONFIG[e.status];
              return (
                <tr key={e.id} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.12s' }}
                  onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = C.hoverRow}
                  onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                  <td style={{ padding: '13px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', background: `linear-gradient(135deg, #FFF0F0, #FFD5D3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: C.red, flexShrink: 0 }}>
                        {e.profileImage ? <img src={e.profileImage} alt={e.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : e.name[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{e.name}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{e.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{ background: C.surface, color: C.muted, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>{e.electricianCode}</span>
                  </td>
                  <td style={{ padding: '13px 14px', fontSize: 12.5, color: C.muted, whiteSpace: 'nowrap' }}>{e.city}, {e.state}</td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{ background: tier.bg, color: tier.color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap' }}>{tier.icon} {e.tier}</span>
                  </td>
                  <td style={{ padding: '13px 14px', fontSize: 14, fontWeight: 800, color: C.text }}>{e.totalPoints.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '13px 14px', fontSize: 13, color: C.muted }}>{e.totalScans}</td>
                  <td style={{ padding: '13px 14px', fontSize: 13, fontWeight: 700, color: '#10B981' }}>₹{e.walletBalance}</td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{ background: status.bg, color: status.color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{status.label}</span>
                  </td>
                  <td style={{ padding: '13px 14px', fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>{e.recentActivity}</td>
                  <td style={{ padding: '13px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setViewing(e)} style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 7, padding: '6px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View</button>
                      {permissions.canEdit && (
                        <button onClick={() => setEditing(e)} style={{ background: '#FFF7ED', color: '#C2410C', border: 'none', borderRadius: 7, padding: '6px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                      )}
                      {permissions.canDelete && (
                        <button onClick={() => handleDelete(e.id)} style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 7, padding: '6px 8px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={13} /></button>
                      )}
                      {!permissions.canEdit && !permissions.canDelete && (
                        <span style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', padding: '6px 8px' }}>Read Only</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>No electricians found</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting filters or search terms</div>
          </div>
        )}
      </div>

      <ConfirmDialog
        show={deleteConfirm.show}
        title="Remove Electrician"
        message="Are you sure you want to remove this electrician? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: null })}
        confirmText="Remove"
        type="danger"
      />
    </div>
  );
}
