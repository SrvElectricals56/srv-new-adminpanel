'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Search, Bell, LayoutDashboard, Zap, Store, Package, Star, ScanLine, Gift, Tag, BarChart2, Shield, Smartphone, UserCheck, Users, LogOut, FileSpreadsheet, Sun, Moon, QrCode, ArrowLeftRight, Percent, Image as ImageIcon, MessageSquare, FileText, Megaphone, ClipboardList } from 'lucide-react';
import { useTheme, useThemePalette } from '@/lib/theme';
import Sidebar from '@/components/Shared/Sidebar';
import Dashboard from '@/components/Overview/Dashboard';
import ElectricianHub from '@/components/Electrician/ElectricianHub';
import DealerHub from '@/components/Dealer/DealerHub';
import Products from '@/components/Catalog/Products';
import ProductCategories from '@/components/Catalog/ProductCategories';
import QRCodes from '@/components/QRManagement/QRCodes';
import QRCodeGenerator from '@/components/QRManagement/QRCodeGenerator';
import GiftProducts from '@/components/GiftManagement/GiftProducts';
import GiftOrders from '@/components/GiftManagement/GiftOrders';
import NotificationsPage from '@/components/Engagement/Notifications';
import Banners from '@/components/Content/Banners';
import TransferPoints from '@/components/Financial/TransferPoints';
import Commissions from '@/components/Financial/DealerBonus';
import Referrals from '@/components/Engagement/Referrals';
import Testimonials from '@/components/Content/Testimonials';
import PrivacyPolicy from '@/components/Content/PrivacyPolicy';
import PromoSection from '@/components/Content/PromoSection';
import EnquirySupport from '@/components/Support/EnquirySupport';
import Login from '@/components/Shared/Login';
import { PointsConfig, Reports, ScanHistory, Redemptions } from '@/components/System/Sections';
import AdminSettings from '@/components/System/AdminSettings';
import AppSettings from '@/components/System/AppSettings';
import { exportRowsToExcel } from '@/lib/excel';
import { useAppContext } from '@/lib/appContext';

import type { AdminRole } from '@/lib/types';


const ROLE_CONFIG: Record<AdminRole, { label: string; Icon: React.ElementType; color: string }> = {
  super_admin: { label: 'Super Admin', Icon: Shield, color: '#1D4ED8' },
  admin: { label: 'Admin', Icon: UserCheck, color: '#7C3AED' },
  staff: { label: 'Staff', Icon: Users, color: '#0369A1' },
};

const PAGE_LABELS: Record<string, { title: string; Icon: React.ElementType }> = {
  dashboard: { title: 'Dashboard', Icon: LayoutDashboard },
  electricians: { title: 'Electricians', Icon: Zap },
  dealers: { title: 'Dealers', Icon: Store },
  products: { title: 'Products', Icon: Package },
  'product-categories': { title: 'Product Categories', Icon: Tag },
  'points-config': { title: 'Products Points', Icon: Star },
  'qr-codes': { title: 'QR Codes', Icon: QrCode },
  'qr-generator': { title: 'QR Generator', Icon: QrCode },
  'gift-products': { title: 'Gift Products', Icon: Gift },
  'gift-orders': { title: 'Gift Orders', Icon: Gift },
  'redemption-requests': { title: 'Redemption Requests', Icon: ClipboardList },
  'pending-registrations': { title: 'Pending Registrations', Icon: UserCheck },
  'notifications': { title: 'Notifications', Icon: Bell },
  'banners': { title: 'Banners', Icon: ImageIcon },
  'transfer-points': { title: 'Transfer Points', Icon: ArrowLeftRight },
  'commissions': { title: 'Dealer Bonus', Icon: Percent },
  'referrals': { title: 'Referrals', Icon: Users },
  'testimonials': { title: 'Testimonials', Icon: MessageSquare },
  'privacy-policy': { title: 'Privacy Policy', Icon: FileText },
  'promo-section': { title: 'Promo Section', Icon: Megaphone },
  'enquiry-support': { title: 'Enquiry Support', Icon: MessageSquare },
  scans: { title: 'Scan History', Icon: ScanLine },
  redemptions: { title: 'Redemptions', Icon: Gift },
  reports: { title: 'Reports', Icon: BarChart2 },
  };

