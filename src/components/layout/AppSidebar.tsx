'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { filterNavForUser, NavItem, SECTION_TONES } from '@/config/navigation';
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
  LogOut,
  X,
  AlertCircle,
  Package,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  AlertCircle,
  Package,
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
  /** mobile drawer */
  isOpen: boolean;
  onClose?: () => void;
  /** desktop icon rail */
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

interface Group {
  title?: string;
  tone: string;
  items: NavItem[];
}

function groupNav(nav: NavItem[]): Group[] {
  const groups: Group[] = [];
  let cur: Group | null = null;
  for (const item of nav) {
    if (item.isSection) {
      cur = { title: item.label, tone: SECTION_TONES[item.label] ?? 'indigo', items: [] };
      groups.push(cur);
    } else {
      if (!cur) {
        cur = { tone: 'indigo', items: [] };
        groups.push(cur);
      }
      cur.items.push(item);
    }
  }
  return groups.filter((g) => g.items.length > 0);
}

function leafPaths(items: NavItem[], out: string[] = []): string[] {
  for (const it of items) {
    if (it.path && !it.isSection) out.push(it.path);
    if (it.children) leafPaths(it.children, out);
  }
  return out;
}

export default function AppSidebar({
  isOpen,
  onClose,
  collapsed,
  onToggleCollapsed,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { activeUser, activeTenant, logout } = useAuthStore();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  if (!activeUser || !activeTenant) return null;

  const nav = filterNavForUser(activeUser.role, activeTenant.activeModules);
  const groups = groupNav(nav);

  // The single most specific nav entry for this URL is the active one
  const activePath =
    leafPaths(nav)
      .filter((p) => pathname === p || pathname.startsWith(p + '/'))
      .sort((a, b) => b.length - a.length)[0] ?? '';

  const toggleExpand = (key: string) =>
    setExpandedItems((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );

  const closeOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose?.();
  };

  const renderItem = (item: NavItem, tone: string) => {
    const hasChildren = Boolean(item.children && item.children.length > 0);
    const key = item.path || item.label;
    const childActive = hasChildren && item.children!.some((c) => c.path === activePath);
    const open = expandedItems.includes(key) || childActive;
    const active = !hasChildren && item.path === activePath;

    const row = (
      <>
        <span className="snav-well">
          <RenderIcon name={item.icon} className="size-[18px]" />
        </span>
        <span className="snav-label truncate">{item.label}</span>
        {hasChildren ? (
          <ChevronDown
            className={clsx(
              'snav-chevron ml-auto size-3.5 opacity-60 transition-transform',
              open && 'rotate-180'
            )}
          />
        ) : (
          <span className="snav-dot" aria-hidden="true" />
        )}
      </>
    );

    return (
      <li key={key}>
        {hasChildren ? (
          <button
            type="button"
            title={collapsed ? item.label : undefined}
            aria-expanded={open}
            onClick={() => {
              if (collapsed) onToggleCollapsed();
              toggleExpand(key);
            }}
            className={clsx('snav-item tone-' + tone, childActive && 'is-active')}
          >
            {row}
          </button>
        ) : (
          <Link
            href={item.path!}
            title={collapsed ? item.label : undefined}
            aria-label={item.label}
            onClick={closeOnMobile}
            className={clsx('snav-item tone-' + tone, active && 'is-active')}
          >
            {row}
          </Link>
        )}
        {hasChildren && open && (
          <ul
            className={clsx(
              'ml-[22px] mt-1 space-y-0.5 border-l border-sidebar-child-border pl-2',
              collapsed && 'lg:hidden'
            )}
          >
            {item.children!.map((c) => (
              <li key={c.path || c.label}>
                <Link
                  href={c.path!}
                  onClick={closeOnMobile}
                  className={clsx(
                    'snav-item snav-sub tone-' + tone,
                    c.path === activePath && 'is-active'
                  )}
                >
                  <span className="truncate">{c.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  const logo = activeTenant.theme?.logo;
  const hide = collapsed ? 'lg:hidden' : '';

  return (
    <aside
      aria-label="Primary"
      className={clsx(
        'fixed inset-y-3 left-3 z-40 flex w-[min(280px,calc(100vw-24px))] shrink-0 flex-col transition-[transform,width] duration-200 ease-out',
        'lg:static lg:inset-auto lg:my-3 lg:ml-3 lg:translate-x-0',
        collapsed ? 'snav-rail lg:w-[72px]' : 'lg:w-[240px]',
        isOpen ? 'translate-x-0' : '-translate-x-[calc(100%+24px)] max-lg:invisible'
      )}
    >
      <div className="shell-panel rounded-shell flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Brand / school */}
        <div
          className={clsx(
            'flex shrink-0 items-center gap-3 px-4 pb-3 pt-4',
            collapsed && 'lg:justify-center lg:px-0'
          )}
        >
          {logo ? (
            <img
              src={logo}
              alt=""
              className="size-10 shrink-0 rounded-2xl object-contain ring-1 ring-inset ring-border"
            />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-sm ring-1 ring-inset ring-white/20">
              <GraduationCap className="size-[18px]" />
            </span>
          )}
          <div className={clsx('min-w-0 flex-1', hide)}>
            <p
              className="text-card-title truncate !text-sm leading-tight"
              title={activeTenant.name}
            >
              {activeTenant.name}
            </p>
            <span className="tone-brand tone-chip mt-1 inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize leading-none">
              {formatRole(activeUser.role)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="snav-icon-btn lg:hidden"
          >
            <X className="size-[18px]" />
          </button>
        </div>
        <div className="mx-4 h-px bg-border" />

        {/* Navigation: only what this role can open */}
        <nav
          aria-label="Main navigation"
          className="scrollbar-none scroll-hover flex-1 overflow-y-auto px-3 pb-3 pt-4"
        >
          {groups.map((g, gi) => (
            <div key={(g.title ?? '') + gi} className="mb-4">
              {g.title && (
                <p
                  className={clsx(
                    'text-eyebrow mb-1.5 flex items-center gap-2 px-3 !text-[11px] !font-medium opacity-90',
                    hide
                  )}
                >
                  <span
                    className={clsx(
                      'inline-block size-1.5 rounded-full tone-dot',
                      'tone-' + g.tone
                    )}
                  />
                  {g.title}
                </p>
              )}
              {collapsed && gi > 0 && (
                <div className="mx-auto mb-2 hidden h-px w-6 rounded-full bg-border lg:block" />
              )}
              <ul className="space-y-1">{g.items.map((item) => renderItem(item, g.tone))}</ul>
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="shrink-0 p-3">
          <div
            className={clsx(
              'flex items-center gap-3 rounded-2xl bg-muted p-2 ring-1 ring-inset ring-border',
              collapsed && 'lg:justify-center lg:bg-transparent lg:p-0 lg:ring-0'
            )}
          >
            <span
              title={collapsed ? activeUser.name : undefined}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-semibold text-white ring-2 ring-card"
            >
              {initials(activeUser.name)}
            </span>
            <div className={clsx('min-w-0 flex-1', hide)}>
              <p
                className="truncate text-[13px] font-semibold text-foreground"
                title={activeUser.name}
              >
                {activeUser.name}
              </p>
              <p className="text-caption truncate !text-[11px]" title={activeUser.email}>
                {activeUser.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
            className={clsx(
              'snav-icon-btn snav-logout mt-2 w-full gap-2 bg-muted/60 px-4 text-[13px] font-medium ring-1 ring-inset ring-border',
              collapsed && 'lg:mx-auto lg:w-11 lg:px-0'
            )}
          >
            <LogOut className="size-[18px]" />
            <span className={hide}>Sign out</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="rail-toggle hidden lg:flex"
      >
        {collapsed ? (
          <PanelLeftOpen className="size-3.5" />
        ) : (
          <PanelLeftClose className="size-3.5" />
        )}
      </button>
    </aside>
  );
}
