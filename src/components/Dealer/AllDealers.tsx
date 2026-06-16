'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { FileSpreadsheet, Plus, Store, CheckCircle, Bolt, Clock, MapPin, Phone, Building2, Target, Check, Pencil, SlidersHorizontal, Calendar, Trash2 } from 'lucide-react';
import { dealerApi, financeApi } from '@/lib/api';
import type { Dealer, MemberTier, UserStatus, AdminRole } from '@/lib/types';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAppContext } from '@/lib/appContext';
import { useThemePalette } from '@/lib/theme';
import AlertDialog from '@/components/Shared/AlertDialog';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import ExportModal from '@/components/Shared/ExportModal';
import ImportModal from '@/components/Shared/ImportModal';
import PasswordInputField from '@/components/Shared/PasswordInputField';
import CustomerActivityPanel from '@/components/Shared/CustomerActivityPanel';
import { I } from '@/lib/iconMap';
import { formatISTDate } from '@/lib/dateIST';

interface DealersProps {
  role: AdminRole;
  onNavigate?: (id: string) => void;
}

const TIER_CONFIG: Record<MemberTier, { bg: string; color: string; icon: string; bar: string; max: number }> = {
  Silver: { bg: '#F1F5F9', color: '#475569', icon: '', bar: '#94A3B8', max: 110 },
  Gold: { bg: '#FFFBEB', color: '#92400E', icon: '', bar: '#F59E0B', max: 200 },
  Platinum: { bg: '#F5F3FF', color: '#5B21B6', icon: '', bar: '#8B5CF6', max: 300 },
  Diamond: { bg: '#EFF6FF', color: '#1D4ED8', icon: '', bar: '#3B82F6', max: 999 },
};

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: '#D1FAE5', color: '#065F46', label: 'Active' },
  pending: { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
  inactive: { bg: '#FEE2E2', color: '#991B1B', label: 'Inactive' },
  suspended: { bg: '#FEE2E2', color: '#7F1D1D', label: 'Suspended' },
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to update password';
}

