'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, Eye, Upload, ArrowLeftRight, RotateCcw, Pencil, Trash2 } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { financeApi, settingsApi } from '@/lib/api';
import ExportModal from '@/components/Shared/ExportModal';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import AlertDialog from '@/components/Shared/AlertDialog';

interface Transfer {
  id: string;
  fromName: string;
  fromCode: string;
  toName: string;
  toPhone: string;
  points: number;
  date: string;
  reason: string;
  status: 'pending' | 'completed' | 'reversed';
}

const REASON_OPTIONS = [
  'Bonus for top performance',
  'Referral bonus',
  'Campaign reward',
  'Dealer incentive',
  'Festival bonus',
  'Scan milestone',
  'KYC completion bonus',
  'Monthly target achieved',
  'App review bonus',
  'Referral chain bonus',
  'Correction',
  'Adjustment',
  'Other',
];

const EMPTY_FORM = { fromUser: '', toUser: '', points: 0, reason: '', customReason: '' };
const EMPTY_EDIT = { fromUser: '', toUser: '', points: 0, reason: '', customReason: '', status: 'pending' as Transfer['status'] };
const numberInputValue = (value: number | null | undefined) => value === 0 || value === null || value === undefined ? '' : value;
const DEFAULT_MIN_TRANSFER_POINTS = 100;

