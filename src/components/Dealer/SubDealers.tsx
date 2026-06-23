'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, Store, Users, MapPin, Phone } from 'lucide-react';
import { dealerApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';

type SubDealer = {
  id: string;
  phone: string;
  name: string;
  district?: string | null;
  pincode?: string | null;
  electricianCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
};

type AssociatedElectrician = {
  id: string;
  name: string;
  phone: string;
  electricianCode?: string;
  subCategory?: string;
  tier?: string;
  status?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  totalPoints?: number;
  totalScans?: number;
};

export default function SubDealers() {
  const C = useThemePalette();
  const [rows, setRows] = useState<SubDealer[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState<SubDealer | null>(null);
  const [associatedElectricians, setAssociatedElectricians] = useState<AssociatedElectrician[]>([]);
  const [associatedLoading, setAssociatedLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await dealerApi.getSubDealers({ limit: '100', ...(search.trim() ? { search: search.trim() } : {}) });
      setRows(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load sub dealers.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const openAssociatedElectricians = async (row: SubDealer) => {
    setViewing(row);
    setAssociatedLoading(true);
    try {
      const response = await dealerApi.getSubDealerElectricians(row.id);
      setAssociatedElectricians(response.data ?? []);
    } catch {
      setAssociatedElectricians([]);
    } finally {
      setAssociatedLoading(false);
    }
  };

  const linkedElectricians = rows.reduce((sum, row) => sum + Number(row.electricianCount || 0), 0);
  const date = (value: string) => value ? new Date(value).toLocaleString('en-IN') : '—';

  return (
    <div style={{ padding: 24, color: C.text }}>
      {viewing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setViewing(null)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, width: 920, maxWidth: '96vw', maxHeight: '88vh', overflow: 'hidden', boxShadow: '0 25px 70px rgba(0,0,0,0.25)' }} onClick={event => event.stopPropagation()}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Associated Electricians</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>SRV Dealer · {viewing.phone}</div>
              </div>
              <button onClick={() => setViewing(null)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: C.muted }}>✕</button>
            </div>
            <div style={{ padding: 18, overflow: 'auto', maxHeight: 'calc(88vh - 78px)' }}>
              {associatedLoading ? (
                <div style={{ padding: 30, textAlign: 'center', color: C.muted }}>Loading associated electricians...</div>
              ) : associatedElectricians.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: C.muted }}>No associated electricians found for this dealer number.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                  <thead><tr style={{ background: C.surface, color: C.muted, textAlign: 'left' }}>
                    {['Electrician', 'Phone', 'Category', 'Location', 'Points', 'Scans', 'Status'].map((head) => <th key={head} style={{ padding: '12px 14px', fontSize: 12, fontWeight: 800 }}>{head}</th>)}
                  </tr></thead>
                  <tbody>{associatedElectricians.map((electrician) => (
                    <tr key={electrician.id} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: 14 }}><div style={{ fontWeight: 800 }}>{electrician.name}</div><div style={{ color: C.muted, fontSize: 12 }}>{electrician.electricianCode || '—'}</div></td>
                      <td style={{ padding: 14 }}>{electrician.phone}</td>
                      <td style={{ padding: 14 }}>{electrician.subCategory || electrician.tier || '—'}</td>
                      <td style={{ padding: 14, color: C.muted }}>{[electrician.city || electrician.district, electrician.state, electrician.pincode].filter(Boolean).join(', ') || '—'}</td>
                      <td style={{ padding: 14, fontWeight: 800, color: '#16A34A' }}>{Number(electrician.totalPoints ?? 0).toLocaleString('en-IN')}</td>
                      <td style={{ padding: 14, fontWeight: 800 }}>{Number(electrician.totalScans ?? 0).toLocaleString('en-IN')}</td>
                      <td style={{ padding: 14 }}><span style={{ background: electrician.status === 'active' ? '#D1FAE5' : '#FEF3C7', color: electrician.status === 'active' ? '#065F46' : '#92400E', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>{electrician.status || 'pending'}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>Sub Dealers</h1>
        <p style={{ margin: '6px 0 0', color: C.muted }}>Dealer numbers entered by electricians that are not registered in the dealer database.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginBottom: 18 }}>
        {[
          { label: 'Unregistered Dealer Numbers', value: total, Icon: Store },
          { label: 'Linked Electricians', value: linkedElectricians, Icon: Users },
        ].map(({ label, value, Icon }) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, boxShadow: C.shadow, display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: C.accentSoft, color: C.accentText, display: 'grid', placeItems: 'center' }}><Icon size={22} /></div>
            <div><div style={{ color: C.muted, fontSize: 13 }}>{label}</div><div style={{ fontSize: 26, fontWeight: 800 }}>{value}</div></div>
          </div>
        ))}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: C.shadow, overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ position: 'relative', maxWidth: 420 }}>
            <Search size={18} style={{ position: 'absolute', left: 13, top: 12, color: C.muted }} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search phone or district" style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px 11px 40px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, outline: 'none' }} />
          </div>
        </div>

        {error ? <div style={{ padding: 22, color: C.dangerText }}>{error}</div> : loading ? <div style={{ padding: 32, textAlign: 'center', color: C.muted }}>Loading sub dealers…</div> : rows.length === 0 ? <div style={{ padding: 32, textAlign: 'center', color: C.muted }}>No unregistered dealer numbers found.</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 850 }}>
              <thead><tr style={{ background: C.surface, color: C.muted, textAlign: 'left' }}>
                {['Dealer Name', 'Phone Number', 'District / Pincode', 'Electricians', 'First Seen', 'Last Seen'].map((head) => <th key={head} style={{ padding: '13px 16px', fontSize: 12, fontWeight: 700 }}>{head}</th>)}
              </tr></thead>
              <tbody>{rows.map((row) => <tr key={row.id} onClick={() => openAssociatedElectricians(row)} style={{ borderTop: `1px solid ${C.border}`, cursor: 'pointer' }}>
                <td style={{ padding: 16, fontWeight: 700 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Store size={17} color={C.accentText} />SRV Dealer</span></td>
                <td style={{ padding: 16 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><Phone size={15} color={C.muted} />{row.phone}</span></td>
                <td style={{ padding: 16 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><MapPin size={15} color={C.muted} />{row.district || '—'}{row.pincode ? ` - ${row.pincode}` : ''}</span></td>
                <td style={{ padding: 16, fontWeight: 700 }}><button onClick={(event) => { event.stopPropagation(); openAssociatedElectricians(row); }} style={{ border: 0, borderRadius: 999, background: C.accentSoft, color: C.accentText, padding: '6px 12px', fontWeight: 800, cursor: 'pointer' }}>View {row.electricianCount}</button></td>
                <td style={{ padding: 16, color: C.muted, fontSize: 13 }}>{date(row.firstSeenAt)}</td>
                <td style={{ padding: 16, color: C.muted, fontSize: 13 }}>{date(row.lastSeenAt)}</td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
