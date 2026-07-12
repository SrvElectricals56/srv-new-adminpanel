'use client';
import { type ReactNode, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { AlertCircle, CalendarClock, CheckCircle2, ImageUp, Phone, QrCode, RefreshCw, Search, ShieldCheck, UserRound } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { qrCodeApi } from '@/lib/api';
import AlertDialog from '@/components/Shared/AlertDialog';

type ScanLookupResult = {
  qrCodeId?: string;
  code?: string;
  firstScan?: {
    userName?: string | null;
    name?: string | null;
    phone?: string | null;
    code?: string | null;
    role?: string | null;
    dealerName?: string | null;
    dealerPhone?: string | null;
    dealerCode?: string | null;
    productName?: string | null;
    points?: number | null;
    pointsRedeemed?: number | null;
    scannedAt?: string | null;
    location?: string | null;
  } | null;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

async function decodeQrImage(file: File): Promise<string> {
  const image = await loadImage(file);
  const canvas = document.createElement('canvas');
  const maxSize = 1400;
  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Unable to prepare this image for scanning.');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });

  if (!decoded?.data) {
    throw new Error('No QR code found in this image. Please upload a clear, straight QR image.');
  }
  return decoded.data;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unable to load this image.'));
    };
    image.src = url;
  });
}