export default function TransferPoints({ role }: { role?: import('@/lib/types').AdminRole }) {
  const C = useThemePalette();
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin';
  const canCreate = isSuperAdmin;
  const canEdit = isSuperAdmin || isAdmin;
  const canDelete = isSuperAdmin;
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [minTransferPoints, setMinTransferPoints] = useState(DEFAULT_MIN_TRANSFER_POINTS);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilter, setShowFilter] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [viewItem, setViewItem] = useState<Transfer | null>(null);
  const [reverseId, setReverseId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editItem, setEditItem] = useState<Transfer | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'error' });

  const loadTransfers = async () => {
    try {
      setLoading(true);
      const res = await financeApi.getTransferPoints();
      const data = res?.transfers ?? (Array.isArray(res) ? res : (res as any).data ?? []);
      setTransfers(data.map((t: any, i: number) => ({
        id: t.id ?? String(i + 1),
        fromName: t.fromName ?? t.from_name ?? (t.description?.split(' to ')?.[0]?.replace('Manual transfer from ', '') ?? 'Admin'),
        fromCode: t.fromCode ?? t.from_code ?? 'ADM',
        toName: t.toName ?? t.to_name ?? (t.description?.split(' to ')?.[1] ?? 'User'),
        toPhone: t.toPhone ?? t.to_phone ?? '—',
        // Ensure numeric so totals don't become string concatenations.
        points: Number(t.points ?? t.amount ?? 0),
        date: (t.date ?? t.createdAt ?? t.created_at ?? new Date().toISOString()).slice(0, 10),
        reason: t.reason ?? t.description ?? '',
        status: t.status ?? 'completed',
      })));
    } catch (err) {
      console.error('Failed to load transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTransfers(); }, []);

  useEffect(() => {
    settingsApi.getAll().then((rows: any[]) => {
      const map: Record<string, string> = {};
      (rows ?? []).forEach((r: any) => { map[r.key] = r.value; });
      const parsed = Number(map['minTransferPoints'] ?? map['min_transfer_points']);
      if (Number.isFinite(parsed) && parsed > 0) setMinTransferPoints(parsed);
    }).catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    let list = transfers;
    if (statusFilter !== 'all') list = list.filter(t => t.status === statusFilter);
    if (dateFrom) list = list.filter(t => t.date >= dateFrom);
    if (dateTo) list = list.filter(t => t.date <= dateTo);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t => t.fromName.toLowerCase().includes(q) || t.toName.toLowerCase().includes(q) || t.toPhone.includes(q) || t.fromCode.toLowerCase().includes(q));
    }
    return list;
  }, [transfers, statusFilter, dateFrom, dateTo, search]);

  const stats = useMemo(() => ({
    total: transfers.length,
    totalPoints: transfers.filter(t => t.status !== 'reversed').reduce((s, t) => s + Number(t.points || 0), 0),
    pending: transfers.filter(t => t.status === 'pending').length,
    completed: transfers.filter(t => t.status === 'completed').length,
  }), [transfers]);

  const handleReverse = async () => {
    if (reverseId === null) return;
    try {
      await financeApi.reverseTransfer(reverseId);
      await loadTransfers();
    } catch (err) {
      console.error('Failed to reverse transfer:', err);
      setAlertDialog({ show: true, title: 'Error', message: 'Failed to reverse transfer. Please try again.', type: 'error' });
    }
    setReverseId(null);
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await financeApi.deleteTransfer(deleteId);
      await loadTransfers();
    } catch (err) {
      console.error('Failed to delete transfer:', err);
      setAlertDialog({ show: true, title: 'Error', message: 'Failed to delete transfer. Please try again.', type: 'error' });
    }
    setDeleteId(null);
  };

  const openEdit = (t: Transfer) => {
    setEditItem(t);
    const isOtherReason = !REASON_OPTIONS.slice(0, -1).includes(t.reason);
    setEditForm({ 
      fromUser: t.fromName, 
      toUser: t.toName, 
      points: t.points, 
      reason: isOtherReason ? 'Other' : t.reason, 
      customReason: isOtherReason ? t.reason : '',
      status: t.status 
    });
  };

  const handleEditSave = async () => {
    if (!editItem || !editForm.fromUser.trim() || !editForm.toUser.trim() || editForm.points <= 0) {
      setAlertDialog({ show: true, title: 'Required Fields Missing', message: 'Please fill all required fields', type: 'error' });
      return;
    }
    if (editForm.points < minTransferPoints) {
      setAlertDialog({ show: true, title: 'Minimum Points', message: `Minimum ${minTransferPoints} points can be transferred.`, type: 'warning' });
      return;
    }
    const finalReason = editForm.reason === 'Other' ? editForm.customReason : editForm.reason;
    // Update local display state (wallet transactions are immutable records)
    setTransfers(prev => prev.map(t => t.id === editItem.id
      ? { ...t, fromName: editForm.fromUser, toName: editForm.toUser, points: editForm.points, reason: finalReason, status: editForm.status }
      : t
    ));
    setEditItem(null);
  };

  const handleManualTransfer = async () => {
    if (!form.fromUser.trim() || !form.toUser.trim() || form.points <= 0) {
      setAlertDialog({ show: true, title: 'Required Fields Missing', message: 'Please fill all required fields (From User, To User, Points)', type: 'error' });
      return;
    }
    if (form.points < minTransferPoints) {
      setAlertDialog({ show: true, title: 'Minimum Points', message: `Minimum ${minTransferPoints} points can be transferred.`, type: 'warning' });
      return;
    }
    const finalReason = form.reason === 'Other' ? form.customReason : form.reason;
    try {
      await financeApi.transferPoints({ fromUser: form.fromUser, toUser: form.toUser, points: form.points, reason: finalReason });
      await loadTransfers();
      setForm(EMPTY_FORM);
      setShowTransferModal(false);
    } catch (err) {
      console.error('Failed to transfer points:', err);
      setAlertDialog({ show: true, title: 'Error', message: 'Failed to transfer points. Please try again.', type: 'error' });
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      pending: { bg: 'rgba(245,158,11,0.15)', color: '#D97706' },
      completed: { bg: 'rgba(34,197,94,0.15)', color: '#16A34A' },
      reversed: { bg: 'rgba(239,68,68,0.15)', color: '#DC2626' },
    };
    const s = map[status] || map.pending;
    return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' as const }}>{status}</span>;
  };

  const inputStyle = { padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 13, outline: 'none' };
  const labelStyle = { fontSize: 12, fontWeight: 600 as const, color: C.muted, marginBottom: 5, display: 'block' as const };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 24 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0F766E, #0D9488)', borderRadius: 16, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeftRight size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Transfer Points</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>View and manage point transfers between users</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Total Transfers', value: stats.total, bg: 'rgba(255,255,255,0.15)', color: '#fff' },
            { label: 'Points Transferred', value: stats.totalPoints.toLocaleString(), bg: 'rgba(20,184,166,0.3)', color: '#99F6E4' },
            { label: 'Pending', value: stats.pending, bg: 'rgba(245,158,11,0.25)', color: '#FCD34D' },
            { label: 'Completed', value: stats.completed, bg: 'rgba(34,197,94,0.2)', color: '#86EFAC' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '10px 18px', textAlign: 'center', minWidth: 72 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
          {canCreate && <button onClick={() => setShowTransferModal(true)} style={{ padding: '10px 18px', borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeftRight size={14} /> Manual Transfer
          </button>}
          {canCreate && <button onClick={() => setShowTransferModal(true)} style={{ padding: '10px 18px', borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.3)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            + Add New Transfer
          </button>}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} color={C.muted} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, code, phone..." style={{ ...inputStyle, paddingLeft: 34, width: '100%', boxSizing: 'border-box' as const }} />
        </div>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From" style={inputStyle} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To" style={inputStyle} />
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowFilter(!showFilter)} style={{ padding: '9px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <SlidersHorizontal size={14} /> Filters
          </button>
          {showFilter && (
            <div style={{ position: 'absolute', top: '110%', right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, zIndex: 100, minWidth: 200, boxShadow: C.shadow }}>
              <div style={labelStyle}>Status</div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="reversed">Reversed</option>
              </select>
              <button onClick={() => { setStatusFilter('all'); setShowFilter(false); }} style={{ marginTop: 10, width: '100%', padding: '7px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 12, cursor: 'pointer' }}>Clear</button>
            </div>
          )}
        </div>
        <button onClick={() => setShowExport(true)} style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Upload size={14} /> Export
        </button>
      </div>

      {/* Table */}
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: C.shadow }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                {['#', 'From', 'To', 'Points', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.hoverRow)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: C.muted }}>{t.id}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.fromName}</div>
                    <div style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>{t.fromCode}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.toName}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{t.toPhone}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0F766E' }}>+{t.points.toLocaleString()}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>{t.date}</td>
                  <td style={{ padding: '12px 16px' }}>{statusBadge(t.status)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setViewItem(t)} title="View" style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Eye size={13} />
                      </button>
                      {canEdit && <button onClick={() => openEdit(t)} title="Edit" style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: '#EFF6FF', color: '#1D4ED8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Pencil size={13} />
                      </button>}
                      {canDelete && t.status === 'completed' && (
                        <button onClick={() => setReverseId(t.id)} title="Reverse" style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: 'rgba(239,68,68,0.12)', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <RotateCcw size={13} />
                        </button>
                      )}
                      {canDelete && <button onClick={() => setDeleteId(t.id)} title="Delete" style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: '#FEE2E2', color: '#991B1B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={13} />
                      </button>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: C.muted, fontSize: 14 }}>No transfers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {viewItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setViewItem(null)}>
          <div style={{ background: C.card, borderRadius: 18, width: 460, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.3)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Transfer Details</div>
              <button onClick={() => setViewItem(null)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                ['Transfer ID', `#${viewItem.id}`], ['Points', `${viewItem.points.toLocaleString()} pts`],
                ['From', viewItem.fromName], ['From Code', viewItem.fromCode],
                ['To', viewItem.toName], ['To Phone', viewItem.toPhone],
                ['Date', viewItem.date], ['Status', viewItem.status],
                ['Reason', viewItem.reason],
              ].map(([label, value]) => (
                <div key={label as string} style={{ gridColumn: label === 'Reason' ? 'span 2' : 'span 1' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{value as string}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manual Transfer Modal */}
      {showTransferModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowTransferModal(false)}>
          <div style={{ background: C.card, borderRadius: 18, width: 440, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.3)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(15,118,110,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowLeftRight size={18} color="#0F766E" />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Manual Transfer</div>
              </div>
              <button onClick={() => setShowTransferModal(false)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>From User *</label>
                <input value={form.fromUser} onChange={e => setForm(f => ({ ...f, fromUser: e.target.value }))} placeholder="Name or code" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={labelStyle}>To User *</label>
                <input value={form.toUser} onChange={e => setForm(f => ({ ...f, toUser: e.target.value }))} placeholder="Name or phone" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={labelStyle}>Points *</label>
                <input type="number" value={numberInputValue(form.points)} onChange={e => setForm(f => ({ ...f, points: e.target.value === '' ? 0 : Number(e.target.value) }))} placeholder="0" min={minTransferPoints} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={labelStyle}>Reason</label>
                <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }}>
                  <option value="">Select reason...</option>
                  {REASON_OPTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              {form.reason === 'Other' && (
                <div>
                  <label style={labelStyle}>Custom Reason</label>
                  <input value={form.customReason} onChange={e => setForm(f => ({ ...f, customReason: e.target.value }))} placeholder="Enter custom reason..." style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }} />
                </div>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowTransferModal(false)} style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleManualTransfer} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #0F766E, #0D9488)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Transfer Points</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transfer Modal */}
      {editItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditItem(null)}>
          <div style={{ background: C.card, borderRadius: 18, width: 440, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.3)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pencil size={18} color="#1D4ED8" />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Edit Transfer</div>
              </div>
              <button onClick={() => setEditItem(null)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>From User *</label>
                <input value={editForm.fromUser} onChange={e => setEditForm(f => ({ ...f, fromUser: e.target.value }))} placeholder="Name or code" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={labelStyle}>To User *</label>
                <input value={editForm.toUser} onChange={e => setEditForm(f => ({ ...f, toUser: e.target.value }))} placeholder="Name or phone" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={labelStyle}>Points *</label>
                <input type="number" value={numberInputValue(editForm.points)} onChange={e => setEditForm(f => ({ ...f, points: e.target.value === '' ? 0 : Number(e.target.value) }))} placeholder="0" min={minTransferPoints} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={labelStyle}>Reason</label>
                <select value={editForm.reason} onChange={e => setEditForm(f => ({ ...f, reason: e.target.value }))} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }}>
                  <option value="">Select reason...</option>
                  {REASON_OPTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              {editForm.reason === 'Other' && (
                <div>
                  <label style={labelStyle}>Custom Reason</label>
                  <input value={editForm.customReason} onChange={e => setEditForm(f => ({ ...f, customReason: e.target.value }))} placeholder="Enter custom reason..." style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }} />
                </div>
              )}
              <div>
                <label style={labelStyle}>Status</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as Transfer['status'] }))} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }}>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="reversed">Reversed</option>
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
        show={reverseId !== null}
        title="Reverse Transfer"
        message="Are you sure you want to reverse this transfer? Points will be returned to the sender."
        onConfirm={handleReverse}
        onCancel={() => setReverseId(null)}
        confirmText="Reverse"
        type="danger"
      />

      <ConfirmDialog
        show={deleteId !== null}
        title="Delete Transfer"
        message="Are you sure you want to delete this transfer record? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        confirmText="Delete"
        type="danger"
      />

      <ExportModal
        show={showExport}
        onClose={() => setShowExport(false)}
        title="Transfer Points"
        getData={() => filtered.map(t => ({ ID: t.id, From: t.fromName, 'From Code': t.fromCode, To: t.toName, 'To Phone': t.toPhone, Points: t.points, Date: t.date, Reason: t.reason, Status: t.status }))}
        fileName="transfer-points"
      />
      <AlertDialog show={alertDialog.show} title={alertDialog.title} message={alertDialog.message} type={alertDialog.type} onClose={() => setAlertDialog({ ...alertDialog, show: false })} />
    </div>
  );
}
