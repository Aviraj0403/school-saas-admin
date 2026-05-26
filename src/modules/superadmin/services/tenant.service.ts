import { api } from '@/services/api';
import { PaginatedResponse, Tenant, CreateTenantDto } from '@/types/api.types';

// Backend routes: /api/v1/tenants (SuperAdmin-only, guarded by @SuperAdminOnly())
export const tenantService = {
  getTenants: async (page = 1, limit = 10, search?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) params.append('search', search);
    const response = await api.get<any>(`/tenants?${params.toString()}`);
    const items = response.data.data ?? [];
    const meta = response.data.meta ?? { total: 0, page, limit, totalPages: 0 };
    return { items, meta, data: { items, meta } };
  },

  createTenant: async (data: CreateTenantDto) => {
    const response = await api.post<{ success: boolean; data: Tenant }>('/tenants', data);
    return response.data;
  },

  suspendTenant: async (id: string) => {
    const response = await api.patch<{ success: boolean }>(`/tenants/${id}/suspend`);
    return response.data;
  },

  activateTenant: async (id: string) => {
    const response = await api.patch<{ success: boolean }>(`/tenants/${id}/activate`);
    return response.data;
  },

  setModules: async (id: string, modules: string[]) => {
    const response = await api.patch<{ success: boolean }>(`/tenants/${id}/modules`, { modules });
    return response.data;
  },

  setPlan: async (id: string, plan: string) => {
    const response = await api.patch<{ success: boolean }>(`/tenants/${id}/plan`, { plan });
    return response.data;
  },
};
