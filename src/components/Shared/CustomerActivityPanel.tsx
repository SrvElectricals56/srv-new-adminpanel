'use client';
import React, { useEffect, useState } from 'react';
import { Activity, Eye, FileSpreadsheet, Package, ScanLine, ShoppingCart, Wallet } from 'lucide-react';
import type { CustomerActivityInsight } from '@/lib/types';
import { useThemePalette } from '@/lib/theme';
import { formatISTDate } from '@/lib/dateIST';
import ExportModal from './ExportModal';

type Props = {
  customerId: string;
  roleLabel: string;
  loadActivity: (id: string) => Promise<CustomerActivityInsight>;
};

const EVENT_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  scan: { bg: '#EFF6FF', color: '#1D4ED8', label: 'Scan' },
  cart: { bg: '#F5F3FF', color: '#6D28D9', label: 'Cart' },
  order: { bg: '#ECFDF5', color: '#047857', label: 'Order' },
  wallet: { bg: '#FFFBEB', color: '#B45309', label: 'Wallet' },
  screen_view: { bg: '#EEF2FF', color: '#4338CA', label: 'Page' },
  screen_time: { bg: '#F1F5F9', color: '#475569', label: 'Time' },
  product_view: { bg: '#EFF6FF', color: '#1D4ED8', label: 'Product View' },
  product_add_to_cart: { bg: '#F5F3FF', color: '#6D28D9', label: 'Cart Tap' },
  product_buy_now: { bg: '#ECFDF5', color: '#047857', label: 'Buy Tap' },
  profile_view: { bg: '#FFF7ED', color: '#C2410C', label: 'Profile' },
  button_tap: { bg: '#FDF2F8', color: '#BE185D', label: 'Tap' },
};

const resolveEventConfig = (event: CustomerActivityInsight['recentTimeline'][number]) => {
  if (event.title.toLowerCase().includes('catalog')) {
    return { bg: '#FEF2F2', color: '#DC2626', label: 'Catalog' };
  }
  return EVENT_COLORS[event.type] ?? EVENT_COLORS.scan;
};

export default function CustomerActivityPanel({ customerId, roleLabel, loadActivity }: Props) {
  const C = useThemePalette();
  const [activity, setActivity] = useState<CustomerActivityInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    let active = true;
    const refreshActivity = async (initial = false) => {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      try {
        const data = await loadActivity(customerId);
        if (active) {
          setActivity(data);
          setLastUpdatedAt(new Date());
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Could not load activity');
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    void refreshActivity(true);
    const intervalId = window.setInterval(() => { void refreshActivity(false); }, 5_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [customerId, loadActivity]);

  if (loading) {
    return (
      <div style={{ background: C.bg, borderRadius: 14, padding: 18, marginBottom: 22, color: C.muted, fontSize: 13 }}>
        Loading {roleLabel.toLowerCase()} activity insights...
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, padding: 16, marginBottom: 22, color: '#991B1B', fontSize: 13, fontWeight: 700 }}>
        {error ?? 'Activity insights are not available.'}
      </div>
    );
  }

  const summary = activity.summary;
  const cards = [
    { label: 'Favorite Product', value: summary.favoriteProduct, Icon: Eye, color: '#1D4ED8' },
    { label: 'Scans', value: summary.scans, Icon: ScanLine, color: '#2563EB' },
    { label: 'Cart Signals', value: summary.cartItems, Icon: ShoppingCart, color: '#7C3AED' },
    { label: 'Orders', value: summary.productOrders, Icon: Package, color: '#059669' },
    { label: 'Wallet Events', value: summary.walletTransactions, Icon: Wallet, color: '#D97706' },
    { label: 'App Touches', value: summary.appEvents ?? 0, Icon: Activity, color: '#BE185D' },
  ];

  return (
    <div style={{ marginBottom: 22 }}>
      <ExportModal show={showExport} onClose={() => setShowExport(false)} title={`${roleLabel} Activity`} fileName={`${roleLabel.toLowerCase().replace(/\s+/g, '-')}-activity`} getData={() => [
        ...activity.productInterests.map(product => ({ RecordType: 'Product Interest', Product: product.productName, Category: product.category ?? '', Views: product.viewCount ?? 0, Scans: product.scanCount, CartQuantity: product.cartQuantity, OrderQuantity: product.orderQuantity, IntentScore: product.intentScore })),
        ...activity.recentTimeline.map(event => ({ RecordType: 'Activity Timeline', Type: event.type, Title: event.title, Detail: event.detail, OccurredAt: event.occurredAt })),
      ]} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: C.text }}>
            <Activity size={17} /> Activity & Product Interest
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
            Based on real scans, cart, orders, catalog taps and app touch records.
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
          <button onClick={() => setShowExport(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 9px', background: C.card, color: C.text, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}><FileSpreadsheet size={13} /> Export</button>
          <span style={{ background: '#EFF6FF', color: '#1D4ED8', borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 800 }}>
            Last active: {summary.lastActivityAt ? formatISTDate(summary.lastActivityAt) : 'No activity'}
          </span>
          <span style={{ color: refreshing ? '#EF4444' : C.muted, fontSize: 10, fontWeight: 800 }}>
            {refreshing ? 'Refreshing live...' : lastUpdatedAt ? `Auto refresh: ${lastUpdatedAt.toLocaleTimeString()}` : 'Auto refresh on'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
        {cards.map((card) => (
          <div key={card.label} style={{ background: C.bg, borderRadius: 12, padding: '11px 10px', border: `1px solid ${C.border}` }}>
            <div style={{ color: card.color, marginBottom: 5 }}><card.Icon size={16} /></div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.value}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 3, fontWeight: 700 }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 12 }}>
        <div style={{ background: C.bg, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 10 }}>Top Product Interests</div>
          {activity.productInterests.length === 0 ? (
            <div style={{ fontSize: 12, color: C.muted }}>No product signals yet. Once this user scans, adds to cart, or orders, products will appear here.</div>
          ) : activity.productInterests.slice(0, 5).map((product, index) => (
            <div key={product.productId || product.productName} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 10, alignItems: 'center', padding: '9px 0', borderBottom: index === Math.min(activity.productInterests.length, 5) - 1 ? 'none' : `1px solid ${C.border}` }}>
              <div style={{ width: 24, height: 24, borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>{index + 1}</div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: C.text }}>{product.productName}</div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  {product.category || '—'} · {product.viewCount ?? 0} views · {product.scanCount} scans · {product.cartQuantity} cart · {product.orderQuantity} orders
                  {product.durationMs ? ` · ${Math.round(product.durationMs / 1000)}s` : ''}
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#1D4ED8' }}>{product.intentScore}</div>
            </div>
          ))}
        </div>

        <div style={{ background: C.bg, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 10 }}>Recent Journey / Touch History</div>
          {activity.recentTimeline.length === 0 ? (
            <div style={{ fontSize: 12, color: C.muted }}>No recent activity found.</div>
          ) : activity.recentTimeline.slice(0, 12).map((event) => {
            const config = resolveEventConfig(event);
            return (
              <div key={`${event.type}-${event.id}`} style={{ padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ background: config.bg, color: config.color, borderRadius: 999, padding: '2px 7px', fontSize: 10, fontWeight: 800 }}>{config.label}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{formatISTDate(event.occurredAt)}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.text }}>{event.title}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{event.detail}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
