'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Eye, FileSpreadsheet, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { appUserApi } from '@/lib/api';
import type { AdminRole, AppUser, MemberTier, UserStatus } from '@/lib/types';
import { useAppContext } from '@/lib/appContext';
import { useThemePalette } from '@/lib/theme';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import AlertDialog from '@/components/Shared/AlertDialog';
import ExportModal from '@/components/Shared/ExportModal';
import ImportModal from '@/components/Shared/ImportModal';
import { ViewModeToggle, type ListViewMode } from '@/components/Shared/ViewModeToggle';
import SearchableSelect from '@/components/Shared/SearchableSelect';
import PasswordInputField from '@/components/Shared/PasswordInputField';
import { formatISTDate } from '@/lib/dateIST';

interface AllAppUsersProps {
  role: AdminRole;
}

type AppUserForm = Partial<AppUser> & {
  password?: string;
};

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: '#D1FAE5', color: '#065F46', label: 'Active' },
  pending: { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
  inactive: { bg: '#FEE2E2', color: '#991B1B', label: 'Inactive' },
  suspended: { bg: '#FEE2E2', color: '#7F1D1D', label: 'Suspended' },
};

const SELECTABLE_USER_STATUSES: UserStatus[] = ['active', 'pending', 'inactive'];

const TIER_CONFIG: Record<MemberTier, { bg: string; color: string }> = {
  Silver: { bg: '#F1F5F9', color: '#475569' },
  Gold: { bg: '#FFFBEB', color: '#92400E' },
  Platinum: { bg: '#F5F3FF', color: '#5B21B6' },
  Diamond: { bg: '#EFF6FF', color: '#1D4ED8' },
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to save customer';
}

