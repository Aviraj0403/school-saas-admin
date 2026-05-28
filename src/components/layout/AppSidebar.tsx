'use client';

import React, { useState } from 'react';
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
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  if (!activeUser || !activeTenant) return null;

  // Filter navigation based on user role and tenant active modules recursively
  const filterNavItem = (item: NavItem): NavItem | null => {
    // Check role restriction
    if (item.roles && !item.roles.includes(activeUser.role)) {
      return null;
    }
    // Check module restriction
    if (item.module && !activeTenant.activeModules.includes(item.module)) {
      return null;
    }

    // If has children, filter them recursively
    if (item.children && item.children.length > 0) {
      const filteredChildren = item.children
        .map(filterNavItem)
        .filter((child): child is NavItem => child !== null);
      
      // If all children were filtered out, hide this entire category
      if (filteredChildren.length === 0) {
        return null;
      }
      
      return {
        ...item,
        children: filteredChildren,
      };
    }

    return item;
  };

  const filteredNav = navigationConfig
    .map(filterNavItem)
    .filter((item): item is NavItem => item !== null);

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(path);
  };

  const isExpanded = (item: NavItem) => {
    return expandedItems.includes(item.path) || (item.children?.some((c) => isActive(c.path)) ?? false);
  };

  const renderNavItem = (item: NavItem, isChild = false) => {
    const active = isActive(item.path);
    const hasChildren = item.children && item.children.length > 0;
    const expanded = hasChildren && isExpanded(item);

    return (
      <li key={item.path} className={classNames('mb-0.5', { 'ml-3': isChild })}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpand(item.path)}
            className={classNames(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 text-left',
              {
                'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold': active,
                'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white': !active,
              }
            )}
          >
            <i className={classNames(item.icon, 'text-base w-5 text-center shrink-0')}></i>
            <span className="flex-1 text-sm">{item.label}</span>
            <i className={classNames('pi text-xs transition-transform duration-200', { 'pi-chevron-down': expanded, 'pi-chevron-right': !expanded })}></i>
          </button>
        ) : (
          <Link
            href={item.path}
            className={classNames(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 no-underline',
              {
                'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold': active,
                'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white': !active,
              }
            )}
          >
            <i className={classNames(item.icon, 'text-base w-5 text-center shrink-0')}></i>
            <span className="text-sm">{item.label}</span>
          </Link>
        )}

        {/* Children */}
        {hasChildren && expanded && (
          <ul className="mt-0.5 ml-2 border-l border-gray-200 dark:border-slate-700 pl-2">
            {item.children!.map((child) => renderNavItem(child, true))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div
      className={classNames(
        'fixed inset-y-0 left-0 z-10 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-transform duration-300 ease-in-out pt-16 flex flex-col',
        {
          'translate-x-0': isOpen,
          '-translate-x-full': !isOpen,
        }
      )}
    >
      {/* School branding strip */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <i className="pi pi-graduation-cap text-white text-sm"></i>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{activeTenant.name}</p>
            <p className="text-xs text-gray-400 truncate">{activeUser.role}</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {filteredNav.map((item) => renderNavItem(item))}
        </ul>
      </div>

      {/* Bottom: version */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800">
        <p className="text-xs text-gray-400 text-center">School SaaS v1.0 · Phase 1</p>
      </div>
    </div>
  );
}
