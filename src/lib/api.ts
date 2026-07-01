// Central API client for SRV Admin Backend
// Local backend runs at http://127.0.0.1:3001/api/v1

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

if (!BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL must be configured for the admin panel.');
}

// â”€â”€â”€ Token helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('srv_token') : null;

export const getRefreshToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('srv_refresh_token') : null;

export const setToken = (token: string) => {
  clearApiCache();
  localStorage.setItem('srv_token', token);
};

export const setRefreshToken = (token: string) =>
  localStorage.setItem('srv_refresh_token', token);

export const removeToken = () => {
  clearApiCache();
  localStorage.removeItem('srv_token');
  localStorage.removeItem('srv_refresh_token');
  localStorage.removeItem('srv_admin');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('srv-auth-expired'));
  }
};

export const getStoredAdmin = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('srv_admin');
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem('srv_admin');
    return null;
  }
};

export const setStoredAdmin = (admin: object) =>
  localStorage.setItem('srv_admin', JSON.stringify(admin));

let refreshPromise: Promise<string | null> | null = null;

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const GET_CACHE_TTL_MS = 0;
const responseCache = new Map<string, CacheEntry>();
const inflightRequests = new Map<string, Promise<unknown>>();

export const clearApiCache = (pathPrefix?: string) => {
  if (!pathPrefix) {
    responseCache.clear();
    inflightRequests.clear();
    return;
  }

  for (const key of responseCache.keys()) {
    if (key.includes(` ${pathPrefix}`)) responseCache.delete(key);
  }
  for (const key of inflightRequests.keys()) {
    if (key.includes(` ${pathPrefix}`)) inflightRequests.delete(key);
  }
};

function getRequestCacheKey(path: string, token: string | null) {
  return `GET ${path} ${token ? token.slice(0, 24) : 'public'}`;
}

function shouldCacheGet(_path: string) {
  return false;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    removeToken();
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async res => {
        if (!res.ok) {
          removeToken();
          return null;
        }

        const data = await res.json();
        if (data?.accessToken) {
          setToken(data.accessToken);
          return data.accessToken as string;
        }

        removeToken();
        return null;
      })
      .catch(() => {
        removeToken();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retried = false
): Promise<T> {
  const token = getToken();
  const method = String(options.method ?? 'GET').toUpperCase();
  const cacheKey = method === 'GET' ? getRequestCacheKey(path, token) : '';

  if (method === 'GET' && shouldCacheGet(path)) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    const inflight = inflightRequests.get(cacheKey);
    if (inflight) {
      return inflight as Promise<T>;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const run = (async () => {
    const res = await fetch(`${BASE_URL}${path}`, { cache: 'no-store', ...options, headers });

    if (res.status === 401 && !retried && path !== '/auth/login' && path !== '/auth/refresh') {
      const nextToken = await refreshAccessToken();
      if (nextToken) {
        return request<T>(path, options, true);
      }
    }

    if (!res.ok) {
      const rawText = await res.text().catch(() => '');
      let message = res.statusText;
      try {
        const parsed = rawText ? JSON.parse(rawText) : null;
        if (parsed?.message) message = parsed.message;
      } catch {
        if (rawText) message = rawText;
      }
      throw new Error(`[${res.status}] ${message || 'Request failed'}`);
    }

    if (res.status === 204) return undefined as T;
    const text = await res.text();
    const data = text ? JSON.parse(text) as T : undefined as T;

    if (method === 'GET' && shouldCacheGet(path)) {
      responseCache.set(cacheKey, {
        expiresAt: Date.now() + GET_CACHE_TTL_MS,
        value: data,
      });
    } else if (method !== 'GET') {
      clearApiCache();
    }

    return data;
  })();

  if (method === 'GET' && shouldCacheGet(path)) {
    inflightRequests.set(cacheKey, run);
    run.finally(() => inflightRequests.delete(cacheKey)).catch(() => undefined);
  }

  return run;
}

// â”€â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const authApi = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; refreshToken: string; admin: { id: string; email: string; name: string; role: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),
  logout: () => request('/auth/logout', { method: 'POST' }),
  profile: () => request<{ id: string; email: string; name: string; role: string }>('/auth/profile'),
};

// â”€â”€â”€ Admins â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const adminApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/admins${q}`);
  },
  getOne: (id: string) => request<any>(`/admins/${id}`),
  create: (body: object) => {
    return request<any>('/admins', { method: 'POST', body: JSON.stringify(body) });
  },
  update: (id: string, body: object) => request<any>(`/admins/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/admins/${id}`, { method: 'DELETE' }),
  getPermissions: (id: string) => request<any>(`/admins/${id}/permissions`),
  updatePermissions: (id: string, body: object) =>
    request<any>(`/admins/${id}/permissions`, { method: 'PUT', body: JSON.stringify(body) }),
};

