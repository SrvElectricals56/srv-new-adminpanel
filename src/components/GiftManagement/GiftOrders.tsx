'use client';
import { useState, useEffect } from 'react';
import { ShoppingBag, Zap, Store, Eye, Check, X, Package, SlidersHorizontal, Search } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { redemptionApi } from '@/lib/api';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import ExportModal from '@/components/Shared/ExportModal';

type OrderStatus = 'pending' | 'approved' | 'shipped' | 'delivered' | 'rejected';

interface GiftOrder {
  id: number;
  type: 'electrician' | 'dealer';
  userName: string;
  userCode: string;
  dealerName: string;
  giftName: string;
  giftImage: string;
  pointsUsed: number;
  orderedAt: string;
  status: OrderStatus;
}

const STATUS_CONFIG: Record<OrderStatus, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#FEF3C7', color: '#92400E', label: '⏳ Pending' },
  approved:  { bg: '#D1FAE5', color: '#065F46', label: '✅ Approved' },
  shipped:   { bg: '#EFF6FF', color: '#1D4ED8', label: '🚚 Shipped' },
  delivered: { bg: '#F0FDF4', color: '#166534', label: '📦 Delivered' },
  rejected:  { bg: '#FEE2E2', color: '#991B1B', label: '❌ Rejected' },
};

