'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Save } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { settingsApi } from '@/lib/api';
import { I } from '@/lib/iconMap';

const DEFAULT_CONTENT = `Privacy Policy - SRV Electricals

Last Updated: April 2026

Your data stays protected with SRV

We keep this policy simple so dealers and electricians can quickly understand what we collect, why we use it, and how you stay in control.

- Clear use of data
- Policy updates shared

1. Information Collection
We collect personal information such as your name, phone number, email address, and business details when you register for an account. We also collect usage data including scan history, reward points, and app interactions.

2. Use of Information
Your information is used to provide and improve our services, process reward point transactions, communicate with you about your account, and send promotional notifications with your consent.

3. Data Security
We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.

4. Information Sharing
We do not sell your personal information. We may share data with connected dealers (for electrician accounts) and service providers who assist in operating our app, subject to confidentiality agreements.

5. User Rights
You have the right to access, update, or delete your personal information at any time through the app settings or by contacting our support team.

6. Cookies & Tracking
We use cookies and similar tracking technologies to maintain app functionality and analyze usage patterns. You can manage cookie preferences in your device settings.

7. Third-Party Links
Our app may contain links to third-party websites. We are not responsible for the privacy practices of these external sites.

8. Children's Privacy
Our services are not intended for users under 18 years of age. We do not knowingly collect information from minors.

9. Policy Changes
We may update this Privacy Policy periodically. We will notify you of significant changes through app notifications or emails.

10. Contact Us
For privacy-related queries, contact us at:
Email: info@srvelectricals.com
Phone: +91 8837684004`;

export default function PrivacyPolicy({ role }: { role?: import('@/lib/types').AdminRole }) {
  const C = useThemePalette();
  const canEdit = role === 'super_admin' || role === 'admin';
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    settingsApi.getAll().then((rows: any[]) => {
      if (!rows?.length) return;
      const map: Record<string, string> = {};
      rows.forEach((r: any) => { map[r.key] = r.value; });
      if (map['privacy_policy_content']) setContent(map['privacy_policy_content']);
      if (map['privacy_policy_updated']) setLastUpdated(map['privacy_policy_updated']);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    try {
      await Promise.all([
        settingsApi.update('privacy_policy_content', content),
        settingsApi.update('privacy_policy_updated', now),
      ]);
      setLastUpdated(now);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 13, outline: 'none' };

  const renderPreview = (text: string) => text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
    if (/^\d+\.\s+[A-Z]/.test(line)) return <h3 key={i} style={{ fontSize: 14, fontWeight: 800, color: C.text, margin: '16px 0 6px' }}>{line}</h3>;
    if (/^Privacy Policy/.test(line)) return <h2 key={i} style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: '0 0 4px' }}>{line}</h2>;
    if (/^Last Updated/.test(line)) return <div key={i} style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>{line}</div>;
    if (line.startsWith('- ')) return <div key={i} style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, paddingLeft: 16 }}>• {line.slice(2)}</div>;
    return <p key={i} style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, margin: '4px 0' }}>{line}</p>;
  });

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 24 }}>
      <div style={{ background: 'linear-gradient(135deg, #1E293B, #334155)', borderRadius: 16, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Privacy Policy</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Manage the app privacy policy content</div>
          </div>
        </div>
        {lastUpdated && (
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 16px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Last Updated</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{lastUpdated}</div>
          </div>
        )}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
          <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Edit Content</div>
              <div style={{ fontSize: 12, color: C.muted }}>{content.length} characters</div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={28}
                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const, resize: 'vertical' as const, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6 }} />
            </div>
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {saved ? <div style={{ fontSize: 13, fontWeight: 600, color: '#16A34A' }}>Published successfully!</div> : <div />}
              <button onClick={handleSave} disabled={saving || !canEdit} style={{ padding: '10px 24px', borderRadius: 9, border: 'none', background: (saving || !canEdit) ? C.muted : 'linear-gradient(135deg, #1D4ED8, #1E40AF)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: (saving || !canEdit) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Save size={14} /> {saving ? 'Saving...' : canEdit ? 'Save & Publish' : 'View Only'}
              </button>
            </div>
          </div>

          <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Preview</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>How it appears in the app</div>
            </div>
            <div style={{ padding: '20px', maxHeight: 600, overflowY: 'auto' }}>
              <div style={{ background: C.surface, borderRadius: 12, padding: '20px', border: `1px solid ${C.border}` }}>
                {renderPreview(content)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
