 'use client';
import { useRef, useState } from 'react';
import { documentUrl, uploadKycDocument } from '@/lib/api';

export function DocThumb({ src, C }: { src?: string; C: any }) {
  const [failed, setFailed] = useState(false);
  const url = documentUrl(src);
  if (!url) return <span style={{ color: C.muted, fontSize: 11 }}>{src ? 'Legacy file unavailable — upload again' : 'Not uploaded'}</span>;
  const pdf = /\.pdf(?:[?#]|$)/i.test(url) || url.startsWith('data:application/pdf');
  return <a href={url} target="_blank" rel="noreferrer" style={{ color: C.red, fontSize: 12 }}>
    {pdf ? 'Open PDF' : failed ? 'Image unavailable — open file' : <img src={url} alt="KYC document" onError={() => setFailed(true)} style={{ width: 64, height: 48, objectFit: 'contain', borderRadius: 6, border: `1px solid ${C.border}` }} />}
  </a>;
}

export function ImageUploadBox({ label, value, onChange, onBusy, C }: {
  label: string; value?: string; onChange: (value: string) => void; onBusy: (busy: boolean) => void; C: any;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  return <div>
    <div style={{ color: C.muted, fontWeight: 700, marginBottom: 8 }}>{label}</div>
    {value && <DocThumb key={value} src={value} C={C} />}
    <button type="button" disabled={uploading} onClick={() => ref.current?.click()} style={{ display: 'block', padding: 10, marginTop: 8, border: `1px solid ${C.border}`, borderRadius: 8, background: C.bg, color: C.text }}>{uploading ? 'Uploading...' : value ? 'Replace document' : 'Upload image or PDF'}</button>
    {error && <div role="alert" style={{ color: '#991B1B' }}>{error}</div>}
    <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,application/pdf" hidden disabled={uploading} onChange={async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) { setError('Maximum file size is 10 MB.'); return; }
      setUploading(true); onBusy(true); setError('');
      try { onChange(await uploadKycDocument(file)); }
      catch (err) { setError(err instanceof Error ? err.message : 'Upload failed'); }
      finally { setUploading(false); onBusy(false); if (ref.current) ref.current.value = ''; }
    }} />
  </div>;
}
