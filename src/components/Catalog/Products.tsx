'use client';
import React, { useState, useEffect } from 'react';
import { Package, Box, Plus, CheckCircle, ScanLine, AlertTriangle, Star, Ban, SlidersHorizontal } from 'lucide-react';
import type { Product, AdminRole } from '@/lib/types';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAppContext } from '@/lib/appContext';
import { useThemePalette } from '@/lib/theme';
import { productApi } from '@/lib/api';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import AlertDialog from '@/components/Shared/AlertDialog';
import { I } from '@/lib/iconMap';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL!.replace(/\/api\/v1\/?$/, '');

function normalizeImageUrl(value: string | null | undefined): string {
  const raw = String(value ?? '').trim();
  if (!raw || raw.startsWith('blob:') || raw.startsWith('data:')) return raw;
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

interface ProductsProps {
  role: AdminRole;
  initialCategory?: string;
  onCategoryUsed?: () => void;
}

const CATEGORIES_FALLBACK = ['Fan Box','Concealed Box','Modular Box','Junction Box','Surface Box','MCB Box','Change Over','Fan Rods','Kitkat Fuses','Bus Bar Premium','Bus Bar Super','Main Switch Fuse Units','Junction Box','PVC CONDUIT BEND','PVC CONDUIT PIPE','VENTOGUARD','General'];

function ProductModal({ product, onClose, onEdit, canEdit }: { product: Product; onClose: () => void; onEdit: () => void; canEdit: boolean }) {
  const C = useThemePalette();
  const mouseDownInside = React.useRef(false);
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: C.overlay, backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onMouseDown={() => { mouseDownInside.current = false; }}
      onMouseUp={() => { if (!mouseDownInside.current) onClose(); }}
    >
      <div
        style={{ background: C.card, borderRadius: 20, width: 500, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }}
        onMouseDown={e => { e.stopPropagation(); mouseDownInside.current = true; }}
        onMouseUp={e => e.stopPropagation()}
      >
        <div style={{ padding: '22px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Product Details</div>
          <button onClick={onClose} style={{ background: C.bg, border: 'none', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 20, background: C.bg, borderRadius: 16, padding: 20, minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {product.image ? (
              <img src={normalizeImageUrl(product.image)} alt={product.name} style={{ width: 160, height: 160, objectFit: 'contain' }} onError={e => { const t = e.currentTarget; t.style.display = 'none'; t.parentElement!.innerHTML = '<svg width=\"48\" height=\"48\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\"/><polyline points=\"3.27 6.96 12 12.01 20.73 6.96\"/><line x1=\"12\" y1=\"22.08\" x2=\"12\" y2=\"12\"/></svg>'; }} />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 160 }}><Box size={48} /></div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {product.badge && <span style={{ background: '#FFF0F0', color: C.red, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{product.badge}</span>}
            <span style={{ background: product.isActive ? '#D1FAE5' : '#FEE2E2', color: product.isActive ? '#065F46' : '#991B1B', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{product.isActive ? 'Active' : 'Inactive'}</span>
            <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{product.category}</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>{product.name}</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>{product.sub}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Price', value: product.price, icon: 'DollarSign', color: '#059669', bg: '#D1FAE5' },
              { label: 'Points', value: `${product.points} pts`, icon: 'Star', color: '#D97706', bg: '#FEF3C7' },
              { label: 'Stock', value: product.stock.toLocaleString('en-IN'), icon: 'Package', color: '#1D4ED8', bg: '#EFF6FF' },
              { label: 'Total Scanned', value: product.totalScanned.toLocaleString('en-IN'), icon: 'Camera', color: '#7C3AED', bg: '#F5F3FF' },
              { label: 'SKU', value: product.sku || '—', icon: 'Bookmark', color: '#DB2777', bg: '#FDF2F8' },
              { label: 'MRP', value: product.mrp || '—', icon: 'Tags', color: '#C2410C', bg: '#FFF7ED' },
            ].map((s, i) => (
              <div key={i} style={{ background: C.card, borderRadius: 12, padding: '16px 14px', textAlign: 'center', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}><I name={s.icon} size={18} style={{ color: s.color }} /></div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{s.value}</div>
                <div style={{ fontSize: 11, color: s.color, marginTop: 2, fontWeight: 700 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {product.description && (
            <div style={{ background: C.bg, borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>Description</div>
              <div style={{ fontSize: 13, color: C.text }}>{product.description}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            {canEdit && (
              <button onClick={onEdit} style={{ flex: 1, background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}>Edit Product</button>
            )}
            <button onClick={onClose} style={{ background: C.bg, color: C.muted, border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditModal({ product, onClose, onSave, onDelete, categories, role, canDelete }: { product: Product | null; onClose: () => void; onSave: (d: Partial<Product>) => void; onDelete?: () => void; categories: string[]; role: AdminRole; canDelete?: boolean }) {
  const C = useThemePalette();
  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const isAdd = !product;
  const isSuperAdmin = role === 'super_admin';
  const [imageMode, setImageMode] = useState<'url' | 'file'>('url');
  const [imageUploading, setImageUploading] = useState(false);
  const [form, setForm] = useState<Partial<Product>>(product ?? {
    name: '', sub: '', category: categories[0] ?? 'Fan Box', image: '', points: 10, badge: '', price: '', mrp: '',
    stock: 0, totalScanned: 0, sku: '', description: '', isActive: true,
  });
  const f = (k: keyof Product, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const url = await productApi.uploadImage(file);
      f('image', url);
    } catch {
      alert('Image upload failed. Please try again or use a URL instead.');
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.overlay, backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: C.card, borderRadius: 20, width: 600, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{isAdd ? 'Add New Product' : `Edit — ${product?.name}`}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Manage product info, points and stock</div>
          </div>
          <button onClick={onClose} style={{ background: C.bg, border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Product Name *</label><input style={inputStyle} value={form.name ?? ''} onChange={e => f('name', e.target.value)} placeholder="e.g. FAN BOX 3 RANGE" /></div>
            <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Sub-description *</label><input style={inputStyle} value={form.sub ?? ''} onChange={e => f('sub', e.target.value)} placeholder="Short product description" /></div>
            <div><label style={labelStyle}>Category *</label>
              <select style={inputStyle} value={form.category ?? ''} onChange={e => f('category', e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Badge</label><input style={inputStyle} value={form.badge ?? ''} onChange={e => f('badge', e.target.value)} placeholder="e.g. Popular, New, Hot" /></div>
            <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Product Image *</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button type="button" onClick={() => setImageMode('url')} style={{ padding: '6px 12px', borderRadius: 6, border: `1.5px solid ${imageMode === 'url' ? C.red : C.border}`, background: imageMode === 'url' ? '#FFF0F0' : C.surface, color: imageMode === 'url' ? C.red : C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Import from URL</button>
                <button type="button" onClick={() => setImageMode('file')} style={{ padding: '6px 12px', borderRadius: 6, border: `1.5px solid ${imageMode === 'file' ? C.red : C.border}`, background: imageMode === 'file' ? '#FFF0F0' : C.surface, color: imageMode === 'file' ? C.red : C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Browse Files</button>
              </div>
              {imageMode === 'url' ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={inputStyle} value={form.image ?? ''} onChange={e => f('image', e.target.value)} placeholder="https://example.com/image.jpg" />
                  {form.image && (
                    <div style={{ width: 42, height: 42, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: `1.5px solid ${C.border}` }}>
                      <img src={normalizeImageUrl(form.image)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <label style={{ flex: 1, display: 'flex', flexDirection: 'column', cursor: imageUploading ? 'not-allowed' : 'pointer' }}>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} disabled={imageUploading} />
                    <div style={{ padding: '20px', border: `2px dashed ${C.border}`, borderRadius: 8, textAlign: 'center', background: C.bg, color: C.muted, fontSize: 13 }}>
                      {imageUploading ? 'Uploading...' : form.image ? 'Click to change image' : 'Click to upload image'}
                    </div>
                  </label>
                  {form.image && (
                    <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: `1.5px solid ${C.border}` }}>
                      <img src={normalizeImageUrl(form.image)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div><label style={labelStyle}>Price *</label><input style={inputStyle} value={form.price ?? ''} onChange={e => f('price', e.target.value)} placeholder="₹89" /></div>
            <div><label style={labelStyle}>MRP</label><input style={inputStyle} value={form.mrp ?? ''} onChange={e => f('mrp', e.target.value)} placeholder="₹99" /></div>
            <div><label style={labelStyle}>Points per Scan *</label><input style={inputStyle} type="number" value={form.points ?? ''} onChange={e => f('points', e.target.value === '' ? '' : +e.target.value)} /></div>
            <div><label style={labelStyle}>Stock</label><input style={inputStyle} type="number" value={form.stock ?? ''} onChange={e => f('stock', e.target.value === '' ? '' : +e.target.value)} /></div>
            <div><label style={labelStyle}>SKU</label><input style={inputStyle} value={form.sku ?? ''} onChange={e => f('sku', e.target.value)} placeholder="SRV-FB-3-001" /></div>
            <div><label style={labelStyle}>Status {!isSuperAdmin && <span style={{ fontSize: 10, color: C.muted }}>(Super Admin only)</span>}</label>
              <select style={{ ...inputStyle, cursor: isSuperAdmin ? 'pointer' : 'not-allowed', opacity: isSuperAdmin ? 1 : 0.6 }} value={form.isActive ? 'active' : 'inactive'} onChange={e => isSuperAdmin && f('isActive', e.target.value === 'active')} disabled={!isSuperAdmin}>
                <option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 } as React.CSSProperties} value={form.description ?? ''} onChange={e => f('description', e.target.value)} placeholder="Product description..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            {!isAdd && onDelete && (isSuperAdmin || canDelete) && (
              <button onClick={onDelete} style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 10, padding: '13px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
            )}
            <button onClick={() => onSave(form)} disabled={imageUploading} style={{ flex: 1, background: imageUploading ? C.muted : `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, cursor: imageUploading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}>{imageUploading ? 'Uploading Image...' : isAdd ? 'Add Product' : 'Save Changes'}</button>
            <button onClick={onClose} style={{ background: C.bg, color: C.muted, border: 'none', borderRadius: 10, padding: '13px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Products({ role, initialCategory, onCategoryUsed }: ProductsProps) {
  const C = useThemePalette();
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState(initialCategory ?? 'All');
  const [productStats, setProductStats] = useState({ total: 0, active: 0, totalScanned: 0, lowStock: 0 });
  const [dbCategories, setDbCategories] = useState<string[]>(CATEGORIES_FALLBACK);
  
  // ── Server-side pagination state ──────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 50;

  const mapApiProduct = (p: Record<string, unknown>): Product => ({
    id: String(p.id ?? ''),
    name: String(p.name ?? ''),
    sub: String(p.sub ?? p.description ?? ''),
    category: String(p.category ?? 'Other'),
    subCategory: String(p.subCategory ?? p.sub_category ?? ''),
    image: normalizeImageUrl(String(p.image ?? p.imageUrl ?? '')),
    points: Number(p.points ?? p.pointsValue ?? 0),
    badge: String(p.badge ?? ''),
    price: typeof p.price === 'number' ? `₹${p.price}` : String(p.price ?? ''),
    mrp: typeof p.mrp === 'number' ? `₹${p.mrp}` : String(p.mrp ?? ''),
    stock: Number(p.stock ?? 0),
    totalScanned: Number(p.totalScanned ?? p.total_scanned ?? 0),
    sku: String(p.sku ?? ''),
    weight: String(p.weight ?? ''),
    description: String(p.description ?? ''),
    isActive: Boolean(p.isActive ?? p.is_active ?? true),
  });

  const buildProductStats = (products: Product[]) => ({
    total: products.length,
    active: products.filter((p) => p.isActive).length,
    totalScanned: products.reduce((sum, p) => sum + (p.totalScanned || 0), 0),
    lowStock: products.filter((p) => (p.stock || 0) < 500).length,
  });

  const loadProducts = async (page = currentPage) => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        limit: String(PAGE_SIZE),
        page: String(page),
      };
      if (filterCat !== 'All') params.category = filterCat;

      const res = await productApi.getAll(params);
      const products = (Array.isArray(res) ? res : (res as { data?: Record<string, unknown>[] }).data ?? []) as Record<string, unknown>[];
      const total = Array.isArray(res) ? products.length : (res as { total?: number }).total ?? products.length;
      setTotalCount(total);

      const mappedProducts = products.map(mapApiProduct);
      setData(mappedProducts);

      // Load ALL products to derive unique categories (only on first load)
      if (page === 1) {
        const allRes = await productApi.getAll({ limit: '1000', page: '1' });
        const allProducts = (Array.isArray(allRes) ? allRes : (allRes as { data?: Record<string, unknown>[] }).data ?? []) as Record<string, unknown>[];
        const uniqueCats = Array.from(new Set(allProducts.map((p: any) => String(p.category ?? '').trim()).filter(Boolean))).sort();
        if (uniqueCats.length > 0) setDbCategories(uniqueCats);
      }

      if (total > mappedProducts.length) {
        const statsRes = await productApi.getAll({
          limit: String(total),
          page: '1',
          ...(filterCat !== 'All' ? { category: filterCat } : {}),
        });
        const allProducts = ((Array.isArray(statsRes) ? statsRes : (statsRes as { data?: Record<string, unknown>[] }).data ?? []) as Record<string, unknown>[]).map(mapApiProduct);
        setProductStats(buildProductStats(allProducts));
      } else {
        setProductStats(buildProductStats(mappedProducts));
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch from page 1 whenever category filter changes (also covers initial mount)
  useEffect(() => {
    setCurrentPage(1);
    loadProducts(1);
  }, [filterCat]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialCategory) {
      setFilterCat(initialCategory);
      onCategoryUsed?.();
    }
  }, [initialCategory]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [filterBadge, setFilterBadge] = useState('all');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [showAdd, setShowAdd] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'error' });

  // Get auth context for adminId
  const { auth } = useAppContext();
  
  // Load permissions from database
  const userPermissions = useUserPermissions(auth.adminId ?? undefined, role);
  const canCreate = userPermissions.canCreateInModule('products');
  const canEdit = userPermissions.canEditInModule('products');
  const canDelete = userPermissions.canDeleteInModule('products');
  
  // Debug logging
  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' };

  const uniqueBadges = Array.from(new Set(data.map((p: Product) => p.badge).filter(Boolean)));

  const filtered = data.filter((p: Product) => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (p.sku || '').replace(/^SRV-/i, '').toLowerCase().includes(q) || (p.sub || '').toLowerCase().includes(q);
    const matchCat = filterCat === 'All' || p.category === filterCat;
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? p.isActive : !p.isActive);
    const matchStock = filterStock === 'all' || (filterStock === 'low' ? p.stock < 500 : filterStock === 'out' ? p.stock === 0 : p.stock >= 500);
    const matchBadge = filterBadge === 'all' || p.badge === filterBadge;
    return matchSearch && matchCat && matchStatus && matchStock && matchBadge;
  });

  const handleSave = async (form: Partial<Product>) => {
    // Validate required fields
    if (!form.name || !form.name.trim()) {
      setAlertDialog({ show: true, title: 'Validation Error', message: 'Product Name is required!', type: 'error' });
      return;
    }
    if (!form.sub || !form.sub.trim()) {
      setAlertDialog({ show: true, title: 'Validation Error', message: 'Sub-description is required!', type: 'error' });
      return;
    }
    if (!form.category || !form.category.trim()) {
      setAlertDialog({ show: true, title: 'Validation Error', message: 'Category is required!', type: 'error' });
      return;
    }
    if (!form.image || !form.image.trim()) {
      setAlertDialog({ show: true, title: 'Validation Error', message: 'Product Image is required!', type: 'error' });
      return;
    }
    if (!form.price || !form.price.toString().trim()) {
      setAlertDialog({ show: true, title: 'Validation Error', message: 'Price is required!', type: 'error' });
      return;
    }
    if (form.points === undefined || form.points === null || form.points < 0) {
      setAlertDialog({ show: true, title: 'Validation Error', message: 'Points per Scan is required and must be a positive number!', type: 'error' });
      return;
    }

    // Strip frontend-only fields that backend DTO doesn't accept
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, totalScanned: _ts, subCategory: _sc, weight: _w, ...payload } = form as any;

    // Convert price/mrp strings back to numbers (frontend displays as "₹100" but backend needs 100)
    if (payload.price) {
      const priceStr = String(payload.price).replace(/[₹,\s]/g, '');
      payload.price = priceStr ? parseFloat(priceStr) : 0;
    }
    if (payload.mrp) {
      const mrpStr = String(payload.mrp).replace(/[₹,\s]/g, '');
      payload.mrp = mrpStr ? parseFloat(mrpStr) : undefined;
    }

    try {
      if (showAdd) {
        await productApi.create(payload);
        setShowAdd(false);
        await loadProducts(currentPage);
      } else if (editing) {
        await productApi.update(editing.id, payload);
        setEditing(undefined);
        await loadProducts(currentPage);
      }
    } catch (err: any) {
      console.error('Failed to save product:', err);
      setAlertDialog({ show: true, title: 'Error', message: err?.message || 'Failed to save product. Please try again.', type: 'error' });
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (editing) {
      try {
        await productApi.delete(editing.id);
        await loadProducts(currentPage);
      } catch (err) {
        console.error('Failed to delete product:', err);
      }
      setEditing(undefined);
      setShowDeleteConfirm(false);
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      await productApi.update(id, updates);
      await loadProducts(currentPage);
    } catch (err) {
      console.error('Failed to update product:', err);
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      {viewing && <ProductModal product={viewing} onClose={() => setViewing(null)} onEdit={() => { setEditing(viewing); setViewing(null); }} canEdit={canEdit} />}
      {(editing !== undefined || showAdd) && <EditModal product={showAdd ? null : editing!} onClose={() => { setEditing(undefined); setShowAdd(false); }} onSave={handleSave} onDelete={handleDelete} categories={dbCategories} role={role} canDelete={canDelete} />}
      
      <ConfirmDialog
        show={showDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${editing?.name}"? This action cannot be undone and will also remove it from Points Config.`}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <AlertDialog
        show={alertDialog.show}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog({ ...alertDialog, show: false })}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4 }}>Products</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>Manage product catalog, points and stock levels</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowAdd(true)} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={14} /> Add Product</button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total Products', value: productStats.total || totalCount, Icon: Package, color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'Active', value: productStats.active, Icon: CheckCircle, color: '#065F46', bg: '#D1FAE5' },
          { label: 'Total Scanned', value: productStats.totalScanned.toLocaleString('en-IN'), Icon: ScanLine, color: '#7C3AED', bg: '#F5F3FF' },
          { label: 'Low Stock (<500)', value: productStats.lowStock, Icon: AlertTriangle, color: '#92400E', bg: '#FEF3C7' },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}><s.Icon size={20} /></div>
            <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{s.value}</div><div style={{ fontSize: 12, color: s.color, fontWeight: 700 }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {Array.from(new Set(['All', ...dbCategories])).map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)} style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${filterCat === cat ? C.red : C.border}`, background: filterCat === cat ? '#FFF0F0' : C.card, color: filterCat === cat ? C.red : C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{cat}</button>
        ))}
      </div>

      {/* Search + extra filters */}
      <div style={{ background: C.card, borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}`, marginBottom: 18, display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product name, category, SKU..." style={{ ...inputStyle, flex: 1 }} onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.red} onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />

        {(filterStatus !== 'all' || filterStock !== 'all' || filterBadge !== 'all') && (
          <button onClick={() => { setFilterStatus('all'); setFilterStock('all'); setFilterBadge('all'); }}
            style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.red}`, background: '#FFF0F0', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Clear Filters
          </button>
        )}

        {/* Filter icon button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowFilterPopup(p => !p)}
            style={{
              width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${showFilterPopup || (filterStatus !== 'all' || filterStock !== 'all' || filterBadge !== 'all') ? C.red : C.border}`,
              background: showFilterPopup || (filterStatus !== 'all' || filterStock !== 'all' || filterBadge !== 'all') ? '#FFF0F0' : C.card,
              color: showFilterPopup || (filterStatus !== 'all' || filterStock !== 'all' || filterBadge !== 'all') ? C.red : C.muted,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative',
            }}
          >
            <SlidersHorizontal size={17} />
            {(filterStatus !== 'all' || filterStock !== 'all' || filterBadge !== 'all') && (
              <span style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: C.red, color: 'white', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {[filterStatus, filterStock, filterBadge].filter(f => f !== 'all').length}
              </span>
            )}
          </button>

          {/* Filter Modal - Centered Overlay */}
          {showFilterPopup && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowFilterPopup(false)}>
              <div style={{ background: C.card, borderRadius: 20, width: 420, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.25)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.red }}>
                      <SlidersHorizontal size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Filter Products</div>
                      <div style={{ fontSize: 12, color: C.muted }}>Narrow down results by category</div>
                    </div>
                  </div>
                  <button onClick={() => setShowFilterPopup(false)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
                <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { label: 'Status', value: filterStatus, set: setFilterStatus, options: [['all','All Status'],['active','Active'],['inactive','Inactive']] },
                    { label: 'Stock Level', value: filterStock, set: setFilterStock, options: [['all','All Stock'],['low','Low (<500)'],['out','Out of Stock'],['ok','In Stock']] },
                    ...(uniqueBadges.length > 0 ? [{ label: 'Badge', value: filterBadge, set: setFilterBadge, options: [['all','All Badges'], ...uniqueBadges.map(b => [b, b])] }] : []),
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
                <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10 }}>
                  <button onClick={() => { setFilterStatus('all'); setFilterStock('all'); setFilterBadge('all'); }}
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

        <span style={{ fontSize: 13, color: C.muted, whiteSpace: 'nowrap' }}>{filtered.length} of {totalCount} total</span>
      </div>

      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
              {['Product','SKU Code','Category','Price','Points','Stock','Scanned','Status','Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', width: h === 'SKU Code' ? 180 : undefined }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}
                onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = C.hoverRow}
                onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 10, background: C.bg, overflow: 'hidden', flexShrink: 0 }}>
                      {p.image ? (
                        <img src={normalizeImageUrl(p.image)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { const t = e.currentTarget; t.style.display = 'none'; const ph = t.parentElement; if (ph) { ph.innerHTML = '<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\"/><polyline points=\"3.27 6.96 12 12.01 20.73 6.96\"/><line x1=\"12\" y1=\"22.08\" x2=\"12\" y2=\"12\"/></svg>'; ph.style.display = 'flex'; ph.style.alignItems = 'center'; ph.style.justifyContent = 'center'; } }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}><I name='Box' size={20} /></div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{p.sub}</div>
                      {p.badge && <span style={{ background: '#FFF0F0', color: C.red, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>{p.badge}</span>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{p.sku ? p.sku.replace(/^SRV-/, '') : '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 12.5, color: C.muted }}>{p.category}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{p.price}</div>
                  {p.mrp && <div style={{ fontSize: 11, color: C.muted, textDecoration: 'line-through' }}>{p.mrp}</div>}
                </td>
                <td style={{ padding: '12px 16px' }}><span style={{ background: '#FFFBEB', color: '#92400E', fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Star size={12} /> {p.points}</span></td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: p.stock < 500 ? '#C2410C' : C.text }}>{p.stock.toLocaleString('en-IN')}</div>
                  {p.stock < 500 && <div style={{ fontSize: 10, color: '#C2410C', fontWeight: 600 }}>Low Stock</div>}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: C.muted }}>{p.totalScanned.toLocaleString('en-IN')}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: p.isActive ? '#D1FAE5' : '#FEE2E2', color: p.isActive ? '#065F46' : '#991B1B', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{p.isActive ? 'Active' : 'Inactive'}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setViewing(p)} style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 7, padding: '6px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View</button>
                    {canEdit && (
                      <>
                        <button onClick={() => setEditing(p)} style={{ background: '#FFF7ED', color: '#C2410C', border: 'none', borderRadius: 7, padding: '6px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => updateProduct(p.id, { isActive: !p.isActive })} style={{ background: p.isActive ? '#FEE2E2' : '#D1FAE5', color: p.isActive ? '#991B1B' : '#065F46', border: 'none', borderRadius: 7, padding: '6px 8px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          {p.isActive ? <Ban size={13} /> : <CheckCircle size={13} />}
                        </button>
                      </>
                    )}
                    {!canEdit && (
                      <span style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', padding: '6px 8px' }}>Read Only</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {totalCount > PAGE_SIZE && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: '12px 20px', background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, color: C.muted }}>
            Showing <strong style={{ color: C.text }}>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)}</strong> of <strong style={{ color: C.text }}>{totalCount.toLocaleString('en-IN')}</strong> products
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => { const p = Math.max(1, currentPage - 1); setCurrentPage(p); loadProducts(p); }}
              disabled={currentPage === 1}
              style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: currentPage === 1 ? C.bg : C.card, color: currentPage === 1 ? C.muted : C.text, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
            >← Prev</button>

            {/* Page number buttons */}
            {Array.from({ length: Math.min(7, Math.ceil(totalCount / PAGE_SIZE)) }, (_, i) => {
              const totalPages = Math.ceil(totalCount / PAGE_SIZE);
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => { setCurrentPage(pageNum); loadProducts(pageNum); }}
                  style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${currentPage === pageNum ? C.red : C.border}`, background: currentPage === pageNum ? C.red : C.card, color: currentPage === pageNum ? 'white' : C.text, cursor: 'pointer', fontSize: 13, fontWeight: currentPage === pageNum ? 700 : 500 }}
                >{pageNum}</button>
              );
            })}

            <button
              onClick={() => { const p = Math.min(Math.ceil(totalCount / PAGE_SIZE), currentPage + 1); setCurrentPage(p); loadProducts(p); }}
              disabled={currentPage >= Math.ceil(totalCount / PAGE_SIZE)}
              style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: currentPage >= Math.ceil(totalCount / PAGE_SIZE) ? C.bg : C.card, color: currentPage >= Math.ceil(totalCount / PAGE_SIZE) ? C.muted : C.text, cursor: currentPage >= Math.ceil(totalCount / PAGE_SIZE) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
