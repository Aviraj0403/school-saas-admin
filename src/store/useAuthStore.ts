import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthResponse, TenantConfig, UserProfile } from '@/types/api.types';

export type Role = 'SuperAdmin' | 'Principal' | 'Teacher' | 'Accountant';

interface AuthState {
  user: UserProfile | null;
  tenant: TenantConfig | null;
  token: string | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  
  // Real active user/tenant vs demo overridden
  activeUser: UserProfile | null;
  activeTenant: TenantConfig | null;

  setAuthData: (data: AuthResponse) => void;
  logout: () => void;
  toggleDemoMode: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      token: null,
      isAuthenticated: false,
      isDemoMode: false,
      
      activeUser: null,
      activeTenant: null,

      setAuthData: (data) => {
        localStorage.setItem('auth_token', data.token);
        set({
          user: data.user,
          tenant: data.tenant,
          token: data.token,
          isAuthenticated: true,
          activeUser: data.user,
          activeTenant: data.tenant,
          isDemoMode: false
        });
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, tenant: null, token: null, isAuthenticated: false, activeUser: null, activeTenant: null, isDemoMode: false });
      },

      toggleDemoMode: () => {
        const { isDemoMode, user, tenant } = get();
        if (isDemoMode) {
          // Revert to original
          set({ isDemoMode: false, activeUser: user, activeTenant: tenant });
        } else {
          // Activate Demo: grant SuperAdmin role and all modules
          set({
            isDemoMode: true,
            activeUser: { ...user, id: 'demo-user', name: 'Demo Admin', email: 'demo@school.com', role: 'SuperAdmin' } as UserProfile,
            activeTenant: { 
              id: '00101', 
              name: 'Demo SaaS Tenant', 
              activeModules: ['dashboard', 'students', 'staff', 'academics', 'attendance', 'fee', 'exams', 'library', 'communication', 'analytics', 'whatsapp', 'settings'] 
            }
          });
        }
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);