// â”€â”€â”€ Electricians â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const electricianApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number; page: number; limit: number }>(`/electricians${q}`);
  },
  getTierCounts: () =>
    request<{ Silver: number; Gold: number; Platinum: number; Diamond: number }>('/electricians/tier-counts'),
  getTop: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/electricians/top${q}`);
  },
  getDistinctStates: () =>
    request<{ states: string[] }>('/electricians/distinct-states'),
  getDistinctCities: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ cities: string[] }>(`/electricians/distinct-cities${q}`);
  },
  getDistinctCategories: () =>
    request<{ categories: string[] }>('/electricians/distinct-categories'),
  getOne: (id: string) => request<any>(`/electricians/${id}`),
  getScans: (id: string, params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number; page: number; limit: number }>(`/electricians/${id}/scans${q}`);
  },
  getActivity: (id: string) => request<any>(`/electricians/${id}/activity`),
  create: (body: object) => request<any>('/electricians', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request<any>(`/electricians/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  setPassword: (id: string, password: string) =>
    request<any>(`/electricians/${id}`, { method: 'PATCH', body: JSON.stringify({ password }) }),
  delete: (id: string) => request<void>(`/electricians/${id}`, { method: 'DELETE' }),
  updateStatus: (id: string, status: string) =>
    request<any>(`/electricians/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  importMany: (records: any[]) =>
    request<{ created: number; updated: number; failed: number; errors: string[]; total: number }>(
      '/electricians/import', { method: 'POST', body: JSON.stringify({ records }) }
    ),
};

// â”€â”€â”€ Dealers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const dealerApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number; page: number; limit: number }>(`/dealers${q}`);
  },
  getStats: () =>
    request<{ total: number; active: number; pending: number; inactive: number }>('/dealers/stats'),
  getSubDealers: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number; page: number; limit: number }>(`/dealers/sub-dealers${q}`);
  },
  getSubDealerElectricians: (id: string) =>
    request<{ data: any[]; total: number; phone: string }>(`/dealers/sub-dealers/${id}/electricians`),
  getTop: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/dealers/top${q}`);
  },
  getDistinctStates: () =>
    request<{ states: string[] }>('/dealers/distinct-states'),
  getDistinctCities: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ cities: string[] }>(`/dealers/distinct-cities${q}`);
  },
  getOne: (id: string) => request<any>(`/dealers/${id}`),
  getActivity: (id: string) => request<any>(`/dealers/${id}/activity`),
  create: (body: object) => request<any>('/dealers', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request<any>(`/dealers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  setPassword: (id: string, password: string) =>
    request<any>(`/dealers/${id}`, { method: 'PATCH', body: JSON.stringify({ password }) }),
  delete: (id: string) => request<void>(`/dealers/${id}`, { method: 'DELETE' }),
  updateStatus: (id: string, status: string, rejectionReason?: string) =>
    request<any>(`/dealers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason }),
    }),
  importMany: (records: any[]) =>
    request<{ created: number; updated: number; failed: number; errors: string[]; total: number }>(
      '/dealers/import', { method: 'POST', body: JSON.stringify({ records }) }
    ),
};

