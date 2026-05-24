import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantService } from '../services/tenant.service';
import { CreateTenantDto } from '@/types/api.types';

export function useTenantsList(page: number, limit: number, search?: string) {
  return useQuery({
    queryKey: ['superadmin', 'tenants', { page, limit, search }],
    queryFn: () => tenantService.getTenants(page, limit, search),
    placeholderData: (prev) => prev,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTenantDto) => tenantService.createTenant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'tenants'] });
    },
  });
}

export function useSuspendTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tenantService.suspendTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'tenants'] });
    },
  });
}
