'use client';
import { useState, useEffect, useCallback } from 'react';
import { ScanLine, QrCode, Scan, FileSpreadsheet } from 'lucide-react';
import { scanApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import ExportModal from '@/components/Shared/ExportModal';
import { formatISTDateTime } from '@/lib/dateIST';

interface ScanRecord {
  id: string;
  userId: string;
  userName: string;
  productName: string;
  points: number;
  mode: string;
  location?: string;
  scannedAt: string;
}

const PAGE_SIZE = 50;

export default function ElectricianScanHistory() {
  const C = useThemePalette();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [totalSingle, setTotalSingle] = useState(0);
  const [totalMulti, setTotalMulti] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterScanMode, setFilterScanMode] = useState<'all' | 'single' | 'multi'>('all');
  const [showExport, setShowExport] = useState(false);

  const loadData = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        role: 'electrician',
        limit: String(PAGE_SIZE),
        page: String(page),
      };
      if (search) params.search = search;
      if (filterScanMode !== 'all') params.mode = filterScanMode;

      const res = await scanApi.getAll(params);
      const data = Array.isArray(res) ? res : (res as any).data ?? [];
      const total = Array.isArray(res) ? data.length : (res as any).total ?? data.length;
      const pts = Array.isArray(res) ? 0 : (res as any).totalPoints ?? 0;
      const single = Array.isArray(res) ? 0 : (res as any).totalSingle ?? 0;
      const multi = Array.isArray(res) ? 0 : (res as any).totalMulti ?? 0;

      setScans(data.map((s: any) => ({
        id: s.id,
        userId: s.userId,
        userName: s.userName,
        productName: s.productName,
        points: s.points,
        mode: s.mode ?? 'single',
        location: s.location,
        scannedAt: s.scannedAt,
      })));
      setTotalCount(total);
      setTotalPoints(pts);
      setTotalSingle(single);
      setTotalMulti(multi);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, filterScanMode]);

  useEffect(() => {
    setCurrentPage(1);
    loadData(1);
  }, [search, filterScanMode]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    loadData(page);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`,
    borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface,
    color: C.text, boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ScanLine size={24} style={{ color: C.red }} /> Scan History
          </h1>
          <p style={{ color: C.muted, fontSize: 14 }}>View all scan records by electricians</p>
        </div>
        <button onClick={() => setShowExport(true)} style={{ background: C.red, color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><FileSpreadsheet size={14} /> Export</button>
      </div>

      <ExportModal
        show={showExport}
        onClose={() => setShowExport(false)}
        title="Scan History"
        fileName="electrician-scans"
        getData={() => scans.map(s => ({ Electrician: s.userName, UserId: s.userId, Product: s.productName, ScanType: s.mode, Points: s.points, DateTime: s.scannedAt, Location: s.location ?? '' }))}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total Scans', value: totalCount.toLocaleString('en-IN'), color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'Total Points', value: totalPoints.toLocaleString('en-IN'), color: '#F59E0B', bg: '#FFFBEB' },
          { label: 'Single Scans', value: totalSingle.toLocaleString('en-IN'), color: '#10B981', bg: '#D1FAE5' },
          { label: 'Multi Scans', value: totalMulti.toLocaleString('en-IN'), color: '#8B5CF6', bg: '#F5F3FF' },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: C.card, borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}`, marginBottom: 18, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search electrician or product..."
          style={{ ...inputStyle, flex: 1, minWidth: 220 }}
        />
        <select value={filterScanMode} onChange={e => setFilterScanMode(e.target.value as any)} style={{ ...inputStyle, width: 'auto', minWidth: 140 }}>
          <option value="all">All Scan Types</option>
          <option value="single">Single Scan</option>
          <option value="multi">Multi Scan</option>
        </select>
        <span style={{ fontSize: 13, color: C.muted, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} of <strong>{totalCount.toLocaleString('en-IN')}</strong>
        </span>
      </div>

      {/* Table */}
      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: C.muted }}>Loading...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                {['Electrician', 'Product', 'Scan Type', 'Points', 'Date & Time', 'Location'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: h === 'Scan Type' || h === 'Points' ? 'center' : 'left', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scans.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: C.muted }}>No scan records found</td></tr>
              ) : scans.map(scan => (
                <tr key={scan.id} style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = C.hoverRow}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{scan.userName}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{scan.userId?.slice(0, 8)}…</div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: C.text }}>{scan.productName}</td>
                  <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: scan.mode === 'single' ? '#EFF6FF' : '#F5F3FF', color: scan.mode === 'single' ? '#3B82F6' : '#8B5CF6', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                      {scan.mode === 'single' ? <QrCode size={14} strokeWidth={2.5} /> : <Scan size={14} strokeWidth={2.5} />}
                      {scan.mode === 'single' ? 'Single' : 'Multi'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#16A34A' }}>+{scan.points}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: C.muted }}>{formatISTDateTime(scan.scannedAt)}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: C.muted }}>{scan.location || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: '12px 20px', background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, color: C.muted }}>
            Page <strong style={{ color: C.text }}>{currentPage}</strong> of <strong style={{ color: C.text }}>{totalPages}</strong>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => goToPage(1)} disabled={currentPage === 1} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: currentPage === 1 ? C.bg : C.card, color: currentPage === 1 ? C.muted : C.text, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}>«</button>
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: currentPage === 1 ? C.bg : C.card, color: currentPage === 1 ? C.muted : C.text, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>← Prev</button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) pageNum = i + 1;
              else if (currentPage <= 4) pageNum = i + 1;
              else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
              else pageNum = currentPage - 3 + i;
              return (
                <button key={pageNum} onClick={() => goToPage(pageNum)} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${currentPage === pageNum ? C.red : C.border}`, background: currentPage === pageNum ? C.red : C.card, color: currentPage === pageNum ? 'white' : C.text, cursor: 'pointer', fontSize: 13, fontWeight: currentPage === pageNum ? 700 : 500 }}>{pageNum}</button>
              );
            })}
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: currentPage >= totalPages ? C.bg : C.card, color: currentPage >= totalPages ? C.muted : C.text, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>Next →</button>
            <button onClick={() => goToPage(totalPages)} disabled={currentPage >= totalPages} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: currentPage >= totalPages ? C.bg : C.card, color: currentPage >= totalPages ? C.muted : C.text, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', fontSize: 12 }}>»</button>
          </div>
        </div>
      )}
    </div>
  );
}
