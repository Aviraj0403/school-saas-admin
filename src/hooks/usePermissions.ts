'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { normalizeRole } from '@/config/navigation';
import { isModuleActive } from '@/lib/moduleAccess';

/**
 * The one place a page asks "may I show this button?".
 *   can('fee:create')  — permission from GET /auth/me ('*' for admins)
 *   hasModule('hostel') — module switched on for this school
 *   isRole('teacher')   — role slug, aliases normalised
 */
export function usePermissions() {
  const { activeUser, activeTenant, permissions, scope, isMirroring } = useAuthStore();
  return useMemo(() => {
    const role = normalizeRole(activeUser?.role || '');
    const isSuper = !!activeUser?.isSuperAdmin && !isMirroring;
    const isAdmin = isSuper || role === 'school_admin' || role === 'superadmin';
    const granted = new Set(permissions);
    return {
      role,
      isSuperAdmin: isSuper,
      isAdmin,
      scope,
      isRole: (...slugs: string[]) => slugs.map(normalizeRole).includes(role),
      hasModule: (m: string) => isModuleActive(activeTenant?.activeModules, m),
      can: (perm: string) => {
        if (isAdmin && !isMirroring) return true;
        if (isMirroring && isAdmin) return true;
        return granted.has('*') || granted.has(perm);
      },
    };
  }, [activeUser, activeTenant, permissions, scope, isMirroring]);
}