function ViewModal({
  dealer,
  onClose,
  onEdit,
  permissions,
  onPasswordSave,
}: {
  dealer: Dealer;
  onClose: () => void;
  onEdit: () => void;
  permissions: { canEdit: boolean };
  onPasswordSave: (password: string) => Promise<void>;
}) {
  const C = useThemePalette();
  const mouseDownInside = React.useRef(false);
  const tier = TIER_CONFIG[dealer.tier] ?? TIER_CONFIG['Silver'];
  const status = STATUS_CONFIG[dealer.status] ?? STATUS_CONFIG['inactive'];
  const linkedElectricians: Array<{ id: string; name: string; subCategory?: string; tier?: string }> = [];
  const progress = Math.min(100, (dealer.electricianCount / tier.max) * 100);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const loadActivity = useCallback((id: string) => dealerApi.getActivity(id), []);

  const handlePasswordSubmit = async () => {
    const nextPassword = password.trim();
    const nextConfirmPassword = confirmPassword.trim();

    if (!nextPassword) {
      setPasswordFeedback({ type: 'error', message: 'Enter a new password first.' });
      return;
    }

    if (nextPassword !== nextConfirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'New password and confirm password must match.' });
      return;
    }

    try {
      setSavingPassword(true);
      await onPasswordSave(nextPassword);
      setPassword('');
      setConfirmPassword('');
      setPasswordFeedback({ type: 'success', message: `Password ${dealer.hasPassword ? 'reset' : 'set'} successfully.` });
    } catch (error: unknown) {
      setPasswordFeedback({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: C.overlay, backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onMouseDown={() => { mouseDownInside.current = false; }}
      onMouseUp={() => { if (!mouseDownInside.current) onClose(); }}
    >
      <div
        style={{ background: C.card, borderRadius: 20, width: 920, maxWidth: '96vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }}
        onMouseDown={e => { e.stopPropagation(); mouseDownInside.current = true; }}
        onMouseUp={e => e.stopPropagation()}
      >
        <div style={{ background: C.heroGradient, padding: '24px 28px', borderRadius: '20px 20px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, overflow: 'hidden', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                {dealer.profileImage ? <img src={dealer.profileImage} alt={dealer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Store size={28} />}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{dealer.name}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{dealer.dealerCode}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', color: 'white', fontSize: 16 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <span style={{ background: tier.bg, color: tier.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{tier.icon} {dealer.tier}</span>
            <span style={{ background: status.bg, color: status.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{status.label}</span>
            {dealer.bankLinked && <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>Bank Linked</span>}
          </div>
        </div>

        <div style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 22 }}>
            {[
              { label: 'Electricians', value: dealer.electricianCount, Icon: Bolt },
              { label: 'Dealer Bonus', value: `₹${Number(dealer.bonusPoints ?? 0).toLocaleString('en-IN')}`, Icon: Target },
            ].map((s, i) => (
              <div key={i} style={{ background: C.bg, borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, color: C.muted }}><s.Icon size={20} /></div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{s.value}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tier progress */}
          <div style={{ background: C.bg, borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>TIER PROGRESS ({dealer.electricianCount}/{tier.max} electricians)</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: tier.color }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: tier.bar, borderRadius: 4, transition: 'width 1s ease' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Town', value: dealer.town }, { label: 'District', value: dealer.district },
              { label: 'State', value: dealer.state }, { label: 'Phone', value: dealer.phone },
              { label: 'Email', value: dealer.email || '—' }, { label: 'GST Number', value: dealer.gstNumber },
              { label: 'Pincode', value: dealer.pincode || '—' }, { label: 'Joined', value: formatISTDate(dealer.joinedDate) },
            ].map((d, i) => (
              <div key={i} style={{ background: C.bg, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 2, textTransform: 'uppercase', fontWeight: 600 }}>{d.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{d.value}</div>
              </div>
            ))}
          </div>

          {/* Address */}
          <div style={{ background: C.bg, borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Full Address</div>
            <div style={{ fontSize: 13, color: C.text }}>{dealer.address}</div>
          </div>

          <CustomerActivityPanel
            customerId={dealer.id}
            roleLabel="Dealer"
            loadActivity={loadActivity}
          />

          <div style={{ background: C.bg, borderRadius: 14, padding: '16px 16px 18px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>App Password</div>
                <div style={{ fontSize: 13, color: C.text }}>
                  Password status: <strong>{dealer.hasPassword ? 'Set' : 'Not set'}</strong>
                </div>
              </div>
              <span style={{ background: dealer.hasPassword ? '#D1FAE5' : '#FEF3C7', color: dealer.hasPassword ? '#065F46' : '#92400E', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 999 }}>
                {dealer.hasPassword ? 'Password Active' : 'Needs Password'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: permissions.canEdit ? 14 : 0 }}>
              For security, the current password cannot be viewed here. You can set or reset it from this panel.
            </div>
            {permissions.canEdit && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <PasswordInputField
                    value={password}
                    onChange={setPassword}
                    placeholder="New password"
                  />
                  <PasswordInputField
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Confirm password"
                  />
                </div>
                {passwordFeedback && (
                  <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 600, color: passwordFeedback.type === 'success' ? '#065F46' : '#B91C1C' }}>
                    {passwordFeedback.message}
                  </div>
                )}
                <button
                  onClick={() => { void handlePasswordSubmit(); }}
                  disabled={savingPassword}
                  style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 10, padding: '11px 16px', fontSize: 13, fontWeight: 700, cursor: savingPassword ? 'wait' : 'pointer', opacity: savingPassword ? 0.75 : 1 }}
                >
                  {savingPassword ? 'Saving Password...' : dealer.hasPassword ? 'Reset Password' : 'Set Password'}
                </button>
              </>
            )}
          </div>

          {/* Linked Electricians */}
          {linkedElectricians.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Bolt size={14} style={{ color: C.red }} /> Linked Electricians ({linkedElectricians.length})</div>
              {linkedElectricians.slice(0, 4).map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: C.bg, borderRadius: 10, marginBottom: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: C.red }}>{e.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{e.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{e.subCategory}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>{e.tier}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            {permissions.canEdit && (
              <button onClick={onEdit} style={{ flex: 1, background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Pencil size={14} /> Edit Dealer</button>
            )}
            <button onClick={onClose} style={{ background: C.bg, color: C.muted, border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditModal({ dealer, onClose, onSave }: { dealer: Dealer | null; onClose: () => void; onSave: (d: Partial<Dealer>) => void }) {
  const C = useThemePalette();
  const mouseDownInside = React.useRef(false);
  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const isAdd = !dealer;
  const [form, setForm] = useState<Partial<Dealer>>(() => {
    const base = dealer ? { ...dealer, bonusPoints: 0 } : {
      name: '', profileImage: '', phone: '', email: '', dealerCode: '', town: '', district: '', state: '', address: '', pincode: '',
      tier: 'Silver', status: 'active', gstNumber: '', bankLinked: false, upiId: '', bonusPoints: 0, contactPerson: '', joinedDate: new Date().toISOString().split('T')[0],
      salesManName: '', townCode: '', rtoCode: '', listCode: '', electricianList: '',
    };
    return base as Partial<Dealer>;
  });
  const f = (k: keyof Dealer, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const handleImageFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => f('profileImage', String(reader.result ?? ''));
    reader.readAsDataURL(file);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: C.overlay, backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onMouseDown={() => { mouseDownInside.current = false; }}
      onMouseUp={() => { if (!mouseDownInside.current) onClose(); }}
    >
      <div
        style={{ background: C.card, borderRadius: 20, width: 640, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }}
        onMouseDown={e => { e.stopPropagation(); mouseDownInside.current = true; }}
        onMouseUp={e => e.stopPropagation()}
      >
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{isAdd ? 'Add New Dealer' : `Edit — ${dealer?.name}`}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{isAdd ? 'Register a new dealer in the network' : 'Update dealer profile and business info'}</div>
          </div>
          <button onClick={onClose} style={{ background: C.bg, border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>Profile Photo</div>
            </div>
            {form.profileImage && (
              <div style={{ gridColumn: '1/-1', lineHeight: 0 }}>
                <img src={form.profileImage} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', display: 'block', border: `1px solid ${C.border}` }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Profile Photo URL</label>
              <input style={inputStyle} value={form.profileImage ?? ''} onChange={e => f('profileImage', e.target.value)} placeholder="https://..." />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Choose From Files</label>
              <input type="file" accept="image/*" onChange={handleImageFile} style={{ ...inputStyle, padding: '6px 10px' }} />
            </div>

            <div style={{ gridColumn: '1/-1' }}><div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 6 }}><Building2 size={14} /> Business Information</div></div>
            <div>
              <label style={labelStyle}>Business Name *</label>
              <input style={inputStyle} value={form.name ?? ''} onChange={e => f('name', e.target.value)} placeholder="e.g. Pawan Electricals" />
            </div>
            <div>
              <label style={labelStyle}>Contact Person</label>
              <input style={inputStyle} value={form.contactPerson ?? ''} onChange={e => f('contactPerson', e.target.value)} placeholder="Owner/manager name" />
            </div>
            <div>
              <label style={labelStyle}>Phone *</label>
              <input style={inputStyle} type="tel" maxLength={10} value={form.phone ?? ''} onChange={e => {
                const val = e.target.value;
                if (/^\d*$/.test(val)) f('phone', val);
              }} placeholder="10-digit number" />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={form.email ?? ''} onChange={e => f('email', e.target.value)} placeholder="dealer@example.com" />
            </div>
            <div>
              <label style={labelStyle}>Dealer Code</label>
              <input style={inputStyle} value={form.dealerCode ?? ''} onChange={e => f('dealerCode', e.target.value)} placeholder="e.g. PB-05-800206-001" />
            </div>
            <div>
              <label style={labelStyle}>GST Number</label>
              <input style={inputStyle} value={form.gstNumber ?? ''} onChange={e => f('gstNumber', e.target.value)} placeholder="GST registration number" />
            </div>

            <div style={{ gridColumn: '1/-1', marginTop: 8 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>Location</div></div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Full Address</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 } as React.CSSProperties} value={form.address ?? ''} onChange={e => f('address', e.target.value)} placeholder="Shop/building, street, area" />
            </div>
            <div><label style={labelStyle}>Town *</label><input style={inputStyle} value={form.town ?? ''} onChange={e => {
              const val = e.target.value;
              if (/^[a-zA-Z\s]*$/.test(val) || val === '') f('town', val);
            }} placeholder="Town" /></div>
            <div><label style={labelStyle}>District</label><input style={inputStyle} value={form.district ?? ''} onChange={e => {
              const val = e.target.value;
              if (/^[a-zA-Z\s]*$/.test(val) || val === '') f('district', val);
            }} placeholder="District" /></div>
            <div><label style={labelStyle}>State *</label><input style={inputStyle} value={form.state ?? ''} onChange={e => {
              const val = e.target.value;
              if (/^[a-zA-Z\s]*$/.test(val) || val === '') f('state', val);
            }} placeholder="State" /></div>
            <div><label style={labelStyle}>Pincode</label><input style={inputStyle} type="tel" maxLength={6} value={form.pincode ?? ''} onChange={e => {
              const val = e.target.value;
              if (/^\d*$/.test(val)) f('pincode', val);
            }} placeholder="6-digit pincode" /></div>

            <div style={{ gridColumn: '1/-1', marginTop: 8 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>Account Settings</div></div>
            <div><label style={labelStyle}>Tier</label>
              <select style={inputStyle} value={form.tier ?? 'Silver'} onChange={e => f('tier', e.target.value as MemberTier)}>
                {(['Silver','Gold','Platinum','Diamond'] as MemberTier[]).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status ?? 'active'} onChange={e => f('status', e.target.value as UserStatus)}>
                <option value="active">Active</option><option value="pending">Pending</option><option value="inactive">Inactive</option>
              </select>
            </div>
            <div><label style={labelStyle}>UPI ID</label><input style={inputStyle} value={form.upiId ?? ''} onChange={e => f('upiId', e.target.value)} placeholder="name@bank" /></div>
            <div><label style={labelStyle}>Bank Linked</label>
              <select style={inputStyle} value={form.bankLinked ? 'yes' : 'no'} onChange={e => f('bankLinked', e.target.value === 'yes')}>
                <option value="yes">Yes</option><option value="no">No</option>
              </select>
            </div>
            {!isAdd && dealer && Number(dealer.bonusPoints) > 0 && (
              <div style={{ fontSize: 12, color: C.muted, marginBottom: -8, padding: '4px 0' }}>
                Current Bonus: <strong style={{ color: '#15803D' }}>₹{Number(dealer.bonusPoints).toLocaleString('en-IN')}</strong>
              </div>
            )}
            <div><label style={labelStyle}>Add Bonus (₹)</label><input style={inputStyle} type="number" min={0} value={form.bonusPoints ?? ''} onChange={e => f('bonusPoints', e.target.value === '' ? '' : +e.target.value)} placeholder="0" /></div>

          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button onClick={() => onSave(form)} style={{ flex: 1, background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}>{isAdd ? 'Add Dealer' : 'Save Changes'}</button>
            <button onClick={onClose} style={{ background: C.bg, color: C.muted, border: 'none', borderRadius: 10, padding: '13px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dealers({ role }: DealersProps) {
  const C = useThemePalette();
  const [data, setData] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Server-side pagination ────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 50;

  // ── Filter state (declared before loadData so useCallback can close over them) ──
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [filterBank, setFilterBank] = useState('all');
  const [filterAppInstalled, setFilterAppInstalled] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });

  // ── Stats (fetched separately for accurate totals across all pages) ──
  const [dealerStats, setDealerStats] = useState({ total: 0, active: 0, pending: 0, inactive: 0 });
  const [allStates, setAllStates] = useState<string[]>([]);
  const [allCities, setAllCities] = useState<string[]>([]);
  const sanitizeOptions = (values: string[]) => Array.from(new Set(values.map(value => value.trim()).filter(value => value && value !== '?'))).sort((a, b) => a.localeCompare(b));

  const loadStats = async () => {
    try {
      const [stats, statesRes] = await Promise.all([
        dealerApi.getStats(),
        dealerApi.getDistinctStates(),
      ]);
      setDealerStats(stats);
      setAllStates(sanitizeOptions(statesRes.states ?? []));
    } catch (err) {
      console.error('Failed to load dealer stats:', err);
    }
  };

  const loadCities = useCallback(async (state: string) => {
    try {
      const citiesRes = await dealerApi.getDistinctCities(state !== 'all' ? { state } : undefined);
      setAllCities(sanitizeOptions(citiesRes.cities ?? []));
    } catch (err) {
      console.error('Failed to load dealer cities:', err);
      setAllCities([]);
    }
  }, []);

  const loadData = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        limit: String(PAGE_SIZE),
        page: String(page),
      };
      if (search) params.search = search;
      if (filterTier !== 'all') params.tier = filterTier;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterState !== 'all') params.state = filterState;
      if (filterCity !== 'all') params.city = filterCity;
      if (filterBank !== 'all') params.bankLinked = filterBank === 'linked' ? 'true' : 'false';
      if (filterAppInstalled !== 'all') params.appInstalled = filterAppInstalled === 'installed' ? 'true' : 'false';

      // Date filter → convert to dateFrom / dateTo
      if (dateFilter !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (dateFilter === 'today') {
          params.dateFrom = today.toISOString().split('T')[0];
          params.dateTo   = today.toISOString().split('T')[0];
        } else if (dateFilter === 'yesterday') {
          const y = new Date(today); y.setDate(y.getDate() - 1);
          params.dateFrom = y.toISOString().split('T')[0];
          params.dateTo   = y.toISOString().split('T')[0];
        } else if (dateFilter === 'week') {
          const w = new Date(today); w.setDate(w.getDate() - 7);
          params.dateFrom = w.toISOString().split('T')[0];
          params.dateTo   = today.toISOString().split('T')[0];
        } else if (dateFilter === 'month') {
          const m = new Date(today); m.setDate(m.getDate() - 30);
          params.dateFrom = m.toISOString().split('T')[0];
          params.dateTo   = today.toISOString().split('T')[0];
        } else if (dateFilter === 'custom' && customDateRange.from && customDateRange.to) {
          params.dateFrom = customDateRange.from;
          params.dateTo   = customDateRange.to;
        }
      }

      const res = await dealerApi.getAll(params);
      const items = Array.isArray(res) ? res : (res as any).data ?? [];
      const total = Array.isArray(res) ? items.length : (res as any).total ?? items.length;
      setTotalCount(total);
      setData(items);
    } catch (err) {
      console.error('Failed to load dealers:', err);
    } finally {
      setLoading(false);
    }
  }, [search, filterTier, filterStatus, filterState, filterCity, filterBank, filterAppInstalled, dateFilter, customDateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch from page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    loadData(1);
  }, [search, filterTier, filterStatus, filterState, filterCity, filterBank, filterAppInstalled, dateFilter, customDateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial load
  useEffect(() => { loadData(1); loadStats(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void loadCities(filterState);
  }, [filterState, loadCities]);

  useEffect(() => {
    if (filterCity !== 'all' && !allCities.includes(filterCity)) {
      setFilterCity('all');
    }
  }, [allCities, filterCity]);

  // Auto-refresh when tab becomes visible
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadData(currentPage); };
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(() => loadData(currentPage), 30000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, [currentPage, loadData]);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [viewing, setViewing] = useState<Dealer | null>(null);
  const [editing, setEditing] = useState<Dealer | null | undefined>(undefined);
  const [showAdd, setShowAdd] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'error' });

  // Get auth context and load permissions from database
  const { auth } = useAppContext();
  const userPermissions = useUserPermissions(auth.adminId ?? undefined, role);
  const permissions = {
    canCreate: userPermissions.canCreateInModule('dealers'),
    canEdit: userPermissions.canEditInModule('dealers'),
    canDelete: userPermissions.canDeleteInModule('dealers'),
  };
  
  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' };

  const uniqueStates = ['all', ...sanitizeOptions(allStates)];
  const uniqueCities = ['all', ...sanitizeOptions(allCities)];

  const filtered = data; // Server-side pagination handles filtering

  const handleSave = async (form: Partial<Dealer>) => {
    if (!form.name?.trim() || !form.phone?.trim() || !form.town?.trim() || !form.state?.trim()) {
      setAlertDialog({ show: true, title: 'Required Fields Missing', message: 'Please fill all required fields: Name, Phone, Town, and State', type: 'error' });
      return;
    }
    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      setAlertDialog({ show: true, title: 'Invalid Phone Number', message: 'Phone number must be exactly 10 digits', type: 'error' });
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setAlertDialog({ show: true, title: 'Invalid Email', message: 'Please enter a valid email address', type: 'error' });
      return;
    }
    const dealerData = {
      name: form.name,
      phone: form.phone,
      email: form.email && form.email.trim() !== '' ? form.email : undefined,
      dealerCode: form.dealerCode && form.dealerCode.trim() !== '' ? form.dealerCode : `DC-${Date.now()}`,
      contactPerson: form.contactPerson && form.contactPerson.trim() !== '' ? form.contactPerson : undefined,
      address: form.address && form.address.trim() !== '' ? form.address : form.town,
      town: form.town,
      district: form.district && form.district.trim() !== '' ? form.district : form.town,
      state: form.state,
      pincode: form.pincode && form.pincode.trim() !== '' ? form.pincode : undefined,
      tier: form.tier,
      status: form.status,
      gstNumber: form.gstNumber && form.gstNumber.trim() !== '' ? form.gstNumber : undefined,
      upiId: form.upiId && form.upiId.trim() !== '' ? form.upiId : undefined,
      profileImage: form.profileImage && form.profileImage.trim() !== '' ? form.profileImage : undefined,
      bankLinked: form.bankLinked,
      salesManName: form.salesManName && form.salesManName.trim() !== '' ? form.salesManName : undefined,
      townCode: form.townCode && form.townCode.trim() !== '' ? form.townCode : undefined,
      rtoCode: form.rtoCode && form.rtoCode.trim() !== '' ? form.rtoCode : undefined,
      listCode: form.listCode && form.listCode.trim() !== '' ? form.listCode : undefined,
      electricianList: form.electricianList && form.electricianList.trim() !== '' ? form.electricianList : undefined,
    };
    try {
      if (showAdd) {
        await dealerApi.create(dealerData);
        setShowAdd(false);
      } else {
        await dealerApi.update(editing!.id, dealerData);
        await financeApi.updateDealerBonus(editing!.id, {
          bonusPoints: typeof form.bonusPoints === 'number' ? form.bonusPoints : 0,
        });
        setEditing(undefined);
      }
      await loadData(currentPage);
    } catch (err: any) {
      setAlertDialog({ show: true, title: 'Error', message: err.message || 'Operation failed', type: 'error' });
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      try {
        await dealerApi.delete(deleteConfirm.id);
        setDeleteConfirm({ show: false, id: null });
        await loadData(currentPage);
      } catch (err: any) {
        setAlertDialog({ show: true, title: 'Error', message: err.message || 'Delete failed', type: 'error' });
      }
    }
  };

  const handlePasswordSave = async (password: string) => {
    if (!viewing) return;

    const updated = await dealerApi.setPassword(viewing.id, password);
    setViewing(updated);
    setData((current) => current.map((item) => (item.id === updated.id ? { ...item, hasPassword: updated.hasPassword } : item)));
    setAlertDialog({ show: true, title: 'Password Updated', message: 'Dealer app password saved successfully.', type: 'success' });
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      {viewing && <ViewModal dealer={viewing} onClose={() => setViewing(null)} onEdit={() => { setEditing(viewing); setViewing(null); }} permissions={permissions} onPasswordSave={handlePasswordSave} />}
      {((editing !== undefined && permissions.canEdit) || (showAdd && permissions.canCreate)) && <EditModal dealer={showAdd ? null : editing!} onClose={() => { setEditing(undefined); setShowAdd(false); }} onSave={handleSave} />}
      <AlertDialog show={alertDialog.show} title={alertDialog.title} message={alertDialog.message} type={alertDialog.type} onClose={() => setAlertDialog({ ...alertDialog, show: false })} />
      {deleteConfirm.show && <ConfirmDialog show={deleteConfirm.show} title="Delete Dealer" message={`Are you sure you want to delete this dealer? This action cannot be undone.`} confirmText="Delete" type="danger" onConfirm={confirmDelete} onCancel={() => setDeleteConfirm({ show: false, id: null })} />}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><Store size={24} style={{ color: C.red }} /> Dealers</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>Manage dealer network, tiers, targets and linked electricians</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowExport(true)} style={{ background: C.surface, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileSpreadsheet size={14} /> Export
          </button>
          <button onClick={() => setShowImport(true)} style={{ background: C.surface, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileSpreadsheet size={14} /> Import
          </button>
          {permissions.canCreate && (
            <button onClick={() => setShowAdd(true)} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={14} /> Add Dealer</button>
          )}
        </div>
      </div>

      <ExportModal
        show={showExport}
        onClose={() => setShowExport(false)}
        title="All Dealers"
        fileName="dealers"
        getData={() => data.map(d => ({
          Name: d.name,
          Phone: d.phone,
          Email: d.email ?? '',
          DealerCode: d.dealerCode,
          Town: d.town,
          District: d.district,
          State: d.state,
          Tier: d.tier,
          Status: d.status,
          ElectricianCount: d.electricianCount,
          DealerBonus: d.bonusPoints ?? 0,
          GSTNumber: d.gstNumber ?? '',
          BankLinked: d.bankLinked ? 'Yes' : 'No',
          JoinedDate: formatISTDate(d.joinedDate),
        }))}
      />

      <ImportModal
        show={showImport}
        onClose={() => setShowImport(false)}
        title="Dealers"
        sampleHeaders={['STATE','DISTRICT','DEALER NAME','SHOP/BUSINESS NAME','DEALER ADDRESS','GST/PAN NUMBER','PHONE NO.','SALES MAN NAME','TOWN','TOWN CODE','ELECTRICIAN LIST','LIST CODE','RTO CODE','DEALER CODE']}
        onImport={async (records) => {
          const res = await dealerApi.importMany(records);
          await loadData(currentPage);
          return res;
        }}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total Dealers', value: dealerStats.total, Icon: Store, color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'Active', value: dealerStats.active, Icon: CheckCircle, color: '#065F46', bg: '#D1FAE5' },
          { label: 'Pending Approval', value: dealerStats.pending, Icon: Clock, color: '#92400E', bg: '#FEF3C7' },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}><s.Icon size={20} /></div>
            <div><div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{s.value}</div><div style={{ fontSize: 12, color: s.color, fontWeight: 700 }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: C.card, borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}`, marginBottom: 18, display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dealer name, code, town, contact..." style={{ ...inputStyle, flex: 1 }} onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.red} onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />

        {/* Date Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={14} style={{ color: dateFilter !== 'all' ? C.red : C.muted }} />
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value as any)}
            style={{ padding: '9px 12px', border: `1.5px solid ${dateFilter !== 'all' ? C.red : C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: C.surface, color: C.text, cursor: 'pointer', minWidth: 120 }}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {dateFilter === 'custom' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" value={customDateRange.from} onChange={e => setCustomDateRange(prev => ({ ...prev, from: e.target.value }))}
              style={{ padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', background: C.surface, color: C.text }} />
            <span style={{ color: C.muted, fontSize: 12 }}>to</span>
            <input type="date" value={customDateRange.to} onChange={e => setCustomDateRange(prev => ({ ...prev, to: e.target.value }))}
              style={{ padding: '8px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', background: C.surface, color: C.text }} />
          </div>
        )}

{(filterTier !== 'all' || filterStatus !== 'all' || filterState !== 'all' || filterCity !== 'all' || filterBank !== 'all' || filterAppInstalled !== 'all' || dateFilter !== 'all') && (
          <button onClick={() => { setFilterTier('all'); setFilterStatus('all'); setFilterState('all'); setFilterCity('all'); setFilterBank('all'); setFilterAppInstalled('all'); setDateFilter('all'); setCustomDateRange({ from: '', to: '' }); }}
            style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.red}`, background: '#FFF0F0', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
            Clear Filters
          </button>
        )}

        {/* Filter icon button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowFilterPopup(p => !p)}
            style={{
              width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${showFilterPopup || (filterTier !== 'all' || filterStatus !== 'all' || filterState !== 'all' || filterCity !== 'all' || filterBank !== 'all' || filterAppInstalled !== 'all') ? C.red : C.border}`,
              background: showFilterPopup || (filterTier !== 'all' || filterStatus !== 'all' || filterState !== 'all' || filterCity !== 'all' || filterBank !== 'all' || filterAppInstalled !== 'all') ? '#FFF0F0' : C.card,
              color: showFilterPopup || (filterTier !== 'all' || filterStatus !== 'all' || filterState !== 'all' || filterCity !== 'all' || filterBank !== 'all' || filterAppInstalled !== 'all') ? C.red : C.muted,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative',
            }}
          >
            <SlidersHorizontal size={17} />
          </button>

          {/* Filter Modal - Centered Overlay */}
          {showFilterPopup && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowFilterPopup(false)}>
              <div style={{ background: C.card, borderRadius: 20, width: 460, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.25)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.red }}>
                      <SlidersHorizontal size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Filter Dealers</div>
                      <div style={{ fontSize: 12, color: C.muted }}>Narrow down results by category</div>
                    </div>
                  </div>
                  <button onClick={() => setShowFilterPopup(false)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
                <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { label: 'Tier', value: filterTier, set: setFilterTier, options: [['all','All Tiers'],['Silver','Silver'],['Gold','Gold'],['Platinum','Platinum'],['Diamond','Diamond']] },
                    { label: 'Status', value: filterStatus, set: setFilterStatus, options: [['all','All Status'],['active','Active'],['pending','Pending'],['inactive','Inactive']] },
                    { label: 'State', value: filterState, set: setFilterState, options: [['all','All States'], ...uniqueStates.filter(s => s !== 'all').map(s => [s, s])] },
                    { label: 'City', value: filterCity, set: setFilterCity, options: [['all','All Cities'], ...uniqueCities.filter(c => c !== 'all').map(c => [c, c])] },
                    { label: 'Bank Account', value: filterBank, set: setFilterBank, options: [['all','All'],['linked','Linked'],['not_linked','Not Linked']] },
                    { label: 'App Status', value: filterAppInstalled, set: setFilterAppInstalled, options: [['all','All'],['installed','App Installed'],['not_installed','Not Installed']] },
                  ].map(f => (
                    <div key={f.label}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{f.label}</div>
                      <select value={f.value} onChange={e => f.set(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${f.value !== 'all' ? C.red : C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text, cursor: 'pointer' }}>
                        {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10 }}>
                  <button onClick={() => { setFilterTier('all'); setFilterStatus('all'); setFilterState('all'); setFilterCity('all'); setFilterBank('all'); setFilterAppInstalled('all'); setDateFilter('all'); setCustomDateRange({ from: '', to: '' }); }}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Reset All
                  </button>
                  <button onClick={() => setShowFilterPopup(false)}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['grid','table'] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)} style={{ padding: '8px 14px', borderRadius: 8, border: `1.5px solid ${viewMode === v ? C.red : C.border}`, background: viewMode === v ? '#FFF0F0' : C.card, color: viewMode === v ? C.red : C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{v === 'grid' ? 'Grid' : 'Table'}</button>
          ))}
        </div>

        <span style={{ fontSize: 13, color: C.muted, whiteSpace: 'nowrap' }}>{filtered.length} of {totalCount} total</span>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>Loading dealers...</div>}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(d => {
            const tier = TIER_CONFIG[d.tier] ?? TIER_CONFIG['Silver'];
            const status = STATUS_CONFIG[d.status] ?? STATUS_CONFIG['inactive'];
            const progress = Math.min(100, (d.electricianCount / tier.max) * 100);
            return (
              <div key={d.id} style={{ background: C.card, borderRadius: 18, padding: 20, border: `1px solid ${C.border}`, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'; }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8' }}>
                      {d.profileImage ? <img src={d.profileImage} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Store size={22} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{d.dealerCode}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    <span style={{ background: tier.bg, color: tier.color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{tier.icon} {d.tier}</span>
                    <span style={{ background: status.bg, color: status.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{status.label}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {d.town}, {d.district}, {d.state}</div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: C.muted }}>Electricians registered</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{d.electricianCount}</span>
                  </div>
                  <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: tier.bar, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Next tier at {tier.max} electricians</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> {d.phone}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setViewing(d)} style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View</button>
                    {permissions.canEdit && <button onClick={() => setEditing(d)} style={{ background: '#FFF7ED', color: '#C2410C', border: 'none', borderRadius: 8, padding: '6px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>}
                    {permissions.canDelete && <button onClick={() => handleDelete(d.id)} style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, padding: '6px 8px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={13} /></button>}
                    {!permissions.canEdit && !permissions.canDelete && <span style={{ fontSize: 12, color: C.muted, fontStyle: 'italic' }}>View Only</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                {['Dealer','Location','Tier','Electricians','Status','Phone','App Installed','Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const tier = TIER_CONFIG[d.tier] ?? TIER_CONFIG['Silver'];
                const status = STATUS_CONFIG[d.status] ?? STATUS_CONFIG['inactive'];
                return (
                  <tr key={d.id} style={{ borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = C.hoverRow}
                    onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8', flexShrink: 0 }}>
                          {d.profileImage ? <img src={d.profileImage} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Store size={18} />}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{d.name}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{d.dealerCode}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: C.muted }}>{d.town}, {d.state}</td>
                    <td style={{ padding: '13px 16px' }}><span style={{ background: tier.bg, color: tier.color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{tier.icon} {d.tier}</span></td>
                    <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 800, color: C.text }}>{d.electricianCount}</td>
                    <td style={{ padding: '13px 16px' }}><span style={{ background: status.bg, color: status.color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{status.label}</span></td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: C.muted }}>{d.phone}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        background: (d as any).appInstalled ? '#D1FAE5' : '#FEF3C7',
                        color: (d as any).appInstalled ? '#065F46' : '#92400E',
                        fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap',
                      }}>
                        {(d as any).appInstalled ? '✓ Installed' : '✗ Not Installed'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setViewing(d)} style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 7, padding: '6px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View</button>
                        {permissions.canEdit && <button onClick={() => setEditing(d)} style={{ background: '#FFF7ED', color: '#C2410C', border: 'none', borderRadius: 7, padding: '6px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>}
                        {permissions.canDelete && <button onClick={() => handleDelete(d.id)} style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 7, padding: '6px 8px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={13} /></button>}
                        {!permissions.canEdit && !permissions.canDelete && <span style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', padding: '6px 8px' }}>View Only</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {totalCount > PAGE_SIZE && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: '12px 20px', background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, color: C.muted }}>
            Showing <strong style={{ color: C.text }}>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)}</strong> of <strong style={{ color: C.text }}>{totalCount.toLocaleString('en-IN')}</strong> dealers
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => { const p = Math.max(1, currentPage - 1); setCurrentPage(p); loadData(p); }}
              disabled={currentPage === 1}
              style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: currentPage === 1 ? C.bg : C.card, color: currentPage === 1 ? C.muted : C.text, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
            >← Prev</button>

            {/* Page number buttons */}
            {Array.from({ length: Math.min(7, Math.ceil(totalCount / PAGE_SIZE)) }, (_, i) => {
              const totalPages = Math.ceil(totalCount / PAGE_SIZE);
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => { setCurrentPage(pageNum); loadData(pageNum); }}
                  style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${currentPage === pageNum ? C.red : C.border}`, background: currentPage === pageNum ? C.red : C.card, color: currentPage === pageNum ? 'white' : C.text, cursor: 'pointer', fontSize: 13, fontWeight: currentPage === pageNum ? 700 : 500 }}
                >{pageNum}</button>
              );
            })}

            <button
              onClick={() => { const p = Math.min(Math.ceil(totalCount / PAGE_SIZE), currentPage + 1); setCurrentPage(p); loadData(p); }}
              disabled={currentPage >= Math.ceil(totalCount / PAGE_SIZE)}
              style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: currentPage >= Math.ceil(totalCount / PAGE_SIZE) ? C.bg : C.card, color: currentPage >= Math.ceil(totalCount / PAGE_SIZE) ? C.muted : C.text, cursor: currentPage >= Math.ceil(totalCount / PAGE_SIZE) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
