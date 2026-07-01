'use client';
import { useState, useEffect, useRef } from 'react';
import { QrCode, Download, Eye, Trash2, Search, Filter, Calendar, Package, Copy, Check, Share2 } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { formatISTDateTime, formatISTDate, formatISTDateTimeFull } from '@/lib/dateIST';
import type { AdminRole } from '@/lib/types';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAppContext } from '@/lib/appContext';
import { qrCodeApi } from '@/lib/api';
import QRCodeLib from 'qrcode';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import { I } from '@/lib/iconMap';

interface QRCodesProps {
  role: AdminRole;
}

interface QRCodeItem {
  id: string;
  qrId: string;
  batchNo: string;
  productId: string;
  productSku?: string;
  productName: string;
  points: number;
  generatedDate: string;
  generatedBy: string;
  status: 'active' | 'used';
  usedDate?: string;
  usedBy?: string;
  lastScannedPhone?: string;
  lastScannedCode?: string;
  firstScan?: {
    userName?: string;
    phone?: string;
    code?: string;
    role?: string;
    scannedAt?: string;
    points?: number;
    pointsRedeemed?: number;
    pointsEarned?: number;
    walletBalanceAfter?: number | null;
    dealerId?: string;
    dealerName?: string;
    dealerPhone?: string;
    dealerCode?: string;
    productName?: string;
    location?: string;
  } | null;
  qrImage: string;
}

function LazyQrImage({ value, alt, size, borderColor, onClick }: { value: string; alt: string; size: number; borderColor: string; onClick?: () => void }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(size >= 200);
  const [src, setSrc] = useState('');

  useEffect(() => {
    if (visible || !hostRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '180px' });
    observer.observe(hostRef.current);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || src) return;
    let active = true;
    void QRCodeLib.toDataURL(value, { width: Math.max(300, size), margin: 2, color: { dark: '#000000', light: '#FFFFFF' }, errorCorrectionLevel: 'H' })
      .then(dataUrl => { if (active) setSrc(dataUrl); })
      .catch(() => { if (active) setSrc(''); });
    return () => { active = false; };
  }, [size, src, value, visible]);

  return <div ref={hostRef} onClick={onClick} style={{ width: size, height: size, borderRadius: 8, border: `2px solid ${borderColor}`, cursor: onClick ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', overflow: 'hidden' }}>
    {src ? <img src={src} alt={alt} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <QrCode size={Math.min(28, size / 2)} color="#94A3B8" />}
  </div>;
}

// Generate REAL scannable QR code
const generateRealQRCode = async (qrData: {
  qrId: string;
  productId: string;
  productName: string;
  points: number;
  batchNo: string;
  timestamp: number;
}): Promise<string> => {
  try {
    // Create data object to encode in QR
    const dataToEncode = JSON.stringify({
      id: qrData.qrId,
      product: qrData.productId,
      productName: qrData.productName,
      points: qrData.points,
      batch: qrData.batchNo,
      ts: qrData.timestamp,
      // Add signature for security (in production, use proper HMAC)
      sig: btoa(`${qrData.qrId}-${qrData.timestamp}`).substring(0, 16),
    });

    // Generate actual scannable QR code
    const qrDataUrl = await QRCodeLib.toDataURL(dataToEncode, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',  // Black pattern (standard QR)
        light: '#FFFFFF'  // White background
      },
      errorCorrectionLevel: 'H' // High error correction for better scanning
    });

    return qrDataUrl;
  } catch (err) {
    console.error('QR Code generation error:', err);
    // Fallback to placeholder
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }
};

