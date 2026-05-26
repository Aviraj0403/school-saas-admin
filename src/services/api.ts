import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// Create a configured axios instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || ' https://apischool.jdinfotechsolutions.in/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject tenant information and auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Inject tenant ID if we have it in state
      const tenantId = useAuthStore.getState().activeTenant?.id;
      if (tenantId) {
        config.headers['X-Tenant-Id'] = tenantId;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth state on 401 Unauthorized
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/'; // Redirect to login
      }
    }
    return Promise.reject(error);
  }
);
