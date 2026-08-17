/**
 * All date/time formatting helpers — always display in IST (Asia/Kolkata, UTC+5:30).
 * Backend stores timestamps in UTC; these functions convert to IST for display.
 */

const IST_LOCALE = 'en-IN';
const IST_TZ = 'Asia/Kolkata';

/** "2025-06-15" in IST, safe for API date filters regardless of browser timezone. */
export function formatISTDateInput(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: IST_TZ,
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export type ISTDatePreset = 'today' | 'yesterday' | 'week' | 'month';

/** Calendar-aligned IST ranges used by admin filters (Monday-start week). */
export function getISTDatePresetRange(
  preset: ISTDatePreset,
  now = new Date(),
): { from: string; to: string } {
  const today = formatISTDateInput(now);
  const [year, month, day] = today.split('-').map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));

  if (preset === 'today') return { from: today, to: today };
  if (preset === 'yesterday') {
    calendarDate.setUTCDate(calendarDate.getUTCDate() - 1);
  } else if (preset === 'week') {
    const weekday = calendarDate.getUTCDay();
    calendarDate.setUTCDate(calendarDate.getUTCDate() - (weekday === 0 ? 6 : weekday - 1));
  } else {
    calendarDate.setUTCDate(1);
  }

  const from = [
    calendarDate.getUTCFullYear(),
    String(calendarDate.getUTCMonth() + 1).padStart(2, '0'),
    String(calendarDate.getUTCDate()).padStart(2, '0'),
  ].join('-');
  return { from, to: preset === 'yesterday' ? from : today };
}

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