export default function Home() {
  const { mode, toggleTheme } = useTheme();
  const P = useThemePalette();
  const { auth, logout, products, pointsConfig } = useAppContext();
  const [active, setActive] = useState('dashboard');
  const [electricianSubPage, setElectricianSubPage] = useState<string | undefined>(undefined);
  const [dealerSubPage, setDealerSubPage] = useState<string | undefined>(undefined);
  const [productCategoryFilter, setProductCategoryFilter] = useState<string | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loggedIn = auth.isLoggedIn;
  const role = auth.role;
  const adminName = auth.adminName;

  const handleLogin = (r: AdminRole, name?: string) => {
    // auth state is already set by appContext.login() — nothing extra needed
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    setActive('dashboard');
    setShowLogoutModal(false);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleNavigate = (id: string, subPage?: string) => {
    setActive(id);
    if (id === 'electricians' && subPage) {
      setElectricianSubPage(subPage);
    } else if (id === 'electricians') {
      setElectricianSubPage(undefined);
    }
    if (id === 'dealers' && subPage) {
      setDealerSubPage(subPage);
    } else if (id === 'dealers') {
      setDealerSubPage(undefined);
    }
    setGlobalSearch('');
  };

  const handleGlobalSearch = (query: string) => {
    setGlobalSearch(query);
    if (query.length > 2) {
      const q = query.toLowerCase().trim();
      const productMatches = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sub.toLowerCase().includes(q)
      );
      const pointsMatches = pointsConfig.filter(pc =>
        pc.productName.toLowerCase().includes(q)
      );
      const pageKeywords: Record<string, string[]> = {
        'dashboard': ['dashboard', 'home', 'overview', 'stats', 'analytics'],
        'electricians': ['electrician', 'technician', 'worker', 'installer'],
        'dealers': ['dealer', 'distributor', 'retailer', 'seller'],
        'products': ['product', 'item', 'catalog', 'inventory', 'stock'],
        'points-config': ['points', 'config', 'rewards'],
        'qr-codes': ['qr', 'qrcode', 'code', 'scan', 'barcode'],
        'scans': ['scan', 'history', 'activity'],
        'redemptions': ['redemption', 'redeem', 'pending', 'approve'],
        'reports': ['report', 'analytics', 'data', 'export'],
      };
      let matchedPage = '';
      for (const [page, keywords] of Object.entries(pageKeywords)) {
        if (keywords.some(kw => kw.includes(q) || q.includes(kw))) { matchedPage = page; break; }
      }
      if (productMatches.length > 0) setActive('products');
      else if (pointsMatches.length > 0) setActive('points-config');
      else if (matchedPage) setActive(matchedPage);
    }
  };

  const getPageData = () => {
    const dateTag = new Date().toISOString().slice(0, 10);
    switch (active) {
      case 'products': return { rows: products, sheet: 'Products', name: `products-${dateTag}` };
      case 'points-config': return { rows: pointsConfig, sheet: 'PointsConfig', name: `points-config-${dateTag}` };
      case 'reports': return { rows: [
        { metric: 'Total Revenue', value: '₹28.4L', trend: '+18.4%' },
        { metric: 'Total Scans', value: '2,394', trend: '+24.1%' },
        { metric: 'Points Awarded', value: '4,85,200', trend: '+31.2%' },
        { metric: 'New Electricians', value: '84', trend: '+12.5%' },
        { metric: 'Redemptions', value: '₹12.6L', trend: '+8.3%' },
        { metric: 'Avg Points/User', value: '378', trend: '-2.1%' },
      ], sheet: 'Reports', name: `reports-${dateTag}` };
      default: return null;
    }
  };

  const handleExport = async (format: 'excel' | 'csv' | 'pdf' | 'zip') => {
    const data = getPageData();
    if (!data) return;
    setExporting(format);

    try {
      if (format === 'excel') {
        const XLSX = await import('xlsx');
        if (!data.rows.length) return;
        const keys = Object.keys(data.rows[0]);
        const wsData = [keys, ...data.rows.map((r: any) => keys.map(k => r[k] ?? ''))];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = keys.map(() => ({ wch: 20 }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, data.sheet);
        XLSX.writeFile(wb, `${data.name}.xlsx`);

      } else if (format === 'csv') {
        const escapeCSV = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const keys = Object.keys(data.rows[0] || {});
        const header = keys.map(escapeCSV).join(',');
        const rows = data.rows.map((r: any) => keys.map((k: string) => escapeCSV(r[k])).join(','));
        const csv = '\uFEFF' + [header, ...rows].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${data.name}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);

      } else if (format === 'pdf') {
        const jsPDFModule = await import('jspdf');
        const jsPDF = jsPDFModule.default || (jsPDFModule as any).jsPDF;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const keys = Object.keys(data.rows[0] || {}).slice(0, 8);
        const colW = 260 / keys.length;
        let y = 20;
        // Header
        doc.setFontSize(14); doc.setFont('helvetica', 'bold');
        doc.text(`${data.sheet} Export`, 14, 14);
        doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        keys.forEach((k, i) => doc.text(String(k).toUpperCase(), 14 + i * colW, y));
        y += 6;
        doc.setDrawColor(200); doc.line(14, y, 280, y); y += 4;
        // Rows
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
        data.rows.forEach((r: any) => {
          if (y > 190) { doc.addPage(); y = 20; }
          keys.forEach((k, i) => {
            const val = String(r[k] ?? '').substring(0, 22);
            doc.text(val, 14 + i * colW, y);
          });
          y += 6;
        });
        doc.save(`${data.name}.pdf`);

      } else if (format === 'zip') {
        const [JSZipModule, XLSX] = await Promise.all([
          import('jszip').then(m => m.default),
          import('xlsx'),
        ]);
        const zip = new JSZipModule();
        const keys = Object.keys(data.rows[0] || {});
        const wsData = [keys, ...data.rows.map((r: any) => keys.map((k: string) => r[k] ?? ''))];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = keys.map(() => ({ wch: 20 }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, data.sheet);
        const excelBuf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        zip.file(`${data.name}.xlsx`, excelBuf);
        const escapeZip = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const zipHeader = keys.map(escapeZip).join(',');
        const csvRows = data.rows.map((r: any) => keys.map((k: string) => escapeZip(r[k])).join(','));
        zip.file(`${data.name}.csv`, '\uFEFF' + [zipHeader, ...csvRows].join('\r\n'));
        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${data.name}.zip`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export error:', err);
    }
    setExporting(null);
    setShowExportModal(false);
  };

  if (!loggedIn) return <Login onLogin={handleLogin} />;

  const roleInfo = ROLE_CONFIG[role];

  const renderPage = () => {
    switch (active) {
      case 'dashboard': return <Dashboard role={role} adminName={adminName} onNavigate={handleNavigate} />;
      case 'electricians': return <ElectricianHub role={role} defaultPage={electricianSubPage} onSubPageChange={(sp) => setElectricianSubPage(sp)} />;
      case 'dealers': return <DealerHub role={role} defaultPage={dealerSubPage} onSubPageChange={(sp) => setDealerSubPage(sp)} />;
      case 'products': return <Products role={role} initialCategory={productCategoryFilter} onCategoryUsed={() => setProductCategoryFilter(undefined)} />;
      case 'product-categories': return <ProductCategories onNavigate={(page, category) => {
        if (page === 'products') {
          setActive('products');
          if (category) setProductCategoryFilter(category);
        }
      }} />;
      case 'points-config': return <PointsConfig />;
      case 'qr-codes': return <QRCodes role={role} />;
      case 'qr-generator': return <QRCodeGenerator role={role} />;
      case 'gift-products': return <GiftProducts />;
      case 'gift-orders': return <GiftOrders />;
      case 'notifications': return <NotificationsPage />;
      case 'banners': return <Banners />;
      case 'transfer-points': return <TransferPoints />;
      case 'commissions': return <Commissions />;
      case 'referrals': return <Referrals />;
      case 'testimonials': return <Testimonials />;
      case 'privacy-policy': return <PrivacyPolicy />;
      case 'promo-section': return <PromoSection />;
      case 'enquiry-support': return <EnquirySupport />;
      case 'scans': return <ScanHistory />;
      case 'redemptions': return <Redemptions />;
      case 'reports': return <Reports />;
      case 'admin-settings': return <AdminSettings />;
      case 'app-settings': return <AppSettings />;
      default: return <Dashboard role={role} adminName={adminName} onNavigate={handleNavigate} />;
    }
  };

  const page = PAGE_LABELS[active];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: P.bg }}>
      {/* Search Modal */}
      {showSearchModal && (
        <div style={{ position: 'fixed', inset: 0, background: mode === 'dark' ? 'rgba(0,0,0,0.75)' : 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '80px 20px 20px', overflowY: 'auto' }} onClick={() => setShowSearchModal(false)}>
          <div style={{ background: P.modalBg, borderRadius: 20, padding: '0', width: 700, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.3)', animation: 'modalSlideIn 0.3s cubic-bezier(0.16,1,0.3,1)', border: `1px solid ${P.border}`, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            {/* Header with Search */}
            <div style={{ padding: '24px 28px', borderBottom: `1px solid ${P.border}`, position: 'sticky', top: 0, background: P.modalBg, borderRadius: '20px 20px 0 0', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #FEE2E2, #FECACA)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #FCA5A5' }}>
                  <Search size={22} color="#DC2626" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: P.text }}>Search Admin Panel</div>
                  <div style={{ fontSize: 12, color: P.modalMuted }}>Search across all pages, users, products & more</div>
                </div>
                <button onClick={() => setShowSearchModal(false)} style={{ background: P.bg, border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: P.muted }}>✕</button>
              </div>
              
              {/* Search Input */}
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: P.muted, pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Type to search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Escape') {
                      setShowSearchModal(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    paddingLeft: 42,
                    paddingRight: searchQuery ? 42 : 14,
                    paddingTop: 12,
                    paddingBottom: 12,
                    border: `2px solid ${searchQuery ? P.red : P.border}`,
                    borderRadius: 12,
                    fontSize: 14,
                    outline: 'none',
                    background: P.surface,
                    color: P.text,
                    transition: 'all 0.2s ease'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: P.bg,
                      border: 'none',
                      cursor: 'pointer',
                      color: P.muted,
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Search Results */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
              {(() => {
                const query = searchQuery.toLowerCase().trim();
                
                if (!query) {
                  // Show quick access when no search
                  return (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: P.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Access</div>
                      <div style={{ display: 'grid', gap: 8 }}>
                        {[
                          { page: 'dashboard', label: 'Dashboard', icon: '📊', desc: 'Overview & analytics' },
                          { page: 'electricians', label: 'Electricians', icon: '⚡', desc: 'Manage electricians' },
                          { page: 'dealers', label: 'Dealers', icon: '🏬', desc: 'Manage dealers' },
                          { page: 'products', label: 'Products', icon: '📦', desc: 'Product catalog' },
                          { page: 'qr-codes', label: 'QR Codes', icon: '📱', desc: 'QR management' },
                          { page: 'reports', label: 'Reports', icon: '📈', desc: 'Analytics & reports' },
                          { page: 'enquiry-support', label: 'Enquiry Support', icon: '💬', desc: 'Customer support' },
                          { page: 'notifications', label: 'Notifications', icon: '🔔', desc: 'Send notifications' },
                        ].map(item => (
                          <button
                            key={item.page}
                            onClick={() => { setShowSearchModal(false); setActive(item.page); }}
                            style={{
                              background: P.surface,
                              border: `1px solid ${P.border}`,
                              borderRadius: 10,
                              padding: '12px 14px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLButtonElement).style.background = P.bg;
                              (e.currentTarget as HTMLButtonElement).style.borderColor = P.red;
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLButtonElement).style.background = P.surface;
                              (e.currentTarget as HTMLButtonElement).style.borderColor = P.border;
                            }}
                          >
                            <div style={{ fontSize: 24 }}>{item.icon}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: P.text }}>{item.label}</div>
                              <div style={{ fontSize: 11, color: P.modalMuted }}>{item.desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }

                // Search logic
                const results: Array<{ type: string; title: string; subtitle: string; icon: string; action: () => void }> = [];

                // Search pages
                const pageMatches = Object.entries(PAGE_LABELS).filter(([key, val]) => 
                  val.title.toLowerCase().includes(query) || key.toLowerCase().includes(query)
                );
                pageMatches.forEach(([key, val]) => {
                  results.push({
                    type: 'Page',
                    title: val.title,
                    subtitle: `Navigate to ${val.title}`,
                    icon: '📄',
                    action: () => { setShowSearchModal(false); setActive(key); }
                  });
                });

                // Search products
                const productMatches = products.filter(p =>
                  p.name.toLowerCase().includes(query) ||
                  p.category.toLowerCase().includes(query) ||
                  p.sub.toLowerCase().includes(query)
                ).slice(0, 5);
                productMatches.forEach(p => {
                  results.push({
                    type: 'Product',
                    title: p.name,
                    subtitle: `${p.category} • ${p.sub}`,
                    icon: '📦',
                    action: () => { setShowSearchModal(false); setActive('products'); }
                  });
                });

                // Search points config
                const pointsMatches = pointsConfig.filter(pc =>
                  pc.productName.toLowerCase().includes(query) ||
                  pc.productId.toLowerCase().includes(query)
                ).slice(0, 3);
                pointsMatches.forEach(pc => {
                  results.push({
                    type: 'Points Config',
                    title: pc.productName,
                    subtitle: `${pc.productId} • ${pc.basePoints + pc.bonusPoints} points`,
                    icon: '⭐',
                    action: () => { setShowSearchModal(false); setActive('points-config'); }
                  });
                });

                if (results.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: P.text, marginBottom: 6 }}>No results found</div>
                      <div style={{ fontSize: 13, color: P.modalMuted }}>Try searching for pages, users, products, or features</div>
                    </div>
                  );
                }

                // Group results by type
                const grouped = results.reduce((acc, item) => {
                  if (!acc[item.type]) acc[item.type] = [];
                  acc[item.type].push(item);
                  return acc;
                }, {} as Record<string, typeof results>);

                return (
                  <div>
                    {Object.entries(grouped).map(([type, items]) => (
                      <div key={type} style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: P.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {type} ({items.length})
                        </div>
                        <div style={{ display: 'grid', gap: 6 }}>
                          {items.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={item.action}
                              style={{
                                background: P.surface,
                                border: `1px solid ${P.border}`,
                                borderRadius: 10,
                                padding: '10px 12px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = P.bg;
                                (e.currentTarget as HTMLButtonElement).style.borderColor = P.red;
                                (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(4px)';
                              }}
                              onMouseLeave={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = P.surface;
                                (e.currentTarget as HTMLButtonElement).style.borderColor = P.border;
                                (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(0)';
                              }}
                            >
                              <div style={{ fontSize: 20 }}>{item.icon}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: P.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                                <div style={{ fontSize: 11, color: P.modalMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subtitle}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 28px', borderTop: `1px solid ${P.border}`, background: P.surface, borderRadius: '0 0 20px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: P.modalMuted }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span><kbd style={{ background: P.bg, padding: '2px 6px', borderRadius: 4, border: `1px solid ${P.border}`, fontFamily: 'monospace' }}>ESC</kbd> to close</span>
                  <span><kbd style={{ background: P.bg, padding: '2px 6px', borderRadius: 4, border: `1px solid ${P.border}`, fontFamily: 'monospace' }}>↑↓</kbd> to navigate</span>
                </div>
                <div style={{ fontWeight: 600 }}>
                  {searchQuery ? `${(() => {
                    const q = searchQuery.toLowerCase().trim();
                    let count = 0;
                    count += Object.entries(PAGE_LABELS).filter(([k, v]) => v.title.toLowerCase().includes(q) || k.toLowerCase().includes(q)).length;
                    count += products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q)).slice(0, 5).length;
                    count += pointsConfig.filter(pc => pc.productName.toLowerCase().includes(q) || pc.productId.toLowerCase().includes(q)).slice(0, 3).length;
                    return count;
                  })()} results` : '8 quick links'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div style={{ position: 'fixed', inset: 0, background: mode === 'dark' ? 'rgba(0,0,0,0.75)' : 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowExportModal(false)}>
          <div style={{ background: P.modalBg, borderRadius: 20, padding: '32px', width: 460, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.3)', animation: 'modalSlideIn 0.3s cubic-bezier(0.16,1,0.3,1)', border: `1px solid ${P.border}` }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '3px solid #6EE7B7' }}>
                <FileSpreadsheet size={28} color="#065F46" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: P.text, marginBottom: 6 }}>Export Data</div>
              <div style={{ fontSize: 13, color: P.modalMuted }}>
                Exporting: <strong>{
                  active === 'electricians' ? (electricianSubPage === 'top' ? 'Top Electricians' : 'All Electricians') :
                  active === 'dealers' ? (dealerSubPage === 'top' ? 'Top Dealers' : 'All Dealers') :
                  PAGE_LABELS[active]?.title
                }</strong> — Choose format
              </div>
            </div>

            {/* Format Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {[
                { key: 'excel', label: 'Excel', desc: '.xlsx spreadsheet', icon: '📊', color: '#065F46', bg: '#D1FAE5', bdr: '#6EE7B7' },
                { key: 'csv', label: 'CSV', desc: 'Comma separated values', icon: '📄', color: '#0369A1', bg: '#E0F2FE', bdr: '#7DD3FC' },
                { key: 'pdf', label: 'PDF', desc: 'Printable document', icon: '📋', color: '#B91C1C', bg: '#FEE2E2', bdr: '#FCA5A5' },
                { key: 'zip', label: 'ZIP', desc: 'Excel + CSV bundled', icon: '🗜️', color: '#7C3AED', bg: '#F5F3FF', bdr: '#C4B5FD' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => handleExport(opt.key as any)}
                  disabled={exporting !== null}
                  style={{
                    background: exporting === opt.key ? opt.bg : P.surface,
                    border: `2px solid ${exporting === opt.key ? opt.bdr : P.border}`,
                    borderRadius: 14, padding: '16px', cursor: exporting ? 'not-allowed' : 'pointer',
                    textAlign: 'left', transition: 'all 0.2s', opacity: exporting && exporting !== opt.key ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (!exporting) { (e.currentTarget as HTMLButtonElement).style.background = opt.bg; (e.currentTarget as HTMLButtonElement).style.borderColor = opt.bdr; } }}
                  onMouseLeave={e => { if (!exporting) { (e.currentTarget as HTMLButtonElement).style.background = P.surface; (e.currentTarget as HTMLButtonElement).style.borderColor = P.border; } }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{exporting === opt.key ? '⏳' : opt.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: exporting === opt.key ? opt.color : P.text }}>{exporting === opt.key ? 'Exporting...' : opt.label}</div>
                  <div style={{ fontSize: 11, color: P.modalMuted, marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>

            <button onClick={() => setShowExportModal(false)} style={{ width: '100%', background: P.bg, color: P.muted, border: `1.5px solid ${P.border}`, borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: mode === 'dark' ? 'rgba(0,0,0,0.75)' : 'rgba(15,23,42,0.6)', 
          backdropFilter: 'blur(8px)', 
          zIndex: 2000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: 20 
        }} onClick={cancelLogout}>
          <div style={{ 
            background: P.modalBg, 
            borderRadius: 20, 
            padding: '32px', 
            width: 420, 
            maxWidth: '95vw', 
            boxShadow: '0 25px 70px rgba(0,0,0,0.3)',
            animation: 'modalSlideIn 0.3s cubic-bezier(0.16,1,0.3,1)',
            border: `1px solid ${P.border}`
          }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ 
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #FEE2E2, #FECACA)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px',
                border: '3px solid #FCA5A5'
              }}>
                <LogOut size={28} color="#DC2626" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: P.text, marginBottom: 8 }}>Confirm Logout</div>
              <div style={{ fontSize: 14, color: P.modalMuted, lineHeight: 1.5 }}>
                Are you sure you want to logout from your {roleInfo.label} session?
              </div>
            </div>

            {/* User Info */}
            <div style={{ 
              background: P.surface, 
              borderRadius: 12, 
              padding: '16px', 
              marginBottom: 24,
              border: `1px solid ${P.border}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: '50%', 
                  background: `linear-gradient(135deg, ${roleInfo.color}, ${roleInfo.color}cc)`, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white' 
                }}>
                  <roleInfo.Icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: P.text }}>Admin User</div>
                  <div style={{ fontSize: 12, color: P.modalMuted }}>{roleInfo.label} • SRV Electricals</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={cancelLogout}
                style={{ 
                  flex: 1, 
                  background: P.bg, 
                  color: P.muted, 
                  border: `1.5px solid ${P.border}`, 
                  borderRadius: 12, 
                  padding: '12px', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = P.surface;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = P.border;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = P.bg;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = P.border;
                }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                style={{ 
                  flex: 1, 
                  background: 'linear-gradient(135deg, #DC2626, #B91C1C)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 12, 
                  padding: '12px', 
                  fontSize: 14, 
                  fontWeight: 700, 
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(220,38,38,0.4)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(220,38,38,0.3)';
                }}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar active={active} onNavigate={handleNavigate} onCollapseChange={setSidebarCollapsed} role={role} adminName={adminName} />
      <div style={{ 
        marginLeft: sidebarCollapsed ? 72 : 260, 
        flex: 1, 
        minHeight: '100vh', 
        background: P.bg, 
        display: 'flex',
        flexDirection: 'column', 
        transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)', 
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}>
        {/* Topbar */}
        <div style={{
          height: 64,
          background: P.topbar,
          borderBottom: `1px solid ${P.topbarBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: P.shadow,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: P.crumb }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, overflow: 'hidden', border: `1px solid ${P.border}` }}>
                <Image src="/srv-logo.jpeg" alt="SRV" width={28} height={28} style={{ objectFit: 'cover' }} loading="eager" />
              </div>
              <span>SRV Admin</span>
            </div>
            <span style={{ color: P.border }}>›</span>
            {page && (
              <span style={{ color: P.crumbActive, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <page.Icon size={16} style={{ color: P.red }} />
                {page.title}
                {globalSearch && (
                  <span style={{ 
                    background: P.red + '20', 
                    color: P.red, 
                    fontSize: 11, 
                    fontWeight: 600, 
                    padding: '2px 8px', 
                    borderRadius: 12, 
                    marginLeft: 8 
                  }}>
                    Searching: "{globalSearch}"
                  </span>
                )}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {active !== 'dashboard' && getPageData() && (
              <button
                onClick={() => setShowExportModal(true)}
                style={{
                  background: P.accentSoft,
                  border: `1.5px solid ${P.accentSoftBorder}`,
                  borderRadius: 10,
                  height: 38,
                  padding: '0 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: P.accentText,
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                <FileSpreadsheet size={15} />
                Export
              </button>
            )}
            {/* Universal Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: P.muted, pointerEvents: 'none' }} />
              <input 
                placeholder="Search anything... (users, products, pages)" 
                value={globalSearch}
                onChange={e => handleGlobalSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleGlobalSearch((e.target as HTMLInputElement).value);
                  }
                  if (e.key === 'Escape') {
                    setGlobalSearch('');
                  }
                }}
                style={{
                  paddingLeft: 32, paddingRight: globalSearch ? 32 : 14, paddingTop: 8, paddingBottom: 8,
                  border: `1.5px solid ${globalSearch ? P.red : P.border}`, borderRadius: 10, fontSize: 13,
                  outline: 'none', width: 280, background: P.surface, color: P.text,
                  transition: 'all 0.2s ease'
                }}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = P.red}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = globalSearch ? P.red : P.border}
              />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: P.muted,
                    padding: 2,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search button - opens search modal */}
            <button onClick={() => { setShowSearchModal(true); setSearchQuery(''); }} style={{ position: 'relative', background: P.surface, border: `1.5px solid ${P.border}`, borderRadius: 10, width: 38, height: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.muted }}>
              <Search size={18} />
            </button>

            {/* Light / dark mode */}
            <button
              type="button"
              onClick={toggleTheme}
              title={mode === 'dark' ? 'Light mode' : 'Dark mode'}
              style={{
                background: P.surface,
                border: `1.5px solid ${P.border}`,
                borderRadius: 10,
                width: 38,
                height: 38,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: P.muted,
              }}
            >
              {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Admin avatar + logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', padding: '6px 12px', borderRadius: 10, border: `1.5px solid ${P.border}`, background: P.surface }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, ${roleInfo.color}, ${roleInfo.color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 12 }}>
                <roleInfo.Icon size={14} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: P.text, lineHeight: 1.2 }}>{adminName || 'Admin'}</div>
                <div style={{ fontSize: 10, color: P.crumb }}>{roleInfo.label}</div>
              </div>
            </div>
            <button onClick={handleLogout} title="Logout" style={{ background: P.dangerBg, border: `1.5px solid ${P.dangerBorder}`, borderRadius: 10, width: 38, height: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.dangerText }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Page content */}
        <div key={active} style={{ flex: 1, animation: 'fadeInUp 0.3s ease' }}>
          {renderPage()}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${P.scrollbarTrack}; }
        ::-webkit-scrollbar-thumb { background: ${P.scrollbarThumb}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${P.muted}; }
        input:focus, select:focus, textarea:focus { border-color: ${P.red} !important; box-shadow: 0 0 0 3px ${P.focusRing}; }
        button:active { transform: scale(0.97); }
      `}</style>
    </div>
  );
}
