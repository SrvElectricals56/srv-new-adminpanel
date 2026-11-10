'use client';

import { useEffect, useState } from 'react';
import AlertDialog from './AlertDialog';
import { ADMIN_ALERT_EVENT, type AdminDialogType } from '@/lib/adminDialog';

export default function AdminAlertBridge() {
  const [dialog, setDialog] = useState<{ message: string; title: string; type: AdminDialogType }>({ message: '', title: 'SRV Admin', type: 'info' });

  useEffect(() => {
    const originalAlert = window.alert;
    const showFallbackAlert = (value?: unknown) => setDialog({ message: String(value ?? ''), title: 'SRV Admin', type: 'info' });
    const showEventAlert = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: unknown; title?: string; type?: AdminDialogType }>).detail;
      setDialog({
        message: String(detail?.message ?? ''),
        title: detail?.title || 'SRV Admin',
        type: detail?.type || 'info',
      });
    };
    // Keep this fallback until every third-party callback has migrated. It
    // guarantees a browser-native "localhost says" alert can never escape.
    window.alert = showFallbackAlert;
    window.addEventListener(ADMIN_ALERT_EVENT, showEventAlert);
    return () => {
      window.alert = originalAlert;
      window.removeEventListener(ADMIN_ALERT_EVENT, showEventAlert);
    };
  }, []);

  return (
    <AlertDialog
      show={Boolean(dialog.message)}
      title={dialog.title}
      message={dialog.message}
      type={dialog.type}
      onClose={() => setDialog(current => ({ ...current, message: '' }))}
    />
  );
}
