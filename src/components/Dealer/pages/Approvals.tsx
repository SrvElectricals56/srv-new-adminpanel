'use client';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Check, X, Eye, FileSpreadsheet } from 'lucide-react';
import { dealerApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import ExportModal from '@/components/Shared/ExportModal';
import { formatISTDate } from '@/lib/dateIST';

interface PendingDealer {
  id: string;
  name: string;
  phone: string;
  email: string;
  town: string;
  state: string;
  joinedDate: string;
  status: 'pending' | 'active' | 'inactive';
  rejectionReason?: string;
}

type DealerApprovalApiRow = PendingDealer;

type ApprovalView = 'pending' | 'approved' | 'rejected';

export default function DealerApprovals() {
  const C = useThemePalette();
  const [dealers, setDealers] = useState<PendingDealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDealer, setSelectedDealer] = useState<PendingDealer | null>(null);
  const [activeView, setActiveView] = useState<ApprovalView>('pending');
  const [confirmState, setConfirmState] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'success' | 'danger';
  }>({ show: false, title: '', message: '', onConfirm: () => {}, type: 'success' });
  const [showExport, setShowExport] = useState(false);
  const [rejectState, setRejectState] = useState<{
    show: boolean;
    dealer: PendingDealer | null;
    bulk: boolean;
  }>({ show: false, dealer: null, bulk: false });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    dealerApi
      .getAll({ limit: '500' })
      .then((res) => {
        const data = (Array.isArray(res) ? res : res.data ?? []) as DealerApprovalApiRow[];
        setDealers(
          data.map((d) => ({
            id: d.id,
            name: d.name,
            phone: d.phone,
            email: d.email ?? '',
            town: d.town,
            state: d.state,
            joinedDate: d.joinedDate,
            status: d.status,
            rejectionReason: d.rejectionReason ?? '',
          }))
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pending = dealers.filter((d) => d.status === 'pending');
  const approved = dealers.filter((d) => d.status === 'active');
  const rejected = dealers.filter((d) => d.status === 'inactive');

  const visibleDealers = useMemo(() => {
    if (activeView === 'approved') return approved;
    if (activeView === 'rejected') return rejected;
    return pending;
  }, [activeView, approved, pending, rejected]);

  const activeViewLabel = activeView === 'approved' ? 'Approved' : activeView === 'rejected' ? 'Rejected' : 'Pending';

  const closeRejectModal = () => {
    setRejectState({ show: false, dealer: null, bulk: false });
    setRejectReason('');
  };

  const handleApprove = (dealer: PendingDealer) => {
    setConfirmState({
      show: true,
      title: 'Approve Dealer',
      message: `Are you sure you want to approve ${dealer.name}?`,
      type: 'success',
      onConfirm: async () => {
        try {
          await dealerApi.updateStatus(dealer.id, 'active');
          setDealers((prev) =>
            prev.map((d) =>
              d.id === dealer.id ? { ...d, status: 'active', rejectionReason: '' } : d
            )
          );
          setSelectedDealer(null);
        } catch (err) {
          console.error(err);
        }
        setConfirmState((s) => ({ ...s, show: false }));
      },
    });
  };

  const openRejectModal = (dealer: PendingDealer | null, bulk = false) => {
    setRejectState({ show: true, dealer, bulk });
    setRejectReason(dealer?.rejectionReason ?? '');
  };

  const submitReject = async () => {
    const reason = rejectReason.trim();
    if (!reason) return;

    try {
      if (rejectState.bulk) {
        await Promise.all(pending.map((dealer) => dealerApi.updateStatus(dealer.id, 'inactive', reason)));
        setDealers((prev) =>
          prev.map((dealer) =>
            dealer.status === 'pending'
              ? { ...dealer, status: 'inactive', rejectionReason: reason }
              : dealer
          )
        );
        setSelectedDealer(null);
        setActiveView('rejected');
      } else if (rejectState.dealer) {
        await dealerApi.updateStatus(rejectState.dealer.id, 'inactive', reason);
        setDealers((prev) =>
          prev.map((dealer) =>
            dealer.id === rejectState.dealer?.id
              ? { ...dealer, status: 'inactive', rejectionReason: reason }
              : dealer
          )
        );
        setSelectedDealer(null);
        setActiveView('rejected');
      }
    } catch (err) {
      console.error(err);
    } finally {
      closeRejectModal();
    }
  };

  const cards = [
    { key: 'pending' as const, label: 'Pending', value: pending.length, color: '#F59E0B', bg: '#FFFBEB' },
    { key: 'approved' as const, label: 'Approved', value: approved.length, color: '#10B981', bg: '#D1FAE5' },
    { key: 'rejected' as const, label: 'Rejected', value: rejected.length, color: '#EF4444', bg: '#FEE2E2' },
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <ConfirmDialog
        show={confirmState.show}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((s) => ({ ...s, show: false }))}
        type={confirmState.type}
      />

      <div
        style={{
          marginBottom: 28,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: C.text,
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle size={24} style={{ color: C.red }} /> Dealer Approvals
          </h1>
          <p style={{ color: C.muted, fontSize: 14 }}>
            Review and approve new dealer registrations
          </p>
        </div>
        <button
          onClick={() => setShowExport(true)}
          style={{
            background: C.red,
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <FileSpreadsheet size={14} /> Export
        </button>
      </div>

      <ExportModal
        show={showExport}
        onClose={() => setShowExport(false)}
        title="Dealer Approvals"
        fileName="dealer-approvals"
        getData={() =>
          dealers.map((d) => ({
            Name: d.name,
            Phone: d.phone,
            Email: d.email,
            Town: d.town,
            State: d.state,
            JoinedAt: d.joinedDate,
            Status: d.status,
            RejectionReason: d.rejectionReason ?? '',
          }))
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {cards.map((s) => {
          const active = activeView === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setActiveView(s.key)}
              style={{
                background: active ? s.bg : C.card,
                borderRadius: 14,
                padding: '16px 18px',
                border: `1px solid ${active ? s.color : C.border}`,
                boxShadow: active ? `0 0 0 2px ${s.bg}` : '0 2px 8px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: active ? s.color : C.muted }}>{s.label}</div>
            </button>
          );
        })}
      </div>

      <div
        style={{
          background: C.card,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            padding: '18px 22px',
            borderBottom: `1px solid ${C.border}`,
            background: C.surface,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
            {activeViewLabel} Applications ({visibleDealers.length})
          </h2>
          {activeView === 'pending' && pending.length > 0 ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  setConfirmState({
                    show: true,
                    title: 'Approve All',
                    type: 'success',
                    message: `Approve all ${pending.length} pending dealers?`,
                    onConfirm: async () => {
                      await Promise.all(pending.map((d) => dealerApi.updateStatus(d.id, 'active')));
                      setDealers((prev) =>
                        prev.map((d) =>
                          d.status === 'pending'
                            ? { ...d, status: 'active', rejectionReason: '' }
                            : d
                        )
                      );
                      setConfirmState((s) => ({ ...s, show: false }));
                      setActiveView('approved');
                    },
                  });
                }}
                style={{
                  background: '#D1FAE5',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: '#065F46',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Check size={14} /> Approve All
              </button>
              <button
                onClick={() => openRejectModal(null, true)}
                style={{
                  background: '#FEE2E2',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: '#991B1B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <X size={14} /> Reject All
              </button>
            </div>
          ) : null}
        </div>

        <div style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: C.muted }}>Loading...</div>
          ) : visibleDealers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: C.muted }}>
              No {activeViewLabel.toLowerCase()} applications
            </div>
          ) : (
            visibleDealers.map((dealer, i) => (
              <div
                key={dealer.id}
                style={{
                  padding: '18px 22px',
                  borderBottom: i < visibleDealers.length - 1 ? `1px solid ${C.border}` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{dealer.name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    {dealer.phone} · {dealer.town}, {dealer.state}
                  </div>
                  {dealer.status === 'inactive' && dealer.rejectionReason ? (
                    <div style={{ fontSize: 12, color: '#991B1B', marginTop: 6 }}>
                      Reason: {dealer.rejectionReason}
                    </div>
                  ) : null}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span
                    style={{
                      background:
                        dealer.status === 'active'
                          ? '#D1FAE5'
                          : dealer.status === 'inactive'
                            ? '#FEE2E2'
                            : '#FEF3C7',
                      color:
                        dealer.status === 'active'
                          ? '#065F46'
                          : dealer.status === 'inactive'
                            ? '#991B1B'
                            : '#92400E',
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '5px 10px',
                      borderRadius: 999,
                    }}
                  >
                    {dealer.status === 'active' ? 'Approved' : dealer.status === 'inactive' ? 'Rejected' : 'Pending'}
                  </span>
                  <button
                    onClick={() => setSelectedDealer(dealer)}
                    style={{
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: '8px 14px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: C.muted,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Eye size={14} /> View
                  </button>
                  {dealer.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApprove(dealer)}
                        style={{
                          background: '#D1FAE5',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 16px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: '#065F46',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(dealer)}
                        style={{
                          background: '#FEE2E2',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 16px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: '#991B1B',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <X size={14} /> Reject
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedDealer ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.55)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setSelectedDealer(null)}
        >
          <div
            style={{
              background: C.card,
              borderRadius: 16,
              width: 520,
              maxWidth: '95vw',
              boxShadow: '0 25px 70px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '18px 22px',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>
                Dealer Application Details
              </div>
              <button
                onClick={() => setSelectedDealer(null)}
                style={{
                  background: C.bg,
                  border: 'none',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: 22, display: 'grid', gap: 10 }}>
              <div style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}>
                <strong>Name:</strong> {selectedDealer.name}
              </div>
              <div style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}>
                <strong>Phone:</strong> {selectedDealer.phone}
              </div>
              <div style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}>
                <strong>Email:</strong> {selectedDealer.email || '—'}
              </div>
              <div style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}>
                <strong>Location:</strong> {selectedDealer.town}, {selectedDealer.state}
              </div>
              <div style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}>
                <strong>Status:</strong> {selectedDealer.status === 'active' ? 'Approved' : selectedDealer.status === 'inactive' ? 'Rejected' : 'Pending'}
              </div>
              {selectedDealer.rejectionReason ? (
                <div style={{ background: '#FEF2F2', borderRadius: 10, padding: 12, fontSize: 13, color: '#991B1B' }}>
                  <strong>Rejection Reason:</strong> {selectedDealer.rejectionReason}
                </div>
              ) : null}
              <div style={{ background: C.bg, borderRadius: 10, padding: 12, fontSize: 13 }}>
                <strong>Applied:</strong> {formatISTDate(selectedDealer.joinedDate)}
              </div>
            </div>
            {selectedDealer.status === 'pending' ? (
              <div
                style={{
                  padding: '18px 22px',
                  borderTop: `1px solid ${C.border}`,
                  display: 'flex',
                  gap: 12,
                }}
              >
                <button
                  onClick={() => handleApprove(selectedDealer)}
                  style={{
                    flex: 1,
                    background: '#D1FAE5',
                    color: '#065F46',
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px 20px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Check size={16} /> Approve
                </button>
                <button
                  onClick={() => openRejectModal(selectedDealer)}
                  style={{
                    flex: 1,
                    background: '#FEE2E2',
                    color: '#991B1B',
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px 20px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <X size={16} /> Reject
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {rejectState.show ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.55)',
            backdropFilter: 'blur(6px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={closeRejectModal}
        >
          <div
            style={{
              background: C.card,
              borderRadius: 16,
              width: 520,
              maxWidth: '95vw',
              boxShadow: '0 25px 70px rgba(0,0,0,0.2)',
              padding: 22,
              display: 'grid',
              gap: 14,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>
              {rejectState.bulk ? 'Reject All Pending Dealers' : 'Reject Dealer Request'}
            </div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
              {rejectState.bulk
                ? `Enter the rejection reason that should be visible to all ${pending.length} rejected dealer accounts in the app.`
                : `Enter the rejection reason that ${rejectState.dealer?.name ?? 'this dealer'} will be able to see in the app.`}
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason"
              rows={4}
              style={{
                width: '100%',
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: 12,
                fontSize: 14,
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={submitReject}
                disabled={!rejectReason.trim()}
                style={{
                  flex: 1,
                  background: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  padding: '11px 16px',
                  cursor: rejectReason.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: 700,
                  opacity: rejectReason.trim() ? 1 : 0.55,
                }}
              >
                Save & Reject
              </button>
              <button
                onClick={closeRejectModal}
                style={{
                  flex: 1,
                  background: C.bg,
                  color: C.muted,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: '11px 16px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
