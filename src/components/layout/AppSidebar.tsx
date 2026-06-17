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
    return (item.path && expandedItems.includes(item.path)) || (item.children?.some((c) => c.path && isActive(c.path)) ?? false);
  };

  const renderNavItem = (item: NavItem, index: number, isChild = false) => {
    if (item.isSection) {
      if (isCollapsed) return <div key={item.label} className="my-2 border-t border-zinc-200 dark:border-zinc-800/50"></div>;
      return (
        <li key={item.label} className={classNames('mb-1.5 px-4', { 'mt-5': index > 0, 'mt-1': index === 0 })}>
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500">
            {item.label}
          </span>
        </li>
      );
    }

    const active = isActive(item.path!);
    const hasChildren = item.children && item.children.length > 0;
    const expanded = hasChildren && isExpanded(item);

    return (
      <li key={item.path || item.label} className={classNames('mb-0.5 px-2', { 'ml-2': isChild })}>
        {hasChildren ? (
          <button
            onClick={() => {
              if (size === 'collapsed' && onToggleSize) {
                onToggleSize();
              }
              toggleExpand(item.path!);
            }}
            className={classNames(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ease-out text-left relative group',
              {
                'justify-center md:justify-center px-0': isCollapsed,
                'bg-blue-50/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-semibold shadow-sm shadow-blue-500/5': active,
                'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/60 font-medium': !active,
              }
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <i className={classNames(item.icon, 'text-[16px] w-5 text-center shrink-0 transition-transform group-hover:scale-110')}></i>
            {!isCollapsed && (
              <>
                <span className="flex-1 text-[13px] truncate">{item.label}</span>
                <i className={classNames('pi text-[9px] transition-transform duration-200 opacity-50', { 'pi-chevron-down': expanded, 'pi-chevron-right': !expanded })}></i>
              </>
            )}
          </button>
        ) : (
          <Link
            href={item.path!}
            onClick={() => {
              if (window.innerWidth < 768) {
                onClose?.();
              }
            }}
            className={classNames(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ease-out no-underline group',
              {
                'justify-center md:justify-center px-0': isCollapsed,
                'bg-blue-50/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-semibold shadow-sm shadow-blue-500/5': active,
                'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/60 font-medium': !active,
              }
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <i className={classNames(item.icon, 'text-[16px] w-5 text-center shrink-0 transition-transform group-hover:scale-110')}></i>
            {!isCollapsed && (
              <span className="text-[13px] truncate">{item.label}</span>
            )}
          </Link>
        )}

        {/* Children */}
        {hasChildren && expanded && !isCollapsed && (
          <ul className="mt-0.5 space-y-0.5">
            {item.children!.map((child, idx) => renderNavItem(child, idx, true))}
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
      <div className="relative px-5 py-5 md:py-4 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3.5 md:gap-3 overflow-hidden">
          <div className="w-10 h-10 md:w-9 md:h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-black/5 dark:border-white/10" style={{ backgroundColor: 'var(--primary-color)' }}>
            <i className="pi pi-graduation-cap text-white text-[17px] md:text-[15px] drop-shadow-sm"></i>
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-[14px] font-extrabold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
                {activeTenant.name} {activeTenant.prefix ? `[${activeTenant.prefix}]` : ''}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate leading-tight mt-0.5 uppercase tracking-widest font-semibold">{activeUser.role}</p>
            </div>
          )}
        </div>
        
        {/* Toggle Collapse Button (Desktop Only) */}
        {onToggleSize && (
          <button 
            onClick={onToggleSize}
            className={classNames(
              "hidden md:flex absolute top-1/2 -translate-y-1/2 -right-3.5 w-7 h-7 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-full items-center justify-center text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 shadow-sm hover:shadow-md transition-all duration-300 z-50",
              { "rotate-180": size === 'collapsed' }
            )}
          >
            <i className="pi pi-angle-left text-[12px] font-bold"></i>
          </button>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto pt-2 pb-3 px-2">
        <ul className="space-y-0.5">
          {filteredNav.map((item, index) => renderNavItem(item, index))}
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
