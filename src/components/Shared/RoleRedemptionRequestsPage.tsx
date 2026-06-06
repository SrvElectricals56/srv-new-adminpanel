'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Banknote, Check, CreditCard, DollarSign, Eye, FileSpreadsheet, TrendingUp, X } from 'lucide-react';
import ExportModal from '@/components/Shared/ExportModal';
import { redemptionApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import { formatISTDate, formatISTDateTimeFull } from '@/lib/dateIST';

type SupportedRole = 'electrician' | 'dealer' | 'user' | 'counterboy';

type RedemptionRecord = {
  id: string;
  userId: string;
  userName?: string;
  role: SupportedRole;
  type: string;
  points?: number;
  amount?: number;
  status: string;
  upiId?: string | null;
  bankAccount?: string | null;
  ifsc?: string | null;
  accountHolderName?: string | null;
  rejectionReason?: string | null;
  requestedAt?: string;
  processedAt?: string;
};

type RoleRedemptionRequestsPageProps = {
  role: SupportedRole;
  exportTitle: string;
  exportFileName: string;
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  approved: { bg: '#D1FAE5', color: '#065F46', label: 'Approved' },
  pending: { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
  rejected: { bg: '#FEE2E2', color: '#991B1B', label: 'Rejected' },
};

const TYPE_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  dealer_bonus_bank_transfer: 'Dealer Bonus Withdrawal',
  bonus_withdrawal: 'Bonus Withdrawal',
  gift: 'Gift Redemption',
};

export default function RoleRedemptionRequestsPage({
  role,
  exportTitle,
  exportFileName,
}: RoleRedemptionRequestsPageProps) {
  const C = useThemePalette();
  const [rows, setRows] = useState<RedemptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [search, setSearch] = useState('');
  const [viewItem, setViewItem] = useState<RedemptionRecord | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [rejectState, setRejectState] = useState<{ open: boolean; item: RedemptionRecord | null }>({
    open: false,
    item: null,
  });
  const [rejectReason, setRejectReason] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await redemptionApi.getAll({ role, limit: '500' });
      const data = Array.isArray(response) ? response : (response as { data?: RedemptionRecord[] }).data ?? [];
      setRows(data);
      setFeedback(null);
    } catch (error) {
      console.error(error);
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load redemption requests.',
      });
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const query = search.toLowerCase();
        return (
          (row.userName ?? '').toLowerCase().includes(query) ||
          (row.userId ?? '').toLowerCase().includes(query) ||
          (row.type ?? '').toLowerCase().includes(query) ||
          (row.rejectionReason ?? '').toLowerCase().includes(query)
        );
      }),
    [rows, search],
  );

  const totalApproved = rows
    .filter((row) => row.status === 'approved')
    .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const totalPending = rows
    .filter((row) => row.status === 'pending')
    .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const rejectedCount = rows.filter((row) => row.status === 'rejected').length;

  const closeRejectModal = () => {
    setRejectState({ open: false, item: null });
    setRejectReason('');
  };

  const handleApprove = async (item: RedemptionRecord) => {
    setSubmittingId(item.id);
    try {
      await redemptionApi.approve(item.id);
      setFeedback({ type: 'success', message: 'Request approved successfully.' });
      await loadData();
    } catch (error) {
      console.error(error);
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to approve request.',
      });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectState.item) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setFeedback({ type: 'error', message: 'Reject karne ke liye reason dena zaroori hai.' });
      return;
    }

    setSubmittingId(rejectState.item.id);
    try {
      await redemptionApi.reject(rejectState.item.id, reason);
      closeRejectModal();
      setFeedback({ type: 'success', message: 'Request rejected successfully.' });
      await loadData();
    } catch (error) {
      console.error(error);
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to reject request.',
      });
    } finally {
      setSubmittingId(null);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    border: `1.5px solid ${C.border}`,
    borderRadius: 8,
    fontSize: 13.5,
    outline: 'none',
    background: C.surface,
    color: C.text,
    boxSizing: 'border-box',
  };

  return (
    <>
      <ExportModal
        show={showExport}
        onClose={() => setShowExport(false)}
        title={exportTitle}
        fileName={exportFileName}
        getData={() =>
          rows.map((row) => ({
            UserId: row.userId,
            UserName: row.userName,
            Type: row.type,
            Points: row.points ?? 0,
            Amount: row.amount ?? 0,
            Status: row.status,
            RejectionReason: row.rejectionReason ?? '',
            Date: row.requestedAt,
          }))
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Approved', value: `₹${totalApproved.toLocaleString('en-IN')}`, color: '#065F46', bg: '#D1FAE5', Icon: DollarSign },
          { label: 'Pending', value: `₹${totalPending.toLocaleString('en-IN')}`, color: '#92400E', bg: '#FEF3C7', Icon: Banknote },
          { label: 'Requests', value: String(rows.length), color: '#1D4ED8', bg: '#EFF6FF', Icon: CreditCard },
          { label: 'Rejected', value: String(rejectedCount), color: '#991B1B', bg: '#FEE2E2', Icon: TrendingUp },
        ].map((card) => (
          <div key={card.label} style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
              <card.Icon size={20} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{card.value}</div>
              <div style={{ fontSize: 12, color: card.color, fontWeight: 700 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {feedback && (
        <div
          style={{
            background: feedback.type === 'error' ? C.dangerBg : '#D1FAE5',
            border: `1px solid ${feedback.type === 'error' ? C.dangerBorder : '#A7F3D0'}`,
            color: feedback.type === 'error' ? C.dangerText : '#065F46',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {feedback.message}
        </div>
      )}

      <div style={{ background: C.card, borderRadius: 14, padding: '12px 16px', border: `1px solid ${C.border}`, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by user, type, or reason..."
          style={{ ...inputStyle, flex: 1, minWidth: 220 }}
        />
        <button
          onClick={() => setShowExport(true)}
          style={{ background: C.red, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <FileSpreadsheet size={14} /> Export
        </button>
        <span style={{ fontSize: 13, color: C.muted, marginLeft: 'auto' }}>{filtered.length} results</span>
      </div>

      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: C.muted }}>Loading...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                {['User', 'Type', 'Points', 'Amount', 'Status', 'Requested', 'Action'].map((header) => (
                  <th key={header} style={{ padding: '13px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: C.muted }}>
                    No redemptions found
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const statusConfig = STATUS_STYLES[row.status] ?? STATUS_STYLES.pending;
                  return (
                    <tr
                      key={row.id}
                      style={{ borderBottom: `1px solid ${C.border}` }}
                      onMouseEnter={(event) => ((event.currentTarget as HTMLTableRowElement).style.background = C.hoverRow)}
                      onMouseLeave={(event) => ((event.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: C.text }}>
                        <div>{row.userName || row.userId?.slice(0, 8)}</div>
                        {row.rejectionReason && (
                          <div style={{ fontSize: 11, color: '#991B1B', marginTop: 4, fontWeight: 600 }}>
                            Reason: {row.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{TYPE_LABELS[row.type] ?? row.type}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: C.text }}>{Number(row.points ?? 0).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 800, color: C.text }}>₹{Number(row.amount ?? 0).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: statusConfig.bg, color: statusConfig.color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>
                        {row.requestedAt ? formatISTDate(row.requestedAt) : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {row.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => void handleApprove(row)}
                              disabled={submittingId === row.id}
                              style={{ background: '#D1FAE5', color: '#065F46', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: submittingId === row.id ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >
                              <Check size={13} /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectState({ open: true, item: row });
                                setRejectReason(row.rejectionReason ?? '');
                              }}
                              disabled={submittingId === row.id}
                              style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: submittingId === row.id ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >
                              <X size={13} /> Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setViewItem(row)}
                            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: C.muted, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                          >
                            <Eye size={13} /> View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {viewItem && (
        <div style={{ position: 'fixed', inset: 0, background: C.overlay, backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setViewItem(null)}>
          <div style={{ background: C.card, borderRadius: 18, width: 'min(920px, 96vw)', maxHeight: '88vh', boxShadow: '0 25px 70px rgba(0,0,0,0.2)', border: `1px solid ${C.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={(event) => event.stopPropagation()}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Request Details</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Compact payment-ready request summary.</div>
              </div>
              <button onClick={() => setViewItem(null)} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: C.muted, fontSize: 15 }}>
                ×
              </button>
            </div>
            <div style={{ padding: 22, overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div style={{ background: C.bg, borderRadius: 14, padding: 16, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>Request Overview</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {[
                      ['User', viewItem.userName || viewItem.userId],
                      ['Type', TYPE_LABELS[viewItem.type] ?? viewItem.type],
                      ['Points', Number(viewItem.points ?? 0).toLocaleString('en-IN')],
                      ['Amount', `₹${Number(viewItem.amount ?? 0).toLocaleString('en-IN')}`],
                      ['Status', viewItem.status],
                      ['Date', viewItem.requestedAt ? formatISTDateTimeFull(viewItem.requestedAt) : '—'],
                    ].map(([label, value]) => (
                      <div key={label} style={{ background: C.card, borderRadius: 10, padding: '10px 12px', fontSize: 13, color: C.text }}>
                        <span style={{ color: C.muted, fontWeight: 700 }}>{label}: </span>
                        {value}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: C.bg, borderRadius: 14, padding: 16, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>Payment Details</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {[
                      ['UPI ID', viewItem.upiId || '—'],
                      ['Account Holder', viewItem.accountHolderName || '—'],
                      ['Bank Account', viewItem.bankAccount || '—'],
                      ['IFSC', viewItem.ifsc || '—'],
                    ].map(([label, value]) => (
                      <div key={label} style={{ background: C.card, borderRadius: 10, padding: '10px 12px', fontSize: 13, color: C.text, wordBreak: 'break-word' }}>
                        <span style={{ color: C.muted, fontWeight: 700 }}>{label}: </span>
                        {value}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: C.bg, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>Admin Note</div>
                  <div style={{ background: C.card, borderRadius: 10, padding: '12px 14px', fontSize: 13, color: C.text, minHeight: 72, wordBreak: 'break-word' }}>
                    <div style={{ color: C.muted, fontWeight: 700, marginBottom: 6 }}>Rejection Reason</div>
                    {viewItem.rejectionReason || '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectState.open && (
        <div style={{ position: 'fixed', inset: 0, background: C.overlay, backdropFilter: 'blur(6px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={closeRejectModal}>
          <div style={{ background: C.card, borderRadius: 16, width: 520, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.2)', border: `1px solid ${C.border}` }} onClick={(event) => event.stopPropagation()}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Reject Request</div>
              <button onClick={closeRejectModal} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: C.muted, fontSize: 15 }}>
                ×
              </button>
            </div>
            <div style={{ padding: 22 }}>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>
                Reason save hote hi status rejected ho jayega. Wallet-deducted requests par refund backend automatically handle karega.
              </div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Rejection Reason
              </label>
              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Why is this request being rejected?"
                style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }}
              />
            </div>
            <div style={{ padding: '0 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={closeRejectModal} style={{ background: C.surface, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => void handleReject()} disabled={submittingId === rejectState.item?.id} style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: submittingId === rejectState.item?.id ? 'wait' : 'pointer' }}>
                Save & Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
