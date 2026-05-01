'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Save } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { settingsApi } from '@/lib/api';

const DEFAULTS = {
  title: 'Earn Rewards with Every Purchase!',
  description: 'Join thousands of electricians earning reward points on SRV Electricals products. Scan QR codes, earn points, and redeem exciting gifts.',
  ctaText: 'Start Earning Now',
  ctaLink: 'https://srvelectricals.in/app',
  isActive: 'true',
};

export default function PromoSection({ role }: { role?: import('@/lib/types').AdminRole }) {
  const C = useThemePalette();
  const canEdit = role === 'super_admin' || role === 'admin';
  const [form, setForm] = useState({ title: DEFAULTS.title, description: DEFAULTS.description, ctaText: DEFAULTS.ctaText, ctaLink: DEFAULTS.ctaLink, isActive: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    settingsApi.getAll().then((rows: any[]) => {
      if (!rows?.length) return;
      const map: Record<string, string> = {};
      rows.forEach((r: any) => { map[r.key] = r.value; });
      setForm({
        title: map['promo_title'] ?? DEFAULTS.title,
        description: map['promo_description'] ?? DEFAULTS.description,
        ctaText: map['promo_cta_text'] ?? DEFAULTS.ctaText,
        ctaLink: map['promo_cta_link'] ?? DEFAULTS.ctaLink,
        isActive: (map['promo_is_active'] ?? 'true') === 'true',
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      await Promise.all([
        settingsApi.update('promo_title', form.title),
        settingsApi.update('promo_description', form.description),
        settingsApi.update('promo_cta_text', form.ctaText),
        settingsApi.update('promo_cta_link', form.ctaLink),
        settingsApi.update('promo_is_active', String(form.isActive)),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' as const };
  const labelStyle = { fontSize: 12, fontWeight: 600 as const, color: C.muted, marginBottom: 5, display: 'block' as const };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 24 }}>
      <div style={{ background: 'linear-gradient(135deg, #7C3AED, #1D4ED8)', borderRadius: 16, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Megaphone size={24} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Promo Section Config</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Configure the promotional section shown on the app home screen</div>
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20, alignItems: 'start' }}>
          {/* Form */}
          <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Promo Content</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Edit the promotional section content</div>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Promo Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Enter promo title..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Promo Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Enter promo description..." rows={4} style={{ ...inputStyle, resize: 'vertical' as const }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>CTA Button Text</label>
                  <input value={form.ctaText} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))} placeholder="e.g. Learn More" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>CTA Button Link</label>
                  <input value={form.ctaLink} onChange={e => setForm(f => ({ ...f, ctaLink: e.target.value }))} placeholder="https://..." style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
                <input type="checkbox" id="promo-active" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: C.red }} />
                <label htmlFor="promo-active" style={{ fontSize: 13, color: C.text, cursor: 'pointer', fontWeight: 600 }}>Active</label>
                <span style={{ fontSize: 12, color: C.muted, marginLeft: 4 }}>Show this promo section in the app</span>
              </div>
              {saved && <div style={{ padding: '10px', borderRadius: 8, background: 'rgba(34,197,94,0.15)', color: '#16A34A', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>✓ Promo section saved!</div>}
              <button onClick={handleSave} disabled={!canEdit || saving} style={{ padding: '11px', borderRadius: 9, border: 'none', background: saving ? C.muted : 'linear-gradient(135deg, #7C3AED, #1D4ED8)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: !canEdit || saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: canEdit ? 1 : 0.7 }}>
                <Save size={15} /> {saving ? 'Saving...' : 'Save & Publish'}
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Live Preview</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>How it looks in the app</div>
              </div>
              <span style={{ background: form.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: form.isActive ? '#16A34A' : '#DC2626', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                {form.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ maxWidth: 320, margin: '0 auto' }}>
                <div style={{ background: '#1a1a2e', borderRadius: 24, padding: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px 8px', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                    <span>9:41</span><span>●●● 📶 🔋</span>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', borderRadius: 12, padding: '12px', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>SRV Electricals</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Welcome back! 👋</div>
                  </div>
                  <div style={{ background: form.isActive ? 'linear-gradient(135deg, #7C3AED, #1D4ED8)' : '#374151', borderRadius: 12, padding: '16px', marginBottom: 8, opacity: form.isActive ? 1 : 0.5 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 6, lineHeight: 1.3 }}>{form.title || 'Promo Title'}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, marginBottom: 12 }}>{form.description ? form.description.slice(0, 100) + (form.description.length > 100 ? '...' : '') : 'Description...'}</div>
                    {form.ctaText && <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '6px 14px', borderRadius: 20 }}>{form.ctaText} →</div>}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: C.muted }}>App home screen preview</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
