'use client';
import { useState, useEffect } from 'react';
import { Gift, Plus, Edit, Trash2, Eye, X } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { offerApi } from '@/lib/api';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import ExportModal from '@/components/Shared/ExportModal';
import { exportRowsToExcel } from '@/lib/excel';
import AlertDialog from '@/components/Shared/AlertDialog';

const numberInputValue = (value: number | null | undefined) => value === 0 || value === null || value === undefined ? '' : value;

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  validFrom: string;
  validTo: string;
  status: 'active' | 'scheduled' | 'expired';
  targetRole: string;
  bonusPoints: number;
}

export default function ElectricianOffers() {
  const C = useThemePalette();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOffers = async () => {
    try {
      const res = await offerApi.getAll({ limit: '200' });
      const data = Array.isArray(res) ? res : (res as any).data ?? [];
      setOffers(data.map((o: any) => ({
        id: String(o.id),
        title: o.title,
        description: o.description ?? '',
        discount: o.discount ?? '',
        validFrom: o.validFrom ?? o.valid_from ?? '',
        validTo: o.validTo ?? o.valid_to ?? '',
        status: o.status ?? 'active',
        targetRole: o.targetRole ?? o.target_role ?? 'all',
        bonusPoints: o.bonusPoints ?? o.bonus_points ?? 0,
      })));
    } catch (err) {
      console.error('Failed to load offers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOffers(); }, []);
  const [showExport, setShowExport] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [confirmState, setConfirmState] = useState<{show: boolean; title: string; message: string; onConfirm: () => void; type: 'success' | 'danger'}>({show: false, title: '', message: '', onConfirm: () => {}, type: 'success'});
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'error' });

  const [form, setForm] = useState<Partial<Offer>>({
    title: '',
    description: '',
    discount: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
    targetRole: 'all',
    bonusPoints: 10,
  });

  const filtered = offers.filter(o => {
    const matchSearch = o.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleExport = () => {
    const dateTag = new Date().toISOString().slice(0, 10);
    const exportData = offers.map(o => ({
      Title: o.title,
      Description: o.description,
      Discount: o.discount,
      BonusPoints: o.bonusPoints,
      ValidFrom: o.validFrom,
      ValidTo: o.validTo,
      Status: o.status,
      TargetRole: o.targetRole,
    }));
    exportRowsToExcel(exportData as any[], 'ElectricianOffers', `electrician-offers-${dateTag}`);
  };

  const openCreate = () => {
    setEditingOffer(null);
    setForm({
      title: '',
      description: '',
      discount: '',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      targetRole: 'all',
      bonusPoints: 10,
    });
    setShowForm(true);
  };

  const openEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setForm({ ...offer });
    setShowForm(true);
  };

  const saveOffer = async () => {
    if (!form.title || !form.discount) {
      setAlertDialog({ show: true, title: 'Required Fields Missing', message: 'Please fill all required fields (Title, Discount)', type: 'error' });
      return;
    }
    try {
      if (editingOffer) {
        await offerApi.update(editingOffer.id, form);
      } else {
        await offerApi.create({ ...form, targetRole: form.targetRole || 'electrician' });
      }
      await loadOffers();
      setShowForm(false);
      setEditingOffer(null);
    } catch (err: any) {
      setAlertDialog({ show: true, title: 'Error', message: err.message || 'Failed to save offer', type: 'error' });
    }
  };

  const handleDelete = (offer: Offer) => {
    setConfirmState({
      show: true,
      title: 'Delete Offer',
      message: `Are you sure you want to delete "${offer.title}"? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await offerApi.delete(offer.id);
          await loadOffers();
          setSelectedOffer(null);
        } catch (err) { console.error(err); }
        setConfirmState(s => ({ ...s, show: false }));
      }
    });
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <ConfirmDialog
        show={confirmState.show}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(s => ({ ...s, show: false }))}
        type={confirmState.type}
      />
      <AlertDialog show={alertDialog.show} title={alertDialog.title} message={alertDialog.message} type={alertDialog.type} onClose={() => setAlertDialog({ ...alertDialog, show: false })} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><Gift size={24} style={{ color: C.red }} /> Offers & Promos</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>Manage promotional offers for electricians</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowExport(true)} style={{ background: C.surface, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            Export
          </button>
          <button onClick={openCreate} style={{ background: C.red, color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> Add Offer
          </button>
        </div>
      </div>
      <ExportModal show={showExport} onClose={() => setShowExport(false)} title="Electrician Offers" fileName="electrician-offers" getData={() => offers.map(o => ({ Title: o.title, Description: o.description, Discount: o.discount, BonusPoints: o.bonusPoints, ValidFrom: o.validFrom, ValidTo: o.validTo, Status: o.status, TargetRole: o.targetRole }))} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total Offers', value: offers.length },
          { label: 'Active', value: offers.filter(o => o.status === 'active').length },
          { label: 'Scheduled', value: offers.filter(o => o.status === 'scheduled').length },
          { label: 'Expired', value: offers.filter(o => o.status === 'expired').length },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.card, borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}`, marginBottom: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search offers..." style={{ ...inputStyle, flex: 1, minWidth: 220 }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="expired">Expired</option>
        </select>
        <span style={{ fontSize: 13, color: C.muted, marginLeft: 'auto' }}>{filtered.length} results</span>
      </div>

      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Title</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Discount</th>
              <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(offer => {
              const status = { active: { bg: '#D1FAE5', color: '#065F46', label: 'Active' }, scheduled: { bg: '#EFF6FF', color: '#1D4ED8', label: 'Scheduled' }, expired: { bg: '#FEE2E2', color: '#991B1B', label: 'Expired' } }[offer.status];
              return (
                <tr key={offer.id} style={{ borderBottom: `1px solid ${C.border}` }} onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = C.hoverRow} onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{offer.title}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{offer.targetRole}</div>
                  </td>
                  <td style={{ padding: '13px 16px' }}><span style={{ background: '#FFFBEB', color: '#92400E', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{offer.discount}</span></td>
                  <td style={{ padding: '13px 16px', textAlign: 'center' }}><span style={{ background: status.bg, color: status.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{status.label}</span></td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button onClick={() => setSelectedOffer(offer)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: C.muted }}><Eye size={14} /></button>
                      <button onClick={() => openEdit(offer)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: C.muted }}><Edit size={14} /></button>
                      <button onClick={() => handleDelete(offer)} style={{ background: '#FEE2E2', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#991B1B' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowForm(false)}>
          <div style={{ background: C.card, borderRadius: 16, width: 520, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{editingOffer ? 'Edit Offer' : 'Add New Offer'}</div>
              <button onClick={() => setShowForm(false)} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: 22, display: 'grid', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: 'block' }}>Title *</label>
                <input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Summer Sale" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: 'block' }}>Description</label>
                <input value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. 50% bonus points" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: 'block' }}>Discount *</label>
                  <input value={form.discount || ''} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} placeholder="e.g. 50%" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: 'block' }}>Bonus Points</label>
                  <input type="number" value={numberInputValue(form.bonusPoints)} onChange={e => setForm(f => ({ ...f, bonusPoints: e.target.value === '' ? 0 : Number(e.target.value) }))} placeholder="0" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: 'block' }}>Valid From</label>
                  <input type="date" value={form.validFrom || ''} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: 'block' }}>Valid To</label>
                  <input type="date" value={form.validTo || ''} onChange={e => setForm(f => ({ ...f, validTo: e.target.value }))} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: 'block' }}>Status</label>
                  <select value={form.status || 'active'} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))} style={inputStyle}>
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4, display: 'block' }}>Target Role</label>
                  <select value={form.targetRole || 'all'} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))} style={inputStyle}>
                    <option value="all">All</option>
                    <option value="electrician">Electrician</option>
                  </select>
                </div>
              </div>
              <button onClick={saveOffer} style={{ background: C.red, color: 'white', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
                {editingOffer ? 'Update Offer' : 'Create Offer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOffer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedOffer(null)}>
          <div style={{ background: C.card, borderRadius: 16, width: 520, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Offer Details</div>
              <button onClick={() => setSelectedOffer(null)} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: 22, display: 'grid', gap: 10 }}>
              <div style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}><strong>Title:</strong> {selectedOffer.title}</div>
              <div style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}><strong>Description:</strong> {selectedOffer.description}</div>
              <div style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}><strong>Discount:</strong> {selectedOffer.discount}</div>
              <div style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}><strong>Bonus Points:</strong> {selectedOffer.bonusPoints}</div>
              <div style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}><strong>Valid From:</strong> {new Date(selectedOffer.validFrom).toLocaleDateString('en-IN')}</div>
              <div style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}><strong>Valid To:</strong> {new Date(selectedOffer.validTo).toLocaleDateString('en-IN')}</div>
              <div style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}><strong>Status:</strong> {selectedOffer.status}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
