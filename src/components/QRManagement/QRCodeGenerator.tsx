'use client';
import { useState, useEffect } from 'react';
import { QrCode, Download, RefreshCw, Zap, Package, Gift, Copy, Check, FileText, FileSpreadsheet, Archive } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import type { AdminRole } from '@/lib/types';
import { getPermissions } from '@/lib/permissions';
import { productApi, qrCodeApi } from '@/lib/api';
import QRCodeLib from 'qrcode';
import AlertDialog from '@/components/Shared/AlertDialog';

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
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qrCount, setQrCount] = useState<string | number>(1);
  const [generatedQRs, setGeneratedQRs] = useState<GeneratedQR[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'error' });
  const permissions = getPermissions(role);

  useEffect(() => {
    productApi.getAll({ limit: '500' }).then(res => {
      setProducts(Array.isArray(res) ? res : (res as any).data ?? []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const count = typeof qrCount === 'string' ? parseInt(qrCount) || 1 : qrCount;

  const generateQRCode = async () => {
    if (!selectedProduct || !permissions.canEdit) return;
    const product = products.find((p: any) => String(p.id) === selectedProduct || p.sku === selectedProduct);
    if (!product) return;

    setGenerating(true);
    setProgress(0);

    try {
      // Call backend to generate and save QR codes in database
      const result = await qrCodeApi.generate({
        productId: product.id,
        quantity: count,
        batchId: `BATCH-${Date.now().toString(36).toUpperCase()}`,
      });

      const newQRs: GeneratedQR[] = (result as any).codes.map((qr: any) => ({
        id: qr.code,
        productId: product.sku || product.id,
        productName: product.name,
        points: product.points,
        qrData: qr.qrImageUrl || '',
        generatedAt: qr.createdAt || new Date().toISOString(),
        status: 'active' as const,
      }));

      setGeneratedQRs(prev => [...newQRs, ...prev]);
      setAlertDialog({
        show: true,
        title: '✅ QR Codes Generated',
        message: `${count} QR codes for "${product.name}" (SKU: ${product.sku || 'N/A'}, ${product.points} pts) saved to database.`,
        type: 'success',
      });
    } catch (err: any) {
      setAlertDialog({ show: true, title: 'Generation Failed', message: err.message || 'Failed to generate QR codes', type: 'error' });
    }

    setGenerating(false);
    setProgress(0);
  };

  const downloadSingle = (qr: GeneratedQR) => {
    const link = document.createElement('a');
    link.href = qr.qrData;
    link.download = `${qr.id}.png`;
    link.click();
  };

  const copyQRData = (qr: GeneratedQR) => {
    navigator.clipboard.writeText(qr.id);
    setCopiedId(qr.id);
    setTimeout(() => setCopiedId(null), 2000);
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

      // 1. Images folder
      const imgFolder = zip.folder('QR_Images')!;
      generatedQRs.forEach(qr => {
        const base64 = qr.qrData.replace(/^data:image\/\w+;base64,/, '');
        if (base64) imgFolder.file(`${qr.id}.png`, base64, { base64: true });
      });

      // 2. Excel file inside zip
      const wsData = [
        ['QR ID', 'Product Name', 'Product ID', 'Points', 'Generated At', 'Status'],
        ...generatedQRs.map(q => [
          q.id,
          q.productName,
          q.productId,
          q.points,
          new Date(q.generatedAt).toLocaleString('en-IN'),
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
      // Write excel as array buffer and add to zip
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
    const header = ['QR ID', 'Product Name', 'Product ID', 'Points', 'Generated At', 'Status'].map(escape).join(',');
    const rows = generatedQRs.map(q =>
      [q.id, q.productName, q.productId, q.points, new Date(q.generatedAt).toLocaleString('en-IN'), q.status].map(escape).join(',')
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
    setDownloading(null);
  };

  // ── Download All as Excel using xlsx library ───────────────────────
  const downloadExcel = async () => {
    if (!generatedQRs.length) return;
    setDownloading('excel');
    try {
      const XLSX = await import('xlsx');
      const wsData = [
        ['QR ID', 'Product Name', 'Product ID', 'Points', 'Generated At', 'Status'],
        ...generatedQRs.map(q => [
          q.id,
          q.productName,
          q.productId,
          q.points,
          new Date(q.generatedAt).toLocaleString('en-IN'),
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
            <Zap size={20} /> {generatedQRs.filter(q => q.status === 'active').length}
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

          {!permissions.canEdit && (
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>⚠️ View Only Mode</div>
              <div style={{ fontSize: 12, color: '#92400E', marginTop: 4 }}>You don't have permission to generate QR codes</div>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Select Product</label>
            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} disabled={!permissions.canEdit}
              style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text, cursor: permissions.canEdit ? 'pointer' : 'not-allowed' }}>
              <option value="">-- Choose a product --</option>
              {products.filter((p: any) => p.isActive ?? p.is_active ?? true).map((p: any) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name} | SKU: {p.sku || 'N/A'} | {p.points} pts
                </option>
              ))}
            </select>
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
              disabled={!permissions.canEdit}
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

          <button onClick={generateQRCode} disabled={!selectedProduct || !permissions.canEdit || generating}
            style={{ width: '100%', background: selectedProduct && permissions.canEdit && !generating ? `linear-gradient(135deg, ${C.red}, ${C.redDark})` : C.border, color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: selectedProduct && permissions.canEdit && !generating ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
            <RefreshCw size={16} style={{ animation: generating ? 'spin 1s linear infinite' : 'none' }} />
            {generating ? `Generating... ${progress}%` : 'Generate QR Codes'}
          </button>

          {/* Stats */}
          <div style={{ marginTop: 24, padding: 20, background: C.bg, borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Quick Stats</div>
            {[
              { label: 'Total Generated', value: generatedQRs.length, color: C.text },
              { label: 'Active', value: generatedQRs.filter(q => q.status === 'active').length, color: '#10B981' },
              { label: 'Used', value: generatedQRs.filter(q => q.status === 'used').length, color: '#F59E0B' },
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
            {generatedQRs.map(qr => (
              <div key={qr.id} style={{ background: C.bg, borderRadius: 12, padding: 16, border: `1px solid ${C.border}`, transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <img src={qr.qrData} alt={qr.id}
                    style={{ width: 100, height: 100, borderRadius: 8, border: `2px solid ${C.red}`, flexShrink: 0, objectFit: 'contain', background: 'white', cursor: 'pointer' }}
                    onClick={() => { const w = window.open(); if (w) w.document.write(`<img src="${qr.qrData}" style="max-width:100%;height:auto;" />`); }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{qr.productName}</div>
                      <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>ACTIVE</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
                      QR ID: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{qr.id}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 11, color: C.muted, marginBottom: 12 }}>
                      <div><Zap size={12} style={{ display: 'inline', marginRight: 4 }} />{qr.points} points</div>
                      <div>Generated: {new Date(qr.generatedAt).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => downloadSingle(qr)}
                        style={{ background: C.red, color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Download size={12} /> Download
                      </button>
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
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
