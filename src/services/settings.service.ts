import { api } from './api';
import { Tenant } from '@/types/api.types';

export const settingsService = {
  getTenantDetails: async () => {
    const response = await api.get<Tenant>('/tenants/current');
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  /**
   * School profile only. `PATCH /tenants/current` is bound to UpdateOwnTenantDto
   * on the backend and runs behind a forbidNonWhitelisted ValidationPipe, so
   * sending `slug`, `plan` or `activeModules` here is a 400 — commercial state
   * moved to the superadmin routes below. (The old payload included `slug`,
   * which is not a Tenant DTO field at all, so this save had been failing.)
   */
  updateTenantDetails: async (data: Partial<Tenant>) => {
    const response = await api.patch<Tenant>('/tenants/current', data);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  /** Plan changes are superadmin-only: PATCH /tenants/:id/plan. */
  updateTenantPlan: async (tenantId: string, plan: string) => {
    const response = await api.patch<Tenant>(`/tenants/${tenantId}/plan`, { plan });
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  /** Module changes are superadmin-only: PATCH /tenants/:id/modules. */
  updateTenantModules: async (tenantId: string, modules: string[]) => {
    const response = await api.patch<Tenant>(`/tenants/${tenantId}/modules`, { modules });
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },
};
