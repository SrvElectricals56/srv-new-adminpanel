'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Star, Users, Zap, Store } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { testimonialApi } from '@/lib/api';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import AlertDialog from '@/components/Shared/AlertDialog';

type UserCategory = 'all' | 'electrician' | 'dealer';

interface Testimonial {
  id: number;
  personName: string;
  initials: string;
  location: string;
  tier: string;
  yearsConnected: number;
  quote: string;
  highlight: string;
  gradientColors: [string, string, string];
  ringColor: string;
  isActive: boolean;
  displayOrder: number;
  userCategory: UserCategory;
}

const EMPTY_FORM = {
  personName: '', initials: '', location: '', tier: 'Silver', yearsConnected: 1,
  quote: '', highlight: '',
  gradientColors: ['#6366F1', '#4338CA', '#3730A3'] as [string, string, string],
  ringColor: '#6366F1', isActive: true, displayOrder: 1,
  userCategory: 'all' as UserCategory,
};

const TABS: { id: UserCategory; label: string; Icon: any; color: string; bg: string }[] = [
  { id: 'all', label: 'All Users', Icon: Users, color: '#7C3AED', bg: '#F5F3FF' },
  { id: 'electrician', label: 'Electricians', Icon: Zap, color: '#1D4ED8', bg: '#EFF6FF' },
  { id: 'dealer', label: 'Dealers', Icon: Store, color: '#065F46', bg: '#D1FAE5' },
];

const tierColors: Record<string, { bg: string; color: string }> = {
  Bronze: { bg: 'rgba(180,83,9,0.15)', color: '#B45309' },
  Silver: { bg: 'rgba(100,116,139,0.15)', color: '#64748B' },
  Gold: { bg: 'rgba(245,158,11,0.15)', color: '#D97706' },
  Platinum: { bg: 'rgba(99,102,241,0.15)', color: '#6366F1' },
  Diamond: { bg: 'rgba(59,130,246,0.15)', color: '#1D4ED8' },
};

