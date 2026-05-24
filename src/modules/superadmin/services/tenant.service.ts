import { api } from '@/services/api';
import { PaginatedResponse, Tenant, CreateTenantDto } from '@/types/api.types';

export const tenantService = {
  getTenants: async (page = 1, limit = 10, search?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) params.append('search', search);
    
    // In Phase 1/Backend this is mapped under /superadmin/tenants
    const response = await api.get<PaginatedResponse<Tenant>>(`/superadmin/tenants?${params.toString()}`);
    return response.data;
  },

  createTenant: async (data: CreateTenantDto) => {
    const response = await api.post<{ success: boolean; data: Tenant }>('/superadmin/tenants', data);
    return response.data;
  },

  suspendTenant: async (id: string) => {
    const response = await api.patch<{ success: boolean }>(`/superadmin/tenants/${id}/suspend`);
    return response.data;
  }
};
