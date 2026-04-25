'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

/** Shared UI colors — use via useThemePalette() so light/dark apply app-wide */
export const LIGHT_PALETTE = {
  red: '#1D4ED8',
  redDark: '#1E40AF',
  bg: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#64748B',
  inputBg: '#F8FAFC',
  surface: '#F8FAFC',
  topbar: '#FFFFFF',
  topbarBorder: '#E2E8F0',
  sidebar: '#0F172A',
  crumb: '#94A3B8',
  crumbActive: '#0F172A',
  accentSoft: '#EEF2FF',
  accentSoftBorder: '#C7D2FE',
  accentText: '#4338CA',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  dangerText: '#DC2626',
  modalBg: '#FFFFFF',
  modalMuted: '#64748B',
  shadow: '0 1px 8px rgba(0,0,0,0.06)',
  hoverRow: '#FAFBFF',
  scrollbarTrack: '#F1F5F9',
  scrollbarThumb: '#CBD5E1',
  focusRing: 'rgba(29,78,216,0.1)',
  subNavBg: '#FFFFFF',
  heroGradient: 'linear-gradient(135deg, #0F172A, #1E293B)',
  overlay: 'rgba(15,23,42,0.55)',
} as const;

export const DARK_PALETTE = {
  red: '#3B82F6',
  redDark: '#2563EB',
  bg: '#0B1120',
  card: '#1E293B',
  border: '#334155',
  text: '#F8FAFC',
  muted: '#94A3B8',
  inputBg: '#0F172A',
  surface: '#1E293B',
  topbar: '#1E293B',
  topbarBorder: '#334155',
  sidebar: '#020617',
  crumb: '#94A3B8',
  crumbActive: '#F8FAFC',
  accentSoft: 'rgba(59, 130, 246, 0.15)',
  accentSoftBorder: 'rgba(59, 130, 246, 0.35)',
  accentText: '#93C5FD',
  dangerBg: 'rgba(239, 68, 68, 0.15)',
  dangerBorder: 'rgba(239, 68, 68, 0.35)',
  dangerText: '#FCA5A5',
  modalBg: '#1E293B',
  modalMuted: '#94A3B8',
  shadow: '0 1px 8px rgba(0,0,0,0.45)',
  hoverRow: 'rgba(59, 130, 246, 0.12)',
  scrollbarTrack: '#0F172A',
  scrollbarThumb: '#475569',
  focusRing: 'rgba(59, 130, 246, 0.2)',
  subNavBg: '#1E293B',
  heroGradient: 'linear-gradient(135deg, #0F172A, #334155)',
  overlay: 'rgba(0,0,0,0.65)',
} as const;

export interface ThemePalette {
  red: string;
  redDark: string;
  bg: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  inputBg: string;
  surface: string;
  topbar: string;
  topbarBorder: string;
  sidebar: string;
  crumb: string;
  crumbActive: string;
  accentSoft: string;
  accentSoftBorder: string;
  accentText: string;
  dangerBg: string;
  dangerBorder: string;
  dangerText: string;
  modalBg: string;
  modalMuted: string;
  shadow: string;
  hoverRow: string;
  scrollbarTrack: string;
  scrollbarThumb: string;
  focusRing: string;
  subNavBg: string;
  heroGradient: string;
  overlay: string;
}

const STORAGE_KEY = 'srv-admin-theme';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggleTheme: () => void;
  palette: ThemePalette;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (stored === 'dark' || stored === 'light') setModeState(stored);
    } catch {
      /* ignore */
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.style.colorScheme = mode === 'dark' ? 'dark' : 'light';
  }, [mode, mounted]);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  const toggleTheme = useCallback(() => setModeState(m => (m === 'dark' ? 'light' : 'dark')), []);

  const palette = useMemo(() => (mode === 'dark' ? DARK_PALETTE : LIGHT_PALETTE), [mode]);

  const value = useMemo(
    () => ({ mode, setMode, toggleTheme, palette }),
    [mode, setMode, toggleTheme, palette],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function useThemePalette() {
  return useTheme().palette;
}
