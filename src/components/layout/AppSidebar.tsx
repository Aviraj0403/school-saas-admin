'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { navigationConfig, NavItem } from '@/config/navigation';
import { classNames } from 'primereact/utils';

interface AppSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  size?: 'default' | 'collapsed';
  onToggleSize?: () => void;
}

export default function AppSidebar({ isOpen, onClose, size = 'default', onToggleSize }: AppSidebarProps) {
  const pathname = usePathname();
  const { activeUser, activeTenant } = useAuthStore();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const isCollapsed = size === 'collapsed';

  if (!activeUser || !activeTenant) return null;

  // Filter navigation based on user role and tenant active modules recursively
  const filterNavItem = (item: NavItem): NavItem | null => {
    // Check role restriction
    if (item.roles && !item.roles.includes(activeUser.role)) {
      return null;
    }
    // Check module restriction
    if (item.module) {
      const normalizedModule = item.module.endsWith('s') ? item.module : `${item.module}s`;
      const singularModule = item.module.endsWith('s') ? item.module.slice(0, -1) : item.module;
      
      const hasAccess = activeTenant.activeModules.includes(item.module) || 
                        activeTenant.activeModules.includes(normalizedModule) ||
                        activeTenant.activeModules.includes(singularModule);
                        
      if (!hasAccess) {
        return null;
      }
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
            onClick={() => {
              if (size === 'collapsed' && onToggleSize) {
                onToggleSize();
              }
              toggleExpand(item.path);
            }}
            className={classNames(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-200 text-left relative group',
              {
                'justify-center md:justify-center px-0': isCollapsed,
                'bg-blue-500/10 text-blue-600 dark:bg-zinc-800 dark:text-zinc-50 font-semibold': active,
                'text-zinc-600 dark:text-zinc-400 hover:text-blue-600 hover:bg-blue-500/10 dark:hover:text-zinc-300 dark:hover:bg-zinc-800': !active,
              }
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <i className={classNames(item.icon, 'text-[18px] w-5 text-center shrink-0')}></i>
            {!isCollapsed && (
              <>
                <span className="flex-1 text-[14px] truncate">{item.label}</span>
                <i className={classNames('pi text-[9px] transition-transform duration-200 opacity-60', { 'pi-chevron-down': expanded, 'pi-chevron-right': !expanded })}></i>
              </>
            )}
          </button>
        ) : (
          <Link
            href={item.path}
            onClick={() => {
              if (window.innerWidth < 768) {
                onClose?.();
              }
            }}
            className={classNames(
              'flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-200 no-underline',
              {
                'justify-center md:justify-center px-0': isCollapsed,
                'bg-blue-500/10 text-blue-600 dark:bg-zinc-800 dark:text-zinc-50 font-semibold': active,
                'text-zinc-600 dark:text-zinc-400 hover:text-blue-600 hover:bg-blue-500/10 dark:hover:text-zinc-300 dark:hover:bg-zinc-800': !active,
              }
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <i className={classNames(item.icon, 'text-[18px] w-5 text-center shrink-0')}></i>
            {!isCollapsed && (
              <span className="text-[14px] truncate">{item.label}</span>
            )}
          </Link>
        )}

        {/* Children */}
        {hasChildren && expanded && !isCollapsed && (
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
        'fixed top-[70px] bottom-0 left-0 z-40 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-all duration-300 ease-in-out',
        {
          'w-[260px]': size === 'default',
          'w-[260px] md:w-[70px]': size === 'collapsed',
          'translate-x-0': isOpen,
          '-translate-x-full': !isOpen,
        }
      )}
    >
      {/* School branding strip / Hover Toggle */}
      <div className="relative px-4 py-4 md:py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-2 overflow-hidden">
          <div className="w-10 h-10 md:w-8 md:h-8 rounded-md flex items-center justify-center shrink-0 shadow-sm border border-black/5 dark:border-white/10" style={{ backgroundColor: 'var(--primary-color)' }}>
            <i className="pi pi-graduation-cap text-white text-[16px] md:text-[13px] drop-shadow-sm"></i>
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-zinc-800 dark:text-zinc-200 truncate leading-normal">
                {activeTenant.name} {activeTenant.prefix ? `[${activeTenant.prefix}]` : ''}
              </p>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate leading-none mt-1 md:mt-0.5 uppercase tracking-wider">{activeUser.role}</p>
            </div>
          )}
        </div>
        
        {/* Toggle Collapse Button (Desktop Only) */}
        {onToggleSize && (
          <button 
            onClick={onToggleSize}
            className={classNames(
              "hidden md:flex absolute top-1/2 -translate-y-1/2 -right-3.5 w-7 h-7 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full items-center justify-center text-zinc-400 hover:text-blue-600 shadow-sm transition-all z-50",
              { "rotate-180": size === 'collapsed' }
            )}
          >
            <i className="pi pi-angle-left text-sm"></i>
          </button>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {filteredNav.map((item) => renderNavItem(item))}
        </ul>
      </div>

      {/* Bottom: version */}
      <div className="px-2 py-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-center">
        {!isCollapsed ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center font-medium tracking-wider uppercase">EDUMANAGE PLATFORM</p>
        ) : (
          <i className="pi pi-bolt text-zinc-400"></i>
        )}
      </div>
    </div>
  );
}
