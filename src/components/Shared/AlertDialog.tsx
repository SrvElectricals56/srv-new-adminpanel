'use client';
import { useThemePalette } from '@/lib/theme';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

interface AlertDialogProps {
  show: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'error' | 'success' | 'warning' | 'info';
}

export default function AlertDialog({ show, title, message, onClose, type = 'error' }: AlertDialogProps) {
  const C = useThemePalette();

  if (!show) return null;

  const config = {
    error: { 
      Icon: XCircle, 
      iconColor: '#DC2626', 
      iconBg: '#FEE2E2',
      buttonBg: 'linear-gradient(135deg, #DC2626, #991B1B)',
      buttonText: 'OK'
    },
    success: { 
      Icon: CheckCircle, 
      iconColor: '#16A34A', 
      iconBg: '#D1FAE5',
      buttonBg: 'linear-gradient(135deg, #16A34A, #15803D)',
      buttonText: 'OK'
    },
    warning: { 
      Icon: AlertCircle, 
      iconColor: '#D97706', 
      iconBg: '#FEF3C7',
      buttonBg: 'linear-gradient(135deg, #D97706, #92400E)',
      buttonText: 'OK'
    },
    info: { 
      Icon: Info, 
      iconColor: '#2563EB', 
      iconBg: '#DBEAFE',
      buttonBg: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
      buttonText: 'OK'
    },
  };

  const { Icon, iconColor, iconBg, buttonBg, buttonText } = config[type];

  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        background: 'rgba(15,23,42,0.6)', 
        backdropFilter: 'blur(6px)', 
        zIndex: 9999, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 20,
        animation: 'fadeIn 0.2s ease-out'
      }} 
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div 
        style={{ 
          background: C.card, 
          borderRadius: 20, 
          width: 420, 
          maxWidth: '95vw', 
          boxShadow: '0 25px 70px rgba(0,0,0,0.3)', 
          border: `1px solid ${C.border}`,
          animation: 'slideUp 0.3s ease-out'
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Icon */}
        <div style={{ padding: '28px 28px 20px', textAlign: 'center' }}>
          <div style={{ 
            width: 64, 
            height: 64, 
            borderRadius: '50%', 
            background: iconBg, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 16px',
            boxShadow: `0 4px 14px ${iconBg}`
          }}>
            <Icon size={32} color={iconColor} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8 }}>
            {title}
          </div>
          <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
            {message}
          </div>
        </div>

        {/* Footer with Button */}
        <div style={{ padding: '0 28px 28px', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={onClose}
            style={{ 
              background: buttonBg,
              color: 'white', 
              border: 'none', 
              borderRadius: 12, 
              padding: '12px 48px', 
              fontSize: 15, 
              fontWeight: 700, 
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
