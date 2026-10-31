'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { filterNavForUser, NavItem } from '@/config/navigation';
import { clsx } from 'clsx';
import { formatRole, initials } from '@/lib/format';
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
  GraduationCap,
  LifeBuoy,
  PanelLeftClose,
  PanelLeftOpen,
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

  const filteredNav = filterNavForUser(activeUser.role, activeTenant.activeModules);

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isPathActive = (item: NavItem): boolean => {
    if (item.path && pathname === item.path) return true;
    if (item.children) return item.children.some((child) => isPathActive(child));
    return false;
  };

  const closeOnMobile = () => {
    if (window.innerWidth < 1024) onClose?.();
  };

  const renderNavItem = (item: NavItem, index: number, isChild = false) => {
    if (item.isSection) {
      if (isCollapsed) {
        return index > 0 ? (
          <li
            key={item.label + index}
            className="mx-auto my-3 hidden h-px w-6 bg-sidebar-section-divider lg:block"
          />
        ) : null;
      }
      return (
        <li
          key={item.label + index}
          className="px-3 pb-2 pt-6 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted/70"
        >
          {item.label}
        </li>
      );
    }

    const active = isPathActive(item);
    const hasChildren = Boolean(item.children && item.children.length > 0);
    const expanded = (item.path && expandedItems.includes(item.path)) || (hasChildren && active);
    const exact = !!item.path && pathname === item.path && !hasChildren;

    const rowClass = clsx(
      'group relative flex w-full items-center gap-3 rounded-xl text-left text-[13.5px] no-underline transition-all duration-200',
      isChild ? 'h-9 pl-3 pr-3' : 'h-10 px-3',
      isCollapsed && 'lg:justify-center lg:px-0',
      exact
        ? 'bg-brand-gradient font-semibold text-white shadow-glow'
        : active
          ? 'font-semibold text-sidebar-nav-active-text'
          : 'font-medium text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground'
    );

    const icon = !isChild && (
      <RenderIcon
        name={item.icon}
        className={clsx(
          'size-[18px] shrink-0 transition-colors',
          exact
            ? 'text-white'
            : active
              ? 'text-sidebar-nav-active-text'
              : 'text-sidebar-nav-icon-muted group-hover:text-sidebar-foreground'
        )}
      />
    );

    return (
      <li key={item.path || item.label} className="mb-0.5">
        {hasChildren ? (
          <button
            onClick={() => {
              if (isCollapsed && onToggleSize) onToggleSize();
              toggleExpand(item.path!);
            }}
            className={rowClass}
            title={isCollapsed ? item.label : undefined}
          >
            {icon}
            <span className={clsx('flex-1 truncate', isCollapsed && 'lg:hidden')}>
              {item.label}
            </span>
            <ChevronDown
              className={clsx(
                'size-3.5 opacity-60 transition-transform',
                expanded && 'rotate-180',
                isCollapsed && 'lg:hidden'
              )}
            />
          </button>
        ) : (
          <Link
            href={item.path!}
            onClick={closeOnMobile}
            className={rowClass}
            title={isCollapsed ? item.label : undefined}
          >
            {isChild && (
              <span
                className={clsx(
                  'size-1.5 shrink-0 rounded-full',
                  exact ? 'bg-white' : 'bg-sidebar-child-dot group-hover:bg-sidebar-foreground'
                )}
              />
            )}
            {icon}
            <span className={clsx('truncate', isCollapsed && 'lg:hidden')}>{item.label}</span>
          </Link>
        )}

        {hasChildren && expanded && (
          <ul
            className={clsx(
              'ml-[22px] mt-0.5 border-l border-sidebar-child-border pl-2',
              isCollapsed && 'lg:hidden'
            )}
          >
            {item.children!.map((child, idx) => renderNavItem(child, idx, true))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <aside
      className={clsx(
        'fixed bottom-3 left-3 top-3 z-50 flex flex-col overflow-hidden rounded-[28px] bg-sidebar text-sidebar-foreground transition-all duration-300 ease-out',
        isCollapsed ? 'w-[268px] lg:w-[84px]' : 'w-[268px]',
        isOpen ? 'translate-x-0' : '-translate-x-[calc(100%+24px)]'
      )}
      style={{
        boxShadow: 'var(--sidebar-shadow)',
      }}
    >
      {/* Ambient glow — uses CSS variable opacity so light mode has subtle glow, dark has strong */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full blur-3xl"
        style={{
          background: `var(--sidebar-glow-1-color)`,
          opacity: `var(--sidebar-glow-1-opacity)`,
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-20 size-72 rounded-full blur-3xl"
        style={{
          background: `var(--sidebar-glow-2-color)`,
          opacity: `var(--sidebar-glow-2-opacity)`,
        }}
      />

      {/* Logo */}
      <div
        className={clsx(
          'relative flex h-[72px] shrink-0 items-center gap-3 px-5',
          isCollapsed && 'lg:justify-center lg:px-0'
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow">
          <GraduationCap className="size-5 text-white" />
        </span>
        <span
          className={clsx(
            'font-display text-[20px] font-semibold tracking-tight text-sidebar-foreground',
            isCollapsed && 'lg:hidden'
          )}
        >
          EduNexus
        </span>
        {onToggleSize && (
          <button
            onClick={onToggleSize}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={clsx(
              'ml-auto hidden size-8 items-center justify-center rounded-lg text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground lg:flex',
              isCollapsed && 'lg:hidden'
            )}
          >
            <PanelLeftClose className="size-4" />
          </button>
        )}
      </div>

      {/* School card */}
      <div className={clsx('relative px-3 pb-2', isCollapsed && 'lg:px-2')}>
        <div
          className={clsx(
            'flex items-center gap-3 rounded-2xl border p-2.5',
            isCollapsed && 'lg:justify-center lg:p-1.5'
          )}
          style={{
            background: 'var(--sidebar-school-card-bg)',
            borderColor: 'var(--sidebar-school-card-border)',
          }}
        >
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold"
            style={{
              background: 'var(--sidebar-school-card-initials-bg)',
              color: 'var(--sidebar-school-card-initials-text)',
            }}
          >
            {initials(activeTenant.name)}
          </span>
          <span className={clsx('min-w-0 flex-1', isCollapsed && 'lg:hidden')}>
            <span
              className="block truncate text-[13px] font-semibold leading-tight"
              style={{ color: 'var(--sidebar-school-card-name)' }}
            >
              {activeTenant.name}
            </span>
            <span className="mt-0.5 block truncate text-xs leading-tight text-sidebar-muted">
              {formatRole(activeUser.role)}
            </span>
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="scrollbar-none relative flex-1 overflow-y-auto px-3 pb-4">
        <ul>{filteredNav.map((item, index) => renderNavItem(item, index))}</ul>
      </nav>

      {/* Help card */}
      <div className="relative p-3">
        {isCollapsed ? (
          <div className="hidden justify-center lg:flex">
            <button
              onClick={onToggleSize}
              aria-label="Expand sidebar"
              className="flex size-10 items-center justify-center rounded-xl text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <PanelLeftOpen className="size-[18px]" />
            </button>
          </div>
        ) : null}
        <Link
          href="/academics/guide"
          onClick={closeOnMobile}
          className={clsx(
            'relative block overflow-hidden rounded-2xl bg-brand-gradient p-4 no-underline shadow-glow',
            isCollapsed && 'lg:hidden'
          )}
        >
          <div className="bg-dots pointer-events-none absolute inset-0 opacity-60" />
          <LifeBuoy className="relative size-5 text-white" />
          <p className="relative mt-2 font-display text-[15px] font-semibold text-white">
            Need a hand?
          </p>
          <p className="relative text-xs text-white/80">
            Step-by-step guide to set up your school.
          </p>
        </Link>
      </div>
    </aside>
  );
}
