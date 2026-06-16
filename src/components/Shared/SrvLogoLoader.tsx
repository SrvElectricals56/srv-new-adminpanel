'use client';

type Props = {
  overlay?: boolean;
  label?: string;
};

export default function SrvLogoLoader({ overlay = false, label = 'Loading...' }: Props) {
  return (
    <div
      style={{
        position: overlay ? 'fixed' : 'relative',
        inset: overlay ? 0 : undefined,
        zIndex: overlay ? 9999 : undefined,
        minHeight: overlay ? '100vh' : 220,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: overlay ? 'rgba(255, 255, 255, 0.78)' : 'transparent',
        backdropFilter: overlay ? 'blur(4px)' : undefined,
        pointerEvents: overlay ? 'auto' : 'none',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative', width: 106, height: 106, display: 'grid', placeItems: 'center' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '4px solid rgba(239, 68, 68, 0.16)',
              borderTopColor: '#EF3340',
              animation: 'srvSpin 0.9s linear infinite',
            }}
          />
          <div
            style={{
              width: 78,
              height: 78,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 16px 42px rgba(15, 23, 42, 0.18)',
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
            }}
          >
            <img src="/srv-logo.jpeg" alt="SRV" style={{ width: 68, height: 68, objectFit: 'contain' }} />
          </div>
        </div>
        <div style={{ color: '#111827', fontSize: 13, fontWeight: 900, letterSpacing: 0.3 }}>{label}</div>
      </div>
      <style>{`
        @keyframes srvSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
