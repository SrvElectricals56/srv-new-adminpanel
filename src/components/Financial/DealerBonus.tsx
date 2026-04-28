'use client';

import { useState, useMemo, useEffect } from 'react';
import { Upload, DollarSign, Check, Pencil } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { financeApi, settingsApi } from '@/lib/api';
import ExportModal from '@/components/Shared/ExportModal';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import AlertDialog from '@/components/Shared/AlertDialog';

interface BonusRecord {
  id: string;
  dealerName: string;
  dealerPhone: string;
  month: string;
  year: number;
  electriciansCount: number;
  totalRedeemed: number;
  bonus: number;
  status: 'pending' | 'paid' | 'processing';
}

const RATE = 5;
const numberInputValue = (value: number | null | undefined) => value === 0 || value === null || value === undefined ? '' : value;

export default function DealerBonus() {
  const C = useThemePalette();
  const [bonuses, setBonuses] = useState<BonusRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeApi.getDealerBonus().then((res: any) => {
      const dealers = res?.dealers ?? [];
      setBonuses(dealers.map((d: any) => ({
        id: d.id,
        dealerName: d.name ?? 'Unknown',
        dealerPhone: d.phone ?? '—',
        month: new Date().toLocaleString('en-US', { month: 'long' }),
        year: new Date().getFullYear(),
        electriciansCount: d.electricianCount ?? 0,
        totalRedeemed: Number(d.achievedTarget ?? 0),
        bonus: Math.round(Number(d.bonusAmount ?? 0)),
        status: (d.bonusStatus ?? 'pending') as BonusRecord['status'],
      })));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);
  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [dealerFilter, setDealerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showExport, setShowExport] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkPay, setBulkPay] = useState(false);
  const [markPaidId, setMarkPaidId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState(false);
  const [rateInput, setRateInput] = useState(String(RATE));
  const [rateSaving, setRateSaving] = useState(false);
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'success' });

  // Load bonus rate from settings on mount
  useEffect(() => {
    settingsApi.getAll().then((rows: any[]) => {
      const map: Record<string, string> = {};
      (rows ?? []).forEach((r: any) => { map[r.key] = r.value; });
      if (map['dealer_bonus_rate']) setRateInput(map['dealer_bonus_rate']);
    }).catch(console.error);
  }, []);

  const handleSaveRate = async () => {
    setRateSaving(true);
    try {
      const rate = Number(rateInput);
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        setAlertDialog({ show: true, title: 'Invalid Rate', message: 'Please enter a number between 0 and 100.', type: 'warning' });
        return;
      }
      await settingsApi.update('dealer_bonus_rate', String(rate));
      setEditRate(false);
      setAlertDialog({ show: true, title: 'Saved', message: 'Dealer bonus rate saved successfully.', type: 'success' });
    } catch (err) {
      console.error('Failed to save rate:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save dealer bonus rate.';
      setAlertDialog({ show: true, title: 'Error', message: msg, type: 'error' });
    } finally {
      setRateSaving(false);
    }
  };

  // Recalculate displayed bonus amounts whenever rate changes.
  useEffect(() => {
    const rate = Number(rateInput);
    if (!Number.isFinite(rate) || rate < 0) return;
    setBonuses(prev => prev.map((c) => {
      const computed = Math.round(Number(c.totalRedeemed || 0) * rate / 100);
      return c.bonus === computed ? c : { ...c, bonus: computed };
    }));
  }, [rateInput]);
  const [editItem, setEditItem] = useState<BonusRecord | null>(null);
  const [editForm, setEditForm] = useState({ dealerName: '', dealerPhone: '', month: 'January', year: 2025, electriciansCount: 0, totalRedeemed: 0, status: 'pending' as BonusRecord['status'] });

  const filtered = useMemo(() => {
    let list = bonuses;
    if (monthFilter !== 'all') list = list.filter(c => c.month === monthFilter);
    if (yearFilter !== 'all') list = list.filter(c => c.year === Number(yearFilter));
    if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter);
    if (dealerFilter) list = list.filter(c => c.dealerName.toLowerCase().includes(dealerFilter.toLowerCase()));
    return list;
  }, [bonuses, monthFilter, yearFilter, statusFilter, dealerFilter]);

  const stats = useMemo(() => ({
    totalEarned: bonuses.reduce((s, c) => s + c.bonus, 0),
    totalPaid: bonuses.filter(c => c.status === 'paid').reduce((s, c) => s + c.bonus, 0),
    pending: bonuses.filter(c => c.status === 'pending').reduce((s, c) => s + c.bonus, 0),
  }), [bonuses]);

  const handleMarkPaid = async (id: string) => {
    const bonus = bonuses.find(c => c.id === id);
    if (!bonus) return;
    try {
      await financeApi.markDealerBonusPaid(id);
      setBonuses(prev => prev.map(c => c.id === id ? { ...c, status: 'paid' } : c));
    } catch (err) {
      console.error('Failed to mark bonus as paid:', err);
    }
    setMarkPaidId(null);
  };

  const handleBulkPaid = async () => {
    try {
      await financeApi.bulkMarkDealerBonusPaid(selected);
      setBonuses(prev => prev.map(c => selected.includes(c.id) ? { ...c, status: 'paid' } : c));
    } catch (err) {
      console.error('Failed to bulk mark bonuses as paid:', err);
    }
    setSelected([]);
    setBulkPay(false);
  };
  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(c => c.id));

  const openEdit = (c: BonusRecord) => {
    setEditItem(c);
    setEditForm({ dealerName: c.dealerName, dealerPhone: c.dealerPhone, month: c.month, year: c.year, electriciansCount: c.electriciansCount, totalRedeemed: c.totalRedeemed, status: c.status });
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    const bonus = Math.round(editForm.totalRedeemed * Number(rateInput) / 100);
    try {
      await financeApi.updateDealerBonus(editItem.id, {
        achievedTarget: editForm.totalRedeemed,
        electricianCount: editForm.electriciansCount,
        bonusStatus: editForm.status,
      });
      setBonuses(prev => prev.map(c => c.id === editItem.id ? { ...c, ...editForm, bonus } : c));
      setEditItem(null);
      setAlertDialog({ show: true, title: 'Saved', message: 'Dealer bonus record updated successfully.', type: 'success' });
    } catch (err) {
      console.error('Failed to save bonus:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save changes.';
      setAlertDialog({ show: true, title: 'Error', message: msg, type: 'error' });
    }
  };

  const labelStyle = { fontSize: 12, fontWeight: 600 as const, color: C.muted, marginBottom: 5, display: 'block' as const };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      pending: { bg: 'rgba(245,158,11,0.15)', color: '#D97706' },
      paid: { bg: 'rgba(34,197,94,0.15)', color: '#16A34A' },
      processing: { bg: 'rgba(99,102,241,0.15)', color: '#6366F1' },
    };
    const s = map[status] || map.pending;
    return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' as const }}>{status}</span>;
  };

  const inputStyle = { padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 13, outline: 'none' };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 24 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #15803D, #16A34A)', borderRadius: 16, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Dealer Bonus</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Manage dealer bonus payments</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Earned', value: `₹${stats.totalEarned.toLocaleString()}`, bg: 'rgba(255,255,255,0.15)', color: '#fff' },
            { label: 'Total Paid', value: `₹${stats.totalPaid.toLocaleString()}`, bg: 'rgba(34,197,94,0.25)', color: '#86EFAC' },
            { label: 'Pending', value: `₹${stats.pending.toLocaleString()}`, bg: 'rgba(245,158,11,0.25)', color: '#FCD34D' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '10px 18px', textAlign: 'center', minWidth: 80 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
          {/* Rate Card */}
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 18px', textAlign: 'center', minWidth: 80, cursor: 'pointer' }} onClick={() => setEditRate(true)}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{rateInput}%</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>Bonus Rate ✏️</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} style={inputStyle}>
          <option value="all">All Months</option>
          {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m}>{m}</option>)}
        </select>
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} style={inputStyle}>
          <option value="all">All Years</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </select>
        <input value={dealerFilter} onChange={e => setDealerFilter(e.target.value)} placeholder="Filter by dealer..." style={inputStyle} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="processing">Processing</option>
        </select>
        <button onClick={() => setShowExport(true)} style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Upload size={14} /> Export
        </button>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 16px', background: 'rgba(21,128,61,0.1)', borderRadius: 10, border: '1px solid rgba(21,128,61,0.25)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#15803D' }}>{selected.length} selected</span>
          <button onClick={() => setBulkPay(true)} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: 'rgba(34,197,94,0.15)', color: '#16A34A', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✓ Bulk Mark Paid</button>
          <button onClick={() => setSelected([])} style={{ padding: '6px 14px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 12, cursor: 'pointer' }}>Clear</button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: C.shadow }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} style={{ accentColor: C.red }} />
                </th>
                {['Dealer Name', 'Phone', 'Month', 'Electricians', 'Total Redeemed', 'Bonus (5%)', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.hoverRow)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px' }}>
                    <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} style={{ accentColor: C.red }} />
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>{c.dealerName}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: C.muted }}>{c.dealerPhone}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>{c.month} {c.year}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.text }}>{c.electriciansCount}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: C.text }}>₹{c.totalRedeemed.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 800, color: '#15803D' }}>₹{c.bonus.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px' }}>{statusBadge(c.status)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {c.status === 'pending' && (
                        <button onClick={() => setMarkPaidId(c.id)} style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: 'rgba(34,197,94,0.15)', color: '#16A34A', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Check size={12} /> Mark Paid
                        </button>
                      )}
                      <button onClick={() => openEdit(c)} title="Edit" style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: '#EFF6FF', color: '#1D4ED8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Pencil size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: C.muted, fontSize: 14 }}>No bonus records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Rate Modal */}
      {editRate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditRate(false)}>
          <div style={{ background: C.card, borderRadius: 18, width: 360, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.3)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Edit Bonus Rate</div>
              <button onClick={() => setEditRate(false)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 8 }}>Bonus Rate (%)</div>
              <input type="number" value={rateInput} onChange={e => setRateInput(e.target.value)} min={0} max={100} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const, fontSize: 18, fontWeight: 700 }} />
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditRate(false)} style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveRate} disabled={rateSaving} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: rateSaving ? C.muted : 'linear-gradient(135deg, #15803D, #16A34A)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: rateSaving ? 'not-allowed' : 'pointer' }}>{rateSaving ? 'Saving...' : 'Save Rate'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bonus Modal */}
      {editItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditItem(null)}>
          <div style={{ background: C.card, borderRadius: 18, width: 480, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.3)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pencil size={18} color="#1D4ED8" />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Edit Bonus</div>
              </div>
              <button onClick={() => setEditItem(null)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Dealer Name</label>
                  <input value={editForm.dealerName} onChange={e => setEditForm(f => ({ ...f, dealerName: e.target.value }))} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input value={editForm.dealerPhone} onChange={e => setEditForm(f => ({ ...f, dealerPhone: e.target.value }))} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={labelStyle}>Month</label>
                  <select value={editForm.month} onChange={e => setEditForm(f => ({ ...f, month: e.target.value }))} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }}>
                    {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Year</label>
                  <input type="number" value={numberInputValue(editForm.year)} onChange={e => setEditForm(f => ({ ...f, year: e.target.value === '' ? 0 : Number(e.target.value) }))} placeholder={String(new Date().getFullYear())} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={labelStyle}>Electricians Count</label>
                  <input type="number" value={numberInputValue(editForm.electriciansCount)} onChange={e => setEditForm(f => ({ ...f, electriciansCount: e.target.value === '' ? 0 : Number(e.target.value) }))} min={0} placeholder="0" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={labelStyle}>Total Redeemed (₹)</label>
                  <input type="number" value={numberInputValue(editForm.totalRedeemed)} onChange={e => setEditForm(f => ({ ...f, totalRedeemed: e.target.value === '' ? 0 : Number(e.target.value) }))} min={0} placeholder="0" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }} />
                </div>
              </div>
              <div style={{ padding: '12px 16px', background: 'rgba(21,128,61,0.08)', borderRadius: 10, border: '1px solid rgba(21,128,61,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>Bonus ({rateInput}% of ₹{editForm.totalRedeemed.toLocaleString()})</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#15803D' }}>₹{Math.round(editForm.totalRedeemed * Number(rateInput) / 100).toLocaleString()}</span>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as BonusRecord['status'] }))} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }}>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="processing">Processing</option>
                </select>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditItem(null)} style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleEditSave} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        show={markPaidId !== null}
        title="Mark as Paid"
        message={`Mark bonus for "${bonuses.find(c => c.id === markPaidId)?.dealerName}" as paid?`}
        onConfirm={() => markPaidId !== null && handleMarkPaid(markPaidId)}
        onCancel={() => setMarkPaidId(null)}
        confirmText="Mark Paid"
        type="success"
      />

      <ConfirmDialog
        show={bulkPay}
        title="Bulk Mark Paid"
        message={`Mark ${selected.length} bonus records as paid?`}
        onConfirm={handleBulkPaid}
        onCancel={() => setBulkPay(false)}
        confirmText="Mark All Paid"
        type="success"
      />

      <AlertDialog
        show={alertDialog.show}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog((p) => ({ ...p, show: false }))}
      />

      <ExportModal
        show={showExport}
        onClose={() => setShowExport(false)}
        title="Dealer Bonus"
        getData={() => filtered.map(c => ({ ID: c.id, Dealer: c.dealerName, Phone: c.dealerPhone, Month: `${c.month} ${c.year}`, Electricians: c.electriciansCount, 'Total Redeemed': c.totalRedeemed, Bonus: c.bonus, Status: c.status }))}
        fileName="dealer-bonus"
      />
    </div>
  );
}
