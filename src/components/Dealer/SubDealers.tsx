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

export default function SubDealers() {
  const C = useThemePalette();
  const [rows, setRows] = useState<SubDealer[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const linkedElectricians = rows.reduce((sum, row) => sum + Number(row.electricianCount || 0), 0);
  const date = (value: string) => value ? new Date(value).toLocaleString('en-IN') : '—';

  return (
    <div style={{ padding: 24, color: C.text }}>
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
              <tbody>{rows.map((row) => <tr key={row.id} style={{ borderTop: `1px solid ${C.border}` }}>
                <td style={{ padding: 16, fontWeight: 700 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Store size={17} color={C.accentText} />SRV Dealer</span></td>
                <td style={{ padding: 16 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><Phone size={15} color={C.muted} />{row.phone}</span></td>
                <td style={{ padding: 16 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><MapPin size={15} color={C.muted} />{row.district || '—'}{row.pincode ? ` - ${row.pincode}` : ''}</span></td>
                <td style={{ padding: 16, fontWeight: 700 }}>{row.electricianCount}</td>
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
