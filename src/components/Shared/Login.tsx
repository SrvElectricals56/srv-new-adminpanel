'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Shield, Users, UserCheck, Eye, EyeOff, LogIn, Zap, Lock, Mail, ChevronRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useAppContext } from '@/lib/appContext';
import type { AdminRole } from '@/lib/types';

interface RoleOption {
  id: AdminRole;
  label: string;
  description: string;
  Icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'super_admin',
    label: 'Super Admin',
    description: 'Full system access & control',
    Icon: Shield,
    color: '#1D4ED8',
    bg: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
    border: '#1D4ED8',
  },
  {
    id: 'admin',
    label: 'Admin',
    description: 'Manage users & operations',
    Icon: UserCheck,
    color: '#7C3AED',
    bg: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)',
    border: '#7C3AED',
  },
  {
    id: 'staff',
    label: 'Staff',
    description: 'View & limited access',
    Icon: Users,
    color: '#0369A1',
    bg: 'linear-gradient(135deg, #F0F9FF, #E0F2FE)',
    border: '#0369A1',
  },
];

interface LoginProps {
  onLogin: (role: AdminRole, name?: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { mode, toggleTheme } = useTheme();
  const { login } = useAppContext();
  const isDark = mode === 'dark';
  const [selectedRole, setSelectedRole] = useState<AdminRole>('super_admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Clear fields when role changes
  const handleRoleSelect = (role: AdminRole) => {
    setSelectedRole(role);
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      triggerShake();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { role, name } = await login(email, password);
      onLogin(role, name);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const activeRole = ROLES.find(r => r.id === selectedRole)!;

  // Theme colors
  const theme = {
    bg: isDark ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)' : '#FFFFFF',
    cardBg: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    cardBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)',
    cardShadow: isDark ? '0 32px 80px rgba(0,0,0,0.4)' : '0 32px 80px rgba(0,0,0,0.12)',
    titleColor: isDark ? 'white' : '#1D4ED8',
    subtitleColor: isDark ? 'rgba(255,255,255,0.45)' : '#64748B',
    labelColor: isDark ? 'rgba(255,255,255,0.4)' : '#374151',
    inputBg: isDark ? 'rgba(255,255,255,0.06)' : '#F9FAFB',
    inputBorder: isDark ? 'rgba(255,255,255,0.1)' : '#D1D5DB',
    inputColor: isDark ? 'white' : '#111827',
    inputPlaceholder: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.4)',
    iconColor: isDark ? 'rgba(255,255,255,0.3)' : '#6B7280',
    roleBg: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
    roleBorder: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
    roleIconBg: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6',
    roleIconColor: isDark ? 'rgba(255,255,255,0.4)' : '#6B7280',
    roleLabelColor: isDark ? 'rgba(255,255,255,0.45)' : '#374151',
    descBg: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB',
    descBorder: isDark ? 'rgba(255,255,255,0.07)' : '#E5E7EB',
    descText: isDark ? 'rgba(255,255,255,0.5)' : '#6B7280',
    divider: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
    hintBg: isDark ? 'rgba(255,255,255,0.04)' : '#F3F4F6',
    hintBorder: isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
    hintText: isDark ? 'rgba(255,255,255,0.3)' : '#6B7280',
    hintValue: isDark ? 'rgba(255,255,255,0.55)' : '#374151',
    footerText: isDark ? 'rgba(255,255,255,0.2)' : '#9CA3AF',
    blobOpacity: isDark ? '0.15' : '0.08',
    gridOpacity: isDark ? '0.02' : '0.03',
    activeRoleText: isDark ? '#FFFFFF' : '#0F172A',
    activeRoleIcon: '#FFFFFF',
    loadingButtonBg: isDark ? 'rgba(255,255,255,0.1)' : '#DBEAFE',
    loadingButtonText: isDark ? '#FFFFFF' : activeRole.color,
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>

      {/* Animated background blobs */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(29,78,216,${theme.blobOpacity}) 0%, transparent 70%)`,
        top: -100, left: -100,
        animation: 'blobFloat 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(124,58,237,${parseFloat(theme.blobOpacity) * 0.8}) 0%, transparent 70%)`,
        bottom: -80, right: -80,
        animation: 'blobFloat 10s ease-in-out infinite reverse',
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(3,105,161,${parseFloat(theme.blobOpacity) * 0.6}) 0%, transparent 70%)`,
        top: '40%', right: '20%',
        animation: 'blobFloat 12s ease-in-out infinite 2s',
      }} />

      {/* Grid pattern overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(${isDark ? '255,255,255' : '29,78,216'},${theme.gridOpacity}) 1px, transparent 1px), linear-gradient(90deg, rgba(${isDark ? '255,255,255' : '29,78,216'},${theme.gridOpacity}) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Main card */}
      <div style={{
        width: '100%', maxWidth: 480,
        animation: 'slideUp 0.6s cubic-bezier(0.16,1,0.3,1)',
        position: 'relative', zIndex: 10,
      }}>

        {/* Logo & Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative' }}>
          {/* Dark/light mode toggle - right side */}
          <button
            type="button"
            onClick={toggleTheme}
            title={mode === 'dark' ? 'Light mode' : 'Dark mode'}
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              background: theme.roleBg,
              border: `1.5px solid ${theme.roleBorder}`,
              borderRadius: 10,
              width: 38,
              height: 38,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.roleIconColor,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
              (e.currentTarget as HTMLButtonElement).style.color = theme.activeRoleText;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = theme.roleBg;
              (e.currentTarget as HTMLButtonElement).style.color = theme.roleIconColor;
            }}
          >
            {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {/* Logo with proper centering */}
          <div style={{
            width: 84, height: 84, borderRadius: 24, overflow: 'hidden',
            margin: '0 auto 16px',
            border: '2px solid rgba(29,78,216,0.2)',
            background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(29,78,216,0.15)',
            animation: 'logoPulse 3s ease-in-out infinite',
          }}>
            <Image src="/srv-logo.jpeg" alt="SRV" width={84} height={84} style={{ objectFit: 'cover' }} loading="eager" priority />
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: theme.titleColor, letterSpacing: '-0.5px' }}>SRV Electricals</div>
          <div style={{ fontSize: 13, color: theme.subtitleColor, marginTop: 4 }}>Admin Portal — Secure Access</div>
        </div>

        {/* Card */}
        <div style={{
          background: theme.cardBg,
          backdropFilter: 'blur(20px)',
          borderRadius: 24,
          border: `1px solid ${theme.cardBorder}`,
          padding: 32,
          boxShadow: theme.cardShadow,
        }}>

          {/* Role selector */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.labelColor, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Select Role</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {ROLES.map(role => {
                const isActive = selectedRole === role.id;
                const activeBg = isDark
                  ? `rgba(${role.id === 'super_admin' ? '29,78,216' : role.id === 'admin' ? '124,58,237' : '3,105,161'},0.2)`
                  : role.bg;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    style={{
                      padding: '12px 8px',
                      borderRadius: 14,
                      border: `1.5px solid ${isActive ? role.color : theme.roleBorder}`,
                      background: isActive ? activeBg : theme.roleBg,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                      boxShadow: isActive ? `0 8px 24px rgba(${role.id === 'super_admin' ? '29,78,216' : role.id === 'admin' ? '124,58,237' : '3,105,161'},${isDark ? '0.3' : '0.18'})` : 'none',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: isActive ? role.color : theme.roleIconBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}>
                      <role.Icon size={18} color={isActive ? theme.activeRoleIcon : theme.roleIconColor} />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? theme.activeRoleText : theme.roleLabelColor, textAlign: 'center', lineHeight: 1.3 }}>{role.label}</div>
                  </button>
                );
              })}
            </div>
            {/* Role description */}
            <div style={{
              marginTop: 10, padding: '8px 12px', borderRadius: 10,
              background: theme.descBg,
              border: `1px solid ${theme.descBorder}`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <activeRole.Icon size={14} color={activeRole.color} />
              <span style={{ fontSize: 12, color: theme.descText }}>{activeRole.description}</span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: theme.divider, marginBottom: 24 }} />

          {/* Form */}
          <div style={{
            animation: shake ? 'shake 0.4s ease' : 'none',
          }}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: theme.labelColor, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: theme.iconColor, pointerEvents: 'none' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter your email"
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px',
                    background: theme.inputBg,
                    border: `1.5px solid ${theme.inputBorder}`,
                    borderRadius: 12, fontSize: 14, color: theme.inputColor,
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = activeRole.color)}
                  onBlur={e => (e.target.style.borderColor = theme.inputBorder)}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: theme.labelColor, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: theme.iconColor, pointerEvents: 'none' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter your password"
                  style={{
                    width: '100%', padding: '12px 44px 12px 42px',
                    background: theme.inputBg,
                    border: `1.5px solid ${theme.inputBorder}`,
                    borderRadius: 12, fontSize: 14, color: theme.inputColor,
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = activeRole.color)}
                  onBlur={e => (e.target.style.borderColor = theme.inputBorder)}
                />
                <button
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: theme.iconColor, padding: 4 }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                marginBottom: 16, padding: '10px 14px', borderRadius: 10,
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                fontSize: 13, color: '#FCA5A5', fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            {/* Login button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? theme.loadingButtonBg : `linear-gradient(135deg, ${activeRole.color}, ${activeRole.id === 'super_admin' ? '#1E40AF' : activeRole.id === 'admin' ? '#6D28D9' : '#075985'})`,
                border: 'none', borderRadius: 14,
                color: loading ? theme.loadingButtonText : '#FFFFFF', fontSize: 15, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.2s',
                boxShadow: loading ? '0 8px 24px rgba(148,163,184,0.18)' : `0 8px 24px rgba(${activeRole.id === 'super_admin' ? '29,78,216' : activeRole.id === 'admin' ? '124,58,237' : '3,105,161'},0.4)`,
                transform: loading ? 'scale(0.98)' : 'scale(1)',
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: `2px solid ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(29,78,216,0.18)'}`,
                    borderTopColor: loading ? theme.loadingButtonText : '#FFFFFF',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In as {activeRole.label}
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Zap size={12} color={theme.footerText} />
          <span style={{ fontSize: 12, color: theme.footerText }}>SRV Electricals Admin Portal v1.0</span>
          <Zap size={12} color={theme.footerText} />
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -20px) scale(1.05); }
          66% { transform: translate(-15px, 15px) scale(0.95); }
        }
        @keyframes logoPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(29,78,216,0.3); }
          50% { box-shadow: 0 8px 48px rgba(29,78,216,0.6); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        input::placeholder { color: ${theme.inputPlaceholder}; }
      `}</style>
    </div>
  );
}
