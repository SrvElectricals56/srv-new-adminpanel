/**
 * Role-Based Permission System
 *
 * super_admin → Full access to everything
 * admin       → View + Edit only (no Add/Delete) except Admin Settings hidden
 *               QR Codes: Generate + Edit allowed (like super_admin)
 * staff       → View only, no Add/Edit/Delete anywhere
 */

import type { AdminRole } from '@/lib/types';

export interface RolePerms {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  /** QR-specific: can generate QR codes */
  canGenerate?: boolean;
  /** Whether this section is visible at all */
  visible: boolean;
}

// Modules that admin CANNOT see at all
const ADMIN_HIDDEN_MODULES = ['admin_settings'];

function getPerms(role: AdminRole, module: string): RolePerms {
  switch (role) {
    case 'super_admin':
      return { visible: true, canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, canGenerate: true };

    case 'admin':
      if (ADMIN_HIDDEN_MODULES.includes(module)) {
        return { visible: false, canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false };
      }
      // QR codes: admin gets generate + edit (same as super_admin)
      if (module === 'qr_codes') {
        return { visible: true, canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, canGenerate: true };
      }
      // All other modules: view + edit only, no add/delete
      return { visible: true, canView: true, canCreate: false, canEdit: true, canDelete: false, canExport: true, canGenerate: false };

    case 'staff':
    default:
      // View only everywhere
      return { visible: true, canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: true, canGenerate: false };
  }
}

/**
 * Main hook-like function to get permissions for a module.
 * Use this in every component.
 *
 * @example
 * const perms = useRolePerms(role, 'products');
 * {perms.canCreate && <button>Add Product</button>}
 */
export function useRolePerms(role: AdminRole, module: string): RolePerms {
  return getPerms(role, module);
}

/**
 * Check if admin settings page should be visible
 */
export function canSeeAdminSettings(role: AdminRole): boolean {
  return role === 'super_admin';
}
