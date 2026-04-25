'use client';
import { useState, useRef, useEffect } from 'react';
import { Gift, Plus, Trash2, Upload, ImageIcon, Zap, Store, SlidersHorizontal, Search, Pencil } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { giftApi } from '@/lib/api';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import ExportModal from '@/components/Shared/ExportModal';
import AlertDialog from '@/components/Shared/AlertDialog';

interface GiftProduct {
  id: number;
  name: string;
  image: string;
  pointsRequired: number;
  stock: number;
  status: 'active' | 'inactive';
  type: 'electrician' | 'dealer';
}

function AddGiftModal({ type, nextId, onClose, onSave, C }: { type: 'electrician' | 'dealer'; nextId: number; onClose: () => void; onSave: (g: GiftProduct) => void; C: any }) {
  const [form, setForm] = useState({ name: '', image: '', pointsRequired: 500, stock: 10 });
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'error' });
  const imgRef = useRef<HTMLInputElement>(null);
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => f('image', reader.result as string);
    reader.readAsDataURL(file);
  };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text, boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <AlertDialog show={alertDialog.show} title={alertDialog.title} message={alertDialog.message} type={alertDialog.type} onClose={() => setAlertDialog({ ...alertDialog, show: false })} />
      <div style={{ background: C.card, borderRadius: 20, width: 480, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.25)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Add Gift Product</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>ID will be #{nextId}</div>
          </div>
          <button onClick={onClose} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: C.muted }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'grid', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Gift Name *</label>
            <input style={inputStyle} value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Drill Machine" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Image URL</label>
            <input style={inputStyle} value={form.image} onChange={e => f('image', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Or Upload Image</label>
            <div onClick={() => imgRef.current?.click()} style={{ border: `2px dashed ${form.image ? C.red : C.border}`, borderRadius: 10, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: C.bg, overflow: 'hidden' }}>
              {form.image ? <img src={form.image} alt="" style={{ height: '100%', objectFit: 'cover' }} /> : <><Upload size={18} style={{ color: C.muted, marginRight: 8 }} /><span style={{ fontSize: 12, color: C.muted }}>Click to upload</span></>}
            </div>
            <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Points Required</label>
              <input type="number" style={inputStyle} value={form.pointsRequired ?? ''} onChange={e => f('pointsRequired', e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Stock</label>
              <input type="number" style={inputStyle} value={form.stock ?? ''} onChange={e => f('stock', e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" />
            </div>
          </div>
        </div>
        <div style={{ padding: '0 24px 20px', display: 'flex', gap: 10 }}>
          <button onClick={() => { 
            if (!form.name || !form.name.trim()) {
              setAlertDialog({ show: true, title: 'Required Fields Missing', message: 'Please fill all required fields (Gift Name)', type: 'error' });
              return;
            }
            onSave({ id: nextId, ...form, status: 'active', type }); 
          }} disabled={!form.name}
            style={{ flex: 1, background: form.name ? 'linear-gradient(135deg, #10B981, #059669)' : C.border, color: 'white', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: form.name ? 'pointer' : 'not-allowed' }}>
            Add Gift
          </button>
          <button onClick={onClose} style={{ flex: 1, background: C.bg, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function EditGiftModal({ gift, onClose, onSave, C }: { gift: GiftProduct; onClose: () => void; onSave: (g: GiftProduct) => void; C: any }) {
  const [form, setForm] = useState({ ...gift });
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'error' });
  const imgRef = useRef<HTMLInputElement>(null);
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => f('image', reader.result as string);
    reader.readAsDataURL(file);
  };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text, boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <AlertDialog show={alertDialog.show} title={alertDialog.title} message={alertDialog.message} type={alertDialog.type} onClose={() => setAlertDialog({ ...alertDialog, show: false })} />
      <div style={{ background: C.card, borderRadius: 20, width: 480, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.25)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Edit Gift Product</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>ID #{gift.id}</div>
          </div>
          <button onClick={onClose} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: C.muted }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'grid', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Gift Name *</label>
            <input style={inputStyle} value={form.name} onChange={e => f('name', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Image URL</label>
            <input style={inputStyle} value={form.image} onChange={e => f('image', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Or Upload New Image</label>
            <div onClick={() => imgRef.current?.click()} style={{ border: `2px dashed ${form.image ? C.red : C.border}`, borderRadius: 10, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: C.bg, overflow: 'hidden' }}>
              {form.image ? <img src={form.image} alt="" style={{ height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /> : <><Upload size={18} style={{ color: C.muted, marginRight: 8 }} /><span style={{ fontSize: 12, color: C.muted }}>Click to upload</span></>}
            </div>
            <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Points Required</label>
              <input type="number" style={inputStyle} value={form.pointsRequired ?? ''} onChange={e => f('pointsRequired', e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Stock</label>
              <input type="number" style={inputStyle} value={form.stock ?? ''} onChange={e => f('stock', e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Status</label>
            <select style={inputStyle} value={form.status} onChange={e => f('status', e.target.value)}>
              <option value="active">✅ Active</option>
              <option value="inactive">❌ Inactive</option>
            </select>
          </div>
        </div>
        <div style={{ padding: '0 24px 20px', display: 'flex', gap: 10 }}>
          <button onClick={() => { 
            if (!form.name || !form.name.trim()) {
              setAlertDialog({ show: true, title: 'Required Fields Missing', message: 'Please fill all required fields (Gift Name)', type: 'error' });
              return;
            }
            onSave(form); 
          }} disabled={!form.name}
            style={{ flex: 1, background: form.name ? `linear-gradient(135deg, ${C.red}, ${C.redDark})` : C.border, color: 'white', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: form.name ? 'pointer' : 'not-allowed' }}>
            Save Changes
          </button>
          <button onClick={onClose} style={{ flex: 1, background: C.bg, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function GiftProducts() {
  const C = useThemePalette();
  const [gifts, setGifts] = useState<GiftProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'electrician' | 'dealer'>('electrician');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editGift, setEditGift] = useState<GiftProduct | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [confirmState, setConfirmState] = useState<{ show: boolean; id: number }>({ show: false, id: 0 });
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'error' });

  const loadGifts = async () => {
    try {
      setLoading(true);
      const res = await giftApi.getAll({ limit: '500' });
      const data = Array.isArray(res) ? res : (res as any).data ?? [];
      setGifts(data.map((g: any) => ({
        id: g.id,
        name: g.name,
        image: g.image || '',
        pointsRequired: g.pointsRequired ?? g.points_required ?? 0,
        stock: g.stock ?? 0,
        status: g.status ?? 'active',
        type: g.type ?? 'electrician',
      })));
    } catch (err) {
      console.error('Failed to load gifts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGifts(); }, []);

  const filtered = gifts.filter(g =>
    g.type === tab &&
    (filterStatus === 'all' || g.status === filterStatus) &&
    (search === '' || g.name.toLowerCase().includes(search.toLowerCase()))
  );

  const nextId = Math.max(...gifts.map(g => g.id), 0) + 1;

  const toggleStatus = async (id: number) => {
    const gift = gifts.find(g => g.id === id);
    if (!gift) return;
    const newStatus = gift.status === 'active' ? 'inactive' : 'active';
    try {
      await giftApi.update(String(id), { status: newStatus });
      setGifts(prev => prev.map(g => g.id === id ? { ...g, status: newStatus } : g));
    } catch (err) {
      console.error('Failed to update gift status:', err);
    }
  };

  const confirmDelete = async () => {
    try {
      await giftApi.delete(String(confirmState.id));
      setGifts(prev => prev.filter(g => g.id !== confirmState.id));
    } catch (err) {
      console.error('Failed to delete gift:', err);
    }
    setConfirmState({ show: false, id: 0 });
  };

  const inputStyle: React.CSSProperties = { padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <ConfirmDialog show={confirmState.show} title="Remove Gift" message="Are you sure you want to remove this gift product?" onConfirm={confirmDelete} onCancel={() => setConfirmState({ show: false, id: 0 })} type="danger" />
      {showAdd && <AddGiftModal type={tab} nextId={nextId} onClose={() => setShowAdd(false)} onSave={async (g) => {
        try {
          await giftApi.create({ name: g.name, image: g.image, pointsRequired: g.pointsRequired, stock: g.stock, status: g.status, type: g.type });
          await loadGifts();
        } catch (err) { console.error('Failed to create gift:', err); }
        setShowAdd(false);
      }} C={C} />}
      {editGift && <EditGiftModal gift={editGift} onClose={() => setEditGift(null)} onSave={async (g) => {
        try {
          await giftApi.update(String(g.id), { name: g.name, image: g.image, pointsRequired: g.pointsRequired, stock: g.stock, status: g.status, type: g.type });
          await loadGifts();
        } catch (err) { console.error('Failed to update gift:', err); }
        setEditGift(null);
      }} C={C} />}
      <ExportModal show={showExport} onClose={() => setShowExport(false)} title={tab === 'electrician' ? 'Electrician Gifts' : 'Dealer Gifts'} fileName={`gift-products-${tab}`} getData={() => filtered.map(g => ({ ID: g.id, Type: g.type, Name: g.name, Points: g.pointsRequired, Stock: g.stock, Status: g.status }))} />
      <AlertDialog show={alertDialog.show} title={alertDialog.title} message={alertDialog.message} type={alertDialog.type} onClose={() => setAlertDialog({ ...alertDialog, show: false })} />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: 18, padding: '22px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 24px rgba(16,185,129,0.25)' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}><Gift size={26} /> Gift Products</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>Manage gift catalog for electricians and dealers</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ label: 'Electrician Gifts', value: gifts.filter(g => g.type === 'electrician').length }, { label: 'Dealer Gifts', value: gifts.filter(g => g.type === 'dealer').length }].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '10px 18px', background: 'rgba(255,255,255,0.15)', borderRadius: 12 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs + Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', background: C.card, borderRadius: 12, padding: 4, border: `1px solid ${C.border}`, gap: 4 }}>
          {[{ id: 'electrician', label: 'Electrician Gifts', Icon: Zap }, { id: 'dealer', label: 'Dealer Gifts', Icon: Store }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ padding: '9px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, background: tab === t.id ? '#10B981' : 'transparent', color: tab === t.id ? 'white' : C.muted, transition: 'all 0.2s' }}>
              <t.Icon size={15} /> {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowExport(true)} style={{ background: C.card, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>Export</button>
          <button onClick={() => setShowAdd(true)} style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15} /> Add Gift</button>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ background: C.card, borderRadius: 14, padding: '12px 16px', border: `1px solid ${C.border}`, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search gift name..." style={{ ...inputStyle, paddingLeft: 32, width: '100%', boxSizing: 'border-box' }} />
        </div>
        {filterStatus !== 'all' && (
          <button onClick={() => setFilterStatus('all')} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.red}`, background: '#FFF0F0', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>✕ Clear</button>
        )}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowFilterPopup(p => !p)} style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${showFilterPopup || filterStatus !== 'all' ? C.red : C.border}`, background: showFilterPopup || filterStatus !== 'all' ? '#FFF0F0' : C.card, color: showFilterPopup || filterStatus !== 'all' ? C.red : C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SlidersHorizontal size={16} />
            {filterStatus !== 'all' && <span style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: C.red, color: 'white', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>}
          </button>
          {showFilterPopup && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowFilterPopup(false)}>
              <div style={{ background: C.card, borderRadius: 20, width: 360, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.25)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.red }}><SlidersHorizontal size={16} /></div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Filter Gifts</div>
                  </div>
                  <button onClick={() => setShowFilterPopup(false)} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: C.muted, fontSize: 15 }}>✕</button>
                </div>
                <div style={{ padding: '18px 22px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 8 }}>Status</div>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${filterStatus !== 'all' ? C.red : C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text }}>
                    <option value="all">All Status</option>
                    <option value="active">✅ Active</option>
                    <option value="inactive">❌ Inactive</option>
                  </select>
                </div>
                <div style={{ padding: '0 22px 18px', display: 'flex', gap: 10 }}>
                  <button onClick={() => { setFilterStatus('all'); setShowFilterPopup(false); }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Reset</button>
                  <button onClick={() => setShowFilterPopup(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apply</button>
                </div>
              </div>
            </div>
          )}
        </div>
        <span style={{ fontSize: 13, color: C.muted, whiteSpace: 'nowrap' }}>{filtered.length} items</span>
      </div>

      {/* Table */}
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
              {['ID', 'Type', 'Name', 'Image', 'Points', 'Stock', 'Status', 'Action'].map(h => (                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(g => (
              <tr key={g.id} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = C.bg}
                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 800, color: C.muted }}>{g.id}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ background: g.type === 'electrician' ? '#FFF0F0' : '#EFF6FF', color: g.type === 'electrician' ? '#C2410C' : '#1D4ED8', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                    {g.type === 'electrician' ? <Zap size={11} /> : <Store size={11} />}
                    {g.type === 'electrician' ? 'Electrician' : 'Dealer'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: C.text }}>{g.name}</td>
                <td style={{ padding: '14px 16px' }}>
                  {g.image
                    ? <img src={g.image} alt={g.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: `1px solid ${C.border}` }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    : <div style={{ width: 56, height: 56, borderRadius: 8, background: C.bg, border: `1px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={18} style={{ color: C.muted }} /></div>
                  }
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>⚡ {g.pointsRequired}</span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: C.text }}>{g.stock}</td>
                <td style={{ padding: '14px 16px' }}>
                  <button onClick={() => toggleStatus(g.id)} style={{ background: g.status === 'active' ? '#D1FAE5' : '#FEE2E2', color: g.status === 'active' ? '#065F46' : '#991B1B', border: 'none', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    {g.status === 'active' ? '✅ Active' : '❌ Inactive'}
                  </button>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setEditGift(g)} style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setConfirmState({ show: true, id: g.id })} style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center', color: C.muted }}>
                <Gift size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>No gifts found</div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
