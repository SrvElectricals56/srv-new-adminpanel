'use client';
import { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Package, Search, FileSpreadsheet } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import ExportModal from '@/components/Shared/ExportModal';

interface CartItem {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  userCode?: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  addedAt: string;
}

export default function DealerCart() {
  const C = useThemePalette();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart?userRole=dealer`);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data.data ?? [];
          
          const enrichedItems = await Promise.all(
            items.map(async (item: any) => {
              try {
                const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${item.userId}`);
                if (userRes.ok) {
                  const userData = await userRes.json();
                  return {
                    ...item,
                    userName: userData.name || userData.fullName || 'N/A',
                    userPhone: userData.phone || userData.mobile || 'N/A',
                    userCode: userData.dealerCode || userData.code || 'N/A'
                  };
                }
              } catch (err) {
                console.error('Error fetching user:', err);
              }
              return { ...item, userName: 'N/A', userPhone: 'N/A', userCode: 'N/A' };
            })
          );
          
          setCartItems(enrichedItems);
        }
      } catch (err) {
        console.error('Error fetching cart:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCartData();
  }, []);

  const filtered = cartItems.filter(item => {
    const searchLower = search.toLowerCase();
    return (
      (item.userName ?? '').toLowerCase().includes(searchLower) ||
      (item.userPhone ?? '').toLowerCase().includes(searchLower) ||
      (item.userCode ?? '').toLowerCase().includes(searchLower) ||
      (item.productName ?? '').toLowerCase().includes(searchLower) ||
      (item.userId ?? '').toLowerCase().includes(searchLower)
    );
  });

  const totalItems = filtered.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = filtered.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const inputStyle: React.CSSProperties = { 
    width: '100%', 
    padding: '9px 12px', 
    border: `1.5px solid ${C.border}`, 
    borderRadius: 8, 
    fontSize: 13.5, 
    outline: 'none', 
    background: C.surface, 
    color: C.text, 
    boxSizing: 'border-box' 
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart size={24} style={{ color: C.red }} /> My Cart
          </h1>
          <p style={{ color: C.muted, fontSize: 14 }}>View dealer cart items and orders</p>
        </div>
        <button onClick={() => setShowExport(true)} style={{ background: C.red, color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileSpreadsheet size={14} /> Export
        </button>
      </div>

      <ExportModal 
        show={showExport} 
        onClose={() => setShowExport(false)} 
        title="Dealer Cart" 
        fileName="dealer-cart" 
        getData={() => cartItems.map(item => ({ 
          Name: item.userName, 
          Phone: item.userPhone, 
          Code: item.userCode, 
          Product: item.productName, 
          Quantity: item.quantity, 
          Price: item.price, 
          Total: item.price * item.quantity,
          AddedAt: item.addedAt 
        }))} 
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 22 }}>
        <div style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8' }}>
            <ShoppingCart size={20} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{filtered.length}</div>
            <div style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 700 }}>Cart Items</div>
          </div>
        </div>
        <div style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
            <Package size={20} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{totalItems}</div>
            <div style={{ fontSize: 12, color: '#7C3AED', fontWeight: 700 }}>Total Quantity</div>
          </div>
        </div>
        <div style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#065F46' }}>
            ₹
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>₹{totalValue.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 12, color: '#065F46', fontWeight: 700 }}>Total Value</div>
          </div>
        </div>
      </div>

      <div style={{ background: C.card, borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}`, marginBottom: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
        <Search size={18} color={C.muted} />
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="Search by name, phone, code, product..." 
          style={{ ...inputStyle, flex: 1, minWidth: 220, border: 'none' }} 
        />
        <span style={{ fontSize: 13, color: C.muted }}>{filtered.length} items</span>
      </div>

      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: C.muted }}>Loading...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                {['Name', 'Phone', 'Code', 'Product', 'Image', 'Quantity', 'Price', 'Total', 'Added At'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: C.muted }}>
                    <ShoppingCart size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <div>No cart items found</div>
                  </td>
                </tr>
              ) : filtered.map(item => (
                <tr 
                  key={item.id} 
                  style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = C.hoverRow}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                >
                  <td style={{ padding: '13px 16px', fontSize: 13, color: C.text, fontWeight: 600 }}>{item.userName || 'N/A'}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>{item.userPhone || 'N/A'}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: C.muted, fontWeight: 600 }}>{item.userCode || 'N/A'}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: C.text }}>{item.productName}</td>
                  <td style={{ padding: '13px 16px' }}>
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, background: C.bg, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={20} color={C.muted} />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 700, color: C.text }}>{item.quantity}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: C.text }}>₹{item.price.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 800, color: '#10B981' }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: C.muted }}>{new Date(item.addedAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
