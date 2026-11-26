'use client';

import React from 'react';
import {
  Boxes,
  CalendarMinus,
  IdCard,
  IndianRupee,
  Megaphone,
  Wallet,
  Warehouse,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useAnnouncements } from '@/hooks/queries/useCommunication';
import { useLeavesList } from '@/hooks/queries/useLeave';
import { asList } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import {
  HeroCard,
  HeroButton,
  Panel,
  PanelLink,
  EmptyState,
  QuickActions,
  type QuickAction,
  greeting,
  todayLabel,
} from './kit';

/** Dashboard for clerk, lab assistant and support staff. Every link here is one the role may open. */
export function StaffDashboard() {
  const { activeUser } = useAuthStore();
  const { isRole, hasModule } = usePermissions();

  const { data: announcementsData, isPending: announcementsPending } = useAnnouncements(1, 5);
  const { data: leavesData, isPending: leavesPending } = useLeavesList(1, 20, {
    applicantId: activeUser?.id,
    applicantType: 'STAFF',
  });

  const announcements = asList<any>(announcementsData);
  const leaves = asList<any>(leavesData);
  const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING').length;
  const approvedLeaves = leaves.filter((l: any) => l.status === 'APPROVED').length;

  const actions: QuickAction[] = [];
  if (hasModule('communication')) {
    actions.push({
      label: 'Announcements',
      href: '/communication',
      icon: Megaphone,
      gradient: 'from-violet-500 to-indigo-500',
    });
  }
  if (hasModule('leave')) {
    actions.push({
      label: 'My leave',
      href: '/leave',
      icon: CalendarMinus,
      gradient: 'from-amber-400 to-orange-500',
    });
  }
  if (hasModule('hr_payroll')) {
    actions.push({
      label: 'My payslips',
      href: '/my-pay',
      icon: Wallet,
      gradient: 'from-emerald-400 to-teal-500',
    });
  }
  if (isRole('clerk')) {
    if (hasModule('student')) {
      actions.push({
        label: 'Student directory',
        href: '/students',
        icon: IdCard,
        gradient: 'from-sky-400 to-cyan-500',
      });
    }
    if (hasModule('fee')) {
      actions.push({
        label: 'Fee dues',
        href: '/fee/dues',
        icon: IndianRupee,
        gradient: 'from-pink-500 to-rose-500',
      });
    }
  }
  if (isRole('lab_assistant')) {
    if (hasModule('inventory')) {
      actions.push({
        label: 'Inventory',
        href: '/inventory',
        icon: Warehouse,
        gradient: 'from-fuchsia-500 to-purple-500',
      });
    }
    if (hasModule('student')) {
      actions.push({
        label: 'Student directory',
        href: '/students',
        icon: IdCard,
        gradient: 'from-sky-400 to-cyan-500',
      });
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 pb-6">
      <HeroCard
        eyebrow={
          <>
            <Boxes className="size-3.5" /> {todayLabel()}
          </>
        }
        title={
          <>
            {greeting()}, {activeUser?.name?.split(' ')[0] || 'there'} 👋
          </>
        }
        subtitle="Your school notices, leave and quick links for the day."
        actions={
          <>
            {hasModule('communication') && (
              <HeroButton href="/communication">
                <Megaphone className="size-4" /> Announcements
              </HeroButton>
            )}
            {hasModule('leave') && (
              <HeroButton href="/leave" variant="glass">
                <CalendarMinus className="size-4" /> Apply for leave
              </HeroButton>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
        <StatCard
          label="Announcements"
          value={announcements.length}
          icon={Megaphone}
          gradientClass="from-violet-500 to-indigo-500"
          footerText="Latest from the school"
          loading={announcementsPending}
        />
        <StatCard
          label="Leave awaiting approval"
          value={pendingLeaves}
          icon={CalendarMinus}
          gradientClass="from-amber-400 to-orange-500"
          footerText="Your pending requests"
          loading={leavesPending}
        />
        <StatCard
          label="Leave approved"
          value={approvedLeaves}
          icon={CalendarMinus}
          gradientClass="from-emerald-400 to-teal-500"
          footerText="Your approved requests"
          loading={leavesPending}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Announcements"
          subtitle="What the school is saying"
          action={
            hasModule('communication') ? (
              <PanelLink href="/communication">All</PanelLink>
            ) : undefined
          }
        >
          {announcements.length > 0 ? (
            <div className="divide-y divide-border">
              {announcements.map((a: any) => (
                <div key={a.id} className="flex items-start gap-3 py-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                    <Megaphone className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-foreground">{a.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{a.content}</p>
                  </div>
                  <span className="hidden min-[400px]:inline shrink-0 text-xs text-muted-foreground">
                    {formatDate(a.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Megaphone}
              text={announcementsPending ? 'Loading…' : 'No announcements right now.'}
            />
          )}
        </Panel>

        <Panel
          title="My leave"
          subtitle="Status of your requests"
          action={hasModule('leave') ? <PanelLink href="/leave">Open</PanelLink> : undefined}
        >
          {leaves.length > 0 ? (
            <div className="divide-y divide-border">
              {leaves.slice(0, 5).map((l: any) => (
                <div key={l.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
                      {formatDate(l.startDate)} – {formatDate(l.endDate)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{l.reason}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      l.status === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : l.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-rose-500/10 text-rose-600'
                    }`}
                  >
                    {String(l.status).charAt(0) + String(l.status).slice(1).toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarMinus}
              text={leavesPending ? 'Loading…' : 'You have no leave requests.'}
            />
          )}
        </Panel>
      </div>

      {actions.length > 0 && (
        <Panel title="Quick links" subtitle="Shortcuts for your role">
          <QuickActions columns={3} actions={actions} />
        </Panel>
      )}
    </div>
  );
}
