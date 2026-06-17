'use client';
import { lazy, Suspense, useEffect, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { Search, Bell, LayoutDashboard, Activity, Bolt, Store, Package, Star, ScanLine, Gift, Tags, ChartColumn, ShieldCheck, AppWindow, UserCheck, Users, LogOut, FileSpreadsheet, Sun, Moon, QrCode, ArrowLeftRight, Percent, Image as ImageIcon, MessageCircle, FileText, ClipboardList, Play, Truck } from 'lucide-react';
import { useTheme, useThemePalette } from '@/lib/theme';
import { I } from '@/lib/iconMap';
import Sidebar from '@/components/Shared/Sidebar';
import Login from '@/components/Shared/Login';
import SrvLogoLoader from '@/components/Shared/SrvLogoLoader';
import { useAppContext } from '@/lib/appContext';
import type { AdminRole } from '@/lib/types';

// ── Lazy-loaded page chunks ────────────────────────────────────────────────────
// Each component is split into its own JS chunk and only downloaded when first visited.
const Dashboard          = lazy(() => import('@/components/Overview/Dashboard'));
const ProActiveInactiveHub = lazy(() => import('@/components/Overview/ProActiveInactiveHub'));
const ElectricianHub     = lazy(() => import('@/components/Electrician/ElectricianHub'));
const DealerHub          = lazy(() => import('@/components/Dealer/DealerHub'));
const AppUserHub         = lazy(() => import('@/components/AppUser/AppUserHub'));
const CounterBoyHub      = lazy(() => import('@/components/CounterBoy/CounterBoyHub'));
const Products           = lazy(() => import('@/components/Catalog/Products'));
const ProductCategories  = lazy(() => import('@/components/Catalog/ProductCategories'));
const QRHub              = lazy(() => import('@/components/QRManagement/QRHub'));
const QRCodes            = lazy(() => import('@/components/QRManagement/QRCodes'));
const QRCodeGenerator    = lazy(() => import('@/components/QRManagement/QRCodeGenerator'));
const GiftProducts       = lazy(() => import('@/components/GiftManagement/GiftProducts'));
const GiftOrders         = lazy(() => import('@/components/GiftManagement/GiftOrders'));
const ProductOrders      = lazy(() => import('@/components/Orders/ProductOrders'));
const DeliveryTracker    = lazy(() => import('@/components/Orders/DeliveryTracker'));
const NotificationsPage  = lazy(() => import('@/components/Engagement/Notifications'));
const Banners            = lazy(() => import('@/components/Content/Banners'));
const TransferPoints     = lazy(() => import('@/components/Financial/TransferPoints'));
const Commissions        = lazy(() => import('@/components/Financial/DealerBonus'));
const Referrals          = lazy(() => import('@/components/Engagement/Referrals'));
const Testimonials       = lazy(() => import('@/components/Content/Testimonials'));
const PrivacyPolicy      = lazy(() => import('@/components/Content/PrivacyPolicy'));
const UploadPlays        = lazy(() => import('@/components/Content/UploadPlays'));
const EnquirySupport     = lazy(() => import('@/components/Support/EnquirySupport'));
const AdminSettings      = lazy(() => import('@/components/System/AdminSettings'));
const AppSettings        = lazy(() => import('@/components/System/AppSettings'));
const AppPageControls    = lazy(() => import('@/components/System/AppPageControls'));
// Sections exports multiple named exports — wrap each individually
const PointsConfig       = lazy(() => import('@/components/System/Sections').then(m => ({ default: m.PointsConfig })));
const Reports            = lazy(() => import('@/components/System/Sections').then(m => ({ default: m.Reports })));
const ScanHistory        = lazy(() => import('@/components/System/Sections').then(m => ({ default: m.ScanHistory })));
const Redemptions        = lazy(() => import('@/components/System/Sections').then(m => ({ default: m.Redemptions })));

const preloadPageChunk = (id: string) => {
  switch (id) {
    case 'dashboard': return import('@/components/Overview/Dashboard');
    case 'pro-active-inactive': return import('@/components/Overview/ProActiveInactiveHub');
    case 'electricians': return import('@/components/Electrician/ElectricianHub');
    case 'dealers': return import('@/components/Dealer/DealerHub');
    case 'app-users': return import('@/components/AppUser/AppUserHub');
    case 'counterboys': return import('@/components/CounterBoy/CounterBoyHub');
    case 'products': return import('@/components/Catalog/Products');
    case 'product-categories': return import('@/components/Catalog/ProductCategories');
    case 'qr-hub': return import('@/components/QRManagement/QRHub');
    case 'qr-codes': return import('@/components/QRManagement/QRCodes');
    case 'qr-generator': return import('@/components/QRManagement/QRCodeGenerator');
    case 'gift-products': return import('@/components/GiftManagement/GiftProducts');
    case 'gift-orders': return import('@/components/GiftManagement/GiftOrders');
    case 'product-orders': return import('@/components/Orders/ProductOrders');
    case 'delivery-tracker': return import('@/components/Orders/DeliveryTracker');
    case 'notifications': return import('@/components/Engagement/Notifications');
    case 'banners': return import('@/components/Content/Banners');
    case 'transfer-points': return import('@/components/Financial/TransferPoints');
    case 'commissions': return import('@/components/Financial/DealerBonus');
    case 'referrals': return import('@/components/Engagement/Referrals');
    case 'testimonials': return import('@/components/Content/Testimonials');
    case 'privacy-policy': return import('@/components/Content/PrivacyPolicy');
    case 'upload-plays': return import('@/components/Content/UploadPlays');
    case 'enquiry-support': return import('@/components/Support/EnquirySupport');
    case 'admin-settings': return import('@/components/System/AdminSettings');
    case 'app-settings': return import('@/components/System/AppSettings');
    case 'app-page-controls': return import('@/components/System/AppPageControls');
    case 'points-config': return import('@/components/System/Sections');
    case 'reports': return import('@/components/System/Sections');
    case 'scans': return import('@/components/System/Sections');
    case 'redemptions': return import('@/components/System/Sections');
    default: return Promise.resolve();
  }
};

const DEFAULT_PRELOAD_PAGES = [
  'dashboard',
  'electricians',
  'dealers',
  'app-users',
  'counterboys',
  'products',
  'qr-hub',
  'qr-codes',
  'qr-generator',
  'gift-products',
  'gift-orders',
  'product-orders',
  'delivery-tracker',
  'transfer-points',
  'notifications',
  'reports',
];

const SESSION_TIMEOUT_MS = 20 * 60 * 1000;
const SESSION_ACTIVITY_KEY = 'srv_admin_last_activity';
const ADMIN_PAGE_STATE_KEY = 'srv_admin_current_page';

type AdminPageState = {
  active?: string;
  electricianSubPage?: string;
  dealerSubPage?: string;
  appUserSubPage?: string;
  counterBoySubPage?: string;
  productCategoryFilter?: string;
};

const readAdminPageState = (): AdminPageState => {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(ADMIN_PAGE_STATE_KEY) || '{}') as AdminPageState;
    return parsed.active && PAGE_LABELS[parsed.active] ? parsed : {};
  } catch {
    return {};
  }
};

