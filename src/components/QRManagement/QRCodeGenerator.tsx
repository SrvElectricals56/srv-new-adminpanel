'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { QrCode, Download, RefreshCw, Bolt, Package, Gift, Copy, Check, FileText, FileSpreadsheet, Archive, Search, X } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { formatISTDateTime, formatISTDate, formatISTDateTimeFull } from '@/lib/dateIST';
import type { AdminRole } from '@/lib/types';
import { productApi, qrCodeApi } from '@/lib/api';
import AlertDialog from '@/components/Shared/AlertDialog';

let qrCodeLibraryPromise: Promise<typeof import('qrcode')> | null = null;
const loadQrCodeLibrary = () => {
  if (!qrCodeLibraryPromise) qrCodeLibraryPromise = import('qrcode');
  return qrCodeLibraryPromise;
};

interface QRCodeGeneratorProps {
  role: AdminRole;
}

interface GeneratedQR {
  id: string;
  productId: string;
  productName: string;
  points: number;
  qrData: string; // base64 image
  generatedAt: string;
  status: 'active' | 'used';
}

export default function QRCodeGenerator({ role }: QRCodeGeneratorProps) {
  const C = useThemePalette();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductResults, setShowProductResults] = useState(false);
  const productSearchRef = useRef<HTMLDivElement>(null);
  const [qrCount, setQrCount] = useState<string | number>(1);
  const [generatedQRs, setGeneratedQRs] = useState<GeneratedQR[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [qrStats, setQrStats] = useState({ total: 0, scanned: 0, active: 0 });
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'error' });
  const canGenerateQr = role === 'super_admin' || role === 'admin' || role === 'staff';

  useEffect(() => {
    let mounted = true;
    qrCodeApi.getStats().then((stats) => {
      if (!mounted) return;
      setQrStats({
        total: Number(stats.total ?? 0),
        scanned: Number(stats.scanned ?? stats.used ?? 0),
        active: Number(stats.active ?? 0),
      });
    }).catch((error) => {
      console.error(error);
      if (mounted) setAlertDialog({ show: true, title: 'QR Data Load Failed', message: error?.message || 'Unable to load QR generator data.', type: 'error' });
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const loadProducts = useCallback(async () => {
    if (productsLoaded || productsLoading) return;
    setProductsLoading(true);
    try {
      const response = await productApi.getAll({ limit: '1000', page: '1' });
      setProducts(Array.isArray(response) ? response : (response as any).data ?? []);
      setProductsLoaded(true);
    } catch (error: any) {
      console.error(error);
      setAlertDialog({ show: true, title: 'Product Load Failed', message: error?.message || 'Unable to load products.', type: 'error' });
    } finally {
      setProductsLoading(false);
    }
  }, [productsLoaded, productsLoading]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (productSearchRef.current && !productSearchRef.current.contains(event.target as Node)) {
        setShowProductResults(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('touchstart', closeOnOutsideClick);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('touchstart', closeOnOutsideClick);
    };
  }, []);

  const activeProducts = useMemo(() => products, [products]);

  const matchingProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return activeProducts;
    return activeProducts.filter((product: any) =>
      [product.name, product.sku, product.category]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(query)),
    );
  }, [activeProducts, productSearch]);

  const count = typeof qrCount === 'string' ? parseInt(qrCount) || 1 : qrCount;

  const generateQRCode = async () => {
    if (!selectedProduct || !canGenerateQr) return;
    const product = products.find((p: any) => String(p.id) === selectedProduct || p.sku === selectedProduct);
    if (!product) return;

    setGenerating(true);
    setProgress(10);

    try {
      // Call backend — saves all QR codes to database, returns code strings
      const result = await qrCodeApi.generate({
        productId: product.id,
        quantity: count,
        batchId: `BATCH-${Date.now().toString(36).toUpperCase()}`,
      });

      setProgress(60);

      const codes: any[] = (result as any).codes ?? [];
      const total = codes.length;
      setQrStats(previous => ({
        total: previous.total + total,
        scanned: previous.scanned,
        active: previous.active + total,
      }));

      // For large batches: store only metadata (no QR images yet — generate on demand)
      // Keep the generator responsive: render only small batches immediately.
      // Every code remains available in CSV/Excel/PDF/ZIP downloads.
      const PREVIEW_LIMIT = 40;
      const BATCH = 50;
      const newQRs: GeneratedQR[] = [];

      if (total <= PREVIEW_LIMIT) {
        const QRCodeLib = await loadQrCodeLibrary();
        // Small batch — generate all images for preview
        for (let i = 0; i < total; i += BATCH) {
          const slice = codes.slice(i, i + BATCH);
          const batch = await Promise.all(
            slice.map(async (qr: any) => {
              const codeStr = qr.code ?? String(qr.id);
              const qrData = await QRCodeLib.toDataURL(codeStr, {
                width: 200, margin: 1,
                color: { dark: '#000000', light: '#FFFFFF' },
                errorCorrectionLevel: 'M',
              }).catch(() => '');
              return {
                id: codeStr,
                productId: product.sku || product.id,
                productName: product.name,
                points: product.points,
                qrData,
                generatedAt: qr.createdAt || new Date().toISOString(),
                status: 'active' as const,
              };
            })
          );
          newQRs.push(...batch);
          setProgress(60 + Math.round(((i + BATCH) / total) * 35));
        }
      } else {
        // Large batch — store codes without images (images generated on download)
        for (const qr of codes) {
          const codeStr = qr.code ?? String(qr.id);
          newQRs.push({
            id: codeStr,
            productId: product.sku || product.id,
            productName: product.name,
            points: product.points,
            qrData: '', // empty — will be generated on download
            generatedAt: qr.createdAt || new Date().toISOString(),
            status: 'active' as const,
          });
        }
      }

      setProgress(100);
      setGeneratedQRs(prev => [...newQRs, ...prev]);
      setAlertDialog({
        show: true,
        title: 'QR Codes Generated',
        message: `${count} QR codes for "${product.name}" saved to database successfully.${total > PREVIEW_LIMIT ? ' Download to get QR images.' : ''}`,
        type: 'success',
      });
    } catch (err: any) {
      setAlertDialog({ show: true, title: 'Generation Failed', message: err.message || 'Failed to generate QR codes', type: 'error' });
    }

    setGenerating(false);
    setProgress(0);
  };

  const recordQrDownload = async (qrs: GeneratedQR[], downloadType: string) => {
    const first = qrs[0];
    if (!first) return;
    try {
      await qrCodeApi.recordDownloadHistory({
        productId: first.productId,
        productName: first.productName,
        quantity: qrs.length,
        downloadType,
      });
    } catch (error) {
      console.warn('Failed to record QR download history:', error);
    }
  };

  const downloadSingle = async (qr: GeneratedQR) => {
    const link = document.createElement('a');
    link.href = qr.qrData;
    link.download = `${qr.id}.png`;
    link.click();
    await recordQrDownload([qr], 'single_png');
  };

  const copyQRData = (qr: GeneratedQR) => {
    navigator.clipboard.writeText(qr.id);
    setCopiedId(qr.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Helper: ensure QR image exists, generate if missing ──────────
  const ensureQrData = async (qr: GeneratedQR): Promise<string> => {
    if (qr.qrData) return qr.qrData;
    const QRCodeLib = await loadQrCodeLibrary();
    return QRCodeLib.toDataURL(qr.id, {
      width: 300, margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
    }).catch(() => '');
  };

  const resolveAllQrData = async (
    qrs: GeneratedQR[],
    onProgress?: (pct: number) => void,
  ): Promise<GeneratedQR[]> => {
    const CHUNK = 100;
    const result: GeneratedQR[] = [];
    for (let i = 0; i < qrs.length; i += CHUNK) {
      const slice = qrs.slice(i, i + CHUNK);
      const resolved = await Promise.all(slice.map(async (q) => ({
        ...q, qrData: await ensureQrData(q),
      })));
      result.push(...resolved);
      onProgress?.(Math.round(((i + CHUNK) / qrs.length) * 100));
    }
    return result;
  };

  // ── Download All as ZIP (PNG images + Excel) ──────────────────────
  const downloadZip = async () => {
    if (!generatedQRs.length) return;
    setDownloading('zip');
    try {
      const [JSZipModule, XLSX] = await Promise.all([
        import('jszip').then(m => m.default),
        import('xlsx'),
      ]);

      const zip = new JSZipModule();

      // Resolve QR images (generate missing ones)
      const resolved = await resolveAllQrData(generatedQRs);

      // 1. Images folder
      const imgFolder = zip.folder('QR_Images')!;
      resolved.forEach(qr => {
        const base64 = qr.qrData.replace(/^data:image\/\w+;base64,/, '');
        if (base64) imgFolder.file(`${qr.id}.png`, base64, { base64: true });
      });

      // 2. Excel file inside zip
      const wsData = [
        ['QR ID', 'Product Name', 'SKU Code', 'Points', 'Generated At', 'Status'],
        ...resolved.map(q => [
          q.id,
          q.productName,
          q.productId,
          q.points,
          formatISTDateTime(q.generatedAt),
          q.status,
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 36 }, { wch: 28 }, { wch: 18 },
        { wch: 8 },  { wch: 22 }, { wch: 10 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'QR Codes');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      zip.file('QR_Codes_Data.xlsx', excelBuffer);

      // 3. Generate and download zip
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR_Codes_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      await recordQrDownload(generatedQRs, 'zip');
    } catch (err) {
      console.error('ZIP error:', err);
      setAlertDialog({ show: true, title: 'Download Failed', message: 'ZIP download failed. Try fewer QR codes.', type: 'error' });
    }
    setDownloading(null);
  };

  // ── Download All as CSV ────────────────────────────────────────────
  const downloadCSV = () => {
    if (!generatedQRs.length) return;
    setDownloading('csv');
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const header = ['QR ID', 'Product Name', 'SKU Code', 'Points', 'Generated At', 'Status'].map(escape).join(',');
    const rows = generatedQRs.map(q =>
      [q.id, q.productName, q.productId, q.points, formatISTDateTime(q.generatedAt), q.status].map(escape).join(',')
    );
    const csv = '\uFEFF' + [header, ...rows].join('\r\n'); // BOM for Excel UTF-8
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_Codes_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    void recordQrDownload(generatedQRs, 'csv');
    setDownloading(null);
  };

  // ── Download All as Excel using xlsx library ───────────────────────
  const downloadExcel = async () => {
    if (!generatedQRs.length) return;
    setDownloading('excel');
    try {
      const XLSX = await import('xlsx');
      const wsData = [
        ['QR ID', 'Product Name', 'SKU Code', 'Points', 'Generated At', 'Status'],
        ...generatedQRs.map(q => [
          q.id,
          q.productName,
          q.productId,
          q.points,
          formatISTDateTime(q.generatedAt),
          q.status,
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      // Set column widths
      ws['!cols'] = [
        { wch: 36 }, // QR ID
        { wch: 28 }, // Product Name
        { wch: 18 }, // Product ID
        { wch: 8 },  // Points
        { wch: 22 }, // Generated At
        { wch: 10 }, // Status
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'QR Codes');
      XLSX.writeFile(wb, `QR_Codes_${Date.now()}.xlsx`);
      await recordQrDownload(generatedQRs, 'excel');
    } catch (err) {
      console.error('Excel error:', err);
    }
    setDownloading(null);
  };

  // ── Download All as PDF ────────────────────────────────────────────
  const downloadPDF = async () => {
    if (!generatedQRs.length) return;
    setDownloading('pdf');
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const COLS = 4;
      const ROWS = 5;
      const marginX = 8;
      const marginY = 10;
      const pageW = 210;
      const pageH = 297;
      const cellW = (pageW - marginX * 2) / COLS;
      const cellH = (pageH - marginY * 2) / ROWS;
      const imgSize = cellW - 8;

      let idx = 0;
      for (let i = 0; i < generatedQRs.length; i++) {
        if (i > 0 && i % (COLS * ROWS) === 0) {
          doc.addPage();
          idx = 0;
        }
        const col = idx % COLS;
        const row = Math.floor(idx / COLS);
        const x = marginX + col * cellW + 4;
        const y = marginY + row * cellH + 2;
        const qr = generatedQRs[i];

        if (qr.qrData && qr.qrData.startsWith('data:image')) {
          try {
            doc.addImage(qr.qrData, 'PNG', x, y, imgSize, imgSize);
          } catch { /* skip broken image */ }
        }

        doc.setFontSize(5.5);
        doc.setTextColor(80, 80, 80);
        const shortId = qr.id.length > 28 ? qr.id.substring(0, 28) + '…' : qr.id;
        doc.text(shortId, x, y + imgSize + 3.5);

        doc.setFontSize(6);
        doc.setTextColor(40, 40, 40);
        const label = `${qr.productName} | ${qr.points}pts`;
        const shortLabel = label.length > 26 ? label.substring(0, 26) + '…' : label;
        doc.text(shortLabel, x, y + imgSize + 7);

        idx++;
      }

      doc.save(`QR_Codes_${Date.now()}.pdf`);
      await recordQrDownload(generatedQRs, 'pdf');
    } catch (err) {
      console.error('PDF error:', err);
      setAlertDialog({ show: true, title: 'PDF Generation Failed', message: 'PDF generation failed. Please try again.', type: 'error' });
    }
    setDownloading(null);
  };

  const DOWNLOAD_BTNS = [
    { key: 'zip', label: 'ZIP (Images)', icon: <Archive size={14} />, color: '#7C3AED', bg: '#F5F3FF', fn: downloadZip },
    { key: 'csv', label: 'CSV', icon: <FileText size={14} />, color: '#0369A1', bg: '#E0F2FE', fn: downloadCSV },
    { key: 'excel', label: 'Excel', icon: <FileSpreadsheet size={14} />, color: '#065F46', bg: '#D1FAE5', fn: downloadExcel },
    { key: 'pdf', label: 'PDF', icon: <FileText size={14} />, color: '#B91C1C', bg: '#FEE2E2', fn: downloadPDF },
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <AlertDialog show={alertDialog.show} title={alertDialog.title} message={alertDialog.message} type={alertDialog.type} onClose={() => setAlertDialog({ ...alertDialog, show: false })} />
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.sidebar}, #1E293B)`, borderRadius: 20, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 30px rgba(15,23,42,0.2)' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <QrCode size={28} /> QR Code Generator
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Generate up to 20,000 QR codes at once</div>
        </div>
        <div style={{ textAlign: 'center', padding: '10px 20px', background: 'rgba(255,255,255,0.07)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <Bolt size={20} /> {loading ? '...' : qrStats.active.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Active QR Codes</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        {/* Generator Form */}
        <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', height: 'fit-content' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={20} style={{ color: C.red }} /> Generate New QR Codes
          </div>

          {!canGenerateQr && (
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>View Only Mode</div>
              <div style={{ fontSize: 12, color: '#92400E', marginTop: 4 }}>You don't have permission to generate QR codes</div>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Search Product</label>
            <div ref={productSearchRef} style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: C.muted, zIndex: 1 }} />
              <input
                value={productSearch}
                onFocus={() => { setShowProductResults(true); void loadProducts(); }}
                onChange={event => {
                  setProductSearch(event.target.value);
                  setSelectedProduct('');
                  setShowProductResults(true);
                }}
                disabled={!canGenerateQr}
                placeholder={productsLoading ? 'Loading all products...' : 'Search by product name, SKU or category'}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 38px 10px 38px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text }}
              />
              {!!productSearch && canGenerateQr && (
                <button type="button" aria-label="Clear selected product" onClick={() => { setProductSearch(''); setSelectedProduct(''); setShowProductResults(true); }} style={{ position: 'absolute', right: 8, top: 7, width: 28, height: 28, border: 'none', background: 'transparent', color: C.muted, cursor: 'pointer', display: 'grid', placeItems: 'center' }}><X size={15} /></button>
              )}
              {showProductResults && canGenerateQr && (
                <div style={{ position: 'absolute', zIndex: 30, top: 'calc(100% + 6px)', left: 0, right: 0, maxHeight: 280, overflowY: 'auto', background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: '0 14px 35px rgba(15,23,42,0.18)', padding: 6 }}>
                  {productsLoading ? (
                    <div style={{ padding: 16, textAlign: 'center', color: C.muted, fontSize: 12 }}>Loading all company products...</div>
                  ) : matchingProducts.length ? matchingProducts.map((product: any) => (
                    <button
                      type="button"
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(String(product.id));
                        setProductSearch(product.name);
                        setShowProductResults(false);
                      }}
                      style={{ width: '100%', border: 'none', borderRadius: 9, background: String(product.id) === selectedProduct ? '#EFF6FF' : 'transparent', padding: '10px 11px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 12 }}
                    >
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', color: C.text, fontSize: 13, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</span>
                        <span style={{ display: 'block', color: C.muted, fontSize: 11, marginTop: 2 }}>SKU: {product.sku || 'N/A'} · {product.category || 'Uncategorized'}</span>
                      </span>
                      <span style={{ flexShrink: 0, color: '#166534', background: '#DCFCE7', borderRadius: 999, padding: '4px 8px', fontSize: 10, fontWeight: 900 }}>{Number(product.points ?? 0)} pts</span>
                    </button>
                  )) : (
                    <div style={{ padding: 16, textAlign: 'center', color: C.muted, fontSize: 12 }}>No matching product found.</div>
                  )}
                </div>
              )}
            </div>
            {/* Selected product info */}
            {selectedProduct && (() => {
              const p = products.find((x: any) => String(x.id) === selectedProduct);
              if (!p) return null;
              return (
                <div style={{ marginTop: 10, padding: '10px 14px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, display: 'flex', gap: 12, alignItems: 'center' }}>
                  {p.image && <img src={p.image} alt={p.name} style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, background: '#fff' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span>SKU: <b style={{ color: C.text }}>{p.sku || '—'}</b></span>
                      <span>Points: <b style={{ color: '#10B981' }}>{p.points} pts</b></span>
                      <span>Price: <b style={{ color: C.text }}>₹{p.price}</b></span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Number of QR Codes</label>
            <input
              type="text"
              value={qrCount}
              onChange={e => {
                const v = e.target.value;
                if (v === '') { setQrCount(''); return; }
                const n = parseInt(v);
                if (!isNaN(n) && n > 0 && n <= 20000) setQrCount(n);
              }}
              onBlur={e => { if (!e.target.value || parseInt(e.target.value) < 1) setQrCount(1); }}
              placeholder="Enter number (1 - 20,000)"
              disabled={!canGenerateQr}
              style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text }}
            />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Max 20,000 QR codes at once</div>
          </div>

          {/* Progress bar */}
          {generating && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.muted, marginBottom: 6 }}>
                <span>Generating...</span><span>{progress}%</span>
              </div>
              <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${C.red}, #10B981)`, borderRadius: 4, transition: 'width 0.2s' }} />
              </div>
            </div>
          )}

          <button onClick={generateQRCode} disabled={!selectedProduct || !canGenerateQr || generating}
            style={{ width: '100%', background: selectedProduct && canGenerateQr && !generating ? `linear-gradient(135deg, ${C.red}, ${C.redDark})` : C.border, color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: selectedProduct && canGenerateQr && !generating ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
            <RefreshCw size={16} style={{ animation: generating ? 'spin 1s linear infinite' : 'none' }} />
            {generating ? `Generating... ${progress}%` : 'Generate QR Codes'}
          </button>

          {/* Stats */}
          <div style={{ marginTop: 24, padding: 20, background: C.bg, borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Quick Stats</div>
            {[
              { label: 'Total QR Generated', value: loading ? '...' : qrStats.total.toLocaleString('en-IN'), color: '#1D4ED8' },
              { label: 'Scanned by Users', value: loading ? '...' : qrStats.scanned.toLocaleString('en-IN'), color: '#7C3AED' },
              { label: 'Remaining Active', value: loading ? '...' : qrStats.active.toLocaleString('en-IN'), color: '#059669' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: C.muted }}>{s.label}:</span>
                <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ background: C.card, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Gift size={20} style={{ color: '#10B981' }} /> Generated QR Codes ({generatedQRs.length})
            </div>

            {/* Download All Buttons */}
            {generatedQRs.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {DOWNLOAD_BTNS.map(btn => (
                  <button key={btn.key} onClick={btn.fn} disabled={downloading !== null}
                    style={{ background: btn.bg, color: btn.color, border: `1px solid ${btn.color}30`, borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: downloading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5, opacity: downloading && downloading !== btn.key ? 0.5 : 1 }}>
                    {downloading === btn.key ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : btn.icon}
                    {downloading === btn.key ? 'Preparing...' : `Download ${btn.label}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {generatedQRs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
              <QrCode size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>No QR codes generated yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Select a product and generate your first QR code</div>
            </div>
          )}

          <div style={{ display: 'grid', gap: 12, maxHeight: 600, overflowY: 'auto' }}>
            {generatedQRs.slice(0, 100).map(qr => (
              <div key={qr.id} style={{ background: C.bg, borderRadius: 12, padding: 16, border: `1px solid ${C.border}`, transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'}>
                <div style={{ display: 'flex', gap: 16 }}>
                  {qr.qrData ? (
                    <img src={qr.qrData} alt={qr.id}
                      style={{ width: 100, height: 100, borderRadius: 8, border: `2px solid ${C.red}`, flexShrink: 0, objectFit: 'contain', background: 'white', cursor: 'pointer' }}
                      onClick={() => { const w = window.open(); if (w) w.document.write(`<img src="${qr.qrData}" style="max-width:100%;height:auto;" />`); }}
                    />
                  ) : (
                    <div style={{ width: 100, height: 100, borderRadius: 8, border: `2px solid ${C.border}`, flexShrink: 0, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: C.muted, textAlign: 'center', padding: 4 }}>
                      Download to view image
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{qr.productName}</div>
                      <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>ACTIVE</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
                      QR ID: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{qr.id}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 11, color: C.muted, marginBottom: 12 }}>
                      <div><Bolt size={12} style={{ display: 'inline', marginRight: 4 }} />{qr.points} points</div>
                      <div>SKU: {qr.productId}</div>
                      <div>Generated: {formatISTDate(qr.generatedAt)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {qr.qrData && (
                        <button onClick={() => downloadSingle(qr)}
                          style={{ background: C.red, color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Download size={12} /> Download
                        </button>
                      )}
                      <button onClick={() => copyQRData(qr)}
                        style={{ background: copiedId === qr.id ? '#10B981' : C.border, color: copiedId === qr.id ? 'white' : C.text, border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {copiedId === qr.id ? <Check size={12} /> : <Copy size={12} />}
                        {copiedId === qr.id ? 'Copied!' : 'Copy ID'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {generatedQRs.length > 100 && (
              <div style={{ textAlign: 'center', padding: '16px', background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, fontWeight: 600 }}>
                Showing 100 of {generatedQRs.length} QR codes. Use the Download buttons above to get all codes.
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
