'use client';
import { useEffect, useRef, useState } from 'react';
import { FileCheck, Eye, Check, X, Upload, ImageIcon, Pencil, Trash2, FileSpreadsheet } from 'lucide-react';
import { appUserApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import type { AppUser } from '@/lib/types';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import ExportModal from '@/components/Shared/ExportModal';

type UserKYCItem = AppUser & {
  kycStatus: 'not_submitted' | 'pending' | 'verified' | 'rejected';
};

function normalizeUrl(url?: string | null) {
  if (!url) return url ?? undefined;
  return url.replace(
    /http:\/\/(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.\d+\.\d+\.\d+)(:\d+)?/g,
    (_, _ip, port) => `http://localhost${port || ''}`,
  );
}

function ImageUploadBox({
  label,
  value,
  onChange,
  C,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  C: ReturnType<typeof useThemePalette>;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
      <div
        onClick={() => ref.current?.click()}
        style={{
          border: `2px dashed ${value ? C.red : C.border}`,
          borderRadius: 10,
          height: 140,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: value ? 'transparent' : C.bg,
          overflow: 'hidden',
        }}
      >
        {value ? (
          <img src={value} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <>
            <Upload size={20} style={{ color: C.muted, marginBottom: 6 }} />
            <span style={{ fontSize: 11, color: C.muted }}>Click to upload</span>
          </>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  );
}

function DocThumb({ src, C }: { src?: string; C: ReturnType<typeof useThemePalette> }) {
  const [open, setOpen] = useState(false);

  if (!src) {
    return (
      <div style={{ width: 48, height: 36, borderRadius: 6, background: C.bg, border: `1px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ImageIcon size={14} style={{ color: C.muted }} />
      </div>
    );
  }

  return (
    <>
      <img src={src} alt="aadhaar" onClick={() => setOpen(true)} style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 6, border: `1px solid ${C.border}`, cursor: 'pointer' }} />
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setOpen(false)}>
          <img src={src} alt="aadhaar" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12 }} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

function EditKYCModal({
  doc,
  onClose,
  onSave,
  C,
}: {
  doc: UserKYCItem;
  onClose: () => void;
  onSave: (data: Partial<UserKYCItem>) => void;
  C: ReturnType<typeof useThemePalette>;
}) {
  const [form, setForm] = useState<Partial<UserKYCItem>>({
    aadharFrontImage: doc.aadharFrontImage ?? '',
    kycStatus: doc.kycStatus,
    kycRejectionReason: doc.kycRejectionReason ?? '',
  });

  const setField = (key: keyof UserKYCItem, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));
  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: 20, width: 560, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Edit KYC - {doc.name}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Update Aadhaar image and KYC status</div>
          </div>
          <button onClick={onClose} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>X</button>
        </div>
        <div style={{ padding: 24, display: 'grid', gap: 16 }}>
          <ImageUploadBox label="Aadhaar Card" value={form.aadharFrontImage ?? ''} onChange={value => setField('aadharFrontImage', value)} C={C} />
          <div>
            <label style={labelStyle}>KYC Status</label>
            <select style={inputStyle} value={form.kycStatus ?? 'not_submitted'} onChange={e => setField('kycStatus', e.target.value)}>
              <option value="not_submitted">Not Submitted</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          {form.kycStatus === 'rejected' && (
            <div>
              <label style={labelStyle}>Rejection Reason</label>
              <input style={inputStyle} value={form.kycRejectionReason ?? ''} onChange={e => setField('kycRejectionReason', e.target.value)} placeholder="Reason for rejection" />
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

export default function UserKYC() {
  const C = useThemePalette();
  const [documents, setDocuments] = useState<UserKYCItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState<UserKYCItem | null>(null);
  const [editingDoc, setEditingDoc] = useState<UserKYCItem | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [confirmState, setConfirmState] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; type: 'success' | 'danger' }>({ show: false, title: '', message: '', onConfirm: () => {}, type: 'success' });

  useEffect(() => {
    let active = true;

    void appUserApi.getAll({ limit: '500' })
      .then((res: UserKYCItem[] | { data?: UserKYCItem[] }) => {
        if (!active) return;
        const data = Array.isArray(res) ? res : res.data ?? [];
        setDocuments(data.map(item => ({
          ...item,
          kycStatus: item.kycStatus ?? 'not_submitted',
          aadharFrontImage: normalizeUrl(item.aadharFrontImage),
        })));
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filtered = documents.filter(item => {
    const q = search.toLowerCase();
    const matchSearch = !search || item.name.toLowerCase().includes(q) || item.userCode.toLowerCase().includes(q) || item.phone.includes(search);
    const matchStatus = filterStatus === 'all' || item.kycStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusOrder: Record<string, number> = { pending: 0, rejected: 1, not_submitted: 2, verified: 3 };
  const sorted = [...filtered].sort((a, b) => {
    const diff = (statusOrder[a.kycStatus] ?? 2) - (statusOrder[b.kycStatus] ?? 2);
    if (diff !== 0) return diff;
    return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
  });

  const handleVerify = (doc: UserKYCItem) => {
    setConfirmState({
      show: true,
      title: 'Verify KYC',
      message: `Verify KYC for ${doc.name}?`,
      type: 'success',
      onConfirm: async () => {
        try {
          await appUserApi.update(doc.id, { kycStatus: 'verified', kycRejectionReason: null, panNumber: null, panDocument: null });
          setDocuments(prev => prev.map(item => item.id === doc.id ? { ...item, kycStatus: 'verified', kycRejectionReason: undefined } : item));
        } catch (error) {
          console.error(error);
        }
        setConfirmState(prev => ({ ...prev, show: false }));
      },
    });
  };

  const handleReject = (doc: UserKYCItem) => {
    setConfirmState({
      show: true,
      title: 'Reject KYC',
      message: `Reject KYC for ${doc.name}?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await appUserApi.update(doc.id, { kycStatus: 'rejected', panNumber: null, panDocument: null });
          setDocuments(prev => prev.map(item => item.id === doc.id ? { ...item, kycStatus: 'rejected' } : item));
        } catch (error) {
          console.error(error);
        }
        setConfirmState(prev => ({ ...prev, show: false }));
      },
    });
  };

  const handleEditSave = async (data: Partial<UserKYCItem>) => {
    if (!editingDoc) return;
    try {
      const nextStatus: UserKYCItem['kycStatus'] = data.kycStatus ?? editingDoc.kycStatus;
      const payload = {
        aadharFrontImage: data.aadharFrontImage ?? null,
        kycStatus: nextStatus,
        kycRejectionReason: nextStatus === 'rejected' ? data.kycRejectionReason ?? null : null,
        panNumber: null,
        panDocument: null,
      };
      await appUserApi.update(editingDoc.id, payload);
      setDocuments(prev =>
        prev.map(item =>
          item.id === editingDoc.id
            ? {
                ...item,
                kycStatus: nextStatus,
                kycRejectionReason: nextStatus === 'rejected' ? (data.kycRejectionReason ?? item.kycRejectionReason) : undefined,
                aadharFrontImage: normalizeUrl(payload.aadharFrontImage ?? undefined),
                panNumber: undefined,
                panDocument: undefined,
              }
            : item,
        ),
      );
      setEditingDoc(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = (doc: UserKYCItem) => {
    setConfirmState({
      show: true,
      title: 'Delete KYC Data',
      message: `Delete KYC data for ${doc.name}? This will clear Aadhaar image and reset KYC status.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await appUserApi.update(doc.id, {
            kycStatus: 'not_submitted',
            aadharNumber: null,
            aadharFrontImage: null,
            panNumber: null,
            panDocument: null,
            gstDocument: null,
            kycRejectionReason: null,
          });
          setDocuments(prev => prev.map(item => item.id === doc.id ? {
            ...item,
            kycStatus: 'not_submitted',
            aadharNumber: undefined,
            aadharFrontImage: undefined,
            panNumber: undefined,
            panDocument: undefined,
            gstDocument: undefined,
            kycRejectionReason: undefined,
          } : item));
        } catch (error) {
          console.error(error);
        }
        setConfirmState(prev => ({ ...prev, show: false }));
      },
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

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <ConfirmDialog show={confirmState.show} title={confirmState.title} message={confirmState.message} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(prev => ({ ...prev, show: false }))} type={confirmState.type} />
      {editingDoc && <EditKYCModal doc={editingDoc} onClose={() => setEditingDoc(null)} onSave={handleEditSave} C={C} />}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><FileCheck size={24} style={{ color: C.red }} /> KYC Management</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>Verify and manage customer Aadhaar KYC documents</p>
        </div>
        <button onClick={() => setShowExport(true)} style={{ background: C.red, color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><FileSpreadsheet size={14} /> Export</button>
      </div>
      <ExportModal show={showExport} onClose={() => setShowExport(false)} title="User KYC" fileName="user-kyc" getData={() => documents.map(item => ({ Name: item.name, Code: item.userCode, KYCStatus: item.kycStatus, AadhaarImage: item.aadharFrontImage ?? '' }))} />

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
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Loading...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                {['Customer', 'Code', 'Aadhaar Doc', 'KYC Status', 'Actions'].map(head => (
                  <th key={head} style={{ padding: '14px 16px', textAlign: head === 'Aadhaar Doc' || head === 'KYC Status' || head === 'Actions' ? 'center' : 'left', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: C.muted }}>No users found</td></tr>
              ) : sorted.map(doc => {
                const status = statusConfig[doc.kycStatus] ?? statusConfig.not_submitted;
                return (
                  <tr key={doc.id} style={{ borderBottom: `1px solid ${C.border}` }} onMouseEnter={e => { e.currentTarget.style.background = C.hoverRow; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <td style={{ padding: '13px 16px' }}><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{doc.name}</div></td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>{doc.userCode}</td>
                    <td style={{ padding: '13px 16px', textAlign: 'center' }}><DocThumb src={doc.aadharFrontImage} C={C} /></td>
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
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>KYC Details - {selectedDoc.name}</div>
              <button onClick={() => setSelectedDoc(null)} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>X</button>
            </div>
            <div style={{ padding: 22, display: 'grid', gap: 10 }}>
              {[['Code', selectedDoc.userCode], ['KYC Status', selectedDoc.kycStatus], ['Rejection Reason', selectedDoc.kycRejectionReason || '-']].map(([key, value]) => (
                <div key={String(key)} style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}><strong>{key}:</strong> {value}</div>
              ))}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8, textTransform: 'uppercase' }}>Aadhaar</div>
                {selectedDoc.aadharFrontImage ? <img src={selectedDoc.aadharFrontImage} alt="Aadhaar" style={{ width: '100%', maxWidth: 320, borderRadius: 10, border: `1px solid ${C.border}` }} /> : <div style={{ height: 120, maxWidth: 320, background: C.bg, borderRadius: 10, border: `1px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 12 }}>No image</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