// â”€â”€â”€ Products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const productApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/products${q}`);
  },
  getOne: (id: string) => request<any>(`/products/${id}`),
  create: (body: object) => request<any>('/products', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request<any>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/products/${id}`, { method: 'DELETE' }),
  uploadImage: async (file: File): Promise<string> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/upload/product-image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error('Image upload failed');
    const data = await res.json();
    return data.url as string;
  },
};

// â”€â”€â”€ Product Categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const productCategoryApi = {
  getAll: () => request<any[]>('/product-categories'),
  getOne: (id: string) => request<any>(`/product-categories/${id}`),
  create: (body: object) => request<any>('/product-categories', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request<any>(`/product-categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/product-categories/${id}`, { method: 'DELETE' }),
};

// â”€â”€â”€ QR Codes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const qrCodeApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/qr-codes${q}`);
  },
  getHub: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(`/qr-codes/hub${q}`);
  },
  getStats: () =>
    request<{ total: number; active: number; used: number; scanned?: number }>('/qr-codes/stats'),
  generate: (body: { productId: string; quantity: number; batchId?: string }) =>
    request<any>('/qr-codes/generate', { method: 'POST', body: JSON.stringify(body) }),
  updateBatch: (batchId: string, body: { productId?: string; rewardPoints?: number }) =>
    request<any>(`/qr-codes/batches/${batchId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteBatch: (batchId: string) => request<void>(`/qr-codes/batches/${batchId}`, { method: 'DELETE' }),
  delete: (id: string) => request<void>(`/qr-codes/${id}`, { method: 'DELETE' }),
  deleteAll: (productId?: string) => {
    const q = productId ? `?productId=${productId}` : '';
    return request<void>(`/qr-codes/delete-all${q}`, { method: 'DELETE' });
  },
};

// â”€â”€â”€ Scans â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const scanApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(`/scans${q}`);
  },
  getStats: () => request<any>('/scans/stats'),
};

// â”€â”€â”€ Wallet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const walletApi = {
  getTransactions: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(`/wallet/transactions${q}`);
  },
  getTransaction: (id: string) => request<any>(`/wallet/transactions/${id}`),
  credit: (body: object) => request<any>('/wallet/credit', { method: 'POST', body: JSON.stringify(body) }),
  debit: (body: object) => request<any>('/wallet/debit', { method: 'POST', body: JSON.stringify(body) }),
};

// â”€â”€â”€ Redemptions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const redemptionApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/redemptions${q}`);
  },
  updateStatus: (id: string, status: string, rejectionReason?: string) =>
    request<any>(`/redemptions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason }),
    }),
  approve: (id: string) => request<any>(`/redemptions/${id}/approve`, { method: 'PATCH' }),
  reject: (id: string, reason?: string) =>
    request<any>(`/redemptions/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ rejectionReason: reason || 'Rejected by admin' }) }),
  delete: (id: string) => request<void>(`/redemptions/${id}`, { method: 'DELETE' }),
};

// â”€â”€â”€ Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const notificationApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/notifications${q}`);
  },
  create: (body: object) => request<any>('/notifications', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request<any>(`/notifications/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  send: (id: string) => request<any>(`/notifications/${id}/send`, { method: 'POST' }),
  delete: (id: string) => request<void>(`/notifications/${id}`, { method: 'DELETE' }),
};

// â”€â”€â”€ Banners â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const bannerApi = {
  getAll: () => request<any[]>('/banners'),
  create: (body: object) => request<any>('/banners', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request<any>(`/banners/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/banners/${id}`, { method: 'DELETE' }),
  reorder: (body: object) => request<any>('/banners/reorder', { method: 'PATCH', body: JSON.stringify(body) }),
  uploadImage: async (file: File): Promise<string> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/upload/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error('Image upload failed');
    const data = await res.json();
    return data.url as string;
  },
};

// â”€â”€â”€ Offers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const sanitizeOfferPayload = (body: object) => {
  const source = body as Record<string, any>;
  const allowedKeys = [
    'title',
    'description',
    'discount',
    'validFrom',
    'validTo',
    'targetRole',
    'status',
    'productCategory',
    'bonusPoints',
    'imageUrl',
    'termsAndConditions',
    'maxUsage',
  ];
  const payload: Record<string, any> = {};
  for (const key of allowedKeys) {
    const value = source[key];
    if (value === undefined || value === null) continue;
    if ((key === 'validFrom' || key === 'validTo') && String(value).trim() === '') continue;
    if (key === 'bonusPoints' || key === 'maxUsage') {
      payload[key] = Number(value) || 0;
    } else {
      payload[key] = value;
    }
  }
  return payload;
};

export const offerApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/offers${q}`);
  },
  create: (body: object) => request<any>('/offers', { method: 'POST', body: JSON.stringify(sanitizeOfferPayload(body)) }),
  update: (id: string, body: object) => request<any>(`/offers/${id}`, { method: 'PATCH', body: JSON.stringify(sanitizeOfferPayload(body)) }),
  delete: (id: string) => request<void>(`/offers/${id}`, { method: 'DELETE' }),
};

