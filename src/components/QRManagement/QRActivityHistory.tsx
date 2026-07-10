'use client';
import { useEffect, useState } from 'react';
import { Calendar, Clock, Download, Filter, QrCode, RefreshCw, Search } from 'lucide-react';
import { qrCodeApi } from '@/lib/api';
import { formatISTDate, formatISTDateTime } from '@/lib/dateIST';
import { useThemePalette } from '@/lib/theme';
import type { AdminRole } from '@/lib/types';
import AlertDialog from '@/components/Shared/AlertDialog';

const PAGE_SIZE = 20;

interface QRActivityHistoryProps {
  role: AdminRole;
}

export default function QRActivityHistory({ role }: QRActivityHistoryProps) {
  const C = useThemePalette();
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({
    show: false,
    title: '',
    message: '',
    type: 'error',
  });

  const toDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayIso = toDateInput(new Date());
  const todayMonthIso = todayIso.slice(0, 7);
  const [calendarYear, calendarMonthNumber] = calendarMonth.split('-').map(Number);
  const monthStart = new Date(calendarYear, calendarMonthNumber - 1, 1);
  const monthLastDay = new Date(calendarYear, calendarMonthNumber, 0).getDate();
  const monthOffset = monthStart.getDay();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const selectedSingleDate = fromDate && fromDate === toDate ? fromDate : '';
  const canGoNextMonth = calendarMonth < todayMonthIso;

  const calendarCells = [
    ...Array.from({ length: monthOffset }, () => null),
    ...Array.from({ length: monthLastDay }, (_, index) => {
      const day = index + 1;
      const iso = toDateInput(new Date(calendarYear, calendarMonthNumber - 1, day));
      return { day, iso, future: iso > todayIso };
    }),
  ];

  const actionLabel = (type?: string) => {
    const normalized = String(type ?? '').toLowerCase();
    return normalized === 'generated' ? 'Generated' : 'Downloaded';
  };

  const loadHistory = async (nextPage = page, nextSearch = search, nextFrom = fromDate, nextTo = toDate) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(nextPage),
        limit: String(PAGE_SIZE),
      };
      if (nextSearch.trim()) params.search = nextSearch.trim();
      if (nextFrom) params.fromDate = nextFrom;
      if (nextTo) params.toDate = nextTo;
      const res = await qrCodeApi.getDownloadHistory(params);
      const data = Array.isArray(res) ? res : (res as any).data ?? [];
      setRows(data);
      setTotal(Array.isArray(res) ? data.length : (res as any).total ?? data.length);
    } catch (err: any) {
      setAlertDialog({ show: true, title: 'QR Activity Load Failed', message: err.message || 'Unable to load QR activity history.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (nextFrom = fromDate, nextTo = toDate) => {
    setPage(1);
    void loadHistory(1, search, nextFrom, nextTo);
  };

  const selectSingleDate = (dateIso: string) => {
    if (dateIso > todayIso) return;
    setFromDate(dateIso);
    setToDate(dateIso);
    applyFilters(dateIso, dateIso);
  };

  const applyQuickFilter = (type: 'today' | 'weekly' | 'monthly') => {
    const today = new Date();
    let start = today;
    if (type === 'weekly') start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
    if (type === 'monthly') start = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextFrom = toDateInput(start);
    setFromDate(nextFrom);
    setToDate(todayIso);
    setPage(1);
    void loadHistory(1, search, nextFrom, todayIso);
  };

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setPage(1);
    void loadHistory(1, search, '', '');
  };

  const shiftMonth = (delta: number) => {
    const next = new Date(calendarYear, calendarMonthNumber - 1 + delta, 1);
    const nextIso = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    if (nextIso <= todayMonthIso) setCalendarMonth(nextIso);
  };

  useEffect(() => {
    void loadHistory(1, '', '', '');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <AlertDialog show={alertDialog.show} title={alertDialog.title} message={alertDialog.message} type={alertDialog.type} onClose={() => setAlertDialog({ ...alertDialog, show: false })} />

      <div style={{ background: `linear-gradient(135deg, ${C.sidebar}, #1E293B)`, borderRadius: 20, padding: '24px 28px', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', gap: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <QrCode size={27} />
            QR Activity History
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
            {role === 'super_admin' ? 'All QR generation and download activity' : 'Your QR generation and download activity'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'center', padding: '10px 18px', background: 'rgba(255,255,255,0.07)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', minWidth: 96 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#60A5FA' }}>{total.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>Activities</div>
          </div>
        </div>
      </div>

      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Filter size={18} style={{ color: C.red }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>Search & Filters</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{fromDate || toDate ? `${fromDate || 'Start'} to ${toDate || 'Today'}` : 'No date filter applied'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 300 }}>
              <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') applyFilters(); }}
                placeholder={role === 'super_admin' ? 'Search staff, email, product...' : 'Search product or batch...'}
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, color: C.text, outline: 'none', fontSize: 13 }}
              />
            </div>
            {[
              { label: 'Today', type: 'today' as const },
              { label: 'Weekly', type: 'weekly' as const },
              { label: 'Monthly', type: 'monthly' as const },
            ].map(item => (
              <button
                key={item.type}
                onClick={() => applyQuickFilter(item.type)}
                style={{ padding: '10px 13px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, cursor: 'pointer', fontSize: 12.5, fontWeight: 900 }}
              >
                {item.label}
              </button>
            ))}
            <label style={{ display: 'grid', gap: 4, fontSize: 10.5, fontWeight: 900, color: C.muted, textTransform: 'uppercase' }}>
              From
              <input type="date" value={fromDate} max={todayIso} onChange={e => {
                const next = e.target.value > todayIso ? todayIso : e.target.value;
                setFromDate(next);
                if (toDate && next && toDate < next) setToDate(next);
              }} style={{ padding: '8px 9px', borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.bg, color: C.text, outline: 'none', fontSize: 12.5 }} />
            </label>
            <label style={{ display: 'grid', gap: 4, fontSize: 10.5, fontWeight: 900, color: C.muted, textTransform: 'uppercase' }}>
              To
              <input type="date" value={toDate} min={fromDate || undefined} max={todayIso} onChange={e => setToDate(e.target.value > todayIso ? todayIso : e.target.value)} style={{ padding: '8px 9px', borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.bg, color: C.text, outline: 'none', fontSize: 12.5 }} />
            </label>
            <button onClick={() => applyFilters()} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: C.red, color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 900 }}>Search</button>
            <button onClick={() => setShowCalendar(previous => !previous)} style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: showCalendar ? '#FFF0F0' : C.bg, color: showCalendar ? C.red : C.text, cursor: 'pointer', fontSize: 13, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={15} />
              {showCalendar ? 'Hide Date Picker' : (selectedSingleDate || 'Date Wise')}
            </button>
            <button onClick={clearFilters} style={{ padding: '10px 13px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, cursor: 'pointer', fontSize: 12.5, fontWeight: 900 }}>Clear</button>
          </div>
        </div>

        {showCalendar && (
          <div style={{ padding: '16px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 380, maxWidth: '100%', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', background: C.bg }}>
              <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}` }}>
                <button onClick={() => shiftMonth(-1)} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, cursor: 'pointer', fontSize: 16, fontWeight: 900 }}>{'<'}</button>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 900 }}>{monthStart.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="month" value={calendarMonth} max={todayMonthIso} onChange={e => { if (e.target.value && e.target.value <= todayMonthIso) setCalendarMonth(e.target.value); }} style={{ width: 122, padding: '5px 7px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 11.5, fontWeight: 700 }} />
                  <button onClick={() => shiftMonth(1)} disabled={!canGoNextMonth} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: canGoNextMonth ? C.card : C.bg, color: canGoNextMonth ? C.text : C.muted, cursor: canGoNextMonth ? 'pointer' : 'not-allowed', fontSize: 16, fontWeight: 900 }}>{'>'}</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, padding: 8 }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <div key={`${day}-${index}`} style={{ textAlign: 'center', padding: '4px 0', fontSize: 10.5, color: C.muted, fontWeight: 900 }}>{day}</div>)}
                {calendarCells.map((cell, index) => cell ? (
                  <button key={cell.iso} disabled={cell.future} onClick={() => selectSingleDate(cell.iso)} style={{ height: 30, borderRadius: 8, border: selectedSingleDate === cell.iso ? `2px solid ${C.red}` : `1px solid ${C.border}`, background: cell.future ? '#F1F5F9' : selectedSingleDate === cell.iso ? '#FFF0F0' : C.card, color: cell.future ? C.muted : C.text, opacity: cell.future ? 0.55 : 1, cursor: cell.future ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 800 }}>{cell.day}</button>
                ) : <div key={`empty-${index}`} style={{ height: 30 }} />)}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                {['User Name', 'Email ID', 'Role', 'Action', 'Product Name', 'Batch', 'Qty', 'Date', 'Time'].map((head, index) => (
                  <th key={head} style={{ padding: '13px 16px', textAlign: index >= 5 ? 'center' : 'left', fontSize: 11, fontWeight: 900, color: C.muted, textTransform: 'uppercase' }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} style={{ padding: 38, textAlign: 'center', color: C.muted }}><RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} /><div style={{ fontSize: 13, fontWeight: 700 }}>Loading QR activity...</div></td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 42, textAlign: 'center', color: C.muted }}><Download size={34} style={{ opacity: 0.3, marginBottom: 8 }} /><div style={{ fontSize: 13, fontWeight: 700 }}>No QR activity found</div></td></tr>
              )}
              {!loading && rows.map(item => {
                const happenedAt = item.downloadedAt ?? item.createdAt;
                const generated = item.downloadType === 'generated';
                return (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: C.text, fontWeight: 800 }}>{item.adminName || '-'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 12.5, color: C.muted }}>{item.adminEmail || '-'}</td>
                    <td style={{ padding: '13px 16px' }}><span style={{ display: 'inline-flex', padding: '4px 9px', borderRadius: 999, background: '#E0F2FE', color: '#0369A1', fontSize: 11, fontWeight: 800 }}>{item.adminRole === 'super_admin' ? 'Super Admin' : item.adminRole === 'admin' ? 'Admin' : 'Staff'}</span></td>
                    <td style={{ padding: '13px 16px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 999, background: generated ? '#D1FAE5' : '#FEF3C7', color: generated ? '#047857' : '#B45309', fontSize: 11, fontWeight: 900 }}>{generated ? <QrCode size={12} /> : <Download size={12} />}{actionLabel(item.downloadType)}</span></td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: C.text, fontWeight: 700 }}>{item.productName || '-'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 12.5, color: C.text, fontFamily: 'monospace' }}>{item.batchNo ?? item.batchId ?? '-'}</td>
                    <td style={{ padding: '13px 16px', textAlign: 'center', fontSize: 13, color: C.text, fontWeight: 900 }}>{Number(item.quantity ?? 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '13px 16px', textAlign: 'center', fontSize: 12.5, color: C.text }}><Calendar size={12} style={{ verticalAlign: -2, marginRight: 4 }} />{formatISTDate(happenedAt)}</td>
                    <td style={{ padding: '13px 16px', textAlign: 'center', fontSize: 12.5, color: C.muted }}><Clock size={12} style={{ verticalAlign: -2, marginRight: 4 }} />{formatISTDateTime(happenedAt).split(', ').pop()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {total > PAGE_SIZE && (
          <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12.5, color: C.muted }}>Showing <strong style={{ color: C.text }}>{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)}</strong> of <strong style={{ color: C.text }}>{total.toLocaleString('en-IN')}</strong> activities</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => { const next = Math.max(1, page - 1); setPage(next); void loadHistory(next); }} disabled={page === 1} style={{ padding: '7px 13px', borderRadius: 8, border: `1px solid ${C.border}`, background: page === 1 ? C.bg : C.card, color: page === 1 ? C.muted : C.text, cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 700 }}>Prev</button>
              <span style={{ fontSize: 12.5, color: C.muted }}>Page {page} / {totalPages}</span>
              <button onClick={() => { const next = Math.min(totalPages, page + 1); setPage(next); void loadHistory(next); }} disabled={page >= totalPages} style={{ padding: '7px 13px', borderRadius: 8, border: `1px solid ${C.border}`, background: page >= totalPages ? C.bg : C.card, color: page >= totalPages ? C.muted : C.text, cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontWeight: 700 }}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
