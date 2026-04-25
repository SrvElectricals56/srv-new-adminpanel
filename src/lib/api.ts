// Central API client for SRV Admin Backend
// Backend runs at http://localhost:3001/api/v1

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('srv_token') : null;

export const setToken = (token: string) =>
  localStorage.setItem('srv_token', token);

export const removeToken = () => {
  localStorage.removeItem('srv_token');
  localStorage.removeItem('srv_admin');
};

export const getStoredAdmin = () => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('srv_admin');
  return raw ? JSON.parse(raw) : null;
};

export const setStoredAdmin = (admin: object) =>
  localStorage.setItem('srv_admin', JSON.stringify(admin));

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; refreshToken: string; admin: { id: string; email: string; name: string; role: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),
  logout: () => request('/auth/logout', { method: 'POST' }),
  profile: () => request<{ id: string; email: string; name: string; role: string }>('/auth/profile'),
};

// ─── Admins ───────────────────────────────────────────────────────────────────
export const adminApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/admins${q}`);
  },
  getOne: (id: string) => request<any>(`/admins/${id}`),
  create: (body: object) => request<any>('/admins', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request<any>(`/admins/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/admins/${id}`, { method: 'DELETE' }),
};

// ─── Electricians ─────────────────────────────────────────────────────────────
export const electricianApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number; page: number; limit: number }>(`/electricians${q}`);
  },
  getOne: (id: string) => request<any>(`/electricians/${id}`),
  create: (body: object) => request<any>('/electricians', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request<any>(`/electricians/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/electricians/${id}`, { method: 'DELETE' }),
  updateStatus: (id: string, status: string) =>
    request<any>(`/electricians/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// ─── Dealers ──────────────────────────────────────────────────────────────────
export const dealerApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number; page: number; limit: number }>(`/dealers${q}`);
  },
  getOne: (id: string) => request<any>(`/dealers/${id}`),
  create: (body: object) => request<any>('/dealers', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request<any>(`/dealers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/dealers/${id}`, { method: 'DELETE' }),
  updateStatus: (id: string, status: string) =>
    request<any>(`/dealers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const productApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/products${q}`);
  },
  getOne: (id: string) => request<any>(`/products/${id}`),
  create: (body: object) => request<any>('/products', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request<any>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/products/${id}`, { method: 'DELETE' }),
};

// ─── QR Codes ─────────────────────────────────────────────────────────────────
export const qrCodeApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/qr-codes${q}`);
  },
  generate: (body: { productId: string; quantity: number; batchId?: string }) =>
    request<any>('/qr-codes/generate', { method: 'POST', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/qr-codes/${id}`, { method: 'DELETE' }),
  deleteAll: (productId?: string) => {
    const q = productId ? `?productId=${productId}` : '';
    return request<void>(`/qr-codes/delete-all${q}`, { method: 'DELETE' });
  },
};

// ─── Scans ────────────────────────────────────────────────────────────────────
export const scanApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(`/scans${q}`);
  },
  getStats: () => request<any>('/scans/stats'),
};

// ─── Wallet ───────────────────────────────────────────────────────────────────
export const walletApi = {
  getTransactions: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(`/wallet/transactions${q}`);
  },
  getTransaction: (id: string) => request<any>(`/wallet/transactions/${id}`),
  credit: (body: object) => request<any>('/wallet/credit', { method: 'POST', body: JSON.stringify(body) }),
  debit: (body: object) => request<any>('/wallet/debit', { method: 'POST', body: JSON.stringify(body) }),
};

// ─── Redemptions ──────────────────────────────────────────────────────────────
export const redemptionApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/redemptions${q}`);
  },
  approve: (id: string) => request<any>(`/redemptions/${id}/approve`, { method: 'PATCH' }),
  reject: (id: string, reason?: string) =>
    request<any>(`/redemptions/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
};

// ─── Notifications ────────────────────────────────────────────────────────────
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

// ─── Banners ──────────────────────────────────────────────────────────────────
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

// ─── Offers ───────────────────────────────────────────────────────────────────
export const offerApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/offers${q}`);
  },
  create: (body: object) => request<any>('/offers', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request<any>(`/offers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/offers/${id}`, { method: 'DELETE' }),
};

// ─── Testimonials ─────────────────────────────────────────────────────────────
export const testimonialApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/testimonials${q}`);
  },
  create: (body: object) => request<any>('/testimonials', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request<any>(`/testimonials/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/testimonials/${id}`, { method: 'DELETE' }),
};

// ─── Gift Products ────────────────────────────────────────────────────────────
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
  updateOrderStatus: (id: string, status: string) =>
    request<any>(`/gifts/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// ─── Orders ────────────────────────────────────────────────────────────────────
export const orderApi = {
  getAll: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number }>(`/orders${q}`);
  },
  getOne: (id: string) => request<any>(`/orders/${id}`),
  create: (body: object) => request<any>('/orders', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request<any>(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => request<void>(`/orders/${id}`, { method: 'DELETE' }),
};

// ─── Finance ──────────────────────────────────────────────────────────────────
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
  getTransferPoints: () => request<any>('/finance/transfer-points'),
  transferPoints: (body: object) => request<any>('/finance/transfer-points', { method: 'POST', body: JSON.stringify(body) }),
};

// ─── Analytics / Dashboard ────────────────────────────────────────────────────
export const analyticsApi = {
  getDashboard: () => request<any>('/analytics/dashboard'),
  getScanStats: () => request<any>('/analytics/scans'),
  getUserStats: () => request<any>('/analytics/users'),
  getRevenueStats: () => request<any>('/analytics/revenue'),
};

// ─── Support Tickets ──────────────────────────────────────────────────────────
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

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settingsApi = {
  getAll: () => request<any[]>('/settings'),
  update: (key: string, value: string) =>
    request<any>(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
  setPointsConfig: (body: object) =>
    request<any>('/settings/points-config', { method: 'POST', body: JSON.stringify(body) }),
};

// ─── User Search (for notification targeting) ─────────────────────────────────
export const userSearchApi = {
  search: (query: string) => {
    const params = new URLSearchParams({ search: query, limit: '10' });
    return Promise.all([
      request<{ data: any[] }>(`/electricians?${params}`).catch(() => ({ data: [] })),
      request<{ data: any[] }>(`/dealers?${params}`).catch(() => ({ data: [] })),
    ]).then(([elec, dealer]) => [
      ...(elec.data ?? []).map((u: any) => ({ ...u, role: 'electrician', label: `${u.name} (${u.electricianCode ?? u.phone}) — Electrician` })),
      ...(dealer.data ?? []).map((u: any) => ({ ...u, role: 'dealer', label: `${u.name} (${u.dealerCode ?? u.phone}) — Dealer` })),
    ]);
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
