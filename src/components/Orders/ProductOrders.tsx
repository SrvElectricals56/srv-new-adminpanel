'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingBag, Bolt, Store, Eye, Pencil, Trash2, Package, SlidersHorizontal, Search, User, FileSpreadsheet } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { formatISTDateTime, formatISTDate, formatISTDateTimeFull } from '@/lib/dateIST';
import { productOrderApi } from '@/lib/api';
import ExportModal from '@/components/Shared/ExportModal';

type OrderStatus = 'pending' | 'approved' | 'out_for_delivery' | 'shipped' | 'delivered' | 'rejected' | 'cancelled' | 'returned' | 'refunded';

interface ProductOrder {
  id: string;
  orderCode?: string;
  userId: string;
  userRole: string;
  userName: string;
  userPhone: string;
  userCode: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  total: number;
  status: OrderStatus;
  shippingAddress: string;
  trackingNumber: string;
  courierName?: string;
  rejectionReason: string;
  paymentStatus?: string;
  paymentMethod?: string;
  paidAt?: string;
  estimatedDeliveryAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  refundStatus?: string;
  refundMessage?: string;
  deliveryNotes?: string;
  cancelReason?: string;
  returnReason?: string;
  refundReason?: string;
  customerActionAt?: string;
  updatedAt?: string;
  orderedAt: string;
}

const STATUS_CONFIG: Record<OrderStatus, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
  approved:  { bg: '#D1FAE5', color: '#065F46', label: 'Confirmed' },
  out_for_delivery: { bg: '#E0F2FE', color: '#0369A1', label: 'Out For Delivery' },
  shipped:   { bg: '#EFF6FF', color: '#1D4ED8', label: 'Shipped' },
  delivered: { bg: '#F0FDF4', color: '#166534', label: 'Delivered' },
  rejected:  { bg: '#FEE2E2', color: '#991B1B', label: 'Rejected' },
  cancelled: { bg: '#FFE4E6', color: '#BE123C', label: 'Cancelled' },
  returned: { bg: '#F3E8FF', color: '#7E22CE', label: 'Return requested' },
  refunded: { bg: '#CCFBF1', color: '#0F766E', label: 'Refunded' },
};

function getOrderStatusDisplay(order: ProductOrder) {
  const refundRequested = ['pending', 'requested'].includes(String(order.refundStatus ?? '').toLowerCase());
  if (order.status === 'refunded') return { bg: '#CCFBF1', color: '#0F766E', label: 'Refund done' };
  if (refundRequested && !['cancelled', 'returned'].includes(order.status)) {
    return { bg: '#FEF2F2', color: '#B91C1C', label: 'Refund requested' };
  }
  return STATUS_CONFIG[order.status];
}

