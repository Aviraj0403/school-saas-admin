import { api } from './api';

export interface RbacRole {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  isSystem?: boolean;
  isDefault?: boolean;
  isActive?: boolean;
  color?: string | null;
  permissions?: RbacPermission[];
  modulePermissions?: ModulePermission[];
  _count?: { users?: number; permissions?: number };
}

export interface RbacPermission {
  id: string;
  module: string;
  action: string;
  subject?: string | null;
}

export interface SystemModule {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  order: number;
  icon?: string | null;
  submodules: Submodule[];
}

export interface Submodule {
  id: string;
  moduleId: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  order: number;
  module?: SystemModule;
}

export interface ModulePermission {
  id?: string;
  roleId: string;
  submoduleId: string;
  canRead: boolean;
  canWrite: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  submodule?: Submodule;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  tenantId?: string | null;
  roles: Array<{ role: RbacRole }>;
  createdAt: string;
}

const unwrap = (r: any) => r?.data?.data ?? r?.data ?? null;

export const rbacService = {
  // ── Roles ──────────────────────────────────────────────────
  getRoles: async (): Promise<RbacRole[]> => {
    const res = await api.get('/rbac/roles');
    const d = unwrap(res);
    return d?.items ?? (Array.isArray(d) ? d : []);
  },

  getRole: async (id: string): Promise<RbacRole | null> => {
    const res = await api.get(`/rbac/roles/${id}`);
    return unwrap(res);
  },

  createRole: async (body: {
    name: string;
    slug: string;
    description?: string;
    color?: string;
    isActive?: boolean;
  }) => {
    const res = await api.post('/rbac/roles', body);
    return unwrap(res);
  },

  updateRole: async (
    id: string,
    body: { name?: string; description?: string; color?: string; isActive?: boolean }
  ) => {
    const res = await api.patch(`/rbac/roles/${id}`, body);
    return unwrap(res);
  },

  deleteRole: async (id: string) => {
    const res = await api.delete(`/rbac/roles/${id}`);
    return unwrap(res);
  },

  // ── Permissions Matrix (KCA pattern) ───────────────────────
  getRolePermissions: async (roleId: string): Promise<ModulePermission[]> => {
    const res = await api.get(`/rbac/permissions/role/${roleId}`);
    const d = unwrap(res);
    return d?.items ?? (Array.isArray(d) ? d : []);
  },

  updatePermission: async (body: {
    roleId: string;
    submoduleId: string;
    canRead: boolean;
    canWrite: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }): Promise<ModulePermission> => {
    const res = await api.post('/rbac/permissions', body);
    return unwrap(res);
  },

  revokeModuleFromRole: async (roleId: string, moduleId: string) => {
    const res = await api.delete(`/rbac/permissions/role/${roleId}/module/${moduleId}`);
    return unwrap(res);
  },

  // ── System Modules & Submodules ───────────────────────────
  getModules: async (includeInactive = true): Promise<SystemModule[]> => {
    const res = await api.get(`/rbac/modules?includeInactive=${includeInactive}`);
    const d = unwrap(res);
    return d?.items ?? (Array.isArray(d) ? d : []);
  },

  createModule: async (body: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    submodules?: Array<{ name: string; slug: string; description?: string }>;
  }) => {
    const res = await api.post('/rbac/modules', body);
    return unwrap(res);
  },

  updateModule: async (
    id: string,
    body: { name?: string; description?: string; isActive?: boolean; icon?: string }
  ) => {
    const res = await api.patch(`/rbac/modules/${id}`, body);
    return unwrap(res);
  },

  deleteModule: async (id: string) => {
    const res = await api.delete(`/rbac/modules/${id}`);
    return unwrap(res);
  },

  createSubmodule: async (body: {
    moduleId: string;
    name: string;
    slug: string;
    description?: string;
  }) => {
    const res = await api.post('/rbac/submodules', body);
    return unwrap(res);
  },

  updateSubmodule: async (
    id: string,
    body: { name?: string; description?: string; isActive?: boolean }
  ) => {
    const res = await api.patch(`/rbac/submodules/${id}`, body);
    return unwrap(res);
  },

  deleteSubmodule: async (id: string) => {
    const res = await api.delete(`/rbac/submodules/${id}`);
    return unwrap(res);
  },

  // ── User Management & Role Assignment ──────────────────────
  getAllUsers: async (): Promise<SystemUser[]> => {
    const res = await api.get('/rbac/users');
    const d = unwrap(res);
    return d?.items ?? (Array.isArray(d) ? d : []);
  },

  updateUserRoles: async (userId: string, roleIds: string[]) => {
    const res = await api.patch(`/rbac/users/${userId}/roles`, { roleIds });
    return unwrap(res);
  },

  updateUserStatus: async (userId: string, isActive: boolean) => {
    const res = await api.patch(`/rbac/users/${userId}/status`, { isActive });
    return unwrap(res);
  },

  // ── Legacy Permissions ─────────────────────────────────────
  assignPermissions: async (roleId: string, permissionIds: string[]) => {
    const res = await api.post(`/rbac/roles/${roleId}/permissions`, { permissionIds });
    return unwrap(res);
  },

  getPermissions: async (): Promise<RbacPermission[]> => {
    const res = await api.get('/rbac/permissions');
    const d = unwrap(res);
    return d?.items ?? (Array.isArray(d) ? d : []);
  },

  assignRoleToUser: async (userId: string, roleId: string) => {
    const res = await api.post('/rbac/assign', { userId, roleId });
    return unwrap(res);
  },

  revokeRoleFromUser: async (userId: string, roleId: string) => {
    const res = await api.delete(`/rbac/users/${userId}/roles/${roleId}`);
    return unwrap(res);
  },

  getUserRoles: async (userId: string): Promise<RbacRole[]> => {
    const res = await api.get(`/rbac/users/${userId}/roles`);
    const d = unwrap(res);
    return d?.items ?? (Array.isArray(d) ? d : []);
  },
};
