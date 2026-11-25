import { useMutation, useQuery } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useTenantStore } from '@/store/useTenantStore';

/**
 * Login = authenticate, then ask the server who we are. GET /auth/me is the single
 * source for tenant, effective modules, permissions and "my data" scope — the old
 * hard-coded module list is gone, so a school sees exactly what its plan includes.
 */
export function useLogin() {
  const { setAuthData, setTenant, setContext } = useAuthStore();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: async (data) => {
      setAuthData(data);

      try {
        const me = await authService.getMe();
        if (me) setContext(me);
      } catch {
        // /me failed: fall back to the public tenant record resolved from the subdomain
        const resolved = useTenantStore.getState().tenant;
        if (data.user.tenantId) {
          setTenant({
            id: data.user.tenantId,
            name: resolved?.id === data.user.tenantId ? resolved.name : 'Your School',
            activeModules:
              resolved?.id === data.user.tenantId ? (resolved.activeModules ?? []) : [],
            projectCode: resolved?.projectCode,
            subdomain: resolved?.subdomain,
            theme: resolved?.theme ?? undefined,
          });
        }
      }

      if (!data.user.tenantId && data.user.isSuperAdmin && !useAuthStore.getState().activeTenant) {
        setTenant({ id: 'superadmin', name: 'Platform SuperAdmin', activeModules: [] });
      }
    },
  });
}

export function useGetMe() {
  const { isAuthenticated, activeTenant } = useAuthStore();
  return useQuery({
    queryKey: ['auth', 'me', activeTenant?.id ?? 'none'],
    queryFn: authService.getMe,
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}
