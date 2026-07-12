'use client';
import { useState, useEffect } from 'react';
import { AppWindow, Save, ToggleLeft, ToggleRight, Bell, Gift, Info, Headphones, Award, Medal, SlidersHorizontal, Link2, ThumbsUp, FileText, Image as ImageIcon, ShoppingCart, Play, ScanLine } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { settingsApi, notificationApi, userSearchApi } from '@/lib/api';
import AppIcons from './AppIcons';
import PlayEngagement from './PlayEngagement';
import { I } from '@/lib/iconMap';

interface AppConfig {
  // App Info
  appName: string; tagline: string; appVersion: string; minAppVersion: string;
  // Maintenance
  maintenanceMode: boolean; maintenanceMessage: string;
  // Support
  supportPhone: string; supportEmail: string; whatsappNumber: string;
  // Points & Rewards
  maxPointsPerDay: number; minRedemptionPoints: number; pointsExpiry: number;
  cashbackRate: number; referrerBonus: number; refereeBonus: number;
  minTransferPoints: number;
  minimumOrderAmountElectrician: number; minimumOrderAmountDealer: number;
  minimumOrderAmountUser: number; minimumOrderAmountCounterboy: number;
  // Tiers - Electrician
  silverMin: number; goldMin: number; platinumMin: number; diamondMin: number;
  // Tiers - Dealer
  dealerSilverMin: number; dealerGoldMin: number; dealerPlatinumMin: number; dealerDiamondMin: number;
  // Commission
  dealerCommissionRate: number;
  // App Features
  scanEnabled: boolean; giftsEnabled: boolean; referralEnabled: boolean; transferPointsEnabled: boolean;
  testimonialsEnabled: boolean; playEnabled: boolean; dealerCanAddElectrician: boolean;
  qrFirstScannerShowScannerName: boolean; qrFirstScannerShowScannerPhone: boolean;
  qrFirstScannerShowDealerName: boolean; qrFirstScannerShowDealerPhone: boolean;
  qrFirstScannerShowProductName: boolean; qrFirstScannerShowScannedAt: boolean;
  upiOnlyMode: boolean;
  // Links
  privacyPolicyUrl: string; termsUrl: string; playStoreUrl: string; appStoreUrl: string;
  // Rate Us
  rateUsEnabled: boolean; rateUsMinScans: number; rateUsPromptDelay: number; playStoreRatingUrl: string; appStoreRatingUrl: string;
  // Language
  defaultLanguage: string; forceUpdate: boolean;
  // Catalog
  generalCatalogPdfUrl: string;
  dealerCatalogPdfUrl: string;
}

const INITIAL: AppConfig = {
  appName: 'SRV Electricals', tagline: 'Power Your Rewards', appVersion: '2.1.0', minAppVersion: '2.0.0',
  maintenanceMode: false, maintenanceMessage: 'App is under maintenance. Please try again later.',
  supportPhone: '+91 88376 84004', supportEmail: 'info@srvelectricals.com', whatsappNumber: '918837684004',
  maxPointsPerDay: 500, minRedemptionPoints: 500, pointsExpiry: 365, cashbackRate: 5, referrerBonus: 500, refereeBonus: 250,
  minTransferPoints: 100,
  minimumOrderAmountElectrician: 5000, minimumOrderAmountDealer: 5000,
  minimumOrderAmountUser: 5000, minimumOrderAmountCounterboy: 5000,
  silverMin: 0, goldMin: 1001, platinumMin: 5001, diamondMin: 10001,
  dealerSilverMin: 0, dealerGoldMin: 11, dealerPlatinumMin: 26, dealerDiamondMin: 51,
  dealerCommissionRate: 5,
  scanEnabled: true, giftsEnabled: true, referralEnabled: true, transferPointsEnabled: true,
  testimonialsEnabled: true, playEnabled: true, dealerCanAddElectrician: true, upiOnlyMode: false,
  qrFirstScannerShowScannerName: true, qrFirstScannerShowScannerPhone: true,
  qrFirstScannerShowDealerName: true, qrFirstScannerShowDealerPhone: true,
  qrFirstScannerShowProductName: true, qrFirstScannerShowScannedAt: true,
  privacyPolicyUrl: 'https://srvelectricals.com/privacy', termsUrl: 'https://srvelectricals.com/terms',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.srvelectricals', appStoreUrl: 'https://apps.apple.com/app/srv-electricals',
  rateUsEnabled: true, rateUsMinScans: 5, rateUsPromptDelay: 3, playStoreRatingUrl: 'market://details?id=com.srvelectricals', appStoreRatingUrl: 'https://apps.apple.com/app/srv-electricals',
  defaultLanguage: 'English', forceUpdate: false,
  generalCatalogPdfUrl: '',
  dealerCatalogPdfUrl: '',
};

