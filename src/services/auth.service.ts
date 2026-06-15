import { api } from './api';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    tenantId: string | null;
    isSuperAdmin: boolean;
    roles: Array<{ id: string; slug: string; name: string }>;
  };
}

export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
    // Backend: POST /auth/login → ResponseInterceptor wraps as { success, data: { accessToken, refreshToken, user } }
    const response = await api.post<{ success: boolean; data: LoginResponse }>('/auth/login', credentials);
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  getMe: async () => {
    const response = await api.get<{ success: boolean; data: any }>('/auth/me');
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  logout: async (refreshToken: string) => {
    await api.post('/auth/logout', { refreshToken });
  },
};



