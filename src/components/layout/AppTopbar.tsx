'use client';

import { asList } from '@/lib/utils';
import React, { useRef, useState } from 'react';
import { useTenantsList } from '@/modules/superadmin/hooks/useTenants';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { formatRole, initials } from '@/lib/format';
import NavSearch from './NavSearch';
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

export default function AppTopbar({ onToggleMenu }: { onToggleMenu: () => void }) {
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
          activeModules: t.activeModules || [
            'students',
            'staff',
            'academics',
            'attendance',
            'fee',
            'exams',
            'library',
            'communication',
            'whatsapp',
            'hostel',
            'leave',
            'transport',
            'homework',
            'settings',
          ],
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
    'relative flex size-10 items-center justify-center rounded-full border border-border bg-card text-zinc-500 shadow-xs transition-all hover:-translate-y-px hover:text-zinc-900 hover:shadow-md dark:text-zinc-400 dark:hover:text-white';
  const menuPanel =
    'absolute top-full mt-3 rounded-2xl bg-popover border border-border shadow-pop z-50 p-2 animate-slide-up';
  const menuItem =
    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors no-underline';

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center gap-3 bg-background/70 px-4 backdrop-blur-xl sm:px-6 lg:pl-0 lg:pr-8">
      {/* Mobile: menu + logo */}
      <button aria-label="Open menu" onClick={onToggleMenu} className={`${iconBtn} lg:hidden`}>
        <Menu className="size-[18px]" />
      </button>
      <a href="/dashboard" className="flex items-center gap-2 no-underline lg:hidden">
        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
          <GraduationCap className="size-[18px] text-white" />
        </span>
        <span className="hidden font-display text-lg font-semibold text-zinc-900 dark:text-white sm:block">
          EduNexus
        </span>
      </a>

      {/* Search */}
      <div className="flex flex-1 items-center gap-3">
        <NavSearch />

        {activeUser && isSuper && (
          <div className="relative hidden md:block">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex h-11 items-center gap-2.5 rounded-2xl border border-border bg-card pl-1.5 pr-3 text-[13px] font-semibold text-zinc-800 shadow-xs transition-all hover:shadow-md dark:text-zinc-100"
            >
              <span className="flex size-8 items-center justify-center rounded-xl bg-brand-gradient text-[11px] font-bold text-white">
                {initials(activeTenant?.name)}
              </span>
              <span className="max-w-[160px] truncate">
                {activeTenant?.name || 'Select school'}
              </span>
              <ChevronsUpDown className="size-3.5 text-zinc-400" />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className={`${menuPanel} left-0 w-80`}>
                  <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Switch school
                  </p>
                  <div className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
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
                          className={`${menuItem} justify-between ${isActive ? 'bg-brand-muted' : ''}`}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[11px] font-bold text-zinc-600 dark:bg-white/10 dark:text-zinc-200">
                              {initials(school.name)}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate">{school.name}</span>
                              {school.plan && (
                                <span className="block text-[11px] font-normal capitalize text-zinc-500">
                                  {String(school.plan).toLowerCase()} plan
                                </span>
                              )}
                            </span>
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

      {/* Right: preferences + account */}
      <div className="flex shrink-0 items-center gap-2">
        {isDemoMode && (
          <span className="hidden rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-500/30 dark:text-amber-300 sm:inline-flex">
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
            <Palette className="size-[18px]" />
          </button>
          {themeDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setThemeDropdownOpen(false)} />
              <div className={`${menuPanel} right-0 w-60`}>
                <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Brand colour
                </p>
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
          {themeMode === 'dark' ? (
            <Sun className="size-[18px]" />
          ) : (
            <Moon className="size-[18px]" />
          )}
        </button>

        <button
          aria-label="Notifications"
          title="Notifications"
          className={`${iconBtn} hidden sm:flex`}
        >
          <Bell className="size-[18px]" />
        </button>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 rounded-full border border-border bg-card p-1 shadow-xs transition-all hover:shadow-md lg:pr-3"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
              {initials(activeUser?.name)}
            </span>
            <span className="hidden flex-col text-left leading-tight lg:flex">
              <span className="max-w-[130px] truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
                {activeUser?.name || 'Guest'}
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {formatRole(activeUser?.role)}
              </span>
            </span>
            <ChevronDown className="hidden size-3.5 text-zinc-400 lg:block" />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className={`${menuPanel} right-0 w-72`}>
                <div className="mb-1 flex items-center gap-3 rounded-xl bg-brand-soft p-3 dark:bg-white/5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                    {initials(activeUser?.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-white">
                      {activeUser?.name}
                    </span>
                    <span className="block truncate text-xs text-zinc-500">
                      {activeUser?.email || formatRole(activeUser?.role)}
                    </span>
                  </span>
                </div>
                <a href="/settings" className={menuItem}>
                  <Settings className="size-4 text-zinc-400" />
                  Settings
                </a>
                <a href="/academics/guide" className={menuItem}>
                  <LifeBuoy className="size-4 text-zinc-400" />
                  Help &amp; user guide
                </a>
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
                <div className="my-1.5 border-t border-border" />
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className={`${menuItem} text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10`}
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