// â”€â”€â”€ Testimonials â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const testimonialApi = {
  getAll: () => request<any[]>('/testimonials'),
  create: (body: object) => request<any>('/testimonials', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request<any>(`/testimonials/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/testimonials/${id}`, { method: 'DELETE' }),
};

// â”€â”€â”€ Gift Products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const giftApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/gifts/products${q}`);
  },
  create: (body: object) => request<any>('/gifts/products', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request<any>(`/gifts/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/gifts/products/${id}`, { method: 'DELETE' }),
  getOrders: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/gifts/orders${q}`);
  },
  updateOrderStatus: (id: string, status: string, extra?: { rejectionReason?: string; trackingNumber?: string; courierName?: string; deliveryNotes?: string; processedBy?: string }) =>
    request<any>(`/gifts/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...(extra ?? {}) }) }),
};

// â”€â”€â”€ Product Orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const productOrderApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(`/product-orders${q}`);
  },
  getById: (id: string) => request<any>(`/product-orders/${id}`),
  updateStatus: (id: string, body: { status: string; rejectionReason?: string; trackingNumber?: string; courierName?: string }) =>
    request<any>(`/product-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }),
  getStats: () => request<any>('/product-orders/stats/summary'),
  delete: (id: string) => request<void>(`/product-orders/${id}`, { method: 'DELETE' }),
};

// â”€â”€â”€ Finance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const financeApi = {
  getSummary: () => request<any>('/finance/summary'),
  getTransactions: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/finance/transactions${q}`);
  },
  // alias kept for backward compat
  getWalletTransactions: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/finance/transactions${q}`);
  },
  getDealerBonus: () => request<any>('/finance/dealer-bonus'),
  transferDealerBonus: (body: object) => request<any>('/finance/dealer-bonus/transfer', { method: 'POST', body: JSON.stringify(body) }),
  markDealerBonusPaid: (dealerId: string) =>
    request<any>(`/finance/dealer-bonus/${dealerId}/mark-paid`, { method: 'PATCH' }),
  updateDealerBonus: (dealerId: string, body: object) =>
    request<any>(`/finance/dealer-bonus/${dealerId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  bulkMarkDealerBonusPaid: (dealerIds: string[]) =>
    request<any>('/finance/dealer-bonus/bulk-mark-paid', { method: 'POST', body: JSON.stringify({ dealerIds }) }),
  getTransferPoints: () => request<any>('/finance/transfer-points'),
  transferPoints: (body: object) => request<any>('/finance/transfer-points', { method: 'POST', body: JSON.stringify(body) }),
  reverseTransfer: (id: string) =>
    request<any>(`/finance/transfer-points/${id}/reverse`, { method: 'PATCH' }),
  deleteTransfer: (id: string) =>
    request<void>(`/finance/transfer-points/${id}`, { method: 'DELETE' }),
};

// â”€â”€â”€ Analytics / Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const analyticsApi = {
  getDashboard: () => request<any>('/analytics/dashboard'),
  getScanStats: () => request<any>('/analytics/scans'),
  getUserStats: () => request<any>('/analytics/users'),
  getRevenueStats: () => request<any>('/analytics/revenue'),
};

