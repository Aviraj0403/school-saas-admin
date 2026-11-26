'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { LayoutGrid } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermissions } from '@/hooks/usePermissions';
import { filterNavForUser, NavItem, normalizeRole } from '@/config/navigation';
import { RenderIcon } from './AppSidebar';

/** Most useful destinations per role, in order. Only those the user can actually open are shown. */
const PRIORITY: Record<string, string[]> = {
  superadmin: ['/superadmin', '/superadmin/tenants', '/superadmin/plans', '/superadmin/billing'],
  school_admin: ['/dashboard', '/students', '/attendance', '/fee/slabs'],
  teacher: ['/dashboard', '/attendance', '/academics/timetable', '/assignments'],
  accountant: ['/dashboard', '/fee/slabs', '/fee/dues', '/fee/expenses'],
  librarian: ['/dashboard', '/library', '/students', '/leave'],
  clerk: ['/dashboard', '/students', '/fee/dues', '/library'],
  lab_assistant: ['/dashboard', '/inventory', '/students', '/communication'],
  support_staff: ['/dashboard', '/leave', '/communication', '/my-pay'],
  parent: ['/dashboard', '/portal/attendance', '/portal/homework', '/portal/fees'],
  student: ['/dashboard', '/portal/homework', '/portal/timetable', '/portal/results'],
};

const SHORT: Record<string, string> = {
  '/dashboard': 'Home',
  '/superadmin': 'Panel',
  '/superadmin/tenants': 'Schools',
  '/superadmin/plans': 'Plans',
  '/superadmin/billing': 'Billing',
  '/students': 'Students',
  '/attendance': 'Attendance',
  '/fee/slabs': 'Fees',
  '/fee/dues': 'Dues',
  '/fee/expenses': 'Expenses',
  '/academics/timetable': 'Timetable',
  '/assignments': 'Homework',
  '/library': 'Library',
  '/leave': 'Leave',
  '/inventory': 'Inventory',
  '/communication': 'Notices',
  '/my-pay': 'Payslips',
  '/portal/attendance': 'Attendance',
  '/portal/homework': 'Homework',
  '/portal/fees': 'Fees',
  '/portal/timetable': 'Timetable',
  '/portal/results': 'Results',
};

function flat(items: NavItem[], out: NavItem[] = []): NavItem[] {
  for (const i of items) {
    if (i.isSection) continue;
    if (i.path) out.push(i);
    if (i.children) flat(i.children, out);
  }
  return out;
}

export default function BottomTabBar({
  onMore,
  moreOpen,
}: {
  onMore: () => void;
  moreOpen: boolean;
}) {
  const pathname = usePathname();
  const { activeUser, activeTenant } = useAuthStore();
  const { can } = usePermissions();
  if (!activeUser || !activeTenant) return null;

  const items = flat(
    filterNavForUser(activeUser.role, activeTenant.activeModules, (m) => can(`${m}:read`))
  );
  const byPath = new Map(items.map((i) => [i.path!, i]));
  const wanted = PRIORITY[normalizeRole(activeUser.role)] ?? ['/dashboard'];

  const tabs: NavItem[] = [];
  for (const p of wanted) {
    const it = byPath.get(p);
    if (it && tabs.length < 4) tabs.push(it);
  }
  // fill remaining slots with whatever else the role has (custom roles, trimmed features)
  for (const it of items) {
    if (tabs.length >= 4) break;
    if (!tabs.includes(it)) tabs.push(it);
  }

  const active = tabs
    .filter((t) => pathname === t.path || pathname.startsWith(t.path + '/'))
    .sort((a, b) => b.path!.length - a.path!.length)[0];

  return (
    <nav
      aria-label="Quick navigation"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden print:hidden"
    >
      <div className="shell-panel pointer-events-auto mx-auto flex max-w-md items-stretch justify-between gap-1 rounded-[28px] p-1.5">
        {tabs.map((t) => {
          const on = t === active && !moreOpen;
          return (
            <Link
              key={t.path}
              href={t.path!}
              aria-current={on ? 'page' : undefined}
              className={clsx(
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[22px] px-1 py-2 text-[10.5px] font-semibold no-underline transition-all duration-200',
                on
                  ? 'bg-brand-gradient text-white shadow-glow'
                  : 'text-muted-foreground active:scale-95'
              )}
            >
              <RenderIcon name={t.icon} className="size-[20px]" />
              <span className="max-w-full truncate leading-none">{SHORT[t.path!] ?? t.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMore}
          aria-label="Open full menu"
          aria-expanded={moreOpen}
          className={clsx(
            'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[22px] px-1 py-2 text-[10.5px] font-semibold transition-all duration-200',
            moreOpen
              ? 'bg-brand-gradient text-white shadow-glow'
              : 'text-muted-foreground active:scale-95'
          )}
        >
          <LayoutGrid className="size-[20px]" />
          <span className="leading-none">More</span>
        </button>
      </div>
    </nav>
  );
}
