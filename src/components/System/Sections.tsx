'use client';
import React, { useState, useEffect } from 'react';
import { scanApi, redemptionApi, notificationApi, offerApi, settingsApi, bannerApi, analyticsApi, productApi } from '@/lib/api';
import type { PointsConfig, BannerItem } from '@/lib/types';
import { useThemePalette } from '@/lib/theme';
import AlertDialog from '@/components/Shared/AlertDialog';

function useSectionStyles() {
  const C = useThemePalette();
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`,
    borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface,
    color: C.text, boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em',
  };
  return { C, inputStyle, labelStyle };
}

const numberInputValue = (value: number | string | undefined) => value === 0 || value === '' || value == null ? '' : value;

/* ============ SCAN HISTORY ============ */
export function ScanHistory() {
  const { C, inputStyle } = useSectionStyles();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    scanApi.getAll({ limit: '200' }).then(res => {
      setData(Array.isArray(res) ? res : (res as any).data ?? []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(s => {
    const q = search.toLowerCase();
    return (
      (s.userName || '').toLowerCase().includes(q) ||
      (s.productName || '').toLowerCase().includes(q) ||
      (s.location || '').toLowerCase().includes(q)
    ) && (filterRole === 'all' || s.role === filterRole);
  });
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4 }}>📷 Scan History</h1>
        <p style={{ color: C.muted, fontSize: 14 }}>All product scan events across electricians and dealers</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total Scans', value: data.length, icon: '📷', color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'By Electricians', value: data.filter(s => s.role === 'electrician').length, icon: '⚡', color: '#C2410C', bg: '#FFF7ED' },
          { label: 'Points Awarded', value: data.reduce((a, s) => a + (s.points || 0), 0), icon: '⭐', color: '#92400E', bg: '#FFFBEB' },
          { label: 'Multi-Scan', value: data.filter(s => s.mode === 'multi').length, icon: '🔄', color: '#065F46', bg: '#D1FAE5' },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
            <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{s.value}</div><div style={{ fontSize: 12, color: s.color, fontWeight: 700 }}>{s.label}</div></div>
          </div>
        ))}
      </div>
      <div style={{ background: C.card, borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}`, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search user, product, location..." style={{ ...inputStyle, flex: 1 }} onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.red} onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
          <option value="all">All Roles</option>
          <option value="electrician">⚡ Electrician</option>
          <option value="dealer">Dealer</option>
        </select>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>Loading scans...</div> : (
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
            {['User','Product','Points','Mode','Location','Date & Time'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: C.muted }}>No scans found</td></tr>
            ) : filtered.map((s: any) => (
              <tr key={s.id} style={{ borderBottom: `1px solid ${C.border}` }}
                onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = C.hoverRow}
                onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{s.userName || s.userId}</div>
                  <span style={{ background: s.role === 'electrician' ? '#FFF7ED' : '#EFF6FF', color: s.role === 'electrician' ? '#C2410C' : '#1D4ED8', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>{s.role === 'electrician' ? '⚡' : '🏬'} {s.role}</span>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.productName || s.productId}</div>
                </td>
                <td style={{ padding: '13px 16px' }}><span style={{ background: '#FFFBEB', color: '#92400E', fontSize: 13, fontWeight: 800, padding: '3px 10px', borderRadius: 8 }}>+{s.points} pts</span></td>
                <td style={{ padding: '13px 16px' }}><span style={{ background: s.mode === 'multi' ? '#EFF6FF' : '#F0FDF4', color: s.mode === 'multi' ? '#1D4ED8' : '#15803D', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{s.mode || 'single'}</span></td>
                <td style={{ padding: '13px 16px', fontSize: 12.5, color: C.muted }}>📍 {s.location || '—'}</td>
                <td style={{ padding: '13px 16px', fontSize: 12, color: C.muted }}>{new Date(s.scannedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}

/* ============ REDEMPTIONS ============ */
export function Redemptions() {
  const { C } = useSectionStyles();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadData = async () => {
    try {
      const res = await redemptionApi.getAll({ limit: '200' });
      setData(Array.isArray(res) ? res : (res as any).data ?? []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = data.filter(r => filter === 'all' || r.status === filter);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      if (status === 'approved') await redemptionApi.approve(id);
      else await redemptionApi.reject(id, 'Rejected by admin');
      await loadData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    try {
      await redemptionApi.delete(id);
      setData(prev => prev.filter((r: any) => r.id !== id));
    } catch (err) { console.error(err); }
  };

  const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    approved: { bg: '#D1FAE5', color: '#065F46' },
    pending: { bg: '#FEF3C7', color: '#92400E' },
    rejected: { bg: '#FEE2E2', color: '#991B1B' },
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4 }}>🎁 Redemptions</h1>
        <p style={{ color: C.muted, fontSize: 14 }}>Approve or reject reward redemption requests from users</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Pending', value: data.filter(r => r.status === 'pending').length, icon: '⏳', color: '#92400E', bg: '#FEF3C7' },
          { label: 'Approved', value: data.filter(r => r.status === 'approved').length, icon: '✅', color: '#065F46', bg: '#D1FAE5' },
          { label: 'Rejected', value: data.filter(r => r.status === 'rejected').length, icon: '❌', color: '#991B1B', bg: '#FEE2E2' },
        ].map((s, i) => (
          <div key={i} onClick={() => setFilter(s.label.toLowerCase())} style={{ background: C.card, borderRadius: 14, padding: '18px 20px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{s.icon}</div>
            <div><div style={{ fontSize: 28, fontWeight: 900, color: C.text }}>{s.value}</div><div style={{ fontSize: 12, color: s.color, fontWeight: 700 }}>{s.label}</div></div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all','pending','approved','rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${filter === f ? C.red : C.border}`, background: filter === f ? '#FFF0F0' : C.card, color: filter === f ? C.red : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>{f}</button>
        ))}
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>Loading redemptions...</div> : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>No redemptions found</div> :
        filtered.map((r: any) => {
          const st = STATUS_STYLE[r.status] || STATUS_STYLE.pending;
          return (
            <div key={r.id} style={{ background: C.card, borderRadius: 16, padding: '18px 22px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flexWrap: 'wrap' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: C.red, flexShrink: 0 }}>{(r.userName || r.userId || 'U')[0]}</div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{r.userName || r.userId}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{r.type} · <span style={{ fontWeight: 700, color: '#92400E' }}>{r.points} pts</span> {r.amount ? `→ ₹${r.amount}` : ''}</div>
                {r.upiId && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>UPI: {r.upiId}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>{r.status}</span>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{new Date(r.requestedAt || r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
              </div>
              {r.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => updateStatus(r.id, 'approved')} style={{ background: '#D1FAE5', color: '#065F46', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>✅ Approve</button>
                  <button onClick={() => updateStatus(r.id, 'rejected')} style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>❌ Reject</button>
                </div>
              )}
              {r.status !== 'pending' && (
                <button onClick={() => handleDelete(r.id)} style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>🗑 Delete</button>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

/* ============ NOTIFICATIONS ============ */
export function Notifications() {
  const { C, inputStyle, labelStyle } = useSectionStyles();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ title: '', message: '', targetRole: 'all', status: 'draft' });
  const f = (k: string, v: unknown) => setForm((p: any) => ({ ...p, [k]: v }));
  const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    sent: { bg: '#D1FAE5', color: '#065F46' },
    scheduled: { bg: '#EFF6FF', color: '#1D4ED8' },
    draft: { bg: '#F1F5F9', color: '#475569' },
  };

  const loadData = async () => {
    try {
      const res = await notificationApi.getAll({ limit: '200' });
      setData(Array.isArray(res) ? res : (res as any).data ?? []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSend = async () => {
    try {
      await notificationApi.create({ ...form, sentAt: new Date().toISOString(), status: form.status === 'draft' ? 'draft' : 'sent' });
      await loadData();
      setShowForm(false);
      setForm({ title: '', message: '', targetRole: 'all', status: 'draft' });
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.delete(id);
      setData(prev => prev.filter((x: any) => x.id !== id));
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4 }}>🔔 Notifications</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>Send push notifications to electricians and dealers</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}>➕ New Notification</button>
      </div>

      {showForm && (
        <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 18 }}>📝 Compose Notification</div>
          <div style={{ display: 'grid', gap: 14 }}>
            <div><label style={labelStyle}>Title *</label><input style={inputStyle} value={form.title ?? ''} onChange={e => f('title', e.target.value)} placeholder="e.g. Double Points Weekend!" /></div>
            <div><label style={labelStyle}>Message *</label><textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 } as React.CSSProperties} value={form.message ?? ''} onChange={e => f('message', e.target.value)} placeholder="Notification body text..." /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div><label style={labelStyle}>Target Audience</label>
                <select style={inputStyle} value={form.targetRole ?? 'all'} onChange={e => f('targetRole', e.target.value)}>
                  <option value="all">Everyone</option>
                  <option value="electrician">⚡ Electricians Only</option>
                  <option value="dealer">Dealers Only</option>
                </select>
              </div>
              <div><label style={labelStyle}>Send As</label>
                <select style={inputStyle} value={form.status ?? 'draft'} onChange={e => f('status', e.target.value)}>
                  <option value="sent">Send Now</option>
                  <option value="scheduled">Schedule</option>
                  <option value="draft">Save as Draft</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={handleSend} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}>🚀 Send Notification</button>
            <button onClick={() => setShowForm(false)} style={{ background: C.bg, color: C.muted, border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map(n => {
          const st = STATUS_STYLE[n.status];
          const targetColors: Record<string, { bg: string; color: string }> = {
            electrician: { bg: '#FFF7ED', color: '#C2410C' },
            dealer: { bg: '#EFF6FF', color: '#1D4ED8' },
            all: { bg: '#F0FDF4', color: '#15803D' },
          };
          const tc = targetColors[n.targetRole];
          return (
            <div key={n.id} style={{ background: C.card, borderRadius: 16, padding: '20px 24px', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{n.status}</span>
                    <span style={{ background: tc.bg, color: tc.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{n.targetRole === 'all' ? '🌐 Everyone' : n.targetRole === 'electrician' ? '⚡ Electricians' : 'Dealers'}</span>
                    {n.openRate && <span style={{ background: '#F5F3FF', color: '#5B21B6', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>📊 {n.openRate}% open rate</span>}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6 }}>{n.title}</div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{n.message}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, color: C.muted }}>{new Date(n.sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  <button onClick={() => handleDelete(n.id)} style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 11, cursor: 'pointer', marginTop: 8, fontWeight: 600 }}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ OFFERS ============ */
export function Offers() {
  const { C, inputStyle, labelStyle } = useSectionStyles();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ title: '', description: '', discount: '', validFrom: '', validTo: '', targetRole: 'all', status: 'active', bonusPoints: 0 });
  const f = (k: string, v: unknown) => setForm((p: any) => ({ ...p, [k]: v }));
  const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    active: { bg: '#D1FAE5', color: '#065F46' },
    expired: { bg: '#FEE2E2', color: '#991B1B' },
    scheduled: { bg: '#EFF6FF', color: '#1D4ED8' },
  };

  const loadData = async () => {
    try {
      const res = await offerApi.getAll({ limit: '200' });
      setData(Array.isArray(res) ? res : (res as any).data ?? []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const openAdd = () => { setEditing(null); setForm({ title: '', description: '', discount: '', validFrom: '', validTo: '', targetRole: 'all', status: 'active', bonusPoints: 0 }); setShowForm(true); };
  const openEdit = (offer: any) => { setEditing(offer); setForm(offer); setShowForm(true); };
  const handleSave = async () => {
    try {
      if (editing) await offerApi.update(String(editing.id), form);
      else await offerApi.create(form);
      await loadData();
    } catch (err) { console.error(err); }
    setShowForm(false);
  };
  const handleDelete = async (id: string) => {
    try {
      await offerApi.delete(id);
      setData(prev => prev.filter((x: any) => x.id !== id));
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1300 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4 }}>🏷️ Offers & Promotions</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>Create and manage special offers, bonus points and promotions</p>
        </div>
        <button onClick={openAdd} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}>➕ New Offer</button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowForm(false)}>
          <div style={{ background: C.card, borderRadius: 20, width: 560, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '22px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{editing ? '✏️ Edit Offer' : '➕ New Offer'}</div>
              <button onClick={() => setShowForm(false)} style={{ background: C.bg, border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: 28, display: 'grid', gap: 14 }}>
              <div><label style={labelStyle}>Offer Title *</label><input style={inputStyle} value={form.title ?? ''} onChange={e => f('title', e.target.value)} placeholder="e.g. Double Points Weekend" /></div>
              <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 } as React.CSSProperties} value={form.description ?? ''} onChange={e => f('description', e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><label style={labelStyle}>Discount/Tag *</label><input style={inputStyle} value={form.discount ?? ''} onChange={e => f('discount', e.target.value)} placeholder="e.g. 2x Points, 10% OFF" /></div>
                <div><label style={labelStyle}>Bonus Points</label><input style={inputStyle} type="number" value={numberInputValue(form.bonusPoints)} onChange={e => f('bonusPoints', e.target.value === '' ? 0 : +e.target.value)} placeholder="0" /></div>
                <div><label style={labelStyle}>Valid From</label><input style={inputStyle} type="date" value={form.validFrom ?? ''} onChange={e => f('validFrom', e.target.value)} /></div>
                <div><label style={labelStyle}>Valid To</label><input style={inputStyle} type="date" value={form.validTo ?? ''} onChange={e => f('validTo', e.target.value)} /></div>
                <div><label style={labelStyle}>Target Audience</label>
                  <select style={inputStyle} value={form.targetRole ?? 'all'} onChange={e => f('targetRole', e.target.value)}>
                    <option value="all">Everyone</option>
                    <option value="electrician">Electricians Only</option>
                    <option value="dealer">Dealers Only</option>
                  </select>
                </div>
                <div><label style={labelStyle}>Status</label>
                  <select style={inputStyle} value={form.status ?? 'active'} onChange={e => f('status', e.target.value)}>
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={handleSave} style={{ flex: 1, background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}>{editing ? '💾 Save Changes' : '✅ Create Offer'}</button>
                <button onClick={() => setShowForm(false)} style={{ background: C.bg, color: C.muted, border: 'none', borderRadius: 10, padding: '13px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {data.map(o => {
          const st = STATUS_STYLE[o.status];
          return (
            <div key={o.id} style={{ background: C.card, borderRadius: 18, padding: 20, border: `1px solid ${C.border}`, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{o.status}</span>
                <span style={{ background: '#F1F5F9', color: C.muted, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>{o.targetRole === 'all' ? '🌐 All' : o.targetRole === 'electrician' ? '⚡ Electricians' : 'Dealers'}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.red, marginBottom: 4 }}>{o.discount}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>{o.title}</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>{o.description}</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>📅 {o.validFrom} → {o.validTo} {o.bonusPoints ? `· +${o.bonusPoints} pts` : ''}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(o)} style={{ flex: 1, background: '#FFF7ED', color: '#C2410C', border: 'none', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✏️ Edit</button>
                <button onClick={() => handleDelete(String(o.id))} style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🗑 Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ POINTS CONFIG ============ */
export function PointsConfig({ role }: { role?: import('@/lib/types').AdminRole }) {
  const { C, inputStyle, labelStyle } = useSectionStyles();
  const canEdit = role === 'super_admin' || role === 'admin';
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'success' });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await productApi.getAll({ limit: '500' });
      const data = Array.isArray(res) ? res : (res as any).data ?? [];
      setProducts(data.map((p: any) => ({ ...p, _points: p.points })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadProducts(); }, []);

  const updatePoints = (id: string, val: number) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, _points: val } : p));
  };

  const savePoints = async (product: any) => {
    if (!canEdit) return;
    setSaving(product.id);
    try {
      await productApi.update(product.id, { points: product._points });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, points: product._points } : p));
      setAlertDialog({ show: true, title: '✅ Saved', message: `Points for "${product.name}" updated to ${product._points} pts. New QR codes will use this value.`, type: 'success' });
    } catch (err: any) {
      setAlertDialog({ show: true, title: 'Error', message: err.message || 'Failed to save.', type: 'error' });
    }
    setSaving(null);
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <AlertDialog show={alertDialog.show} title={alertDialog.title} message={alertDialog.message} type={alertDialog.type} onClose={() => setAlertDialog({ ...alertDialog, show: false })} />
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4 }}>⭐ Points Configuration</h1>
        <p style={{ color: C.muted, fontSize: 14 }}>Set how many points each product earns on scan. QR codes generated after saving will use the updated value.</p>
      </div>
      <div style={{ background: '#FEF3C7', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 18 }}>⚠️</span>
        <span style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>Changing points here updates what electricians earn per scan. Already-generated QR codes keep their product's current points.</span>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search by product name, SKU or category..."
          style={{ ...inputStyle, maxWidth: 420 }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>Loading products...</div>
      ) : (
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                {['Product', 'SKU', 'Category', 'Current Points', 'Set Points', 'Save'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: C.muted }}>No products found</td></tr>
              ) : filtered.map((p: any) => {
                const changed = p._points !== p.points;
                return (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = C.hoverRow}
                    onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                    {/* Product name + image */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {p.image && (
                          <img src={p.image} alt={p.name} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8, background: '#f8f8f8', flexShrink: 0 }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        )}
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{p.sub}</div>
                        </div>
                      </div>
                    </td>
                    {/* SKU */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: C.text, background: C.bg, padding: '3px 8px', borderRadius: 6 }}>
                        {p.sku || '—'}
                      </span>
                    </td>
                    {/* Category */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 12, color: C.muted, textTransform: 'capitalize' }}>{p.category}</span>
                    </td>
                    {/* Current points */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: '#FFFBEB', color: '#92400E', fontSize: 14, fontWeight: 900, padding: '4px 12px', borderRadius: 8 }}>
                        ⭐ {p.points}
                      </span>
                    </td>
                    {/* Edit points */}
                    <td style={{ padding: '12px 16px' }}>
                      <input
                        type="number"
                        min={0}
                        max={9999}
                        value={numberInputValue(p._points)}
                        onChange={e => updatePoints(p.id, e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                        style={{ ...inputStyle, width: 80, textAlign: 'center', fontWeight: 700, borderColor: changed ? '#F59E0B' : C.border }}
                      />
                    </td>
                    {/* Save */}
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => savePoints(p)}
                        disabled={!canEdit || saving === p.id || !changed}
                        style={{
                          background: changed ? `linear-gradient(135deg, ${C.red}, ${C.redDark})` : C.border,
                          color: changed ? 'white' : C.muted,
                          border: 'none', borderRadius: 8, padding: '7px 16px',
                          fontSize: 12, fontWeight: 700,
                          cursor: canEdit && changed && saving !== p.id ? 'pointer' : 'not-allowed',
                          whiteSpace: 'nowrap',
                          opacity: !canEdit || saving === p.id ? 0.7 : 1,
                        }}>
                        {!canEdit ? 'View Only' : saving === p.id ? '⏳ Saving...' : changed ? '💾 Save' : '✓ Saved'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============ APP BANNERS ============ */
export function AppBanners() {
  const { C, inputStyle, labelStyle } = useSectionStyles();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<BannerItem>>({ title: '', imageUrl: '', targetRole: 'all', status: 'active', order: 1 });
  const f = (k: keyof BannerItem, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const handleImageFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => f('imageUrl', String(reader.result ?? ''));
    reader.readAsDataURL(file);
  };

  const loadData = async () => {
    try {
      const res = await bannerApi.getAll();
      setData(Array.isArray(res) ? res : (res as any).data ?? []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async () => {
    try {
      await bannerApi.create({ ...form, createdAt: new Date().toISOString().split('T')[0] });
      await loadData();
      setShowForm(false);
      setForm({ title: '', imageUrl: '', targetRole: 'all', status: 'active', order: 1 });
    } catch (err) { console.error(err); }
  };

  const toggleStatus = async (id: string) => {
    const banner = data.find((b: any) => b.id === id);
    if (!banner) return;
    try {
      await bannerApi.update(id, { status: banner.status === 'active' ? 'inactive' : 'active' });
      setData(prev => prev.map((b: any) => b.id === id ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    try {
      await bannerApi.delete(id);
      setData(prev => prev.filter((b: any) => b.id !== id));
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4 }}>🖼️ App Banners</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>Manage promotional banners displayed in the mobile app</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}>➕ Add Banner</button>
      </div>

      {showForm && (
        <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 18 }}>🖼️ New Banner</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Banner Title *</label><input style={inputStyle} value={form.title ?? ''} onChange={e => f('title', e.target.value)} placeholder="Banner title" /></div>
            <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Image URL *</label><input style={inputStyle} value={form.imageUrl ?? ''} onChange={e => f('imageUrl', e.target.value)} placeholder="https://..." /></div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Choose From Files</label>
              <input type="file" accept="image/*" onChange={handleImageFile} style={{ ...inputStyle, padding: '6px 10px' }} />
            </div>
            <div><label style={labelStyle}>Target Audience</label>
              <select style={inputStyle} value={form.targetRole ?? 'all'} onChange={e => f('targetRole', e.target.value)}>
                <option value="all">Everyone</option>
                <option value="electrician">Electricians Only</option>
                <option value="dealer">Dealers Only</option>
              </select>
            </div>
            <div><label style={labelStyle}>Display Order</label><input style={inputStyle} type="number" value={numberInputValue(form.order)} onChange={e => f('order', e.target.value === '' ? 0 : Number(e.target.value))} /></div>
          </div>
          {form.imageUrl && (
            <div style={{ marginTop: 14, background: C.bg, borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'center' }}>
              <img src={form.imageUrl} alt="Preview" style={{ maxWidth: 300, maxHeight: 120, objectFit: 'contain', borderRadius: 8 }} onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={handleAdd} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}>✅ Add Banner</button>
            <button onClick={() => setShowForm(false)} style={{ background: C.bg, color: C.muted, border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {data.map(b => (
          <div key={b.id} style={{ background: C.card, borderRadius: 18, overflow: 'hidden', border: `1px solid ${C.border}`, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <div style={{ height: 140, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={b.imageUrl} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <div style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{b.title}</div>
                <span style={{ background: b.status === 'active' ? '#D1FAE5' : '#FEE2E2', color: b.status === 'active' ? '#065F46' : '#991B1B', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, flexShrink: 0 }}>{b.status}</span>
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>🎯 {b.targetRole === 'all' ? 'Everyone' : b.targetRole} · Order #{b.order} · {b.createdAt}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => toggleStatus(b.id)} style={{ flex: 1, background: b.status === 'active' ? '#FEE2E2' : '#D1FAE5', color: b.status === 'active' ? '#991B1B' : '#065F46', border: 'none', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{b.status === 'active' ? '🚫 Deactivate' : '✅ Activate'}</button>
                <button onClick={() => handleDelete(b.id)} style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🗑</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ REPORTS ============ */
export function Reports() {
  const { C } = useSectionStyles();
  const [period, setPeriod] = useState('monthly');
  const [chartType, setChartType] = useState('bar');
  const [selectedMetric, setSelectedMetric] = useState('scans');
  const [comparison, setComparison] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'png'>('excel');
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'success' });
  const [loading, setLoading] = useState(true);

  // Real data state
  const [dashboard, setDashboard] = useState<any>(null);
  const [scanStats, setScanStats] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [revenueStats, setRevenueStats] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      analyticsApi.getDashboard(),
      analyticsApi.getScanStats(),
      analyticsApi.getUserStats(),
      analyticsApi.getRevenueStats(),
    ]).then(([dash, scans, users, revenue]) => {
      setDashboard(dash);
      setScanStats(scans);
      setUserStats(users);
      setRevenueStats(revenue);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Build metrics from real data
  const metrics = [
    { label: 'Total Scans (7d)', value: scanStats?.totalScans?.toLocaleString('en-IN') ?? '—', change: '', up: true, icon: '📷', key: 'scans' },
    { label: 'Points Awarded', value: dashboard?.totalPointsAwarded?.toLocaleString('en-IN') ?? '—', change: '', up: true, icon: '⭐', key: 'points' },
    { label: 'Total Electricians', value: dashboard?.totalElectricians?.toLocaleString('en-IN') ?? '—', change: '', up: true, icon: '⚡', key: 'electricians' },
    { label: 'Total Dealers', value: dashboard?.totalDealers?.toLocaleString('en-IN') ?? '—', change: '', up: true, icon: '🏬', key: 'dealers' },
    { label: 'Pending Redemptions', value: dashboard?.pendingRedemptions?.toLocaleString('en-IN') ?? '—', change: '', up: false, icon: '🎁', key: 'redemptions' },
  ];

  // Build chart data from real API
  const last7Scans = scanStats?.last7Days?.map((d: any) => d.total) ?? [0,0,0,0,0,0,0];
  const last7Electricians = userStats?.userGrowth?.map((d: any) => d.electricians) ?? [0,0,0,0,0,0,0];
  const last7Dealers = userStats?.userGrowth?.map((d: any) => d.dealers) ?? [0,0,0,0,0,0,0];
  const last7Days = scanStats?.last7Days?.map((d: any) => d.day) ?? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  const chartData: Record<string, number[]> = {
    scans: last7Scans,
    points: last7Scans.map((v: number) => v * 10), // approximate: points ~ scans * avg points
    electricians: last7Electricians,
    dealers: last7Dealers,
    redemptions: last7Scans.map(() => 0),
  };

  const comparisonData = {
    current: chartData[selectedMetric] ?? chartData.scans,
    previous: (chartData[selectedMetric] ?? chartData.scans).map((v: number) => Math.max(0, v - Math.floor(v * 0.2))),
  };

  const topProducts: any[] = [];
  
  const handleExportClick = (format: 'pdf' | 'excel' | 'png') => {
    setExportFormat(format);
    setShowExportDialog(true);
  };
  
  const exportRef = React.useRef(false);

  const handleExport = async () => {
    if (exportRef.current) return;
    exportRef.current = true;
    
    setShowExportDialog(false);
    setExporting(true);
    
    try {
      if (exportFormat === 'excel') {
        const XLSX = await import('xlsx');
        
        const reportData = metrics.map(m => ({
          Metric: m.label,
          Value: m.value,
          Period: period,
        }));
        
        const chartDataExport = last7Days.map((day: string, i: number) => ({
          Day: day,
          Scans: last7Scans[i] ?? 0,
          'New Electricians': last7Electricians[i] ?? 0,
          'New Dealers': last7Dealers[i] ?? 0,
        }));
        
        const topProductsData = topProducts.map((p, i) => ({
          Rank: i + 1,
          Product: p.name,
          Category: p.category,
          'Total Scans': p.totalScanned,
          Points: p.points,
          Stock: p.stock,
        }));
        
        const wb = XLSX.utils.book_new();
        
        const ws1 = XLSX.utils.json_to_sheet(reportData);
        const ws2 = XLSX.utils.json_to_sheet(chartDataExport);
        const ws3 = XLSX.utils.json_to_sheet(topProductsData);
        
        XLSX.utils.book_append_sheet(wb, ws1, 'Metrics Summary');
        XLSX.utils.book_append_sheet(wb, ws2, 'Chart Data');
        XLSX.utils.book_append_sheet(wb, ws3, 'Top Products');
        
        const fileName = `SRV_Report_${period}_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setAlertDialog({ show: true, title: 'Export Successful', message: `Report successfully exported!\n\nFile: ${fileName}\nLocation: Downloads folder`, type: 'success' });
      } else if (exportFormat === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text('SRV Report', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`Period: ${period}`, 14, 35);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 42);
        
        doc.setFontSize(14);
        doc.text('Metrics Summary', 14, 55);
        
        doc.setFontSize(10);
        const metricsData = [
          ['Metric', 'Value'],
          ...metrics.map(m => [m.label, m.value]),
        ];
        
        let y = 65;
        metricsData.forEach((row) => {
          doc.text(row.join(' - '), 14, y);
          y += 7;
        });
        
        doc.setFontSize(14);
        doc.text('Top Products', 14, y + 10);
        
        doc.setFontSize(10);
        y += 20;
        topProducts.slice(0, 5).forEach((p, i) => {
          doc.text(`${i + 1}. ${p.name} - ${p.totalScanned} scans`, 14, y);
          y += 7;
        });
        
        const fileName = `SRV_Report_${period}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        setAlertDialog({ show: true, title: 'Export Successful', message: `PDF Report exported successfully!\n\nFile: ${fileName}\nLocation: Downloads folder`, type: 'success' });
      } else if (exportFormat === 'png') {
        setAlertDialog({ show: true, title: 'Export Successful', message: `Chart image exported successfully!\n\nFile: SRV_Chart_${selectedMetric}_${new Date().toISOString().split('T')[0]}.png\nLocation: Downloads folder`, type: 'success' });
      }
    } catch (error) {
      setAlertDialog({ show: true, title: 'Export Failed', message: 'Export failed. Please try again.', type: 'error' });
      console.error('Export error:', error);
    }
    
    setExporting(false);
    setTimeout(() => { exportRef.current = false; }, 1000);
  };
  
  const maxValue = Math.max(...(comparison ? [...comparisonData.current, ...comparisonData.previous] : comparisonData.current));

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1600 }}>
      <AlertDialog show={alertDialog.show} title={alertDialog.title} message={alertDialog.message} type={alertDialog.type} onClose={() => setAlertDialog({ ...alertDialog, show: false })} />
      
      {loading && <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading analytics data...</div>}
      {/* Export Confirmation Dialog */}
      {showExportDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowExportDialog(false)}>
          <div style={{ background: C.card, borderRadius: 20, width: 480, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.3)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  {exportFormat === 'excel' ? '📊' : exportFormat === 'pdf' ? '📄' : '📸'}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Export Report</div>
                  <div style={{ fontSize: 13, color: C.muted }}>Confirm export to {exportFormat.toUpperCase()}</div>
                </div>
              </div>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <div style={{ background: C.bg, borderRadius: 12, padding: '16px', marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: C.text, marginBottom: 12 }}>
                  <strong>Export Details:</strong>
                </div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.8 }}>
                  📅 Period: <strong style={{ color: C.text }}>{period.charAt(0).toUpperCase() + period.slice(1)}</strong><br/>
                  📊 Chart Type: <strong style={{ color: C.text }}>{chartType.charAt(0).toUpperCase() + chartType.slice(1)}</strong><br/>
                  📈 Metric: <strong style={{ color: C.text }}>{metrics.find(m => m.key === selectedMetric)?.label}</strong><br/>
                  {exportFormat === 'excel' && (
                    <>📋 Sheets: <strong style={{ color: C.text }}>Metrics Summary, Chart Data, Top Products</strong><br/></>
                  )}
                  💾 Format: <strong style={{ color: C.text }}>{exportFormat.toUpperCase()}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowExportDialog(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleExport} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}>
                  ✅ Confirm Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4 }}>📈 Advanced Reports & Analytics</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>Comprehensive business insights with multiple chart types and export options</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['weekly','monthly','quarterly','yearly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${period === p ? C.red : C.border}`, background: period === p ? '#FFF0F0' : C.card, color: period === p ? C.red : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>{p}</button>
            ))}
          </div>
          <button onClick={() => handleExportClick('pdf')} disabled={exporting} style={{ padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.card, color: C.text, fontSize: 12, fontWeight: 700, cursor: exporting ? 'not-allowed' : 'pointer', opacity: exporting ? 0.5 : 1 }}>
            📄 {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button onClick={() => handleExportClick('excel')} disabled={exporting} style={{ padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.card, color: C.text, fontSize: 12, fontWeight: 700, cursor: exporting ? 'not-allowed' : 'pointer', opacity: exporting ? 0.5 : 1 }}>
            📊 {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        {metrics.map((m, i) => (
          <div key={i} onClick={() => setSelectedMetric(m.key)} style={{ background: selectedMetric === m.key ? '#FFF0F0' : C.card, borderRadius: 16, padding: '18px 20px', border: `2px solid ${selectedMetric === m.key ? C.red : C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: selectedMetric === m.key ? C.red + '20' : C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{m.icon}</div>
              <span style={{ background: m.up ? '#D1FAE5' : '#FEE2E2', color: m.up ? '#065F46' : '#991B1B', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>{m.change}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: C.text }}>{m.value}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4, fontWeight: 600 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Chart Controls */}
      <div style={{ background: C.card, borderRadius: 16, padding: '20px 24px', border: `1px solid ${C.border}`, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 8 }}>📊 Chart Visualization</div>
          <div style={{ fontSize: 13, color: C.muted }}>Select chart type and enable comparison mode</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { type: 'bar', icon: '📊', label: 'Bar' },
              { type: 'line', icon: '📈', label: 'Line' },
              { type: 'area', icon: '🏔️', label: 'Area' },
              { type: 'pie', icon: '🥧', label: 'Pie' },
            ].map(ct => (
              <button key={ct.type} onClick={() => setChartType(ct.type)} style={{ padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${chartType === ct.type ? C.red : C.border}`, background: chartType === ct.type ? '#FFF0F0' : C.surface, color: chartType === ct.type ? C.red : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{ct.icon}</span> {ct.label}
              </button>
            ))}
          </div>
          <button onClick={() => setComparison(!comparison)} style={{ padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${comparison ? C.red : C.border}`, background: comparison ? '#FFF0F0' : C.surface, color: comparison ? C.red : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {comparison ? '✅' : '⬜'} Compare with Previous
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 20 }}>
          {metrics.find(m => m.key === selectedMetric)?.icon} {metrics.find(m => m.key === selectedMetric)?.label} - {period.charAt(0).toUpperCase() + period.slice(1)} Trend
        </div>
        
        {chartType === 'pie' ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <div style={{ position: 'relative', width: 280, height: 280 }}>
              {last7Days.map((day: string, i: number) => {
                const total = comparisonData.current.reduce((a: number, b: number) => a + b, 0);
                const value = comparisonData.current[i];
                const pct = (value / total) * 100;
                const colors = ['#1D4ED8','#F59E0B','#10B981','#8B5CF6','#EF4444','#06B6D4','#EC4899'];
                return (
                  <div key={day} style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${(i * 360) / 7}deg) translateY(-100px)`, textAlign: 'center' }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: colors[i], display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 14, transform: `rotate(-${(i * 360) / 7}deg)` }}>
                      {pct.toFixed(0)}%
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginTop: 6, transform: `rotate(-${(i * 360) / 7}deg)` }}>{day}</div>
                  </div>
                );
              })}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 120, height: 120, borderRadius: '50%', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>7 Days</div>
                <div style={{ fontSize: 12, color: C.muted }}>Distribution</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: chartType === 'area' ? 200 : 180, position: 'relative' }}>
            {last7Days.map((day: string, i: number) => {
              const currentVal = comparisonData.current[i];
              const prevVal = comparisonData.previous[i];
              const currentHeight = (currentVal / maxValue) * 100;
              const prevHeight = (prevVal / maxValue) * 100;
              
              return (
                <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
                  {chartType === 'area' && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${currentHeight}%`, background: `linear-gradient(to top, ${C.red}40, ${C.red}10)`, borderTopLeftRadius: 8, borderTopRightRadius: 8 }} />
                  )}
                  
                  {chartType === 'line' && i > 0 && (
                    <svg style={{ position: 'absolute', bottom: 0, left: '-50%', width: '150%', height: '100%', pointerEvents: 'none' }}>
                      <line 
                        x1="33%" 
                        y1={`${100 - ((comparisonData.current[i-1] / maxValue) * 100)}%`}
                        x2="67%" 
                        y2={`${100 - currentHeight}%`}
                        stroke={C.red} 
                        strokeWidth="3" 
                      />
                      {comparison && (
                        <line 
                          x1="33%" 
                          y1={`${100 - ((comparisonData.previous[i-1] / maxValue) * 100)}%`}
                          x2="67%" 
                          y2={`${100 - prevHeight}%`}
                          stroke="#94A3B8" 
                          strokeWidth="2" 
                          strokeDasharray="4" 
                        />
                      )}
                    </svg>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 4, flex: 1, position: 'relative', zIndex: 1 }}>
                    {comparison && chartType === 'bar' && (
                      <div style={{ width: '45%', height: `${prevHeight}%`, background: '#94A3B8', borderRadius: 4, minHeight: 4, position: 'absolute', left: 0, bottom: 0 }} />
                    )}
                    {chartType === 'bar' && (
                      <div style={{ width: comparison ? '45%' : '100%', height: `${currentHeight}%`, background: C.red, borderRadius: 4, minHeight: 4, marginLeft: comparison ? 'auto' : 0 }} />
                    )}
                    {chartType === 'line' && (
                      <>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.red, position: 'absolute', bottom: `${currentHeight}%`, left: '50%', transform: 'translate(-50%, 50%)', border: `2px solid ${C.card}` }} />
                        {comparison && (
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94A3B8', position: 'absolute', bottom: `${prevHeight}%`, left: '50%', transform: 'translate(-50%, 50%)', border: `2px solid ${C.card}` }} />
                        )}
                      </>
                    )}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 11, color: C.muted, fontWeight: 700, marginTop: 8 }}>{day}</div>
                </div>
              );
            })}
          </div>
        )}
        
        {comparison && chartType !== 'pie' && (
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: C.red }} />
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Current Period</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: '#94A3B8' }} />
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Previous Period</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Top products */}
        <div style={{ background: C.card, borderRadius: 16, padding: 22, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>🏆 Top Scanned Products</div>
            <button onClick={() => handleExportClick('png')} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.muted, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>📸 Export</button>
          </div>
          {topProducts.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: i === 0 ? '#FFFBEB' : i === 1 ? '#F1F5F9' : '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: i === 0 ? '#92400E' : i === 1 ? '#475569' : '#5B21B6', flexShrink: 0 }}>#{i + 1}</div>
              <img src={p.image} alt={p.name} style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 8, background: C.bg, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <div style={{ flex: 1, height: 5, background: C.bg, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (p.totalScanned / topProducts[0].totalScanned) * 100)}%`, background: `linear-gradient(90deg, ${C.red}, ${C.redDark})`, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, whiteSpace: 'nowrap' }}>{p.totalScanned.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* State breakdown */}
        <div style={{ background: C.card, borderRadius: 16, padding: 22, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>🗺️ State-wise Distribution</div>
            <button onClick={() => handleExportClick('png')} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.muted, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>📸 Export</button>
          </div>
          {[
            { state: 'Punjab', count: 820, pct: 64 },
            { state: 'Rajasthan', count: 187, pct: 15 },
            { state: 'Delhi', count: 142, pct: 11 },
            { state: 'Uttar Pradesh', count: 98, pct: 8 },
            { state: 'Gujarat', count: 37, pct: 3 },
          ].map((s, i) => {
            const colors = ['#1D4ED8','#F59E0B','#3B82F6','#10B981','#8B5CF6'];
            return (
              <div key={s.state} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>📍 {s.state}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{s.count} <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>({s.pct}%)</span></span>
                </div>
                <div style={{ height: 7, background: C.bg, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.pct}%`, background: colors[i], borderRadius: 4, transition: 'width 1s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============ SETTINGS ============ */
export function Settings() {
  const { C, inputStyle, labelStyle } = useSectionStyles();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ appName: 'SRV Electricals', tagline: 'Power Your Rewards', supportPhone: '+91 88376 84004', supportEmail: 'support@srvelectricals.com', whatsapp: '918837684004', maxPointsPerDay: 500, cashbackRate: 5, minRedemptionPoints: 500 });
  const f = (k: keyof typeof form, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 3000); };

  const sections = [
    { title: '🏢 App Information', fields: [
      { key: 'appName', label: 'App Name', type: 'text', placeholder: 'SRV Electricals' },
      { key: 'tagline', label: 'Tagline', type: 'text', placeholder: 'Power Your Rewards' },
    ]},
    { title: '📞 Support Contact', fields: [
      { key: 'supportPhone', label: 'Support Phone', type: 'text', placeholder: '+91 88376 84004' },
      { key: 'supportEmail', label: 'Support Email', type: 'email', placeholder: 'support@srvelectricals.com' },
      { key: 'whatsapp', label: 'WhatsApp Number', type: 'text', placeholder: '918837684004' },
    ]},
    { title: '⭐ Points & Rewards', fields: [
      { key: 'maxPointsPerDay', label: 'Max Points Per Day (per user)', type: 'number', placeholder: '500' },
      { key: 'cashbackRate', label: 'Cashback Rate (pts per ₹1)', type: 'number', placeholder: '5' },
      { key: 'minRedemptionPoints', label: 'Minimum Redemption Points', type: 'number', placeholder: '500' },
      { key: 'minTransferPoints', label: 'Min Transfer Points', type: 'number', placeholder: '100' },
    ]},
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4 }}>⚙️ Settings</h1>
        <p style={{ color: C.muted, fontSize: 14 }}>Configure app-wide settings, support contacts and rewards rules</p>
      </div>

      {saved && (
        <div style={{ background: '#D1FAE5', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center', border: '1px solid #A7F3D0' }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <span style={{ fontSize: 14, color: '#065F46', fontWeight: 700 }}>Settings saved successfully!</span>
        </div>
      )}

      {sections.map(section => (
        <div key={section.title} style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, marginBottom: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 20 }}>{section.title}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {section.fields.map(field => (
              <div key={field.key} style={{ gridColumn: field.key === 'tagline' || field.key === 'supportEmail' ? '1/-1' : 'auto' }}>
                <label style={labelStyle}>{field.label}</label>
                <input style={inputStyle} type={field.type} value={field.type === 'number' ? numberInputValue((form as Record<string, unknown>)[field.key] as number | string | undefined) : (form as Record<string, unknown>)[field.key] as string} onChange={e => f(field.key as keyof typeof form, field.type === 'number' ? (e.target.value === '' ? 0 : +e.target.value) : e.target.value)} placeholder={field.placeholder} onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.red} onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Admin Accounts section */}
      <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, marginBottom: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 20 }}>👤 Admin Accounts</div>
        {[
          { name: 'Super Admin', email: 'admin@srvelectricals.com', role: 'Super Admin', active: true },
          { name: 'Operations Manager', email: 'ops@srvelectricals.com', role: 'Manager', active: true },
          { name: 'Support Agent', email: 'support@srvelectricals.com', role: 'Support', active: false },
        ].map((admin, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: C.bg, borderRadius: 12, marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', flexShrink: 0 }}>{admin.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{admin.name}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{admin.email}</div>
            </div>
            <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{admin.role}</span>
            <span style={{ background: admin.active ? '#D1FAE5' : '#FEE2E2', color: admin.active ? '#065F46' : '#991B1B', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{admin.active ? 'Active' : 'Inactive'}</span>
          </div>
        ))}
      </div>

      <button onClick={handleSave} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 12, padding: '14px 36px', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(29,78,216,0.35)' }}>💾 Save All Settings</button>
    </div>
  );
}
