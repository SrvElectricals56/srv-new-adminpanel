'use client';
import { useEffect, useState } from 'react';
import {
  Calendar,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  Package,
  QrCode,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { formatISTDateTime, formatISTDate, formatISTDateTimeFull } from '@/lib/dateIST';
import type { AdminRole } from '@/lib/types';
import { useAppContext } from '@/lib/appContext';
import { productApi, qrCodeApi } from '@/lib/api';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import ExportModal from '@/components/Shared/ExportModal';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import AlertDialog from '@/components/Shared/AlertDialog';

interface QRHubProps {
  role: AdminRole;
}

interface QRBatch {
  id: string;
  batchId: string;
  batchNo: number | string | null;
  productId: string;
  productName: string;
  generatedDate: string;
  points: number;
  qty: number;
  activeQty?: number;
  usedQty?: number;
}

interface EditState {
  batch: QRBatch;
  productId: string;
  rewardPoints: string;
}

const PAGE_SIZE = 25;

export default function QRHub({ role }: QRHubProps) {
  const C = useThemePalette();
  const { auth } = useAppContext();
  const userPermissions = useUserPermissions(auth.adminId ?? undefined, role);
  const permissions = {
    canEdit: userPermissions.canEditInModule('qr_codes'),
    canDelete: userPermissions.canDeleteInModule('qr_codes'),
    canExport: userPermissions.canExportFromModule('qr_codes'),
  };

  const [batches, setBatches] = useState<QRBatch[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const productSkuMap = new Map(products.map((p: any) => [String(p.id), p.sku]));
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<QRBatch | null>(null);
  const [batchQrs, setBatchQrs] = useState<any[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; batchId: string | null }>({ show: false, batchId: null });
  const [showExport, setShowExport] = useState(false);
  const [exportTitle, setExportTitle] = useState('QR Hub');
  const [exportFileName, setExportFileName] = useState('qr-hub');
  const [exportRows, setExportRows] = useState<object[]>([]);
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({
    show: false,
    title: '',
    message: '',
    type: 'success',
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const mapBatch = (row: any): QRBatch => ({
    id: String(row.id ?? row.batchId ?? row.batchNo ?? ''),
    batchId: String(row.batchId ?? row.batchNo ?? row.id ?? ''),
    batchNo: row.batchNo ?? row.batchId ?? row.id ?? '-',
    productId: String(row.productId ?? ''),
    productName: row.productName ?? '-',
    generatedDate: row.generatedDate ?? row.createdAt ?? new Date().toISOString(),
    points: Number(row.points ?? row.rewardPoints ?? 0),
    qty: Number(row.qty ?? row.quantity ?? 0),
    activeQty: Number(row.activeQty ?? 0),
    usedQty: Number(row.usedQty ?? 0),
  });

  const getBatchLabel = (batch: QRBatch) => String(batch.batchNo ?? batch.batchId);
  const getRedeemerLabel = (qr: any) => {
    const details = [qr.lastScannedName, qr.lastScannedPhone, qr.lastScannedCode].filter(Boolean);
    return details.length ? details.join(' · ') : qr.lastScannedBy ?? '';
  };

  const loadHub = async (page = currentPage, search = searchTerm) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      };
      if (search.trim()) params.search = search.trim();
      const res = await qrCodeApi.getHub(params);
      const rows = Array.isArray(res) ? res : (res as any).data ?? [];
      setBatches(rows.map(mapBatch));
      setTotalCount(Array.isArray(res) ? rows.length : (res as any).total ?? rows.length);
    } catch (err: any) {
      setAlertDialog({ show: true, title: 'QR Hub Load Failed', message: err.message || 'Unable to load QR batches.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    productApi.getAll({ limit: '500' }).then(res => {
      setProducts(Array.isArray(res) ? res : (res as any).data ?? []);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCurrentPage(1);
      loadHub(1, searchTerm);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadHub(1, '');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getHubExportRows = (rows = batches) =>
    rows.map((batch, index) => ({
      Id: (currentPage - 1) * PAGE_SIZE + index + 1,
      'Product Name': batch.productName,
      'Batch No.': getBatchLabel(batch),
      'Generate Date': formatISTDateTime(batch.generatedDate),
      Point: batch.points,
      Qty: batch.qty,
    }));

  const getBatchExportRows = async (batch: QRBatch) => {
    const res = await qrCodeApi.getAll({ batchId: batch.batchId, limit: String(Math.max(batch.qty, 1)), page: '1' });
    const rows = Array.isArray(res) ? res : (res as any).data ?? [];
    return rows.map((qr: any, index: number) => ({
      Id: index + 1,
      'QR ID': qr.code ?? qr.qrId ?? qr.id,
      'Product Name': qr.productName ?? qr.product?.name ?? batch.productName,
      'Batch No.': qr.batchNo ?? qr.batchId ?? getBatchLabel(batch),
      'Generate Date': formatISTDateTime(qr.createdAt ?? batch.generatedDate),
      Point: qr.points ?? qr.rewardPoints ?? batch.points,
      Status: qr.isScanned ? 'Used' : 'Active',
      'Used By': getRedeemerLabel(qr),
      'Used Date': qr.lastScannedAt ? formatISTDateTime(qr.lastScannedAt) : '',
    }));
  };

  const openHubExport = () => {
    setExportTitle('QR Hub');
    setExportFileName('qr-hub');
    setExportRows(getHubExportRows());
    setShowExport(true);
  };

  const openBatchExport = async (batch: QRBatch) => {
    try {
      const rows = await getBatchExportRows(batch);
      setExportTitle(`QR Batch ${getBatchLabel(batch)}`);
      setExportFileName(`qr-batch-${getBatchLabel(batch)}`);
      setExportRows(rows);
      setShowExport(true);
    } catch (err: any) {
      setAlertDialog({ show: true, title: 'Export Failed', message: err.message || 'Unable to prepare batch export.', type: 'error' });
    }
  };

  const openDetails = async (batch: QRBatch) => {
    setSelectedBatch(batch);
    setDetailsLoading(true);
    try {
      const res = await qrCodeApi.getAll({ batchId: batch.batchId, limit: '100', page: '1' });
      setBatchQrs(Array.isArray(res) ? res : (res as any).data ?? []);
    } catch (err: any) {
      setAlertDialog({ show: true, title: 'Batch Details Failed', message: err.message || 'Unable to load batch details.', type: 'error' });
    } finally {
      setDetailsLoading(false);
    }
  };

  const openEdit = (batch: QRBatch) => {
    setEditState({
      batch,
      productId: batch.productId,
      rewardPoints: String(batch.points ?? 0),
    });
  };

  const saveBatch = async () => {
    if (!editState) return;
    setSaving(true);
    try {
      await qrCodeApi.updateBatch(editState.batch.batchId, {
        productId: editState.productId !== editState.batch.productId ? editState.productId : undefined,
        rewardPoints: Number(editState.rewardPoints || 0),
      });
      setAlertDialog({ show: true, title: 'QR Batch Updated', message: `Batch ${getBatchLabel(editState.batch)} updated successfully.`, type: 'success' });
      setEditState(null);
      await loadHub(currentPage, searchTerm);
    } catch (err: any) {
      setAlertDialog({ show: true, title: 'Update Failed', message: err.message || 'Unable to update QR batch.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.batchId) return;
    try {
      await qrCodeApi.deleteBatch(deleteConfirm.batchId);
      setAlertDialog({ show: true, title: 'QR Batch Deleted', message: 'Selected QR batch deleted successfully.', type: 'success' });
      await loadHub(currentPage, searchTerm);
    } catch (err: any) {
      setAlertDialog({ show: true, title: 'Delete Failed', message: err.message || 'Unable to delete QR batch.', type: 'error' });
    } finally {
      setDeleteConfirm({ show: false, batchId: null });
    }
  };

  const statCards = [
    { label: 'Batches', value: totalCount.toLocaleString('en-IN'), color: '#60A5FA' },
    { label: 'Visible Qty', value: batches.reduce((sum, batch) => sum + batch.qty, 0).toLocaleString('en-IN'), color: '#10B981' },
    { label: 'Used', value: batches.reduce((sum, batch) => sum + (batch.usedQty ?? 0), 0).toLocaleString('en-IN'), color: '#F59E0B' },
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <AlertDialog show={alertDialog.show} title={alertDialog.title} message={alertDialog.message} type={alertDialog.type} onClose={() => setAlertDialog({ ...alertDialog, show: false })} />

      <div style={{ background: `linear-gradient(135deg, ${C.sidebar}, #1E293B)`, borderRadius: 20, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', gap: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <QrCode size={28} />
            QR Hub
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>Batch-wise QR generation summary and exports</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {statCards.map(stat => (
            <div key={stat.label} style={{ textAlign: 'center', padding: '10px 18px', background: 'rgba(255,255,255,0.07)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', minWidth: 92 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.card, borderRadius: 16, padding: '18px 22px', marginBottom: 20, border: `1px solid ${C.border}`, display: 'flex', gap: 14, alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by product name or batch number..."
            style={{ width: '100%', padding: '10px 14px 10px 40px', border: `1.5px solid ${C.border}`, borderRadius: 10, outline: 'none', fontSize: 13, color: C.text, background: C.bg }}
          />
        </div>
        {permissions.canExport && (
          <button onClick={openHubExport} disabled={!batches.length} style={{ background: C.red, color: 'white', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: batches.length ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8, opacity: batches.length ? 1 : 0.6 }}>
            <FileSpreadsheet size={15} />
            Export
          </button>
        )}
      </div>

      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
                {['Id', 'Product Name', 'Batch No.', 'Generate Date', 'Point', 'Qty', 'Action'].map((head, index) => (
                  <th key={head} style={{ padding: '15px 18px', textAlign: index >= 4 ? 'center' : 'left', fontSize: 12, fontWeight: 800, color: C.muted, textTransform: 'uppercase' }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} style={{ padding: '54px 20px', textAlign: 'center', color: C.muted }}>
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 10 }} />
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Loading QR batches...</div>
                  </td>
                </tr>
              )}
              {!loading && batches.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '54px 20px', textAlign: 'center', color: C.muted }}>
                    <QrCode size={44} style={{ marginBottom: 12, opacity: 0.35 }} />
                    <div style={{ fontSize: 14, fontWeight: 700 }}>No QR batches found</div>
                  </td>
                </tr>
              )}
              {!loading && batches.map((batch, index) => (
                <tr key={batch.batchId} style={{ borderBottom: index < batches.length - 1 ? `1px solid ${C.border}` : 'none' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = C.bg}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                >
                  <td style={{ padding: '15px 18px', color: C.text, fontSize: 13, fontWeight: 800 }}>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                  <td style={{ padding: '15px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: C.red + '18', color: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{batch.productName}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>SKU: {productSkuMap.get(batch.productId) || batch.productId || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '15px 18px', color: C.text, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>{getBatchLabel(batch)}</td>
                  <td style={{ padding: '15px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.text, fontSize: 13 }}>
                      <Calendar size={14} style={{ color: C.muted }} />
                      {formatISTDate(batch.generatedDate)}
                    </div>
                  </td>
                  <td style={{ padding: '15px 18px', textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 54, padding: '5px 10px', borderRadius: 999, background: '#FEF3C7', color: '#B45309', fontSize: 12, fontWeight: 800 }}>{batch.points}</span>
                  </td>
                  <td style={{ padding: '15px 18px', textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 58, padding: '5px 10px', borderRadius: 999, background: '#D1FAE5', color: '#047857', fontSize: 12, fontWeight: 800 }}>{batch.qty}</span>
                  </td>
                  <td style={{ padding: '15px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                      {permissions.canExport && (
                        <button onClick={() => openBatchExport(batch)} title="Export Batch" style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#E0F2FE', color: '#0369A1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Download size={15} />
                        </button>
                      )}
                      <button onClick={() => openDetails(batch)} title="View Batch" style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: C.red + '18', color: C.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Eye size={15} />
                      </button>
                      {permissions.canEdit && (
                        <button onClick={() => openEdit(batch)} title="Edit Batch" style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#F5F3FF', color: '#7C3AED', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Edit3 size={15} />
                        </button>
                      )}
                      {permissions.canDelete && (
                        <button onClick={() => setDeleteConfirm({ show: true, batchId: batch.batchId })} title="Delete Batch" style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#FEE2E2', color: '#B91C1C', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={15} />
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

      {totalCount > PAGE_SIZE && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: '12px 18px', background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, color: C.muted }}>Showing <strong style={{ color: C.text }}>{(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, totalCount)}</strong> of <strong style={{ color: C.text }}>{totalCount.toLocaleString('en-IN')}</strong> batches</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => { const page = Math.max(1, currentPage - 1); setCurrentPage(page); loadHub(page, searchTerm); }} disabled={currentPage === 1} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: currentPage === 1 ? C.bg : C.card, color: currentPage === 1 ? C.muted : C.text, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 700 }}>Prev</button>
            <span style={{ fontSize: 13, color: C.muted }}>Page {currentPage} / {totalPages}</span>
            <button onClick={() => { const page = Math.min(totalPages, currentPage + 1); setCurrentPage(page); loadHub(page, searchTerm); }} disabled={currentPage >= totalPages} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: currentPage >= totalPages ? C.bg : C.card, color: currentPage >= totalPages ? C.muted : C.text, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', fontWeight: 700 }}>Next</button>
          </div>
        </div>
      )}

      {selectedBatch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedBatch(null)}>
          <div style={{ background: C.card, borderRadius: 18, width: 820, maxWidth: '96vw', maxHeight: '88vh', overflow: 'hidden', border: `1px solid ${C.border}`, boxShadow: '0 25px 70px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>Batch {getBatchLabel(selectedBatch)}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{selectedBatch.productName} | {selectedBatch.qty} QR codes | {selectedBatch.points} points</div>
              </div>
              <button onClick={() => setSelectedBatch(null)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 34, height: 34, cursor: 'pointer', color: C.muted }}>x</button>
            </div>
            <div style={{ padding: 20, overflowY: 'auto', maxHeight: 'calc(88vh - 78px)' }}>
              {detailsLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Loading batch QR codes...</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: C.bg }}>
                      {['QR ID', 'Status', 'Generated Date', 'Used By'].map(head => (
                        <th key={head} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, color: C.muted, textTransform: 'uppercase' }}>{head}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {batchQrs.map((qr: any) => (
                      <tr key={qr.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: C.text, fontFamily: 'monospace', fontWeight: 700 }}>{qr.code ?? qr.id}</td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: qr.isScanned ? '#B45309' : '#047857', fontWeight: 800 }}>{qr.isScanned ? 'Used' : 'Active'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: C.text }}>{formatISTDateTime(qr.createdAt ?? selectedBatch.generatedDate)}</td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: C.muted }}>
                          {getRedeemerLabel(qr) || '-'}
                        </td>
                      </tr>
                    ))}
                    {!batchQrs.length && (
                      <tr>
                        <td colSpan={4} style={{ padding: 30, textAlign: 'center', color: C.muted }}>No QR codes found in this batch.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {editState && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditState(null)}>
          <div style={{ background: C.card, borderRadius: 18, width: 480, maxWidth: '95vw', padding: 24, border: `1px solid ${C.border}`, boxShadow: '0 25px 70px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.text, marginBottom: 4 }}>Edit QR Batch</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Batch {getBatchLabel(editState.batch)} | {editState.batch.qty} QR codes</div>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 8 }}>Product Name</label>
            <select value={editState.productId} onChange={e => setEditState({ ...editState, productId: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, color: C.text, outline: 'none', marginBottom: 16 }}>
              {!products.some((product: any) => String(product.id) === editState.productId) && (
                <option value={editState.productId}>{editState.batch.productName}</option>
              )}
              {products.map((product: any) => (
                <option key={product.id} value={String(product.id)}>{product.name}</option>
              ))}
            </select>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 8 }}>Point</label>
            <input value={editState.rewardPoints} onChange={e => setEditState({ ...editState, rewardPoints: e.target.value.replace(/[^\d]/g, '') })} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, color: C.text, outline: 'none', marginBottom: 22 }} />

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setEditState(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
              <button onClick={saveBatch} disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: C.red, color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {saving && <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <ExportModal show={showExport} onClose={() => setShowExport(false)} title={exportTitle} fileName={exportFileName} getData={() => exportRows} />

      <ConfirmDialog
        show={deleteConfirm.show}
        title="Delete QR Batch"
        message="Are you sure you want to delete this QR batch? All QR codes in this batch will be removed."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ show: false, batchId: null })}
        confirmText="Delete"
        type="danger"
      />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