function OrderDetailModal({ order, onClose, C }: { order: ProductOrder; onClose: () => void; C: any }) {
  const s = getOrderStatusDisplay(order);
  const refundRequested = String(order.refundStatus ?? '').toLowerCase() === 'requested' || order.status === 'refunded';
  const refundDone = order.status === 'refunded';
  const mouseDownInside = React.useRef(false);
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onMouseDown={() => { mouseDownInside.current = false; }}
      onMouseUp={() => { if (!mouseDownInside.current) onClose(); }}
    >
      <div
        style={{ background: C.card, borderRadius: 20, width: 520, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.25)', border: `1px solid ${C.border}` }}
        onMouseDown={e => { e.stopPropagation(); mouseDownInside.current = true; }}
        onMouseUp={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Order #{order.orderCode ?? order.id.slice(0, 8)}</div>
          <button onClick={onClose} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: C.muted }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center' }}>
            <img src={order.productImage} alt={order.productName} style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 12, border: `2px solid ${C.border}` }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{order.productName}</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Qty: {order.quantity} × ₹{order.price}</div>
              <div style={{ fontSize: 15, color: '#059669', fontWeight: 700, marginTop: 4 }}>₹{order.total}</div>
              <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'inline-block', marginTop: 6 }}>{s.label}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Order ID', value: `#${order.id}` },
              { label: 'Role', value: order.userRole },
              { label: 'Name', value: order.userName },
              { label: 'Phone', value: order.userPhone || '—' },
              { label: 'Code', value: order.userCode || '—' },
              { label: 'Ordered On', value: formatISTDate(order.orderedAt) },
              { label: 'Payment', value: order.paymentStatus ? `${order.paymentStatus}${order.paidAt ? ` (${formatISTDate(order.paidAt)})` : ''}` : '—' },
              { label: 'Expected Delivery', value: order.estimatedDeliveryAt ? formatISTDate(order.estimatedDeliveryAt) : '—' },
              { label: 'Shipped Date', value: order.dispatchedAt ? formatISTDate(order.dispatchedAt) : '—' },
              { label: 'Status Updated', value: order.updatedAt ? formatISTDate(order.updatedAt) : '—' },
              { label: 'Shipping Address', value: order.shippingAddress || '—' },
              { label: 'Tracking', value: order.trackingNumber || '—' },
              { label: 'Courier', value: order.courierName || '—' },
              { label: 'Refund', value: order.refundStatus || order.refundMessage || '—' },
              { label: 'Activity', value: order.deliveryNotes || '—' },
              { label: 'Customer reason', value: order.cancelReason || order.returnReason || order.refundReason || '—' },
              { label: 'Requested at', value: order.customerActionAt ? formatISTDateTimeFull(order.customerActionAt) : '—' },
              { label: 'Reason', value: order.rejectionReason || '—' },
            ].map(item => (
              <div key={item.label} style={{ background: C.bg, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{item.value}</div>
              </div>
            ))}
          </div>
          {(refundRequested || refundDone) && (
            <div style={{ marginTop: 18, border: '1px solid #A7F3D0', background: '#F0FDFA', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ color: '#065F46', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Refund progress</div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {[
                  { label: 'Refund requested', done: refundRequested },
                  { label: 'Refund done', done: refundDone },
                ].map((step, index) => (
                  <React.Fragment key={step.label}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: step.done ? '#047857' : '#6B7280', fontSize: 13, fontWeight: 800 }}>
                      <span style={{ width: 24, height: 24, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: step.done ? '#059669' : '#FFFFFF', color: step.done ? '#FFFFFF' : '#94A3B8', border: `2px solid ${step.done ? '#059669' : '#CBD5E1'}` }}>{step.done ? '✓' : '2'}</span>
                      {step.label}
                    </div>
                    {index === 0 && <div style={{ height: 2, flex: 1, minWidth: 22, margin: '0 10px', background: refundDone ? '#059669' : '#A7F3D0' }} />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductOrders({ role }: { role?: import('@/lib/types').AdminRole }) {
  const C = useThemePalette();
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin';
  const canEdit = isSuperAdmin || isAdmin;
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, pending: 0, shipped: 0, delivered: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | OrderStatus | 'refund_requested'>('all');
  const [selectedOrder, setSelectedOrder] = useState<ProductOrder | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean; order: ProductOrder | null }>({ open: false, order: null });
  const [editStatus, setEditStatus] = useState<OrderStatus>('pending');
  const [editTracking, setEditTracking] = useState('');
  const [editCourierName, setEditCourierName] = useState('');
  const [editRejectReason, setEditRejectReason] = useState('');
  const [editRefundMessage, setEditRefundMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; order: ProductOrder | null }>({ show: false, order: null });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const loadingOrdersRef = useRef(false);

  const buildStats = (rows: ProductOrder[]) => ({
    total: rows.length,
    pending: rows.filter(o => o.status === 'pending').length,
    approved: rows.filter(o => o.status === 'approved').length,
    outForDelivery: rows.filter(o => o.status === 'out_for_delivery').length,
    shipped: rows.filter(o => o.status === 'shipped').length,
    delivered: rows.filter(o => o.status === 'delivered').length,
    rejected: rows.filter(o => o.status === 'rejected').length,
    cancelled: rows.filter(o => o.status === 'cancelled').length,
    returned: rows.filter(o => o.status === 'returned').length,
    refunded: rows.filter(o => o.status === 'refunded').length,
  });

  const loadData = useCallback(async (silent = false) => {
    if (loadingOrdersRef.current) return;
    loadingOrdersRef.current = true;
    try {
      if (!silent) setLoading(true);
      const ordersRes = await productOrderApi.getAll({ limit: '500' });
      const data = Array.isArray(ordersRes) ? ordersRes : (ordersRes as any).data ?? [];
      setOrders(data);
      setStats(buildStats(data));
    } catch (err) {
      console.error('Failed to load product orders:', err);
    } finally {
      loadingOrdersRef.current = false;
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    // Keep order activity aligned with app requests without requiring a page refresh.
    const syncTimer = setInterval(() => void loadData(true), 1000);
    return () => clearInterval(syncTimer);
  }, [loadData]);

  const searchQuery = search.trim().toLowerCase();
  const filtered = orders.filter(o =>
    (tab === 'all' || o.userRole === tab) &&
    (filterStatus === 'all' ||
      (filterStatus === 'refund_requested'
        ? ['pending', 'requested'].includes(String(o.refundStatus ?? '').toLowerCase()) && o.status !== 'refunded'
        : o.status === filterStatus)) &&
    (searchQuery === '' || [o.orderCode, o.id, o.userName, o.productName, o.userPhone, o.userCode]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(searchQuery)))
  );

  const openEditModal = (order: ProductOrder) => {
    setEditStatus(order.status);
    setEditTracking(order.trackingNumber || '');
    setEditCourierName(order.courierName || '');
    setEditRejectReason(order.rejectionReason || '');
    setEditRefundMessage(order.refundMessage || '');
    setEditModal({ open: true, order });
  };

  const closeEditModal = () => {
    setEditModal({ open: false, order: null });
    setEditTracking('');
    setEditCourierName('');
    setEditRejectReason('');
    setEditRefundMessage('');
  };

  const handleEditSave = async () => {
    const order = editModal.order;
    if (!order) return;
    setSubmitting(true);
    try {
      await productOrderApi.updateStatus(order.id, {
        status: editStatus,
        trackingNumber: editTracking,
        courierName: editCourierName,
        rejectionReason: editStatus === 'rejected' ? editRejectReason : undefined,
        refundMessage: editStatus === 'rejected' ? editRefundMessage : undefined,
      });
      setFeedback({ type: 'success', message: 'Order updated successfully.' });
      closeEditModal();
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Update failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const order = deleteConfirm.order;
    if (!order) return;
    setSubmitting(true);
    try {
      await productOrderApi.delete(order.id);
      setDeleteConfirm({ show: false, order: null });
      setFeedback({ type: 'success', message: 'Order delete kar diya gaya.' });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Delete failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const activeFilters = [filterStatus !== 'all'].filter(Boolean).length;
  const inputStyle: React.CSSProperties = { padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} C={C} />}
      <ExportModal show={showExport} onClose={() => setShowExport(false)} title={`Product Orders${tab !== 'all' ? ` - ${tab}` : ''}`} fileName={`product-orders-${tab}`} getData={() => filtered.map(o => ({ ID: o.id, Role: o.userRole, Name: o.userName, Phone: o.userPhone, Code: o.userCode, Product: o.productName, Qty: o.quantity, Price: o.price, Total: o.total, Date: o.orderedAt, Status: o.status, Payment: o.paymentStatus, ShippedDate: o.dispatchedAt, RefundStatus: o.refundStatus, RefundMessage: o.refundMessage, Activity: o.deliveryNotes }))} />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #059669, #047857)', borderRadius: 18, padding: '22px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 24px rgba(5,150,105,0.25)' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}><Package size={26} /> Product Orders</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>Manage and track product orders from all users</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Total', value: stats.total, color: 'white' },
            { label: 'Pending', value: stats.pending, color: '#FCD34D' },
            { label: 'Out Delivery', value: stats.outForDelivery, color: '#BAE6FD' },
            { label: 'Shipped', value: stats.shipped, color: '#93C5FD' },
            { label: 'Delivered', value: stats.delivered, color: '#6EE7B7' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '10px 16px', background: 'rgba(255,255,255,0.12)', borderRadius: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(150px, 220px))', gap: 10, marginBottom: 16 }}>
        {[
          { status: 'cancelled' as const, label: 'Cancellation requests', copy: 'Customer cancellations awaiting refund follow-up', color: '#BE123C', soft: '#FFF1F2' },
          { status: 'returned' as const, label: 'Return requests', copy: 'Review customer reason and arrange return pickup', color: '#7E22CE', soft: '#FAF5FF' },
          { status: 'refund_requested' as const, label: 'Refund requests', copy: 'Verify payment and complete refund processing', color: '#0F766E', soft: '#F0FDFA' },
        ].map(queue => {
          const count = queue.status === 'refund_requested'
            ? orders.filter(order => ['pending', 'requested'].includes(String(order.refundStatus ?? '').toLowerCase()) && order.status !== 'refunded').length
            : orders.filter(order => order.status === queue.status).length;
          const selected = filterStatus === queue.status;
          return <button key={queue.status} onClick={() => setFilterStatus(selected ? 'all' : queue.status)} title={queue.copy} style={{ textAlign: 'left', border: `1px solid ${selected ? queue.color : C.border}`, background: queue.soft, borderRadius: 11, padding: '10px 12px', cursor: 'pointer', boxShadow: selected ? `0 5px 14px ${queue.color}22` : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}><span style={{ color: queue.color, fontSize: 12, fontWeight: 900 }}>{queue.label}</span><span style={{ minWidth: 23, height: 23, borderRadius: 12, background: queue.color, color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>{count}</span></div>
            <div style={{ marginTop: 3, color: C.muted, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{queue.copy}</div>
          </button>;
        })}
      </div>

      {/* Tabs + Export */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', background: C.card, borderRadius: 12, padding: 4, border: `1px solid ${C.border}`, gap: 4 }}>
          {[{ id: 'all', label: 'All Orders', Icon: ShoppingBag }, { id: 'dealer', label: 'Dealer Orders', Icon: Store }, { id: 'electrician', label: 'Electrician Orders', Icon: Bolt }, { id: 'user', label: 'Customer Orders', Icon: User }, { id: 'counterboy', label: 'Counterboy Orders', Icon: Package }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '9px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, background: tab === t.id ? '#059669' : 'transparent', color: tab === t.id ? 'white' : C.muted, transition: 'all 0.2s' }}>
              <t.Icon size={15} /> {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowExport(true)} style={{ background: C.card, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><FileSpreadsheet size={14} /> Export</button>
      </div>

      {/* Search + Filter */}
      <div style={{ background: C.card, borderRadius: 14, padding: '12px 16px', border: `1px solid ${C.border}`, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order ID, name, product or phone..." style={{ ...inputStyle, paddingLeft: 32, width: '100%', boxSizing: 'border-box' }} />
        </div>
        {activeFilters > 0 && (
          <button onClick={() => setFilterStatus('all')} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.red}`, background: '#FFF0F0', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Clear</button>
        )}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowFilterPopup(p => !p)} style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${showFilterPopup || activeFilters > 0 ? C.red : C.border}`, background: showFilterPopup || activeFilters > 0 ? '#FFF0F0' : C.card, color: showFilterPopup || activeFilters > 0 ? C.red : C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <SlidersHorizontal size={16} />
            {activeFilters > 0 && <span style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: C.red, color: 'white', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilters}</span>}
          </button>
          {showFilterPopup && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowFilterPopup(false)}>
              <div style={{ background: C.card, borderRadius: 20, width: 380, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.25)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.red }}><SlidersHorizontal size={16} /></div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Filter Orders</div>
                  </div>
                  <button onClick={() => setShowFilterPopup(false)} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: C.muted, fontSize: 15 }}>✕</button>
                </div>
                <div style={{ padding: '18px 22px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 8 }}>Order Status</div>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${filterStatus !== 'all' ? C.red : C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text }}>
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="returned">Return requested</option>
                    <option value="refund_requested">Refund requested</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                <div style={{ padding: '0 22px 18px', display: 'flex', gap: 10 }}>
                  <button onClick={() => { setFilterStatus('all'); setShowFilterPopup(false); }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Reset</button>
                  <button onClick={() => setShowFilterPopup(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #059669, #047857)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apply</button>
                </div>
              </div>
            </div>
          )}
        </div>
        <span style={{ fontSize: 13, color: C.muted, whiteSpace: 'nowrap' }}>{filtered.length} orders</span>
      </div>

      {/* Table */}
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
              {['ID', 'Role', 'Customer', 'Product', 'Qty', 'Total', 'Date', 'Status', 'Activity', 'Action'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(order => {
              const s = getOrderStatusDisplay(order);
              const refundRequested = ['pending', 'requested'].includes(String(order.refundStatus ?? '').toLowerCase()) && order.status !== 'refunded';
              return (
                <tr key={order.id} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = C.bg}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 800, color: C.muted }}>{order.orderCode ?? order.id.slice(0, 8)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      background: order.userRole === 'electrician' ? '#FFF0F0' : order.userRole === 'dealer' ? '#EFF6FF' : order.userRole === 'user' ? '#F0FDF4' : '#FDF4FF',
                      color: order.userRole === 'electrician' ? '#C2410C' : order.userRole === 'dealer' ? '#1D4ED8' : order.userRole === 'user' ? '#15803D' : '#7C3AED',
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content'
                    }}>
                      {order.userRole === 'electrician' ? <Bolt size={11} /> : order.userRole === 'dealer' ? <Store size={11} /> : order.userRole === 'user' ? <User size={11} /> : <Package size={11} />}
                      {order.userRole}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{order.userName}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{order.userPhone || order.userCode}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {order.productImage && <img src={order.productImage} alt={order.productName} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: `1px solid ${C.border}` }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />}
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{order.productName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: C.text }}>{order.quantity}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>₹{order.total}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: C.muted }}>{formatISTDate(order.orderedAt)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>{s.label}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: order.status === 'cancelled' ? '#BE123C' : C.muted }}>
                    {refundRequested ? 'Refund requested' : order.status === 'cancelled' ? 'Cancelled' : order.deliveryNotes || '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button onClick={() => setSelectedOrder(order)} title="View Details" style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 7, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={14} /></button>
                      {canEdit && (
                        <>
                          <button onClick={() => openEditModal(order)} title="Edit Order" style={{ background: '#F0FDF4', color: '#15803D', border: 'none', borderRadius: 7, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={14} /></button>
                          <button onClick={() => setDeleteConfirm({ show: true, order })} title="Delete Order" style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 7, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={10} style={{ padding: '60px 20px', textAlign: 'center', color: C.muted }}>
                <Package size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>No orders found</div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: feedback.type === 'success' ? '#065F46' : '#991B1B', color: 'white', padding: '14px 22px', borderRadius: 12, fontSize: 13, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, width: 22, height: 22, cursor: 'pointer', color: 'white', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.order && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={closeEditModal}>
          <div style={{ background: C.card, borderRadius: 20, width: 500, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.25)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Edit Order #{editModal.order.orderCode ?? editModal.order.id.slice(0, 8)}</div>
              <button onClick={closeEditModal} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: C.muted, fontSize: 15 }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 6 }}>Order Status</div>
              <select value={editStatus} onChange={e => setEditStatus(e.target.value as OrderStatus)} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text, marginBottom: 16 }}>
                <option value="pending">Pending</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="rejected">Rejected</option>
                <option value="refunded">Refunded (payment sent)</option>
              </select>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 6 }}>Courier Name</div>
              <input value={editCourierName} onChange={e => setEditCourierName(e.target.value)} placeholder="Example: Delhivery, Blue Dart, DTDC" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', marginBottom: 16 }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 6 }}>Tracking Number</div>
              <input value={editTracking} onChange={e => setEditTracking(e.target.value)} placeholder="Optional tracking / courier ref" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', marginBottom: 16 }} />
              {editStatus === 'rejected' && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 6 }}>Rejection Reason</div>
                  <textarea value={editRejectReason} onChange={e => setEditRejectReason(e.target.value)} placeholder="Reason for rejection..." style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', minHeight: 80, resize: 'vertical', marginBottom: 16 }} />
                </>
              )}
              {editStatus === 'rejected' && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 6 }}>Refund / Customer Message</div>
                  <textarea value={editRefundMessage} onChange={e => setEditRefundMessage(e.target.value)} placeholder="Message customer will see about refund, return, or cancellation..." style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', minHeight: 72, resize: 'vertical', marginBottom: 16 }} />
                </>
              )}
            </div>
            <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={closeEditModal} style={{ padding: '10px 18px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => void handleEditSave()} disabled={submitting}
                style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #059669, #047857)', color: 'white', fontSize: 13, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm.show && deleteConfirm.order && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setDeleteConfirm({ show: false, order: null })}>
          <div style={{ background: C.card, borderRadius: 20, width: 440, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.25)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Delete Confirmation</div>
              <button onClick={() => setDeleteConfirm({ show: false, order: null })} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: C.muted, fontSize: 15 }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 14, color: C.text, marginBottom: 12 }}>Kya aap is order ko delete karna chahte hain?</div>
              <div style={{ background: C.bg, borderRadius: 12, padding: 16, border: `1px solid ${C.border}`, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                <strong>Product:</strong> {deleteConfirm.order.productName}<br />
                <strong>Customer:</strong> {deleteConfirm.order.userName}<br />
                <strong>Qty:</strong> {deleteConfirm.order.quantity} × ₹{deleteConfirm.order.price} = ₹{deleteConfirm.order.total}<br />
                <strong>Status:</strong> {STATUS_CONFIG[deleteConfirm.order.status].label}<br />
                <strong>Date:</strong> {formatISTDate(deleteConfirm.order.orderedAt)}
              </div>
            </div>
            <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setDeleteConfirm({ show: false, order: null })} style={{ padding: '10px 18px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => void handleDelete()} disabled={submitting}
                style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#DC2626', color: 'white', fontSize: 13, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: submitting ? 0.7 : 1 }}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
