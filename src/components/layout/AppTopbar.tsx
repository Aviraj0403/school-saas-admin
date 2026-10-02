'use client';

import React, { useRef, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';
import { Tag } from 'primereact/tag';
import { useTenantsList } from '@/modules/superadmin/hooks/useTenants';

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
  const userMenuRef = useRef<Menu>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
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
  const isSuper = activeUser?.role === 'SuperAdmin' || activeUser?.isSuperAdmin;
  const { data: dbTenantsData } = useTenantsList(1, 50);

  // Parse server schools or fall back to preset offline demo schools
  const offlineSchools: SwitchableSchool[] = [
    {
      id: '00101',
      name: 'Delhi Public School',
      plan: 'PREMIUM',
      activeModules: [
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
      theme: { primaryColor: '#1a73e8', secondaryColor: '#e8f0fe' },
    },
    {
      id: '00102',
      name: 'Oakridge International',
      plan: 'ENTERPRISE',
      activeModules: [
        'students',
        'staff',
        'academics',
        'attendance',
        'fee',
        'exams',
        'library',
        'communication',
        'hostel',
        'transport',
        'homework',
        'settings',
      ],
      theme: { primaryColor: '#f59e0b', secondaryColor: '#fef3c7' },
    },
    {
      id: '00103',
      name: 'St. Xavier Academy',
      plan: 'STANDARD',
      activeModules: [
        'students',
        'staff',
        'academics',
        'attendance',
        'exams',
        'library',
        'homework',
        'settings',
      ],
      theme: { primaryColor: '#8b5cf6', secondaryColor: '#f3e8ff' },
    },
  ];

  const dbTenants = dbTenantsData?.data?.items || [];
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
      : offlineSchools;

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

  const handleMirror = (role: string, name: string) => {
    mirrorUser({ role, name });
    window.dispatchEvent(
      new CustomEvent('show-toast', {
        detail: {
          severity: 'warn',
          summary: 'Mirror Mode Activated',
          detail: `Now mirroring ${name} (${role}) view!`,
          life: 3500,
        },
      })
    );
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 300);
  };

  const userMenuItems = [
    {
      label: activeUser?.name || 'User',
      items: [
        {
          label: isDemoMode ? 'Exit Demo Mode' : 'Enter Demo Mode',
          icon: isDemoMode ? 'pi pi-eye-slash' : 'pi pi-eye',
          command: toggleDemoMode,
        },
        ...(isMirroring
          ? [
              {
                label: 'Exit Mirror Mode',
                icon: 'pi pi-times-circle',
                command: () => {
                  exitMirroring();
                  window.location.href = '/dashboard';
                },
              },
            ]
          : []),
        {
          label: 'Settings',
          icon: 'pi pi-cog',
          command: () => {
            window.location.href = '/settings';
          },
        },
      ],
    },
    {
      label: 'Mirror Persona View 👁️',
      items: [
        {
          label: 'Mirror Teacher',
          icon: 'pi pi-user',
          command: () => handleMirror('Teacher', 'Faculty Member'),
        },
        {
          label: 'Mirror Accountant',
          icon: 'pi pi-wallet',
          command: () => handleMirror('Accountant', 'Finance Officer'),
        },
        {
          label: 'Mirror Librarian',
          icon: 'pi pi-book',
          command: () => handleMirror('Librarian', 'Library Admin'),
        },
        {
          label: 'Mirror Student',
          icon: 'pi pi-graduation-cap',
          command: () => handleMirror('Student', 'Student Pupil'),
        },
        {
          label: 'Mirror Parent',
          icon: 'pi pi-users',
          command: () => handleMirror('Parent', 'Guardian Profile'),
        },
        {
          label: 'Mirror School Admin',
          icon: 'pi pi-shield',
          command: () => handleMirror('school_admin', 'School Administrator'),
        },
      ],
    },
    {
      label: 'Account',
      items: [
        {
          label: 'Sign Out',
          icon: 'pi pi-sign-out',
          command: logout,
        },
      ],
    },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 sm:px-6 h-[70px] bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
      {/* Left: hamburger + brand + switcher */}
      <div className="flex items-center gap-4">
        <button
          aria-label="Toggle Menu"
          onClick={onToggleMenu}
          className="text-zinc-600 dark:text-zinc-400 w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <i className="pi pi-bars text-lg"></i>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-md bg-gradient-to-r from-blue-500 to-blue-500 opacity-60 blur-sm group-hover:opacity-100 transition duration-300"></div>
            <div
              className="relative w-8 h-8 rounded-md flex items-center justify-center shadow-inner border border-white/20"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              <i className="pi pi-graduation-cap text-white text-[14px] drop-shadow-md"></i>
            </div>
          </div>
          <span className="font-bold tracking-tight text-zinc-800 dark:text-white hidden sm:block bg-clip-text">
            School SaaS
          </span>
        </div>

        {/* Premium Workspace Selector Dropdown */}
        {activeUser && (
          <div className="relative ml-2">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 transition-all"
            >
              <i
                className="pi pi-briefcase text-[10px]"
                style={{ color: 'var(--primary-color)' }}
              ></i>
              <span className="max-w-[140px] truncate">
                {activeTenant?.name || 'Select School'}
              </span>
              <i className="pi pi-chevron-down text-[9px] text-zinc-400"></i>
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                <div className="absolute left-0 mt-2 w-64 rounded-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-700/60 shadow-xl z-40 p-2 animate-fade-in shadow-blue-500/5">
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/80">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450 dark:text-zinc-500">
                      Switch Workspace
                    </p>
                  </div>
                  <div className="mt-1.5 flex flex-col gap-1">
                    {schools.map((school) => {
                      const isActive = activeTenant?.id === school.id;
                      return (
                        <button
                          key={school.id}
                          onClick={() => handleTenantSwitch(school)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-md text-left transition-all ${
                            isActive
                              ? 'bg-blue-500/10 text-blue-650 dark:text-blue-400 font-bold'
                              : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-600 dark:text-zinc-350'
                          }`}
                          style={
                            isActive
                              ? {
                                  backgroundColor:
                                    'color-mix(in srgb, var(--primary-color), transparent 90%)',
                                  color: 'var(--primary-color)',
                                }
                              : {}
                          }
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold">{school.name}</span>
                            <span className="text-[9px] opacity-60 uppercase tracking-wider">
                              {school.plan} Plan
                            </span>
                          </div>
                          {isActive && (
                            <i
                              className="pi pi-check text-xs"
                              style={{ color: 'var(--primary-color)' }}
                            ></i>
                          )}
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

      {/* Right: actions + user */}
      <div className="flex items-center gap-2">
        {isDemoMode && (
          <Tag
            value="DEMO MODE"
            severity="danger"
            className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider"
          />
        )}

        <div className="relative">
          <button
            aria-label="Theme Customizer"
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            className="text-zinc-600 dark:text-zinc-400 w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <i className="pi pi-palette text-[17px]"></i>
          </button>
          {themeDropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setThemeDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 rounded-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-700/60 shadow-xl z-40 p-2 animate-fade-in shadow-blue-500/5">
                <div className="px-2.5 py-1.5 border-b border-zinc-100 dark:border-zinc-800/80">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450 dark:text-zinc-500">
                    Brand Color Theme
                  </p>
                </div>
                <div className="mt-1.5 flex flex-col gap-1">
                  {THEME_PRESETS.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => handleThemeSwitch(t)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-md text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all text-xs font-semibold text-zinc-700 dark:text-zinc-350"
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full ${t.previewClass} border border-white/20`}
                      />
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Theme Mode Toggle (Sun/Moon) */}
        <button
          aria-label="Toggle Theme Mode"
          onClick={toggleThemeMode}
          className="text-zinc-600 dark:text-zinc-400 w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <i
            className={themeMode === 'dark' ? 'pi pi-sun text-[17px]' : 'pi pi-moon text-[17px]'}
          ></i>
        </button>

        <button
          aria-label="Notifications"
          className="relative text-zinc-600 dark:text-zinc-400 w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <i className="pi pi-bell text-[17px]"></i>
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-zinc-200 dark:border-zinc-700 ml-1">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100 leading-tight">
              {activeUser?.name || 'Guest'}
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight capitalize mt-0.5">
              {activeUser?.role || 'No Role'}
            </span>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ml-1 overflow-hidden shadow-sm"
            style={{ backgroundColor: 'var(--primary-color)' }}
            onClick={(e) => userMenuRef.current?.toggle(e)}
          >
            <i className="pi pi-user text-white text-sm"></i>
          </div>
          <Menu
            ref={userMenuRef}
            model={userMenuItems}
            popup
            className="rounded-md shadow-lg dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
