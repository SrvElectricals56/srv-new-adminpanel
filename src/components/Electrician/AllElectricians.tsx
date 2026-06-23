'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { FileSpreadsheet, Plus, Users, Star, ScanLine, Wallet, Trash2, SlidersHorizontal, Calendar, Medal, Award, Trophy, Gem } from 'lucide-react';
import { electricianApi, dealerApi } from '@/lib/api';
import type { Electrician, MemberTier, UserStatus, AdminRole } from '@/lib/types';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAppContext } from '@/lib/appContext';
import { useThemePalette } from '@/lib/theme';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import AlertDialog from '@/components/Shared/AlertDialog';
import ExportModal from '@/components/Shared/ExportModal';
import ImportModal from '@/components/Shared/ImportModal';
import { ViewModeToggle, type ListViewMode } from '@/components/Shared/ViewModeToggle';
import SearchableSelect from '@/components/Shared/SearchableSelect';
import PasswordInputField from '@/components/Shared/PasswordInputField';
import CustomerActivityPanel from '@/components/Shared/CustomerActivityPanel';
import { I } from '@/lib/iconMap';
import { formatISTDate, formatISTDateTime } from '@/lib/dateIST';

interface ElectriciansProps {
  role: AdminRole;
}

const TIER_CONFIG: Record<MemberTier, { bg: string; color: string; icon: string; bar: string }> = {
  Silver: { bg: '#F1F5F9', color: '#475569', icon: '', bar: '#94A3B8' },
  Gold: { bg: '#FFFBEB', color: '#92400E', icon: '', bar: '#F59E0B' },
  Platinum: { bg: '#F5F3FF', color: '#5B21B6', icon: '', bar: '#8B5CF6' },
  Diamond: { bg: '#EFF6FF', color: '#1D4ED8', icon: '', bar: '#3B82F6' },
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
  el,
  onClose,
  onEdit,
  permissions,
  onPasswordSave,
}: {
  el: Electrician;
  onClose: () => void;
  onEdit: () => void;
  permissions: { canEdit: boolean };
  onPasswordSave: (password: string) => Promise<void>;
}) {
  const C = useThemePalette();
  const mouseDownInside = React.useRef(false);
  const tier = TIER_CONFIG[el.tier];
  const status = STATUS_CONFIG[el.status];
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showScanHistory, setShowScanHistory] = useState(false);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [scanHistoryTotal, setScanHistoryTotal] = useState(0);
  const [scanHistoryPage, setScanHistoryPage] = useState(0);
  const [scanHistoryLoading, setScanHistoryLoading] = useState(false);
  const [showScanExport, setShowScanExport] = useState(false);
  const loadActivity = useCallback((id: string) => electricianApi.getActivity(id), []);

  const loadScanHistoryPage = async (page: number) => {
    if (scanHistoryLoading) return;
    setScanHistoryLoading(true);
    try {
      const response = await electricianApi.getScans(el.id, { page: String(page), limit: '100' });
      const rows = Array.isArray(response) ? response : response.data ?? [];
      setScanHistory(current => page === 1 ? rows : [...current, ...rows]);
      setScanHistoryTotal(Array.isArray(response) ? rows.length : response.total ?? 0);
      setScanHistoryPage(page);
    } finally {
      setScanHistoryLoading(false);
    }
  };

  const openScanHistory = () => {
    setShowScanHistory(true);
    if (!scanHistory.length) void loadScanHistoryPage(1);
  };

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
      setPasswordFeedback({ type: 'success', message: `Password ${el.hasPassword ? 'reset' : 'set'} successfully.` });
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
        style={{ background: C.card, borderRadius: 20, width: 920, maxWidth: '96vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }}
        onMouseDown={e => { e.stopPropagation(); mouseDownInside.current = true; }}
        onMouseUp={e => e.stopPropagation()}
      >
        <ExportModal show={showScanExport} onClose={() => setShowScanExport(false)} title={`${el.name} Scan History`} fileName={`${el.electricianCode || el.name}-scan-history`} getData={() => scanHistory.map(scan => ({ QRCode: scan.qrCodeId || '', Product: scan.productName || '', Type: scan.mode || 'single', Points: scan.points ?? 0, ScannedAt: scan.scannedAt, Location: scan.location || '' }))} />
        {/* Header */}
        <div style={{ background: C.heroGradient, padding: '24px 28px', borderRadius: '20px 20px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, overflow: 'hidden', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: 'white' }}>
                {el.profileImage ? <img src={el.profileImage} alt={el.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : el.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{el.name}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{el.electricianCode} · {el.phone}</div>
                {el.email && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}><I name='Mail' size={12} /> {el.email}</div>}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', color: 'white', fontSize: 16 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <span style={{ background: tier.bg, color: tier.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{el.tier}</span>
            <span style={{ background: status.bg, color: status.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{status.label}</span>
            <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>Electrician</span>
            {el.bankLinked && <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>Bank Linked</span>}
          </div>
        </div>

        <div style={{ padding: 28 }}>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 22 }}>
            {[
              { label: 'Total Points', value: el.totalPoints.toLocaleString('en-IN'), Icon: Star, color: '#F59E0B' },
              { label: 'Total Scans', value: el.totalScans, Icon: ScanLine, color: '#3B82F6' },
              { label: 'Wallet Balance', value: `₹${el.walletBalance}`, Icon: Wallet, color: '#10B981' },
            ].map((s, i) => (
              <div key={i} onClick={s.label === 'Total Scans' ? () => { void openScanHistory(); } : undefined} style={{ background: C.bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center', cursor: s.label === 'Total Scans' ? 'pointer' : 'default', border: s.label === 'Total Scans' ? '1px solid #BFDBFE' : '1px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, color: s.color }}><s.Icon size={20} /></div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{s.value}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {showScanHistory && (
            <div style={{ background: C.bg, borderRadius: 14, padding: 16, marginBottom: 22, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Scan History</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{scanHistory.length} of {scanHistoryTotal} scans shown</div>
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button onClick={() => setShowScanExport(true)} disabled={scanHistory.length === 0} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.text, borderRadius: 8, padding: '6px 10px', cursor: scanHistory.length ? 'pointer' : 'not-allowed', fontWeight: 700 }}>Export</button>
                  <button onClick={() => setShowScanHistory(false)} style={{ border: 'none', background: C.card, color: C.muted, borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Hide</button>
                </div>
              </div>
              {scanHistoryLoading ? (
                <div style={{ padding: 22, textAlign: 'center', color: C.muted }}>Loading scan history...</div>
              ) : scanHistory.length === 0 ? (
                <div style={{ padding: 22, textAlign: 'center', color: C.muted }}>No scans found for this electrician.</div>
              ) : (
                <div style={{ maxHeight: 280, overflowY: 'auto', borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ background: C.card }}>{['QR Code', 'Product', 'Type', 'Points', 'Scanned At'].map(h => <th key={h} style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, color: C.muted, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                    <tbody>{scanHistory.map(scan => <tr key={scan.id} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: '9px 10px', fontSize: 11, color: C.text, fontFamily: 'monospace' }}>{scan.qrCodeId || '—'}</td>
                      <td style={{ padding: '9px 10px', fontSize: 12, color: C.text }}>{scan.productName || '—'}</td>
                      <td style={{ padding: '9px 10px', fontSize: 11, color: C.muted, textTransform: 'capitalize' }}>{scan.mode || 'single'}</td>
                      <td style={{ padding: '9px 10px', fontSize: 12, color: '#16A34A', fontWeight: 800 }}>+{scan.points ?? 0}</td>
                      <td style={{ padding: '9px 10px', fontSize: 11, color: C.muted }}>{formatISTDateTime(scan.scannedAt)}</td>
                    </tr>)}</tbody>
                  </table>
                </div>
              )}
              {scanHistory.length < scanHistoryTotal && (
                <button onClick={() => { void loadScanHistoryPage(scanHistoryPage + 1); }} disabled={scanHistoryLoading} style={{ width: '100%', marginTop: 10, padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 9, background: C.card, color: C.text, fontWeight: 700, cursor: scanHistoryLoading ? 'wait' : 'pointer' }}>
                  {scanHistoryLoading ? 'Loading more...' : 'Load More Scan History'}
                </button>
              )}
            </div>
          )}

          {/* Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
            {[
              { label: 'City', value: el.city }, { label: 'District', value: el.district },
              { label: 'State', value: el.state }, { label: 'Dealer', value: el.dealerName },
              { label: 'Email', value: el.email || '—' },
              { label: 'Electrician Code', value: el.electricianCode },
              { label: 'Joined', value: formatISTDate(el.joinedDate) },
              { label: 'Category', value: 'Electrician' },
              { label: 'UPI ID', value: el.upiId || '—' },
              { label: 'Total Redemptions', value: el.totalRedemptions },
              { label: 'Last Active', value: el.recentActivity || '—' },
            ].map((d, i) => (
              <div key={i} style={{ background: C.bg, borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 2, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>{d.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{String(d.value)}</div>
              </div>
            ))}
          </div>

          <CustomerActivityPanel
            customerId={el.id}
            roleLabel="Electrician"
            loadActivity={loadActivity}
          />

          <div style={{ background: C.bg, borderRadius: 14, padding: '16px 16px 18px', marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>App Password</div>
                <div style={{ fontSize: 13, color: C.text }}>
                  Password status: <strong>{el.hasPassword ? 'Set' : 'Not set'}</strong>
                </div>
              </div>
              <span style={{ background: el.hasPassword ? '#D1FAE5' : '#FEF3C7', color: el.hasPassword ? '#065F46' : '#92400E', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 999 }}>
                {el.hasPassword ? 'Password Active' : 'Needs Password'}
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
                  {savingPassword ? 'Saving Password...' : el.hasPassword ? 'Reset Password' : 'Set Password'}
                </button>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {permissions.canEdit && (
              <button onClick={onEdit} style={{ flex: 1, background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}>Edit Electrician</button>
            )}
            <button onClick={onClose} style={{ background: C.bg, color: C.muted, border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditModal({ el, onClose, onSave, dealers = [] }: { el: Electrician | null; onClose: () => void; onSave: (data: Partial<Electrician>) => void; dealers?: { id: string; name: string; dealerCode: string }[] }) {
  const C = useThemePalette();
  // Track if mousedown started inside modal — prevents close on text-select drag
  const mouseDownInside = React.useRef(false);
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`,
    borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface,
    color: C.text, boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em',
  };
  const isAdd = !el;

  const [form, setForm] = useState<Partial<Electrician>>(() => {
    if (el) return el;
    return {
      name: '', profileImage: '', phone: '', email: '', city: '', state: '', district: '',
      electricianCode: '',
      tier: 'Silver', status: 'active', dealerId: '', dealerName: '', bankLinked: false,
      upiId: '', walletBalance: 0, totalPoints: 0, totalScans: 0, totalRedemptions: 0,
      recentActivity: 'Just joined', joinedDate: new Date().toISOString().split('T')[0],
    };
  });
  const f = (k: keyof Electrician, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const selectedDealer = dealers.find(d => d.id === form.dealerId);
  const autoCodePreview = selectedDealer ? `${selectedDealer.dealerCode}-001` : 'Auto-assigned by server';
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
        style={{ background: C.card, borderRadius: 20, width: 620, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }}
        onMouseDown={e => { e.stopPropagation(); mouseDownInside.current = true; }}
        onMouseUp={e => e.stopPropagation()}
      >
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{isAdd ? 'Add New Electrician' : `Edit — ${el?.name}`}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{isAdd ? 'Fill in all details to register a new electrician' : 'Update electrician profile and settings'}</div>
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

            {/* Personal Info */}
            <div style={{ gridColumn: '1/-1' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>Personal Information</div>
            </div>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} value={form.name ?? ''} onChange={e => f('name', e.target.value)} placeholder="e.g. Harshvardhan Singh" />
            </div>
            <div>
              <label style={labelStyle}>Phone Number *</label>
              <input style={inputStyle} type="tel" maxLength={10} value={form.phone ?? ''} onChange={e => {
                const val = e.target.value;
                if (/^\d*$/.test(val)) f('phone', val);
              }} placeholder="10-digit mobile number" />
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input style={inputStyle} type="email" value={form.email ?? ''} onChange={e => f('email', e.target.value.trim())} placeholder="e.g. name@example.com" />
            </div>
            <div>
              <label style={labelStyle}>Electrician Code</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...inputStyle, flex: 1, background: C.bg, color: C.text, fontFamily: 'monospace', fontWeight: 700 }}
                  value={form.electricianCode ?? ''}
                  onChange={e => f('electricianCode', e.target.value.toUpperCase())}
                  placeholder={autoCodePreview}
                />
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                {isAdd
                  ? (selectedDealer
                    ? `Leave blank to auto-assign the next serial like ${autoCodePreview}. You can also type a custom code manually.`
                    : 'Select a dealer, then leave this blank for auto-assignment or type a custom code manually.')
                  : 'You can change this code manually, or leave it unchanged.'}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <input style={inputStyle} value="Electrician" readOnly />
            </div>

            {/* Location */}
            <div style={{ gridColumn: '1/-1', marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>Location</div>
            </div>
            <div>
              <label style={labelStyle}>City *</label>
              <input style={inputStyle} value={form.city ?? ''} onChange={e => {
                const val = e.target.value;
                if (/^[a-zA-Z\s]*$/.test(val) || val === '') f('city', val);
              }} placeholder="City name" />
            </div>
            <div>
              <label style={labelStyle}>District</label>
              <input style={inputStyle} value={form.district ?? ''} onChange={e => {
                const val = e.target.value;
                if (/^[a-zA-Z\s]*$/.test(val) || val === '') f('district', val);
              }} placeholder="District" />
            </div>
            <div>
              <label style={labelStyle}>State *</label>
              <input style={inputStyle} value={form.state ?? ''} onChange={e => {
                const val = e.target.value;
                if (/^[a-zA-Z\s]*$/.test(val) || val === '') f('state', val);
              }} placeholder="State" />
            </div>

            {/* Dealer & Account */}
            <div style={{ gridColumn: '1/-1', marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>Dealer & Account</div>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Dealer</label>
              <select style={inputStyle} value={form.dealerId ?? ''} onChange={e => {
                const selected = dealers.find(d => d.id === e.target.value);
                f('dealerId', e.target.value || null);
                f('dealerName', selected?.name ?? '');
              }}>
                <option value="">— No Dealer —</option>
                {dealers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.dealerCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tier</label>
              <select style={inputStyle} value={form.tier ?? 'Silver'} onChange={e => f('tier', e.target.value as MemberTier)}>
                {(['Silver','Gold','Platinum','Diamond'] as MemberTier[]).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status ?? 'active'} onChange={e => f('status', e.target.value as UserStatus)}>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>UPI ID</label>
              <input style={inputStyle} value={form.upiId ?? ''} onChange={e => f('upiId', e.target.value)} placeholder="name@bank" />
            </div>
            <div>
              <label style={labelStyle}>Bank Linked</label>
              <select style={inputStyle} value={form.bankLinked ? 'yes' : 'no'} onChange={e => f('bankLinked', e.target.value === 'yes')}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            {!isAdd && (
              <>
                <div>
                  <label style={labelStyle}>Total Points</label>
                  <input style={inputStyle} type="number" value={form.totalPoints ?? ''} onChange={e => f('totalPoints', e.target.value === '' ? '' : +e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label style={labelStyle}>Wallet Balance (₹)</label>
                  <input style={inputStyle} type="number" value={form.walletBalance ?? ''} onChange={e => f('walletBalance', e.target.value === '' ? '' : +e.target.value)} placeholder="0" />
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button onClick={() => onSave(form)} style={{ flex: 1, background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}>
              {isAdd ? 'Add Electrician' : 'Save Changes'}
            </button>
            <button onClick={onClose} style={{ background: C.bg, color: C.muted, border: 'none', borderRadius: 10, padding: '13px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Electricians({ role }: ElectriciansProps) {
  const C = useThemePalette();
  const [data, setData] = useState<Electrician[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dealers, setDealers] = useState<{ id: string; name: string; dealerCode: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Server-side pagination state ──────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 50;

  // ── Filter state (declared before loadData so useCallback can close over them) ──
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBank, setFilterBank] = useState('all');
  const [filterWelcomeBonus, setFilterWelcomeBonus] = useState('all');
  const [filterElectricianGroup, setFilterElectricianGroup] = useState('all');
  const [filterAppInstalled, setFilterAppInstalled] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });

  // ── Tier counts (fetched separately for accurate totals across all pages) ──
  const [tierCounts, setTierCounts] = useState<{ Silver: number; Gold: number; Platinum: number; Diamond: number }>({ Silver: 0, Gold: 0, Platinum: 0, Diamond: 0 });
  const [allStates, setAllStates] = useState<string[]>([]);
  const [allCities, setAllCities] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const sanitizeOptions = (values: string[]) => Array.from(new Set(values.map(value => value.trim()).filter(value => value && value !== '?'))).sort((a, b) => a.localeCompare(b));

  const loadTierCounts = async () => {
    try {
      const [counts, statesRes, catsRes] = await Promise.all([
        electricianApi.getTierCounts(),
        electricianApi.getDistinctStates(),
        electricianApi.getDistinctCategories(),
      ]);
      setTierCounts(counts);
      setAllStates(sanitizeOptions(statesRes.states ?? []));
      setAllCategories(sanitizeOptions(catsRes.categories ?? []));
    } catch (err) {
      console.error('Failed to load tier counts:', err);
    }
  };

  const loadCities = useCallback(async (state: string) => {
    try {
      const citiesRes = await electricianApi.getDistinctCities(state !== 'all' ? { state } : undefined);
      setAllCities(sanitizeOptions(citiesRes.cities ?? []));
    } catch (err) {
      console.error('Failed to load electrician cities:', err);
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
      if (filterCategory !== 'all') params.subCategory = filterCategory;
      if (filterBank !== 'all') params.bankLinked = filterBank === 'linked' ? 'true' : 'false';
      if (filterAppInstalled !== 'all') params.appInstalled = filterAppInstalled === 'installed' ? 'true' : 'false';
      if (filterWelcomeBonus === 'welcome_back_bonus') params.welcomeBonus = 'true';

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

      setLoadError(null);
      const [elecRes, dealRes] = await Promise.all([
        electricianApi.getAll(params),
        dealerApi.getAll({ limit: '500' }),
      ]);
      const dealData = Array.isArray(dealRes) ? dealRes : (dealRes as any).data ?? [];
      setDealers(dealData.map((d: any) => ({ id: d.id, name: d.name, dealerCode: d.dealerCode })));

      const rawElecs = Array.isArray(elecRes) ? elecRes : (elecRes as any).data ?? [];
      const total = Array.isArray(elecRes) ? rawElecs.length : (elecRes as any).total ?? rawElecs.length;
      setTotalCount(total);

      const dealerMap = new Map(dealData.map((d: any) => [d.id, d.name]));
      setData(rawElecs.map((e: any) => ({
        ...e,
        dealerName: e.dealerName ?? e.dealer?.name ?? (e.dealerId ? dealerMap.get(e.dealerId) : null) ?? '—',
        recentActivity: e.recentActivity ?? e.lastActivityAt ?? 'N/A',
      })));
    } catch (err: any) {
      console.error('Failed to load electricians:', err);
      setLoadError(err?.message?.includes('fetch') ? 'Unable to reach server. Ensure the backend is running on port 3001.' : err?.message || 'Failed to load electricians');
    } finally {
      setLoading(false);
    }
  }, [search, filterTier, filterStatus, filterState, filterCity, filterCategory, filterBank, filterWelcomeBonus, filterAppInstalled, dateFilter, customDateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch from page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    loadData(1);
  }, [search, filterTier, filterStatus, filterState, filterCity, filterCategory, filterBank, filterWelcomeBonus, filterAppInstalled, dateFilter, customDateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial load
  useEffect(() => { loadData(1); loadTierCounts(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void loadCities(filterState);
  }, [filterState, loadCities]);

  useEffect(() => {
    if (filterCity !== 'all' && !allCities.includes(filterCity)) {
      setFilterCity('all');
    }
  }, [allCities, filterCity]);

  // Auto-refresh when tab becomes visible (no interval — avoids glitch/lag)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadData(currentPage); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [currentPage, loadData]);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [viewing, setViewing] = useState<Electrician | null>(null);
  const [editing, setEditing] = useState<Electrician | null | undefined>(undefined);
  const [showAdd, setShowAdd] = useState(false);
  const [viewMode, setViewMode] = useState<ListViewMode>('table');
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'error' });

  // Get auth context and load permissions from database
  const { auth } = useAppContext();
  const userPermissions = useUserPermissions(auth.adminId ?? undefined, role);
  const permissions = {
    canCreate: userPermissions.canCreateInModule('electricians'),
    canEdit: userPermissions.canEditInModule('electricians'),
    canDelete: userPermissions.canDeleteInModule('electricians'),
  };
  
  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' };

  const uniqueStates = ['all', ...sanitizeOptions(allStates)];
  const uniqueCities = ['all', ...sanitizeOptions(allCities)];
  const uniqueCategories = ['all', ...sanitizeOptions(allCategories)];

  const filtered = data.filter((electrician: any) => {
    const groupOk = filterElectricianGroup === 'all'
      || String(electrician.subCategory ?? '').toLowerCase().includes(filterElectricianGroup.toLowerCase());
    return groupOk;
  }); // Welcome scans and main filters are server-side; group remains a local quick filter.

  const handleSave = async (form: Partial<Electrician>) => {
    if (!form.name?.trim() || !form.phone?.trim() || !form.city?.trim() || !form.state?.trim()) {
      setAlertDialog({ show: true, title: 'Required Fields Missing', message: 'Please fill all required fields: Name, Phone, City, and State', type: 'error' });
      return;
    }
    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      setAlertDialog({ show: true, title: 'Invalid Phone Number', message: 'Phone number must be exactly 10 digits', type: 'error' });
      return;
    }
    const electricianCode = form.electricianCode?.trim();
    const electricianData = {
      name: form.name,
      phone: form.phone,
      email: form.email && form.email.trim() !== '' ? form.email.trim() : undefined,
      city: form.city,
      state: form.state,
      district: form.district,
      // Backend auto-generates the next serial when this field is blank.
      ...(electricianCode ? { electricianCode } : {}),
      tier: form.tier,
      status: form.status,
      dealerId: form.dealerId && form.dealerId.trim() !== '' ? form.dealerId : undefined,
      subCategory: form.subCategory || 'General Electrician',
      bankLinked: form.bankLinked,
      upiId: form.upiId && form.upiId.trim() !== '' ? form.upiId : undefined,
      profileImage: form.profileImage && form.profileImage.trim() !== '' ? form.profileImage : undefined,
      // Points and wallet — always include so admin changes reflect immediately
      totalPoints: typeof form.totalPoints === 'number' ? form.totalPoints : undefined,
      walletBalance: typeof form.walletBalance === 'number' ? form.walletBalance : undefined,
      totalScans: typeof form.totalScans === 'number' ? form.totalScans : undefined,
    };
    try {
      if (showAdd) {
        await electricianApi.create(electricianData);
        setShowAdd(false);
      } else {
        await electricianApi.update(editing!.id, electricianData);
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
        await electricianApi.delete(deleteConfirm.id);
        setDeleteConfirm({ show: false, id: null });
        await loadData(currentPage);
      } catch (err: any) {
        setAlertDialog({ show: true, title: 'Error', message: err.message || 'Delete failed', type: 'error' });
      }
    }
  };

  const handlePasswordSave = async (password: string) => {
    if (!viewing) return;

    const updated = await electricianApi.setPassword(viewing.id, password);
    setViewing({
      ...updated,
      dealerName: updated.dealerName ?? updated.dealer?.name ?? viewing.dealerName ?? '—',
      recentActivity: updated.recentActivity ?? updated.lastActivityAt ?? viewing.recentActivity ?? 'N/A',
    });
    setData((current) =>
      current.map((item) =>
        item.id === updated.id ? { ...item, hasPassword: updated.hasPassword } : item,
      ),
    );
    setAlertDialog({ show: true, title: 'Password Updated', message: 'Electrician app password saved successfully.', type: 'success' });
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      {viewing && <ViewModal el={viewing} onClose={() => setViewing(null)} onEdit={() => { setEditing(viewing); setViewing(null); }} permissions={permissions} onPasswordSave={handlePasswordSave} />}
      {(editing !== undefined || showAdd) && (
        <EditModal el={showAdd ? null : editing!} dealers={dealers} onClose={() => { setEditing(undefined); setShowAdd(false); }} onSave={handleSave} />
      )}
      <AlertDialog show={alertDialog.show} title={alertDialog.title} message={alertDialog.message} type={alertDialog.type} onClose={() => setAlertDialog({ ...alertDialog, show: false })} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4 }}>Electricians</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>Manage all registered electricians, tiers and points</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowExport(true)} style={{ background: C.surface, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileSpreadsheet size={14} /> Export
          </button>
          <button onClick={() => setShowImport(true)} style={{ background: C.surface, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileSpreadsheet size={14} /> Import
          </button>
          {permissions.canCreate && (
            <button onClick={() => setShowAdd(true)} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={14} /> Add Electrician
            </button>
          )}
        </div>
      </div>

      <ExportModal
        show={showExport}
        onClose={() => setShowExport(false)}
        title="All Electricians"
        fileName="electricians"
        getData={() => data.map(e => ({
          Name: e.name,
          Phone: e.phone,
          Email: e.email ?? '',
          Code: e.electricianCode,
          City: e.city,
          District: e.district,
          State: e.state,
          Tier: e.tier,
          Status: e.status,
          Dealer: e.dealerName ?? '',
          TotalPoints: e.totalPoints,
          WalletBalance: e.walletBalance,
          TotalScans: e.totalScans,
          BankLinked: e.bankLinked ? 'Yes' : 'No',
          JoinedDate: formatISTDate(e.joinedDate),
        }))}
      />

      <ImportModal
        show={showImport}
        onClose={() => setShowImport(false)}
        title="Electricians"
        onImport={async (records) => {
          const res = await electricianApi.importMany(records);
          await loadData(currentPage);
          return res;
        }}
      />

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Total', value: totalCount, Icon: Users, color: '#3B82F6', bg: '#EFF6FF' },
          ...(['Silver','Gold','Platinum','Diamond'] as MemberTier[]).map(t => {
            const tierIcons: Record<string, React.ReactNode> = { Silver: <Medal size={18} />, Gold: <Award size={18} />, Platinum: <Trophy size={18} />, Diamond: <Gem size={18} /> };
            return {
              label: t, 
              value: tierCounts[t], 
              Icon: () => <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{tierIcons[t]}</span>, 
              color: TIER_CONFIG[t].color, 
              bg: TIER_CONFIG[t].bg,
            };
          }),
        ].map((s, i) => (
          <div key={i} onClick={() => setFilterTier(i === 0 ? 'all' : s.label)} style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}`, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}><s.Icon size={18} /></div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{s.value}</div>
                <div style={{ fontSize: 11, color: s.color, fontWeight: 700 }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: C.card, borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}`, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', position: 'relative' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, city, code, dealer..." style={{ ...inputStyle, flex: '0 1 320px', maxWidth: 320 }} onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.red} onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />

        <select
          value={filterWelcomeBonus}
          onChange={e => setFilterWelcomeBonus(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: 10, border: `1px solid ${filterWelcomeBonus !== 'all' ? C.red : C.border}`, background: C.bg, color: C.text, fontSize: 13, cursor: 'pointer', minWidth: 180, flexShrink: 0 }}
        >
          <option value="all">All Bonus</option>
          <option value="welcome_back_bonus">Welcome Back Bonus</option>
        </select>

        <select
          value={filterElectricianGroup}
          onChange={e => setFilterElectricianGroup(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: 10, border: `1px solid ${filterElectricianGroup !== 'all' ? C.red : C.border}`, background: C.bg, color: C.text, fontSize: 13, cursor: 'pointer', minWidth: 170, flexShrink: 0 }}
        >
          <option value="all">All Electrician</option>
          <option value="General Electrician">General Electrician</option>
          <option value="Industrial Electrician">Industrial Electrician</option>
          <option value="Residential Wiring">Residential Wiring</option>
        </select>

        <select
          value={filterAppInstalled}
          onChange={e => setFilterAppInstalled(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: 10, border: `1px solid ${filterAppInstalled !== 'all' ? C.red : C.border}`, background: C.bg, color: C.text, fontSize: 13, cursor: 'pointer', minWidth: 150, flexShrink: 0 }}
        >
          <option value="all">All App Status</option>
          <option value="installed">App Installed</option>
          <option value="not_installed">Not Installed</option>
        </select>

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

        {/* Active filter count badge */}
        {(filterTier !== 'all' || filterStatus !== 'all' || filterState !== 'all' || filterCity !== 'all' || filterCategory !== 'all' || filterBank !== 'all' || filterWelcomeBonus !== 'all' || filterElectricianGroup !== 'all' || filterAppInstalled !== 'all' || dateFilter !== 'all') && (
          <button onClick={() => { setFilterTier('all'); setFilterStatus('all'); setFilterState('all'); setFilterCity('all'); setFilterCategory('all'); setFilterBank('all'); setFilterWelcomeBonus('all'); setFilterElectricianGroup('all'); setFilterAppInstalled('all'); setDateFilter('all'); setCustomDateRange({ from: '', to: '' }); }}
            style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.red}`, background: '#FFF0F0', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
            Clear Filters
          </button>
        )}

        {/* Filter icon button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowFilterPopup(p => !p)}
            style={{
              width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${showFilterPopup || (filterTier !== 'all' || filterStatus !== 'all' || filterState !== 'all' || filterCity !== 'all' || filterCategory !== 'all' || filterBank !== 'all' || filterWelcomeBonus !== 'all' || filterElectricianGroup !== 'all' || filterAppInstalled !== 'all') ? C.red : C.border}`,
              background: showFilterPopup || (filterTier !== 'all' || filterStatus !== 'all' || filterState !== 'all' || filterCity !== 'all' || filterCategory !== 'all' || filterBank !== 'all' || filterWelcomeBonus !== 'all' || filterElectricianGroup !== 'all' || filterAppInstalled !== 'all') ? '#FFF0F0' : C.card,
              color: showFilterPopup || (filterTier !== 'all' || filterStatus !== 'all' || filterState !== 'all' || filterCity !== 'all' || filterCategory !== 'all' || filterBank !== 'all' || filterWelcomeBonus !== 'all' || filterElectricianGroup !== 'all' || filterAppInstalled !== 'all') ? C.red : C.muted,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative',
            }}
          >
            <SlidersHorizontal size={17} />
            {(filterTier !== 'all' || filterStatus !== 'all' || filterState !== 'all' || filterCity !== 'all' || filterCategory !== 'all' || filterBank !== 'all' || filterWelcomeBonus !== 'all' || filterElectricianGroup !== 'all' || filterAppInstalled !== 'all') && (
              <span style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: C.red, color: 'white', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {[filterTier, filterStatus, filterState, filterCity, filterCategory, filterBank, filterWelcomeBonus, filterElectricianGroup, filterAppInstalled].filter(f => f !== 'all').length}
              </span>
            )}
          </button>

          {/* Filter Modal - Centered Overlay */}
          {showFilterPopup && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowFilterPopup(false)}>
              <div style={{ background: C.card, borderRadius: 20, width: 460, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.25)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.red }}>
                      <SlidersHorizontal size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Filter Electricians</div>
                      <div style={{ fontSize: 12, color: C.muted }}>Narrow down results by category</div>
                    </div>
                  </div>
                  <button onClick={() => setShowFilterPopup(false)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
                {/* Body */}
                <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { label: 'Tier', value: filterTier, set: setFilterTier, options: [['all','All Tiers'],['Silver','Silver'],['Gold','Gold'],['Platinum','Platinum'],['Diamond','Diamond']] },
                    { label: 'Status', value: filterStatus, set: setFilterStatus, options: [['all','All Status'],['active','Active'],['pending','Pending'],['inactive','Inactive']] },
                    { label: 'State', value: filterState, set: setFilterState, options: [['all','All States'], ...uniqueStates.filter(s => s !== 'all').map(s => [s, s])] },
                    { label: 'City', value: filterCity, set: setFilterCity, options: [['all','All Cities'], ...uniqueCities.filter(c => c !== 'all').map(c => [c, c])] },
                    { label: 'Category', value: filterCategory, set: setFilterCategory, options: [['all','All Categories'], ...uniqueCategories.filter(c => c !== 'all').map(c => [c, c])] },
                    { label: 'Bank Account', value: filterBank, set: setFilterBank, options: [['all','All'],['linked','Linked'],['not_linked','Not Linked']] },
                    { label: 'Bonus', value: filterWelcomeBonus, set: setFilterWelcomeBonus, options: [['all','All Bonus'],['welcome_back_bonus','Welcome Back Bonus']] },
                    { label: 'Electrician', value: filterElectricianGroup, set: setFilterElectricianGroup, options: [['all','All Electrician'],['General Electrician','General Electrician'],['Industrial Electrician','Industrial Electrician'],['Residential Wiring','Residential Wiring']] },
                    { label: 'App Status', value: filterAppInstalled, set: setFilterAppInstalled, options: [['all','All'],['installed','App Installed'],['not_installed','Not Installed']] },
                  ].map(f => (
                    <div key={f.label}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{f.label}</div>
                      {['State', 'City', 'Category'].includes(f.label) ? (
                        <SearchableSelect value={f.value} placeholder={`All ${f.label === 'Category' ? 'Categories' : `${f.label}s`}`} minWidth={180}
                          options={f.options.map(([value, label]) => ({ value, label }))}
                          onChange={(next) => { f.set(next); if (f.label === 'State') setFilterCity('all'); }} />
                      ) : (
                        <select value={f.value} onChange={e => f.set(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${f.value !== 'all' ? C.red : C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text, cursor: 'pointer' }}>
                          {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
                {/* Footer */}
                <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10 }}>
                  <button onClick={() => { setFilterTier('all'); setFilterStatus('all'); setFilterState('all'); setFilterCity('all'); setFilterCategory('all'); setFilterBank('all'); setFilterWelcomeBonus('all'); setFilterElectricianGroup('all'); setFilterAppInstalled('all'); setDateFilter('all'); setCustomDateRange({ from: '', to: '' }); }}
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

        <ViewModeToggle value={viewMode} onChange={setViewMode} accent={C.red} border={C.border} activeBg="#FFF0F0" inactiveBg={C.card} muted={C.muted} />
        <span style={{ fontSize: 13, color: C.muted, whiteSpace: 'nowrap', flexShrink: 0 }}>{filtered.length} of {totalCount} total</span>
      </div>

      {/* Error banner */}
      {loadError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 16 }}></span>
          <span style={{ flex: 1, fontSize: 13, color: '#991B1B', fontWeight: 600 }}>{loadError}</span>
          <button onClick={() => { setLoadError(null); loadData(currentPage); }} style={{ background: '#DC2626', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Retry</button>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>Loading electricians...</div>}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 16 }}>
          {!loading && filtered.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48, color: C.muted, background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
              <div style={{ marginBottom: 10 }}><I name='Search' size={40} /></div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>No electricians found</div>
            </div>
          ) : filtered.map((e) => {
            const tier = TIER_CONFIG[e.tier] ?? TIER_CONFIG['Silver'];
            const status = STATUS_CONFIG[e.status] ?? STATUS_CONFIG['inactive'];
            return (
              <div
                key={e.id}
                style={{ background: C.card, borderRadius: 18, padding: 20, border: `1px solid ${C.border}`, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}
                onMouseEnter={ev => { (ev.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (ev.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)'; }}
                onMouseLeave={ev => { (ev.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (ev.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(135deg, #FFF0F0, #FFD5D3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: C.red }}>
                      {e.profileImage ? <img src={e.profileImage} alt={e.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : e.name[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{e.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{e.electricianCode}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    <span style={{ background: tier.bg, color: tier.color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{e.tier}</span>
                    <span style={{ background: status.bg, color: status.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{status.label}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{e.city}, {e.state}</div>
                {e.dealerName ? <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>Dealer: {e.dealerName}</div> : <div style={{ marginBottom: 12 }} />}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                  <div style={{ background: C.bg, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: C.muted }}>Points</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{e.totalPoints.toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ background: C.bg, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: C.muted }}>Scans</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{e.totalScans}</div>
                  </div>
                  <div style={{ background: C.bg, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: C.muted }}>Wallet</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#10B981' }}>₹{e.walletBalance}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: C.muted }}>{e.phone}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setViewing(e)} style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View</button>
                    {permissions.canEdit && <button onClick={() => setEditing(e)} style={{ background: '#FFF7ED', color: '#C2410C', border: 'none', borderRadius: 8, padding: '6px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>}
                    {permissions.canDelete && <button onClick={() => handleDelete(e.id)} style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, padding: '6px 8px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={13} /></button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflowX: 'auto', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1120 }}>
          <thead>
            <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
              {['Electrician','Mobile Number','Location','Tier','Points','Scans','Wallet','Status','App Installed','Actions'].map(h => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                    width: h === 'Actions' ? 190 : undefined,
                    minWidth: h === 'Actions' ? 190 : undefined,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => {
              const tier = TIER_CONFIG[e.tier] ?? TIER_CONFIG['Silver'];
              const status = STATUS_CONFIG[e.status] ?? STATUS_CONFIG['inactive'];
              return (
                <tr key={e.id} onClick={event => { if (!(event.target as HTMLElement).closest('button,select,input,a')) setViewing(e); }} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.12s', cursor: 'pointer' }}
                  onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = C.hoverRow}
                  onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                  <td style={{ padding: '13px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', background: `linear-gradient(135deg, #FFF0F0, #FFD5D3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: C.red, flexShrink: 0 }}>
                        {e.profileImage ? <img src={e.profileImage} alt={e.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : e.name[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{e.name}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{e.electricianCode}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 14px', fontSize: 12.5, color: C.muted, whiteSpace: 'nowrap' }}>{e.phone}</td>
                  <td style={{ padding: '13px 14px', fontSize: 12.5, color: C.muted, whiteSpace: 'nowrap' }}>{e.city}, {e.state}</td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{ background: tier.bg, color: tier.color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap' }}>{e.tier}</span>
                  </td>
                  <td style={{ padding: '13px 14px', fontSize: 14, fontWeight: 800, color: C.text }}>{e.totalPoints.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '13px 14px', fontSize: 13, color: C.muted }}>{e.totalScans}</td>
                  <td style={{ padding: '13px 14px', fontSize: 13, fontWeight: 700, color: '#10B981' }}>₹{e.walletBalance}</td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{ background: status.bg, color: status.color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{status.label}</span>
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{
                      background: (e as any).appInstalled ? '#D1FAE5' : '#FEF3C7',
                      color: (e as any).appInstalled ? '#065F46' : '#92400E',
                      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap',
                    }}>
                      {(e as any).appInstalled ? '✓ Installed' : '✗ Not Installed'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 14px', minWidth: 190, width: 190 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => setViewing(e)} style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 7, padding: '6px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', minWidth: 58 }}>View</button>
                      {permissions.canEdit && (
                        <button onClick={() => setEditing(e)} style={{ background: '#FFF7ED', color: '#C2410C', border: 'none', borderRadius: 7, padding: '6px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', minWidth: 58 }}>Edit</button>
                      )}
                      {permissions.canDelete && (
                        <button onClick={() => handleDelete(e.id)} style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 7, padding: '6px 8px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 34, minHeight: 30 }}><Trash2 size={13} /></button>
                      )}
                      {!permissions.canEdit && !permissions.canDelete && (
                        <span style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', padding: '6px 8px', whiteSpace: 'nowrap' }}>Read Only</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>
            <div style={{ marginBottom: 10 }}><I name='Search' size={40} /></div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>No electricians found</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting filters or search terms</div>
          </div>
        )}
      </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {totalCount > PAGE_SIZE && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: '12px 20px', background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, color: C.muted }}>
            Showing <strong style={{ color: C.text }}>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)}</strong> of <strong style={{ color: C.text }}>{totalCount.toLocaleString('en-IN')}</strong> electricians
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

      <ConfirmDialog
        show={deleteConfirm.show}
        title="Remove Electrician"
        message="Are you sure you want to remove this electrician? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: null })}
        confirmText="Remove"
        type="danger"
      />
    </div>
  );
}
