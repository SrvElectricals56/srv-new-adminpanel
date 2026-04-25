'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, Upload, Image, ToggleLeft, ToggleRight } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { bannerApi } from '@/lib/api';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import AlertDialog from '@/components/Shared/AlertDialog';

interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  bgColor: string;
  resizeMode: 'cover' | 'contain';
  isActive: boolean;
  displayOrder: number;
  targetRole: ('Electrician' | 'Dealer' | 'Both')[];
}

const EMPTY_FORM = { title: '', imageUrl: '', bgColor: '#FFFFFF', resizeMode: 'contain' as 'cover' | 'contain', isActive: true, displayOrder: 1, targetRole: ['Both'] as ('Electrician' | 'Dealer' | 'Both')[] };

export default function BannersPage() {
  const C = useThemePalette();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'error' });

  const loadBanners = async () => {
    try {
      setLoading(true);
      const res = await bannerApi.getAll();
      const data = Array.isArray(res) ? res : (res as any).data ?? [];
      setBanners(data.map((b: any) => ({
        id: b.id,
        title: b.title,
        imageUrl: b.imageUrl ?? b.image_url ?? '',
        bgColor: b.bgColor ?? b.bg_color ?? '#FFFFFF',
        resizeMode: b.resizeMode ?? b.resize_mode ?? 'cover',
        isActive: b.isActive ?? b.is_active ?? true,
        displayOrder: b.displayOrder ?? b.display_order ?? 1,
        targetRole: b.targetRole ?? b.target_role ?? ['Both'],
      })));
    } catch (err) {
      console.error('Failed to load banners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBanners(); }, []);

  const stats = useMemo(() => ({
    total: banners.length,
    active: banners.filter(b => b.isActive).length,
    inactive: banners.filter(b => !b.isActive).length,
  }), [banners]);

  const openAdd = () => { setEditingId(null); setForm({ ...EMPTY_FORM, displayOrder: banners.length + 1 }); setShowModal(true); };
  const openEdit = (b: Banner) => { setEditingId(b.id); setForm({ title: b.title, imageUrl: b.imageUrl, bgColor: b.bgColor, resizeMode: b.resizeMode, isActive: b.isActive, displayOrder: b.displayOrder, targetRole: [...b.targetRole] }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setAlertDialog({ show: true, title: 'Validation Error', message: 'Banner Title is required!', type: 'error' });
      return;
    }
    try {
      if (editingId !== null) {
        await bannerApi.update(String(editingId), form);
        setAlertDialog({ show: true, title: 'Success', message: 'Banner updated successfully!', type: 'success' });
      } else {
        await bannerApi.create(form);
        setAlertDialog({ show: true, title: 'Success', message: 'Banner added successfully!', type: 'success' });
      }
      await loadBanners();
    } catch (err) {
      console.error('Failed to save banner:', err);
      setAlertDialog({ show: true, title: 'Error', message: 'Failed to save banner. Please try again.', type: 'error' });
    }
    setShowModal(false);
  };

  const handleToggle = async (id: number) => {
    const banner = banners.find(b => b.id === id);
    if (!banner) return;
    try {
      await bannerApi.update(String(id), { isActive: !banner.isActive });
      setBanners(prev => prev.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b));
    } catch (err) {
      console.error('Failed to toggle banner:', err);
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await bannerApi.delete(String(deleteId));
      setBanners(prev => prev.filter(b => b.id !== deleteId));
    } catch (err) {
      console.error('Failed to delete banner:', err);
    }
    setDeleteId(null);
  };

  const toggleRole = (role: 'Electrician' | 'Dealer' | 'Both') => {
    setForm(f => {
      const has = f.targetRole.includes(role);
      return { ...f, targetRole: has ? f.targetRole.filter(r => r !== role) : [...f.targetRole, role] };
    });
  };

  const inputStyle = { padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' as const };
  const labelStyle = { fontSize: 12, fontWeight: 600 as const, color: C.muted, marginBottom: 5, display: 'block' as const };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 24 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #EA580C, #C2410C)', borderRadius: 16, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Image size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Banner Management</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Manage home screen banners for the app</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Total', value: stats.total, bg: 'rgba(255,255,255,0.15)', color: '#fff' },
            { label: 'Active', value: stats.active, bg: 'rgba(34,197,94,0.2)', color: '#86EFAC' },
            { label: 'Inactive', value: stats.inactive, bg: 'rgba(239,68,68,0.2)', color: '#FCA5A5' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '10px 18px', textAlign: 'center', minWidth: 72 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
          <button onClick={openAdd} style={{ padding: '10px 20px', borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(4px)' }}>
            <Plus size={15} /> Add Banner
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
        {banners.sort((a, b) => a.displayOrder - b.displayOrder).map(banner => (
          <div key={banner.id} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: C.shadow }}>
            {/* Image Preview */}
            <div style={{ height: 160, background: banner.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              {banner.imageUrl ? (
                <img src={banner.imageUrl} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: banner.resizeMode }} />
              ) : (
                <Image size={40} color="#CBD5E1" />
              )}
              <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>#{banner.displayOrder}</div>
              <div style={{ position: 'absolute', top: 8, right: 8, background: banner.isActive ? 'rgba(34,197,94,0.85)' : 'rgba(239,68,68,0.85)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
                {banner.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            {/* Content */}
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>{banner.title}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {banner.targetRole.map(role => (
                  <span key={role} style={{ background: C.accentSoft, color: C.accentText, border: `1px solid ${C.accentSoftBorder}`, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>{role}</span>
                ))}
                <span style={{ background: C.surface, color: C.muted, border: `1px solid ${C.border}`, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>{banner.resizeMode}</span>
              </div>
            </div>
            {/* Actions */}
            <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8 }}>
              <button onClick={() => openEdit(banner)} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <Pencil size={12} /> Edit
              </button>
              <button onClick={() => handleToggle(banner.id)} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: `1px solid ${banner.isActive ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`, background: banner.isActive ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', color: banner.isActive ? '#DC2626' : '#16A34A', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                {banner.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                {banner.isActive ? 'Disable' : 'Enable'}
              </button>
              <button onClick={() => setDeleteId(banner.id)} style={{ width: 34, height: 34, borderRadius: 7, border: `1px solid ${C.dangerBorder}`, background: C.dangerBg, color: C.dangerText, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: C.muted, fontSize: 14 }}>No banners found. Add your first banner!</div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.card, borderRadius: 18, width: 520, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.3)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{editingId !== null ? 'Edit Banner' : 'Add Banner'}</div>
              <button onClick={() => setShowModal(false)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Banner Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Summer Sale" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Image URL</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." style={{ ...inputStyle, flex: 1 }} />
                  <label style={{ padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' as const }}>
                    <Upload size={13} /> Upload
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      // Show local preview immediately
                      const localPreview = URL.createObjectURL(file);
                      setForm(prev => ({ ...prev, imageUrl: localPreview }));
                      try {
                        // Upload to server and get permanent URL
                        const uploadedUrl = await bannerApi.uploadImage(file);
                        setForm(prev => ({ ...prev, imageUrl: uploadedUrl }));
                        URL.revokeObjectURL(localPreview);
                      } catch {
                        setAlertDialog({ show: true, title: 'Upload Failed', message: 'Image upload failed. Please use a direct URL instead.', type: 'error' });
                        setForm(prev => ({ ...prev, imageUrl: '' }));
                        URL.revokeObjectURL(localPreview);
                      }
                    }} />
                  </label>
                </div>
                {form.imageUrl && (
                  <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}`, height: 100, background: form.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={form.imageUrl} alt="preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: form.resizeMode }} />
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Background Color</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={form.bgColor} onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))} style={{ width: 40, height: 36, borderRadius: 6, border: `1px solid ${C.border}`, cursor: 'pointer', padding: 2 }} />
                    <input value={form.bgColor} onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Resize Mode</label>
                  <select value={form.resizeMode} onChange={e => setForm(f => ({ ...f, resizeMode: e.target.value as 'cover' | 'contain' }))} style={inputStyle}>
                    <option value="contain">Contain</option>
                    <option value="cover">Cover</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Display Order</label>
                  <input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: Number(e.target.value) }))} min={1} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
                  <input type="checkbox" id="banner-active" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: C.red }} />
                  <label htmlFor="banner-active" style={{ fontSize: 13, color: C.text, cursor: 'pointer', fontWeight: 600 }}>Active</label>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Target Role</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['Electrician', 'Dealer', 'Both'] as const).map(role => (
                    <label key={role} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: C.text }}>
                      <input type="checkbox" checked={form.targetRole.includes(role)} onChange={() => toggleRole(role)} style={{ accentColor: C.red }} />
                      {role}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #EA580C, #C2410C)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {editingId !== null ? 'Save Changes' : 'Add Banner'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        show={deleteId !== null}
        title="Delete Banner"
        message={`Are you sure you want to delete "${banners.find(b => b.id === deleteId)?.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        confirmText="Delete"
        type="danger"
      />

      <AlertDialog
        show={alertDialog.show}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog({ ...alertDialog, show: false })}
      />
    </div>
  );
}
