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
      const activeTenant = useAuthStore.getState().activeTenant || useTenantStore.getState().tenant;
      const tenantId = activeTenant?.id;
      if (tenantId && tenantId !== 'superadmin') {
        config.headers['X-Tenant-Id'] = tenantId;
      }

      // Inject project code if available in either auth store or tenant store
      const projectCode = activeTenant?.projectCode || (useTenantStore.getState().tenant as any)?.projectCode;
      if (projectCode) {
        config.headers['X-Project-Code'] = projectCode;
      }

      // Inject subdomain if available or derived
      const subdomain = activeTenant?.subdomain || useTenantStore.getState().tenant?.subdomain;
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

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor for global error handling and silent token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.skipAuthRedirect) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

      if (!refreshToken) {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') window.location.href = '/';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refreshToken: refreshToken
        });
        
        const newAccessToken = data.data?.accessToken || data.accessToken;
        
        if (newAccessToken && typeof window !== 'undefined') {
          localStorage.setItem('auth_token', newAccessToken);
          useAuthStore.setState({ token: newAccessToken });
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return api(originalRequest);
        } else {
          throw new Error('No access token returned');
        }
      } catch (err) {
        processQueue(err, null);
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') window.location.href = '/';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
