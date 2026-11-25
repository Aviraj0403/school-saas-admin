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

export interface AuthScope {
  studentIds: string[];
  classIds: string[];
}

/** What GET /auth/me returns beyond the user itself. */
export interface MeContext {
  tenant?: {
    id: string;
    name: string;
    subdomain?: string;
    projectCode?: string;
    prefix?: string;
    theme?: { logo?: string; primaryColor?: string; secondaryColor?: string } | null;
    plan?: string;
    isActive?: boolean;
    isSuspended?: boolean;
  } | null;
  subscription?: {
    status: string;
    planName?: string;
    planSlug?: string;
    trialEndsAt?: string | null;
    currentPeriodEnd?: string | null;
  } | null;
  modules?: Record<string, boolean>;
  activeModules?: string[];
  permissions?: string[];
  scope?: AuthScope;
  mustChangePassword?: boolean;
}

export interface UserProfile {
  mustChangePassword?: boolean;
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

  /** Effective modules / permissions / "my data" scope — from GET /auth/me. */
  modules: Record<string, boolean>;
  permissions: string[];
  scope: AuthScope;
  subscription: MeContext['subscription'];
  meLoaded: boolean;
  setContext: (me: MeContext) => void;

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

      modules: {},
      permissions: [],
      scope: { studentIds: [], classIds: [] },
      subscription: null,
      meLoaded: false,

      setContext: (me: MeContext) => {
        const { user } = get();
        const patch: Partial<AuthState> = {
          modules: me.modules ?? {},
          permissions: me.permissions ?? [],
          scope: me.scope ?? { studentIds: [], classIds: [] },
          subscription: me.subscription ?? null,
          meLoaded: true,
        };
        if (
          user &&
          me.mustChangePassword !== undefined &&
          user.mustChangePassword !== me.mustChangePassword
        ) {
          patch.user = { ...user, mustChangePassword: me.mustChangePassword };
        }
        const t = me.tenant;
        if (t) {
          const cfg: TenantConfig = {
            id: t.id,
            name: t.name,
            activeModules: me.activeModules ?? [],
            projectCode: t.projectCode,
            subdomain: t.subdomain,
            prefix: t.prefix,
            theme: t.theme ?? undefined,
          };
          patch.activeTenant = cfg;
          if (!user?.isSuperAdmin) patch.tenant = cfg;
        }
        set(patch);
      },

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
          modules: {},
          permissions: [],
          scope: { studentIds: [], classIds: [] },
          subscription: null,
          meLoaded: false,
        });
      },

      setTenant: (tenant: TenantConfig) => {
        set({ tenant, activeTenant: tenant });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          const refreshToken = localStorage.getItem('refresh_token');
          // Revoke the session server-side (best effort — the user is signed out locally
          // regardless). Plain fetch avoids importing the axios client into the store.
          if (refreshToken) {
            const base =
              process.env.NEXT_PUBLIC_API_URL || 'https://apischool.jdinfotechsolutions.in/api/v1';
            fetch(`${base}/auth/logout`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}`,
              },
              body: JSON.stringify({ refreshToken }),
              keepalive: true,
            }).catch(() => {});
          }
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          // QueryProvider listens for this and drops every cached response.
          window.dispatchEvent(new Event('auth:logout'));
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
          modules: {},
          permissions: [],
          scope: { studentIds: [], classIds: [] },
          subscription: null,
          meLoaded: false,
        });
      },

      toggleDemoMode: () => {
        const { isDemoMode, user, tenant } = get();
        // Demo mode impersonates a super admin in the UI; only real super admins may use it.
        if (!isDemoMode && !user?.isSuperAdmin) return;
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
