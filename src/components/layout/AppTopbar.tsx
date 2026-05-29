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
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
}

export default function AppTopbar({ onToggleMenu }: { onToggleMenu: () => void }) {
  const { activeUser, activeTenant, isDemoMode, toggleDemoMode, logout, switchTenant } = useAuthStore();
  const userMenuRef = useRef<Menu>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch the list of schools dynamically from the database!
  const isSuper = activeUser?.role === 'SuperAdmin';
  const { data: dbTenantsData } = useTenantsList(1, 50);

  // Parse server schools or fall back to preset offline demo schools
  const offlineSchools: SwitchableSchool[] = [
    { id: '00101', name: 'Delhi Public School', plan: 'PREMIUM', activeModules: ['students', 'staff', 'academics', 'attendance', 'fee', 'exams', 'library', 'communication', 'whatsapp', 'hostel', 'leave', 'transport', 'homework', 'settings'], theme: { primaryColor: '#1a73e8', secondaryColor: '#e8f0fe' } },
    { id: '00102', name: 'Oakridge International', plan: 'ENTERPRISE', activeModules: ['students', 'staff', 'academics', 'attendance', 'fee', 'exams', 'library', 'communication', 'hostel', 'transport', 'homework', 'settings'], theme: { primaryColor: '#f59e0b', secondaryColor: '#fef3c7' } },
    { id: '00103', name: 'St. Xavier Academy', plan: 'STANDARD', activeModules: ['students', 'staff', 'academics', 'attendance', 'exams', 'library', 'homework', 'settings'], theme: { primaryColor: '#8b5cf6', secondaryColor: '#f3e8ff' } },
  ];

  const dbTenants = dbTenantsData?.data?.items || [];
  const schools: SwitchableSchool[] = dbTenants.length > 0
    ? dbTenants.map((t: any) => ({
        id: t.id,
        name: t.name,
        plan: t.plan,
        activeModules: t.activeModules || ['students', 'staff', 'academics', 'attendance', 'fee', 'exams', 'library', 'communication', 'whatsapp', 'hostel', 'leave', 'transport', 'homework', 'settings'],
        theme: t.theme || { primaryColor: '#1a73e8', secondaryColor: '#e8f0fe' },
        projectCode: t.projectCode,
        subdomain: t.subdomain,
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
    });
    setDropdownOpen(false);

    // Fire the custom theme-matched toast notification!
    const planColors: Record<string, string> = {
      PREMIUM: 'Amber Premium',
      ENTERPRISE: 'Fuchsia Enterprise',
      STANDARD: 'Indigo Standard'
    };

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: {
        severity: 'success',
        summary: 'Workspace Context Switched',
        detail: `Successfully connected to ${school.name} [${planColors[school.plan] || 'Basic'} Plan]`,
        life: 4000
      }
    }));

    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 400);
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
        {
          label: 'Settings',
          icon: 'pi pi-cog',
          command: () => { window.location.href = '/settings'; },
        },
        { separator: true },
        {
          label: 'Sign Out',
          icon: 'pi pi-sign-out',
          command: logout,
        },
      ],
    },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-20 flex justify-between items-center px-4 sm:px-6 h-16 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 shadow-sm">
      {/* Left: hamburger + brand + switcher */}
      <div className="flex items-center gap-3">
        <Button
          icon="pi pi-bars"
          rounded
          text
          aria-label="Toggle Menu"
          onClick={onToggleMenu}
          className="text-slate-600 dark:text-slate-400 w-9 h-9"
        />
        
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-indigo-650 rounded-lg flex items-center justify-center shadow-sm">
            <i className="pi pi-graduation-cap text-white text-xs"></i>
          </div>
          <span className="font-bold text-slate-800 dark:text-white hidden sm:block">
            School SaaS
          </span>
        </div>

        {/* Premium Workspace Selector Dropdown */}
        {activeUser && (
          <div className="relative ml-2">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all"
            >
              <i className="pi pi-briefcase text-[10px] text-indigo-500"></i>
              <span className="max-w-[140px] truncate">{activeTenant?.name || 'Select School'}</span>
              <i className="pi pi-chevron-down text-[9px] opacity-60"></i>
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800 shadow-xl z-40 p-2 animate-fade-in">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 dark:text-slate-500">Switch Workspace</p>
                  </div>
                  <div className="mt-1.5 flex flex-col gap-1">
                    {schools.map((school) => {
                      const isActive = activeTenant?.id === school.id;
                      return (
                        <button
                          key={school.id}
                          onClick={() => handleTenantSwitch(school)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                            isActive
                              ? 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 font-bold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-350'
                          }`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold">{school.name}</span>
                            <span className="text-[9px] opacity-60 uppercase tracking-wider">{school.plan} Plan</span>
                          </div>
                          {isActive && <i className="pi pi-check text-xs text-indigo-500"></i>}
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
          <Tag value="DEMO MODE" severity="danger" className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider" />
        )}

        <Button
          icon="pi pi-bell"
          rounded
          text
          aria-label="Notifications"
          className="text-slate-650 dark:text-slate-400 w-9 h-9 relative"
        />

        <div className="flex items-center gap-2 pl-2 border-l border-slate-100 dark:border-slate-900 ml-1">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-850 dark:text-white leading-tight">
              {activeUser?.name || 'Guest'}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight uppercase font-semibold mt-0.5">{activeUser?.role || 'No Role'}</span>
          </div>
          <Avatar
            icon="pi pi-user"
            shape="circle"
            className="bg-indigo-500 text-white cursor-pointer w-8 h-8 shadow-sm"
            onClick={(e) => userMenuRef.current?.toggle(e)}
          />
          <Menu ref={userMenuRef} model={userMenuItems} popup className="rounded-2xl shadow-xl dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800" />
        </div>
      </div>
    </div>
  );
}
