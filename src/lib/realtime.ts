import { API_BASE_URL } from './api';

export type RealtimeChangeEvent = {
  id: number;
  type: 'change';
  source: 'admin' | 'mobile';
  scope: string;
  at: string;
};

export function connectAdminRealtime(onChange: (event: RealtimeChangeEvent) => void) {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }

  const eventSource = new EventSource(`${API_BASE_URL}/realtime/events`);
  eventSource.onmessage = (message) => {
    try {
      const payload = JSON.parse(message.data) as Partial<RealtimeChangeEvent>;
      if (payload.type === 'change') onChange(payload as RealtimeChangeEvent);
    } catch {
      // Ignore malformed keep-alive data and let EventSource stay connected.
    }
  };

  return () => eventSource.close();
}
