'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { normalizeModuleKey } from '@/lib/moduleAccess';

type Action = 'read' | 'write' | 'update' | 'delete';

const ACTION_KEY: Record<Action, string> = {
  read: 'read',
  write: 'create',
  update: 'update',
  delete: 'delete',
};

/**
 * Compatibility wrapper kept for pages written against the module-matrix API
 * (hasPermission('students', 'write')). It reads the permissions GET /auth/me
 * already returned — no extra request, and it works for every role (the old
 * implementation called an admin-only endpoint, so non-admins always got 403).
 *
 * Submodule slugs ('student_directory') resolve to their parent module.
 */
export function usePermission() {
  const { can, isAdmin, isSuperAdmin, role } = usePermissions();

  const hasPermission = (moduleOrSubmoduleSlug: string, action: Action = 'read'): boolean => {
    if (isAdmin) return true;
    const slug = moduleOrSubmoduleSlug.toLowerCase().trim();
    const mod = normalizeModuleKey(slug.split('_')[0]);
    return (
      can(`${mod}:${ACTION_KEY[action]}`) ||
      can(`${normalizeModuleKey(slug)}:${ACTION_KEY[action]}`)
    );
  };

  return {
    hasPermission,
    isSuperAdmin,
    isSchoolAdmin: isAdmin,
    roleSlug: role,
  };
}
