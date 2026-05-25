import { useMutation, useQuery } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/services/api';

export function useLogin() {
  const { setAuthData, setTenant } = useAuthStore();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: async (data) => {
      // 1. Store auth data (token + user)
      setAuthData(data);

      // 2. If user belongs to a tenant, fetch tenant details
      if (data.user.tenantId) {
        try {
          const tenantRes = await api.get(`/tenants/${data.user.tenantId}`);
          const tenantData = tenantRes.data?.data ?? tenantRes.data;
          if (tenantData) {
            setTenant({
              id: tenantData.id,
              name: tenantData.name,
              activeModules: tenantData.activeModules ?? [],
            });
          }
        } catch {
          // Non-fatal — tenant info will be missing but user is still logged in
        }
      } else if (data.user.isSuperAdmin) {
        // SuperAdmin has no tenant — give them a virtual "platform" tenant with all modules
        setTenant({
          id: 'superadmin',
          name: 'Platform SuperAdmin',
          activeModules: [
            'students', 'staff', 'academics', 'attendance', 'fee', 'exams',
            'library', 'communication', 'analytics', 'whatsapp',
            'hostel', 'leave', 'transport', 'homework', 'website', 'settings',
          ],
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