function OrderDetailModal({ order, onClose, C }: { order: GiftOrder; onClose: () => void; C: any }) {
  const s = STATUS_CONFIG[order.status];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: 20, width: 520, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.25)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Order #{order.id} Details</div>
          <button onClick={onClose} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: C.muted }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center' }}>
            <img src={order.giftImage} alt={order.giftName} style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 12, border: `2px solid ${C.border}` }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{order.giftName}</div>
              <div style={{ fontSize: 13, color: '#F59E0B', fontWeight: 700, marginTop: 4 }}>⚡ {order.pointsUsed} points</div>
              <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'inline-block', marginTop: 6 }}>{s.label}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Order ID', value: `#${order.id}` },
              { label: 'Type', value: order.type === 'electrician' ? '⚡ Electrician' : 'Dealer' },
              { label: order.type === 'electrician' ? 'Electrician' : 'Dealer', value: order.userName },
              { label: 'Code', value: order.userCode },
              { label: 'Dealer', value: order.dealerName },
              { label: 'Ordered On', value: new Date(order.orderedAt).toLocaleDateString('en-IN') },
            ].map(item => (
              <div key={item.label} style={{ background: C.bg, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GiftOrders() {
  const C = useThemePalette();
  const [orders, setOrders] = useState<GiftOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'electrician' | 'dealer'>('electrician');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<GiftOrder | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [confirmState, setConfirmState] = useState<{ show: boolean; id: number; action: 'approve' | 'reject' }>({ show: false, id: 0, action: 'approve' });

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await redemptionApi.getAll({ limit: '500' });
      const data = Array.isArray(res) ? res : (res as any).data ?? [];
      setOrders(data.map((o: any) => ({
        id: o.id,
        type: o.role ?? o.userType ?? 'electrician',
        userName: o.userName ?? o.user_name ?? o.user?.name ?? 'Unknown',
        userCode: o.userCode ?? o.user_code ?? o.userId ?? '',
        dealerName: o.dealerName ?? o.dealer_name ?? '—',
        giftName: o.type ?? o.giftName ?? o.gift_name ?? 'Gift',
        giftImage: o.giftImage ?? o.gift_image ?? '',
        pointsUsed: o.points ?? 0,
        orderedAt: o.requestedAt ?? o.requested_at ?? o.createdAt ?? new Date().toISOString(),
        status: o.status ?? 'pending',
      })));
    } catch (err) {
      console.error('Failed to load gift orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const filtered = orders.filter(o =>
    o.type === tab &&
    (filterStatus === 'all' || o.status === filterStatus) &&
    (search === '' || o.userName.toLowerCase().includes(search.toLowerCase()) || o.giftName.toLowerCase().includes(search.toLowerCase()) || o.dealerName.toLowerCase().includes(search.toLowerCase()))
  );

  const confirmAction = async () => {
    try {
      if (confirmState.action === 'approve') await redemptionApi.approve(String(confirmState.id));
      else await redemptionApi.reject(String(confirmState.id));
      await loadOrders();
    } catch (err) {
      console.error('Failed to update order:', err);
    }
    setConfirmState({ show: false, id: 0, action: 'approve' });
  };

  const activeFilters = [filterStatus !== 'all'].filter(Boolean).length;
  const inputStyle: React.CSSProperties = { padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <ConfirmDialog show={confirmState.show} title={confirmState.action === 'approve' ? 'Approve Order' : 'Reject Order'} message={`Are you sure you want to ${confirmState.action} this gift order?`} onConfirm={confirmAction} onCancel={() => setConfirmState({ show: false, id: 0, action: 'approve' })} type={confirmState.action === 'approve' ? 'success' : 'danger'} />
      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} C={C} />}
      <ExportModal show={showExport} onClose={() => setShowExport(false)} title={tab === 'electrician' ? 'Electrician Gift Orders' : 'Dealer Gift Orders'} fileName={`gift-orders-${tab}`} getData={() => filtered.map(o => ({ ID: o.id, Type: o.type, Name: o.userName, Code: o.userCode, Dealer: o.dealerName, Gift: o.giftName, Points: o.pointsUsed, Date: o.orderedAt, Status: o.status }))} />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', borderRadius: 18, padding: '22px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 24px rgba(124,58,237,0.25)' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}><ShoppingBag size={26} /> Gift Orders</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>Track and manage gift redemption orders</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Total', value: orders.filter(o => o.type === tab).length, color: 'white' },
            { label: 'Pending', value: orders.filter(o => o.type === tab && o.status === 'pending').length, color: '#FCD34D' },
            { label: 'Delivered', value: orders.filter(o => o.type === tab && o.status === 'delivered').length, color: '#6EE7B7' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '10px 16px', background: 'rgba(255,255,255,0.12)', borderRadius: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs + Export */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', background: C.card, borderRadius: 12, padding: 4, border: `1px solid ${C.border}`, gap: 4 }}>
          {[{ id: 'electrician', label: 'Electrician Orders', Icon: Zap }, { id: 'dealer', label: 'Dealer Orders', Icon: Store }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ padding: '9px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, background: tab === t.id ? '#7C3AED' : 'transparent', color: tab === t.id ? 'white' : C.muted, transition: 'all 0.2s' }}>
              <t.Icon size={15} /> {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowExport(true)} style={{ background: C.card, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>Export</button>
      </div>

      {/* Search + Filter */}
      <div style={{ background: C.card, borderRadius: 14, padding: '12px 16px', border: `1px solid ${C.border}`, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, gift, dealer..." style={{ ...inputStyle, paddingLeft: 32, width: '100%', boxSizing: 'border-box' }} />
        </div>
        {activeFilters > 0 && (
          <button onClick={() => setFilterStatus('all')} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.red}`, background: '#FFF0F0', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>✕ Clear</button>
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
                    <option value="pending">⏳ Pending</option>
                    <option value="approved">✅ Approved</option>
                    <option value="shipped">🚚 Shipped</option>
                    <option value="delivered">📦 Delivered</option>
                    <option value="rejected">❌ Rejected</option>
                  </select>
                </div>
                <div style={{ padding: '0 22px 18px', display: 'flex', gap: 10 }}>
                  <button onClick={() => { setFilterStatus('all'); setShowFilterPopup(false); }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Reset</button>
                  <button onClick={() => setShowFilterPopup(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apply</button>
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
              {['ID', 'Type', 'Name', 'Image', 'Gift Item', 'Dealer', 'Points', 'Date', 'Status', 'Action'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(order => {
              const s = STATUS_CONFIG[order.status];
              return (
                <tr key={order.id} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = C.bg}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 800, color: C.muted }}>{order.id}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: order.type === 'electrician' ? '#FFF0F0' : '#EFF6FF', color: order.type === 'electrician' ? '#C2410C' : '#1D4ED8', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                      {order.type === 'electrician' ? <Zap size={11} /> : <Store size={11} />}
                      {order.type === 'electrician' ? 'Electrician' : 'Dealer'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{order.userName}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{order.userCode}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <img src={order.giftImage} alt={order.giftName} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: `1px solid ${C.border}` }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Package size={14} style={{ color: C.muted }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{order.giftName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: C.muted }}>{order.dealerName}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>⚡ {order.pointsUsed}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: C.muted }}>{new Date(order.orderedAt).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>{s.label}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setSelectedOrder(order)} title="View" style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 7, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={14} /></button>
                      {order.status === 'pending' && (
                        <>
                          <button onClick={() => setConfirmState({ show: true, id: order.id, action: 'approve' })} title="Approve" style={{ background: '#D1FAE5', color: '#065F46', border: 'none', borderRadius: 7, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={14} /></button>
                          <button onClick={() => setConfirmState({ show: true, id: order.id, action: 'reject' })} title="Reject" style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 7, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={10} style={{ padding: '60px 20px', textAlign: 'center', color: C.muted }}>
                <ShoppingBag size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>No orders found</div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
