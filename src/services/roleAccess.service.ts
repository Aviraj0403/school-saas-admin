import { api } from './api';
import { unwrap } from '@/lib/utils';

export interface RoleAccessData {
  /** configurable roles with the modules each works with by default */
  roles: { slug: string; name: string; defaults: string[] }[];
  /** modules this school has (core excluded) */
  modules: { key: string; label: string; group: string }[];
  /** { roleSlug: { moduleKey: false } } — only switched-off entries are stored */
  access: Record<string, Record<string, boolean>>;
}

export const roleAccessService = {
  get: async (): Promise<RoleAccessData> => unwrap(await api.get('/modules/role-access')),
  set: async (role: string, module: string, enabled: boolean) =>
    unwrap(await api.put('/modules/role-access', { role, module, enabled })),
};
