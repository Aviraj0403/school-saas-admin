'use client';

import { useMemo } from 'react';
import { useAuthStore, Role } from '@/store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { rbacService, ModulePermission } from '@/services/rbac.service';

export function usePermission() {
  const activeUser = useAuthStore((s) => s.activeUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const isSuperAdmin = Boolean(activeUser?.isSuperAdmin || activeUser?.role === 'SuperAdmin');
  const roleSlug = activeUser?.roles?.[0]?.slug || (activeUser?.role as string)?.toLowerCase();
  const roleId = activeUser?.roles?.[0]?.id;

  const isSchoolAdmin =
    roleSlug === 'school_admin' ||
    roleSlug === 'superadmin' ||
    activeUser?.role === 'SuperAdmin' ||
    activeUser?.role === 'school_admin' ||
    activeUser?.role === 'Principal';

  // Fetch granted permissions for the active user's role
  const { data: permissions = [] } = useQuery<ModulePermission[]>({
    queryKey: ['my-role-permissions', roleId],
    queryFn: () => (roleId ? rbacService.getRolePermissions(roleId) : Promise.resolve([])),
    enabled: isAuthenticated && Boolean(roleId) && !isSuperAdmin && !isSchoolAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const permissionMap = useMemo(() => {
    const map = new Map<
      string,
      { canRead: boolean; canWrite: boolean; canUpdate: boolean; canDelete: boolean }
    >();
    for (const p of permissions) {
      if (p.submodule) {
        map.set(p.submodule.slug.toLowerCase(), {
          canRead: p.canRead,
          canWrite: p.canWrite,
          canUpdate: p.canUpdate,
          canDelete: p.canDelete,
        });
        if (p.submodule.module) {
          const modSlug = p.submodule.module.slug.toLowerCase();
          const existing = map.get(modSlug) || {
            canRead: false,
            canWrite: false,
            canUpdate: false,
            canDelete: false,
          };
          map.set(modSlug, {
            canRead: existing.canRead || p.canRead,
            canWrite: existing.canWrite || p.canWrite,
            canUpdate: existing.canUpdate || p.canUpdate,
            canDelete: existing.canDelete || p.canDelete,
          });
        }
      }
    }
    return map;
  }, [permissions]);

  /**
   * Check if the current user has permission for a submodule or module.
   * e.g. hasPermission('student_directory', 'read') or hasPermission('students', 'write')
   */
  const hasPermission = (
    moduleOrSubmoduleSlug: string,
    action: 'read' | 'write' | 'update' | 'delete' = 'read'
  ): boolean => {
    // Superadmin and School Admin have full access to everything
    if (isSuperAdmin || isSchoolAdmin) {
      return true;
    }

    const key = moduleOrSubmoduleSlug.toLowerCase().trim();
    const perm = permissionMap.get(key);
    if (!perm) return false;

    switch (action) {
      case 'read':
        return perm.canRead;
      case 'write':
        return perm.canWrite;
      case 'update':
        return perm.canUpdate;
      case 'delete':
        return perm.canDelete;
      default:
        return false;
    }
  };

  return {
    hasPermission,
    isSuperAdmin,
    isSchoolAdmin,
    activeUser,
    roleSlug,
    permissions,
  };
}
