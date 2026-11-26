'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  Clock,
  IndianRupee,
  Megaphone,
  PartyPopper,
  Trophy,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { useCurrentAcademicYear } from '@/hooks/queries/useAcademics';
import {
  useFamilyAnnouncements,
  useFamilyAttendance,
  useFamilyEvents,
  useFamilyFees,
  useFamilyHomework,
  useFamilyResults,
  useFamilyTimetable,
} from '@/hooks/queries/useFamily';
import { ChildSwitcher } from '@/components/portal/ChildSwitcher';
import { useSelectedChild } from '@/components/portal/useChildStore';
import { formatDate, isUpcoming } from '@/lib/format';
import { HeroCard, Panel, PanelLink, EmptyState, greeting, todayLabel, inr } from './kit';

export function StudentParentDashboard() {
  const { activeUser, activeTenant } = useAuthStore();
  const { child, studentId, isParent, hasChildren } = useSelectedChild();
  const { data: currentAY } = useCurrentAcademicYear();

  const now = new Date();
  const attendance = useFamilyAttendance(studentId, now.getMonth() + 1, now.getFullYear());
  const timetable = useFamilyTimetable(studentId);
  const homework = useFamilyHomework(studentId);
  const results = useFamilyResults(studentId);
  const fees = useFamilyFees(studentId);
  const notices = useFamilyAnnouncements(isParent ? 'PARENT' : 'STUDENT', 4);
  const events = useFamilyEvents();

  const nextPeriods = useMemo(() => {
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return ((timetable.data?.slots?.slots ?? []) as any[])
      .filter((s) => s.dayOfWeek === now.getDay() && (s.endTime ?? s.startTime) >= hhmm)
      .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))
      .slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timetable.data]);

  const dueSoon = useMemo(
    () =>
      (homework.data ?? [])
        .filter((h) => !h.submission && isUpcoming(h.dueDate))
        .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
        .slice(0, 4),
    [homework.data]
  );

  const latestResult = useMemo(() => {
    const rows = (results.data ?? []) as any[];
    if (rows.length === 0) return null;
    const latestExamId = [...rows].sort(
      (a, b) => +new Date(b.exam?.startDate ?? 0) - +new Date(a.exam?.startDate ?? 0)
    )[0].examId;
    const sub = rows.filter((r) => r.examId === latestExamId);
    const obtained = sub.reduce((s, r) => s + (r.isAbsent ? 0 : Number(r.marksObtained ?? 0)), 0);
    const hasMax = sub.every((r) => r.maxMarks != null);
    const max = sub.reduce((s, r) => s + Number(r.maxMarks ?? 0), 0);
    return { name: sub[0].exam?.name as string, obtained, max, hasMax };
  }, [results.data]);

  const upcomingEvents = useMemo(
    () =>
      (events.data ?? [])
        .filter((e) => isUpcoming(e.endDate ?? e.startDate))
        .sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate))
        .slice(0, 3),
    [events.data]
  );

  const totalDue = Number(fees.data?.totalDue ?? 0);
  const att = attendance.data;
  const who = isParent ? child?.name || 'your child' : 'you';

  return (
    <div className="flex min-w-0 flex-col gap-4 pb-4 sm:gap-6">
      <HeroCard
        eyebrow={
          <>
            <CalendarDays className="size-3.5" /> {todayLabel()}
            {currentAY?.name && <span className="opacity-75">· Session {currentAY.name}</span>}
          </>
        }
        title={
          <>
            {greeting()}, {activeUser?.name?.split(' ')[0] || 'there'}
          </>
        }
        subtitle={`Everything happening at ${activeTenant?.name || 'school'} for ${who} — attendance, homework, results, fees and notices.`}
      />

      <ChildSwitcher />

      {!hasChildren ? (
        <EmptyState
          icon={CalendarDays}
          text="No student is linked to this account yet. Please ask the school office to link your child."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            <StatCard
              label="Attendance this month"
              value={att && att.total > 0 ? `${att.percentage}%` : '—'}
              icon={ClipboardCheck}
              gradientClass="from-emerald-400 to-teal-500"
              footerText={
                att && att.total > 0
                  ? `${att.present} present · ${att.absent} absent`
                  : 'Not marked yet'
              }
              loading={attendance.isPending}
            />
            <StatCard
              label="Homework due"
              value={dueSoon.length}
              icon={BookOpenCheck}
              gradientClass="from-violet-500 to-indigo-500"
              footerText={dueSoon[0] ? `Next: ${dueSoon[0].title}` : 'All caught up'}
              loading={homework.isPending}
            />
            <StatCard
              label="Latest result"
              value={
                latestResult
                  ? latestResult.hasMax && latestResult.max > 0
                    ? `${((latestResult.obtained / latestResult.max) * 100).toFixed(1)}%`
                    : String(latestResult.obtained)
                  : '—'
              }
              icon={Trophy}
              gradientClass="from-pink-500 to-rose-500"
              footerText={latestResult ? latestResult.name : 'No results yet'}
              loading={results.isPending}
            />
            <StatCard
              label="Fee due"
              value={inr(totalDue)}
              icon={IndianRupee}
              gradientClass="from-amber-400 to-orange-500"
              footerText={totalDue > 0 ? 'Outstanding balance' : 'No dues'}
              loading={fees.isPending}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Panel
              title="Today’s periods"
              subtitle="Next three on the timetable"
              action={<PanelLink href="/portal/timetable">Timetable</PanelLink>}
            >
              {nextPeriods.length > 0 ? (
                <ul className="space-y-2.5">
                  {nextPeriods.map((s: any) => (
                    <li
                      key={s.id}
                      className="flex min-h-14 items-center gap-3 rounded-2xl border border-border p-3"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
                        <Clock className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
                          {s.subject?.name ?? 'Class'}
                        </span>
                        <span className="block text-xs text-zinc-500">
                          {s.startTime} – {s.endTime}
                          {s.teacher?.name ? ` · ${s.teacher.name}` : ''}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={Clock}
                  text={timetable.isPending ? 'Loading timetable…' : 'No more periods today.'}
                />
              )}
            </Panel>

            <Panel
              title="Homework"
              subtitle="Not yet submitted"
              action={<PanelLink href="/portal/homework">All</PanelLink>}
            >
              {dueSoon.length > 0 ? (
                <ul className="space-y-2.5">
                  {dueSoon.map((h: any) => (
                    <li
                      key={h.id}
                      className="flex min-h-14 items-center gap-3 rounded-2xl border border-border p-3"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                        <BookOpenCheck className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
                          {h.title}
                        </span>
                        <span className="block text-xs text-zinc-500">
                          {h.subject} · due {formatDate(h.dueDate)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={BookOpenCheck}
                  text={homework.isPending ? 'Loading homework…' : 'No homework due right now.'}
                />
              )}
            </Panel>

            <Panel title="Fees" subtitle="Balance for the session">
              <div className="flex flex-col items-stretch gap-4 sm:items-start">
                <p className="tabular text-3xl font-semibold text-foreground">{inr(totalDue)}</p>
                <p className="text-sm text-zinc-500">
                  {totalDue > 0
                    ? `Paid so far ${inr(fees.data?.totalPaid)}`
                    : 'There are no outstanding fees.'}
                </p>
                <Link href="/portal/fees" className="block w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto"
                    variant={totalDue > 0 ? 'default' : 'outline'}
                  >
                    <IndianRupee /> {totalDue > 0 ? 'Pay now' : 'View receipts'}
                  </Button>
                </Link>
              </div>
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Panel title="Notice board" subtitle="Latest from school">
              {(notices.data ?? []).length > 0 ? (
                <ul className="space-y-2.5">
                  {(notices.data ?? []).map((n: any) => (
                    <li key={n.id} className="rounded-2xl bg-zinc-50 p-3.5 dark:bg-white/[0.03]">
                      <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">
                        {n.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{n.content}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={Megaphone}
                  text={notices.isPending ? 'Loading notices…' : 'No new notices.'}
                />
              )}
            </Panel>

            <Panel title="Coming up" subtitle="School events">
              {upcomingEvents.length > 0 ? (
                <ul className="space-y-2.5">
                  {upcomingEvents.map((e: any) => (
                    <li key={e.id} className="flex gap-3 rounded-2xl border border-border p-3">
                      <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-soft py-1.5 dark:bg-white/5">
                        <span className="text-[10px] font-semibold uppercase text-brand">
                          {new Date(e.startDate).toLocaleString('en-IN', { month: 'short' })}
                        </span>
                        <span className="font-display text-lg font-semibold leading-none text-zinc-900 dark:text-white">
                          {new Date(e.startDate).getDate()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
                          {e.title}
                        </p>
                        {e.description && (
                          <p className="line-clamp-1 text-xs text-zinc-500">{e.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={PartyPopper}
                  text={events.isPending ? 'Loading events…' : 'Nothing on the calendar yet.'}
                />
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
