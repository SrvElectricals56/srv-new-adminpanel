'use client';
import { useState, useEffect } from 'react';
import { Key, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import { PermissionGuard } from '@/components/Shared/PermissionGuard';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'staff';
  status: string;
}

export default function PasswordManagement() {
  const C = useThemePalette();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadAdmins(); }, []);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAll();
      setAdmins(response.data || []);
    } catch (err) {
      console.error('Failed to load admins:', err);
      setError('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = (admin: Admin) => {
    setSelectedAdmin(admin);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || !confirmPassword) { setError('Please fill in all fields'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters long'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (!selectedAdmin) { setError('No admin selected'); return; }

    try {
      setLoading(true);
      await adminApi.update(selectedAdmin.id, { password: newPassword });
      setSuccess(`Password changed successfully for ${selectedAdmin.name}`);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => { setShowModal(false); setSuccess(''); }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const roleBadge = (role: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      super_admin: { bg: 'rgba(124,58,237,0.15)', color: '#7C3AED', label: 'Super Admin' },
      admin:       { bg: 'rgba(29,78,216,0.15)',  color: '#1D4ED8', label: 'Admin' },
      staff:       { bg: 'rgba(100,116,139,0.15)', color: '#64748B', label: 'Staff' },
    };
    const s = map[role] ?? map.staff;
    return (
      <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
        {s.label}
      </span>
    );
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 40px 10px 12px',
    border: `1.5px solid ${C.border}`, borderRadius: 10,
    fontSize: 14, outline: 'none',
    background: C.inputBg, color: C.text,
    boxSizing: 'border-box',
  };

  return (
    <PermissionGuard permission="changePasswords">
      <div style={{ padding: '28px 32px', maxWidth: 1000 }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #4338CA, #6366F1)', borderRadius: 16, padding: '22px 28px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Key size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Password Management</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Change passwords for admin users (Super Admin only)</div>
          </div>
        </div>

        {/* Inline alerts (outside modal) */}
        {error && !showModal && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, color: C.dangerText, fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}
        {success && !showModal && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#16A34A', fontSize: 13, fontWeight: 600 }}>
            {success}
          </div>
        )}

        {/* Table */}
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: C.shadow }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
                {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && admins.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: C.muted, fontSize: 14 }}>Loading...</td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: C.muted, fontSize: 14 }}>No admin users found</td></tr>
              ) : admins.map(admin => (
                <tr key={admin.id} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = C.hoverRow}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                  <td style={{ padding: '13px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                        {admin.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{admin.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 18px', fontSize: 13, color: C.muted }}>{admin.email}</td>
                  <td style={{ padding: '13px 18px' }}>{roleBadge(admin.role)}</td>
                  <td style={{ padding: '13px 18px' }}>
                    <span style={{
                      background: admin.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color: admin.status === 'active' ? '#16A34A' : '#DC2626',
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize',
                    }}>
                      {admin.status}
                    </span>
                  </td>
                  <td style={{ padding: '13px 18px' }}>
                    <button
                      onClick={() => handleChangePassword(admin)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: C.accentSoft, color: C.accentText, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      <Lock size={13} /> Change Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Password Change Modal */}
        {showModal && selectedAdmin && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={() => setShowModal(false)}>
            <div style={{ background: C.card, borderRadius: 20, width: 440, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.3)', border: `1px solid ${C.border}` }}
              onClick={e => e.stopPropagation()}>

              {/* Modal Header */}
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={20} color={C.accentText} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Change Password</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{selectedAdmin.name}</div>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit}>
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {error && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, color: C.dangerText, fontSize: 13, fontWeight: 600 }}>
                      {error}
                    </div>
                  )}
                  {success && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#16A34A', fontSize: 13, fontWeight: 600 }}>
                      {success}
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        minLength={8}
                        required
                        style={inputStyle}
                      />
                      <button type="button" onClick={() => setShowNew(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}>
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>Minimum 8 characters</div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        minLength={8}
                        required
                        style={inputStyle}
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}>
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setShowModal(false)} disabled={loading}
                    style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}
                    style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: loading ? C.muted : `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
