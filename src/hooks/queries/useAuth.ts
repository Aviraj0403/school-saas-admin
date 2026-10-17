import { useMutation, useQuery } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useTenantStore } from '@/store/useTenantStore';
import { api } from '@/services/api';

const ALL_MODULES = [
  'students',
  'staff',
  'academics',
  'attendance',
  'fee',
  'exams',
  'library',
  'communication',
  'analytics',
  'whatsapp',
  'hostel',
  'leave',
  'transport',
  'homework',
  'website',
  'settings',
];

export function useLogin() {
  const { setAuthData, setTenant } = useAuthStore();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: async (data) => {
      setAuthData(data);

      if (data.user.tenantId) {
        setTenant({
          id: data.user.tenantId,
          name: 'Your School',
          activeModules: ALL_MODULES,
        });

        try {
          const tenantRes = await api.get(`/tenants/${data.user.tenantId}`, {
            skipAuthRedirect: true,
          });
          const tenantData = tenantRes.data?.data ?? tenantRes.data;
          if (tenantData) {
            setTenant({
              id: tenantData.id,
              name: tenantData.name,
              activeModules: tenantData.activeModules ?? ALL_MODULES,
              projectCode: tenantData.projectCode,
              subdomain: tenantData.subdomain,
              prefix: tenantData.prefix,
            });
          }
        } catch {
          // School users can't read /tenants/:id; fall back to the public tenant
          // record ThemeProvider resolved from the subdomain when it's the same school.
          const resolved = useTenantStore.getState().tenant;
          setTenant(
            resolved && resolved.id === data.user.tenantId
              ? {
                  id: resolved.id,
                  name: resolved.name,
                  activeModules: resolved.activeModules?.length
                    ? resolved.activeModules
                    : ALL_MODULES,
                  projectCode: resolved.projectCode,
                  subdomain: resolved.subdomain,
                  prefix: (resolved as any).prefix,
                  theme: resolved.theme ?? undefined,
                }
              : {
                  id: data.user.tenantId,
                  name: 'Your School',
                  activeModules: ALL_MODULES,
                }
          );
        }
      } else if (data.user.isSuperAdmin) {
        setTenant({
          id: 'superadmin',
          name: 'Platform SuperAdmin',
          activeModules: ALL_MODULES,
        });
      }
    },
  });
}

export function useGetMe() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.getMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
