'use client';

import React, { useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';
import { Tag } from 'primereact/tag';

interface AppTopbarProps {
  onToggleMenu: () => void;
}

export default function AppTopbar({ onToggleMenu }: AppTopbarProps) {
  const { activeUser, activeTenant, isDemoMode, toggleDemoMode, logout } = useAuthStore();
  const userMenuRef = useRef<Menu>(null);

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
    <div className="fixed top-0 left-0 right-0 z-20 flex justify-between items-center px-4 sm:px-6 h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm">
      {/* Left: hamburger + brand */}
      <div className="flex items-center gap-3">
        <Button
          icon="pi pi-bars"
          rounded
          text
          aria-label="Toggle Menu"
          onClick={onToggleMenu}
          className="text-gray-600 dark:text-gray-300 w-9 h-9"
        />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <i className="pi pi-graduation-cap text-white text-xs"></i>
          </div>
          <span className="font-bold text-gray-800 dark:text-white hidden sm:block">
            {activeTenant?.name || 'School SaaS'}
          </span>
          {isDemoMode && (
            <Tag value="DEMO" severity="danger" className="text-xs" />
          )}
        </div>
      </div>

      {/* Right: actions + user */}
      <div className="flex items-center gap-2">
        <Button
          icon="pi pi-bell"
          rounded
          text
          aria-label="Notifications"
          className="text-gray-600 dark:text-gray-300 w-9 h-9 relative"
        />

        <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-slate-700 ml-1">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold text-gray-800 dark:text-white leading-tight">
              {activeUser?.name || 'Guest'}
            </span>
            <span className="text-xs text-gray-400 leading-tight">{activeUser?.role || 'No Role'}</span>
          </div>
          <Avatar
            icon="pi pi-user"
            shape="circle"
            className="bg-indigo-600 text-white cursor-pointer w-9 h-9"
            onClick={(e) => userMenuRef.current?.toggle(e)}
          />
          <Menu ref={userMenuRef} model={userMenuItems} popup />
        </div>
      </div>
    </div>
  );
}
