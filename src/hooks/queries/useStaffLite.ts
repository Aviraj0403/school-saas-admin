import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { asList, unwrap } from '@/lib/utils';

export interface StaffLite {
  id: string; // user id
  name: string;
  designation: string | null;
  departmentId: string | null;
}

/** Staff picker data readable by every staff role (GET /staff is admin-only). */
export function useStaffLite() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['staff-directory-lite'],
    queryFn: async (): Promise<StaffLite[]> =>
      asList<StaffLite>(unwrap(await api.get('/staff/directory-lite'))),
    enabled: isAuthenticated,
    staleTime: 60_000,
    retry: false,
  });
}
