'use client';
import { useState, useEffect } from 'react';
import { QrCode, Download, Eye, Trash2, Search, Filter, Calendar, Package, Copy, Check } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import type { AdminRole } from '@/lib/types';
import { getPermissions } from '@/lib/permissions';
import { qrCodeApi } from '@/lib/api';
import QRCodeLib from 'qrcode';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';

interface QRCodesProps {
  role: AdminRole;
}

interface QRCodeItem {
  id: string;
  qrId: string;
  batchNo: string;
  productId: string;
  productName: string;
  points: number;
  generatedDate: string;
  generatedBy: string;
  status: 'active' | 'used';
  usedDate?: string;
  usedBy?: string;
  qrImage: string;
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
  const permissions = getPermissions(role);

  // Load QR codes from API and generate real QR images
  useEffect(() => {
    const loadQRCodes = async () => {
      setLoading(true);
      try {
        const res = await qrCodeApi.getAll({ limit: '200' });
        const data: any[] = Array.isArray(res) ? res : (res as any).data ?? [];

        const qrCodesWithImages = await Promise.all(
          data.map(async (qr: any) => {
            // Use backend-saved qrImageUrl directly, regenerate only if missing
            let qrImage = qr.qrImageUrl ?? qr.qr_image_url ?? '';
            if (!qrImage) {
              const code = qr.code ?? qr.qrId ?? String(qr.id);
              qrImage = await QRCodeLib.toDataURL(code, {
                width: 300, margin: 2,
                color: { dark: '#000000', light: '#FFFFFF' },
                errorCorrectionLevel: 'H',
              }).catch(() => '');
            }

            const item: QRCodeItem = {
              id: String(qr.id),
              qrId: qr.code ?? qr.qrId ?? qr.qr_id ?? String(qr.id),
              batchNo: qr.batchId ?? qr.batchNo ?? qr.batch_no ?? '—',
              productId: qr.productId ?? qr.product_id ?? '—',
              productName: qr.productName ?? qr.product_name ?? qr.product?.name ?? '—',
              points: qr.product?.points ?? qr.points ?? 0,
              generatedDate: qr.createdAt ?? qr.generatedDate ?? new Date().toISOString(),
              generatedBy: qr.generatedBy ?? 'Admin',
              status: (qr.isScanned || qr.status === 'used') ? 'used' : 'active',
              usedDate: qr.lastScannedAt ?? qr.usedDate,
              usedBy: qr.lastScannedBy ?? qr.usedBy,
              qrImage,
            };

            return item;
          })
        );

        setQRCodes(qrCodesWithImages);
      } catch (err) {
        console.error('Failed to load QR codes:', err);
      } finally {
        setLoading(false);
      }
    };

    loadQRCodes();
  }, []);

  const filteredQRCodes = qrCodes.filter(qr => {
    const matchesSearch = 
      qr.qrId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qr.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qr.batchNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || qr.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalQRs = qrCodes.length;
  const activeQRs = qrCodes.filter(q => q.status === 'active').length;
  const usedQRs = qrCodes.filter(q => q.status === 'used').length;

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

  const handleDownloadQR = (qr: QRCodeItem) => {
    const link = document.createElement('a');
    link.href = qr.qrImage;
    link.download = `${qr.qrId}.svg`;
    link.click();
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
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Generating real QR codes...</div>
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
                    <img 
                      src={qr.qrImage} 
                      alt={qr.qrId}
                      style={{ width: 60, height: 60, borderRadius: 8, border: `2px solid ${C.border}`, cursor: 'pointer' }}
                      onClick={() => setSelectedQR(qr)}
                    />
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
                        <div style={{ fontSize: 11, color: C.muted }}>SKU: {qr.productId}</div>
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
                      {new Date(qr.generatedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                      ⚡ {qr.points}
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
              <img 
                src={selectedQR.qrImage} 
                alt={selectedQR.qrId}
                style={{ width: 250, height: 250, borderRadius: 12, border: `3px solid ${C.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
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
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F59E0B' }}>⚡ {selectedQR.points}</div>
              </div>
              <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Status</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: STATUS_CONFIG[selectedQR.status].color }}>{STATUS_CONFIG[selectedQR.status].label}</div>
              </div>
              <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Generated Date</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{new Date(selectedQR.generatedDate).toLocaleDateString('en-IN')}</div>
              </div>
              <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Generated By</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{selectedQR.generatedBy}</div>
              </div>
              {selectedQR.usedDate && (
                <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Used Date</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{new Date(selectedQR.usedDate).toLocaleDateString('en-IN')}</div>
                </div>
              )}
              {selectedQR.usedBy && (
                <div style={{ background: C.bg, borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Used By</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{selectedQR.usedBy}</div>
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
