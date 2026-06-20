'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { productApi, authApi, getToken, getStoredAdmin, setToken, setRefreshToken, setStoredAdmin, removeToken } from '@/lib/api';
import type { Product, PointsConfig, AdminRole } from '@/lib/types';

interface AuthState {
  isLoggedIn: boolean;
  role: AdminRole;
  adminName: string;
  adminId: string | null;
}

interface AppContextType {
  // Auth
  auth: AuthState;
  login: (email: string, password: string) => Promise<{ role: AdminRole; name: string }>;
  logout: () => void;
  setAdminName: (name: string) => void;

  // Products
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  productsLoading: boolean;
  refreshProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Points Config
  pointsConfig: PointsConfig[];
  setPointsConfig: React.Dispatch<React.SetStateAction<PointsConfig[]>>;
  getPointsConfigForProduct: (productId: string) => PointsConfig | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Map backend role string to frontend AdminRole type
function mapRole(role: string): AdminRole {
  if (role === 'super_admin') return 'super_admin';
  if (role === 'admin') return 'admin';
  return 'staff';
}

// Map backend product to frontend Product type
function mapProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    sub: p.sub ?? p.description ?? '',
    category: p.category || '',
    subCategory: p.subCategory,
    image: p.image ?? p.imageUrl ?? '',
    points: Number(p.points ?? p.pointsValue ?? 0),
    badge: p.badge || '',
    price: p.price ? `₹${p.price}` : '',
    mrp: p.mrp ? `₹${p.mrp}` : '',
    stock: p.stock || 0,
    totalScanned: p.totalScanned || 0,
    sku: p.sku || '',
    weight: p.weight,
    description: p.description,
    isActive: p.isActive ?? true,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    isLoggedIn: false,
    role: 'staff',
    adminName: '',
    adminId: null,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [pointsConfig, setPointsConfig] = useState<PointsConfig[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const hydrateProducts = useCallback(async () => {
    const res = await productApi.getAll({ limit: '1000', page: '1' });
    const items = Array.isArray(res) ? res : (res as any).data ?? [];
    const mapped = items.map(mapProduct);
    setProducts(mapped);
    setPointsConfig(mapped.map((p: Product) => ({
      id: `pc-${p.id}`,
      productId: p.id,
      productName: p.name,
      basePoints: p.points,
      bonusPoints: 0,
      isActive: p.isActive,
      updatedAt: new Date().toISOString().split('T')[0],
    })));
  }, []);

  const setAdminName = useCallback((name: string) => {
    setAuth(prev => ({ ...prev, adminName: name }));
    const admin = getStoredAdmin();
    if (admin) {
      setStoredAdmin({ ...admin, name });
    }
  }, []);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = getToken();
    const admin = getStoredAdmin();
    if (token && admin) {
      authApi.profile()
        .then(async profile => {
          setStoredAdmin(profile);
          setAuth({
            isLoggedIn: true,
            role: mapRole(profile.role),
            adminName: profile.name,
            adminId: profile.id,
          });
          await hydrateProducts();
        })
        .catch(err => {
          console.error('Failed to restore admin session:', err);
          removeToken();
          setAuth({ isLoggedIn: false, role: 'staff', adminName: '', adminId: null });
          setProducts([]);
          setPointsConfig([]);
        });
    } else if (admin || token) {
      removeToken();
    }
  }, [hydrateProducts]);

  useEffect(() => {
    const handleAuthExpired = () => {
      setAuth({ isLoggedIn: false, role: 'staff', adminName: '', adminId: null });
      setProducts([]);
      setPointsConfig([]);
    };

    window.addEventListener('srv-auth-expired', handleAuthExpired);
    return () => window.removeEventListener('srv-auth-expired', handleAuthExpired);
  }, []);

  useEffect(() => {
    if (!auth.isLoggedIn) return;

    const validateSession = () => {
      authApi.profile().catch(() => removeToken());
    };

    const intervalId = window.setInterval(validateSession, 10_000);
    window.addEventListener('focus', validateSession);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', validateSession);
    };
  }, [auth.isLoggedIn]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setToken(res.accessToken);
    setRefreshToken(res.refreshToken);
    setStoredAdmin(res.admin);
    const role = mapRole(res.admin.role);
    setAuth({
      isLoggedIn: true,
      role,
      adminName: res.admin.name,
      adminId: res.admin.id,
    });
    // Load products immediately after login (token is already set above)
    try {
      await hydrateProducts();
    } catch (err) {
      console.error('Failed to load products after login:', err);
    }
    return { role, name: res.admin.name };
  };

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    removeToken();
    setAuth({ isLoggedIn: false, role: 'staff', adminName: '', adminId: null });
    setProducts([]);
    setPointsConfig([]);
  }, []);

  const refreshProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      await hydrateProducts();
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setProductsLoading(false);
    }
  }, [hydrateProducts]);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const body = {
      name: product.name,
      description: product.sub,
      category: product.category,
      subCategory: product.subCategory,
      imageUrl: product.image,
      pointsValue: product.points,
      price: parseFloat((product.price || '0').replace('₹', '')),
      mrp: parseFloat((product.mrp || '0').replace('₹', '')),
      stock: product.stock,
      sku: product.sku,
      isActive: product.isActive ?? true,
    };
    await productApi.create(body);
    await refreshProducts();
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const body: any = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.sub !== undefined) body.description = updates.sub;
    if (updates.category !== undefined) body.category = updates.category;
    if (updates.subCategory !== undefined) body.subCategory = updates.subCategory;
    if (updates.image !== undefined) body.imageUrl = updates.image;
    if (updates.points !== undefined) body.pointsValue = updates.points;
    if (updates.price !== undefined) body.price = parseFloat((updates.price || '0').replace('₹', ''));
    if (updates.mrp !== undefined) body.mrp = parseFloat((updates.mrp || '0').replace('₹', ''));
    if (updates.stock !== undefined) body.stock = updates.stock;
    if (updates.sku !== undefined) body.sku = updates.sku;
    if (updates.isActive !== undefined) body.isActive = updates.isActive;
    await productApi.update(id, body);
    await refreshProducts();
  };

  const deleteProduct = async (id: string) => {
    await productApi.delete(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    setPointsConfig(prev => prev.filter(pc => pc.productId !== id));
  };

  const getPointsConfigForProduct = (productId: string) =>
    pointsConfig.find(pc => pc.productId === productId);

  return (
    <AppContext.Provider value={{
      auth,
      login,
      logout,
      setAdminName,
      products,
      setProducts,
      productsLoading,
      refreshProducts,
      addProduct,
      updateProduct,
      deleteProduct,
      pointsConfig,
      setPointsConfig,
      getPointsConfigForProduct,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
