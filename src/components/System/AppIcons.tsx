'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, Upload, Image, CheckCircle, Circle } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { appIconApi } from '@/lib/api';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import AlertDialog from '@/components/Shared/AlertDialog';
import type { AppIcon } from '@/lib/types';

const EMPTY_FORM = { name: '', imageUrl: '', isActive: false, displayOrder: 0 };
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL!.replace(/\/api\/v1\/?$/, '');

function normalizeIconUrl(value: string | null | undefined): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (raw.startsWith('blob:') || raw.startsWith('data:')) return raw;
  if (raw.startsWith('/uploads/')) return `${API_ORIGIN}${raw}`;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      if (url.pathname.startsWith('/uploads/')) return `${API_ORIGIN}${url.pathname}`;
      return raw;
    } catch { return raw; }
  }
  if (raw.includes('/uploads/')) return `${API_ORIGIN}${raw.slice(raw.indexOf('/uploads/'))}`;
  return raw;
}

export default function AppIcons({ role }: { role?: import('@/lib/types').AdminRole }) {
  const C = useThemePalette();
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin';
  const canEdit = isSuperAdmin || isAdmin;
  const canDelete = isSuperAdmin;
  const [icons, setIcons] = useState<AppIcon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'error' });

  const loadIcons = async () => {
    try {
      setLoading(true);
      const res = await appIconApi.getAll();
      const data = Array.isArray(res) ? res : (res as any).data ?? [];
      setIcons(data.map((i: any) => ({ ...i, imageUrl: normalizeIconUrl(i.imageUrl) })));
    } catch (err) {
      console.error('Failed to load app icons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadIcons(); }, []);

  const stats = useMemo(() => ({
    total: icons.length,
    active: icons.filter(i => i.isActive).length,
    inactive: icons.filter(i => !i.isActive).length,
  }), [icons]);

  const filteredIcons = useMemo(() => icons.filter(icon =>
    statusFilter === 'all' || (statusFilter === 'active' ? icon.isActive : !icon.isActive)
  ), [icons, statusFilter]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (icon: AppIcon) => {
    setForm({ name: icon.name, imageUrl: icon.imageUrl ?? '', isActive: icon.isActive, displayOrder: icon.displayOrder });
    setEditingId(icon.id);
    setShowModal(true);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await appIconApi.uploadIcon(file);
      setForm(prev => ({ ...prev, imageUrl: url }));
    } catch (err: any) {
      setAlertDialog({ show: true, title: 'Upload Failed', message: err.message || 'Could not upload image', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setAlertDialog({ show: true, title: 'Validation', message: 'Please enter an icon name', type: 'warning' });
      return;
    }
    try {
      const payload: any = { name: form.name, imageUrl: form.imageUrl, isActive: form.isActive, displayOrder: form.displayOrder };
      if (!editingId && !form.isActive) delete payload.isActive;
      if (editingId) {
        await appIconApi.update(editingId, payload);
        setAlertDialog({ show: true, title: 'Success', message: 'App icon updated successfully', type: 'success' });
      } else {
        await appIconApi.create(payload);
        setAlertDialog({ show: true, title: 'Success', message: 'App icon created successfully', type: 'success' });
      }
      setShowModal(false);
      loadIcons();
    } catch (err: any) {
      setAlertDialog({ show: true, title: 'Error', message: err.message || 'Operation failed', type: 'error' });
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await appIconApi.setActive(id);
      setAlertDialog({ show: true, title: 'Success', message: 'App icon set as active', type: 'success' });
      loadIcons();
    } catch (err: any) {
      setAlertDialog({ show: true, title: 'Error', message: err.message || 'Failed to set active', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await appIconApi.delete(deleteId);
      setAlertDialog({ show: true, title: 'Deleted', message: 'App icon deleted successfully', type: 'success' });
      setDeleteId(null);
      loadIcons();
    } catch (err: any) {
      setAlertDialog({ show: true, title: 'Error', message: err.message || 'Delete failed', type: 'error' });
    }
  };

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Alert Dialog */}
      <AlertDialog
        show={alertDialog.show}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog(prev => ({ ...prev, show: false }))}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        show={deleteId !== null}
        title="Delete App Icon"
        message="Are you sure you want to delete this app icon? This action cannot be undone."
        confirmText="Delete"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>App Icons</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Manage app launcher icons — set default SRV logo or upload custom icons</div>
        </div>
        {canEdit && (
          <button onClick={openCreate} style={{
            background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
            border: 'none', borderRadius: 12, padding: '10px 20px',
            color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: `0 4px 14px ${C.red}40`,
          }}>
            <Plus size={16} /> Add Icon
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Icons', value: stats.total, color: '#6366F1', bg: '#EEF2FF', filter: 'all' as const },
          { label: 'Active', value: stats.active, color: '#059669', bg: '#D1FAE5', filter: 'active' as const },
          { label: 'Inactive', value: stats.inactive, color: '#DC2626', bg: '#FEE2E2', filter: 'inactive' as const },
        ].map(s => (
          <button type="button" key={s.label} aria-pressed={statusFilter === s.filter} onClick={() => setStatusFilter(s.filter)} style={{
            background: C.surface, borderRadius: 14, padding: '16px 20px',
            flex: 1, border: `1px solid ${statusFilter === s.filter ? s.color : C.border}`,
            boxShadow: statusFilter === s.filter ? `0 0 0 3px ${s.color}18` : 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.text }}>{s.value}</div>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading icons...</div>
      ) : icons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, borderRadius: 16, border: `2px dashed ${C.border}`, background: C.surface }}>
          <Image size={48} style={{ color: C.muted, marginBottom: 16, opacity: 0.4 }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>No app icons yet</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Add your first app icon to customize the launcher icon</div>
          {canEdit && (
            <button onClick={openCreate} style={{
              background: C.red, border: 'none', borderRadius: 10, padding: '10px 24px',
              color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>
              <Plus size={16} style={{ marginRight: 8 }} />Add First Icon
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filteredIcons.map(icon => (
            <div key={icon.id} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              background: C.surface, borderRadius: 14, padding: '16px 20px',
              border: `1px solid ${icon.isActive ? C.red + '60' : C.border}`,
              boxShadow: icon.isActive ? `0 0 0 2px ${C.red}20` : 'none',
              transition: 'all 0.2s ease',
            }}>
              {/* Icon Preview */}
              <div style={{
                width: 56, height: 56, borderRadius: 12, overflow: 'hidden',
                background: C.bg, flexShrink: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${icon.isActive ? C.red : C.border}`,
              }}>
                {icon.imageUrl ? (
                  <img src={icon.imageUrl} alt={icon.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <Image size={24} style={{ color: C.muted, opacity: 0.5 }} />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{icon.name}</span>
                  <span style={{
                    background: icon.isActive ? C.red + '20' : C.bg,
                    color: icon.isActive ? C.red : C.muted,
                    fontSize: 10, fontWeight: 700, padding: '2px 10px',
                    borderRadius: 20, letterSpacing: '0.3px',
                  }}>{icon.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  {icon.imageUrl ? 'Image uploaded' : 'No image'}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {canEdit && !icon.isActive && (
                  <button onClick={() => handleSetActive(icon.id)} title="Set as active"
                    style={{
                      background: 'transparent', border: `1.5px solid ${C.border}`,
                      borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      color: '#059669', fontWeight: 600, fontSize: 12,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#D1FAE5'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#6EE7B7'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; }}
                  >
                    <CheckCircle size={14} /> Set Active
                  </button>
                )}
                {canEdit && (
                  <button onClick={() => openEdit(icon)} title="Edit"
                    style={{
                      background: 'transparent', border: `1.5px solid ${C.border}`,
                      borderRadius: 10, width: 36, height: 36, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: C.muted, transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = C.bg; (e.currentTarget as HTMLButtonElement).style.borderColor = C.red; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; }}
                  >
                    <Pencil size={14} />
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => setDeleteId(icon.id)} title="Delete"
                    style={{
                      background: 'transparent', border: `1.5px solid ${C.border}`,
                      borderRadius: 10, width: 36, height: 36, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#DC2626', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEE2E2'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#FCA5A5'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: C.modalBg, borderRadius: 20, padding: '28px', width: 480,
            maxWidth: '95vw', boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            border: `1px solid ${C.border}`,
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 20 }}>
              {editingId ? 'Edit App Icon' : 'Add New App Icon'}
            </div>

            {/* Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6 }}>Icon Name</label>
              <input
                type="text" placeholder="e.g. SRV Logo, Festive Icon, Dark Theme..."
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: `1.5px solid ${C.border}`, fontSize: 14,
                  background: C.surface, color: C.text, outline: 'none',
                }}
              />
            </div>

            {/* Image Upload */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6 }}>Icon Image (PNG, JPG, WEBP — 512x512 recommended)</label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 12,
                border: `2px dashed ${C.border}`, background: C.surface,
              }}>
                {form.imageUrl ? (
                  <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: `1px solid ${C.border}` }}>
                    <img src={form.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <Image size={24} style={{ color: C.muted, flexShrink: 0, opacity: 0.5 }} />
                )}
                <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: C.muted }}>
                  {form.imageUrl ? 'Image selected' : 'Click to upload icon image'}
                </div>
                <label style={{
                  background: C.bg, border: `1.5px solid ${C.border}`,
                  borderRadius: 8, padding: '7px 14px', cursor: uploading ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 600, color: C.text,
                  opacity: uploading ? 0.7 : 1,
                }}>
                  <Upload size={14} />
                  {uploading ? 'Uploading...' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={uploading}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Active Toggle */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                <div onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))} style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: form.isActive ? C.red : C.border,
                  position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: 'white',
                    position: 'absolute', top: 2, left: form.isActive ? 22 : 2,
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Set as active icon</span>
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowModal(false)}
                style={{
                  flex: 1, background: C.bg, color: C.muted,
                  border: `1.5px solid ${C.border}`, borderRadius: 12,
                  padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}>
                Cancel
              </button>
              <button onClick={handleSave}
                style={{
                  flex: 1, background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
                  color: 'white', border: 'none', borderRadius: 12,
                  padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  boxShadow: `0 4px 14px ${C.red}40`,
                }}>
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
