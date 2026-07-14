'use client';
import { useEffect, useState } from 'react';
import { FileSpreadsheet, Gift, Plus, Edit, Trash2, Eye, Upload } from 'lucide-react';
import { offerApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import ExportModal from '@/components/Shared/ExportModal';

interface OfferRow {
  id: string;
  title: string;
  description: string;
  discount: string;
  validFrom: string;
  validTo: string;
  status: string;
  targetRole: string;
  bonusPoints: number;
  imageUrl?: string;
}

export default function UserOffers() {
  const C = useThemePalette();
  const [rows, setRows] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [selected, setSelected] = useState<OfferRow | null>(null);
  const [editing, setEditing] = useState<OfferRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<OfferRow | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [form, setForm] = useState<Partial<OfferRow>>({ title: '', description: '', discount: '', validFrom: new Date().toISOString().split('T')[0], validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'active', targetRole: 'user', bonusPoints: 10, imageUrl: '' });

  const load = async () => {
    try {
      const res = await offerApi.getAll({ limit: '200' });
      const data = Array.isArray(res) ? res : (res as any).data ?? [];
      setRows(data.filter((row: any) => ['all', 'user'].includes(row.targetRole ?? row.target_role ?? 'all')).map((row: any) => ({ id: String(row.id), title: row.title, description: row.description ?? '', discount: row.discount ?? '', validFrom: row.validFrom ?? row.valid_from ?? '', validTo: row.validTo ?? row.valid_to ?? '', status: row.status ?? 'active', targetRole: row.targetRole ?? row.target_role ?? 'all', bonusPoints: row.bonusPoints ?? row.bonus_points ?? 0, imageUrl: row.imageUrl ?? row.image_url ?? '' })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter(row => row.title.toLowerCase().includes(search.toLowerCase()));
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' };
  const openCreate = () => { setEditing(null); setForm({ title: '', description: '', discount: '', validFrom: new Date().toISOString().split('T')[0], validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'active', targetRole: 'user', bonusPoints: 10, imageUrl: '' }); setShowForm(true); };
  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    setImageUploading(true);
    try {
      const imageUrl = await offerApi.uploadImage(file);
      setForm(prev => ({ ...prev, imageUrl }));
    } catch (error) {
      console.error(error);
    } finally {
      setImageUploading(false);
    }
  };
  const saveOffer = async () => { if (!form.title || !form.discount) return; if (editing) await offerApi.update(editing.id, form); else await offerApi.create({ ...form, targetRole: form.targetRole || 'user' }); setShowForm(false); await load(); };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <ExportModal show={showExport} onClose={() => setShowExport(false)} title="User Offers" fileName="user-offers" getData={() => rows.map(row => ({ Title: row.title, Description: row.description, Discount: row.discount, BonusPoints: row.bonusPoints, ValidFrom: row.validFrom, ValidTo: row.validTo, Status: row.status, TargetRole: row.targetRole }))} />
      <ConfirmDialog show={!!confirmDelete} title="Delete Offer" message={confirmDelete ? `Delete "${confirmDelete.title}"?` : ''} onConfirm={async () => { if (confirmDelete) { await offerApi.delete(confirmDelete.id); setConfirmDelete(null); await load(); } }} onCancel={() => setConfirmDelete(null)} type="danger" />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div><h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><Gift size={24} style={{ color: C.red }} /> Offers & Promos</h1><p style={{ color: C.muted, fontSize: 14 }}>Manage promotional offers for customers</p></div>
        <div style={{ display: 'flex', gap: 8 }}><button onClick={() => setShowExport(true)} style={{ background: C.surface, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><FileSpreadsheet size={14} /> Export</button><button onClick={openCreate} style={{ background: C.red, color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> Add Offer</button></div>
      </div>
      <div style={{ background: C.card, borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}`, marginBottom: 18, display: 'flex', gap: 12, alignItems: 'center' }}><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search offers..." style={{ ...inputStyle, flex: 1 }} /></div>
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>{loading ? <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Loading...</div> : <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>{['Title', 'Discount', 'Status', 'Actions'].map(head => <th key={head} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>{head}</th>)}</tr></thead><tbody>{filtered.map(row => <tr key={row.id} style={{ borderBottom: `1px solid ${C.border}` }}><td style={{ padding: '13px 16px' }}><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{row.title}</div><div style={{ fontSize: 11, color: C.muted }}>{row.targetRole}</div></td><td style={{ padding: '13px 16px', fontSize: 12, color: C.text }}>{row.discount}</td><td style={{ padding: '13px 16px', fontSize: 12, color: C.muted }}>{row.status}</td><td style={{ padding: '13px 16px' }}><div style={{ display: 'flex', gap: 6 }}><button onClick={() => setSelected(row)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: C.muted }}><Eye size={14} /></button><button onClick={() => { setEditing(row); setForm(row); setShowForm(true); }} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: C.muted }}><Edit size={14} /></button><button onClick={() => setConfirmDelete(row)} style={{ background: '#FEE2E2', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#991B1B' }}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table>}</div>
      {showForm && <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }} onClick={() => setShowForm(false)}><div style={{ background: C.card, borderRadius: 16, width: 520, maxWidth: '95vw', padding: 22, display: 'grid', gap: 14 }} onClick={e => e.stopPropagation()}><div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{editing ? 'Edit Offer' : 'Add Offer'}</div><input value={form.title || ''} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Title" style={inputStyle} /><input value={form.description || ''} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Description" style={inputStyle} /><label style={{ minHeight: 118, border: `1.5px dashed ${C.border}`, borderRadius: 12, background: C.bg, cursor: imageUploading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{form.imageUrl ? <img src={form.imageUrl} alt="Offer preview" style={{ width: '100%', height: 118, objectFit: 'cover' }} /> : <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.muted, fontSize: 13, fontWeight: 700 }}><Upload size={16} /> {imageUploading ? 'Uploading...' : 'Click to upload offer image'}</span>}<input type="file" accept="image/*" disabled={imageUploading} style={{ display: 'none' }} onChange={e => void handleImageUpload(e.target.files?.[0])} /></label><input value={form.discount || ''} onChange={e => setForm(prev => ({ ...prev, discount: e.target.value }))} placeholder="Discount" style={inputStyle} /><input type="number" value={form.bonusPoints || 0} onChange={e => setForm(prev => ({ ...prev, bonusPoints: Number(e.target.value) }))} placeholder="Bonus points" style={inputStyle} /><select value={form.targetRole || 'user'} onChange={e => setForm(prev => ({ ...prev, targetRole: e.target.value }))} style={inputStyle}><option value="user">User</option><option value="all">All</option></select><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><input type="date" value={form.validFrom || ''} onChange={e => setForm(prev => ({ ...prev, validFrom: e.target.value }))} style={inputStyle} /><input type="date" value={form.validTo || ''} onChange={e => setForm(prev => ({ ...prev, validTo: e.target.value }))} style={inputStyle} /></div><button onClick={saveOffer} style={{ background: C.red, color: 'white', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{editing ? 'Update Offer' : 'Create Offer'}</button></div></div>}
      {selected && <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }} onClick={() => setSelected(null)}><div style={{ background: C.card, borderRadius: 16, width: 520, maxWidth: '95vw', padding: 22 }} onClick={e => e.stopPropagation()}>{selected.imageUrl ? <div style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13, marginBottom: 8 }}><img src={selected.imageUrl} alt={selected.title} style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8 }} /></div> : null}{[['Title', selected.title], ['Description', selected.description], ['Discount', selected.discount], ['Bonus Points', String(selected.bonusPoints)], ['Status', selected.status], ['Target Role', selected.targetRole]].map(([key, value]) => <div key={String(key)} style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13, marginBottom: 8 }}><strong>{key}:</strong> {value}</div>)}</div></div>}
    </div>
  );
}