// ── Skeleton shown while a chunk is downloading ────────────────────────────────
function PageSkeleton() {
  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header bar */}
      <div style={{ height: 36, width: '35%', borderRadius: 10, background: 'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      {/* Stat cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ height: 90, borderRadius: 16, background: 'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        ))}
      </div>
      {/* Table skeleton */}
      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <div style={{ height: 44, background: 'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        {[1,2,3,4,5,6].map(i => (
          <div key={i} style={{ height: 52, borderTop: '1px solid #e2e8f0', background: i % 2 === 0 ? '#f8fafc' : 'white', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', flexShrink: 0 }} />
            <div style={{ flex: 1, height: 14, borderRadius: 6, background: 'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            <div style={{ width: '15%', height: 14, borderRadius: 6, background: 'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            <div style={{ width: '10%', height: 14, borderRadius: 6, background: 'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
          </div>
        ))}
      </div>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}


const ROLE_CONFIG: Record<AdminRole, { label: string; Icon: React.ElementType; color: string }> = {
  super_admin: { label: 'Super Admin', Icon: ShieldCheck, color: '#1D4ED8' },
  admin: { label: 'Admin', Icon: UserCheck, color: '#7C3AED' },
  staff: { label: 'Staff', Icon: Users, color: '#0369A1' },
};

const PAGE_LABELS: Record<string, { title: string; Icon: React.ElementType }> = {
  dashboard: { title: 'Dashboard', Icon: LayoutDashboard },
  'pro-active-inactive': { title: 'Pro / Active / Inactive', Icon: Activity },
  electricians: { title: 'Electricians', Icon: Bolt },
  dealers: { title: 'Dealers', Icon: Store },
  'app-users': { title: 'Customers', Icon: Users },
  counterboys: { title: 'Counter Boys', Icon: UserCheck },
  products: { title: 'Products', Icon: Package },
  'product-categories': { title: 'Product Categories', Icon: Tags },
  'points-config': { title: 'Products Points', Icon: Star },
  'qr-hub': { title: 'QR Hub', Icon: QrCode },
  'qr-codes': { title: 'QR Codes', Icon: QrCode },
  'qr-generator': { title: 'QR Generator', Icon: QrCode },
  'gift-products': { title: 'Gift Products', Icon: Gift },
  'gift-orders': { title: 'Gift Orders', Icon: Gift },
  'product-orders': { title: 'Product Orders', Icon: Package },
  'delivery-tracker': { title: 'Delivery Tracker', Icon: Truck },
  'redemption-requests': { title: 'Redemption Requests', Icon: ClipboardList },
  'pending-registrations': { title: 'Pending Registrations', Icon: UserCheck },
  'notifications': { title: 'Notifications', Icon: Bell },
  'upload-plays': { title: 'Upload Plays', Icon: Play },
  'banners': { title: 'Banners', Icon: ImageIcon },
  'transfer-points': { title: 'Transfer Points', Icon: ArrowLeftRight },
  'commissions': { title: 'Dealer Bonus', Icon: Percent },
  'referrals': { title: 'Referrals', Icon: Users },
  'testimonials': { title: 'Testimonials', Icon: MessageCircle },
  'privacy-policy': { title: 'Privacy Policy', Icon: FileText },
  'enquiry-support': { title: 'Enquiry Support', Icon: MessageCircle },
  scans: { title: 'Scan History', Icon: ScanLine },
  redemptions: { title: 'Redemptions', Icon: Gift },
  reports: { title: 'Reports', Icon: ChartColumn },
  'app-page-controls': { title: 'App Page Controls', Icon: AppWindow },
};

const PAGE_SEARCH_KEYWORDS: Record<string, string[]> = {
  dashboard: ['dashboard', 'home', 'overview', 'stats', 'analytics'],
  electricians: ['electrician', 'technician', 'worker', 'installer'],
  dealers: ['dealer', 'distributor', 'retailer', 'seller'],
  products: ['product', 'item', 'catalog', 'inventory', 'stock'],
  'points-config': ['points', 'config', 'rewards'],
  'qr-hub': ['qr hub', 'batch qr', 'qr batch', 'batch', 'quantity'],
  'qr-codes': ['qr', 'qrcode', 'code', 'scan', 'barcode'],
  scans: ['scan', 'history', 'activity'],
  redemptions: ['redemption', 'redeem', 'pending', 'approve'],
  reports: ['report', 'analytics', 'data', 'export'],
};

export default function Home() {
  const { mode, toggleTheme } = useTheme();
  const P = useThemePalette();
  const { auth, logout, products, pointsConfig } = useAppContext();
  const [isPending, startTransition] = useTransition();
  const [initialPageState] = useState<AdminPageState>(() => readAdminPageState());
  const [active, setActive] = useState(initialPageState.active ?? 'dashboard');
  const [electricianSubPage, setElectricianSubPage] = useState<string | undefined>(initialPageState.electricianSubPage);
  const [dealerSubPage, setDealerSubPage] = useState<string | undefined>(initialPageState.dealerSubPage);
  const [appUserSubPage, setAppUserSubPage] = useState<string | undefined>(initialPageState.appUserSubPage);
  const [counterBoySubPage, setCounterBoySubPage] = useState<string | undefined>(initialPageState.counterBoySubPage);
  const [productCategoryFilter, setProductCategoryFilter] = useState<string | undefined>(initialPageState.productCategoryFilter);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [routeLoading, setRouteLoading] = useState(false);
  const routeLoadingTimeoutRef = useRef<number | null>(null);

  const loggedIn = auth.isLoggedIn;
  const role = auth.role;
  const adminName = auth.adminName;

  useEffect(() => {
    if (!loggedIn) return;

    let cancelled = false;
    const preload = () => {
      if (cancelled) return;
      DEFAULT_PRELOAD_PAGES.forEach(pageId => {
        void preloadPageChunk(pageId);
      });
    };

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const idleId = idleWindow.requestIdleCallback
      ? idleWindow.requestIdleCallback(preload)
      : window.setTimeout(preload, 600);

    return () => {
      cancelled = true;
      if (idleWindow.cancelIdleCallback && typeof idleId === 'number') {
        idleWindow.cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId);
      }
    };
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;

    let timeoutId = 0;
    let lastActivityWrite = 0;
    const markActivity = () => {
      const now = Date.now();
      if (now - lastActivityWrite > 5_000) {
        localStorage.setItem(SESSION_ACTIVITY_KEY, String(now));
        lastActivityWrite = now;
      }
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        logout();
        setActive('dashboard');
      }, SESSION_TIMEOUT_MS);
    };

    const checkSession = () => {
      const lastActivity = Number(localStorage.getItem(SESSION_ACTIVITY_KEY) || Date.now());
      if (Date.now() - lastActivity >= SESSION_TIMEOUT_MS) {
        logout();
        setActive('dashboard');
      }
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      'click',
      'keydown',
      'mousemove',
      'scroll',
      'touchstart',
      'focus',
    ];

    markActivity();
    const intervalId = window.setInterval(checkSession, 30_000);
    activityEvents.forEach(eventName => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      activityEvents.forEach(eventName => {
        window.removeEventListener(eventName, markActivity);
      });
    };
  }, [loggedIn, logout]);

  useEffect(() => {
    if (!loggedIn) return;
    localStorage.setItem(ADMIN_PAGE_STATE_KEY, JSON.stringify({
      active,
      electricianSubPage,
      dealerSubPage,
      appUserSubPage,
      counterBoySubPage,
      productCategoryFilter,
    }));
  }, [active, appUserSubPage, counterBoySubPage, dealerSubPage, electricianSubPage, loggedIn, productCategoryFilter]);

  useEffect(() => () => {
    if (routeLoadingTimeoutRef.current) {
      window.clearTimeout(routeLoadingTimeoutRef.current);
    }
  }, []);

  const showRouteLoader = () => {
    setRouteLoading(true);
    if (routeLoadingTimeoutRef.current) {
      window.clearTimeout(routeLoadingTimeoutRef.current);
    }
    routeLoadingTimeoutRef.current = window.setTimeout(() => {
      setRouteLoading(false);
      routeLoadingTimeoutRef.current = null;
    }, 650);
  };

  const handleLogin = (r: AdminRole, name?: string) => {
    // auth state is already set by appContext.login() — nothing extra needed
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    localStorage.removeItem(ADMIN_PAGE_STATE_KEY);
    setActive('dashboard');
    setShowLogoutModal(false);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleNavigate = (id: string, subPage?: string) => {
    void preloadPageChunk(id);
    if (id !== active || subPage) {
      showRouteLoader();
    }
    startTransition(() => {
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
      if (id === 'app-users' && subPage) {
        setAppUserSubPage(subPage);
      } else if (id === 'app-users') {
        setAppUserSubPage(undefined);
      }
      if (id === 'counterboys' && subPage) {
        setCounterBoySubPage(subPage);
      } else if (id === 'counterboys') {
        setCounterBoySubPage(undefined);
      }
      setGlobalSearch('');
    });
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
      let matchedPage = '';
      for (const [page, keywords] of Object.entries(PAGE_SEARCH_KEYWORDS)) {
        if (keywords.some(kw => kw.includes(q) || q.includes(kw))) { matchedPage = page; break; }
      }
      if (productMatches.length > 0) setActive('products');
      else if (pointsMatches.length > 0) setActive('points-config');
      else if (matchedPage) setActive(matchedPage);
    }
  };

  const getPageData = async () => {
    const dateTag = new Date().toISOString().slice(0, 10);
    switch (active) {
      case 'products': return { rows: products, sheet: 'Products', name: `products-${dateTag}` };
      case 'points-config': return { rows: pointsConfig, sheet: 'PointsConfig', name: `points-config-${dateTag}` };
      case 'reports': {
        // Fetch real analytics data for export
        try {
          const [dash, scans, users, revenue] = await Promise.all([
            import('@/lib/api').then(m => m.analyticsApi.getDashboard()).catch(() => null),
            import('@/lib/api').then(m => m.analyticsApi.getScanStats()).catch(() => null),
            import('@/lib/api').then(m => m.analyticsApi.getUserStats()).catch(() => null),
            import('@/lib/api').then(m => m.analyticsApi.getRevenueStats()).catch(() => null),
          ]);
          const rows = [
            { Metric: 'Total Electricians', Value: dash?.totalElectricians ?? '—', Period: dateTag },
            { Metric: 'Total Dealers', Value: dash?.totalDealers ?? '—', Period: dateTag },
            { Metric: 'Active Users', Value: dash?.activeUsers ?? '—', Period: dateTag },
            { Metric: 'Total Scans (7d)', Value: scans?.totalScans ?? '—', Period: dateTag },
            { Metric: 'Points Awarded', Value: dash?.totalPointsAwarded ?? '—', Period: dateTag },
            { Metric: 'Pending Redemptions', Value: dash?.pendingRedemptions ?? '—', Period: dateTag },
            { Metric: 'Total Redemptions', Value: dash?.totalRedemptions ?? '—', Period: dateTag },
            { Metric: 'Total Wallet Balance', Value: revenue?.totalWalletBalance ?? '—', Period: dateTag },
            { Metric: 'Total Redemption Amount', Value: revenue?.totalRedemptions ?? '—', Period: dateTag },
            { Metric: 'Growth Rate (%)', Value: dash?.growthRate ?? '—', Period: dateTag },
          ];
          return { rows, sheet: 'Reports', name: `reports-${dateTag}` };
        } catch {
          return { rows: [{ Metric: 'Error', Value: 'Could not fetch analytics data', Period: dateTag }], sheet: 'Reports', name: `reports-${dateTag}` };
        }
      }
      default: return null;
    }
  };

  const handleExport = async (format: 'excel' | 'csv' | 'pdf' | 'zip') => {
    const data = await getPageData();
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
      case 'pro-active-inactive': return <ProActiveInactiveHub />;
      case 'electricians': return <ElectricianHub role={role} defaultPage={electricianSubPage} onSubPageChange={(sp) => setElectricianSubPage(sp)} />;
      case 'dealers': return <DealerHub role={role} defaultPage={dealerSubPage} onSubPageChange={(sp) => setDealerSubPage(sp)} />;
      case 'app-users': return <AppUserHub key={`app-users-${appUserSubPage ?? 'users'}`} role={role} defaultPage={appUserSubPage} onSubPageChange={(sp) => setAppUserSubPage(sp)} />;
      case 'counterboys': return <CounterBoyHub key={`counterboys-${counterBoySubPage ?? 'counterboys'}`} role={role} defaultPage={counterBoySubPage} onSubPageChange={(sp) => setCounterBoySubPage(sp)} />;
      case 'products': return <Products role={role} initialCategory={productCategoryFilter} onCategoryUsed={() => setProductCategoryFilter(undefined)} />;
      case 'product-categories': return <ProductCategories role={role} onNavigate={(page, category) => {
        if (page === 'products') {
          setActive('products');
          if (category) setProductCategoryFilter(category);
        }
      }} />;
      case 'points-config': return <PointsConfig role={role} />;
      case 'qr-hub': return <QRHub role={role} />;
      case 'qr-codes': return <QRCodes role={role} />;
      case 'qr-generator': return <QRCodeGenerator role={role} />;
      case 'gift-products': return <GiftProducts role={role} />;
      case 'gift-orders': return <GiftOrders role={role} />;
      case 'product-orders': return <ProductOrders role={role} />;
      case 'delivery-tracker': return <DeliveryTracker role={role} />;
      case 'notifications': return <NotificationsPage role={role} />;
      case 'banners': return <Banners role={role} />;
      case 'transfer-points': return <TransferPoints role={role} />;
      case 'commissions': return <Commissions role={role} />;
      case 'referrals': return <Referrals role={role} />;
      case 'testimonials': return <Testimonials role={role} />;
      case 'upload-plays': return <UploadPlays role={role} />;
      case 'privacy-policy': return <PrivacyPolicy role={role} />;
      case 'enquiry-support': return <EnquirySupport />;
      case 'scans': return <ScanHistory />;
      case 'redemptions': return <Redemptions />;
      case 'reports': return <Reports />;
      case 'admin-settings': return role === 'super_admin' ? <AdminSettings /> : <Dashboard role={role} adminName={adminName} onNavigate={handleNavigate} />;
      case 'app-settings': return role === 'super_admin' ? <AppSettings role={role} /> : <Dashboard role={role} adminName={adminName} onNavigate={handleNavigate} />;
      case 'app-page-controls': return role === 'super_admin' ? <AppPageControls role={role} /> : <Dashboard role={role} adminName={adminName} onNavigate={handleNavigate} />;

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
                          { page: 'dashboard', label: 'Dashboard', icon: 'BarChart3', desc: 'Overview & analytics' },
                          { page: 'electricians', label: 'Electricians', icon: 'Bolt', desc: 'Manage electricians' },
                          { page: 'dealers', label: 'Dealers', icon: 'Store', desc: 'Manage dealers' },
                          { page: 'products', label: 'Products', icon: 'Package', desc: 'Product catalog' },
                          { page: 'qr-codes', label: 'QR Codes', icon: 'Smartphone', desc: 'QR management' },
                          { page: 'reports', label: 'Reports', icon: 'ChartLine', desc: 'Analytics & reports' },
                          { page: 'enquiry-support', label: 'Enquiry Support', icon: 'MessageCircle', desc: 'Customer support' },
                          { page: 'notifications', label: 'Notifications', icon: 'Bell', desc: 'Send notifications' },
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
                    icon: 'FileText',
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
                    icon: 'Package',
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
                    icon: 'Star',
                    action: () => { setShowSearchModal(false); setActive('points-config'); }
                  });
                });

                if (results.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>?</div>
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
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}><I name={item.icon} size={20} /></div>
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
                { key: 'excel', label: 'Excel', desc: '.xlsx spreadsheet', icon: 'BarChart3', color: '#065F46', bg: '#D1FAE5', bdr: '#6EE7B7' },
                { key: 'csv', label: 'CSV', desc: 'Comma separated values', icon: 'FileText', color: '#0369A1', bg: '#E0F2FE', bdr: '#7DD3FC' },
                { key: 'pdf', label: 'PDF', desc: 'Printable document', icon: 'FileText', color: '#B91C1C', bg: '#FEE2E2', bdr: '#FCA5A5' },
                { key: 'zip', label: 'ZIP', desc: 'Excel + CSV bundled', icon: 'Archive', color: '#7C3AED', bg: '#F5F3FF', bdr: '#C4B5FD' },
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
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{exporting === opt.key ? <I name='Loader' size={24} /> : <I name={opt.icon} size={24} />}</div>
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

      <Sidebar active={active} onNavigate={handleNavigate} onPreload={(id) => { void preloadPageChunk(id); }} onCollapseChange={setSidebarCollapsed} role={role} adminName={adminName} />
      {(isPending || routeLoading) && <SrvLogoLoader overlay label={`Opening ${PAGE_LABELS[active]?.title ?? 'section'}...`} />}
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
            {active !== 'dashboard' && ['products', 'points-config', 'reports'].includes(active) && (
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
          <Suspense fallback={<SrvLogoLoader label="Loading SRV section..." />}>
            {renderPage()}
          </Suspense>
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
