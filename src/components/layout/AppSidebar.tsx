'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { navigationConfig, canAccessNav, NavItem } from '@/config/navigation';
import { clsx } from 'clsx';
import {
  Home,
  Shield,
  Users,
  Building,
  Compass,
  Star,
  TrendingUp,
  Calendar,
  UserPlus,
  Ticket,
  Link as LinkIcon,
  IdCard,
  Folder,
  CheckCircle,
  Server,
  CheckSquare,
  Clock,
  FileEdit,
  Upload,
  Pencil,
  BarChart3,
  Video,
  HelpCircle,
  CreditCard,
  CalendarMinus,
  DollarSign,
  BookOpen,
  Bookmark,
  RotateCcw,
  Bus,
  MapPin,
  Building2,
  Key,
  Bell,
  MessageSquare,
  Globe,
  Image,
  Download,
  Mail,
  Settings,
  Sliders,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  ChevronLeft,
  Zap,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Home,
  Shield,
  Users,
  Building,
  Compass,
  Star,
  TrendingUp,
  Calendar,
  UserPlus,
  Ticket,
  Link: LinkIcon,
  IdCard,
  Folder,
  CheckCircle,
  Server,
  CheckSquare,
  Clock,
  FileEdit,
  Upload,
  Pencil,
  BarChart3,
  Video,
  HelpCircle,
  CreditCard,
  CalendarMinus,
  DollarSign,
  BookOpen,
  Bookmark,
  RotateCcw,
  Bus,
  MapPin,
  Building2,
  Key,
  Bell,
  MessageSquare,
  Globe,
  Image,
  Download,
  Mail,
  Settings,
  Sliders,
};

function RenderIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const IconComp = ICON_MAP[name];
  if (!IconComp) {
    return <Home className={className} />;
  }
  return <IconComp className={className} />;
}

interface AppSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  size?: 'default' | 'collapsed';
  onToggleSize?: () => void;
}

export default function AppSidebar({
  isOpen,
  onClose,
  size = 'default',
  onToggleSize,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { activeUser, activeTenant } = useAuthStore();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const isCollapsed = size === 'collapsed';

  if (!activeUser || !activeTenant) return null;

  // Filter navigation based on user role and tenant active modules recursively
  const filterNavItem = (item: NavItem): NavItem | null => {
    if (!canAccessNav(item.roles, activeUser.role)) {
      return null;
    }
    if (item.module) {
      const normalizedModule = item.module.endsWith('s') ? item.module : `${item.module}s`;
      const singularModule = item.module.endsWith('s') ? item.module.slice(0, -1) : item.module;

      const hasAccess =
        activeTenant.activeModules.includes(item.module) ||
        activeTenant.activeModules.includes(normalizedModule) ||
        activeTenant.activeModules.includes(singularModule);

      if (!hasAccess) {
        return null;
      }
    }

    if (item.children) {
      const filteredChildren = item.children
        .map(filterNavItem)
        .filter((child): child is NavItem => child !== null);

      if (filteredChildren.length === 0 && !item.path) {
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

  const isPathActive = (item: NavItem): boolean => {
    if (item.path && pathname === item.path) return true;
    if (item.children) {
      return item.children.some((child) => isPathActive(child));
    }
    return false;
  };

  const renderNavItem = (item: NavItem, index: number, isChild = false) => {
    if (item.isSection) {
      if (isCollapsed) return null;
      return (
        <li
          key={item.label + index}
          className="px-3 pt-5 pb-1.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest"
        >
          {item.label}
        </li>
      );
    }

    const active = isPathActive(item);
    const hasChildren = Boolean(item.children && item.children.length > 0);
    const expanded = item.path ? expandedItems.includes(item.path) : false;

    return (
      <li key={item.path || item.label} className={clsx('mb-1 px-2', { 'ml-2': isChild })}>
        {hasChildren ? (
          <button
            onClick={() => {
              if (size === 'collapsed' && onToggleSize) {
                onToggleSize();
              }
              toggleExpand(item.path!);
            }}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ease-out text-left relative group',
              {
                'justify-center md:justify-center px-0': isCollapsed,
                'bg-blue-50/90 text-blue-700 dark:bg-gradient-to-r dark:from-blue-500/20 dark:to-indigo-500/10 dark:text-blue-400 font-semibold shadow-sm border-l-2 border-blue-600 dark:border-blue-400':
                  active,
                'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-slate-100 dark:hover:bg-slate-800/60 font-medium':
                  !active,
              }
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <RenderIcon
              name={item.icon}
              className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110"
            />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-[13px] truncate">{item.label}</span>
                {expanded ? (
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                )}
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
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ease-out no-underline group',
              {
                'justify-center md:justify-center px-0': isCollapsed,
                'bg-blue-50/90 text-blue-700 dark:bg-gradient-to-r dark:from-blue-500/20 dark:to-indigo-500/10 dark:text-blue-400 font-semibold shadow-sm border-l-2 border-blue-600 dark:border-blue-400':
                  active,
                'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-slate-100 dark:hover:bg-slate-800/60 font-medium':
                  !active,
              }
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <RenderIcon
              name={item.icon}
              className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110"
            />
            {!isCollapsed && <span className="text-[13px] truncate">{item.label}</span>}
          </Link>
        )}

        {/* Children */}
        {hasChildren && expanded && !isCollapsed && (
          <ul className="mt-1 space-y-1 pl-2 border-l border-slate-200/60 dark:border-slate-800/80 ml-4">
            {item.children!.map((child, idx) => renderNavItem(child, idx, true))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div
      className={clsx(
        'fixed top-[70px] bottom-0 left-0 z-40 bg-[#fcfcfc]/95 dark:bg-[#070a13]/90 backdrop-blur-2xl border-r border-slate-200/50 dark:border-slate-800/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_30px_rgba(0,0,0,0.5)] flex flex-col transition-all duration-300 ease-in-out',
        {
          'w-[260px]': size === 'default',
          'w-[260px] md:w-[70px]': size === 'collapsed',
          'translate-x-0': isOpen,
          '-translate-x-full': !isOpen,
        }
      )}
    >
      {/* School branding strip / Hover Toggle */}
      <div className="relative px-5 py-4 border-b border-slate-200/50 dark:border-slate-800/60 bg-transparent flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-3 overflow-hidden">
          <div
            className="w-10 h-10 md:w-9 md:h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10 border border-white/20"
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            <GraduationCap className="w-5 h-5 text-white drop-shadow-sm" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight">
                {activeTenant.name} {activeTenant.prefix ? `[${activeTenant.prefix}]` : ''}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5 uppercase tracking-widest font-extrabold">
                {activeUser.role}
              </p>
            </div>
          )}
        </div>

        {/* Toggle Collapse Button (Desktop Only) */}
        {onToggleSize && (
          <button
            onClick={onToggleSize}
            className={clsx(
              'hidden md:flex absolute top-1/2 -translate-y-1/2 -right-3.5 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-full items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 shadow-md transition-all duration-300 z-50',
              { 'rotate-180': size === 'collapsed' }
            )}
          >
            <ChevronLeft className="w-3.5 h-3.5 font-bold" />
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
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center font-medium tracking-wider uppercase">
            EDUMANAGE PLATFORM
          </p>
        ) : (
          <Zap className="w-4 h-4 text-zinc-400" />
        )}
      </div>
    </div>
  );
}
