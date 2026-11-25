import { useQuery } from '@tanstack/react-query';
import { staffService } from '@/services/staffDirectory.service';
import { useAuthStore } from '@/store/useAuthStore';

/** Active staff for teacher / invigilator pickers (readable by all staff roles). */
export function useStaffDirectory() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['staff', 'directory-lite'],
    queryFn: () => staffService.getDirectoryLite(),
    enabled: isAuthenticated,
    staleTime: 60_000,
    retry: false,
  });
}
