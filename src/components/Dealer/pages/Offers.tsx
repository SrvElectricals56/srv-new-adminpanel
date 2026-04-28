'use client';
import { useState, useEffect } from 'react';
import { Gift, Plus, Edit2, Trash2, Calendar, Target } from 'lucide-react';
import { offerApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import ExportModal from '@/components/Shared/ExportModal';
import AlertDialog from '@/components/Shared/AlertDialog';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';

const numberInputValue = (value: number | null | undefined) => value === 0 || value === null || value === undefined ? '' : value;

interface DealerOffer {
  id: string;
  title: string;
  description: string;
  discount: string;
  validFrom: string;
  validTo: string;
  status: 'active' | 'expired' | 'scheduled';
  targetRole: string;
  bonusPoints: number;
}

export default function DealerOffers() {
  const C = useThemePalette();
  const [allOffers, setAllOffers] = useState<DealerOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<DealerOffer | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'error' });
  const [confirmState, setConfirmState] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; type: 'success' | 'danger' }>({ show: false, title: '', message: '', onConfirm: () => {}, type: 'danger' });
  const [form, setForm] = useState<Partial<DealerOffer>>({ title: '', description: '', discount: '', validFrom: '', validTo: '', status: 'scheduled', targetRole: 'dealer', bonusPoints: 0 });

  const loadOffers = async () => {
    try {
      const res = await offerApi.getAll({ limit: '200' });
      const data = Array.isArray(res) ? res : (res as any).data ?? [];
      setAllOffers(data.map((o: any) => ({
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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadOffers(); }, []);

  const filtered = allOffers.filter(o => (filterStatus === 'all' || o.status === filterStatus) && (o.targetRole === 'dealer' || o.targetRole === 'all'));

  const stats = [
    { label: 'Active Offers', value: allOffers.filter(o => o.status === 'active').length, color: '#10B981', bg: '#D1FAE5' },
    { label: 'Scheduled', value: allOffers.filter(o => o.status === 'scheduled').length, color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Expired', value: allOffers.filter(o => o.status === 'expired').length, color: '#EF4444', bg: '#FEE2E2' },
  ];

  const openCreate = () => {
    setEditingOffer(null);
    setForm({ title: '', description: '', discount: '', validFrom: '', validTo: '', status: 'scheduled', targetRole: 'dealer', bonusPoints: 0 });
    setShowForm(true);
  };

  const openEdit = (offer: DealerOffer) => { setEditingOffer(offer); setForm(offer); setShowForm(true); };

  const saveOffer = async () => {
    if (!form.title || !form.discount) {
      setAlertDialog({ show: true, title: 'Required Fields Missing', message: 'Please fill Title and Discount', type: 'error' });
      return;
    }
    try {
      if (editingOffer) {
        await offerApi.update(editingOffer.id, form);
      } else {
        await offerApi.create(form);
      }
      await loadOffers();
      setShowForm(false);
    } catch (err: any) {
      setAlertDialog({ show: true, title: 'Error', message: err.message || 'Failed to save offer', type: 'error' });
    }
  };

  const deleteOffer = (offer: DealerOffer) => {
    setConfirmState({
      show: true, title: 'Delete Offer', message: `Delete "${offer.title}"?`, type: 'danger',
      onConfirm: async () => {
        try { await offerApi.delete(offer.id); await loadOffers(); } catch (err) { console.error(err); }
        setConfirmState(s => ({ ...s, show: false }));
      }
    });
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <ConfirmDialog show={confirmState.show} title={confirmState.title} message={confirmState.message} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(s => ({ ...s, show: false }))} type={confirmState.type} />
      <AlertDialog show={alertDialog.show} title={alertDialog.title} message={alertDialog.message} type={alertDialog.type} onClose={() => setAlertDialog({ ...alertDialog, show: false })} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><Gift size={24} style={{ color: C.red }} /> Dealer Offers</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>Manage promotional offers for dealers</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowExport(true)} style={{ background: C.surface, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Export</button>
          <button onClick={openCreate} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> Create Offer</button>
        </div>
      </div>
      <ExportModal show={showExport} onClose={() => setShowExport(false)} title="Dealer Offers" fileName="dealer-offers" getData={() => allOffers.map(o => ({ Title: o.title, Discount: o.discount, ValidFrom: o.validFrom, ValidTo: o.validTo, Status: o.status, TargetRole: o.targetRole, BonusPoints: o.bonusPoints }))} />

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowForm(false)}>
          <div style={{ background: C.card, borderRadius: 16, width: 560, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{editingOffer ? 'Edit Offer' : 'Create Offer'}</div>
              <button onClick={() => setShowForm(false)} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 22, display: 'grid', gap: 10 }}>
              <input placeholder="Offer Title *" value={form.title ?? ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={{ padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, color: C.text, outline: 'none' }} />
              <input placeholder="Description" value={form.description ?? ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, color: C.text, outline: 'none' }} />
              <input placeholder="Discount (e.g. 20% / ₹5000) *" value={form.discount ?? ''} onChange={e => setForm(p => ({ ...p, discount: e.target.value }))} style={{ padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, color: C.text, outline: 'none' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input type="date" value={form.validFrom ?? ''} onChange={e => setForm(p => ({ ...p, validFrom: e.target.value }))} style={{ padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, color: C.text, outline: 'none' }} />
                <input type="date" value={form.validTo ?? ''} onChange={e => setForm(p => ({ ...p, validTo: e.target.value }))} style={{ padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, color: C.text, outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <select value={form.status ?? 'scheduled'} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))} style={{ padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, color: C.text, outline: 'none' }}>
                  <option value="active">Active</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="expired">Expired</option>
                </select>
                <select value={form.targetRole ?? 'dealer'} onChange={e => setForm(p => ({ ...p, targetRole: e.target.value }))} style={{ padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, color: C.text, outline: 'none' }}>
                  <option value="dealer">Dealer</option>
                  <option value="all">All</option>
                </select>
              </div>
              <input type="number" placeholder="Bonus Points" value={numberInputValue(form.bonusPoints)} onChange={e => setForm(p => ({ ...p, bonusPoints: e.target.value === '' ? 0 : Number(e.target.value) }))} style={{ padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, color: C.text, outline: 'none' }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={saveOffer} style={{ flex: 1, background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, cursor: 'pointer' }}>{editingOffer ? 'Save Changes' : 'Create Offer'}</button>
                <button onClick={() => setShowForm(false)} style={{ background: C.bg, color: C.muted, border: 'none', borderRadius: 8, padding: '10px 14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.card, borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}`, marginBottom: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface, color: C.text }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="expired">Expired</option>
        </select>
        <span style={{ fontSize: 13, color: C.muted, marginLeft: 'auto' }}>{filtered.length} offers</span>
      </div>

      {loading ? <div style={{ padding: '40px', textAlign: 'center', color: C.muted }}>Loading...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map(offer => {
            const statusConfig = { active: { bg: '#D1FAE5', color: '#065F46', label: 'Active' }, scheduled: { bg: '#FEF3C7', color: '#92400E', label: 'Scheduled' }, expired: { bg: '#FEE2E2', color: '#991B1B', label: 'Expired' } };
            const status = statusConfig[offer.status] ?? statusConfig['active'];
            return (
              <div key={offer.id} style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'; }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{offer.targetRole}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{offer.title}</div>
                  </div>
                  <span style={{ background: status.bg, color: status.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{status.label}</span>
                </div>
                <div style={{ background: C.bg, borderRadius: 12, padding: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.red, marginBottom: 4 }}>{offer.discount}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>Discount</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div style={{ background: C.bg, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 2, fontWeight: 600 }}>Valid From</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {offer.validFrom ? new Date(offer.validFrom).toLocaleDateString('en-IN') : '—'}</div>
                  </div>
                  <div style={{ background: C.bg, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 2, fontWeight: 600 }}>Valid To</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {offer.validTo ? new Date(offer.validTo).toLocaleDateString('en-IN') : '—'}</div>
                  </div>
                </div>
                <div style={{ background: C.bg, borderRadius: 10, padding: '10px 12px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Target size={14} style={{ color: C.red }} />
                  <div>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>Bonus Points</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{offer.bonusPoints}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openEdit(offer)} style={{ flex: 1, background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Edit2 size={12} /> Edit</button>
                  <button onClick={() => deleteOffer(offer)} style={{ flex: 1, background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Trash2 size={12} /> Delete</button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: C.muted }}>No offers found</div>}
        </div>
      )}
    </div>
  );
}
