'use client';

import { asList } from '@/lib/utils';
import React, { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTenantsList } from '@/modules/superadmin/hooks/useTenants';
import ForcePasswordChange from './ForcePasswordChange';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { formatRole, initials } from '@/lib/format';
import NavSearch from './NavSearch';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Bell,
  Check,
  ChevronDown,
  ChevronsUpDown,
  Eye,
  EyeOff,
  GraduationCap,
  LifeBuoy,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Settings,
  Sun,
} from 'lucide-react';

interface SwitchableSchool {
  id: string;
  name: string;
  plan: string;
  activeModules: string[];
  projectCode?: string;
  subdomain?: string;
  prefix?: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
}

export interface ThemePreset {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  previewClass: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'Elite Indigo',
    primaryColor: '#312E81',
    secondaryColor: '#F59E0B',
    previewClass: 'bg-blue-900',
  },
  {
    name: 'Midnight Blue',
    primaryColor: '#0F172A',
    secondaryColor: '#10B981',
    previewClass: 'bg-zinc-900',
  },
  {
    name: 'Classic Blue',
    primaryColor: '#1a73e8',
    secondaryColor: '#e8f0fe',
    previewClass: 'bg-blue-600',
  },
  {
    name: 'Emerald Green',
    primaryColor: '#059669',
    secondaryColor: '#ecfdf5',
    previewClass: 'bg-emerald-600',
  },
  {
    name: 'Royal Purple',
    primaryColor: '#7c3aed',
    secondaryColor: '#f5f3ff',
    previewClass: 'bg-purple-600',
  },
  {
    name: 'Amber Gold',
    primaryColor: '#d97706',
    secondaryColor: '#fffbeb',
    previewClass: 'bg-amber-500',
  },
  {
    name: 'Crimson Red',
    primaryColor: '#e11d48',
    secondaryColor: '#fff1f2',
    previewClass: 'bg-rose-600',
  },
];

