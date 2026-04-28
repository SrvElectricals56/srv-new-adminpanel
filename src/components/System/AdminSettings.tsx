'use client';
import { useState, useEffect } from 'react';
import { Shield, Plus, Pencil, Trash2, Eye, EyeOff, Key, UserCheck, Users, Lock } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { adminApi } from '@/lib/api';
import { useAppContext } from '@/lib/appContext';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';

type AdminRole = 'super_admin' | 'admin' | 'staff';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin: string;
  permissions: string[];
}

const ROLE_CONFIG: Record<AdminRole, { label: string; color: string; bg: string; icon: string }> = {
  super_admin: { label: 'Super Admin', color: '#DC2626', bg: '#FEE2E2', icon: '👑' },
  admin:       { label: 'Admin',       color: '#1D4ED8', bg: '#EFF6FF', icon: '🛡️' },
  staff:       { label: 'Staff',       color: '#065F46', bg: '#D1FAE5', icon: '👤' },
};

const ALL_PERMISSIONS = [
  'View Dashboard', 'Manage Electricians', 'Manage Dealers', 'Manage Products',
  'Manage QR Codes', 'Manage Gifts', 'View Reports', 'Manage Settings',
  'Send Notifications', 'Manage Banners', 'Manage Finance', 'Manage Commissions',
];

const ROLE_DEFAULT_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ALL_PERMISSIONS,
  admin: ['View Dashboard', 'Manage Electricians', 'Manage Dealers', 'Manage Products', 'Manage QR Codes', 'Manage Gifts', 'View Reports', 'Send Notifications'],
  staff: ['View Dashboard', 'Manage Electricians', 'View Reports'],
};
const EMPTY_FORM = { name: '', email: '', phone: '', role: 'staff' as AdminRole, password: '', confirmPassword: '', permissions: ROLE_DEFAULT_PERMISSIONS.staff };
const numberInputValue = (value: number | null | undefined) => value === 0 || value === null || value === undefined ? '' : value;

