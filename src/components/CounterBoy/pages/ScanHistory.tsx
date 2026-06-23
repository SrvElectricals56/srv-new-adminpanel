'use client';
import { useCallback, useEffect, useState } from 'react';
import { ScanLine, QrCode, Scan, FileSpreadsheet } from 'lucide-react';
import { scanApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import ExportModal from '@/components/Shared/ExportModal';
import { formatISTDateTime } from '@/lib/dateIST';

export default function CounterBoyScanHistory() {
  const C = useThemePalette();
  const [rows, setRows] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, points: 0, single: 0, multi: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'all' | 'single' | 'multi'>('all');
  const [showExport, setShowExport] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { role: 'counterboy', limit: '500' };
      if (search) params.search = search;
      if (mode !== 'all') params.mode = mode;
      const res = await scanApi.getAll(params);
      const data = Array.isArray(res) ? res : (res as any).data ?? [];
      setRows(data);
      setStats({
        total: Array.isArray(res) ? data.length : (res as any).total ?? data.length,
        points: Array.isArray(res) ? 0 : (res as any).totalPoints ?? 0,
        single: Array.isArray(res) ? 0 : (res as any).totalSingle ?? 0,
        multi: Array.isArray(res) ? 0 : (res as any).totalMulti ?? 0,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [mode, search]);

  useEffect(() => { load(); }, [load]);

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <ExportModal show={showExport} onClose={() => setShowExport(false)} title="Counter Boy Scans" fileName="counterboy-scans" getData={() => rows.map(row => ({ CounterBoy: row.userName, UserId: row.userId, Product: row.productName, ScanType: row.mode, Points: row.points, DateTime: row.scannedAt }))} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><ScanLine size={24} style={{ color: C.red }} /> Scan History</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>View all scan records by counter boys</p>
        </div>
        <button onClick={() => setShowExport(true)} style={{ background: C.red, color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><FileSpreadsheet size={14} /> Export</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {[{ label: 'Total Scans', value: stats.total }, { label: 'Total Points', value: stats.points }, { label: 'Single Scans', value: stats.single }, { label: 'Multi Scans', value: stats.multi }].map(card => (
          <div key={card.label} style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{card.value.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.card, borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}`, marginBottom: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search counter boy or product..." style={{ ...inputStyle, flex: 1 }} />
        <select value={mode} onChange={e => setMode(e.target.value as any)} style={{ ...inputStyle, width: 'auto' }}>
          <option value="all">All Types</option>
          <option value="single">Single Scan</option>
          <option value="multi">Multi Scan</option>
        </select>
      </div>

      <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>Loading...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                {['Counter Boy', 'Product', 'Type', 'Points', 'Date & Time'].map(head => <th key={head} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: C.muted }}>No scan records found</td></tr> : rows.map(row => (
                <tr key={row.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '13px 16px' }}><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{row.userName}</div><div style={{ fontSize: 11, color: C.muted }}>{row.userId?.slice(0, 8)}…</div></td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: C.text }}>{row.productName}</td>
                  <td style={{ padding: '13px 16px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: row.mode === 'single' ? '#EFF6FF' : '#F5F3FF', color: row.mode === 'single' ? '#3B82F6' : '#8B5CF6', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{row.mode === 'single' ? <QrCode size={14} /> : <Scan size={14} />}{row.mode === 'single' ? 'Single' : 'Multi'}</span></td>
                  <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 700, color: '#16A34A' }}>+{row.points}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: C.muted }}>{formatISTDateTime(row.scannedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
