import type { Role } from '@/store/useAuthStore';

/** Only school admins, super admins, or roles with staff/student update permission may manage photos. */
export function canManageProfilePhotos(
  role: Role | undefined,
  isSuperAdmin: boolean,
  hasPermissionFn?: (
    moduleOrSubmodule: string,
    action?: 'read' | 'write' | 'update' | 'delete'
  ) => boolean
): boolean {
  if (isSuperAdmin) return true;
  if (hasPermissionFn) {
    if (hasPermissionFn('staff', 'update') || hasPermissionFn('students', 'update')) {
      return true;
    }
  }
  switch ((role || '').toLowerCase()) {
    case 'superadmin':
    case 'super_admin':
    case 'admin':
    case 'school_admin':
    case 'principal':
      return true;
    default:
      return false;
  }
}
