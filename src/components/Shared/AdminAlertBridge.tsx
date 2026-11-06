'use client';

import { useEffect, useState } from 'react';
import AlertDialog from './AlertDialog';

export default function AdminAlertBridge() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (value?: unknown) => setMessage(String(value ?? ''));
    return () => { window.alert = originalAlert; };
  }, []);

  return (
    <AlertDialog
      show={Boolean(message)}
      title="SRV Admin"
      message={message}
      type="info"
      onClose={() => setMessage('')}
    />
  );
}
