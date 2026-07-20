import type { Role } from '@/store/useAuthStore';

/** Only school admins and super admins may add or change profile photos (students/staff).
 *  Mirrors the backend's @Roles('school_admin') guard on the photo upload endpoints. */
export function canManageProfilePhotos(role: Role | undefined, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
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
