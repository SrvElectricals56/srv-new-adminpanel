'use client';
import { CheckCircle, XCircle } from 'lucide-react';

interface ConfirmDialogProps {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'success' | 'danger' | 'warning';
}

export default function ConfirmDialog({ show, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'success' }: ConfirmDialogProps) {
  if (!show) return null;

  const styles = {
    success: { bg: '#D1FAE5', color: '#065F46', iconBg: '#D1FAE5', iconColor: '#065F46' },
    danger: { bg: '#FEE2E2', color: '#991B1B', iconBg: '#FEE2E2', iconColor: '#991B1B' },
    warning: { bg: '#FEF3C7', color: '#92400E', iconBg: '#FEF3C7', iconColor: '#92400E' },
  };

  const s = styles[type];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }} onClick={onCancel}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 24,
        width: 400,
        maxWidth: '90vw',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        animation: 'modalSlideIn 0.2s ease',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: s.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {type === 'success' ? <CheckCircle size={24} color={s.iconColor} /> : <XCircle size={24} color={s.iconColor} />}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{title}</div>
        </div>
        <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 1.5 }}>{message}</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: '1px solid #E5E7EB',
            background: '#F9FAFB',
            color: '#6B7280',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            {cancelText}
          </button>
          <button onClick={onConfirm} style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: s.bg,
            color: s.color,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            {confirmText}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}