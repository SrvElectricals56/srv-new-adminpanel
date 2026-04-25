'use client';
import { useState, useEffect } from 'react';
import { ScanLine, QrCode, Scan } from 'lucide-react';
import { scanApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import ExportModal from '@/components/Shared/ExportModal';

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

export default function ElectricianScanHistory() {
  const C = useThemePalette();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterScanMode, setFilterScanMode] = useState<'all' | 'single' | 'multi'>('all');
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    scanApi.getAll({ role: 'electrician', limit: '500' })
      .then(res => {
        const data = Array.isArray(res) ? res : (res as any).data ?? [];
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
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const singleScans = scans.filter(s => s.mode === 'single');
  const multiScans = scans.filter(s => s.mode === 'multi');

  const filtered = scans.filter(s => {
    const matchSearch = s.userName.toLowerCase().includes(search.toLowerCase()) || s.productName.toLowerCase().includes(search.toLowerCase());
    const matchMode = filterScanMode === 'all' || s.mode === filterScanMode;
    return matchSearch && matchMode;
  });

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><ScanLine size={24} style={{ color: C.red }} /> Scan History</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>View all scan records by electricians</p>
        </div>
        <button onClick={() => setShowExport(true)} style={{ background: C.red, color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Export</button>
      </div>
      <ExportModal show={showExport} onClose={() => setShowExport(false)} title="Scan History" fileName="electrician-scans" getData={() => scans.map(s => ({ Electrician: s.userName, UserId: s.userId, Product: s.productName, ScanType: s.mode, Points: s.points, DateTime: s.scannedAt, Location: s.location ?? '' }))} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total Scans', value: scans.length, color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'Total Points', value: scans.reduce((a, s) => a + s.points, 0), color: '#F59E0B', bg: '#FFFBEB' },
          { label: 'Single Scans', value: singleScans.length, color: '#10B981', bg: '#D1FAE5' },
          { label: 'Multi Scans', value: multiScans.length, color: '#8B5CF6', bg: '#F5F3FF' },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Scan Mode Analytics */}
      <div style={{ background: C.card, borderRadius: 14, padding: '24px 28px', border: `1px solid ${C.border}`, marginBottom: 22 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ScanLine size={20} style={{ color: C.red }} /> Scan Mode Analytics
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: C.surface, borderRadius: 12, padding: '20px 24px', border: `2px solid #3B82F6` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: 'uppercase' }}>Single Scan</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#3B82F6' }}>{singleScans.length}</div>
              </div>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCode size={32} color="#3B82F6" strokeWidth={2.5} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Total Points</div><div style={{ fontSize: 18, fontWeight: 800, color: '#F59E0B' }}>{singleScans.reduce((a, s) => a + s.points, 0)}</div></div>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Percentage</div><div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{scans.length ? ((singleScans.length / scans.length) * 100).toFixed(1) : 0}%</div></div>
            </div>
          </div>
          <div style={{ background: C.surface, borderRadius: 12, padding: '20px 24px', border: `2px solid #8B5CF6` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: 'uppercase' }}>Multi Scan</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#8B5CF6' }}>{multiScans.length}</div>
              </div>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Scan size={32} color="#8B5CF6" strokeWidth={2.5} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Total Points</div><div style={{ fontSize: 18, fontWeight: 800, color: '#F59E0B' }}>{multiScans.reduce((a, s) => a + s.points, 0)}</div></div>
              <div><div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Percentage</div><div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{scans.length ? ((multiScans.length / scans.length) * 100).toFixed(1) : 0}%</div></div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: C.card, borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}`, marginBottom: 18, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search electrician or product..." style={{ ...inputStyle, flex: 1, minWidth: 220 }} />
        <select value={filterScanMode} onChange={e => setFilterScanMode(e.target.value as any)} style={{ ...inputStyle, width: 'auto', minWidth: 140 }}>
          <option value="all">All Scan Types</option>
          <option value="single">Single Scan</option>
          <option value="multi">Multi Scan</option>
        </select>
        <span style={{ fontSize: 13, color: C.muted, marginLeft: 'auto' }}>{filtered.length} results</span>
      </div>

      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {loading ? <div style={{ padding: '40px', textAlign: 'center', color: C.muted }}>Loading...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                {['Electrician', 'Product', 'Scan Type', 'Points', 'Date & Time', 'Location'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: h === 'Scan Type' || h === 'Points' ? 'center' : 'left', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: C.muted }}>No scan records found</td></tr>
              ) : filtered.map(scan => (
                <tr key={scan.id} style={{ borderBottom: `1px solid ${C.border}` }} onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = C.hoverRow} onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
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
                  <td style={{ padding: '13px 16px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#F59E0B' }}>+{scan.points}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: C.muted }}>{new Date(scan.scannedAt).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: C.muted }}>{scan.location || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