// â”€â”€â”€ Support Tickets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const supportApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/support/tickets${q}`);
  },
  respond: (id: string, body: object) =>
    request<any>(`/support/tickets/${id}/respond`, { method: 'PATCH', body: JSON.stringify(body) }),
  updateStatus: (id: string, status: string) =>
    request<any>(`/support/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// â”€â”€â”€ Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const settingsApi = {
  getAll: () => request<any[]>('/settings'),
  globalSearch: (query: string, limit = 20) => {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    return request<{ query: string; results: Array<{ type: string; id: string; title: string; subtitle: string; page: string }>; total: number }>(`/settings/global-search?${params}`);
  },
  getRatingHistory: () => request<any>('/settings/rate-us/history'),
  update: (key: string, value: string) =>
    request<any>(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
  setPointsConfig: (body: object) =>
    request<any>('/settings/points-config', { method: 'POST', body: JSON.stringify(body) }),
};

// â”€â”€â”€ User Search (for notification targeting) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const userSearchApi = {
  search: (query: string) => {
    const params = new URLSearchParams({ search: query, limit: '10' });
    return Promise.all([
      request<{ data: any[] }>(`/electricians?${params}`).catch(() => ({ data: [] })),
      request<{ data: any[] }>(`/dealers?${params}`).catch(() => ({ data: [] })),
      request<{ data: any[] }>(`/app-users?${params}`).catch(() => ({ data: [] })),
      request<{ data: any[] }>(`/counterboys?${params}`).catch(() => ({ data: [] })),
    ]).then(([elec, dealer, users, counterboys]) => [
      ...(elec.data ?? []).map((u: any) => ({ ...u, role: 'electrician', label: `${u.name} (${u.electricianCode ?? u.phone}) - Electrician` })),
      ...(dealer.data ?? []).map((u: any) => ({ ...u, role: 'dealer', label: `${u.name} (${u.dealerCode ?? u.phone}) - Dealer` })),
      ...(users.data ?? []).map((u: any) => ({ ...u, role: 'user', label: `${u.name} (${u.userCode ?? u.phone}) - User` })),
      ...(counterboys.data ?? []).map((u: any) => ({ ...u, role: 'counterboy', label: `${u.name} (${u.counterboyCode ?? u.phone}) - Counter Boy` })),
    ]);
  },
};

// â”€â”€â”€ App Users (Customers) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const appUserApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number; page: number; limit: number }>(`/app-users${q}`);
  },
  getDistinctStates: () =>
    request<{ states: string[] }>('/app-users/distinct-states'),
  getDistinctCities: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ cities: string[] }>(`/app-users/distinct-cities${q}`);
  },
  getStats: () =>
    request<{ total: number; active: number; pending: number; inactive: number }>('/app-users/stats'),
  getOne: (id: string) => request<any>(`/app-users/${id}`),
  create: (body: object) => request<any>('/app-users', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request<any>(`/app-users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  setPassword: (id: string, password: string) =>
    request<any>(`/app-users/${id}`, { method: 'PATCH', body: JSON.stringify({ password }) }),
  updateStatus: (id: string, status: string) =>
    request<any>(`/app-users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete: (id: string) => request<void>(`/app-users/${id}`, { method: 'DELETE' }),
  importMany: (records: any[]) =>
    request<{ created: number; updated: number; failed: number; errors: string[]; total: number }>(
      '/app-users/import', { method: 'POST', body: JSON.stringify({ records }) }
    ),
};

// â”€â”€â”€ Counter Boys â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const counterboyApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number; page: number; limit: number }>(`/counterboys${q}`);
  },
  getDistinctStates: () =>
    request<{ states: string[] }>('/counterboys/distinct-states'),
  getDistinctCities: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ cities: string[] }>(`/counterboys/distinct-cities${q}`);
  },
  getStats: () =>
    request<{ total: number; active: number; pending: number; inactive: number }>('/counterboys/stats'),
  getOne: (id: string) => request<any>(`/counterboys/${id}`),
  create: (body: object) => request<any>('/counterboys', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request<any>(`/counterboys/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  setPassword: (id: string, password: string) =>
    request<any>(`/counterboys/${id}`, { method: 'PATCH', body: JSON.stringify({ password }) }),
  updateStatus: (id: string, status: string) =>
    request<any>(`/counterboys/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete: (id: string) => request<void>(`/counterboys/${id}`, { method: 'DELETE' }),
  importMany: (records: any[]) =>
    request<{ created: number; updated: number; failed: number; errors: string[]; total: number }>(
      '/counterboys/import', { method: 'POST', body: JSON.stringify({ records }) }
    ),
};

// â”€â”€â”€ App Icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const appIconApi = {
  getAll: () => request<any[]>('/app-icons'),
  getActive: () => request<any>('/app-icons/active'),
  getOne: (id: string) => request<any>(`/app-icons/${id}`),
  create: (body: object) => request<any>('/app-icons', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request<any>(`/app-icons/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  setActive: (id: string) => request<any>(`/app-icons/${id}/set-active`, { method: 'PATCH' }),
  delete: (id: string) => request<void>(`/app-icons/${id}`, { method: 'DELETE' }),
  uploadIcon: async (file: File): Promise<string> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/app-icons/upload-image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || 'Icon upload failed');
    }
    const data = await res.json();
    return data.url as string;
  },
};

export const referralApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(`/referrals${q}`);
  },
  getOne: (id: string) => request<any>(`/referrals/${id}`),
  update: (id: string, body: object) => request<any>(`/referrals/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/referrals/${id}`, { method: 'DELETE' }),
  getStats: () => request<any>('/referrals/stats'),
};
