import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import {
  subscriptionModulesService,
  type AddonInput,
} from '../services/subscription-modules.service';

export const moduleKeys = {
  school: (id?: string) => ['superadmin', 'school', id, 'modules'] as const,
  catalog: ['superadmin', 'module-catalog'] as const,
};

export const useSchoolModules = (tenantId?: string) =>
  useQuery({
    queryKey: moduleKeys.school(tenantId),
    queryFn: () => subscriptionModulesService.schoolModules(tenantId!),
    enabled: !!tenantId,
  });

export const useModuleCatalog = () => {
  const enabled = useAuthStore((s) => !!s.user?.isSuperAdmin);
  return useQuery({
    queryKey: moduleKeys.catalog,
    queryFn: subscriptionModulesService.catalog,
    enabled,
  });
};

/** A module change alters the school's effective modules, so refresh every superadmin view. */
function useInvalidateSuper() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['superadmin'] });
}

export const useSetModuleOverride = () => {
  const invalidate = useInvalidateSuper();
  return useMutation({
    mutationFn: (v: { tenantId: string; key: string; value: boolean | null }) =>
      subscriptionModulesService.setOverride(v.tenantId, v.key, v.value),
    onSuccess: invalidate,
  });
};

export const useSetAddon = () => {
  const invalidate = useInvalidateSuper();
  return useMutation({
    mutationFn: (v: { tenantId: string; key: string; body: AddonInput }) =>
      subscriptionModulesService.setAddon(v.tenantId, v.key, v.body),
    onSuccess: invalidate,
  });
};

export const useUpdateCatalogEntry = () => {
  const invalidate = useInvalidateSuper();
  return useMutation({
    mutationFn: (v: {
      key: string;
      body: { label?: string; description?: string; priceMonthly?: number | null };
    }) => subscriptionModulesService.updateCatalog(v.key, v.body),
    onSuccess: invalidate,
  });
};
