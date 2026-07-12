import type { AdminRole } from './types';

// Define all modules in the system
export type ModuleName = 
  | 'products'
  | 'categories'
  | 'qr_codes'
  | 'gifts'
  | 'banners'
  | 'notifications'
  | 'electricians'
  | 'dealers'
  | 'app_users'
  | 'counterboys'
  | 'reports'
  | 'settings'
  | 'finance'
  | 'commissions'
  | 'support';

// Define actions for each module
export type ModuleAction = 'view' | 'create' | 'edit' | 'delete' | 'export';

// Module permission structure
export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
}

// Default permissions for each role
export const DEFAULT_ROLE_PERMISSIONS: Record<AdminRole, Record<ModuleName, ModulePermission>> = {
  super_admin: {
    products: { view: true, create: true, edit: true, delete: true, export: true },
    categories: { view: true, create: true, edit: true, delete: true, export: true },
    qr_codes: { view: true, create: true, edit: true, delete: true, export: true },
    gifts: { view: true, create: true, edit: true, delete: true, export: true },
    banners: { view: true, create: true, edit: true, delete: true, export: true },
    notifications: { view: true, create: true, edit: true, delete: true, export: true },
    electricians: { view: true, create: true, edit: true, delete: true, export: true },
    dealers: { view: true, create: true, edit: true, delete: true, export: true },
    app_users: { view: true, create: true, edit: true, delete: true, export: true },
    counterboys: { view: true, create: true, edit: true, delete: true, export: true },
    reports: { view: true, create: true, edit: true, delete: true, export: true },
    settings: { view: true, create: true, edit: true, delete: true, export: true },
    finance: { view: true, create: true, edit: true, delete: true, export: true },
    commissions: { view: true, create: true, edit: true, delete: true, export: true },
    support: { view: true, create: true, edit: true, delete: true, export: true },
  },
  admin: {
    products: { view: false, create: false, edit: false, delete: false, export: false },
    categories: { view: false, create: false, edit: false, delete: false, export: false },
    qr_codes: { view: false, create: false, edit: false, delete: false, export: false },
    gifts: { view: false, create: false, edit: false, delete: false, export: false },
    banners: { view: false, create: false, edit: false, delete: false, export: false },
    notifications: { view: false, create: false, edit: false, delete: false, export: false },
    electricians: { view: false, create: false, edit: false, delete: false, export: false },
    dealers: { view: false, create: false, edit: false, delete: false, export: false },
    app_users: { view: true, create: true, edit: true, delete: false, export: true },
    counterboys: { view: true, create: true, edit: true, delete: false, export: true },
    reports: { view: false, create: false, edit: false, delete: false, export: false },
    settings: { view: false, create: false, edit: false, delete: false, export: false },
    finance: { view: false, create: false, edit: false, delete: false, export: false },
    commissions: { view: false, create: false, edit: false, delete: false, export: false },
    support: { view: false, create: false, edit: false, delete: false, export: false },
  },
  staff: {
    products: { view: true, create: false, edit: false, delete: false, export: false },
    categories: { view: true, create: false, edit: false, delete: false, export: false },
    qr_codes: { view: true, create: true, edit: false, delete: false, export: true },
    gifts: { view: false, create: false, edit: false, delete: false, export: false },
    banners: { view: false, create: false, edit: false, delete: false, export: false },
    notifications: { view: false, create: false, edit: false, delete: false, export: false },
    electricians: { view: false, create: false, edit: false, delete: false, export: false },
    dealers: { view: false, create: false, edit: false, delete: false, export: false },
    app_users: { view: false, create: false, edit: false, delete: false, export: false },
    counterboys: { view: false, create: false, edit: false, delete: false, export: false },
    reports: { view: false, create: false, edit: false, delete: false, export: false },
    settings: { view: false, create: false, edit: false, delete: false, export: false },
    finance: { view: false, create: false, edit: false, delete: false, export: false },
    commissions: { view: false, create: false, edit: false, delete: false, export: false },
    support: { view: false, create: false, edit: false, delete: false, export: false },
  },
};

// Module display names
export const MODULE_LABELS: Record<ModuleName, string> = {
  products: 'Products',
  categories: 'Categories',
  qr_codes: 'QR Codes',
  gifts: 'Gifts',
  banners: 'Banners',
  notifications: 'Notifications',
  electricians: 'Electricians',
  dealers: 'Dealers',
  app_users: 'Customers',
  counterboys: 'Counter Boys',
  reports: 'Reports',
  settings: 'Settings',
  finance: 'Finance',
  commissions: 'Commissions',
  support: 'Support',
};

// Helper function to check if user has permission for a specific action on a module
export function hasModulePermission(
  role: AdminRole,
  module: ModuleName,
  action: ModuleAction,
  customPermissions?: Record<ModuleName, ModulePermission>
): boolean {
  // Super admin always has all permissions
  if (role === 'super_admin') {
    return true;
  }

  // Check custom permissions first (from database/admin settings)
  if (customPermissions && customPermissions[module]) {
    return customPermissions[module][action];
  }

  // Fall back to default permissions
  return DEFAULT_ROLE_PERMISSIONS[role][module][action];
}

// Helper function to get all permissions for a role
export function getRoleModulePermissions(
  role: AdminRole,
  customPermissions?: Record<ModuleName, ModulePermission>
): Record<ModuleName, ModulePermission> {
  if (role === 'super_admin') {
    return DEFAULT_ROLE_PERMISSIONS.super_admin;
  }

  if (customPermissions) {
    return customPermissions;
  }

  return DEFAULT_ROLE_PERMISSIONS[role];
}

// Helper functions for common checks
export function canViewModule(role: AdminRole, module: ModuleName): boolean {
  return hasModulePermission(role, module, 'view');
}

export function canCreateInModule(role: AdminRole, module: ModuleName): boolean {
  return hasModulePermission(role, module, 'create');
}

export function canEditInModule(role: AdminRole, module: ModuleName): boolean {
  return hasModulePermission(role, module, 'edit');
}

export function canDeleteInModule(role: AdminRole, module: ModuleName): boolean {
  return hasModulePermission(role, module, 'delete');
}

export function canExportFromModule(role: AdminRole, module: ModuleName): boolean {
  return hasModulePermission(role, module, 'export');
}

// Get list of modules user can access
export function getAccessibleModules(role: AdminRole): ModuleName[] {
  if (role === 'super_admin') {
    return Object.keys(MODULE_LABELS) as ModuleName[];
  }

  const permissions = DEFAULT_ROLE_PERMISSIONS[role];
  return (Object.keys(permissions) as ModuleName[]).filter(
    module => permissions[module].view
  );
}
