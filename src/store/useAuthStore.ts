import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LoginResponse } from '@/services/auth.service';

export type Role =
  | 'SuperAdmin'
  | 'Principal'
  | 'Teacher'
  | 'Accountant'
  | 'Librarian'
  | 'Student'
  | 'Parent'
  | 'school_admin'
  | string;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string | null;
  isSuperAdmin: boolean;
  roles: Array<{ id: string; slug: string; name: string }>;
}

export interface TenantConfig {
  id: string;
  name: string;
  activeModules: string[];
  projectCode?: string;
  subdomain?: string;
  prefix?: string;
  theme?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

interface AuthState {
  user: UserProfile | null;
  tenant: TenantConfig | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;

  activeUser: UserProfile | null;
  activeTenant: TenantConfig | null;

  isMirroring: boolean;
  originalUser: UserProfile | null;

  setAuthData: (data: LoginResponse, tenantData?: TenantConfig) => void;
  setTenant: (tenant: TenantConfig) => void;
  logout: () => void;
  toggleDemoMode: () => void;
  switchTenant: (tenant: TenantConfig | null) => void;

  mirrorUser: (target: { name: string; role: Role; email?: string; id?: string }) => void;
  exitMirroring: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isDemoMode: false,
      activeUser: null,
      activeTenant: null,

      isMirroring: false,
      originalUser: null,

      setAuthData: (data: LoginResponse, tenantData?: TenantConfig) => {
        const primaryRole: Role = data.user.isSuperAdmin
          ? 'SuperAdmin'
          : (data.user.roles[0]?.slug as Role) || 'Teacher';

        const userProfile: UserProfile = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: primaryRole,
          tenantId: data.user.tenantId,
          isSuperAdmin: data.user.isSuperAdmin,
          roles: data.user.roles,
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem('refresh_token', data.refreshToken);
          }
        }

        set({
          user: userProfile,
          tenant: tenantData ?? null,
          token: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
          activeUser: userProfile,
          activeTenant: tenantData ?? null,
          isDemoMode: false,
          isMirroring: false,
          originalUser: null,
        });
      },

      setTenant: (tenant: TenantConfig) => {
        set({ tenant, activeTenant: tenant });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
        }
        set({
          user: null,
          tenant: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          activeUser: null,
          activeTenant: null,
          isDemoMode: false,
          isMirroring: false,
          originalUser: null,
        });
      },

      toggleDemoMode: () => {
        const { isDemoMode, user, tenant } = get();
        if (isDemoMode) {
          set({ isDemoMode: false, activeUser: user, activeTenant: tenant, isMirroring: false });
        } else {
          set({
            isDemoMode: true,
            isMirroring: false,
            activeUser: {
              id: 'demo-user',
              name: 'Demo Admin',
              email: 'demo@school.com',
              role: 'SuperAdmin',
              tenantId: '00101',
              isSuperAdmin: true,
              roles: [{ id: 'demo', slug: 'school_admin', name: 'School Admin' }],
            },
            activeTenant: {
              id: '00101',
              name: 'Demo SaaS Tenant',
              activeModules: [
                'students',
                'staff',
                'academics',
                'attendance',
                'fee',
                'exams',
                'library',
                'communication',
                'analytics',
                'whatsapp',
                'hostel',
                'leave',
                'transport',
                'homework',
                'website',
                'settings',
              ],
            },
          });
        }
      },

      switchTenant: (tenant: TenantConfig | null) => {
        set({ activeTenant: tenant });
      },

      mirrorUser: (target) => {
        const { activeUser, originalUser, isMirroring } = get();
        const baseUser = originalUser || activeUser;

        const mirroredProfile: UserProfile = {
          id: target.id || `mirrored-${target.role.toLowerCase()}`,
          name: target.name,
          email: target.email || `mirrored.${target.role.toLowerCase()}@school.com`,
          role: target.role,
          tenantId: baseUser?.tenantId || null,
          isSuperAdmin: false,
          roles: [{ id: 'mirrored', slug: target.role.toLowerCase(), name: target.role }],
        };

        set({
          isMirroring: true,
          originalUser: baseUser,
          activeUser: mirroredProfile,
        });
      },

      exitMirroring: () => {
        const { originalUser, user } = get();
        const restoreUser = originalUser || user;
        set({
          isMirroring: false,
          activeUser: restoreUser,
          originalUser: null,
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