export default function QRScanner() {
  const C = useThemePalette();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [manualValue, setManualValue] = useState('');
  const [decodedValue, setDecodedValue] = useState('');
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'decoded' | 'failed'>('idle');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanLookupResult | null>(null);
  const [alertDialog, setAlertDialog] = useState({ show: false, title: '', message: '', type: 'info' as 'success' | 'error' | 'warning' | 'info' });

  const showError = (message: string) => {
    setAlertDialog({ show: true, title: 'QR Scanner', message, type: 'error' });
  };

  const lookup = async (value: string) => {
    const qrValue = value.trim();
    if (!qrValue) {
      showError('Please upload a QR image or enter a QR value first.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await qrCodeApi.scanLookup(qrValue);
      setResult(res);
      if (!res?.firstScan) {
        setAlertDialog({
          show: true,
          title: 'QR Found',
          message: 'This QR exists, but it has not been scanned yet.',
          type: 'info',
        });
      }
    } catch (error: any) {
      showError(error?.message || 'Unable to read this QR code.');
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setDecodedValue('');
    setPreviewUrl(current => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setScanStatus('scanning');
    setResult(null);
    try {
      const value = await decodeQrImage(file);
      setDecodedValue(value);
      setManualValue(value);
      setScanStatus('decoded');
      await lookup(value);
    } catch (error: any) {
      setScanStatus('failed');
      showError(error?.message || 'Unable to scan this image.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const firstScan = result?.firstScan;
  const scannerName = firstScan?.userName || firstScan?.name || 'Not available';

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1180 }}>
      <AlertDialog
        show={alertDialog.show}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog(current => ({ ...current, show: false }))}
      />

      <div style={{ background: `linear-gradient(135deg, ${C.sidebar}, #1E293B)`, borderRadius: 20, padding: '24px 28px', marginBottom: 22, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <QrCode size={28} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>QR Scanner</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 4 }}>Upload a QR image and view the first scanner details from SRV records</div>
          </div>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          style={{ border: 'none', background: '#fff', color: C.sidebar, borderRadius: 12, padding: '12px 18px', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <ImageUp size={17} /> Choose QR Image
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: 18, alignItems: 'start' }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: C.shadow }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: C.text, marginBottom: 6 }}>Scan From Desktop</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 18 }}>
            Select a downloaded QR image from your laptop. If the browser cannot decode the image, paste the QR code value manually.
          </div>

          <label
            onClick={() => inputRef.current?.click()}
            style={{ minHeight: 300, border: `2px dashed ${scanStatus === 'decoded' ? '#10B981' : scanStatus === 'failed' ? '#EF4444' : C.border}`, background: C.bg, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted, marginBottom: 16, overflow: 'hidden', position: 'relative' }}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Uploaded QR" style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain', opacity: scanStatus === 'scanning' ? 0.62 : 0.86 }} />
            ) : (
              <div style={{ display: 'grid', justifyItems: 'center', gap: 10 }}>
                <ImageUp size={34} color="#2563EB" />
                <strong style={{ color: C.text, fontSize: 14 }}>Upload QR Image</strong>
                <span style={{ fontSize: 12 }}>{fileName || 'PNG, JPG, JPEG supported'}</span>
              </div>
            )}
            <div style={{ position: 'absolute', width: 210, height: 210, borderRadius: 18, border: '2px solid rgba(37,99,235,0.35)', boxShadow: '0 0 0 999px rgba(15,23,42,0.08), 0 0 30px rgba(37,99,235,0.25)', pointerEvents: 'none' }}>
              <span style={{ position: 'absolute', left: -2, top: -2, width: 34, height: 34, borderLeft: '5px solid #2563EB', borderTop: '5px solid #2563EB', borderTopLeftRadius: 18 }} />
              <span style={{ position: 'absolute', right: -2, top: -2, width: 34, height: 34, borderRight: '5px solid #2563EB', borderTop: '5px solid #2563EB', borderTopRightRadius: 18 }} />
              <span style={{ position: 'absolute', left: -2, bottom: -2, width: 34, height: 34, borderLeft: '5px solid #2563EB', borderBottom: '5px solid #2563EB', borderBottomLeftRadius: 18 }} />
              <span style={{ position: 'absolute', right: -2, bottom: -2, width: 34, height: 34, borderRight: '5px solid #2563EB', borderBottom: '5px solid #2563EB', borderBottomRightRadius: 18 }} />
              <span style={{ position: 'absolute', left: 12, right: 12, height: 3, top: 18, borderRadius: 999, background: 'linear-gradient(90deg, transparent, #22C55E, #2563EB, transparent)', boxShadow: '0 0 18px rgba(34,197,94,0.8)', animation: scanStatus === 'scanning' ? 'scanLine 1.2s ease-in-out infinite alternate' : 'scanLine 2.8s ease-in-out infinite alternate' }} />
            </div>
            <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, display: 'flex', justifyContent: 'center' }}>
              <span style={{ background: scanStatus === 'decoded' ? '#D1FAE5' : scanStatus === 'failed' ? '#FEE2E2' : 'rgba(255,255,255,0.92)', color: scanStatus === 'decoded' ? '#047857' : scanStatus === 'failed' ? '#B91C1C' : C.text, border: `1px solid ${scanStatus === 'decoded' ? '#A7F3D0' : scanStatus === 'failed' ? '#FECACA' : C.border}`, borderRadius: 999, padding: '7px 12px', fontSize: 12, fontWeight: 900, boxShadow: '0 10px 24px rgba(15,23,42,0.12)' }}>
                {scanStatus === 'scanning' ? 'Scanning QR image...' : scanStatus === 'decoded' ? 'QR decoded successfully' : scanStatus === 'failed' ? 'Upload a clearer QR image' : 'Ready to scan'}
              </span>
            </div>
          </label>

          <div style={{ display: 'grid', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: 'uppercase' }}>QR Value</label>
            <textarea
              value={manualValue}
              onChange={e => setManualValue(e.target.value)}
              placeholder="Paste QR value or SRV QR URL here"
              rows={4}
              style={{ width: '100%', resize: 'vertical', minHeight: 92, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 12, outline: 'none', background: C.inputBg, color: C.text, fontSize: 13, boxSizing: 'border-box' }}
            />
            {decodedValue && <div style={{ fontSize: 12, color: '#047857', fontWeight: 700 }}>Decoded from uploaded image.</div>}
            <button
              onClick={() => lookup(manualValue)}
              disabled={loading}
              style={{ marginTop: 6, border: 'none', background: loading ? C.muted : '#2563EB', color: '#fff', borderRadius: 12, padding: '12px 16px', cursor: loading ? 'not-allowed' : 'pointer', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontWeight: 900 }}
            >
              {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
              {loading ? 'Checking...' : 'Check QR Details'}
            </button>
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: C.shadow, minHeight: 420 }}>
          {!result ? (
            <div style={{ minHeight: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: C.muted, gap: 10 }}>
              <QrCode size={48} style={{ opacity: 0.35 }} />
              <div style={{ fontSize: 17, fontWeight: 900, color: C.text }}>No QR checked yet</div>
              <div style={{ fontSize: 13, maxWidth: 360, lineHeight: 1.6 }}>Upload a QR image or enter a QR value to see product and first scanner information.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>QR Lookup Result</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 3, fontFamily: 'monospace' }}>{result.code || result.qrCodeId}</div>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 11px', borderRadius: 999, background: firstScan ? '#D1FAE5' : '#FEF3C7', color: firstScan ? '#047857' : '#B45309', fontSize: 12, fontWeight: 900 }}>
                  {firstScan ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {firstScan ? 'Scanned' : 'Not Scanned'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                <InfoTile C={C} label="Product" value={firstScan?.productName || 'Not available'} icon={<ShieldCheck size={17} />} />
                <InfoTile C={C} label="Points" value={String(firstScan?.pointsRedeemed ?? firstScan?.points ?? 0)} icon={<QrCode size={17} />} />
                <InfoTile C={C} label="Scanned By" value={scannerName} icon={<UserRound size={17} />} />
                <InfoTile C={C} label="Role / Code" value={[firstScan?.role, firstScan?.code].filter(Boolean).join(' / ') || 'Not available'} icon={<ShieldCheck size={17} />} />
                <InfoTile C={C} label="Phone" value={firstScan?.phone ? `+91 ${firstScan.phone}` : 'Not available'} icon={<Phone size={17} />} />
                <InfoTile C={C} label="Scanned At" value={formatDateTime(firstScan?.scannedAt)} icon={<CalendarClock size={17} />} />
              </div>

              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text, marginBottom: 10 }}>Dealer Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                  <InfoTile C={C} label="Dealer Name" value={firstScan?.dealerName || 'Not available'} icon={<UserRound size={17} />} />
                  <InfoTile C={C} label="Dealer Phone / Code" value={[firstScan?.dealerPhone ? `+91 ${firstScan.dealerPhone}` : null, firstScan?.dealerCode].filter(Boolean).join(' / ') || 'Not available'} icon={<Phone size={17} />} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes scanLine{from{transform:translateY(0)}to{transform:translateY(168px)}}
      `}</style>
    </div>
  );
}

function InfoTile({ C, label, value, icon }: { C: any; label: string; value: string; icon: ReactNode }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, minHeight: 78 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.muted, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>
        {icon}
        {label}
      </div>
      <div style={{ color: C.text, fontSize: 14, fontWeight: 800, lineHeight: 1.45, overflowWrap: 'anywhere' }}>{value}</div>
    </div>
  );
}
