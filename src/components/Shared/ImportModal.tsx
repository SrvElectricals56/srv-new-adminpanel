'use client';
import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';

interface ImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: string[];
  total: number;
}

interface ImportModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  onImport: (records: any[]) => Promise<ImportResult>;
  sampleHeaders?: string[];
}

export default function ImportModal({ show, onClose, title, onImport, sampleHeaders }: ImportModalProps) {
  const C = useThemePalette();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'result'>('upload');
  const [preview, setPreview] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mouseDownInside = useRef(false);

  if (!show) return null;

  const readWorkbookRows = async (file: File) => {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, {
      defval: '',
      raw: false,
      dateNF: 'yyyy-mm-dd',
    }) as any[];
  };

  const reset = () => {
    setStep('upload');
    setPreview([]);
    setColumns([]);
    setTotalRows(0);
    setResult(null);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    try {
      const json = await readWorkbookRows(file);

      if (!json.length) {
        setError('File is empty. Please select a file with data.');
        return;
      }

      const cols = Object.keys(json[0]);
      setColumns(cols);
      setTotalRows(json.length);
      setPreview(json.slice(0, 10));
      setStep('preview');
    } catch (err: any) {
      setError('Failed to parse file. Please ensure it is a valid Excel (.xlsx) file.');
    }
  };

  const handleImport = async () => {
    if (!preview.length) return;

    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setStep('importing');
    setError(null);

    try {
      const allRows = await readWorkbookRows(file);

      const res = await onImport(allRows);
      setResult(res);
      setStep('result');
    } catch (err: any) {
      setError(err.message || 'Import failed');
      setStep('upload');
    }
  };

  const downloadSample = () => {
    const cols = sampleHeaders || (columns.length ? columns : ['name', 'phone', 'email', 'city', 'state', 'district', 'status']);
    const sampleRow: Record<string, string> = {};
    cols.forEach(h => { sampleRow[h] = h === 'phone' ? '9876543210' : `Sample ${h}`; });
    sampleRow.status = 'active';

    const XLSX = require('xlsx') as typeof import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet([cols, cols.map(h => sampleRow[h])]);
    ws['!cols'] = cols.map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s+/g, '-')}-sample.xlsx`);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'created': return { bg: '#D1FAE5', text: '#065F46', icon: CheckCircle };
      case 'updated': return { bg: '#DBEAFE', text: '#1E40AF', icon: CheckCircle };
      case 'failed': return { bg: '#FEE2E2', text: '#991B1B', icon: XCircle };
      default: return { bg: C.bg, text: C.muted, icon: AlertCircle };
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onMouseDown={() => { mouseDownInside.current = false; }}
      onMouseUp={() => { if (!mouseDownInside.current) handleClose(); }}
    >
      <div
        style={{ background: C.card, borderRadius: 20, width: 560, maxWidth: '95vw', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 70px rgba(0,0,0,0.25)', border: `1px solid ${C.border}` }}
        onMouseDown={e => { e.stopPropagation(); mouseDownInside.current = true; }}
        onMouseUp={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={20} color="#1E40AF" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Import Data</div>
              <div style={{ fontSize: 12, color: C.muted }}>Importing: <strong>{title}</strong></div>
            </div>
          </div>
          <button onClick={handleClose} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
        </div>

        {/* File input — always mounted so ref stays valid across steps */}
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileSelect} />

        {/* Body */}
        <div style={{ padding: '20px 24px', overflow: 'auto', flex: 1 }}>

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ border: `2px dashed ${C.border}`, borderRadius: 16, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: C.bg }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#3B82F6'; (e.currentTarget as HTMLDivElement).style.background = '#EFF6FF'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; (e.currentTarget as HTMLDivElement).style.background = C.bg; }}
              >
                <FileSpreadsheet size={40} color="#3B82F6" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>Click to upload Excel file</div>
                <div style={{ fontSize: 12, color: C.muted }}>Supports .xlsx files</div>
              </div>

              {error && (
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#FEE2E2', border: '1px solid #FCA5A5', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} color="#991B1B" />
                  <span style={{ fontSize: 13, color: '#991B1B', fontWeight: 600 }}>{error}</span>
                </div>
              )}

              <button onClick={downloadSample} style={{ marginTop: 12, width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Download Sample Template
              </button>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                Preview ({preview.length} of {totalRows} rows shown)
              </div>
              <div style={{ overflow: 'auto', maxHeight: 300, borderRadius: 10, border: `1px solid ${C.border}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: C.bg }}>
                      {columns.map(col => (
                        <th key={col} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: C.text, borderBottom: `2px solid ${C.border}`, whiteSpace: 'nowrap' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                        {columns.map(col => (
                          <td key={col} style={{ padding: '6px 10px', color: C.text, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(row[col] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={() => { setStep('upload'); setPreview([]); }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Change File
                </button>
                <button onClick={handleImport} style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Import {totalRows} Rows
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Loader2 size={40} color="#3B82F6" style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Importing data...</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Please wait while we process your file</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Step 4: Result */}
          {step === 'result' && result && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Created', value: result.created, color: '#065F46', bg: '#D1FAE5' },
                  { label: 'Updated', value: result.updated, color: '#1E40AF', bg: '#DBEAFE' },
                  { label: 'Failed', value: result.failed, color: '#991B1B', bg: '#FEE2E2' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: stat.bg, borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: stat.color, marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {result.errors.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', marginBottom: 6 }}>Errors ({result.errors.length}):</div>
                  <div style={{ maxHeight: 120, overflow: 'auto', background: '#FEE2E2', borderRadius: 10, padding: '10px 14px' }}>
                    {result.errors.map((err, i) => (
                      <div key={i} style={{ fontSize: 11, color: '#991B1B', padding: '2px 0' }}>{err}</div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleClose} style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
