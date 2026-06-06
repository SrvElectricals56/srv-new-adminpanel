/**
 * All date/time formatting helpers — always display in IST (Asia/Kolkata, UTC+5:30).
 * Backend stores timestamps in UTC; these functions convert to IST for display.
 */

const IST_LOCALE = 'en-IN';
const IST_TZ = 'Asia/Kolkata';

/** "15 Jun, 02:30 PM" — used in scan history, wallet transactions */
export function formatISTDateTime(iso?: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(IST_LOCALE, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: IST_TZ,
    });
  } catch {
    return '';
  }
}

/** "15 Jun 2025" — used in joined date, order date */
export function formatISTDate(iso?: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(IST_LOCALE, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: IST_TZ,
    });
  } catch {
    return '';
  }
}

/** "02:30 PM" — time only */
export function formatISTTime(iso?: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString(IST_LOCALE, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: IST_TZ,
    });
  } catch {
    return '';
  }
}

/** "15 Jun 2025, 02:30 PM" — full datetime with year */
export function formatISTDateTimeFull(iso?: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(IST_LOCALE, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: IST_TZ,
    });
  } catch {
    return '';
  }
}
