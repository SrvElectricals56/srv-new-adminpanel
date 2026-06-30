'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, CreditCard, MapPin, PackageCheck, RefreshCw, Search, Truck, XCircle } from 'lucide-react';
import { giftApi, productOrderApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import { formatISTDate, formatISTDateTime } from '@/lib/dateIST';

type OrderStatus = 'pending' | 'approved' | 'shipped' | 'delivered' | 'rejected';
type DeliveryFilter = 'all' | 'pending_queue' | 'payment_paid' | OrderStatus;

type DeliveryOrder = {
  id: string;
  source?: 'product' | 'gift';
  userName: string;
  userPhone?: string;
  userRole: string;
  productName: string;
  productImage?: string;
  quantity: number;
  total: number;
  pointsUsed?: number;
  status: OrderStatus;
  shippingAddress?: string;
  trackingNumber?: string;
  courierName?: string;
  paymentStatus?: string;
  paidAt?: string;
  orderedAt: string;
  estimatedDeliveryAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  rejectedAt?: string;
  refundStatus?: string;
  refundMessage?: string;
  rejectionReason?: string;
  deliveryNotes?: string;
};

const STATUS_STYLE: Record<OrderStatus, { label: string; bg: string; color: string }> = {
  pending: { label: 'Pending Dispatch', bg: '#FEF3C7', color: '#92400E' },
  approved: { label: 'Order Confirmed', bg: '#DBEAFE', color: '#1D4ED8' },
  shipped: { label: 'Dispatched', bg: '#E0E7FF', color: '#4338CA' },
  delivered: { label: 'Delivered', bg: '#DCFCE7', color: '#166534' },
  rejected: { label: 'Rejected / Refund', bg: '#FEE2E2', color: '#991B1B' },
};

function safeDate(value?: string | null) {
  return value ? formatISTDate(value) : '—';
}

function timeline(order: DeliveryOrder) {
  const rejected = order.status === 'rejected';
  return [
    { label: 'Order Placed', value: safeDate(order.orderedAt), done: true },
    { label: 'Payment Done', value: order.paidAt ? safeDate(order.paidAt) : (order.paymentStatus || 'pending'), done: order.paymentStatus === 'paid' },
    { label: 'Confirmed', value: rejected ? 'Rejected by admin' : 'Ready for packing', done: !rejected && ['pending', 'approved', 'shipped', 'delivered'].includes(order.status) },
    { label: 'Dispatched', value: order.dispatchedAt ? safeDate(order.dispatchedAt) : (order.trackingNumber || 'Awaiting courier'), done: ['shipped', 'delivered'].includes(order.status) },
    { label: rejected ? 'Refund' : 'Delivery', value: rejected ? (order.refundMessage || 'Refund within 2 business days') : (order.deliveredAt ? safeDate(order.deliveredAt) : `Expected ${safeDate(order.estimatedDeliveryAt)}`), done: rejected || order.status === 'delivered' },
  ];
}

export default function DeliveryTracker({ role }: { role?: import('@/lib/types').AdminRole }) {
  const C = useThemePalette();
  const canEdit = role === 'super_admin' || role === 'admin';
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<DeliveryFilter>('all');
  const [selected, setSelected] = useState<DeliveryOrder | null>(null);
  const [dispatchOrder, setDispatchOrder] = useState<DeliveryOrder | null>(null);
  const [showDispatchedDetails, setShowDispatchedDetails] = useState(false);
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productRes, giftRes] = await Promise.all([
        productOrderApi.getAll({ limit: '500' }),
        giftApi.getOrders({ limit: '500' }),
      ]);
      const productOrders = (((productRes as any).data ?? []) as DeliveryOrder[]).map(order => ({
        ...order,
        source: 'product' as const,
      }));
      const giftOrders = (((giftRes as any).data ?? []) as any[]).map(order => ({
        id: order.id,
        source: 'gift' as const,
        userName: order.userName,
        userPhone: order.userPhone,
        userRole: order.type || order.role || 'gift',
        productName: order.giftName,
        productImage: order.giftImage,
        quantity: 1,
        total: Number(order.pointsUsed ?? 0),
        pointsUsed: Number(order.pointsUsed ?? 0),
        status: order.status,
        shippingAddress: order.shippingAddress,
        trackingNumber: order.trackingNumber,
        courierName: order.courierName,
        paymentStatus: 'paid',
        paidAt: order.orderedAt,
        orderedAt: order.orderedAt,
        dispatchedAt: order.dispatchedAt,
        deliveredAt: order.deliveredAt,
        rejectionReason: order.rejectionReason,
        deliveryNotes: order.deliveryNotes,
      }));
      setOrders([...productOrders, ...giftOrders].sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const filtered = useMemo(() => orders.filter((order) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [order.id, order.userName, order.userPhone, order.productName, order.trackingNumber, order.courierName].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    const matchesStatus = status === 'all'
      || (status === 'pending_queue' && ['pending', 'approved'].includes(order.status))
      || (status === 'payment_paid' && order.paymentStatus === 'paid')
      || order.status === status;
    return matchesSearch && matchesStatus;
  }), [orders, search, status]);

  const stats = useMemo(() => ({
    pending: orders.filter(o => o.status === 'pending' || o.status === 'approved').length,
    paymentDone: orders.filter(o => o.paymentStatus === 'paid').length,
    dispatched: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    rejected: orders.filter(o => o.status === 'rejected').length,
  }), [orders]);

  const dispatchedOrders = useMemo(
    () => orders.filter(order => order.status === 'shipped'),
    [orders],
  );

  const handleSummaryCardClick = (filterValue: DeliveryFilter) => {
    setStatus(filterValue);
    if (filterValue === 'shipped') {
      setShowDispatchedDetails(true);
    }
  };

  const updateStatus = async (order: DeliveryOrder, nextStatus: OrderStatus, shipping?: { courierName: string; trackingNumber: string }) => {
    if (!canEdit) return;
    try {
      const payload = {
        status: nextStatus,
        trackingNumber: shipping?.trackingNumber || order.trackingNumber,
        courierName: shipping?.courierName || order.courierName,
        rejectionReason: nextStatus === 'rejected' ? rejectReason || 'Rejected by admin' : undefined,
      };
      if (order.source === 'gift') {
        await giftApi.updateOrderStatus(order.id, nextStatus, {
          trackingNumber: payload.trackingNumber,
          courierName: payload.courierName,
          rejectionReason: payload.rejectionReason,
        });
      } else {
        await productOrderApi.updateStatus(order.id, payload);
      }
      setFeedback(nextStatus === 'rejected' ? 'Order rejected. Customer will see refund within 2 business days.' : 'Delivery status updated and customer tracking is refreshed.');
      setSelected(null);
      setDispatchOrder(null);
      setCourierName('');
      setTrackingNumber('');
      setRejectReason('');
      await loadData();
    } catch (error: any) {
      setFeedback(error?.response?.data?.message || error?.message || 'Unable to update delivery status.');
    }
  };

  const openDispatch = (order: DeliveryOrder) => {
    setDispatchOrder(order);
    setCourierName(order.courierName || '');
    setTrackingNumber(order.trackingNumber || '');
  };

  const submitDispatch = async () => {
    if (!dispatchOrder) return;
    if (!courierName.trim() || !trackingNumber.trim()) {
      setFeedback('Courier name and shipping ID are required before dispatch.');
      return;
    }
    await updateStatus(dispatchOrder, 'shipped', {
      courierName: courierName.trim(),
      trackingNumber: trackingNumber.trim(),
    });
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1440 }}>
      <div style={{ background: 'linear-gradient(135deg,#1D4ED8,#0F766E)', borderRadius: 20, padding: '24px 28px', color: 'white', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}><Truck size={28} /> Delivery Tracker</div>
          <div style={{ fontSize: 13, opacity: 0.78, marginTop: 5 }}>Live order journey: payment done, pending dispatch, dispatched, delivered, rejected and refunds.</div>
        </div>
        <button onClick={() => void loadData()} style={{ border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.14)', color: 'white', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        {[
          ['Pending', stats.pending, Clock3, '#F59E0B', 'pending_queue'],
          ['Payment Done', stats.paymentDone, CreditCard, '#059669', 'payment_paid'],
          ['Dispatched', stats.dispatched, Truck, '#4F46E5', 'shipped'],
          ['Delivered', stats.delivered, CheckCircle2, '#16A34A', 'delivered'],
          ['Rejected', stats.rejected, XCircle, '#DC2626', 'rejected'],
        ].map(([label, value, Icon, color, filterValue]: any) => (
          <button type="button" onClick={() => handleSummaryCardClick(filterValue)} key={label} style={{ textAlign: 'left', background: C.card, border: `2px solid ${status === filterValue ? color : C.border}`, borderRadius: 16, padding: 16, cursor: 'pointer', boxShadow: status === filterValue ? `0 0 0 3px ${color}20` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: C.muted, fontSize: 12, fontWeight: 800 }}>{label}</span>
              <Icon size={18} color={color} />
            </div>
            <div style={{ color: C.text, fontSize: 26, fontWeight: 900, marginTop: 8 }}>{value}</div>
          </button>
        ))}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order, customer, product, tracking..." style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 36px', border: `1.5px solid ${C.border}`, borderRadius: 10, background: C.inputBg, color: C.text, outline: 'none' }} />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value as any)} style={{ padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 10, background: C.inputBg, color: C.text, minWidth: 180 }}>
          <option value="all">All Delivery Status</option>
          <option value="pending_queue">Pending (including confirmed)</option>
          <option value="payment_paid">Payment Done</option>
          <option value="pending">Pending Dispatch</option>
          <option value="approved">Order Confirmed</option>
          <option value="shipped">Dispatched</option>
          <option value="delivered">Delivered</option>
          <option value="rejected">Rejected / Refund</option>
        </select>
        <span style={{ color: C.muted, fontSize: 13, whiteSpace: 'nowrap' }}>{filtered.length} orders</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
        {loading ? (
          <div style={{ color: C.muted, padding: 28 }}>Loading delivery tracker...</div>
        ) : filtered.map(order => {
          const statusStyle = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending;
          return (
            <div key={order.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                {order.productImage ? <img src={order.productImage} alt={order.productName} style={{ width: 54, height: 54, borderRadius: 12, objectFit: 'cover', border: `1px solid ${C.border}` }} /> : <PackageCheck size={38} color={C.muted} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.productName}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{order.userName} • Qty {order.quantity} • {order.source === 'gift' ? `${Number(order.pointsUsed ?? order.total).toLocaleString('en-IN')} pts` : `₹${order.total}`}</div>
                </div>
                <span style={{ background: statusStyle.bg, color: statusStyle.color, borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 900 }}>{statusStyle.label}</span>
              </div>

              <div style={{ display: 'grid', gap: 9, marginBottom: 14 }}>
                {timeline(order).map((step, idx) => (
                  <div key={step.label} style={{ display: 'flex', gap: 10 }}>
                    <div style={{ width: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 11, height: 11, borderRadius: '50%', background: step.done ? '#059669' : C.border, marginTop: 3 }} />
                      {idx < 4 && <div style={{ width: 2, flex: 1, minHeight: 20, background: step.done ? '#A7F3D0' : C.border }} />}
                    </div>
                    <div>
                      <div style={{ color: C.text, fontSize: 12, fontWeight: 900 }}>{step.label}</div>
                      <div style={{ color: C.muted, fontSize: 12 }}>{step.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: C.bg, borderRadius: 12, padding: 12, color: C.muted, fontSize: 12, lineHeight: 1.5 }}>
                <div style={{ color: C.text, fontWeight: 900, marginBottom: 7 }}>Shipping Details</div>
                <div><MapPin size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} /> {order.shippingAddress || 'No shipping address saved'}</div>
                {(order.status === 'shipped' || order.status === 'delivered') && (
                  <div style={{ marginTop: 9, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, padding: 9 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: C.muted }}>Courier Partner</div>
                      <div style={{ marginTop: 3, color: '#1D4ED8', fontWeight: 900 }}>{order.courierName || 'Not assigned'}</div>
                    </div>
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, padding: 9 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: C.muted }}>Tracking / Shipping ID</div>
                      <div style={{ marginTop: 3, color: '#166534', fontWeight: 900, wordBreak: 'break-all' }}>{order.trackingNumber || 'Not assigned'}</div>
                    </div>
                  </div>
                )}
                {order.deliveryNotes && <div style={{ marginTop: 8, color: C.text, fontWeight: 700 }}>{order.deliveryNotes}</div>}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <button onClick={() => setSelected(order)} style={{ padding: '8px 12px', borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, color: C.text, cursor: 'pointer', fontWeight: 800 }}>Manage</button>
                {canEdit && order.status !== 'rejected' && order.status !== 'delivered' && (
                  <>
                    <button onClick={() => openDispatch(order)} style={{ padding: '8px 12px', borderRadius: 9, border: 'none', background: '#4F46E5', color: 'white', cursor: 'pointer', fontWeight: 800 }}>Dispatch</button>
                    <button onClick={() => void updateStatus(order, 'delivered')} style={{ padding: '8px 12px', borderRadius: 9, border: 'none', background: '#16A34A', color: 'white', cursor: 'pointer', fontWeight: 800 }}>Delivered</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelected(null)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, width: 520, maxWidth: '95vw', padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.text, marginBottom: 6 }}>Manage Delivery #{selected.id.slice(0, 8)}</div>
            <div style={{ color: C.muted, fontSize: 13, marginBottom: 18 }}>{selected.productName} • {selected.source === 'gift' ? 'Gift redemption' : 'Product order'} • {formatISTDateTime(selected.orderedAt)}</div>
            {(selected.courierName || selected.trackingNumber) && (
              <div style={{ background: C.bg, borderRadius: 12, padding: 12, marginBottom: 12, color: C.text, fontSize: 13 }}>
                <div><strong>Courier:</strong> {selected.courierName || 'Not assigned'}</div>
                <div style={{ marginTop: 5 }}><strong>Shipping ID:</strong> {selected.trackingNumber || 'Not assigned'}</div>
                <div style={{ marginTop: 5 }}><strong>Shipping Address:</strong> {selected.shippingAddress || 'Not available'}</div>
              </div>
            )}
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Rejection reason, if rejecting this order..." style={{ width: '100%', boxSizing: 'border-box', minHeight: 86, padding: 12, border: `1.5px solid ${C.border}`, borderRadius: 12, background: C.inputBg, color: C.text, outline: 'none', resize: 'vertical' }} />
            {selected.paymentStatus === 'paid' && (
              <div style={{ marginTop: 12, background: '#FEF3C7', color: '#92400E', borderRadius: 12, padding: 12, fontSize: 12, fontWeight: 800, display: 'flex', gap: 8 }}>
                <AlertTriangle size={16} /> If rejected, the customer will see: money will be refunded within 2 business days.
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button onClick={() => setSelected(null)} style={{ padding: '10px 15px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, cursor: 'pointer', fontWeight: 800 }}>Cancel</button>
              {canEdit && selected.status !== 'delivered' && selected.status !== 'rejected' && <button onClick={() => openDispatch(selected)} style={{ padding: '10px 15px', borderRadius: 10, border: 'none', background: '#4F46E5', color: 'white', cursor: 'pointer', fontWeight: 900 }}>Dispatch</button>}
              {canEdit && selected.status !== 'delivered' && selected.status !== 'rejected' && <button onClick={() => void updateStatus(selected, 'delivered')} style={{ padding: '10px 15px', borderRadius: 10, border: 'none', background: '#16A34A', color: 'white', cursor: 'pointer', fontWeight: 900 }}>Delivered</button>}
              {canEdit && <button onClick={() => void updateStatus(selected, 'rejected')} style={{ padding: '10px 15px', borderRadius: 10, border: 'none', background: '#DC2626', color: 'white', cursor: 'pointer', fontWeight: 900 }}>Reject Order</button>}
            </div>
          </div>
        </div>
      )}

      {showDispatchedDetails && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1250, background: 'rgba(15,23,42,0.58)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowDispatchedDetails(false)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, width: 760, maxWidth: '96vw', maxHeight: '82vh', padding: 24, display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: C.text, fontSize: 20, fontWeight: 900 }}><Truck size={23} color="#4F46E5" /> Dispatched Shipments</div>
                <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{dispatchedOrders.length} dispatched order{dispatchedOrders.length === 1 ? '' : 's'} with courier tracking details</div>
              </div>
              <button onClick={() => setShowDispatchedDetails(false)} aria-label="Close dispatched shipments" style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            <div style={{ overflowY: 'auto', display: 'grid', gap: 11 }}>
              {dispatchedOrders.length === 0 ? (
                <div style={{ padding: 28, textAlign: 'center', border: `1px dashed ${C.border}`, borderRadius: 14, color: C.muted }}>No dispatched shipments are available yet.</div>
              ) : dispatchedOrders.map(order => (
                <button key={order.id} type="button" onClick={() => { setShowDispatchedDetails(false); setSelected(order); }} style={{ width: '100%', textAlign: 'left', padding: 14, borderRadius: 14, border: `1px solid ${C.border}`, background: C.bg, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                    <div>
                      <div style={{ color: C.text, fontSize: 14, fontWeight: 900 }}>{order.productName}</div>
                      <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{order.userName} • Order #{order.id.slice(0, 8)}</div>
                    </div>
                    <span style={{ alignSelf: 'flex-start', background: '#E0E7FF', color: '#4338CA', borderRadius: 999, padding: '5px 9px', fontSize: 10, fontWeight: 900 }}>DISPATCHED</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, .8fr) minmax(150px, 1fr) minmax(220px, 1.5fr)', gap: 8 }}>
                    <div style={{ background: C.card, borderRadius: 9, padding: 9 }}><div style={{ color: C.muted, fontSize: 10, fontWeight: 800 }}>COURIER</div><div style={{ color: '#1D4ED8', fontSize: 12, fontWeight: 900, marginTop: 3 }}>{order.courierName || 'Not assigned'}</div></div>
                    <div style={{ background: C.card, borderRadius: 9, padding: 9 }}><div style={{ color: C.muted, fontSize: 10, fontWeight: 800 }}>TRACKING ID</div><div style={{ color: '#166534', fontSize: 12, fontWeight: 900, marginTop: 3, wordBreak: 'break-all' }}>{order.trackingNumber || 'Not assigned'}</div></div>
                    <div style={{ background: C.card, borderRadius: 9, padding: 9 }}><div style={{ color: C.muted, fontSize: 10, fontWeight: 800 }}>SHIPPING ADDRESS</div><div style={{ color: C.text, fontSize: 12, fontWeight: 700, marginTop: 3 }}>{order.shippingAddress || 'Not available'}</div></div>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}><button onClick={() => setShowDispatchedDetails(false)} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#4F46E5', color: 'white', cursor: 'pointer', fontWeight: 900 }}>Close</button></div>
          </div>
        </div>
      )}

      {dispatchOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(15,23,42,0.58)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setDispatchOrder(null)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, width: 500, maxWidth: '95vw', padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.text, fontSize: 19, fontWeight: 900 }}><Truck size={22} color="#4F46E5" /> Dispatch Order</div>
            <div style={{ color: C.muted, fontSize: 13, margin: '6px 0 18px' }}>{dispatchOrder.productName} for {dispatchOrder.userName}</div>
            <label style={{ display: 'block', color: C.text, fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Shipping courier name</label>
            <input value={courierName} onChange={e => setCourierName(e.target.value)} placeholder="Example: Delhivery, Blue Dart, DTDC" style={{ width: '100%', boxSizing: 'border-box', padding: 12, border: `1.5px solid ${C.border}`, borderRadius: 11, background: C.inputBg, color: C.text, outline: 'none', marginBottom: 14 }} />
            <label style={{ display: 'block', color: C.text, fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Shipping ID / AWB number</label>
            <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Enter courier tracking ID" style={{ width: '100%', boxSizing: 'border-box', padding: 12, border: `1.5px solid ${C.border}`, borderRadius: 11, background: C.inputBg, color: C.text, outline: 'none' }} />
            <div style={{ background: '#ECFDF5', color: '#166534', borderRadius: 11, padding: 11, marginTop: 14, fontSize: 12, fontWeight: 700 }}>These shipping details will appear in the customer app under My Orders.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button onClick={() => setDispatchOrder(null)} style={{ padding: '10px 15px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, cursor: 'pointer', fontWeight: 800 }}>Cancel</button>
              <button onClick={() => void submitDispatch()} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#4F46E5', color: 'white', cursor: 'pointer', fontWeight: 900 }}>Confirm Dispatch</button>
            </div>
          </div>
        </div>
      )}

      {feedback && (
        <div style={{ position: 'fixed', right: 24, bottom: 24, background: '#065F46', color: 'white', borderRadius: 12, padding: '13px 18px', fontSize: 13, fontWeight: 800, boxShadow: '0 12px 30px rgba(0,0,0,0.25)' }} onClick={() => setFeedback(null)}>
          {feedback}
        </div>
      )}
    </div>
  );
}