function CatalogPdfUploader({ onUploaded, C, lbl }: { onUploaded: (url: string) => void | Promise<void>; C: any; lbl: React.CSSProperties }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { setError('Only PDF files allowed'); return; }
    if (file.size > 50 * 1024 * 1024) { setError('File too large (max 50MB)'); return; }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
      const token = typeof window !== 'undefined' ? localStorage.getItem('srv_token') : null;
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${BASE_URL}/upload/catalog-pdf`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      await onUploaded(data.url);
      setSuccess(`Uploaded: ${file.name}`);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '16px', background: C.bg, borderRadius: 12, border: `2px dashed ${C.border}` }}>
      <label style={lbl}>Upload New Catalog PDF</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ cursor: uploading ? 'not-allowed' : 'pointer', background: '#2563EB', color: '#fff', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, opacity: uploading ? 0.6 : 1 }}>
          {uploading ? 'Uploading...' : 'Choose PDF'}
          <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleFile} disabled={uploading} />
        </label>
        <span style={{ fontSize: 12, color: C.muted }}>Max 50MB · PDF only</span>
      </div>
      {error && <div style={{ marginTop: 8, fontSize: 12, color: '#DC2626' }}>{error}</div>}
      {success && <div style={{ marginTop: 8, fontSize: 12, color: '#059669' }}>{success}</div>}
    </div>
  );
}

export default function AppSettings({ role }: { role?: import('@/lib/types').AdminRole }) {
  const C = useThemePalette();
  const canEdit = role === 'super_admin' || role === 'admin';
  const [config, setConfig] = useState<AppConfig>(INITIAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('app');
  const [ratingHistory, setRatingHistory] = useState<any[]>([]);
  const [ratingSummary, setRatingSummary] = useState<Record<string, number>>({});
  const [ratingsLoading, setRatingsLoading] = useState(false);
  
  // Push Notification State
  const [notificationTarget, setNotificationTarget] = useState('all');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [specificUserSearch, setSpecificUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [notificationSent, setNotificationSent] = useState(false);
  const [notificationSending, setNotificationSending] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const numberInputValue = (value: number | string | undefined) => value === 0 || value === '' || value == null ? '' : value;
  const parseNumberInput = (value: string) => value === '' ? '' : Number(value);
  const normalizeNumberConfig = (value: unknown) => typeof value === 'number' ? value : Number(value || 0);

  // Load settings from API on mount
  useEffect(() => {
    settingsApi.getAll().then((rows: any[]) => {
      if (!rows?.length) return;
      const map: Record<string, string> = {};
      rows.forEach((r: any) => { map[r.key] = r.value; });
      setConfig(prev => {
        const next = { ...prev };
        Object.keys(prev).forEach(k => {
          if (map[k] !== undefined) {
            const v = map[k];
            const prevVal = (prev as any)[k];
            if (typeof prevVal === 'boolean') (next as any)[k] = v === 'true';
            else if (typeof prevVal === 'number') (next as any)[k] = Number(v);
            else (next as any)[k] = v;
          }
        });
        if (!next.generalCatalogPdfUrl && map.catalogPdfUrl !== undefined) {
          next.generalCatalogPdfUrl = map.catalogPdfUrl;
        }
        return next;
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const loadRatingHistory = async () => {
    setRatingsLoading(true);
    try {
      const res = await settingsApi.getRatingHistory();
      setRatingHistory(res?.data ?? []);
      setRatingSummary(res?.summary ?? {});
    } catch (err) {
      console.error('Rating history failed:', err);
      setRatingHistory([]);
      setRatingSummary({});
    } finally {
      setRatingsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'rateus') {
      loadRatingHistory();
    }
  }, [activeSection]);

  const f = (k: keyof AppConfig, v: any) => setConfig(p => ({ ...p, [k]: v }));

  const saveCatalogUrl = async (key: 'generalCatalogPdfUrl' | 'dealerCatalogPdfUrl', url: string) => {
    f(key, url);
    await settingsApi.update(key, url);
    if (key === 'generalCatalogPdfUrl') {
      await settingsApi.update('catalogPdfUrl', url);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const normalizedConfig = Object.fromEntries(
        Object.entries(config).map(([key, value]) => {
          const initialValue = INITIAL[key as keyof AppConfig];
          return [key, typeof initialValue === 'number' ? normalizeNumberConfig(value) : value];
        }),
      ) as AppConfig;

      setConfig(normalizedConfig);
      await Promise.all(
        Object.entries({
          ...normalizedConfig,
          catalogPdfUrl: normalizedConfig.generalCatalogPdfUrl,
        }).map(([key, value]) => settingsApi.update(key, String(value)))
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };
  
  const handleUserSearch = async (searchTerm: string) => {
    setSpecificUserSearch(searchTerm);
    
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const users = await userSearchApi.search(searchTerm);
      setSearchResults(users.map((user: any) => ({
        ...user,
        code: user.electricianCode ?? user.dealerCode ?? user.userCode ?? user.counterboyCode ?? user.id,
        type: user.role === 'electrician' ? 'Electrician' : user.role === 'dealer' ? 'Dealer' : user.role === 'counterboy' ? 'Counterboy' : 'Customer',
        points: user.totalPoints ?? 0,
        electricians: user.electricianCount ?? 0,
      })));
    } catch (err) {
      console.error('User search failed:', err);
      setSearchResults([]);
    }
  };
  
  const handleSendNotification = async () => {
    if (notificationSending || !notificationTitle.trim() || !notificationMessage.trim()) return;
    setNotificationSending(true);
    setNotificationError('');
    try {
      const targetRoleMap: Record<string, string | null> = {
        all: null,
        electricians: 'electrician',
        dealers: 'dealer',
        customers: 'user',
        counterboys: 'counterboy',
        specific: selectedUser?.role ?? null,
      };
      const created = await notificationApi.create({
        title: notificationTitle.trim(),
        message: notificationMessage.trim(),
        targetRole: targetRoleMap[notificationTarget],
        targetUserIds: notificationTarget === 'specific' && selectedUser ? [selectedUser.id] : null,
        status: 'draft',
      });
      await notificationApi.send(created.id);
      setNotificationSent(true);
      setNotificationTitle('');
      setNotificationMessage('');
      setSpecificUserSearch('');
      setSelectedUser(null);
      setSearchResults([]);
      setTimeout(() => setNotificationSent(false), 3000);
    } catch (error: any) {
      setNotificationError(error?.message || 'Notification could not be sent.');
    } finally {
      setNotificationSending(false);
    }
  };

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text, boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => canEdit && onChange(!value)} disabled={!canEdit} style={{ background: 'none', border: 'none', cursor: canEdit ? 'pointer' : 'not-allowed', color: value ? '#10B981' : C.muted, padding: 0, opacity: canEdit ? 1 : 0.6 }}>
      {value ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
    </button>
  );

  const sections = [
    { id: 'app', label: 'App Info', Icon: Info },
    { id: 'support', label: 'Support', Icon: Headphones },
    { id: 'points', label: 'Points', Icon: Award },
    { id: 'orders', label: 'Order Rules', Icon: ShoppingCart },
    { id: 'tiers', label: 'Tiers', Icon: Medal },
    { id: 'features', label: 'Features', Icon: SlidersHorizontal },
    { id: 'qr-scanned-control', label: 'QR Scanned Control', Icon: ScanLine },
    { id: 'links', label: 'Links', Icon: Link2 },
    { id: 'rateus', label: 'Rate Us', Icon: ThumbsUp },
    { id: 'play-engagement', label: 'Play Engagement', Icon: Play },
    { id: 'catalog', label: 'Catalog PDF', Icon: FileText },
    { id: 'notifications', label: 'Push Notifications', Icon: Bell },
    { id: 'app-icons', label: 'App Icons', Icon: ImageIcon },
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', borderRadius: 16, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AppWindow size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>App Settings</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Configure all app-wide settings — changes reflect in the mobile app</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {config.maintenanceMode && (
            <div style={{ background: 'rgba(239,68,68,0.25)', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#FCA5A5' }}>Maintenance Mode ON</div>
          )}
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 14px', fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>v{config.appVersion}</div>
          <button onClick={handleSave} disabled={!canEdit || saving || loading} style={{ background: saving ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.9)', color: '#7C3AED', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: !canEdit || saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: canEdit ? 1 : 0.7 }}>
            <Save size={15} /> {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>Loading settings...</div>}

      {saved && (
        <div style={{ background: '#D1FAE5', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center', border: '1px solid #A7F3D0' }}>
          <span style={{ fontSize: 18 }}></span>
          <span style={{ fontSize: 14, color: '#065F46', fontWeight: 700 }}>App settings saved! Changes will reflect in the app within a few minutes.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left Nav */}
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: C.shadow }}>
          {sections.map(s => {
            const I = s.Icon;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ width: '100%', padding: '12px 16px', border: 'none', background: activeSection === s.id ? '#7C3AED' : 'transparent', color: activeSection === s.id ? '#fff' : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <I size={16} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Right Content */}
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: '24px', boxShadow: C.shadow }}>

          {activeSection === 'app' && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>App Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><label style={lbl}>App Name</label><input style={inp} value={config.appName} onChange={e => f('appName', e.target.value)} /></div>
                <div><label style={lbl}>Tagline</label><input style={inp} value={config.tagline} onChange={e => f('tagline', e.target.value)} /></div>
                <div><label style={lbl}>Current App Version</label><input style={inp} value={config.appVersion} onChange={e => f('appVersion', e.target.value)} /></div>
                <div><label style={lbl}>Minimum Required Version</label><input style={inp} value={config.minAppVersion} onChange={e => f('minAppVersion', e.target.value)} /></div>
                <div><label style={lbl}>Default Language</label>
                  <select style={inp} value={config.defaultLanguage} onChange={e => f('defaultLanguage', e.target.value)}>
                    <option>English</option><option>Hindi</option><option>Punjabi</option>
                  </select>
                </div>
              </div>
              <div style={{ padding: '16px', background: C.bg, borderRadius: 12, border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Force Update</div>
                    <div style={{ fontSize: 12, color: C.muted }}>Force users to update to minimum version</div>
                  </div>
                  <Toggle value={config.forceUpdate} onChange={v => f('forceUpdate', v)} />
                </div>
              </div>
              <div style={{ padding: '16px', background: config.maintenanceMode ? '#FEF2F2' : C.bg, borderRadius: 12, border: `1px solid ${config.maintenanceMode ? '#FCA5A5' : C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: config.maintenanceMode ? '#DC2626' : C.text }}>Maintenance Mode</div>
                    <div style={{ fontSize: 12, color: C.muted }}>Show maintenance screen to all app users</div>
                  </div>
                  <Toggle value={config.maintenanceMode} onChange={v => f('maintenanceMode', v)} />
                </div>
                {config.maintenanceMode && (
                  <div><label style={lbl}>Maintenance Message</label><input style={inp} value={config.maintenanceMessage} onChange={e => f('maintenanceMessage', e.target.value)} /></div>
                )}
              </div>


            </div>
          )}

          {activeSection === 'support' && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>Support Contact</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><label style={lbl}>Support Phone</label><input style={inp} value={config.supportPhone} onChange={e => f('supportPhone', e.target.value)} /></div>
                <div><label style={lbl}>Support Email</label><input type="email" style={inp} value={config.supportEmail} onChange={e => f('supportEmail', e.target.value)} /></div>
                <div><label style={lbl}>WhatsApp Number (with country code)</label><input style={inp} value={config.whatsappNumber} onChange={e => f('whatsappNumber', e.target.value)} placeholder="918837684004" /></div>
              </div>
            </div>
          )}

          {activeSection === 'points' && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>Points & Rewards Config</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><label style={lbl}>Max Points Per Day (per user)</label><input type="number" style={inp} value={numberInputValue(config.maxPointsPerDay)} onChange={e => f('maxPointsPerDay', parseNumberInput(e.target.value))} /></div>
                <div><label style={lbl}>Min Redemption Points</label><input type="number" style={inp} value={numberInputValue(config.minRedemptionPoints)} onChange={e => f('minRedemptionPoints', parseNumberInput(e.target.value))} /></div>
                <div><label style={lbl}>Points Expiry (days, 0=never)</label><input type="number" style={inp} value={numberInputValue(config.pointsExpiry)} onChange={e => f('pointsExpiry', parseNumberInput(e.target.value))} /></div>
                <div><label style={lbl}>Cashback Rate (pts per ₹1)</label><input type="number" style={inp} value={numberInputValue(config.cashbackRate)} onChange={e => f('cashbackRate', parseNumberInput(e.target.value))} /></div>
                <div><label style={lbl}>Referrer Bonus Points</label><input type="number" style={inp} value={numberInputValue(config.referrerBonus)} onChange={e => f('referrerBonus', parseNumberInput(e.target.value))} /></div>
                <div><label style={lbl}>Referee Bonus Points</label><input type="number" style={inp} value={numberInputValue(config.refereeBonus)} onChange={e => f('refereeBonus', parseNumberInput(e.target.value))} /></div>
                <div><label style={lbl}>Min Transfer Points</label><input type="number" style={inp} value={numberInputValue(config.minTransferPoints)} onChange={e => f('minTransferPoints', parseNumberInput(e.target.value))} /></div>
                <div><label style={lbl}>Dealer Commission Rate (%)</label><input type="number" style={inp} value={numberInputValue(config.dealerCommissionRate)} onChange={e => f('dealerCommissionRate', parseNumberInput(e.target.value))} /></div>
              </div>
            </div>
          )}

          {activeSection === 'orders' && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Minimum Order Amount</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Orders below the configured amount are rejected by the backend for that profile type.</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  ['Electrician', 'minimumOrderAmountElectrician'],
                  ['Dealer', 'minimumOrderAmountDealer'],
                  ['Customer', 'minimumOrderAmountUser'],
                  ['Counter Boy', 'minimumOrderAmountCounterboy'],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label style={lbl}>{label} minimum (₹)</label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      style={inp}
                      value={numberInputValue((config as any)[key])}
                      onChange={e => f(key as keyof AppConfig, parseNumberInput(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'tiers' && (
            <div style={{ display: 'grid', gap: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 12 }}>Electrician Tiers (Points)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                  {[['Silver', 'silverMin'], ['Gold', 'goldMin'], ['Platinum', 'platinumMin'], ['Diamond', 'diamondMin']].map(([label, key]) => (
                    <div key={key} style={{ background: C.bg, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>{label}</div>
                      <label style={lbl}>Min Points</label>
                      <input type="number" style={inp} value={numberInputValue((config as any)[key])} onChange={e => f(key as keyof AppConfig, parseNumberInput(e.target.value))} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 12 }}>Dealer Tiers (Electrician Count)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                  {[['Silver', 'dealerSilverMin'], ['Gold', 'dealerGoldMin'], ['Platinum', 'dealerPlatinumMin'], ['Diamond', 'dealerDiamondMin']].map(([label, key]) => (
                    <div key={key} style={{ background: C.bg, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>{label}</div>
                      <label style={lbl}>Min Electricians</label>
                      <input type="number" style={inp} value={numberInputValue((config as any)[key])} onChange={e => f(key as keyof AppConfig, parseNumberInput(e.target.value))} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'features' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>App Features Toggle</div>
              {[
                { key: 'scanEnabled', label: 'QR Scan & Earn', desc: 'Allow electricians to scan QR codes and earn points' },
                { key: 'giftsEnabled', label: 'Gift Store', desc: 'Show gift store and allow gift redemptions' },
                { key: 'referralEnabled', label: 'Referral System', desc: 'Allow users to refer friends and earn bonus points' },
                { key: 'transferPointsEnabled', label: 'Transfer Points', desc: 'Allow electricians to transfer points to dealers' },
                { key: 'testimonialsEnabled', label: 'Testimonials Section', desc: 'Show testimonials section on all home screens in the app' },
                { key: 'playEnabled', label: 'Play Zone (Videos)', desc: 'Enable the Play Zone video section for customers. Disable to show a "Coming Soon" screen instead.' },
                { key: 'dealerCanAddElectrician', label: 'Dealer Can Add Electrician', desc: 'Allow dealers to add new electricians from their app. When disabled, the "Add Electrician" button is hidden from dealer screens.' },
                { key: 'upiOnlyMode', label: 'UPI Only Mode (Bank Details)', desc: 'When enabled, Bank Details page shows only Account Holder Name & UPI ID. Account number, IFSC and bank selection are hidden.' },
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: C.bg, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <Toggle value={(config as any)[item.key]} onChange={v => f(item.key as keyof AppConfig, v)} />
                </div>
              ))}
            </div>
          )}

          {activeSection === 'qr-scanned-control' && (
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>QR Scanned Control</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                  Control which first scanner details are visible in the mobile app when a QR has already been scanned.
                </div>
              </div>

              {[
                { key: 'qrFirstScannerShowScannerName', label: 'Scanner Name', desc: 'Show the name of the first user who scanned the QR.' },
                { key: 'qrFirstScannerShowScannerPhone', label: 'Scanner Phone Number', desc: 'Show the phone number of the first scanner.' },
                { key: 'qrFirstScannerShowDealerName', label: 'Dealer Name', desc: 'Show the linked dealer name in first scanner details.' },
                { key: 'qrFirstScannerShowDealerPhone', label: 'Dealer Phone Number', desc: 'Show the linked dealer phone number in first scanner details.' },
                { key: 'qrFirstScannerShowProductName', label: 'Product Name', desc: 'Show the product name attached to the QR code.' },
                { key: 'qrFirstScannerShowScannedAt', label: 'Scan Date & Time', desc: 'Show when the QR was first scanned.' },
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{item.desc}</div>
                  </div>
                  <Toggle value={(config as any)[item.key]} onChange={v => f(item.key as keyof AppConfig, v)} />
                </div>
              ))}

              <div style={{ padding: '14px', background: '#DBEAFE', borderRadius: 10, border: '1px solid #93C5FD', fontSize: 12, color: '#1E40AF', lineHeight: 1.6 }}>
                <strong>Note:</strong> These controls affect only the mobile app first scanner details screen. Admin QR Scanner will continue to show full internal records.
              </div>
            </div>
          )}

          {activeSection === 'links' && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>App Links & URLs</div>
              <div style={{ display: 'grid', gap: 14 }}>
                <div><label style={lbl}>Privacy Policy URL</label><input style={inp} value={config.privacyPolicyUrl} onChange={e => f('privacyPolicyUrl', e.target.value)} /></div>
                <div><label style={lbl}>Terms & Conditions URL</label><input style={inp} value={config.termsUrl} onChange={e => f('termsUrl', e.target.value)} /></div>
                <div><label style={lbl}>Play Store URL</label><input style={inp} value={config.playStoreUrl} onChange={e => f('playStoreUrl', e.target.value)} /></div>
                <div><label style={lbl}>App Store URL</label><input style={inp} value={config.appStoreUrl} onChange={e => f('appStoreUrl', e.target.value)} /></div>
              </div>
            </div>
          )}

          {activeSection === 'rateus' && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>Rate Us Configuration</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>Configure when and how to prompt users to rate the app</div>
              
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Enable Rate Us Prompt</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Show rating prompt to users in the app</div>
                  </div>
                  <Toggle value={config.rateUsEnabled} onChange={v => f('rateUsEnabled', v)} />
                </div>

                <div>
                  <label style={lbl}>Minimum Scans Before Prompt</label>
                  <input 
                    type="number" 
                    style={inp} 
                    value={numberInputValue(config.rateUsMinScans)} 
                    onChange={e => f('rateUsMinScans', parseNumberInput(e.target.value))} 
                  />
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>User must complete this many scans before seeing the rating prompt</div>
                </div>

                <div>
                  <label style={lbl}>Prompt Delay (days)</label>
                  <input 
                    type="number" 
                    style={inp} 
                    value={numberInputValue(config.rateUsPromptDelay)} 
                    onChange={e => f('rateUsPromptDelay', parseNumberInput(e.target.value))} 
                  />
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Days to wait before showing the prompt again if user dismisses it</div>
                </div>

                <div>
                  <label style={lbl}>Play Store Rating URL</label>
                  <input 
                    style={inp} 
                    value={config.playStoreRatingUrl} 
                    onChange={e => f('playStoreRatingUrl', e.target.value)} 
                    placeholder="market://details?id=com.yourapp"
                  />
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Deep link to your app's Play Store rating page</div>
                </div>

                <div>
                  <label style={lbl}>App Store Rating URL</label>
                  <input 
                    style={inp} 
                    value={config.appStoreRatingUrl} 
                    onChange={e => f('appStoreRatingUrl', e.target.value)} 
                    placeholder="https://apps.apple.com/app/yourapp"
                  />
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Link to your app's App Store rating page</div>
                </div>

                <div style={{ padding: '16px', background: '#DBEAFE', borderRadius: 12, border: '1px solid #93C5FD' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF', marginBottom: 8 }}>Rate Us Prompt Preview</div>
                  <div style={{ background: 'white', borderRadius: 10, padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>⭐⭐⭐⭐⭐</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 6 }}>Enjoying SRV Electricals?</div>
                      <div style={{ fontSize: 13, color: '#6B7280' }}>Rate us on the store and help us improve!</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 8, padding: '10px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
                        Maybe Later
                      </div>
                      <div style={{ flex: 1, background: '#7C3AED', borderRadius: 8, padding: '10px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>
                        Rate Now
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: 16, background: C.bg, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>User Rating History</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>See who rated the app and how many stars they gave.</div>
                    </div>
                    <button
                      onClick={loadRatingHistory}
                      disabled={ratingsLoading}
                      style={{ padding: '8px 13px', borderRadius: 9, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 12, fontWeight: 700, cursor: ratingsLoading ? 'not-allowed' : 'pointer' }}
                    >
                      {ratingsLoading ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(80px, 1fr))', gap: 10, marginBottom: 14 }}>
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#F59E0B' }}>{ratingSummary[String(star)] ?? ratingSummary[star] ?? 0}</div>
                        <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginTop: 2 }}>{star} Star</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: 10, background: C.card }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                          {['User', 'Role', 'Rating', 'Review', 'Updated'].map((h) => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ratingHistory.map((item) => (
                          <tr key={`${item.userId}-${item.updatedAt}`} style={{ borderBottom: `1px solid ${C.border}` }}>
                            <td style={{ padding: '11px 12px' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{item.userName || 'Unknown User'}</div>
                              <div style={{ fontSize: 11, color: C.muted }}>{item.phone || '—'} {item.code ? `• ${item.code}` : ''}</div>
                            </td>
                            <td style={{ padding: '11px 12px', fontSize: 12, color: C.muted, textTransform: 'capitalize' }}>{item.userRole || '—'}</td>
                            <td style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>
                              <span style={{ color: '#F59E0B', fontWeight: 900 }}>{'★'.repeat(Number(item.rating || 0))}</span>
                              <span style={{ color: C.muted, fontSize: 12, marginLeft: 6 }}>{item.rating}/5</span>
                            </td>
                            <td style={{ padding: '11px 12px', fontSize: 12, color: C.text, maxWidth: 320 }}>{item.review || '—'}</td>
                            <td style={{ padding: '11px 12px', fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>{item.updatedAt ? new Date(item.updatedAt).toLocaleString('en-IN') : '—'}</td>
                          </tr>
                        ))}
                        {!ratingsLoading && ratingHistory.length === 0 && (
                          <tr>
                            <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: C.muted, fontSize: 13 }}>No ratings submitted yet.</td>
                          </tr>
                        )}
                        {ratingsLoading && (
                          <tr>
                            <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: C.muted, fontSize: 13 }}>Loading rating history...</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ padding: '14px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12, color: C.muted }}>
                  <strong>Note:</strong> The rating prompt will only show to users who have completed at least {config.rateUsMinScans} scans. 
                  If dismissed, it will reappear after {config.rateUsPromptDelay} days.
                </div>
              </div>
            </div>
          )}

          {activeSection === 'catalog' && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>Product Catalog PDFs</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>
                Upload separate PDF catalogs for dealers and for all other app users.
              </div>

              {/* Current PDF URL */}
              <div style={{ padding: '16px', background: C.bg, borderRadius: 12, border: `1px solid ${C.border}` }}>
                <label style={lbl}>General Catalog PDF URL</label>
                <input
                  style={inp}
                  value={config.generalCatalogPdfUrl}
                  onChange={e => f('generalCatalogPdfUrl', e.target.value)}
                  placeholder="https://... (electrician, customer, counter boy)"
                />
                {config.generalCatalogPdfUrl && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <a href={config.generalCatalogPdfUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563EB', textDecoration: 'underline' }}>
                      Preview general catalog
                    </a>
                  </div>
                )}
              </div>

              {/* Upload new PDF */}
              {canEdit && (
                <CatalogPdfUploader
                  onUploaded={(url) => saveCatalogUrl('generalCatalogPdfUrl', url)}
                  C={C}
                  lbl={lbl}
                />
              )}

              <div style={{ padding: '16px', background: C.bg, borderRadius: 12, border: `1px solid ${C.border}` }}>
                <label style={lbl}>Dealer Catalog PDF URL</label>
                <input
                  style={inp}
                  value={config.dealerCatalogPdfUrl}
                  onChange={e => f('dealerCatalogPdfUrl', e.target.value)}
                  placeholder="https://... (dealer catalog)"
                />
                {config.dealerCatalogPdfUrl && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <a href={config.dealerCatalogPdfUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563EB', textDecoration: 'underline' }}>
                      Preview dealer catalog
                    </a>
                  </div>
                )}
              </div>

              {canEdit && (
                <CatalogPdfUploader
                  onUploaded={(url) => saveCatalogUrl('dealerCatalogPdfUrl', url)}
                  C={C}
                  lbl={lbl}
                />
              )}

              <div style={{ padding: '14px', background: '#DBEAFE', borderRadius: 10, border: '1px solid #93C5FD', fontSize: 12, color: '#1E40AF' }}>
                <strong>How it works:</strong> Uploaded PDFs are saved automatically. Dealer users get the dealer catalog, while electrician, customer and counter boy users get the general catalog.
              </div>
            </div>
          )}

          {activeSection === 'play-engagement' && (
            <PlayEngagement canEdit={canEdit} />
          )}

          {activeSection === 'notifications' && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>Push Notifications</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>Send push notifications to users in the mobile app</div>
              
              {notificationSent && (
                <div style={{ background: '#D1FAE5', borderRadius: 12, padding: '12px 18px', display: 'flex', gap: 10, alignItems: 'center', border: '1px solid #A7F3D0' }}>
                  <span style={{ fontSize: 18 }}></span>
                  <span style={{ fontSize: 14, color: '#065F46', fontWeight: 700 }}>Notification sent successfully!</span>
                </div>
              )}
              {notificationError && (
                <div style={{ background: '#FEF2F2', borderRadius: 12, padding: '12px 18px', border: '1px solid #FECACA', fontSize: 13, color: '#B91C1C', fontWeight: 700 }}>{notificationError}</div>
              )}

              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={lbl}>Target Audience</label>
                  <select style={inp} value={notificationTarget} onChange={e => { setNotificationTarget(e.target.value); setSelectedUser(null); setSpecificUserSearch(''); setSearchResults([]); }}>
                    <option value="all">All Users</option>
                    <option value="electricians">All Electricians</option>
                    <option value="dealers">All Dealers</option>
                    <option value="customers">All Customers</option>
                    <option value="counterboys">All Counterboys</option>
                    <option value="specific">Specific User</option>
                  </select>
                </div>

                {notificationTarget === 'specific' && (
                  <div>
                    <label style={lbl}>Search User (by ID, Name, Code, or Phone)</label>
                    <input 
                      style={inp} 
                      value={specificUserSearch} 
                      onChange={e => handleUserSearch(e.target.value)} 
                      placeholder="Type to search: User ID, Name, Code, or Phone Number"
                    />
                    
                    {selectedUser && (
                      <div style={{ marginTop: 10, padding: '12px', background: '#DBEAFE', borderRadius: 10, border: '1px solid #93C5FD' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1E40AF' }}>{selectedUser.name}</div>
                            <div style={{ fontSize: 12, color: '#3B82F6', marginTop: 2 }}>
                              {selectedUser.type} • {selectedUser.code} • {selectedUser.phone}
                            </div>
                          </div>
                          <button 
                            onClick={() => { setSelectedUser(null); setSpecificUserSearch(''); }}
                            style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 20, padding: 4 }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {!selectedUser && searchResults.length > 0 && (
                      <div style={{ marginTop: 10, maxHeight: 200, overflowY: 'auto', border: `1px solid ${C.border}`, borderRadius: 10, background: C.card }}>
                        {searchResults.map(user => (
                          <div 
                            key={user.id}
                            onClick={() => { setSelectedUser(user); setSearchResults([]); setSpecificUserSearch(user.name); }}
                            style={{ 
                              padding: '12px 14px', 
                              borderBottom: `1px solid ${C.border}`, 
                              cursor: 'pointer',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = C.bg}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{user.name}</div>
                                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                                  {user.type} • Code: {user.code} • {user.phone}
                                </div>
                                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                                  {user.type === 'Electrician' ? `${(user as any).city}, ${(user as any).state}` : `${(user as any).town}, ${(user as any).state}`}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase' }}>{(user as any).tier}</div>
                                {user.type === 'Electrician' && (
                                  <div style={{ fontSize: 11, color: '#10B981', marginTop: 2 }}>⭐ {user.points} pts</div>
                                )}
                                {user.type === 'Dealer' && (
                                  <div style={{ fontSize: 11, color: '#F59E0B', marginTop: 2 }}>Team {(user as any).electricians}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {!selectedUser && specificUserSearch.length >= 2 && searchResults.length === 0 && (
                      <div style={{ marginTop: 10, padding: '12px', background: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA', fontSize: 13, color: '#DC2626' }}>
                        No users found matching "{specificUserSearch}"
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label style={lbl}>Notification Title</label>
                  <input 
                    style={inp} 
                    value={notificationTitle} 
                    onChange={e => setNotificationTitle(e.target.value)} 
                    placeholder="Enter notification title"
                    maxLength={50}
                  />
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{notificationTitle.length}/50 characters</div>
                </div>

                <div>
                  <label style={lbl}>Notification Message</label>
                  <textarea 
                    style={{ ...inp, minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }} 
                    value={notificationMessage} 
                    onChange={e => setNotificationMessage(e.target.value)} 
                    placeholder="Enter notification message"
                    maxLength={200}
                  />
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{notificationMessage.length}/200 characters</div>
                </div>

                <div style={{ padding: '16px', background: '#FEF3C7', borderRadius: 12, border: '1px solid #FCD34D' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>Preview</div>
                  <div style={{ background: 'white', borderRadius: 8, padding: '12px', marginTop: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>
                      {notificationTitle || 'Notification Title'}
                    </div>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>
                      {notificationMessage || 'Your notification message will appear here...'}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSendNotification}
                  disabled={!canEdit || notificationSending || !notificationTitle || !notificationMessage || (notificationTarget === 'specific' && !selectedUser)}
                  style={{ 
                    background: (!notificationTitle || !notificationMessage || (notificationTarget === 'specific' && !selectedUser)) 
                      ? C.muted 
                      : 'linear-gradient(135deg, #7C3AED, #5B21B6)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 12, 
                    padding: '13px 32px', 
                    fontSize: 14, 
                    fontWeight: 700, 
                    cursor: (!notificationTitle || !notificationMessage || (notificationTarget === 'specific' && !selectedUser)) ? 'not-allowed' : 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    opacity: (!notificationTitle || !notificationMessage || (notificationTarget === 'specific' && !selectedUser)) ? 0.5 : 1
                  }}
                >
                  <Bell size={16} /> {notificationSending ? 'Sending...' : 'Send Notification'}
                </button>

                <div style={{ padding: '14px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12, color: C.muted }}>
                  <strong>Note:</strong> Notifications are sent immediately. Make sure to review the title and message before sending. 
                  {notificationTarget === 'all' && ' This will send to ALL users in the app.'}
                  {notificationTarget === 'electricians' && ' This will send to ALL electricians.'}
                  {notificationTarget === 'dealers' && ' This will send to ALL dealers.'}
                  {notificationTarget === 'customers' && ' This will send to ALL customers.'}
                  {notificationTarget === 'counterboys' && ' This will send to ALL counterboys.'}
                  {notificationTarget === 'specific' && selectedUser && ` This will send to ${selectedUser.name} only.`}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'app-icons' && (
            <AppIcons role={role} />
          )}

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
            <button onClick={handleSave} disabled={!canEdit || saving || loading} style={{ background: saving ? C.muted : `linear-gradient(135deg, #7C3AED, #5B21B6)`, color: 'white', border: 'none', borderRadius: 12, padding: '13px 32px', fontSize: 14, fontWeight: 700, cursor: !canEdit || saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: canEdit ? 1 : 0.7 }}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
