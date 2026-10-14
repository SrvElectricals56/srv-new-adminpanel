 'use client';
import { useState, useEffect, useRef } from 'react';
import { FileCheck, Eye, Check, X, Search, Upload, ImageIcon, Pencil, Trash2, FileSpreadsheet } from 'lucide-react';
import { dealerApi } from '@/lib/api';
import { approveAllKyc, getStoredAdmin, documentUrl } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import { DocThumb, ImageUploadBox } from '@/components/Shared/KycDocument';
import ExportModal from '@/components/Shared/ExportModal';

interface DealerKYC {
  id: string;
  dealerName: string;
  dealerCode: string;
  phone: string;
  kycStatus: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  aadharNumber?: string;
  panNumber?: string;
  gstNumber?: string;
  aadharFrontImage?: string;
  panDocument?: string;
  gstDocument?: string;
  kycRejectionReason?: string;
  joinedDate: string;
  updatedAt?: string;
}

function EditKYCModal({ doc, onClose, onSave, C }: { doc: DealerKYC; onClose: () => void; onSave: (data: Partial<DealerKYC>) => void; C: any }) {
  const [form, setForm] = useState<Partial<DealerKYC>>({
    aadharNumber: doc.aadharNumber ?? '',
    panNumber: doc.panNumber ?? '',
    gstNumber: doc.gstNumber ?? '',
    aadharFrontImage: doc.aadharFrontImage ?? '',
    panDocument: doc.panDocument ?? '',
    gstDocument: doc.gstDocument ?? '',
    kycStatus: doc.kycStatus,
    kycRejectionReason: doc.kycRejectionReason ?? '',
  });
  const [uploads, setUploads] = useState(0);
  const [saving, setSaving] = useState(false);
  const onBusy = (busy: boolean) => setUploads(count => Math.max(0, count + (busy ? 1 : -1)));
  const f = (k: keyof DealerKYC, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: 20, width: 580, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Edit KYC — {doc.dealerName}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Update KYC documents and details</div>
          </div>
          <button onClick={onClose} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: 24, display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Aadhar Number</label>
              <input style={inputStyle} value={form.aadharNumber ?? ''} maxLength={12} onChange={e => { if (/^\d*$/.test(e.target.value)) f('aadharNumber', e.target.value); }} placeholder="12-digit Aadhar" />
            </div>
            <div>
              <label style={labelStyle}>PAN Number</label>
              <input style={inputStyle} value={form.panNumber ?? ''} maxLength={10} onChange={e => f('panNumber', e.target.value.toUpperCase())} placeholder="ABCDE1234F" />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>GST Number</label>
              <input style={inputStyle} value={form.gstNumber ?? ''} onChange={e => f('gstNumber', e.target.value.toUpperCase())} placeholder="GST registration number" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            <ImageUploadBox onBusy={onBusy} label="Aadhar Card" value={form.aadharFrontImage} onChange={v => f('aadharFrontImage', v)} C={C} />
            <ImageUploadBox onBusy={onBusy} label="PAN Document" value={form.panDocument} onChange={v => f('panDocument', v)} C={C} />
            <ImageUploadBox onBusy={onBusy} label="GST Document" value={form.gstDocument} onChange={v => f('gstDocument', v)} C={C} />
          </div>
          <div>
            <label style={labelStyle}>KYC Status</label>
            <select style={inputStyle} value={form.kycStatus ?? 'not_submitted'} onChange={e => f('kycStatus', e.target.value)}>
              <option value="not_submitted">Not Submitted</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          {form.kycStatus === 'rejected' && (
            <div>
              <label style={labelStyle}>Rejection Reason</label>
              <input style={inputStyle} value={form.kycRejectionReason ?? ''} onChange={e => f('kycRejectionReason', e.target.value)} placeholder="Reason for rejection" />
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button disabled={saving || uploads > 0} onClick={async () => { setSaving(true); try { await onSave(form); } finally { setSaving(false); } }} style={{ flex: 1, background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
            <button onClick={onClose} style={{ background: C.bg, color: C.muted, border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KYCManagement() {
  const C = useThemePalette();
  const [documents, setDocuments] = useState<DealerKYC[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState<DealerKYC | null>(null);
  const [editingDoc, setEditingDoc] = useState<DealerKYC | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const bulkLock = useRef(false);
  const handleApproveAll = () => setConfirmState({
    show: true, title: 'Approve All KYC', type: 'success',
    message: 'Approve ALL unverified KYC records across every page, including pending, rejected and not submitted records, regardless of search filters? This is an explicit Super Admin approval even for accounts without uploaded documents.',
    onConfirm: async () => {
      if (bulkLock.current) return;
      bulkLock.current = true; setBulkBusy(true);
      try {
        const result = await approveAllKyc('dealer');
        setRefreshKey(value => value + 1);
        window.alert(`${result.approved} KYC records approved.`);
      } catch (error) { window.alert(error instanceof Error ? error.message : 'Bulk approval failed'); }
      finally { bulkLock.current = false; setBulkBusy(false); setConfirmState(s => ({ ...s, show: false })); }
    },
  });

  const [confirmState, setConfirmState] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; type: 'success' | 'danger' }>({ show: false, title: '', message: '', onConfirm: () => {}, type: 'success' });

  useEffect(() => {
    dealerApi.getAll({ limit: '10000', includeMedia: 'true' }).then(res => {
      const data = Array.isArray(res) ? res : (res as any).data ?? [];

      const normalizeUrl = (value?: string) => documentUrl(value) ?? value;

      setDocuments(data.map((d: any) => ({
        id: d.id,
        dealerName: d.name,
        dealerCode: d.dealerCode,
        phone: d.phone ?? '',
        kycStatus: d.kycStatus ?? 'not_submitted',
        aadharNumber: d.aadharNumber,
        panNumber: d.panNumber,
        gstNumber: d.gstNumber,
        aadharFrontImage: normalizeUrl(d.aadharFrontImage),
        aadharBackImage: normalizeUrl(d.aadharBackImage),
        panDocument: normalizeUrl(d.panDocument),
        gstDocument: normalizeUrl(d.gstDocument),
        kycRejectionReason: d.kycRejectionReason,
        joinedDate: d.joinedDate,
        updatedAt: d.updatedAt,
      })));
    }).catch(console.error).finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = documents.filter(d => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      d.dealerName.toLowerCase().includes(q) ||
      d.dealerCode.toLowerCase().includes(q) ||
      d.phone.includes(q) ||
      d.aadharNumber?.toLowerCase().includes(q) ||
      d.panNumber?.toLowerCase().includes(q) ||
      d.gstNumber?.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || d.kycStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  // Sort: pending first (latest resubmit on top), then rejected, not_submitted, verified last
  // Within same status: most recently updated first
  const STATUS_ORDER: Record<string, number> = { pending: 0, rejected: 1, not_submitted: 2, verified: 3 };
  const sorted = [...filtered].sort((a, b) => {
    const diff = (STATUS_ORDER[a.kycStatus] ?? 2) - (STATUS_ORDER[b.kycStatus] ?? 2);
    if (diff !== 0) return diff;
    const aTime = new Date(a.updatedAt || a.joinedDate).getTime();
    const bTime = new Date(b.updatedAt || b.joinedDate).getTime();
    return bTime - aTime;
  });

  const handleVerify = (doc: DealerKYC) => {
    setConfirmState({
      show: true, title: 'Verify KYC',
      message: `Verify KYC for ${doc.dealerName}?`,
      type: 'success',
      onConfirm: async () => {
        try {
          await dealerApi.update(doc.id, { kycStatus: 'verified', kycRejectionReason: null });
          setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, kycStatus: 'verified', kycRejectionReason: undefined } : d));
        } catch (err) { console.error(err); window.alert(err instanceof Error ? err.message : 'Unable to save KYC'); }
        setConfirmState(s => ({ ...s, show: false }));
      }
    });
  };

  const handleReject = (doc: DealerKYC) => {
    const reason = window.prompt(`Rejection reason for ${doc.dealerName} (required):`);
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      window.alert('Please enter a rejection reason so the user knows what to fix.');
      return;
    }
    setConfirmState({
      show: true, title: 'Reject KYC',
      message: `Reject KYC for ${doc.dealerName}? Reason: "${reason.trim()}"`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await dealerApi.update(doc.id, { kycStatus: 'rejected', kycRejectionReason: reason.trim() });
          setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, kycStatus: 'rejected', kycRejectionReason: reason.trim() } : d));
        } catch (err) { console.error(err); window.alert(err instanceof Error ? err.message : 'Unable to save KYC'); }
        setConfirmState(s => ({ ...s, show: false }));
      }
    });
  };

  const handleEditSave = async (data: Partial<DealerKYC>) => {
    if (!editingDoc) return;
    try {
      const updated = await dealerApi.update(editingDoc.id, { ...data, kycRejectionReason: data.kycStatus === 'rejected' ? data.kycRejectionReason : null });
      setDocuments(prev => prev.map(d => d.id === editingDoc.id ? { ...d, ...updated } : d));
      setEditingDoc(null);
    } catch (err) { console.error(err); window.alert(err instanceof Error ? err.message : 'Unable to save KYC'); }
  };

  const handleDelete = (doc: DealerKYC) => {
    setConfirmState({
      show: true, title: 'Delete KYC Data',
      message: `Delete KYC data for ${doc.dealerName}? This will clear all documents and reset KYC status.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await dealerApi.update(doc.id, {
            kycStatus: 'not_submitted',
            aadharNumber: null, panNumber: null, gstNumber: null,
            aadharFrontImage: null, aadharBackImage: null,
            panDocument: null, gstDocument: null,
            kycRejectionReason: null,
          });
          setDocuments(prev => prev.map(d => d.id === doc.id ? {
            ...d, kycStatus: 'not_submitted',
            aadharNumber: undefined, panNumber: undefined, gstNumber: undefined,
            aadharFrontImage: undefined, aadharBackImage: undefined,
            panDocument: undefined, gstDocument: undefined,
            kycRejectionReason: undefined,
          } : d));
        } catch (err) { console.error(err); window.alert(err instanceof Error ? err.message : 'Unable to save KYC'); }
        setConfirmState(s => ({ ...s, show: false }));
      }
    });
  };

  const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
    verified: { bg: '#D1FAE5', color: '#065F46', label: 'Verified' },
    pending: { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
    rejected: { bg: '#FEE2E2', color: '#991B1B', label: 'Rejected' },
    not_submitted: { bg: '#F1F5F9', color: '#475569', label: 'Not Submitted' },
  };

  const stats = [
    { label: 'Total', value: documents.length, color: '#3B82F6', bg: '#EFF6FF', filter: 'all' },
    { label: 'Verified', value: documents.filter(d => d.kycStatus === 'verified').length, color: '#10B981', bg: '#D1FAE5', filter: 'verified' },
    { label: 'Pending', value: documents.filter(d => d.kycStatus === 'pending').length, color: '#F59E0B', bg: '#FFFBEB', filter: 'pending' },
    { label: 'Rejected', value: documents.filter(d => d.kycStatus === 'rejected').length, color: '#EF4444', bg: '#FEE2E2', filter: 'rejected' },
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <ConfirmDialog show={confirmState.show} title={confirmState.title} message={confirmState.message} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(s => ({ ...s, show: false }))} type={confirmState.type} />
      {editingDoc && <EditKYCModal doc={editingDoc} onClose={() => setEditingDoc(null)} onSave={handleEditSave} C={C} />}

      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><FileCheck size={24} style={{ color: C.red }} /> KYC Management</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>Verify and manage dealer KYC documents</p>
        </div>
        {getStoredAdmin()?.role === 'super_admin' && <button disabled={bulkBusy || loading} onClick={handleApproveAll} style={{ background: '#065F46', color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer' }}>{bulkBusy ? 'Approving...' : 'Approve All'}</button>}
        <button onClick={() => setShowExport(true)} style={{ background: C.red, color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><FileSpreadsheet size={14} /> Export</button>
      </div>
      <ExportModal show={showExport} onClose={() => setShowExport(false)} title="Dealer KYC" fileName="dealer-kyc" getData={() => documents.map(d => ({ Dealer: d.dealerName, Phone: d.phone, Code: d.dealerCode, KYCStatus: d.kycStatus, Aadhar: d.aadharNumber ?? '', PAN: d.panNumber ?? '', GST: d.gstNumber ?? '' }))} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div
            key={i}
            onClick={() => setFilterStatus(s.filter)}
            style={{
              background: filterStatus === s.filter ? s.bg : C.card,
              borderRadius: 14,
              padding: '16px 18px',
              border: `2px solid ${filterStatus === s.filter ? s.color : C.border}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              userSelect: 'none',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 16px rgba(0,0,0,0.10)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.card, borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}`, marginBottom: 18, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by dealer, mobile number, code, Aadhaar, PAN or GST..."
            style={{ width: '100%', padding: '9px 12px 9px 38px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: C.surface, color: C.text, boxSizing: 'border-box' }}
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: C.surface, color: C.text }}>
          <option value="all">All Status</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
          <option value="not_submitted">Not Submitted</option>
        </select>
        <span style={{ fontSize: 13, color: C.muted, marginLeft: 'auto' }}>{filtered.length} dealers</span>
      </div>

      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {loading ? <div style={{ padding: '40px', textAlign: 'center', color: C.muted }}>Loading...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                {['Dealer', 'Code', 'Aadhar', 'PAN Doc', 'GST Doc', 'KYC Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: ['Aadhar','PAN Doc','GST Doc'].includes(h) ? 'center' : 'left', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: C.muted }}>No dealers found</td></tr>
              ) : sorted.map(doc => {
                const status = statusConfig[doc.kycStatus] ?? statusConfig['not_submitted'];
                return (
                  <tr key={doc.id} style={{ borderBottom: `1px solid ${C.border}` }} onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = C.hoverRow} onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                    <td style={{ padding: '13px 16px' }}><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{doc.dealerName}</div><div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{doc.phone || 'No mobile number'}</div></td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>{doc.dealerCode}</td>
                    <td style={{ padding: '13px 16px', textAlign: 'center' }}><DocThumb src={doc.aadharFrontImage} C={C} /></td>
                    <td style={{ padding: '13px 16px', textAlign: 'center' }}><DocThumb src={doc.panDocument} C={C} /></td>
                    <td style={{ padding: '13px 16px', textAlign: 'center' }}><DocThumb src={doc.gstDocument} C={C} /></td>
                    <td style={{ padding: '13px 16px', textAlign: 'center' }}><span style={{ background: status.bg, color: status.color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{status.label}</span></td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => setSelectedDoc(doc)} title="View" style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={13} /><span style={{ fontSize: 11, fontWeight: 600 }}>View</span></button>
                        <button onClick={() => setEditingDoc(doc)} title="Edit" style={{ background: '#FFF7ED', color: '#C2410C', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Pencil size={13} /><span style={{ fontSize: 11, fontWeight: 600 }}>Edit</span></button>
                        <button onClick={() => handleDelete(doc)} title="Delete" style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Trash2 size={13} /><span style={{ fontSize: 11, fontWeight: 600 }}>Delete</span></button>
                        {doc.kycStatus === 'pending' && (
                          <>
                            <button onClick={() => handleVerify(doc)} title="Verify" style={{ background: '#D1FAE5', color: '#065F46', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Check size={13} /></button>
                            <button onClick={() => handleReject(doc)} title="Reject" style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={13} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedDoc(null)}>
          <div style={{ background: C.card, borderRadius: 16, width: 580, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>KYC Details — {selectedDoc.dealerName}</div>
              <button onClick={() => setSelectedDoc(null)} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: 22, display: 'grid', gap: 10 }}>
              {[['Dealer Code', selectedDoc.dealerCode], ['KYC Status', selectedDoc.kycStatus], ['Aadhar Number', selectedDoc.aadharNumber || '—'], ['PAN Number', selectedDoc.panNumber || '—'], ['GST Number', selectedDoc.gstNumber || '—'], ['Rejection Reason', selectedDoc.kycRejectionReason || '—']].map(([k, v]) => (
                <div key={k} style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}><strong>{k}:</strong> {v}</div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 4 }}>
                {[['Aadhar', selectedDoc.aadharFrontImage], ['PAN', selectedDoc.panDocument], ['GST', selectedDoc.gstDocument]].map(([label, src]) => (
                  <div key={label}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8, textTransform: 'uppercase' }}>{label}</div>
                    {src ? <DocThumb src={src} C={C} /> : <div style={{ height: 80, background: C.bg, borderRadius: 10, border: `1px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 12 }}>No image</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
