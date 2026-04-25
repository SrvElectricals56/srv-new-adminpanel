import type { AdminRole, RolePermissions } from './types';

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<AdminRole, RolePermissions> = {
  super_admin: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canView: true,
  },
  admin: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canView: true,
  },
  staff: {
    canCreate: false, // Staff is read-only
    canEdit: false,
    canDelete: false,
    canView: true,
  },
};

// Helper function to get permissions for a role
export function getPermissions(role: AdminRole): RolePermissions {
  return ROLE_PERMISSIONS[role];
}

// Helper functions to check specific permissions
export function canCreate(role: AdminRole): boolean {
  return ROLE_PERMISSIONS[role].canCreate;
}

export function canEdit(role: AdminRole): boolean {
  return ROLE_PERMISSIONS[role].canEdit;
}

export function canDelete(role: AdminRole): boolean {
  return ROLE_PERMISSIONS[role].canDelete;
}

export function canView(role: AdminRole): boolean {
  return ROLE_PERMISSIONS[role].canView;
}