'use client';

import React, { useState } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { useAuthStore } from '@/store/useAuthStore';
import {
  useFullDashboard,
  useFeeCollectionTrend,
  useAttendanceTrend,
} from '@/hooks/queries/useAnalytics';
import { useCurrentAcademicYear, useClasses } from '@/hooks/queries/useAcademics';
import { useQuery } from '@tanstack/react-query';
import { usePermissions } from '@/hooks/usePermissions';
import { feeService } from '@/services/fee.service';
import { formatDate } from '@/lib/format';
import {
  HeroCard,
  HeroButton,
  Panel,
  PanelLink,
  EmptyState,
  QuickActions,
  GlanceRow,
  greeting,
  todayLabel,
  inr,
  lastMonthsSeries,
  type QuickAction,
} from './kit';
import { AreaTrend, BarTrend, Donut, RadialGauge } from './charts';
import {
  BarChart3,
  BedDouble,
  BookOpen,
  Bus,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  GraduationCap,
  IdCard,
  IndianRupee,
  Inbox,
  Megaphone,
  MessageCircle,
  Rocket,
  AlertTriangle,
  CreditCard,
  School,
  Sparkles,
  UserPlus,
  Wallet,
} from 'lucide-react';

export function AdminDashboard() {
  const { activeUser, activeTenant, subscription } = useAuthStore();
  const { hasModule } = usePermissions();
  const [now] = useState(() => Date.now());
  const isModuleActive = (_mods: unknown, key: string) => hasModule(key);
  const { data: feeStructures } = useQuery({
    queryKey: ['fee-structures', 'dashboard-check'],
    queryFn: () => feeService.getStructures(),
    enabled: hasModule('fee'),
    retry: false,
  });

  const { data: dashboard, isPending: adminPending } = useFullDashboard();
  const { data: feeTrendData } = useFeeCollectionTrend();
  const { data: attendanceTrendData } = useAttendanceTrend();

  const { data: currentAY, isPending: ayPending } = useCurrentAcademicYear();
  const { data: classesData, isPending: classesPending } = useClasses(1, 1);

  React.useEffect(() => {
    // If not super admin, and data is loaded, and no classes exist, redirect to setup
    if (!ayPending && !classesPending && activeTenant?.id !== 'superadmin') {
      if (!currentAY?.id || !classesData?.items?.length) {
        window.location.href = '/setup';
      }
    }
  }, [currentAY, classesData, ayPending, classesPending, activeTenant]);

  const coreStats = dashboard?.core || {};
  const hostelStats = dashboard?.hostel?.stats || {};
  const leaveStats = dashboard?.leave?.stats || {};

  const [isChecklistCollapsed, setIsChecklistCollapsed] = React.useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem('school_onboarding_collapsed');
    if (saved === 'true') {
      setIsChecklistCollapsed(true);
    }
  }, []);

  const toggleChecklist = () => {
    const nextState = !isChecklistCollapsed;
    setIsChecklistCollapsed(nextState);
    localStorage.setItem('school_onboarding_collapsed', String(nextState));
  };

  const subStatus = subscription?.status;
  const trialDaysLeft =
    subStatus === 'TRIAL' && subscription?.trialEndsAt
      ? Math.max(0, Math.ceil((+new Date(subscription.trialEndsAt) - now) / 86_400_000))
      : null;

  const allSteps = [
    {
      title: 'Academic year',
      desc: 'Define the active session and its dates.',
      link: '/academics/terms',
      completed: !!currentAY?.id,
      icon: CalendarDays,
      show: true,
    },
    {
      title: 'Add staff',
      desc: 'Invite teachers, accountants and office staff.',
      link: '/staff',
      completed: coreStats.staff?.total > 0,
      icon: IdCard,
      show: hasModule('staff'),
    },
    {
      title: 'Classes & sections',
      desc: 'Create classes and assign class teachers.',
      link: '/academics/classes',
      completed: classesData?.items?.length > 0,
      icon: School,
      show: true,
    },
    {
      title: 'Admit students',
      desc: 'Enrol students and link their parents.',
      link: '/students',
      completed: coreStats.students?.total > 0,
      icon: UserPlus,
      show: hasModule('student'),
    },
    {
      title: 'Fee structure',
      desc: 'Set up tuition and other fee heads.',
      link: '/fee/slabs',
      completed: (feeStructures?.length ?? 0) > 0,
      icon: Wallet,
      show: hasModule('fee'),
    },
    {
      title: 'WhatsApp alerts',
      desc: 'Connect WhatsApp to message parents.',
      link: '/settings/integrations',
      completed: !!dashboard?.whatsapp?.isConfigured,
      icon: MessageCircle,
      show: hasModule('whatsapp'),
    },
    {
      title: 'Plan status',
      desc:
        subStatus === 'TRIAL'
          ? 'Your trial is running — contact support to activate your plan.'
          : 'Keep your subscription in good standing.',
      link: '/settings',
      completed: subStatus === 'ACTIVE',
      icon: CreditCard,
      show: !!subStatus,
    },
  ];
  const setupSteps = allSteps.filter((st) => st.show);
  const totalSteps = setupSteps.length;
  const completedSteps = setupSteps.filter((st) => st.completed).length;
  const progressPct = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 100;

  const modules = activeTenant?.activeModules;
  const quickActions: QuickAction[] = (
    [
      {
        label: 'New admission',
        icon: UserPlus,
        href: '/students/admissions',
        module: 'student',
        gradient: 'from-violet-500 to-indigo-500',
      },
      {
        label: 'Mark attendance',
        icon: ClipboardCheck,
        href: '/attendance',
        module: 'attendance',
        gradient: 'from-emerald-400 to-teal-500',
      },
      {
        label: 'Collect fee',
        icon: IndianRupee,
        href: '/fee',
        module: 'fee',
        gradient: 'from-amber-400 to-orange-500',
      },
      {
        label: 'Post a notice',
        icon: Megaphone,
        href: '/communication',
        module: 'communication',
        gradient: 'from-pink-500 to-rose-500',
      },
      {
        label: 'Issue a book',
        icon: BookOpen,
        href: '/library',
        module: 'library',
        gradient: 'from-sky-400 to-cyan-500',
      },
      {
        label: 'Reports',
        icon: BarChart3,
        href: '/analytics',
        module: 'analytics',
        gradient: 'from-fuchsia-500 to-purple-600',
      },
    ] as Array<QuickAction & { module: string }>
  ).filter((a) => isModuleActive(modules, a.module));

  const glance = [
    isModuleActive(modules, 'fee') && {
      label: 'Outstanding fees',
      value: inr(coreStats.fees?.outstandingDues),
      href: '/fee/ledgers',
      icon: Wallet,
      tone: 'bg-amber-500/10 text-amber-600',
    },
    isModuleActive(modules, 'website') && {
      label: 'New admission enquiries',
      value: dashboard?.website?.inquiries?.new ?? 0,
      href: '/website/inquiries',
      icon: Inbox,
      tone: 'bg-violet-500/10 text-violet-600',
    },
    isModuleActive(modules, 'library') && {
      label: 'Overdue library books',
      value: coreStats.library?.overdueBooks ?? 0,
      href: '/library/issues',
      icon: BookOpen,
      tone: 'bg-sky-500/10 text-sky-600',
    },
    isModuleActive(modules, 'transport') && {
      label: 'Students on transport',
      value: dashboard?.transport?.stats?.studentsUsingTransport ?? 0,
      href: '/transport',
      icon: Bus,
      tone: 'bg-emerald-500/10 text-emerald-600',
    },
    isModuleActive(modules, 'leave') && {
      label: 'Pending leave requests',
      value: leaveStats.pending ?? 0,
      href: '/leave',
      icon: CalendarDays,
      tone: 'bg-rose-500/10 text-rose-600',
    },
    isModuleActive(modules, 'hostel') && {
      label: 'Hostel occupancy',
      value:
        hostelStats.occupancyPct != null ? `${Number(hostelStats.occupancyPct).toFixed(0)}%` : '—',
      href: '/hostel',
      icon: BedDouble,
      tone: 'bg-fuchsia-500/10 text-fuchsia-600',
    },
  ].filter(Boolean) as Array<{
    label: string;
    value: string | number;
    href: string;
    icon: React.ElementType;
    tone: string;
  }>;

  const feeSeries = lastMonthsSeries(feeTrendData);

  const attendanceSeries = (attendanceTrendData || []).slice(-7).map((d: any) => {
    const total = d.PRESENT + d.ABSENT + d.LATE + d.LEAVE;
    return {
      day: new Date(d.date).toLocaleString('en-IN', { weekday: 'short' }),
      rate: total > 0 ? Math.round(((d.PRESENT + d.LATE) / total) * 100) : 0,
    };
  });

  const todayPresent = Number(coreStats.attendance?.today?.present ?? 0);
  const todayAbsent = Number(coreStats.attendance?.today?.absent ?? 0);
  const todayRate = Number(coreStats.attendance?.percentage ?? 0);
  const collected = Number(coreStats.fees?.monthlyRevenue ?? 0);
  const outstanding = Number(coreStats.fees?.outstandingDues ?? 0);
  const collectedPct =
    collected + outstanding > 0 ? Math.round((collected / (collected + outstanding)) * 100) : 0;

  return (
    <div className="flex min-w-0 flex-col gap-4 pb-6 sm:gap-6">
      {/* Hero + today's attendance */}
      <HeroCard
        eyebrow={
          <>
            <Sparkles className="size-3.5" /> {todayLabel()}
            {currentAY?.name && <span className="opacity-75">· Session {currentAY.name}</span>}
          </>
        }
        title={
          <>
            {greeting()}, {activeUser?.name?.split(' ')[0] || 'there'} 👋
          </>
        }
        subtitle={`Here’s how ${activeTenant?.name || 'your school'} is doing today.`}
        actions={
          <>
            <HeroButton href="/students/admissions">
              <UserPlus className="size-4" /> New admission
            </HeroButton>
            {isModuleActive(modules, 'fee') && (
              <HeroButton href="/fee" variant="glass">
                <IndianRupee className="size-4" /> Collect fee
              </HeroButton>
            )}
          </>
        }
        aside={
          isModuleActive(modules, 'attendance') && (
            <div className="glass flex w-full items-center gap-4 rounded-3xl p-4 sm:w-auto sm:gap-5 sm:pr-6">
              <RadialGauge value={todayRate} light size={124} sublabel="present" />
              <div className="space-y-2 text-sm">
                <p className="font-display text-base font-semibold">Today’s attendance</p>
                <p className="flex items-center gap-2 text-white/85">
                  <span className="size-2 rounded-full bg-emerald-300" /> {todayPresent} present
                </p>
                <p className="flex items-center gap-2 text-white/85">
                  <span className="size-2 rounded-full bg-rose-300" /> {todayAbsent} absent
                </p>
              </div>
            </div>
          )
        }
      />

      {(subStatus === 'TRIAL' || subStatus === 'PAST_DUE') && (
        <div
          className={`flex items-start gap-3 rounded-2xl border p-4 text-[13px] ${
            subStatus === 'PAST_DUE'
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
          }`}
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            {subStatus === 'PAST_DUE' ? (
              <p className="font-semibold">
                Your {subscription?.planName ?? ''} subscription payment is overdue. Please clear
                the dues to avoid suspension.
              </p>
            ) : (
              <p className="font-semibold">
                You are on a free trial of the {subscription?.planName ?? ''} plan
                {trialDaysLeft !== null
                  ? ` — ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left`
                  : ''}
                {subscription?.trialEndsAt ? ` (ends ${formatDate(subscription.trialEndsAt)})` : ''}
                .
              </p>
            )}
            <a href="/settings" className="text-xs underline">
              View subscription
            </a>
          </div>
        </div>
      )}

      {/* Setup checklist — only until the school is fully configured */}
      {!adminPending && completedSteps < totalSteps && (
        <Panel className="overflow-hidden p-0 sm:p-0">
          <button
            type="button"
            onClick={toggleChecklist}
            className="flex min-h-[64px] w-full items-center gap-3 p-4 text-left sm:gap-4 sm:p-6"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/25 sm:size-12">
              <Rocket className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-foreground sm:text-lg">
                Finish setting up your school
              </span>
              <span className="block text-[13px] text-muted-foreground">
                {completedSteps} of {totalSteps} steps done — complete the rest to unlock every
                feature.
              </span>
            </span>
            <span className="hidden items-center gap-3 sm:flex">
              <span className="h-2.5 w-40 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
                <span
                  className="block h-full rounded-full bg-brand-gradient transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </span>
              <span className="font-display w-10 text-sm font-semibold">{progressPct}%</span>
            </span>
            <ChevronDown
              className={`size-4 shrink-0 text-muted-foreground transition-transform ${isChecklistCollapsed ? '' : 'rotate-180'}`}
            />
          </button>
          {!isChecklistCollapsed && (
            <div className="grid grid-cols-1 gap-3 border-t border-border p-4 sm:p-6 md:grid-cols-2 lg:grid-cols-3">
              {setupSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <a
                    key={step.title}
                    href={step.link}
                    className={`group flex items-start gap-3 rounded-2xl border p-4 no-underline transition-all ${
                      step.completed
                        ? 'border-emerald-500/20 bg-emerald-500/[0.06]'
                        : 'border-border hover:-translate-y-0.5 hover:shadow-card-hover'
                    }`}
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${step.completed ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-500 dark:bg-white/5'}`}
                    >
                      {step.completed ? <Check className="size-4" /> : <Icon className="size-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-zinc-900 dark:text-white">
                        <span className="text-zinc-400">{idx + 1}.</span> {step.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-zinc-500">
                        {step.completed ? 'Done' : step.desc}
                      </span>
                    </span>
                  </a>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {isModuleActive(modules, 'student') && (
          <StatCard
            label="Total students"
            value={coreStats.students?.total ?? '—'}
            icon={GraduationCap}
            gradientClass="from-violet-500 to-indigo-500"
            footerText={`${coreStats.students?.active ?? 0} currently active`}
            loading={adminPending}
          />
        )}
        {isModuleActive(modules, 'staff') && (
          <StatCard
            label="Staff members"
            value={coreStats.staff?.total ?? '—'}
            icon={IdCard}
            gradientClass="from-sky-400 to-cyan-500"
            footerText="Teachers and office staff"
            loading={adminPending}
          />
        )}
        {isModuleActive(modules, 'fee') && (
          <StatCard
            label="Collected this month"
            value={inr(collected)}
            icon={IndianRupee}
            gradientClass="from-amber-400 to-orange-500"
            footerText={`${inr(outstanding)} still outstanding`}
            loading={adminPending}
          />
        )}
        {isModuleActive(modules, 'library') ? (
          <StatCard
            label="Library books"
            value={coreStats.library?.totalBooks ?? '—'}
            icon={BookOpen}
            gradientClass="from-pink-500 to-rose-500"
            footerText={`${coreStats.library?.overdueBooks ?? 0} overdue right now`}
            loading={adminPending}
          />
        ) : (
          <StatCard
            label="Attendance today"
            value={`${todayRate.toFixed(0)}%`}
            icon={ClipboardCheck}
            gradientClass="from-emerald-400 to-teal-500"
            footerText={`${todayPresent} present · ${todayAbsent} absent`}
            loading={adminPending}
          />
        )}
      </div>

      {/* Trends */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Fee collection"
          subtitle="Amount collected each month"
          action={<PanelLink href="/analytics">Full report</PanelLink>}
        >
          {feeSeries.some((d) => d.amount > 0) ? (
            <AreaTrend data={feeSeries} xKey="month" yKey="amount" format={inr} />
          ) : (
            <EmptyState
              icon={BarChart3}
              text="No fee collections recorded yet. Collected fees will chart here month by month."
              className="h-[260px]"
            />
          )}
        </Panel>

        <Panel title="Fee status" subtitle="This month’s collections vs. dues">
          <Donut
            data={[
              { name: 'Collected', value: collected, color: 'var(--brand)' },
              { name: 'Outstanding', value: outstanding, color: '#ffb547' },
            ]}
            center={`${collectedPct}%`}
            caption="collected"
          />
          <div className="mt-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
            <div className="rounded-2xl bg-brand-soft p-3 dark:bg-white/5">
              <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="size-2 rounded-full bg-brand" /> Collected
              </p>
              <p className="tabular mt-1 truncate text-lg font-semibold">{inr(collected)}</p>
            </div>
            <div className="rounded-2xl bg-amber-500/[0.08] p-3">
              <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="size-2 rounded-full bg-[#ffb547]" /> Outstanding
              </p>
              <p className="tabular mt-1 truncate text-lg font-semibold">{inr(outstanding)}</p>
            </div>
          </div>
        </Panel>
      </div>

      {/* Actions, attendance, glance */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
        <Panel title="Quick actions" subtitle="Jump straight into the daily tasks">
          <QuickActions actions={quickActions} columns={2} />
        </Panel>

        <Panel title="Attendance this week" subtitle="Share of students present each day">
          {attendanceSeries.length > 0 ? (
            <BarTrend
              data={attendanceSeries}
              xKey="day"
              yKey="rate"
              domainMax={100}
              format={(v) => `${v}% present`}
              colorFor={(v) => (v >= 90 ? '#10c38e' : v >= 75 ? '#ffb547' : '#f0435c')}
              height={250}
            />
          ) : (
            <EmptyState
              icon={ClipboardCheck}
              text="No attendance marked yet this week."
              className="h-[250px]"
            />
          )}
        </Panel>

        <Panel title="At a glance" subtitle="Things that may need your attention">
          <div className="divide-y divide-border">
            {glance.map((g) => (
              <GlanceRow
                key={g.label}
                icon={g.icon}
                label={g.label}
                value={adminPending ? '…' : g.value}
                href={g.href}
                tone={g.tone}
              />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
