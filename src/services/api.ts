import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useTenantStore } from '@/store/useTenantStore';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuthRedirect?: boolean;
  }
}

// Create a configured axios instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://apischool.jdinfotechsolutions.in/api/v1',
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
      const tenantId = useAuthStore.getState().activeTenant?.id || useTenantStore.getState().tenant?.id;
      if (tenantId && tenantId !== 'superadmin') {
        config.headers['X-Tenant-Id'] = tenantId;
      }

      // Inject subdomain if available or derived
      const subdomain = useTenantStore.getState().tenant?.subdomain;
      if (subdomain) {
        config.headers['X-Tenant-Subdomain'] = subdomain;
      } else {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        let derivedSubdomain = '';
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          derivedSubdomain = 'demo';
        } else if (hostname === 'schooldemo.jdinfotechsolutions.in') {
          derivedSubdomain = 'demo';
        } else if (parts.length >= 3 && parts[0] !== 'www') {
          derivedSubdomain = parts[0];
        }
        if (derivedSubdomain) {
          config.headers['X-Tenant-Subdomain'] = derivedSubdomain;
        }
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
    if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
      // Clear auth state on 401 Unauthorized
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/'; // Redirect to login
      }
    }
    return Promise.reject(error);
  }
);
