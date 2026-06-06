'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, Check, X, Eye, FileSpreadsheet } from 'lucide-react';
import { electricianApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import ExportModal from '@/components/Shared/ExportModal';
import { formatISTDate } from '@/lib/dateIST';

interface PendingElectrician {
  id: string;
  name: string;
  phone: string;
  email: string;
  town: string;
  state: string;
  joinedDate: string;
  status: 'pending' | 'active' | 'inactive';
}

export default function ElectricianApprovals() {
  const C = useThemePalette();
  const [electricians, setElectricians] = useState<PendingElectrician[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PendingElectrician | null>(null);
  const [confirmState, setConfirmState] = useState<{show: boolean; title: string; message: string; onConfirm: () => void; type: 'success' | 'danger'}>({show: false, title: '', message: '', onConfirm: () => {}, type: 'success'});
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    electricianApi.getAll({ limit: '500' }).then(res => {
      const data = Array.isArray(res) ? res : (res as any).data ?? [];
      setElectricians(data.map((d: any) => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
        email: d.email ?? '',
        town: d.town,
        state: d.state,
        joinedDate: d.joinedDate,
        status: d.status,
      })));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleApprove = (item: PendingElectrician) => {
    setConfirmState({
      show: true, title: 'Approve Electrician', type: 'success',
      message: `Approve ${item.name}?`,
      onConfirm: async () => {
        await electricianApi.updateStatus(item.id, 'active');
        setElectricians(prev => prev.map(d => d.id === item.id ? { ...d, status: 'active' } : d));
        setSelected(null);
        setConfirmState(s => ({ ...s, show: false }));
      },
    });
  };

  const handleReject = (item: PendingElectrician) => {
    setConfirmState({
      show: true, title: 'Reject Electrician', type: 'danger',
      message: `Reject ${item.name}?`,
      onConfirm: async () => {
        await electricianApi.updateStatus(item.id, 'inactive');
        setElectricians(prev => prev.map(d => d.id === item.id ? { ...d, status: 'inactive' } : d));
        setSelected(null);
        setConfirmState(s => ({ ...s, show: false }));
      },
    });
  };

  const pending = electricians.filter(d => d.status === 'pending');
  const approved = electricians.filter(d => d.status === 'active');
  const rejected = electricians.filter(d => d.status === 'inactive');

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <ConfirmDialog show={confirmState.show} title={confirmState.title} message={confirmState.message} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(s => ({ ...s, show: false }))} type={confirmState.type} />

      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={24} style={{ color: C.red }} /> Electrician Approvals</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>Review and approve new electrician registrations</p>
        </div>
        <button onClick={() => setShowExport(true)} style={{ background: C.red, color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><FileSpreadsheet size={14} /> Export</button>
      </div>
      <ExportModal show={showExport} onClose={() => setShowExport(false)} title="Electrician Approvals" fileName="electrician-approvals" getData={() => electricians.map(d => ({ Name: d.name, Phone: d.phone, Email: d.email, Town: d.town, State: d.state, JoinedAt: d.joinedDate, Status: d.status }))} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Pending', value: pending.length, color: '#F59E0B', bg: '#FFFBEB' },
          { label: 'Approved', value: approved.length, color: '#10B981', bg: '#D1FAE5' },
          { label: 'Rejected', value: rejected.length, color: '#EF4444', bg: '#FEE2E2' },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Pending Applications ({pending.length})</h2>
          {pending.length > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => {
                setConfirmState({
                  show: true, title: 'Approve All', type: 'success',
                  message: `Approve all ${pending.length} pending electricians?`,
                  onConfirm: async () => {
                    await Promise.all(pending.map(d => electricianApi.updateStatus(d.id, 'active')));
                    setElectricians(prev => prev.map(d => d.status === 'pending' ? { ...d, status: 'active' } : d));
                    setConfirmState(s => ({ ...s, show: false }));
                  },
                });
              }} style={{ background: '#D1FAE5', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#065F46', display: 'flex', alignItems: 'center', gap: 6 }}><Check size={14} /> Approve All</button>
              <button onClick={() => {
                setConfirmState({
                  show: true, title: 'Reject All', type: 'danger',
                  message: `Reject all ${pending.length} pending electricians?`,
                  onConfirm: async () => {
                    await Promise.all(pending.map(d => electricianApi.updateStatus(d.id, 'inactive')));
                    setElectricians(prev => prev.map(d => d.status === 'pending' ? { ...d, status: 'inactive' } : d));
                    setConfirmState(s => ({ ...s, show: false }));
                  },
                });
              }} style={{ background: '#FEE2E2', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#991B1B', display: 'flex', alignItems: 'center', gap: 6 }}><X size={14} /> Reject All</button>
            </div>
          )}
        </div>
        <div style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: C.muted }}>Loading...</div>
          ) : pending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: C.muted }}>No pending applications</div>
          ) : (
            pending.map((item, i) => (
              <div key={item.id} style={{ padding: '18px 22px', borderBottom: i < pending.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{item.phone} · {item.town}, {item.state}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setSelected(item)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', gap: 6 }}><Eye size={14} /> View</button>
                  <button onClick={() => handleApprove(item)} style={{ background: '#D1FAE5', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#065F46', display: 'flex', alignItems: 'center', gap: 6 }}><Check size={14} /> Approve</button>
                  <button onClick={() => handleReject(item)} style={{ background: '#FEE2E2', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#991B1B', display: 'flex', alignItems: 'center', gap: 6 }}><X size={14} /> Reject</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelected(null)}>
          <div style={{ background: C.card, borderRadius: 16, width: 520, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Electrician Application Details</div>
              <button onClick={() => setSelected(null)} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: 22, display: 'grid', gap: 10 }}>
              <div style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}><strong>Name:</strong> {selected.name}</div>
              <div style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}><strong>Phone:</strong> {selected.phone}</div>
              <div style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}><strong>Email:</strong> {selected.email || '—'}</div>
              <div style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}><strong>Location:</strong> {selected.town}, {selected.state}</div>
              <div style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}><strong>Applied:</strong> {formatISTDate(selected.joinedDate)}</div>
            </div>
            <div style={{ padding: '18px 22px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 12 }}>
              <button onClick={() => handleApprove(selected)} style={{ flex: 1, background: '#D1FAE5', color: '#065F46', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Check size={16} /> Approve</button>
              <button onClick={() => handleReject(selected)} style={{ flex: 1, background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><X size={16} /> Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
