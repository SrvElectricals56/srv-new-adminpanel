'use client';
import { useState, useEffect, useRef } from 'react';
import { FileCheck, Eye, Check, X, Search, Upload, ImageIcon, Pencil, Trash2, FileSpreadsheet } from 'lucide-react';
import { electricianApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import ExportModal from '@/components/Shared/ExportModal';

interface ElectricianKYCItem {
  id: string;
  name: string;
  phone: string;
  electricianCode: string;
  kycStatus: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  aadharNumber?: string;
  panNumber?: string;
  aadharFrontImage?: string;
  panDocument?: string;
  gstDocument?: string;
  kycRejectionReason?: string;
  joinedDate: string;
}

function ImageUploadBox({ label, value, onChange, C }: { label: string; value?: string; onChange: (v: string) => void; C: any }) {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
      <div onClick={() => ref.current?.click()} style={{ border: `2px dashed ${value ? C.red : C.border}`, borderRadius: 10, height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: value ? 'transparent' : C.bg, overflow: 'hidden', position: 'relative' }}>
        {value ? <img src={value} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><Upload size={20} style={{ color: C.muted, marginBottom: 6 }} /><span style={{ fontSize: 11, color: C.muted }}>Click to upload</span></>}
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  );
}

function DocThumb({ src, C }: { src?: string; C: any }) {
  const [open, setOpen] = useState(false);
  if (!src) return (
    <div style={{ width: 48, height: 36, borderRadius: 6, background: C.bg, border: `1px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ImageIcon size={14} style={{ color: C.muted }} />
    </div>
  );
  return (
    <>
      <img src={src} alt="doc" onClick={() => setOpen(true)} style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 6, border: `1px solid ${C.border}`, cursor: 'pointer' }} />
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setOpen(false)}>
          <img src={src} alt="doc" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12 }} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

function EditKYCModal({ doc, onClose, onSave, C }: { doc: ElectricianKYCItem; onClose: () => void; onSave: (data: Partial<ElectricianKYCItem>) => void; C: any }) {
  const [form, setForm] = useState<Partial<ElectricianKYCItem>>({
    aadharNumber: doc.aadharNumber ?? '',
    panNumber: doc.panNumber ?? '',
    aadharFrontImage: doc.aadharFrontImage ?? '',
    panDocument: doc.panDocument ?? '',
    gstDocument: doc.gstDocument ?? '',
    kycStatus: doc.kycStatus,
    kycRejectionReason: doc.kycRejectionReason ?? '',
  });
  const f = (k: keyof ElectricianKYCItem, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: 20, width: 560, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Edit KYC — {doc.name}</div>
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
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            <ImageUploadBox label="Aadhar Card" value={form.aadharFrontImage} onChange={v => f('aadharFrontImage', v)} C={C} />
            <ImageUploadBox label="PAN Document" value={form.panDocument} onChange={v => f('panDocument', v)} C={C} />
            <ImageUploadBox label="GST Document" value={form.gstDocument} onChange={v => f('gstDocument', v)} C={C} />
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
            <button onClick={() => onSave(form)} style={{ flex: 1, background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
            <button onClick={onClose} style={{ background: C.bg, color: C.muted, border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ElectricianKYC() {
  const C = useThemePalette();
  const [documents, setDocuments] = useState<ElectricianKYCItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState<ElectricianKYCItem | null>(null);
  const [editingDoc, setEditingDoc] = useState<ElectricianKYCItem | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [confirmState, setConfirmState] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; type: 'success' | 'danger' }>({ show: false, title: '', message: '', onConfirm: () => {}, type: 'success' });

  useEffect(() => {
    electricianApi.getAll({ limit: '500' }).then(res => {
      const data = Array.isArray(res) ? res : (res as any).data ?? [];

      // Normalize any LAN IP in image URLs to localhost for admin browser
      const normalizeUrl = (url?: string) => {
        if (!url) return url;
        return url.replace(
          /http:\/\/(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.\d+\.\d+\.\d+)(:\d+)?/g,
          (_, _ip, port) => `http://localhost${port || ''}`
        );
      };

      setDocuments(data.map((e: any) => ({
        id: e.id,
        name: e.name,
        phone: e.phone,
        electricianCode: e.electricianCode,
        kycStatus: e.kycStatus ?? 'not_submitted',
        aadharNumber: e.aadharNumber,
        panNumber: e.panNumber,
        aadharFrontImage: normalizeUrl(e.aadharFrontImage),
        panDocument: normalizeUrl(e.panDocument),
        gstDocument: normalizeUrl(e.gstDocument),
        kycRejectionReason: e.kycRejectionReason,
        joinedDate: e.joinedDate,
      })));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = documents.filter(k => {
    const matchSearch = !search ||
      k.name.toLowerCase().includes(search.toLowerCase()) ||
      k.electricianCode.toLowerCase().includes(search.toLowerCase()) ||
      (k.phone && k.phone.includes(search));
    const matchStatus = filterStatus === 'all' || k.kycStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  // Sort: pending first (new requests), then rejected, not_submitted, verified last
  const STATUS_ORDER: Record<string, number> = { pending: 0, rejected: 1, not_submitted: 2, verified: 3 };
  const sorted = [...filtered].sort((a, b) => {
    const diff = (STATUS_ORDER[a.kycStatus] ?? 2) - (STATUS_ORDER[b.kycStatus] ?? 2);
    if (diff !== 0) return diff;
    return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
  });

  const handleVerify = (doc: ElectricianKYCItem) => {
    setConfirmState({
      show: true, title: 'Verify KYC',
      message: `Verify KYC for ${doc.name}?`,
      type: 'success',
      onConfirm: async () => {
        try {
          await electricianApi.update(doc.id, { kycStatus: 'verified' });
          setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, kycStatus: 'verified' } : d));
        } catch (err) { console.error(err); }
        setConfirmState(s => ({ ...s, show: false }));
      }
    });
  };

  const handleReject = (doc: ElectricianKYCItem) => {
    setConfirmState({
      show: true, title: 'Reject KYC',
      message: `Reject KYC for ${doc.name}?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await electricianApi.update(doc.id, { kycStatus: 'rejected' });
          setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, kycStatus: 'rejected' } : d));
        } catch (err) { console.error(err); }
        setConfirmState(s => ({ ...s, show: false }));
      }
    });
  };

  const handleEditSave = async (data: Partial<ElectricianKYCItem>) => {
    if (!editingDoc) return;
    try {
      await electricianApi.update(editingDoc.id, data);
      setDocuments(prev => prev.map(d => d.id === editingDoc.id ? { ...d, ...data } : d));
      setEditingDoc(null);
    } catch (err) { console.error(err); }
  };

  const handleDelete = (doc: ElectricianKYCItem) => {
    setConfirmState({
      show: true, title: 'Delete KYC Data',
      message: `Delete KYC data for ${doc.name}? This will clear all documents and reset KYC status.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await electricianApi.update(doc.id, {
            kycStatus: 'not_submitted',
            aadharNumber: null, panNumber: null,
            aadharFrontImage: null, aadharBackImage: null,
            panDocument: null, gstDocument: null,
            kycRejectionReason: null,
          });
          setDocuments(prev => prev.map(d => d.id === doc.id ? {
            ...d, kycStatus: 'not_submitted',
            aadharNumber: undefined, panNumber: undefined,
            aadharFrontImage: undefined, aadharBackImage: undefined,
            panDocument: undefined, gstDocument: undefined,
            kycRejectionReason: undefined,
          } : d));
        } catch (err) { console.error(err); }
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

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <ConfirmDialog show={confirmState.show} title={confirmState.title} message={confirmState.message} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(s => ({ ...s, show: false }))} type={confirmState.type} />
      {editingDoc && <EditKYCModal doc={editingDoc} onClose={() => setEditingDoc(null)} onSave={handleEditSave} C={C} />}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><FileCheck size={24} style={{ color: C.red }} /> KYC Management</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>Verify and manage electrician KYC documents</p>
        </div>
        <button onClick={() => setShowExport(true)} style={{ background: C.red, color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><FileSpreadsheet size={14} /> Export</button>
      </div>
      <ExportModal show={showExport} onClose={() => setShowExport(false)} title="Electrician KYC" fileName="electrician-kyc" getData={() => documents.map(d => ({ Name: d.name, Code: d.electricianCode, KYCStatus: d.kycStatus, Aadhar: d.aadharNumber ?? '', PAN: d.panNumber ?? '' }))} />

      <div style={{ background: C.card, borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}`, marginBottom: 18, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, code or phone..." style={{ ...inputStyle, flex: 1, minWidth: 220 }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
          <option value="all">All Status</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
          <option value="not_submitted">Not Submitted</option>
        </select>
        <span style={{ fontSize: 13, color: C.muted, marginLeft: 'auto' }}>{filtered.length} results</span>
      </div>

      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {loading ? <div style={{ padding: '40px', textAlign: 'center', color: C.muted }}>Loading...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                {['Electrician', 'Code', 'Aadhar', 'PAN Doc', 'GST Doc', 'KYC Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: ['Aadhar','PAN Doc','GST Doc'].includes(h) ? 'center' : 'left', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: C.muted }}>No electricians found</td></tr>
              ) : sorted.map(doc => {
                const status = statusConfig[doc.kycStatus] ?? statusConfig['not_submitted'];
                return (
                  <tr key={doc.id} style={{ borderBottom: `1px solid ${C.border}` }} onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = C.hoverRow} onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                    <td style={{ padding: '13px 16px' }}><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{doc.name}</div></td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>{doc.electricianCode}</td>
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
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>KYC Details — {selectedDoc.name}</div>
              <button onClick={() => setSelectedDoc(null)} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: 22, display: 'grid', gap: 10 }}>
              {[['Code', selectedDoc.electricianCode], ['KYC Status', selectedDoc.kycStatus], ['Aadhar Number', selectedDoc.aadharNumber || '—'], ['PAN Number', selectedDoc.panNumber || '—'], ['Rejection Reason', selectedDoc.kycRejectionReason || '—']].map(([k, v]) => (
                <div key={k} style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}><strong>{k}:</strong> {v}</div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 4 }}>
                {[['Aadhar', selectedDoc.aadharFrontImage], ['PAN', selectedDoc.panDocument], ['GST', selectedDoc.gstDocument]].map(([label, src]) => (
                  <div key={label}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8, textTransform: 'uppercase' }}>{label}</div>
                    {src ? <img src={src} alt={label} style={{ width: '100%', borderRadius: 10, border: `1px solid ${C.border}` }} /> : <div style={{ height: 80, background: C.bg, borderRadius: 10, border: `1px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 12 }}>No image</div>}
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
