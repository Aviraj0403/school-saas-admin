import { useMutation, useQuery } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { AuthResponse } from '@/types/api.types';

export function useLogin() {
  const setAuthData = useAuthStore(state => state.setAuthData);

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data: AuthResponse) => {
      setAuthData(data);
    },
  });
}

// Example hook to fetch current user profile if needed to sync state on load
export function useGetMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.getMe,
    // Only fetch if we have a token but no user data (e.g., hard refresh)
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('auth_token') && !useAuthStore.getState().user,
  });
}
