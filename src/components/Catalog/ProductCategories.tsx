'use client';

import { useState, useMemo, useEffect } from 'react';
import { Tag, Plus, Pencil, Trash2, Search, ImageIcon, Upload, ToggleLeft, ToggleRight } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { productApi } from '@/lib/api';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import ExportModal from '@/components/Shared/ExportModal';
import AlertDialog from '@/components/Shared/AlertDialog';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  isActive: boolean;
  sortOrder: number;
}

const toSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  image: '',
  productCount: 0,
  isActive: true,
  sortOrder: 1,
};

export default function ProductCategories({ onNavigate }: { onNavigate?: (page: string, category?: string) => void }) {
  const C = useThemePalette();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'error' });

  // Load categories from products API — derive unique categories
  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await productApi.getAll({ limit: '500' });
      const products = Array.isArray(res) ? res : (res as any).data ?? [];
      // Group by category
      const catMap = new Map<string, { count: number; image: string; isActive: boolean }>();
      products.forEach((p: any) => {
        const cat = p.category ?? 'Uncategorized';
        if (!catMap.has(cat)) {
          catMap.set(cat, { count: 0, image: p.image ?? '', isActive: p.isActive ?? true });
        }
        const entry = catMap.get(cat)!;
        entry.count++;
        if (!entry.image && p.image) entry.image = p.image;
      });
      const derived: Category[] = Array.from(catMap.entries()).map(([name, val], i) => ({
        id: i + 1,
        name,
        slug: toSlug(name),
        description: '',
        image: val.image,
        productCount: val.count,
        isActive: val.isActive,
        sortOrder: i + 1,
      }));
      setCategories(derived);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return categories.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
  }, [categories, search]);

  const totalCount = categories.length;
  const activeCount = categories.filter(c => c.isActive).length;
  const inactiveCount = totalCount - activeCount;

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, sortOrder: categories.length + 1 });
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      productCount: cat.productCount,
      isActive: cat.isActive,
      sortOrder: cat.sortOrder,
    });
    setShowModal(true);
  };

  const handleNameChange = (val: string) => {
    setForm(f => ({ ...f, name: val, slug: toSlug(val) }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setAlertDialog({ show: true, title: 'Validation Error', message: 'Category Name is required!', type: 'error' });
      return;
    }
    if (editingId !== null) {
      // Update local state only (categories are derived from products)
      setCategories(prev => prev.map(c => c.id === editingId ? { ...c, ...form } : c));
      setAlertDialog({ show: true, title: 'Success', message: 'Category updated!', type: 'success' });
    } else {
      const newId = Math.max(0, ...categories.map(c => c.id)) + 1;
      setCategories(prev => [...prev, { id: newId, ...form }]);
      setAlertDialog({ show: true, title: 'Success', message: 'Category added!', type: 'success' });
    }
    setShowModal(false);
  };

  const handleToggle = (id: number) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const handleDelete = () => {
    if (deleteId === null) return;
    setCategories(prev => prev.filter(c => c.id !== deleteId));
    setDeleteId(null);
  };

  const getExportData = () =>
    filtered.map(c => ({
      ID: c.id,
      Name: c.name,
      Slug: c.slug,
      Description: c.description,
      'Product Count': c.productCount,
      Status: c.isActive ? 'Active' : 'Inactive',
      'Sort Order': c.sortOrder,
      Image: c.image,
    }));

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: C.inputBg,
    color: C.text,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: C.muted,
    marginBottom: 5,
    display: 'block' as const,
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '24px' }}>

      {/* Header Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${C.sidebar}, ${C.sidebar}cc)`,
        borderRadius: 16,
        padding: '24px 28px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Tag size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Product Categories</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
              Manage your electrical product categories
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: totalCount, bg: 'rgba(255,255,255,0.15)', color: '#fff' },
            { label: 'Active', value: activeCount, bg: 'rgba(34,197,94,0.2)', color: '#86efac' },
            { label: 'Inactive', value: inactiveCount, bg: 'rgba(239,68,68,0.2)', color: '#fca5a5' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: stat.bg,
              borderRadius: 10,
              padding: '10px 18px',
              textAlign: 'center',
              minWidth: 72,
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 24, flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} color={C.muted} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search categories..."
            style={{ ...inputStyle, paddingLeft: 34 }}
          />
        </div>        <button
          onClick={() => setShowExport(true)}
          style={{
            padding: '9px 18px', borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.card, color: C.text,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <Upload size={14} /> Export
        </button>
        <button
          onClick={openAdd}
          style={{
            padding: '9px 18px', borderRadius: 8,
            border: 'none',
            background: C.red, color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <Plus size={14} /> Add Category
        </button>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 18,
      }}>
        {filtered.map(cat => (
          <div key={cat.id} style={{
            background: C.card,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
            boxShadow: C.shadow,
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Image area - clickable to view products */}
            <div
              onClick={() => onNavigate && onNavigate('products', cat.name)}
              style={{ position: 'relative', height: 140, background: C.inputBg, overflow: 'hidden', cursor: onNavigate ? 'pointer' : 'default' }}
              title={`View ${cat.name} products`}
            >
              {cat.image ? (
                <img
                  src={cat.image}
                  alt={cat.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={36} color={C.muted} />
                </div>
              )}
              {/* Sort order badge */}
              <div style={{
                position: 'absolute', top: 8, left: 8,
                background: C.sidebar, color: '#fff',
                fontSize: 11, fontWeight: 700,
                padding: '2px 8px', borderRadius: 6,
              }}>
                #{cat.sortOrder}
              </div>
              {/* Active badge */}
              <div style={{
                position: 'absolute', top: 8, right: 8,
                background: cat.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                color: cat.isActive ? '#16a34a' : '#dc2626',
                border: `1px solid ${cat.isActive ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
                fontSize: 10, fontWeight: 700,
                padding: '2px 8px', borderRadius: 6,
              }}>
                {cat.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{cat.name}</div>
              <div style={{
                fontFamily: 'monospace', fontSize: 11,
                color: C.muted, background: C.inputBg,
                padding: '2px 7px', borderRadius: 5,
                display: 'inline-block', alignSelf: 'flex-start',
              }}>
                /{cat.slug}
              </div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, flex: 1 }}>
                {cat.description}
              </div>
              <div
                onClick={() => onNavigate && onNavigate('products', cat.name)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: C.accentSoft, color: C.accentText,
                  border: `1px solid ${C.accentSoftBorder}`,
                  fontSize: 11, fontWeight: 600,
                  padding: '3px 9px', borderRadius: 6,
                  alignSelf: 'flex-start',
                  cursor: onNavigate ? 'pointer' : 'default',
                }}
                title={`View ${cat.productCount} products in ${cat.name}`}
              >
                <Tag size={10} /> {cat.productCount} products {onNavigate ? '→' : ''}
              </div>
            </div>

            {/* Actions */}
            <div style={{
              padding: '10px 16px',
              borderTop: `1px solid ${C.border}`,
              display: 'flex', gap: 8,
            }}>
              <button
                onClick={() => openEdit(cat)}
                title="Edit"
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 7,
                  border: `1px solid ${C.border}`,
                  background: C.bg, color: C.text,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                }}
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                onClick={() => handleToggle(cat.id)}
                title={cat.isActive ? 'Disable' : 'Enable'}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 7,
                  border: `1px solid ${cat.isActive ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                  background: cat.isActive ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                  color: cat.isActive ? '#dc2626' : '#16a34a',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                }}
              >
                {cat.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                {cat.isActive ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={() => setDeleteId(cat.id)}
                title="Delete"
                style={{
                  width: 34, height: 34, borderRadius: 7,
                  border: `1px solid ${C.dangerBorder}`,
                  background: C.dangerBg, color: C.dangerText,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center', padding: '60px 20px',
            color: C.muted, fontSize: 14,
          }}>
            No categories found.
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: C.overlay,
            backdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: C.card,
              borderRadius: 18,
              width: 520,
              maxWidth: '95vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 70px rgba(0,0,0,0.3)',
              border: `1px solid ${C.border}`,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: C.accentSoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Tag size={18} color={C.accentText} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
                  {editingId !== null ? 'Edit Category' : 'Add Category'}
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 8, width: 32, height: 32,
                  cursor: 'pointer', color: C.muted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}
              >✕</button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Name */}
              <div>
                <label style={labelStyle}>Name *</label>
                <input
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. Fan Box"
                  style={inputStyle}
                />
              </div>

              {/* Slug */}
              <div>
                <label style={labelStyle}>Slug</label>
                <input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="auto-generated"
                  style={{ ...inputStyle, fontFamily: 'monospace' }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Short description of this category"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' as const }}
                />
              </div>

              {/* Image URL */}
              <div>
                <label style={labelStyle}>Image URL</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={form.image}
                    onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                    placeholder="https://..."
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <label style={{
                    padding: '9px 12px', borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.bg, color: C.muted,
                    cursor: 'pointer', fontSize: 12,
                    display: 'flex', alignItems: 'center', gap: 5,
                    whiteSpace: 'nowrap' as const,
                  }}>
                    <Upload size={13} /> Upload
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) setForm(f => ({ ...f, image: URL.createObjectURL(file) }));
                    }} />
                  </label>
                </div>
                {form.image && (
                  <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}`, height: 80, background: C.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={form.image} alt="preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                )}
              </div>

              {/* Sort Order + Product Count */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                    min={1}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Product Count</label>
                  <input
                    type="number"
                    value={form.productCount}
                    onChange={e => setForm(f => ({ ...f, productCount: Number(e.target.value) }))}
                    min={0}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Active toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="cat-active"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: C.red }}
                />
                <label htmlFor="cat-active" style={{ fontSize: 13, color: C.text, cursor: 'pointer', fontWeight: 600 }}>
                  Active
                </label>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: `1px solid ${C.border}`,
              display: 'flex', gap: 10, justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '9px 20px', borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.bg, color: C.muted,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '9px 20px', borderRadius: 8,
                  border: 'none',
                  background: C.red, color: '#fff',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {editingId !== null ? 'Save Changes' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        show={deleteId !== null}
        title="Delete Category"
        message={`Are you sure you want to delete "${categories.find(c => c.id === deleteId)?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Alert Dialog */}
      <AlertDialog
        show={alertDialog.show}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog({ ...alertDialog, show: false })}
      />

      {/* Export Modal */}
      <ExportModal
        show={showExport}
        onClose={() => setShowExport(false)}
        title="Product Categories"
        getData={getExportData}
        fileName="product-categories"
      />
    </div>
  );
}
