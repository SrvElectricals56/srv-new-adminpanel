import { AdminRole } from '@/lib/types';

interface ModulePermission {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

interface UserPermissions {
  // Permission strings for UI display
  permissions: string[];
  // Module-based permissions for granular control
  modulePermissions: ModulePermission[];
  // Helper functions
  hasPermission: (permission: string) => boolean;
  canViewModule: (module: string) => boolean;
  canCreateInModule: (module: string) => boolean;
  canEditInModule: (module: string) => boolean;
  canDeleteInModule: (module: string) => boolean;
  canExportFromModule: (module: string) => boolean;
  loading: boolean;
}

const MODULE_MAP: Record<string, string> = {
  'dashboard': 'View Dashboard',
  'electricians': 'Manage Electricians',
  'dealers': 'Manage Dealers',
  'products': 'Manage Products',
  'qr_codes': 'Manage QR Codes',
  'gifts': 'Manage Gifts',
  'reports': 'View Reports',
  'settings': 'Manage Settings',
  'notifications': 'Send Notifications',
  'banners': 'Manage Banners',
  'finance': 'Manage Finance',
  'commissions': 'Manage Commissions',
};

const ALL_MODULES = Object.keys(MODULE_MAP);

function getRoleModulePermission(role: AdminRole, module: string): ModulePermission {
  if (role === 'super_admin') {
    return { module, canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true };
  }

  if (role === 'admin') {
    if (module === 'settings') {
      return { module, canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false };
    }

    if (module === 'qr_codes') {
      return { module, canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true };
    }

    return { module, canView: true, canCreate: false, canEdit: true, canDelete: false, canExport: true };
  }

  return { module, canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: true };
}

export function useUserPermissions(adminId: string | undefined, role: AdminRole): UserPermissions {
  void adminId;

  const modulePermissions = ALL_MODULES.map(module => getRoleModulePermission(role, module));
  const permissions = modulePermissions
    .filter(permission => permission.canView)
    .map(permission => MODULE_MAP[permission.module])
    .filter(Boolean);
  const loading = false;

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const getModulePermission = (module: string): ModulePermission | undefined => {
    return modulePermissions.find(p => p.module === module);
  };

  const canViewModule = (module: string): boolean => {
    if (role === 'super_admin') return true;
    const perm = getModulePermission(module);
    return perm?.canView ?? false;
  };

  const canCreateInModule = (module: string): boolean => {
    if (role === 'super_admin') return true;
    const perm = getModulePermission(module);
    return perm?.canCreate ?? false;
  };

  const canEditInModule = (module: string): boolean => {
    if (role === 'super_admin') return true;
    const perm = getModulePermission(module);
    return perm?.canEdit ?? false;
  };

  const canDeleteInModule = (module: string): boolean => {
    if (role === 'super_admin') return true;
    const perm = getModulePermission(module);
    return perm?.canDelete ?? false;
  };

  const canExportFromModule = (module: string): boolean => {
    if (role === 'super_admin') return true;
    const perm = getModulePermission(module);
    return perm?.canExport ?? false;
  };

  return {
    permissions,
    modulePermissions,
    hasPermission,
    canViewModule,
    canCreateInModule,
    canEditInModule,
    canDeleteInModule,
    canExportFromModule,
    loading,
  };
}
