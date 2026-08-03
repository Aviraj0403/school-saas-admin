import { api } from './api';

/**
 * RBAC — ten backend endpoints that had no UI on either client, so the whole
 * permission model was only editable by seeding or direct SQL. School admins
 * could see which roles existed (the staff form reads /rbac/roles for a
 * dropdown) but could not create one, inspect what it grants, or change it.
 */

export interface RbacRole {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  isSystem?: boolean;
  isDefault?: boolean;
  color?: string | null;
  permissions?: RbacPermission[];
  _count?: { users?: number; permissions?: number };
}

export interface RbacPermission {
  id: string;
  module: string;
  action: string;
  subject?: string | null;
}

const unwrap = (r: any) => r?.data?.data ?? r?.data ?? null;

export const rbacService = {
  getRoles: async (): Promise<RbacRole[]> => {
    const res = await api.get('/rbac/roles');
    const d = unwrap(res);
    return d?.items ?? d ?? [];
  },

  getRole: async (id: string): Promise<RbacRole | null> => {
    const res = await api.get(`/rbac/roles/${id}`);
    return unwrap(res);
  },

  createRole: async (body: { name: string; slug: string; description?: string }) => {
    const res = await api.post('/rbac/roles', body);
    return unwrap(res);
  },

  updateRole: async (id: string, body: { name?: string; description?: string }) => {
    const res = await api.patch(`/rbac/roles/${id}`, body);
    return unwrap(res);
  },

  deleteRole: async (id: string) => {
    const res = await api.delete(`/rbac/roles/${id}`);
    return unwrap(res);
  },

  /** Replaces the role's grants wholesale — send the full desired set. */
  assignPermissions: async (roleId: string, permissionIds: string[]) => {
    const res = await api.post(`/rbac/roles/${roleId}/permissions`, { permissionIds });
    return unwrap(res);
  },

  getPermissions: async (): Promise<RbacPermission[]> => {
    const res = await api.get('/rbac/permissions');
    const d = unwrap(res);
    return d?.items ?? d ?? [];
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
    return d?.items ?? d ?? [];
  },
};
