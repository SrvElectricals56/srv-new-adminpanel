'use client';
import { useState, useEffect } from 'react';
import { Landmark, Search, Eye, Pencil, Check, X, SlidersHorizontal, FileSpreadsheet, Trash2 } from 'lucide-react';
import { dealerApi } from '@/lib/api';
import type { Dealer, MemberTier } from '@/lib/types';
import { useThemePalette } from '@/lib/theme';
import ExportModal from '@/components/Shared/ExportModal';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';

const TIER_CONFIG: Record<MemberTier, { color: string; bg: string; icon: string }> = {
  Silver:   { color: '#475569', bg: '#F1F5F9', icon: '' },
  Gold:     { color: '#92400E', bg: '#FFFBEB', icon: '' },
  Platinum: { color: '#5B21B6', bg: '#F5F3FF', icon: '' },
  Diamond:  { color: '#1D4ED8', bg: '#EFF6FF', icon: '' },
};

function ViewModal({ d, onClose, C }: { d: Dealer; onClose: () => void; C: any }) {
  const tier = TIER_CONFIG[d.tier as MemberTier] ?? TIER_CONFIG['Silver'];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: 20, width: 540, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.25)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
        <div style={{ background: C.heroGradient, padding: '22px 26px', borderRadius: '20px 20px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{d.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{d.dealerCode}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'white', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Phone', value: d.phone },
            { label: 'Email', value: d.email ?? '—' },
            { label: 'Town', value: `${d.town}, ${d.state}` },
            { label: 'Tier', value: `${tier.icon} ${d.tier}` },
            { label: 'Bank Linked', value: d.bankLinked ? 'Yes' : 'No' },
            { label: 'UPI ID', value: d.upiId ?? '—' },
            { label: 'Bank Name', value: (d as any).bankName ?? '—' },
            { label: 'Account Holder', value: (d as any).accountHolderName ?? '—' },
            { label: 'Bank Account', value: (d as any).bankAccount ?? '—' },
            { label: 'IFSC', value: (d as any).ifsc ?? '—' },
            { label: 'GST Number', value: d.gstNumber ?? '—' },
            { label: 'Electricians', value: d.electricianCount.toString() },
          ].map(item => (
            <div key={item.label} style={{ background: C.bg, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditModal({ d, onClose, onSave, C }: { d: Dealer; onClose: () => void; onSave: (d: Dealer) => void; C: any }) {
  const [form, setForm] = useState({ ...d });
  const f = (k: keyof Dealer, v: any) => setForm(p => ({ ...p, [k]: v }));
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text, boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: 20, width: 560, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.25)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Edit Details — {d.name}</div>
          <button onClick={onClose} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: C.muted }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Dealer Info */}
          <div style={{ gridColumn: '1/-1', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>Dealer Info</div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Name</label>
            <input style={inputStyle} value={form.name} onChange={e => f('name', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Phone</label>
            <input style={inputStyle} value={form.phone} onChange={e => f('phone', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Email</label>
            <input style={inputStyle} value={form.email ?? ''} onChange={e => f('email', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Town</label>
            <input style={inputStyle} value={form.town} onChange={e => f('town', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>State</label>
            <input style={inputStyle} value={form.state} onChange={e => f('state', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Tier</label>
            <select style={inputStyle} value={form.tier} onChange={e => f('tier', e.target.value)}>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Platinum">Platinum</option>
              <option value="Diamond">Diamond</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Electricians Count</label>
            <input type="number" style={inputStyle} value={form.electricianCount ?? ''} onChange={e => f('electricianCount', e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          {/* Bank */}
          <div style={{ gridColumn: '1/-1', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', paddingBottom: 6, borderBottom: `1px solid ${C.border}`, marginTop: 4 }}>Bank Details</div>
          <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 12 }}>
            <input id="bank-linked-d" type="checkbox" checked={form.bankLinked} onChange={e => f('bankLinked', e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
            <label htmlFor="bank-linked-d" style={{ fontSize: 14, fontWeight: 700, color: C.text, cursor: 'pointer' }}>Bank Account Linked</label>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>UPI ID</label>
            <input style={inputStyle} value={form.upiId ?? ''} onChange={e => f('upiId', e.target.value)} placeholder="e.g. dealer@upi" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Account Holder Name</label>
            <input style={inputStyle} value={(form as any).accountHolderName ?? ''} onChange={e => f('accountHolderName' as any, e.target.value)} placeholder="Account holder name" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Bank Name</label>
            <input style={inputStyle} value={(form as any).bankName ?? ''} onChange={e => f('bankName' as any, e.target.value)} placeholder="Bank name" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Bank Account Number</label>
            <input style={inputStyle} value={(form as any).bankAccount ?? ''} onChange={e => f('bankAccount' as any, e.target.value)} placeholder="Account number" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>IFSC Code</label>
            <input style={inputStyle} value={(form as any).ifsc ?? ''} onChange={e => f('ifsc' as any, e.target.value)} placeholder="e.g. SBIN0001234" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>GST Number</label>
            <input style={inputStyle} value={form.gstNumber ?? ''} onChange={e => f('gstNumber', e.target.value)} placeholder="GST number" />
          </div>
        </div>
        <div style={{ padding: '0 24px 20px', display: 'flex', gap: 10 }}>
          <button onClick={() => onSave(form)} style={{ flex: 1, background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
          <button onClick={onClose} style={{ flex: 1, background: C.bg, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function DealerBankLinked() {
  const C = useThemePalette();
  const [data, setData] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dealerApi.getAll({ limit: '500' }).then(res => {
      setData(Array.isArray(res) ? res : (res as any).data ?? []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);
  const [search, setSearch] = useState('');
  const [filterBank, setFilterBank] = useState<'all' | 'linked' | 'not_linked'>('all');
  const [filterTier, setFilterTier] = useState('all');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [viewing, setViewing] = useState<Dealer | null>(null);
  const [editing, setEditing] = useState<Dealer | null>(null);
  const [confirmState, setConfirmState] = useState<{ show: boolean; id: string; linked: boolean }>({ show: false, id: '', linked: false });
  const [clearState, setClearState] = useState<{ show: boolean; row: Dealer | null }>({ show: false, row: null });

  const filtered = data.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = d.name.toLowerCase().includes(q) || d.phone.includes(q) || d.dealerCode.toLowerCase().includes(q) || d.town.toLowerCase().includes(q);
    const matchBank = filterBank === 'all' || (filterBank === 'linked' ? d.bankLinked : !d.bankLinked);
    const matchTier = filterTier === 'all' || d.tier === filterTier;
    return matchSearch && matchBank && matchTier;
  });

  const linked = data.filter(d => d.bankLinked).length;
  const notLinked = data.filter(d => !d.bankLinked).length;
  const activeFilters = [filterBank !== 'all', filterTier !== 'all'].filter(Boolean).length;

  const toggleBank = (id: string, currentLinked: boolean) => {
    setConfirmState({ show: true, id, linked: currentLinked });
  };

  const confirmToggle = async () => {
    try {
      await dealerApi.update(confirmState.id, { bankLinked: !confirmState.linked });
      setData(prev => prev.map(d => d.id === confirmState.id ? { ...d, bankLinked: !confirmState.linked } : d));
    } catch (err) { console.error(err); }
    setConfirmState({ show: false, id: '', linked: false });
  };

  const clearBankDetails = async () => {
    const row = clearState.row;
    if (!row) return;
    const cleared = { ...row, bankLinked: false, upiId: undefined, bankAccount: undefined, ifsc: undefined, bankName: undefined, accountHolderName: undefined } as Dealer;
    try {
      await dealerApi.update(row.id, { bankLinked: false, upiId: null, bankAccount: null, ifsc: null, bankName: null, accountHolderName: null });
      setData(prev => prev.map(d => d.id === row.id ? cleared : d));
    } catch (err) { console.error(err); }
    setClearState({ show: false, row: null });
  };

  const inputStyle: React.CSSProperties = { padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <ConfirmDialog show={confirmState.show} title={confirmState.linked ? 'Unlink Bank Account' : 'Link Bank Account'} message={`Are you sure you want to ${confirmState.linked ? 'unlink' : 'link'} this dealer's bank account?`} onConfirm={confirmToggle} onCancel={() => setConfirmState({ show: false, id: '', linked: false })} type={confirmState.linked ? 'danger' : 'success'} />
      <ConfirmDialog show={clearState.show} title="Delete Bank Details" message={`Clear all bank and UPI details for ${clearState.row?.name ?? 'this dealer'}?`} onConfirm={clearBankDetails} onCancel={() => setClearState({ show: false, row: null })} type="danger" />
      {viewing && <ViewModal d={viewing} onClose={() => setViewing(null)} C={C} />}
      {editing && <EditModal d={editing} onClose={() => setEditing(null)} onSave={async d => {
        try {
          // Only send allowed fields to backend (avoid forbidNonWhitelisted error)
          const payload = {
            name: d.name,
            phone: d.phone,
            email: d.email ?? null,
            town: d.town,
            state: d.state,
            tier: d.tier,
            bankLinked: d.bankLinked,
            upiId: d.upiId ?? null,
            bankAccount: (d as any).bankAccount ?? null,
            ifsc: (d as any).ifsc ?? null,
            bankName: (d as any).bankName ?? null,
            accountHolderName: (d as any).accountHolderName ?? null,
            gstNumber: d.gstNumber ?? null,
          };
          await dealerApi.update(d.id, payload);
          setData(prev => prev.map(x => x.id === d.id ? d : x));
        } catch (err) { console.error(err); }
        setEditing(null);
      }} C={C} />}
      <ExportModal show={showExport} onClose={() => setShowExport(false)} title="Dealer Bank Details" fileName="dealer-bank" getData={() => filtered.map(d => ({ Name: d.name, Code: d.dealerCode, Phone: d.phone, Town: d.town, Tier: d.tier, BankLinked: d.bankLinked ? 'Yes' : 'No', UPI: d.upiId ?? '', GST: d.gstNumber ?? '' }))} />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0284C7, #0369A1)', borderRadius: 18, padding: '22px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 24px rgba(2,132,199,0.25)' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}><Landmark size={26} /> Bank Linked</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>Manage dealer bank account & UPI details</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ label: 'Total', value: data.length, color: 'white' }, { label: 'Linked', value: linked, color: '#6EE7B7' }, { label: 'Not Linked', value: notLinked, color: '#FCA5A5' }].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '10px 16px', background: 'rgba(255,255,255,0.12)', borderRadius: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search + Filter + Export */}
      <div style={{ background: C.card, borderRadius: 14, padding: '12px 16px', border: `1px solid ${C.border}`, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, code, town..." style={{ ...inputStyle, paddingLeft: 32, width: '100%', boxSizing: 'border-box' }} />
        </div>
        {activeFilters > 0 && (
          <button onClick={() => { setFilterBank('all'); setFilterTier('all'); }} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.red}`, background: '#FFF0F0', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Clear</button>
        )}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowFilterPopup(p => !p)} style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${showFilterPopup || activeFilters > 0 ? C.red : C.border}`, background: showFilterPopup || activeFilters > 0 ? '#FFF0F0' : C.card, color: showFilterPopup || activeFilters > 0 ? C.red : C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <SlidersHorizontal size={16} />
            {activeFilters > 0 && <span style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: C.red, color: 'white', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilters}</span>}
          </button>
          {showFilterPopup && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowFilterPopup(false)}>
              <div style={{ background: C.card, borderRadius: 20, width: 400, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.25)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}><SlidersHorizontal size={16} /></div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Filter</div>
                  </div>
                  <button onClick={() => setShowFilterPopup(false)} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: C.muted, fontSize: 15 }}>✕</button>
                </div>
                <div style={{ padding: '18px 22px', display: 'grid', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 8 }}>Bank Status</div>
                    <select value={filterBank} onChange={e => setFilterBank(e.target.value as any)} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${filterBank !== 'all' ? C.red : C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text }}>
                      <option value="all">All</option>
                      <option value="linked">Linked</option>
                      <option value="not_linked">Not Linked</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 8 }}>Tier</div>
                    <select value={filterTier} onChange={e => setFilterTier(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${filterTier !== 'all' ? C.red : C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text }}>
                      <option value="all">All Tiers</option>
                      <option value="Silver">Silver</option>
                      <option value="Gold">Gold</option>
                      <option value="Platinum">Platinum</option>
                      <option value="Diamond">Diamond</option>
                    </select>
                  </div>
                </div>
                <div style={{ padding: '0 22px 18px', display: 'flex', gap: 10 }}>
                  <button onClick={() => { setFilterBank('all'); setFilterTier('all'); setShowFilterPopup(false); }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Reset</button>
                  <button onClick={() => setShowFilterPopup(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #0284C7, #0369A1)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apply</button>
                </div>
              </div>
            </div>
          )}
        </div>
        <button onClick={() => setShowExport(true)} style={{ background: C.card, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><FileSpreadsheet size={14} /> Export</button>
        <span style={{ fontSize: 13, color: C.muted, whiteSpace: 'nowrap' }}>{filtered.length} of {data.length}</span>
      </div>

      {/* Table */}
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
              {['Dealer', 'Code', 'Phone', 'Town', 'Tier', 'Bank Status', 'UPI / GST', 'Actions'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => {
              const tier = TIER_CONFIG[d.tier as MemberTier] ?? TIER_CONFIG['Silver'];
              return (
                <tr key={d.id} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.2s' }}
                  onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = C.bg}
                  onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: C.text }}>{d.name}</td>
                  <td style={{ padding: '14px 16px', fontSize: 12, fontWeight: 600, color: C.muted, fontFamily: 'monospace' }}>{d.dealerCode}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: C.text }}>{d.phone}</td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: C.muted }}>{d.town}, {d.state}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: tier.bg, color: tier.color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{tier.icon} {d.tier}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => toggleBank(d.id, d.bankLinked)} style={{ background: d.bankLinked ? '#D1FAE5' : '#FEE2E2', color: d.bankLinked ? '#065F46' : '#991B1B', border: 'none', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                      {d.bankLinked ? <><Check size={12} /> Linked</> : <><X size={12} /> Not Linked</>}
                    </button>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 12, color: C.text, fontFamily: 'monospace' }}>{d.upiId ?? d.gstNumber ?? <span style={{ color: C.muted }}>—</span>}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setViewing(d)} title="View" style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 7, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={14} /></button>
                      <button onClick={() => setEditing(d)} title="Edit" style={{ background: '#FFF7ED', color: '#C2410C', border: 'none', borderRadius: 7, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={14} /></button>
                      <button onClick={() => setClearState({ show: true, row: d })} title="Delete bank details" style={{ background: '#FEF2F2', color: '#B91C1C', border: 'none', borderRadius: 7, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center', color: C.muted }}>
                <Landmark size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>No results found</div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