export default function QRCodes({ role }: QRCodesProps) {
  const C = useThemePalette();
  const [qrCodes, setQRCodes] = useState<QRCodeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'used'>('all');
  const [selectedQR, setSelectedQR] = useState<QRCodeItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; qrId: string | null }>({ show: false, qrId: null });
  
  // -- Server-side pagination state ------------------------------------------
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 50;

  // -- Real stats (fetched separately — not page-limited) --------------------
  const [qrStats, setQrStats] = useState({ total: 0, active: 0, used: 0 });

  const loadStats = async () => {
    try {
      const stats = await qrCodeApi.getStats();
      setQrStats(stats);
    } catch (err) {
      console.error('Failed to load QR stats:', err);
    }
  };

  // Get auth context and load permissions from database
  const { auth } = useAppContext();
  const userPermissions = useUserPermissions(auth.adminId ?? undefined, role);
  const permissions = {
    canCreate: userPermissions.canCreateInModule('qr_codes'),
    canEdit: userPermissions.canEditInModule('qr_codes'),
    canDelete: userPermissions.canDeleteInModule('qr_codes'),
  };

  // Load QR codes from API and generate real QR images
  const loadQRCodes = async (page = currentPage) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        limit: String(PAGE_SIZE),
        page: String(page),
      };
      if (searchTerm) params.search = searchTerm;
      if (filterStatus !== 'all') params.status = filterStatus;

      const res = await qrCodeApi.getAll(params);
      const data: any[] = Array.isArray(res) ? res : (res as any).data ?? [];
      const total = Array.isArray(res) ? data.length : (res as any).total ?? data.length;
      setTotalCount(total);

      const qrCodesWithImages = data.map((qr: any) => {
          const codeStr = qr.code ?? qr.qrId ?? String(qr.id);
          const item: QRCodeItem = {
            id: String(qr.id),
            qrId: codeStr,
            batchNo: qr.batchId ?? qr.batchNo ?? qr.batch_no ?? '—',
            productId: qr.productId ?? qr.product_id ?? '—',
            productSku: qr.product?.sku ?? qr.productSku,
            productName: qr.productName ?? qr.product_name ?? qr.product?.name ?? '—',
            points: qr.points ?? qr.product?.points ?? 0,
            generatedDate: qr.createdAt ?? qr.generatedDate ?? new Date().toISOString(),
            generatedBy: qr.generatedBy ?? 'Admin',
            status: (qr.isScanned || qr.status === 'used') ? 'used' : 'active',
            usedDate: qr.lastScannedAt ?? qr.usedDate,
            usedBy: qr.lastScannedBy ?? qr.usedBy,
            lastScannedPhone: qr.lastScannedPhone,
            lastScannedCode: qr.lastScannedCode,
            qrImage: '',
          };
          return item;
        });
      setQRCodes(qrCodesWithImages);
    } catch (err) {
      console.error('Failed to load QR codes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when status changes immediately; debounce text search to avoid
  // hammering the multi-million-row QR table on every keystroke.
  useEffect(() => {
    setCurrentPage(1);
    loadQRCodes(1);
  }, [filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCurrentPage(1);
      loadQRCodes(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadStats(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredQRCodes = qrCodes; // server-side filtering

  const totalQRs = qrStats.total || totalCount;
  const activeQRs = qrStats.active;
  const usedQRs = qrStats.used;

  const handleDeleteQR = (qrId: string) => {
    setDeleteConfirm({ show: true, qrId });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.qrId) {
      try {
        await qrCodeApi.delete(deleteConfirm.qrId);
        setQRCodes(qrCodes.filter(q => q.id !== deleteConfirm.qrId));
      } catch (err) {
        console.error('Failed to delete QR code:', err);
      }
      setDeleteConfirm({ show: false, qrId: null });
    }
  };

  const handleDownloadQR = async (qr: QRCodeItem) => {
    const qrImage = qr.qrImage || await QRCodeLib.toDataURL(qr.qrId, { width: 600, margin: 2, errorCorrectionLevel: 'H' });
    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `${qr.qrId}.png`;
    link.click();
  };

  const handleShareQR = async (qr: QRCodeItem) => {
    const qrImage = qr.qrImage || await QRCodeLib.toDataURL(qr.qrId, { width: 600, margin: 2, errorCorrectionLevel: 'H' });
    const message = `SRV QR Code: ${qr.qrId}\nProduct: ${qr.productName}`;

    try {
      const imageResponse = await fetch(qrImage);
      const imageBlob = await imageResponse.blob();
      const imageFile = new File([imageBlob], `${qr.qrId}.png`, { type: imageBlob.type || 'image/png' });
      const shareData = { title: 'SRV QR Code', text: message, files: [imageFile] };

      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.warn('Native QR sharing is unavailable; using WhatsApp fallback.', error);
    }

    await handleDownloadQR(qr);
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${message}\nThe QR image has been downloaded. Please attach it to this WhatsApp message.`)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const copyQRId = (qrId: string) => {
    navigator.clipboard.writeText(qrId);
    setCopiedId(qrId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const STATUS_CONFIG = {
    active: { bg: '#D1FAE5', bgDark: 'rgba(16, 185, 129, 0.2)', color: '#10B981', label: 'Active' },
    used: { bg: '#FEF3C7', bgDark: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', label: 'Used' },
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.sidebar}, #1E293B)`, borderRadius: 20, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <QrCode size={28} />
            QR Code Management
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>View and manage all individual QR codes</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ textAlign: 'center', padding: '10px 20px', background: 'rgba(255,255,255,0.07)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#10B981' }}>{totalQRs}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Total</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 20px', background: 'rgba(16,185,129,0.2)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.3)' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#10B981' }}>{activeQRs}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Active</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 20px', background: 'rgba(245,158,11,0.2)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.3)' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#F59E0B' }}>{usedQRs}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Used</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: C.card, borderRadius: 16, padding: '20px 24px', marginBottom: 20, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
          <input
            type="text"
            placeholder="Search by QR ID, product name, or batch number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 40,
              paddingRight: 14,
              paddingTop: 10,
              paddingBottom: 10,
              border: `1.5px solid ${C.border}`,
              borderRadius: 10,
              fontSize: 13,
              outline: 'none',
              background: C.bg,
              color: C.text,
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} style={{ color: C.muted }} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            style={{
              padding: '10px 14px',
              border: `1.5px solid ${C.border}`,
              borderRadius: 10,
              fontSize: 13,
              outline: 'none',
              background: C.bg,
              color: C.text,
              cursor: 'pointer',
              minWidth: 140,
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="used">Used</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>QR Image</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>QR ID</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Product Name</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Batch No.</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Generate Date</th>
                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Points</th>
                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center', color: C.muted }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Loading QR codes...</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Please wait</div>
                  </td>
                </tr>
              )}
              {!loading && filteredQRCodes.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center', color: C.muted }}>
                    <QrCode size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    <div style={{ fontSize: 14, fontWeight: 600 }}>No QR codes found</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search or filters</div>
                  </td>
                </tr>
              )}
              {!loading && filteredQRCodes.map((qr, index) => (
                <tr 
                  key={qr.id} 
                  style={{ 
                    borderBottom: index < filteredQRCodes.length - 1 ? `1px solid ${C.border}` : 'none',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = C.bg}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                >
                  <td style={{ padding: '16px 20px' }}>
                    <LazyQrImage value={qr.qrId} alt={qr.qrId} size={60} borderColor={C.border} onClick={() => setSelectedQR(qr)} />
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: 'monospace' }}>
                        {qr.qrId}
                      </div>
                      <button
                        onClick={() => copyQRId(qr.qrId)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 4,
                          color: copiedId === qr.qrId ? '#10B981' : C.muted,
                        }}
                      >
                        {copiedId === qr.qrId ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: C.red + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.red }}>
                        <Package size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{qr.productName}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>SKU: {qr.productSku || qr.productId}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: 'monospace' }}>
                      {qr.batchNo}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>By {qr.generatedBy}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.text }}>
                      <Calendar size={14} style={{ color: C.muted }} />
                      {formatISTDate(qr.generatedDate)}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 4, 
                      background: '#FEF3C7', 
                      color: '#F59E0B', 
                      padding: '4px 10px', 
                      borderRadius: 20, 
                      fontSize: 12, 
                      fontWeight: 700 
                    }}>
                      {qr.points}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <span style={{
                      background: STATUS_CONFIG[qr.status].bg,
                      color: STATUS_CONFIG[qr.status].color,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '5px 12px',
                      borderRadius: 20,
                      display: 'inline-block',
                    }}>
                      {STATUS_CONFIG[qr.status].label}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button
                        onClick={() => setSelectedQR(qr)}
                        title="View Details"
                        style={{
                          background: C.red + '20',
                          color: C.red,
                          border: 'none',
                          borderRadius: 8,
                          width: 32,
                          height: 32,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDownloadQR(qr)}
                        title="Download QR"
                        style={{
                          background: '#D1FAE5',
                          color: '#10B981',
                          border: 'none',
                          borderRadius: 8,
                          width: 32,
                          height: 32,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleShareQR(qr)}
                        title="Share QR to WhatsApp"
                        style={{
                          background: '#DCFCE7',
                          color: '#16A34A',
                          border: 'none',
                          borderRadius: 8,
                          width: 32,
                          height: 32,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Share2 size={16} />
                      </button>
                      {permissions.canDelete && (
                        <button
                          onClick={() => handleDeleteQR(qr.id)}
                          title="Delete QR"
                          style={{
                            background: C.dangerBg,
                            color: C.dangerText,
                            border: 'none',
                            borderRadius: 8,
                            width: 32,
                            height: 32,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* -- Pagination ------------------------------------------------------- */}
      {totalCount > PAGE_SIZE && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: '12px 20px', background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, color: C.muted }}>
            Showing <strong style={{ color: C.text }}>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)}</strong> of <strong style={{ color: C.text }}>{totalCount.toLocaleString('en-IN')}</strong> QR codes
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => { const p = Math.max(1, currentPage - 1); setCurrentPage(p); loadQRCodes(p); }}
              disabled={currentPage === 1}
              style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: currentPage === 1 ? C.bg : C.card, color: currentPage === 1 ? C.muted : C.text, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
            >Prev</button>

            {/* Page number buttons */}
            {Array.from({ length: Math.min(7, Math.ceil(totalCount / PAGE_SIZE)) }, (_, i) => {
              const totalPages = Math.ceil(totalCount / PAGE_SIZE);
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => { setCurrentPage(pageNum); loadQRCodes(pageNum); }}
                  style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${currentPage === pageNum ? C.red : C.border}`, background: currentPage === pageNum ? C.red : C.card, color: currentPage === pageNum ? 'white' : C.text, cursor: 'pointer', fontSize: 13, fontWeight: currentPage === pageNum ? 700 : 500 }}
                >{pageNum}</button>
              );
            })}

            <button
              onClick={() => { const p = Math.min(Math.ceil(totalCount / PAGE_SIZE), currentPage + 1); setCurrentPage(p); loadQRCodes(p); }}
              disabled={currentPage >= Math.ceil(totalCount / PAGE_SIZE)}
              style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: currentPage >= Math.ceil(totalCount / PAGE_SIZE) ? C.bg : C.card, color: currentPage >= Math.ceil(totalCount / PAGE_SIZE) ? C.muted : C.text, cursor: currentPage >= Math.ceil(totalCount / PAGE_SIZE) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
            >Next</button>
          </div>
        </div>
      )}

      {/* QR Details Modal */}
      {selectedQR && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.6)', 
            backdropFilter: 'blur(8px)', 
            zIndex: 2000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: 20 
          }} 
          onClick={() => setSelectedQR(null)}
        >
          <div 
            style={{ 
              background: C.card, 
              borderRadius: 20, 
              padding: '32px', 
              width: 700, 
              maxWidth: '95vw', 
              boxShadow: '0 25px 70px rgba(0,0,0,0.3)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <QrCode size={24} style={{ color: C.red }} />
              QR Code Details
            </div>

            {/* QR Image */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}><LazyQrImage value={selectedQR.qrId} alt={selectedQR.qrId} size={250} borderColor={C.border} /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>QR ID</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: 'monospace' }}>{selectedQR.qrId}</div>
              </div>
              <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Batch Number</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: 'monospace' }}>{selectedQR.batchNo}</div>
              </div>
              <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Product</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{selectedQR.productName}</div>
              </div>
              <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Points</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F59E0B' }}>{selectedQR.points}</div>
              </div>
              <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Status</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: STATUS_CONFIG[selectedQR.status].color }}>{STATUS_CONFIG[selectedQR.status].label}</div>
              </div>
              <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Generated Date</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{formatISTDate(selectedQR.generatedDate)}</div>
              </div>
              <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Generated By</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{selectedQR.generatedBy}</div>
              </div>
              {(selectedQR.firstScan?.scannedAt || selectedQR.usedDate) && (
                <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>First Scan Date</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{formatISTDateTimeFull(selectedQR.firstScan?.scannedAt ?? selectedQR.usedDate!)}</div>
                </div>
              )}
              {(selectedQR.firstScan || selectedQR.usedBy || selectedQR.lastScannedPhone || selectedQR.lastScannedCode) && (
                <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>First Scanned By</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                    {selectedQR.firstScan?.userName ?? selectedQR.usedBy ?? 'Unknown'}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                    {[selectedQR.firstScan?.phone ?? selectedQR.lastScannedPhone, selectedQR.firstScan?.code ?? selectedQR.lastScannedCode, selectedQR.firstScan?.role].filter(Boolean).join(' / ')}
                  </div>
                </div>
              )}
              {selectedQR.firstScan?.dealerName && (
                <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Dealer</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{selectedQR.firstScan.dealerName}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                    {[selectedQR.firstScan.dealerPhone, selectedQR.firstScan.dealerCode].filter(Boolean).join(' / ')}
                  </div>
                </div>
              )}
              {selectedQR.firstScan && (
                <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>QR Points Redeemed</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#F59E0B' }}>{selectedQR.firstScan.pointsRedeemed ?? selectedQR.firstScan.pointsEarned ?? selectedQR.firstScan.points ?? selectedQR.points}</div>
                  {selectedQR.firstScan.location && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{selectedQR.firstScan.location}</div>}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => handleDownloadQR(selectedQR)}
                style={{
                  flex: 1,
                  background: C.red,
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Download size={16} />
                Download QR
              </button>
              <button
                onClick={() => handleShareQR(selectedQR)}
                style={{
                  flex: 1,
                  background: '#16A34A',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Share2 size={16} />
                Share
              </button>
              <button
                onClick={() => setSelectedQR(null)}
                style={{
                  flex: 1,
                  background: C.bg,
                  color: C.text,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: '12px',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        show={deleteConfirm.show}
        title="Delete QR Code"
        message="Are you sure you want to delete this QR code? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ show: false, qrId: null })}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}