export default function AppTopbar({
  onToggleMenu,
  collapsed,
  onToggleCollapsed,
}: {
  onToggleMenu: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const { isAdmin } = usePermissions();
  const {
    activeUser,
    activeTenant,
    isDemoMode,
    toggleDemoMode,
    logout,
    switchTenant,
    isMirroring,
    mirrorUser,
    exitMirroring,
  } = useAuthStore();
  const queryClient = useQueryClient();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('theme-mode') as 'light' | 'dark';
      if (savedMode === 'light' || savedMode === 'dark') {
        setThemeMode(savedMode);
      } else {
        setThemeMode('light');
        localStorage.setItem('theme-mode', 'light');
      }
    }
  }, []);

  const toggleThemeMode = () => {
    const newMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
    localStorage.setItem('theme-mode', newMode);

    // Dispatch event so ThemeProvider updates immediately
    window.dispatchEvent(new CustomEvent('theme-changed'));

    window.dispatchEvent(
      new CustomEvent('show-toast', {
        detail: {
          severity: 'success',
          summary: `${newMode === 'dark' ? 'Dark' : 'Light'} Mode Enabled`,
          detail: `Switched dashboard style to ${newMode} theme.`,
          life: 2000,
        },
      })
    );
  };

  const handleThemeSwitch = (theme: ThemePreset) => {
    localStorage.setItem(
      'selected-theme',
      JSON.stringify({ primaryColor: theme.primaryColor, secondaryColor: theme.secondaryColor })
    );
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: theme }));
    setThemeDropdownOpen(false);

    window.dispatchEvent(
      new CustomEvent('show-toast', {
        detail: {
          severity: 'success',
          summary: 'Color Palette Updated',
          detail: `Switched overall brand styling to ${theme.name}!`,
          life: 3000,
        },
      })
    );
  };

  // Fetch the list of schools dynamically from the database!
  // Based on the real signed-in account, not the previewed/mirrored one
  const isSuper = !!useAuthStore((st) => st.user?.isSuperAdmin);
  const { data: dbTenantsData } = useTenantsList(1, 50);

  const dbTenants = asList(dbTenantsData);
  const schools: SwitchableSchool[] =
    dbTenants.length > 0
      ? dbTenants.map((t: any) => ({
          id: t.id,
          name: t.name,
          plan: t.plan,
          activeModules: t.activeModules || [],
          theme: t.theme || { primaryColor: '#1a73e8', secondaryColor: '#e8f0fe' },
          projectCode: t.projectCode,
          subdomain: t.subdomain,
          prefix: t.prefix,
        }))
      : [];

  const handleTenantSwitch = (school: SwitchableSchool) => {
    switchTenant({
      id: school.id,
      name: school.name,
      activeModules: school.activeModules,
      theme: school.theme,
      projectCode: school.projectCode,
      subdomain: school.subdomain,
      prefix: school.prefix,
    });
    setDropdownOpen(false);
    // Drop every cached response from the previous school so nothing leaks across tenants;
    // /auth/me is keyed by tenant id and refetches for the newly active school.
    queryClient.clear();
    queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });

    // Fire the custom theme-matched toast notification!
    const planColors: Record<string, string> = {
      PREMIUM: 'Amber Premium',
      ENTERPRISE: 'Fuchsia Enterprise',
      STANDARD: 'Indigo Standard',
    };

    window.dispatchEvent(
      new CustomEvent('show-toast', {
        detail: {
          severity: 'success',
          summary: 'Workspace Context Switched',
          detail: `Successfully connected to ${school.name} [${planColors[school.plan] || 'Basic'} Plan]`,
          life: 4000,
        },
      })
    );

    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 400);
  };

  const iconBtn =
    'relative flex size-10 sm:size-9 shrink-0 items-center justify-center rounded-xl bg-card text-zinc-500 shadow-sm ring-1 ring-inset ring-border transition-colors hover:bg-muted hover:text-foreground dark:text-zinc-400';
  const menuPanel =
    'absolute top-full mt-2 rounded-xl bg-popover border border-border shadow-pop z-50 p-1.5 animate-fade-in';
  const menuItem =
    'w-full flex items-center gap-3 px-3 h-10 rounded-lg text-left text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-muted transition-colors no-underline';

  return (
    <>
      <ForcePasswordChange />
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b border-border bg-sidebar px-4 backdrop-blur lg:px-6">
        <div className="flex w-full items-center justify-between gap-3">
          {/* LEFT: menu / rail toggle + search */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              aria-label="Open menu"
              onClick={onToggleMenu}
              className={`${iconBtn} lg:hidden`}
            >
              <Menu className="size-4" />
            </button>
            {onToggleCollapsed && (
              <button
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                onClick={onToggleCollapsed}
                className={`${iconBtn} hidden lg:flex`}
              >
                {collapsed ? (
                  <PanelLeftOpen className="size-4" />
                ) : (
                  <PanelLeftClose className="size-4" />
                )}
              </button>
            )}
            <NavSearch />

            {activeUser && isSuper && (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="tone-violet tone-chip flex h-9 items-center gap-2 rounded-xl px-3 text-[13px] font-medium"
                >
                  <span className="max-w-[160px] truncate">
                    {activeTenant?.name || 'Select school'}
                  </span>
                  <ChevronsUpDown className="size-3.5 opacity-70" />
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <div className={`${menuPanel} left-0 w-72`}>
                      <p className="text-eyebrow border-b border-border px-3 pb-2 pt-1">
                        Switch school
                      </p>
                      <div className="flex max-h-80 flex-col gap-0.5 overflow-y-auto pt-1">
                        {schools.length === 0 && (
                          <p className="px-3 py-6 text-center text-[13px] text-zinc-500">
                            No schools yet.
                          </p>
                        )}
                        {schools.map((school) => {
                          const isActive = activeTenant?.id === school.id;
                          return (
                            <button
                              key={school.id}
                              onClick={() => handleTenantSwitch(school)}
                              className={`${menuItem} h-auto min-h-10 justify-between py-2 ${isActive ? 'bg-brand-muted' : ''}`}
                            >
                              <span className="min-w-0">
                                <span className="block truncate">{school.name}</span>
                                {school.plan && (
                                  <span className="block text-[11px] font-normal capitalize text-zinc-500">
                                    {String(school.plan).toLowerCase()} plan
                                  </span>
                                )}
                              </span>
                              {isActive && <Check className="size-4 shrink-0 text-brand" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: preferences + account */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {isDemoMode && (
              <span className="tone-amber tone-chip hidden rounded-full px-3 py-1 text-[11px] font-semibold sm:inline-flex">
                Demo mode
              </span>
            )}

            <div className="relative hidden sm:block">
              <button
                aria-label="Brand colour"
                title="Brand colour"
                onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                className={iconBtn}
              >
                <Palette className="size-4" />
              </button>
              {themeDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setThemeDropdownOpen(false)} />
                  <div className={`${menuPanel} right-0 w-60`}>
                    <p className="text-eyebrow px-3 pb-2 pt-1">Brand colour</p>
                    <div className="grid grid-cols-4 gap-2 px-2 pb-2">
                      {THEME_PRESETS.map((t) => (
                        <button
                          key={t.name}
                          title={t.name}
                          aria-label={t.name}
                          onClick={() => handleThemeSwitch(t)}
                          className="aspect-square rounded-xl shadow-sm ring-2 ring-transparent transition-transform hover:scale-110 hover:ring-zinc-300 dark:hover:ring-white/30"
                          style={{ backgroundColor: t.primaryColor }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              aria-label={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={themeMode === 'dark' ? 'Light mode' : 'Dark mode'}
              onClick={toggleThemeMode}
              className={iconBtn}
            >
              {themeMode === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className="flex h-10 sm:h-9 items-center gap-2 rounded-xl bg-card pl-1 pr-2 text-[13px] font-medium text-foreground shadow-sm ring-1 ring-inset ring-border transition-colors hover:bg-muted max-sm:w-10 max-sm:justify-center max-sm:px-0"
              >
                <span className="flex size-7 items-center justify-center rounded-lg bg-brand-gradient text-xs font-semibold text-white">
                  {initials(activeUser?.name)}
                </span>
                <span className="hidden max-w-[8rem] truncate md:inline">
                  {activeUser?.name || 'Guest'}
                </span>
                <ChevronDown className="hidden size-3.5 text-zinc-400 sm:block" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div role="menu" className={`${menuPanel} right-0 w-64`}>
                    <div className="px-3 py-2">
                      <div className="truncate text-sm font-medium text-foreground">
                        {activeUser?.name}
                      </div>
                      <div className="text-caption mt-0.5 truncate">
                        {activeUser?.email || formatRole(activeUser?.role)}
                      </div>
                    </div>
                    <div className="my-1 h-px bg-border" />
                    {/* Only links this role can actually open */}
                    {isAdmin && (
                      <>
                        <a href="/settings" className={menuItem}>
                          <Settings className="size-4 text-zinc-400" />
                          Settings
                        </a>
                        <a href="/academics/guide" className={menuItem}>
                          <LifeBuoy className="size-4 text-zinc-400" />
                          Help &amp; user guide
                        </a>
                      </>
                    )}
                    {isSuper && (
                      <button
                        onClick={() => {
                          toggleDemoMode();
                          setUserMenuOpen(false);
                        }}
                        className={menuItem}
                      >
                        <Eye className="size-4 text-zinc-400" />
                        {isDemoMode ? 'Exit demo mode' : 'Enter demo mode'}
                      </button>
                    )}
                    {isMirroring && (
                      <button
                        onClick={() => {
                          exitMirroring();
                          window.location.href = '/dashboard';
                        }}
                        className={menuItem}
                      >
                        <EyeOff className="size-4 text-zinc-400" />
                        Exit preview
                      </button>
                    )}
                    <div className="my-1 h-px bg-border" />
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className={`${menuItem} text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10`}
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
