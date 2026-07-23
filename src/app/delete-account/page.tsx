'use client';

import { FormEvent, useState } from 'react';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.srvelectricals.in/api/v1').replace(/\/$/, '');

export default function DeleteAccountPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', reason: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/mobile/account-deletion-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || 'Unable to submit the request.');
      setStatus('success');
      setMessage(payload.message || 'Your deletion request has been received.');
      setForm({ name: '', phone: '', email: '', reason: '' });
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to submit the request.');
    }
  }

  const field = (key: keyof typeof form, label: string, type = 'text') => (
    <label style={{ display: 'grid', gap: 7, color: '#344054', fontWeight: 700 }}>
      {label}
      <input
        type={type}
        value={form[key]}
        onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
        style={{ minHeight: 48, border: '1px solid #d0d5dd', borderRadius: 12, padding: '0 14px', font: 'inherit' }}
      />
    </label>
  );

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(145deg,#f8fafc,#fff5f4)', padding: '48px 18px', color: '#101828' }}>
      <section style={{ width: 'min(720px,100%)', margin: '0 auto', background: '#fff', border: '1px solid #eaecf0', borderRadius: 24, padding: 'clamp(24px,5vw,46px)', boxShadow: '0 24px 70px rgba(16,24,40,.10)' }}>
        <div style={{ color: '#ef2f36', fontWeight: 900, letterSpacing: '.08em' }}>SRV ELECTRICALS</div>
        <h1 style={{ fontSize: 'clamp(30px,5vw,44px)', lineHeight: 1.1, margin: '14px 0 12px' }}>Request account deletion</h1>
        <p style={{ color: '#475467', lineHeight: 1.7, marginBottom: 28 }}>
          Submit this form to request permanent deletion of your SRV Electricals app account and associated personal data. We will verify your identity before processing the request. Transaction records may be retained only where required by law, accounting, or fraud-prevention obligations.
        </p>
        <form onSubmit={submit} style={{ display: 'grid', gap: 18 }}>
          {field('name', 'Name')}
          {field('phone', 'Registered mobile number')}
          {field('email', 'Email address', 'email')}
          <label style={{ display: 'grid', gap: 7, color: '#344054', fontWeight: 700 }}>
            Additional details (optional)
            <textarea value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} rows={4} style={{ border: '1px solid #d0d5dd', borderRadius: 12, padding: 14, font: 'inherit', resize: 'vertical' }} />
          </label>
          <p style={{ margin: 0, color: '#667085', fontSize: 14 }}>Provide at least a valid 10-digit mobile number or email address.</p>
          <button type="submit" disabled={status === 'loading'} style={{ minHeight: 52, border: 0, borderRadius: 14, background: '#ef2f36', color: '#fff', fontWeight: 800, fontSize: 16, cursor: status === 'loading' ? 'wait' : 'pointer', opacity: status === 'loading' ? .7 : 1 }}>
            {status === 'loading' ? 'Submitting…' : 'Submit deletion request'}
          </button>
        </form>
        {message ? <p role="status" style={{ marginTop: 18, padding: 14, borderRadius: 12, background: status === 'success' ? '#ecfdf3' : '#fff1f0', color: status === 'success' ? '#067647' : '#b42318' }}>{message}</p> : null}
        <p style={{ color: '#667085', fontSize: 14, lineHeight: 1.6, marginTop: 26 }}>
          You can also initiate deletion inside the app from Account → Delete Account. For assistance, email <a href="mailto:srvelectericals.app@gmail.com" style={{ color: '#d92d27' }}>srvelectericals.app@gmail.com</a>.
        </p>
      </section>
    </main>
  );
}