function ViewModal({
  user,
  onClose,
  onEdit,
  canEdit,
  onPasswordSave,
}: {
  user: AppUser;
  onClose: () => void;
  onEdit: () => void;
  canEdit: boolean;
  onPasswordSave: (password: string) => Promise<void>;
}) {
  const C = useThemePalette();
  const mouseDownInside = React.useRef(false);
  const status = STATUS_CONFIG[user.status] ?? STATUS_CONFIG.pending;
  const tier = TIER_CONFIG[user.tier] ?? TIER_CONFIG.Silver;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
      setPasswordFeedback({ type: 'success', message: `Password ${user.hasPassword ? 'reset' : 'set'} successfully.` });
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
        style={{ background: C.card, borderRadius: 20, width: 620, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }}
        onMouseDown={e => { e.stopPropagation(); mouseDownInside.current = true; }}
        onMouseUp={e => e.stopPropagation()}
      >
        <div style={{ background: C.heroGradient, padding: '24px 28px', borderRadius: '20px 20px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 58, height: 58, borderRadius: 16, overflow: 'hidden', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8', fontSize: 24, fontWeight: 800 }}>
                {user.profileImage ? <img src={user.profileImage} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user.name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{user.name}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{user.userCode} · {user.phone}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', color: 'white', fontSize: 16 }}>x</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <span style={{ background: status.bg, color: status.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>{status.label}</span>
            <span style={{ background: tier.bg, color: tier.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>{user.tier}</span>
            <span style={{ background: user.kycStatus === 'approved' ? '#D1FAE5' : '#FEF3C7', color: user.kycStatus === 'approved' ? '#065F46' : '#92400E', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>
              KYC {user.kycStatus || 'pending'}
            </span>
            {user.bankLinked && <span style={{ background: '#E0F2FE', color: '#075985', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>Bank Linked</span>}
          </div>
        </div>

        <div style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 22 }}>
            {[
              { label: 'Total Points', value: (user.totalPoints ?? 0).toLocaleString('en-IN'), color: '#F59E0B' },
              { label: 'Wallet Balance', value: `Rs ${(user.walletBalance ?? 0).toLocaleString('en-IN')}`, color: '#10B981' },
              { label: 'Redemptions', value: (user.totalRedemptions ?? 0).toLocaleString('en-IN'), color: '#3B82F6' },
            ].map((item) => (
              <div key={item.label} style={{ background: C.bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', fontWeight: 700 }}>{item.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: item.color, marginTop: 6 }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            {[
              { label: 'Email', value: user.email || '-' },
              { label: 'City', value: user.city || '-' },
              { label: 'District', value: user.district || '-' },
              { label: 'State', value: user.state || '-' },
              { label: 'Pincode', value: user.pincode || '-' },
              { label: 'UPI ID', value: user.upiId || '-' },
              { label: 'Bank Name', value: user.bankName || '-' },
              { label: 'Account Holder', value: user.accountHolderName || '-' },
              { label: 'Bank Account', value: user.bankAccount || '-' },
              { label: 'IFSC', value: user.ifsc || '-' },
              { label: 'Joined', value: user.joinedDate ? formatISTDate(user.joinedDate) : '-' },
              { label: 'Aadhaar', value: user.aadharNumber || '-' },
            ].map((item) => (
              <div key={item.label} style={{ background: C.bg, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 2, textTransform: 'uppercase', fontWeight: 700 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: C.bg, borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', fontWeight: 700 }}>Address</div>
            <div style={{ fontSize: 13, color: C.text }}>{user.address || '-'}</div>
          </div>

          <div style={{ background: C.bg, borderRadius: 14, padding: '16px 16px 18px', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>App Password</div>
                <div style={{ fontSize: 13, color: C.text }}>
                  Password status: <strong>{user.hasPassword ? 'Set' : 'Not set'}</strong>
                </div>
              </div>
              <span style={{ background: user.hasPassword ? '#D1FAE5' : '#FEF3C7', color: user.hasPassword ? '#065F46' : '#92400E', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 999 }}>
                {user.hasPassword ? 'Password Active' : 'Needs Password'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: canEdit ? 14 : 0 }}>
              For security, the current password cannot be viewed here. You can set or reset it from this panel.
            </div>
            {canEdit && (
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
                  {savingPassword ? 'Saving Password...' : user.hasPassword ? 'Reset Password' : 'Set Password'}
                </button>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {canEdit && (
              <button onClick={onEdit} style={{ flex: 1, background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Edit Customer
              </button>
            )}
            <button onClick={onClose} style={{ background: C.bg, color: C.muted, border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditModal({ user, onClose, onSave }: { user: AppUser | null; onClose: () => void; onSave: (data: AppUserForm) => void }) {
  const C = useThemePalette();
  const mouseDownInside = React.useRef(false);
  const isAdd = !user;
  const [form, setForm] = useState<AppUserForm>(user ?? {
    name: '',
    phone: '',
    email: '',
    userCode: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    address: '',
    tier: 'Silver',
    status: 'pending',
    kycStatus: 'not_submitted',
    walletBalance: 0,
    totalPoints: 0,
    totalRedemptions: 0,
    bankLinked: false,
    upiId: '',
    bankName: '',
    accountHolderName: '',
    bankAccount: '',
    ifsc: '',
    password: '',
  });
  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' };
  const setField = (key: keyof AppUser, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: C.overlay, backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onMouseDown={() => { mouseDownInside.current = false; }}
      onMouseUp={() => { if (!mouseDownInside.current) onClose(); }}
    >
      <div
        style={{ background: C.card, borderRadius: 20, width: 680, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }}
        onMouseDown={e => { e.stopPropagation(); mouseDownInside.current = true; }}
        onMouseUp={e => e.stopPropagation()}
      >
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{isAdd ? 'Add Customer' : 'Edit Customer'}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{isAdd ? 'Create a new customer account from the admin panel' : 'Update customer profile, KYC, wallet and banking details'}</div>
          </div>
          <button onClick={onClose} style={{ background: C.bg, border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', fontSize: 16 }}>x</button>
        </div>

        <div style={{ padding: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={form.name ?? ''} onChange={e => setField('name', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} value={form.phone ?? ''} onChange={e => setField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} value={form.email ?? ''} onChange={e => setField('email', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>App Password</label>
            <input
              type="password"
              style={inputStyle}
              value={form.password ?? ''}
              onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder={isAdd ? 'Set login password' : 'Leave blank to keep current password'}
            />
          </div>
          <div>
            <label style={labelStyle}>User Code</label>
            <input
              style={inputStyle}
              value={form.userCode ?? ''}
              onChange={e => setField('userCode', e.target.value)}
              placeholder="Leave blank for auto-generated"
            />
          </div>
          <div>
            <label style={labelStyle}>City</label>
            <input style={inputStyle} value={form.city ?? ''} onChange={e => setField('city', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>District</label>
            <input style={inputStyle} value={form.district ?? ''} onChange={e => setField('district', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>State</label>
            <input style={inputStyle} value={form.state ?? ''} onChange={e => setField('state', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Pincode</label>
            <input style={inputStyle} value={form.pincode ?? ''} onChange={e => setField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} />
          </div>
          <div>
            <label style={labelStyle}>Tier</label>
            <select style={inputStyle} value={form.tier ?? 'Silver'} onChange={e => setField('tier', e.target.value as MemberTier)}>
              {(['Silver', 'Gold', 'Platinum', 'Diamond'] as MemberTier[]).map(tier => <option key={tier} value={tier}>{tier}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={form.status ?? 'active'} onChange={e => setField('status', e.target.value as UserStatus)}>
              {SELECTABLE_USER_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>KYC Status</label>
            <select style={inputStyle} value={form.kycStatus ?? 'pending'} onChange={e => setField('kycStatus', e.target.value)}>
              {['pending', 'approved', 'rejected'].map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Wallet Balance</label>
            <input style={inputStyle} type="number" value={form.walletBalance ?? 0} onChange={e => setField('walletBalance', Number(e.target.value || 0))} />
          </div>
          <div>
            <label style={labelStyle}>Total Points</label>
            <input style={inputStyle} type="number" value={form.totalPoints ?? 0} onChange={e => setField('totalPoints', Number(e.target.value || 0))} />
          </div>
          <div>
            <label style={labelStyle}>Total Redemptions</label>
            <input style={inputStyle} type="number" value={form.totalRedemptions ?? 0} onChange={e => setField('totalRedemptions', Number(e.target.value || 0))} />
          </div>
          <div>
            <label style={labelStyle}>UPI ID</label>
            <input style={inputStyle} value={form.upiId ?? ''} onChange={e => setField('upiId', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Bank Name</label>
            <input style={inputStyle} value={form.bankName ?? ''} onChange={e => setField('bankName', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Account Holder</label>
            <input style={inputStyle} value={form.accountHolderName ?? ''} onChange={e => setField('accountHolderName', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Bank Account</label>
            <input style={inputStyle} value={form.bankAccount ?? ''} onChange={e => setField('bankAccount', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>IFSC</label>
            <input style={inputStyle} value={form.ifsc ?? ''} onChange={e => setField('ifsc', e.target.value.toUpperCase())} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 24 }}>
            <input id="user-bank-linked" type="checkbox" checked={Boolean(form.bankLinked)} onChange={e => setField('bankLinked', e.target.checked)} />
            <label htmlFor="user-bank-linked" style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Bank Linked</label>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Address</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.address ?? ''} onChange={e => setField('address', e.target.value)} />
          </div>
        </div>

        <div style={{ padding: '0 28px 28px', display: 'flex', gap: 10 }}>
          <button onClick={() => onSave(form)} style={{ flex: 1, background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {isAdd ? 'Create Customer' : 'Save Changes'}
          </button>
          <button onClick={onClose} style={{ background: C.bg, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AllAppUsers({ role }: AllAppUsersProps) {
  const C = useThemePalette();
  const { auth } = useAppContext();
  const permissions = useUserPermissions((auth as { id?: string } | null)?.id, auth.role);

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [allStates, setAllStates] = useState<string[]>([]);
  const [allCities, setAllCities] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, inactive: 0 });
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [viewing, setViewing] = useState<AppUser | null>(null);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [viewMode, setViewMode] = useState<ListViewMode>('table');
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [alert, setAlert] = useState<{ show: boolean; type: 'success' | 'error'; title: string; message: string }>({ show: false, type: 'success', title: '', message: '' });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canEdit = permissions.canEditInModule('app_users');
  const canDelete = permissions.canDeleteInModule('app_users');
  const canExport = permissions.canExportFromModule('app_users');
  const canCreate = permissions.canCreateInModule('app_users');
  const LIMIT = 20;
  const sanitizeOptions = (values: string[]) => Array.from(new Set(values.map(value => value.trim()).filter(value => value && value !== '?'))).sort((a, b) => a.localeCompare(b));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (appStatusFilter) params.appInstalled = appStatusFilter;
      if (stateFilter) params.state = stateFilter;
      if (cityFilter) params.city = cityFilter;
      const [res, statesRes, citiesRes] = await Promise.all([
        appUserApi.getAll(params),
        appUserApi.getDistinctStates(),
        appUserApi.getDistinctCities(stateFilter ? { state: stateFilter } : undefined),
      ]);
      setUsers(res.data ?? []);
      setTotal(res.total ?? 0);
      setAllStates(sanitizeOptions(statesRes.states ?? []));
      setAllCities(sanitizeOptions(citiesRes.cities ?? []));
    } catch {
      setAlert({ show: true, type: 'error', title: 'Error', message: 'Failed to load customers' });
    } finally {
      setLoading(false);
    }
  }, [appStatusFilter, cityFilter, page, search, stateFilter, statusFilter]);

  useEffect(() => {
    if (cityFilter && !allCities.includes(cityFilter)) {
      setCityFilter('');
    }
  }, [allCities, cityFilter]);

  const loadStats = useCallback(async () => {
    try {
      const s = await appUserApi.getStats();
      setStats(s);
    } catch {}
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
      void loadStats();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load, loadStats]);

  const loadOne = async (id: string, mode: 'view' | 'edit') => {
    try {
      const data = await appUserApi.getOne(id);
      if (mode === 'view') setViewing(data);
      else setEditing(data);
    } catch {
      setAlert({ show: true, type: 'error', title: 'Error', message: 'Failed to load customer details' });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await appUserApi.updateStatus(id, status);
      setAlert({ show: true, type: 'success', title: 'Updated', message: 'Status updated successfully' });
      load();
      loadStats();
    } catch {
      setAlert({ show: true, type: 'error', title: 'Error', message: 'Failed to update status' });
    }
  };

  const handleSave = async (form: AppUserForm) => {
    if (!form.name?.trim() || !form.phone?.trim()) {
      setAlert({ show: true, type: 'error', title: 'Missing fields', message: 'Name and phone are required' });
      return;
    }

    try {
      const isEditing = Boolean(editing);
      const payload = { ...form };
      delete payload.hasPassword;
      const userCode = payload.userCode?.trim();
      if (userCode) {
        payload.userCode = userCode;
      } else {
        delete payload.userCode;
      }
      if (editing) {
        await appUserApi.update(editing.id, payload);
      } else {
        await appUserApi.create(payload);
      }
      setEditing(null);
      setShowAdd(false);
      setAlert({ show: true, type: 'success', title: isEditing ? 'Updated' : 'Created', message: isEditing ? 'Customer updated successfully' : 'Customer created successfully' });
      load();
      loadStats();
    } catch (error: unknown) {
      setAlert({ show: true, type: 'error', title: 'Error', message: getErrorMessage(error) });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await appUserApi.delete(deleteTarget.id);
      setAlert({ show: true, type: 'success', title: 'Deleted', message: 'Customer deleted successfully' });
      setDeleteTarget(null);
      setConfirmDelete(false);
      load();
      loadStats();
    } catch {
      setAlert({ show: true, type: 'error', title: 'Error', message: 'Failed to delete customer' });
    }
  };

  const totalPages = Math.ceil(total / LIMIT);
  void role;

  const handlePasswordSave = async (password: string) => {
    if (!viewing) return;

    const updated = await appUserApi.setPassword(viewing.id, password);
    setViewing(updated);
    setUsers((current) => current.map((item) => (item.id === updated.id ? { ...item, hasPassword: updated.hasPassword } : item)));
    setAlert({ show: true, type: 'success', title: 'Password Updated', message: 'Customer app password saved successfully.' });
  };

  return (
    <div style={{ padding: 32, background: C.bg, minHeight: '100vh' }}>
      {viewing && <ViewModal user={viewing} onClose={() => setViewing(null)} onEdit={() => { setEditing(viewing); setViewing(null); }} canEdit={canEdit} onPasswordSave={handlePasswordSave} />}
      {editing && <EditModal user={editing} onClose={() => setEditing(null)} onSave={handleSave} />}
      {showAdd && <EditModal user={null} onClose={() => setShowAdd(false)} onSave={handleSave} />}
      {alert.show && (
        <AlertDialog
          show={alert.show}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(a => ({ ...a, show: false }))}
        />
      )}
      {confirmDelete && deleteTarget && (
        <ConfirmDialog
          show={confirmDelete}
          title="Delete Customer"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => { setConfirmDelete(false); setDeleteTarget(null); }}
          confirmText="Delete"
          type="danger"
        />
      )}

      <ExportModal
        show={showExport}
        onClose={() => setShowExport(false)}
        title="All Customers"
        fileName="customers"
        getData={() => users.map(user => ({
          Name: user.name,
          Phone: user.phone,
          Email: user.email || '',
          Code: user.userCode,
          City: user.city || '',
          State: user.state || '',
          Tier: user.tier,
          Points: user.totalPoints ?? 0,
          WalletBalance: user.walletBalance ?? 0,
          KYCStatus: user.kycStatus || '',
          BankLinked: user.bankLinked ? 'Yes' : 'No',
          Status: user.status,
          JoinedDate: user.joinedDate || '',
        }))}
      />

      <ImportModal
        show={showImport}
        onClose={() => setShowImport(false)}
        title="Customers"
        onImport={async (records) => {
          const res = await appUserApi.importMany(records);
          load();
          loadStats();
          return res;
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: 0 }}>Customers</h1>
          <p style={{ color: C.muted, marginTop: 4, fontSize: 14 }}>Manage app users with the same visibility and export controls as other member sections</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {canExport && (
            <button onClick={() => setShowExport(true)} style={{ background: C.surface, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileSpreadsheet size={14} /> Export
            </button>
          )}
          {canExport && (
            <button onClick={() => setShowImport(true)} style={{ background: C.surface, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileSpreadsheet size={14} /> Import
            </button>
          )}
          {canCreate && (
            <button onClick={() => setShowAdd(true)} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> Add Customer
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Customers', value: stats.total, color: '#3B82F6' },
          { label: 'Active', value: stats.active, color: '#10B981' },
          { label: 'Pending', value: stats.pending, color: '#F59E0B' },
          { label: 'Inactive', value: stats.inactive, color: '#EF4444' },
        ].map((item) => (
          <div key={item.label} style={{ background: C.card, borderRadius: 14, padding: '18px 20px', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: item.color, marginTop: 6 }}>{item.value.toLocaleString('en-IN')}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.card, borderRadius: 14, padding: '16px 20px', marginBottom: 20, border: `1px solid ${C.border}`, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, phone, code..."
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: '9px 12px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, cursor: 'pointer' }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={appStatusFilter}
          onChange={e => { setAppStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: '9px 12px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, cursor: 'pointer' }}
        >
          <option value="">All App Status</option>
          <option value="true">App Installed</option>
          <option value="false">Not Installed</option>
        </select>
        <SearchableSelect value={stateFilter} placeholder="All States" options={[{ value: '', label: 'All States' }, ...allStates.map(state => ({ value: state, label: state }))]} onChange={(next) => { setStateFilter(next); setCityFilter(''); setPage(1); }} />
        <SearchableSelect value={cityFilter} placeholder="All Cities" options={[{ value: '', label: 'All Cities' }, ...allCities.map(city => ({ value: city, label: city }))]} onChange={(next) => { setCityFilter(next); setPage(1); }} />
        {(statusFilter || appStatusFilter || stateFilter || cityFilter) && (
          <button
            onClick={() => { setStatusFilter(''); setAppStatusFilter(''); setStateFilter(''); setCityFilter(''); setPage(1); }}
            style={{ padding: '9px 14px', borderRadius: 10, border: `1px solid ${C.red}`, background: '#FFF0F0', color: C.red, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
          >
            Clear Filters
          </button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <ViewModeToggle value={viewMode} onChange={setViewMode} accent={C.red} border={C.border} activeBg="#FFF0F0" inactiveBg={C.card} muted={C.muted} />
          <span style={{ fontSize: 13, color: C.muted, whiteSpace: 'nowrap' }}>{users.length} of {total}</span>
        </div>
        <button onClick={() => load()} style={{ padding: '9px 16px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, flexShrink: 0 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: C.muted, marginBottom: 12 }}>Loading customers...</div>}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
          {!loading && users.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48, color: C.muted, background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>No customers found</div>
            </div>
          ) : users.map((user) => {
            const status = STATUS_CONFIG[user.status] ?? STATUS_CONFIG.pending;
            const tier = TIER_CONFIG[user.tier] ?? TIER_CONFIG.Silver;
            return (
              <div
                key={user.id}
                style={{ background: C.card, borderRadius: 18, padding: 20, border: `1px solid ${C.border}`, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', transition: 'all 0.2s', cursor: 'pointer' }}
                onClick={event => { if (!(event.target as HTMLElement).closest('button,select,input,a')) void loadOne(user.id, 'view'); }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, overflow: 'hidden', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8', fontSize: 18, fontWeight: 800 }}>
                      {user.profileImage ? <img src={user.profileImage} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{user.name}</div>
                      <div style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>{user.userCode}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    <span style={{ background: tier.bg, color: tier.color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{user.tier}</span>
                    <span style={{ background: status.bg, color: status.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{status.label}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{[user.city, user.state].filter(Boolean).join(', ') || '—'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div style={{ background: C.bg, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: C.muted }}>Points</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#16A34A' }}>{(user.totalPoints ?? 0).toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ background: C.bg, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: C.muted }}>Wallet</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#10B981' }}>Rs {(user.walletBalance ?? 0).toLocaleString('en-IN')}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: C.muted }}>{user.phone}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={(event) => { event.stopPropagation(); loadOne(user.id, 'view'); }} style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View</button>
                    {canEdit && <button onClick={(event) => { event.stopPropagation(); loadOne(user.id, 'edit'); }} style={{ background: '#FFF7ED', color: '#C2410C', border: 'none', borderRadius: 8, padding: '6px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>}
                    {canDelete && <button onClick={(event) => { event.stopPropagation(); setDeleteTarget(user); setConfirmDelete(true); }} style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, padding: '6px 8px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={13} /></button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                {['Customer', 'Code', 'Location', 'Tier', 'Points', 'Wallet', 'App Status', 'Status', 'Joined', 'Actions'].map(header => (
                  <th key={header} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && users.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: C.muted }}>No customers found</td></tr>
              ) : users.map((user, index) => {
                const status = STATUS_CONFIG[user.status] ?? STATUS_CONFIG.pending;
                const tier = TIER_CONFIG[user.tier] ?? TIER_CONFIG.Silver;
                return (
                  <tr key={user.id} onClick={event => { if (!(event.target as HTMLElement).closest('button,select,input,a')) void loadOne(user.id, 'view'); }} style={{ borderBottom: `1px solid ${C.border}`, background: index % 2 === 0 ? C.card : C.bg, cursor: 'pointer' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#3B82F6', overflow: 'hidden', flexShrink: 0 }}>
                          {user.profileImage ? <img src={user.profileImage} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{user.name}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{user.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>{user.userCode}</td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: C.muted }}>{[user.city, user.state].filter(Boolean).join(', ') || '-'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: tier.bg, color: tier.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>{user.tier}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: '#16A34A' }}>{(user.totalPoints ?? 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: '#10B981' }}>Rs {(user.walletBalance ?? 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: user.appInstalled ? '#D1FAE5' : '#FEF3C7', color: user.appInstalled ? '#065F46' : '#92400E', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                        {user.appInstalled ? 'Installed' : 'Not Installed'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {canEdit ? (
                        <select
                          value={user.status}
                          onChange={e => handleStatusChange(user.id, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: 8, border: `1px solid ${C.border}`, background: status.bg, color: status.color, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          {SELECTABLE_USER_STATUSES.map((statusOption) => (
                            <option key={statusOption} value={statusOption}>{statusOption}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ background: status.bg, color: status.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>{status.label}</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>
                      {user.joinedDate ? formatISTDate(user.joinedDate) : '-'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button onClick={() => loadOne(user.id, 'view')} style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Eye size={13} /> View
                        </button>
                        {canEdit && (
                          <button onClick={() => loadOne(user.id, 'edit')} style={{ background: '#FFF7ED', color: '#C2410C', border: 'none', borderRadius: 8, padding: '6px 11px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Pencil size={13} /> Edit
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => { setDeleteTarget(user); setConfirmDelete(true); }} style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, padding: '6px 8px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: C.muted }}>Showing {((page - 1) * LIMIT) + 1}-{Math.min(page * LIMIT, total)} of {total}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, fontSize: 13 }}>Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1, fontSize: 13 }}>Next</button>
            </div>
          </div>
        )}
      </div>
      )}

      {totalPages > 1 && viewMode === 'grid' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '12px 20px', background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 13, color: C.muted }}>Showing {((page - 1) * LIMIT) + 1}-{Math.min(page * LIMIT, total)} of {total}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, fontSize: 13 }}>Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1, fontSize: 13 }}>Next</button>
          </div>
        </div>
      )}


    </div>
  );
}
