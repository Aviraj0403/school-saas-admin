'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { navigationConfig, NavItem } from '@/config/navigation';
import { classNames } from 'primereact/utils';

interface AppSidebarProps {
  isOpen: boolean;
}

export default function AppSidebar({ isOpen }: AppSidebarProps) {
  const pathname = usePathname();
  const { activeUser, activeTenant } = useAuthStore();

  if (!activeUser || !activeTenant) return null;

  // Filter navigation based on user role and tenant active modules
  const filteredNav = navigationConfig.filter((item) => {
    // Check if module is active for tenant
    if (item.module && !activeTenant.activeModules.includes(item.module)) {
      return false;
    }
    // Check if user role is permitted
    if (item.roles && !item.roles.includes(activeUser.role)) {
      return false;
    }
    return true;
  });

  const renderNavItem = (item: NavItem, isChild = false) => {
    const isActive = pathname.startsWith(item.path);
    
    return (
      <li key={item.path} className={classNames('mb-1', { 'ml-4': isChild })}>
        <Link 
          href={item.path}
          className={classNames(
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200',
            {
              'bg-primary/10 text-primary font-semibold': isActive,
              'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white': !isActive
            }
          )}
        >
          <i className={classNames(item.icon, 'text-lg')}></i>
          <span>{item.label}</span>
        </Link>
        {item.children && isActive && (
          <ul className="mt-1">
            {item.children.map(child => renderNavItem(child, true))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div 
      className={classNames(
        'fixed inset-y-0 left-0 z-10 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-transform duration-300 ease-in-out pt-16 h-full flex flex-col',
        {
          'translate-x-0': isOpen,
          '-translate-x-full': !isOpen
        }
      )}
    >
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {filteredNav.map(item => renderNavItem(item))}
        </ul>
      </div>
    </div>
  );
}