export default function Testimonials() {
  const C = useThemePalette();
  const [activeTab, setActiveTab] = useState<UserCategory>('all');
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'error' });

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      const res = await testimonialApi.getAll({ limit: '200' });
      const data = Array.isArray(res) ? res : (res as any).data ?? [];
      setTestimonials(data.map((t: any) => ({
        id: t.id,
        personName: t.personName ?? t.person_name ?? '',
        initials: t.initials ?? '',
        location: t.location ?? '',
        tier: t.tier ?? 'Silver',
        yearsConnected: t.yearsConnected ?? t.years_connected ?? 1,
        quote: t.quote ?? '',
        highlight: t.highlight ?? '',
        gradientColors: t.gradientColors ?? t.gradient_colors ?? ['#6366F1', '#4338CA', '#3730A3'],
        ringColor: t.ringColor ?? t.ring_color ?? '#6366F1',
        isActive: t.isActive ?? t.is_active ?? true,
        displayOrder: t.displayOrder ?? t.display_order ?? 1,
        userCategory: (t.userCategory ?? t.user_category ?? 'all') as UserCategory,
      })));
    } catch (err) {
      console.error('Failed to load testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTestimonials(); }, []);

  // Filter by active tab
  const filtered = useMemo(() =>
    testimonials
      .filter(t => activeTab === 'all' ? true : t.userCategory === activeTab)
      .sort((a, b) => a.displayOrder - b.displayOrder),
    [testimonials, activeTab]
  );

  const stats = useMemo(() => ({
    all: testimonials.length,
    electrician: testimonials.filter(t => t.userCategory === 'electrician').length,
    dealer: testimonials.filter(t => t.userCategory === 'dealer').length,
    active: testimonials.filter(t => t.isActive).length,
  }), [testimonials]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, displayOrder: filtered.length + 1, userCategory: activeTab });
    setShowModal(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditingId(t.id);
    setForm({ personName: t.personName, initials: t.initials, location: t.location, tier: t.tier, yearsConnected: t.yearsConnected, quote: t.quote, highlight: t.highlight, gradientColors: [...t.gradientColors] as [string, string, string], ringColor: t.ringColor, isActive: t.isActive, displayOrder: t.displayOrder, userCategory: t.userCategory });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.personName.trim()) { setAlertDialog({ show: true, title: 'Validation Error', message: 'Person Name is required!', type: 'error' }); return; }
    if (!form.quote.trim()) { setAlertDialog({ show: true, title: 'Validation Error', message: 'Quote is required!', type: 'error' }); return; }
    try {
      if (editingId !== null) {
        await testimonialApi.update(String(editingId), form);
      } else {
        await testimonialApi.create(form);
      }
      await loadTestimonials();
      setAlertDialog({ show: true, title: 'Success', message: editingId !== null ? 'Testimonial updated!' : 'Testimonial added!', type: 'success' });
    } catch (err) {
      setAlertDialog({ show: true, title: 'Error', message: 'Failed to save testimonial.', type: 'error' });
    }
    setShowModal(false);
  };

  const handleToggle = async (id: number) => {
    const t = testimonials.find(x => x.id === id);
    if (!t) return;
    try {
      await testimonialApi.update(String(id), { isActive: !t.isActive });
      setTestimonials(prev => prev.map(x => x.id === id ? { ...x, isActive: !x.isActive } : x));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await testimonialApi.delete(String(deleteId));
      setTestimonials(prev => prev.filter(t => t.id !== deleteId));
    } catch (err) { console.error(err); }
    setDeleteId(null);
  };

  const inputStyle = { padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' as const };
  const labelStyle = { fontSize: 12, fontWeight: 600 as const, color: C.muted, marginBottom: 5, display: 'block' as const };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 24 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #BE185D, #EC4899)', borderRadius: 16, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Testimonials Management</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Manage app testimonials by user type</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Total', value: stats.all, bg: 'rgba(255,255,255,0.15)', color: '#fff' },
            { label: 'Active', value: stats.active, bg: 'rgba(34,197,94,0.2)', color: '#86EFAC' },
            { label: 'Electricians', value: stats.electrician, bg: 'rgba(59,130,246,0.2)', color: '#93C5FD' },
            { label: 'Dealers', value: stats.dealer, bg: 'rgba(16,185,129,0.2)', color: '#6EE7B7' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '10px 18px', textAlign: 'center', minWidth: 72 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
          <button onClick={openAdd} style={{ padding: '10px 20px', borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={15} /> Add Testimonial
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: `2px solid ${activeTab === tab.id ? tab.color : C.border}`, background: activeTab === tab.id ? tab.bg : C.card, color: activeTab === tab.id ? tab.color : C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            <tab.Icon size={15} />
            {tab.label}
            <span style={{ background: activeTab === tab.id ? tab.color : C.border, color: activeTab === tab.id ? '#fff' : C.muted, fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 20 }}>
              {tab.id === 'all' ? stats.all : tab.id === 'electrician' ? stats.electrician : stats.dealer}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading testimonials...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          {filtered.map(t => (
            <div key={t.id} style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: C.shadow }}>
              <div style={{ height: 6, background: `linear-gradient(90deg, ${t.gradientColors[0]}, ${t.gradientColors[1]}, ${t.gradientColors[2]})` }} />
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${t.gradientColors[0]}, ${t.gradientColors[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', border: `3px solid ${t.ringColor}`, flexShrink: 0 }}>
                    {t.initials || t.personName[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t.personName}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{t.location}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      <span style={{ background: tierColors[t.tier]?.bg || C.surface, color: tierColors[t.tier]?.color || C.muted, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6 }}>{t.tier}</span>
                      <span style={{ background: C.surface, color: C.muted, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 6, border: `1px solid ${C.border}` }}>{t.yearsConnected}y</span>
                      {/* User category badge */}
                      <span style={{ background: t.userCategory === 'electrician' ? '#EFF6FF' : t.userCategory === 'dealer' ? '#D1FAE5' : '#F5F3FF', color: t.userCategory === 'electrician' ? '#1D4ED8' : t.userCategory === 'dealer' ? '#065F46' : '#7C3AED', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6 }}>
                        {t.userCategory === 'electrician' ? '⚡ Electrician' : t.userCategory === 'dealer' ? '🏬 Dealer' : '👥 All'}
                      </span>
                      <span style={{ background: t.isActive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: t.isActive ? '#16A34A' : '#DC2626', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6 }}>{t.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                  "{t.quote}"
                </div>
                {t.highlight && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: t.gradientColors[0], background: `${t.gradientColors[0]}18`, padding: '4px 10px', borderRadius: 6, marginBottom: 12 }}>
                    ✨ {t.highlight}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                  <button onClick={() => openEdit(t)} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <Pencil size={12} /> Edit
                  </button>
                  <button onClick={() => handleToggle(t.id)} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: `1px solid ${t.isActive ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`, background: t.isActive ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', color: t.isActive ? '#DC2626' : '#16A34A', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    {t.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                    {t.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => setDeleteId(t.id)} style={{ width: 34, height: 34, borderRadius: 7, border: `1px solid ${C.dangerBorder}`, background: C.dangerBg, color: C.dangerText, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: C.muted }}>
              <Star size={40} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
              <div style={{ fontSize: 15, fontWeight: 700 }}>No testimonials for {TABS.find(t => t.id === activeTab)?.label}</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Click "Add Testimonial" to create one</div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.card, borderRadius: 18, width: 580, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.3)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{editingId !== null ? 'Edit Testimonial' : 'Add Testimonial'}</div>
              <button onClick={() => setShowModal(false)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* User Category */}
              <div>
                <label style={labelStyle}>For Which Users *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {TABS.map(tab => (
                    <button key={tab.id} type="button" onClick={() => setForm(f => ({ ...f, userCategory: tab.id }))}
                      style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `2px solid ${form.userCategory === tab.id ? tab.color : C.border}`, background: form.userCategory === tab.id ? tab.bg : C.bg, color: form.userCategory === tab.id ? tab.color : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <tab.Icon size={13} /> {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Person Name *</label>
                  <input value={form.personName} onChange={e => setForm(f => ({ ...f, personName: e.target.value }))} placeholder="Full name" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Initials (2-3 chars)</label>
                  <input value={form.initials} onChange={e => setForm(f => ({ ...f, initials: e.target.value.slice(0, 3).toUpperCase() }))} placeholder="e.g. RK" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Location</label>
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City, State" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Tier</label>
                  <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))} style={inputStyle}>
                    <option>Bronze</option><option>Silver</option><option>Gold</option><option>Platinum</option><option>Diamond</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Years Connected</label>
                  <input type="number" value={form.yearsConnected} onChange={e => setForm(f => ({ ...f, yearsConnected: Number(e.target.value) }))} min={1} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Display Order</label>
                  <input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: Number(e.target.value) }))} min={1} style={inputStyle} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Quote *</label>
                  <span style={{ fontSize: 11, color: form.quote.length > 180 ? '#DC2626' : C.muted }}>{form.quote.length}/200</span>
                </div>
                <textarea value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value.slice(0, 200) }))} placeholder="Testimonial quote..." rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Highlight</label>
                  <span style={{ fontSize: 11, color: form.highlight.length > 55 ? '#DC2626' : C.muted }}>{form.highlight.length}/60</span>
                </div>
                <input value={form.highlight} onChange={e => setForm(f => ({ ...f, highlight: e.target.value.slice(0, 60) }))} placeholder="e.g. Earned ₹15,000 in rewards" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Gradient Colors</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {([0, 1, 2] as const).map(i => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="color" value={form.gradientColors[i]} onChange={e => { const c = [...form.gradientColors] as [string, string, string]; c[i] = e.target.value; setForm(f => ({ ...f, gradientColors: c })); }} style={{ width: 36, height: 36, borderRadius: 6, border: `1px solid ${C.border}`, cursor: 'pointer', padding: 2 }} />
                      <span style={{ fontSize: 11, color: C.muted }}>Color {i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Ring Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="color" value={form.ringColor} onChange={e => setForm(f => ({ ...f, ringColor: e.target.value }))} style={{ width: 36, height: 36, borderRadius: 6, border: `1px solid ${C.border}`, cursor: 'pointer', padding: 2 }} />
                  <input value={form.ringColor} onChange={e => setForm(f => ({ ...f, ringColor: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="test-active" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: C.red }} />
                <label htmlFor="test-active" style={{ fontSize: 13, color: C.text, cursor: 'pointer', fontWeight: 600 }}>Active</label>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #BE185D, #EC4899)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {editingId !== null ? 'Save Changes' : 'Add Testimonial'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog show={deleteId !== null} title="Delete Testimonial" message={`Delete testimonial from "${testimonials.find(t => t.id === deleteId)?.personName}"?`} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} confirmText="Delete" type="danger" />
      <AlertDialog show={alertDialog.show} title={alertDialog.title} message={alertDialog.message} type={alertDialog.type} onClose={() => setAlertDialog({ ...alertDialog, show: false })} />
    </div>
  );
}
