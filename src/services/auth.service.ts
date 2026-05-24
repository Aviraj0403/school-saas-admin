import { api } from './api';
import { AuthResponse } from '@/types/api.types';

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get<AuthResponse>('/auth/me');
    return response.data;
  },
  
  logout: async () => {
    // Optionally call backend logout to invalidate refresh token
    // await api.post('/auth/logout');
  }
};
