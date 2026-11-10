export type AdminDialogType = 'error' | 'success' | 'warning' | 'info';

export const ADMIN_ALERT_EVENT = 'srv:admin-alert';

export function showAdminAlert(
  message: unknown,
  options: { title?: string; type?: AdminDialogType } = {},
) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ADMIN_ALERT_EVENT, {
    detail: {
      message: String(message ?? ''),
      title: options.title || 'SRV Admin',
      type: options.type || 'info',
    },
  }));
}
