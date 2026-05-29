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
      <li key={item.path} className={classNames('mb-0.5', { 'ml-2': isChild })}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpand(item.path)}
            className={classNames(
              'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all duration-150 text-left',
              {
                'bg-primary/10 text-primary dark:text-primary font-bold': active,
                'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white': !active,
              }
            )}
          >
            <i className={classNames(item.icon, 'text-sm w-4 text-center shrink-0 opacity-80')}></i>
            <span className="flex-1 text-[13px] tracking-wide">{item.label}</span>
            <i className={classNames('pi text-[9px] transition-transform duration-200 opacity-60', { 'pi-chevron-down': expanded, 'pi-chevron-right': !expanded })}></i>
          </button>
        ) : (
          <Link
            href={item.path}
            className={classNames(
              'flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all duration-150 no-underline',
              {
                'bg-primary/10 text-primary dark:text-primary font-bold': active,
                'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white': !active,
              }
            )}
          >
            <i className={classNames(item.icon, 'text-sm w-4 text-center shrink-0 opacity-80')}></i>
            <span className="text-[13px] tracking-wide">{item.label}</span>
          </Link>
        )}

        {/* Children */}
        {hasChildren && expanded && (
          <ul className="mt-0.5 space-y-0.5">
            {item.children!.map((child) => renderNavItem(child, true))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div
      className={classNames(
        'fixed top-16 bottom-0 left-0 z-10 w-[240px] bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-900 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0',
        {
          '-translate-x-full': !isOpen,
        }
      )}
    >
      {/* School branding strip */}
      <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-900">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: 'var(--primary-color)' }}>
            <i className="pi pi-graduation-cap text-white text-xs"></i>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate leading-normal">{activeTenant.name}</p>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 truncate leading-none mt-0.5 uppercase tracking-wider">{activeUser.role}</p>
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