export default function AdminSettings() {
  const C = useThemePalette();
  const { auth, setAdminName } = useAppContext();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPass, setShowPass] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'password'>('users');
  const [saved, setSaved] = useState(false);
  // Editable role permissions state
  const [rolePerms, setRolePerms] = useState<Record<AdminRole, string[]>>({ ...ROLE_DEFAULT_PERMISSIONS });
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
  const [permSaved, setPermSaved] = useState(false);
  
  // Password Policy State
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    passwordExpiry: 90,
    preventReuse: 5,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
  });
  const [passwordPolicySaved, setPasswordPolicySaved] = useState(false);

  const loadAdmins = async () => {
    try {
      const res = await adminApi.getAll();
      const data = Array.isArray(res) ? res : (res as any).data ?? [];
      setAdmins(data.map((a: any) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        phone: a.phone ?? '',
        role: a.role ?? 'staff',
        status: a.isActive === false ? 'inactive' : (a.status ?? 'active'),
        createdAt: a.createdAt ?? a.created_at ?? '',
        lastLogin: a.lastLoginAt ?? a.lastLogin ?? a.last_login ?? '—',
        permissions: a.permissions ?? ROLE_DEFAULT_PERMISSIONS[a.role as AdminRole] ?? [],
      })));
    } catch (err) {
      console.error('Failed to load admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAdmins(); }, []);

  const toggleRolePerm = (role: AdminRole, perm: string) => {
    if (role === 'super_admin') return; // super_admin always has all
    setRolePerms(prev => ({
      ...prev,
      [role]: prev[role].includes(perm) ? prev[role].filter(p => p !== perm) : [...prev[role], perm],
    }));
  };

  const saveRolePerms = () => {
    setPermSaved(true);
    setTimeout(() => setPermSaved(false), 3000);
  };

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text, boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' };

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (a: AdminUser) => {
    setEditingId(a.id);
    setForm({ name: a.name, email: a.email, phone: a.phone ?? '', role: a.role, password: '', confirmPassword: '', permissions: [...a.permissions] });
    setShowModal(true);
  };

  const handleRoleChange = (role: AdminRole) => {
    setForm(f => ({ ...f, role, permissions: [...ROLE_DEFAULT_PERMISSIONS[role]] }));
  };

  const togglePermission = (perm: string) => {
    setForm(f => ({ ...f, permissions: f.permissions.includes(perm) ? f.permissions.filter(p => p !== perm) : [...f.permissions, perm] }));
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return;
    if (!editingId && form.password !== form.confirmPassword) return;
    try {
      if (editingId) {
        await adminApi.update(String(editingId), { name: form.name, email: form.email, role: form.role, phone: form.phone });
        // If updating own profile, update context and localStorage
        if (String(editingId) === auth.adminId) {
          setAdminName(form.name);
        }
      } else {
        await adminApi.create({ name: form.name, email: form.email, role: form.role, password: form.password, phone: form.phone });
      }
      await loadAdmins();
    } catch (err) {
      console.error('Failed to save admin:', err);
    }
    setShowModal(false);
  };

  const toggleStatus = async (id: number) => {
    const admin = admins.find(a => a.id === id);
    if (!admin) return;
    const newStatus = admin.status === 'active' ? 'inactive' : 'active';
    try {
      await adminApi.update(String(id), { status: newStatus });
      setAdmins(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } catch (err) {
      console.error('Failed to toggle admin status:', err);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await adminApi.delete(String(deleteId));
        setAdmins(prev => prev.filter(a => a.id !== deleteId));
      } catch (err) {
        console.error('Failed to delete admin:', err);
      }
    }
    setDeleteId(null);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      <ConfirmDialog show={deleteId !== null} title="Delete Admin" message={`Delete admin "${admins.find(a => a.id === deleteId)?.name}"? This cannot be undone.`} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} confirmText="Delete" type="danger" />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1E293B, #334155)', borderRadius: 16, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Admin Settings</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Manage admin users, roles and permissions</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Total Admins', value: admins.length, color: '#fff', bg: 'rgba(255,255,255,0.15)' },
            { label: 'Active', value: admins.filter(a => a.status === 'active').length, color: '#86EFAC', bg: 'rgba(34,197,94,0.2)' },
            { label: 'Super Admins', value: admins.filter(a => a.role === 'super_admin').length, color: '#FCA5A5', bg: 'rgba(239,68,68,0.2)' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{s.label}</div>
            </div>
          ))}
          <button onClick={openAdd} style={{ padding: '10px 18px', borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Add Admin
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: C.card, borderRadius: 10, padding: 4, border: `1px solid ${C.border}`, width: 'fit-content' }}>
        {[{ id: 'users', label: '👥 Admin Users' }, { id: 'roles', label: '🔐 Role Permissions' }, { id: 'password', label: '🔒 Password Policy' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: activeTab === t.id ? C.red : 'transparent', color: activeTab === t.id ? '#fff' : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: C.shadow }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
                {['Admin', 'Email', 'Role', 'Status', 'Last Login', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admins.map(a => {
                const rc = ROLE_CONFIG[a.role];
                return (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = C.hoverRow}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{a.name[0]}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{a.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: C.muted }}>{a.email}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: rc.bg, color: rc.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{rc.icon} {rc.label}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => toggleStatus(a.id)} style={{ background: a.status === 'active' ? '#D1FAE5' : '#FEE2E2', color: a.status === 'active' ? '#065F46' : '#991B1B', border: 'none', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        {a.status === 'active' ? '✅ Active' : '❌ Inactive'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: C.muted }}>{a.lastLogin}</td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: C.muted }}>{a.createdAt}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(a)} title="Edit" style={{ width: 32, height: 32, borderRadius: 7, border: 'none', background: '#EFF6FF', color: '#1D4ED8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={14} /></button>
                        {a.role !== 'super_admin' && (
                          <button onClick={() => setDeleteId(a.id)} title="Delete" style={{ width: 32, height: 32, borderRadius: 7, border: 'none', background: '#FEE2E2', color: '#991B1B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'roles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {(Object.entries(ROLE_CONFIG) as [AdminRole, typeof ROLE_CONFIG[AdminRole]][]).map(([role, rc]) => (
            <div key={role} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: C.shadow }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{rc.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{rc.label}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{admins.filter(a => a.role === role).length} users</div>
                </div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                {ALL_PERMISSIONS.map(perm => {
                  const has = ROLE_DEFAULT_PERMISSIONS[role].includes(perm);
                  return (
                    <div key={perm} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: has ? '#D1FAE5' : '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 10 }}>{has ? '✓' : '✗'}</span>
                      </div>
                      <span style={{ fontSize: 12, color: has ? C.text : C.muted, fontWeight: has ? 600 : 400 }}>{perm}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'password' && (
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: '28px 32px', boxShadow: C.shadow }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 6 }}>🔒 Password Policy</div>
            <div style={{ fontSize: 13, color: C.muted }}>Configure password requirements and security settings for admin accounts</div>
          </div>

          {passwordPolicySaved && (
            <div style={{ background: '#D1FAE5', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center', border: '1px solid #A7F3D0' }}>
              <span style={{ fontSize: 18 }}>✅</span>
              <span style={{ fontSize: 14, color: '#065F46', fontWeight: 700 }}>Password policy saved successfully!</span>
            </div>
          )}

          <div style={{ display: 'grid', gap: 20 }}>
            {/* Password Requirements */}
            <div style={{ background: C.surface, borderRadius: 12, padding: '20px 24px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 16 }}>Password Requirements</div>
              
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={lbl}>Minimum Password Length</label>
                  <input 
                    type="number" 
                    style={inp} 
                    value={numberInputValue(passwordPolicy.minLength)} 
                    onChange={e => setPasswordPolicy(p => ({ ...p, minLength: e.target.value === '' ? 0 : parseInt(e.target.value, 10) }))} 
                    min={6}
                    max={32}
                  />
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Minimum number of characters required (6-32)</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Require Uppercase</span>
                    <input 
                      type="checkbox" 
                      checked={passwordPolicy.requireUppercase} 
                      onChange={e => setPasswordPolicy(p => ({ ...p, requireUppercase: e.target.checked }))} 
                      style={{ accentColor: C.red, width: 18, height: 18, cursor: 'pointer' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Require Lowercase</span>
                    <input 
                      type="checkbox" 
                      checked={passwordPolicy.requireLowercase} 
                      onChange={e => setPasswordPolicy(p => ({ ...p, requireLowercase: e.target.checked }))} 
                      style={{ accentColor: C.red, width: 18, height: 18, cursor: 'pointer' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Require Numbers</span>
                    <input 
                      type="checkbox" 
                      checked={passwordPolicy.requireNumbers} 
                      onChange={e => setPasswordPolicy(p => ({ ...p, requireNumbers: e.target.checked }))} 
                      style={{ accentColor: C.red, width: 18, height: 18, cursor: 'pointer' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Require Special Chars</span>
                    <input 
                      type="checkbox" 
                      checked={passwordPolicy.requireSpecialChars} 
                      onChange={e => setPasswordPolicy(p => ({ ...p, requireSpecialChars: e.target.checked }))} 
                      style={{ accentColor: C.red, width: 18, height: 18, cursor: 'pointer' }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Password Expiry & Reuse */}
            <div style={{ background: C.surface, borderRadius: 12, padding: '20px 24px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 16 }}>Password Expiry & Reuse</div>
              
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={lbl}>Password Expiry (days)</label>
                  <input 
                    type="number" 
                    style={inp} 
                    value={numberInputValue(passwordPolicy.passwordExpiry)} 
                    onChange={e => setPasswordPolicy(p => ({ ...p, passwordExpiry: e.target.value === '' ? 0 : parseInt(e.target.value, 10) }))} 
                    min={0}
                  />
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Force password change after this many days (0 = never expire)</div>
                </div>

                <div>
                  <label style={lbl}>Prevent Password Reuse</label>
                  <input 
                    type="number" 
                    style={inp} 
                    value={numberInputValue(passwordPolicy.preventReuse)} 
                    onChange={e => setPasswordPolicy(p => ({ ...p, preventReuse: e.target.value === '' ? 0 : parseInt(e.target.value, 10) }))} 
                    min={0}
                    max={10}
                  />
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Remember last N passwords to prevent reuse (0-10)</div>
                </div>
              </div>
            </div>

            {/* Account Lockout */}
            <div style={{ background: C.surface, borderRadius: 12, padding: '20px 24px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 16 }}>Account Lockout Policy</div>
              
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={lbl}>Max Login Attempts</label>
                  <input 
                    type="number" 
                    style={inp} 
                    value={numberInputValue(passwordPolicy.maxLoginAttempts)} 
                    onChange={e => setPasswordPolicy(p => ({ ...p, maxLoginAttempts: e.target.value === '' ? 0 : parseInt(e.target.value, 10) }))} 
                    min={3}
                    max={10}
                  />
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Lock account after this many failed login attempts (3-10)</div>
                </div>

                <div>
                  <label style={lbl}>Lockout Duration (minutes)</label>
                  <input 
                    type="number" 
                    style={inp} 
                    value={numberInputValue(passwordPolicy.lockoutDuration)} 
                    onChange={e => setPasswordPolicy(p => ({ ...p, lockoutDuration: e.target.value === '' ? 0 : parseInt(e.target.value, 10) }))} 
                    min={5}
                  />
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>How long to lock the account (minimum 5 minutes)</div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div style={{ padding: '16px 20px', background: '#DBEAFE', borderRadius: 12, border: '1px solid #93C5FD' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF', marginBottom: 10 }}>📋 Current Policy Summary</div>
              <div style={{ fontSize: 12, color: '#1E3A8A', lineHeight: 1.8 }}>
                • Password must be at least <strong>{passwordPolicy.minLength} characters</strong><br />
                • Must contain: {[
                  passwordPolicy.requireUppercase && 'uppercase',
                  passwordPolicy.requireLowercase && 'lowercase',
                  passwordPolicy.requireNumbers && 'numbers',
                  passwordPolicy.requireSpecialChars && 'special characters'
                ].filter(Boolean).join(', ')}<br />
                • Password expires after <strong>{passwordPolicy.passwordExpiry} days</strong> {passwordPolicy.passwordExpiry === 0 && '(never)'}<br />
                • Cannot reuse last <strong>{passwordPolicy.preventReuse} passwords</strong><br />
                • Account locks after <strong>{passwordPolicy.maxLoginAttempts} failed attempts</strong> for <strong>{passwordPolicy.lockoutDuration} minutes</strong>
              </div>
            </div>

            {/* Save Button */}
            <button 
              onClick={() => { setPasswordPolicySaved(true); setTimeout(() => setPasswordPolicySaved(false), 3000); }}
              style={{ 
                background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, 
                color: 'white', 
                border: 'none', 
                borderRadius: 12, 
                padding: '14px 32px', 
                fontSize: 14, 
                fontWeight: 700, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(220,38,38,0.3)'
              }}
            >
              <Lock size={16} />
              Save Password Policy
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.card, borderRadius: 20, width: 580, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.25)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserCheck size={18} color="#1D4ED8" /></div>
                <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{editingId ? 'Edit Admin' : 'Add New Admin'}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: C.bg, border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: C.muted }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Full Name *</label>
                  <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Admin name" />
                </div>
                <div>
                  <label style={lbl}>Email *</label>
                  <input type="email" style={inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@srvelectricals.com" />
                </div>
              </div>
              <div>
                <label style={lbl}>Phone Number</label>
                <input type="tel" style={inp} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label style={lbl}>Role</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {(Object.entries(ROLE_CONFIG) as [AdminRole, typeof ROLE_CONFIG[AdminRole]][]).map(([role, rc]) => (
                    <button key={role} onClick={() => handleRoleChange(role)} style={{ padding: '10px', borderRadius: 10, border: `2px solid ${form.role === role ? rc.color : C.border}`, background: form.role === role ? rc.bg : C.bg, cursor: 'pointer', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{rc.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: form.role === role ? rc.color : C.muted }}>{rc.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              {!editingId && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={lbl}>Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPass ? 'text' : 'password'} style={{ ...inp, paddingRight: 40 }} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" />
                      <button onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Confirm Password *</label>
                    <input type="password" style={{ ...inp, borderColor: form.confirmPassword && form.password !== form.confirmPassword ? '#DC2626' : C.border }} value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat password" />
                    {form.confirmPassword && form.password !== form.confirmPassword && <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>Passwords do not match</div>}
                  </div>
                </div>
              )}
              <div>
                <label style={lbl}>Permissions</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 14, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  {ALL_PERMISSIONS.map(perm => (
                    <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: C.text }}>
                      <input type="checkbox" checked={form.permissions.includes(perm)} onChange={() => togglePermission(perm)} style={{ accentColor: C.red }} />
                      {perm}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: '0 24px 20px', display: 'flex', gap: 10 }}>
              <button onClick={handleSave} disabled={!form.name || !form.email || (!editingId && (form.password !== form.confirmPassword || !form.password))}
                style={{ flex: 1, background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {editingId ? 'Save Changes' : 'Create Admin'}
              </button>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, background: C.bg, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
