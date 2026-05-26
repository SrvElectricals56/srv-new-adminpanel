'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useThemePalette } from '@/lib/theme';
import {
  LayoutDashboard, Zap, Store, Package, Star, Tag,
  BarChart2, QrCode, Gift, Bell, Users,
  ChevronLeft, ChevronRight, ArrowLeftRight, Percent,
  Image as ImageIcon, MessageSquare, FileText,
  UserCheck, ClipboardList, Shield, Smartphone, Play, AppWindow,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    ]
  },
  {
    label: 'Users',
    items: [
      { id: 'electricians', label: 'Electricians', Icon: Zap },
      { id: 'dealers', label: 'Dealers', Icon: Store },
      { id: 'app-users', label: 'Customers', Icon: Users },
      { id: 'counterboys', label: 'Counter Boys', Icon: UserCheck },
    ]
  },
  {
    label: 'Catalog',
    items: [
      { id: 'products', label: 'Products', Icon: Package },
      { id: 'product-categories', label: 'Product Categories', Icon: Tag },
      { id: 'points-config', label: 'Products Points', Icon: Star },
    ]
  },
  {
    label: 'QR Management',
    items: [
      { id: 'qr-codes', label: 'QR Codes', Icon: QrCode },
      { id: 'qr-generator', label: 'QR Generator', Icon: QrCode },
    ]
  },
  {
    label: 'Gift Management',
    items: [
      { id: 'gift-products', label: 'Gift Products', Icon: Gift },
      { id: 'gift-orders', label: 'Gift Orders', Icon: Gift },
    ]
  },
  {
    label: 'Financial',
    items: [
      { id: 'transfer-points', label: 'Transfer Points', Icon: ArrowLeftRight },
      { id: 'commissions', label: 'Dealer Bonus', Icon: Percent },
    ]
  },
  {
    label: 'Engagement',
    items: [
      { id: 'notifications', label: 'Notifications', Icon: Bell },
      { id: 'referrals', label: 'Referrals', Icon: Users },
    ]
  },
  {
    label: 'Content',
    items: [
      { id: 'banners', label: 'Banners', Icon: ImageIcon },
      { id: 'testimonials', label: 'Testimonials', Icon: MessageSquare },
      { id: 'upload-plays', label: 'Upload Plays', Icon: Play },
      { id: 'privacy-policy', label: 'Privacy Policy', Icon: FileText },
    ]
  },
  {
    label: 'Support',
    items: [
      { id: 'enquiry-support', label: 'Enquiry Support', Icon: MessageSquare },
    ]
  },
  {
    label: 'System',
    items: [
      { id: 'reports', label: 'Reports', Icon: BarChart2 },
      { id: 'admin-settings', label: 'Admin Settings', Icon: Shield },
      { id: 'app-settings', label: 'App Settings', Icon: Smartphone },
      { id: 'app-page-controls', label: 'App Page Controls', Icon: Smartphone },
      { id: 'app-icons', label: 'App Icons', Icon: AppWindow },
    ]
  },
];

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
  onCollapseChange?: (collapsed: boolean) => void;
  role?: string;
  adminName?: string;
}

export default function Sidebar({ active, onNavigate, onCollapseChange, role, adminName }: SidebarProps) {
  const P = useThemePalette();
  const [collapsed, setCollapsed] = useState(false);

  const handleCollapse = (newCollapsed: boolean) => {
    setCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  return (
    <aside style={{
      width: collapsed ? 72 : 260,
      minHeight: '100vh',
      background: P.sidebar,
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100,
      transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
      boxShadow: '4px 0 30px rgba(0,0,0,0.25)',
      overflowX: 'hidden',
    }}>
      {/* Logo area */}
      <div style={{
        padding: collapsed ? '20px 0' : '20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 12,
        minHeight: 74,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
          <div style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            overflow: 'hidden',
            flexShrink: 0,
            border: '2px solid rgba(255,255,255,0.15)',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Image src="/srv-logo.jpeg" alt="SRV Logo" width={46} height={46} style={{ objectFit: 'cover' }} loading="eager" priority />
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#FFFFFF', lineHeight: 1.2, whiteSpace: 'nowrap' }}>SRV Electricals</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>Admin Portal</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={() => handleCollapse(true)} style={{ 
            background: 'rgba(255,255,255,0.1)', 
            border: '1px solid rgba(255,255,255,0.2)', 
            borderRadius: 8, 
            width: 32, 
            height: 32, 
            cursor: 'pointer', 
            color: 'rgba(255,255,255,0.7)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flexShrink: 0,
            transition: 'all 0.2s ease'
          }}>
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Expand button for collapsed state - positioned below logo */}
      {collapsed && (
        <div style={{ 
          padding: '16px 0', 
          display: 'flex', 
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <button onClick={() => handleCollapse(false)} style={{ 
            background: 'rgba(255,255,255,0.1)', 
            border: '1px solid rgba(255,255,255,0.2)', 
            borderRadius: 8, 
            width: 36, 
            height: 36, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'rgba(255,255,255,0.8)', 
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
          }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav style={{ 
        padding: '10px 10px', 
        flex: 1, 
        overflowY: 'scroll', 
        overflowX: 'hidden',
        scrollbarWidth: 'none', /* Firefox */
        msOverflowStyle: 'none', /* IE and Edge */
        maxHeight: 'calc(100vh - 148px)', /* Logo height (74px) + User section height (74px) */
      }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', padding: '12px 10px 6px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {group.label}
              </div>
            )}
            {group.items.filter(item => {
              // These items only visible to super_admin
              if (['admin-settings', 'app-settings', 'app-page-controls', 'app-icons'].includes(item.id)) {
                return role === 'super_admin';
              }
              return true;
            }).map((item) => {
              const isActive = active === item.id;
              const { Icon } = item;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: collapsed ? '10px' : '10px 12px',
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: 2,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    background: isActive ? `linear-gradient(135deg, ${P.red}, ${P.redDark})` : 'transparent',
                    color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 13.5,
                    transition: 'all 0.18s ease',
                    boxShadow: isActive ? '0 4px 14px rgba(29,78,216,0.35)' : 'none',
                    whiteSpace: 'nowrap',
                  }}
onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'; }}
onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <Icon size={18} style={{ flexShrink: 0 }} />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
            {!collapsed && <div style={{ height: 4 }} />}
          </div>
        ))}
        {/* Extra padding at bottom to ensure user section is always visible */}
        <div style={{ height: 20 }} />
      </nav>

      {/* Bottom user */}
      <div style={{
        padding: collapsed ? '14px 10px' : '14px 20px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
        flexShrink: 0,
        background: P.sidebar, // Ensure it stays on top
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${P.red}, ${P.redDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>A</div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminName || 'Admin User'}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Staff'}</div>
          </div>
        )}
      </div>

      {/* CSS to hide scrollbar */}
      <style jsx>{`
        nav::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </aside>
  );
}
