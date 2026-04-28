'use client';
import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Archive, Download, RefreshCw } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { exportRowsToExcel } from '@/lib/excel';

interface ExportModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  getData: () => object[];
  fileName: string;
}

export default function ExportModal({ show, onClose, title, getData, fileName }: ExportModalProps) {
  const C = useThemePalette();
  const [exporting, setExporting] = useState<string | null>(null);

  if (!show) return null;

  const handleExport = async (format: 'excel' | 'csv' | 'pdf' | 'zip') => {
    const rows = getData();
    if (!rows.length) return;
    setExporting(format);

    try {
      const dateTag = new Date().toISOString().slice(0, 10);
      const name = `${fileName}-${dateTag}`;
      const keys = Object.keys(rows[0]);

      if (format === 'excel') {
        exportRowsToExcel(rows, title, name);

      } else if (format === 'csv') {
        const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const csv = '\uFEFF' + [keys.map(esc).join(','), ...rows.map((r: any) => keys.map(k => esc(r[k])).join(','))].join('\r\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        a.download = `${name}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);

      } else if (format === 'pdf') {
        const jsPDFModule = await import('jspdf');
        const jsPDF = jsPDFModule.default || (jsPDFModule as any).jsPDF;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const cols = keys.slice(0, 8);
        const colW = 260 / cols.length;
        let y = 20;
        doc.setFontSize(13); doc.setFont('helvetica', 'bold');
        doc.text(`${title} Export`, 14, 13);
        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
        cols.forEach((k, i) => doc.text(String(k).toUpperCase(), 14 + i * colW, y));
        y += 5; doc.setDrawColor(200); doc.line(14, y, 280, y); y += 4;
        doc.setFont('helvetica', 'normal');
        rows.forEach((r: any) => {
          if (y > 190) { doc.addPage(); y = 20; }
          cols.forEach((k, i) => doc.text(String(r[k] ?? '').substring(0, 22), 14 + i * colW, y));
          y += 6;
        });
        doc.save(`${name}.pdf`);

      } else if (format === 'zip') {
        const [JSZipModule, XLSX] = await Promise.all([import('jszip').then(m => m.default), import('xlsx')]);
        const zip = new JSZipModule();
        // Excel
        const ws = XLSX.utils.aoa_to_sheet([keys, ...rows.map((r: any) => keys.map(k => r[k] ?? ''))]);
        ws['!cols'] = keys.map(() => ({ wch: 20 }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, title);
        zip.file(`${name}.xlsx`, XLSX.write(wb, { bookType: 'xlsx', type: 'array' }));
        // CSV
        const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        zip.file(`${name}.csv`, '\uFEFF' + [keys.map(esc).join(','), ...rows.map((r: any) => keys.map(k => esc(r[k])).join(','))].join('\r\n'));
        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = `${name}.zip`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Export error:', err);
    }
    setExporting(null);
    onClose();
  };

  const opts = [
    { key: 'excel', label: 'Excel', desc: '.xlsx spreadsheet', icon: '📊', color: '#065F46', bg: '#D1FAE5', bdr: '#6EE7B7' },
    { key: 'csv',   label: 'CSV',   desc: 'Comma separated',   icon: '📄', color: '#0369A1', bg: '#E0F2FE', bdr: '#7DD3FC' },
    { key: 'pdf',   label: 'PDF',   desc: 'Printable document', icon: '📋', color: '#B91C1C', bg: '#FEE2E2', bdr: '#FCA5A5' },
    { key: 'zip',   label: 'ZIP',   desc: 'Excel + CSV bundle', icon: '🗜️', color: '#7C3AED', bg: '#F5F3FF', bdr: '#C4B5FD' },
  ];

  const mouseDownInside = React.useRef(false);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onMouseDown={() => { mouseDownInside.current = false; }}
      onMouseUp={() => { if (!mouseDownInside.current) onClose(); }}
    >
      <div
        style={{ background: C.card, borderRadius: 20, width: 460, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.25)', border: `1px solid ${C.border}` }}
        onMouseDown={e => { e.stopPropagation(); mouseDownInside.current = true; }}
        onMouseUp={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={20} color="#065F46" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Export Data</div>
              <div style={{ fontSize: 12, color: C.muted }}>Exporting: <strong>{title}</strong></div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
        </div>

        {/* Options */}
        <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {opts.map(opt => (
            <button
              key={opt.key}
              onClick={() => handleExport(opt.key as any)}
              disabled={exporting !== null}
              style={{ background: exporting === opt.key ? opt.bg : C.surface, border: `2px solid ${exporting === opt.key ? opt.bdr : C.border}`, borderRadius: 14, padding: '16px', cursor: exporting ? 'not-allowed' : 'pointer', textAlign: 'left', transition: 'all 0.2s', opacity: exporting && exporting !== opt.key ? 0.5 : 1 }}
              onMouseEnter={e => { if (!exporting) { (e.currentTarget as HTMLButtonElement).style.background = opt.bg; (e.currentTarget as HTMLButtonElement).style.borderColor = opt.bdr; } }}
              onMouseLeave={e => { if (!exporting) { (e.currentTarget as HTMLButtonElement).style.background = C.surface; (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; } }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{exporting === opt.key ? '⏳' : opt.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: exporting === opt.key ? opt.color : C.text }}>{exporting === opt.key ? 'Exporting...' : opt.label}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{opt.desc}</div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '0 24px 20px' }}>
          <button onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
