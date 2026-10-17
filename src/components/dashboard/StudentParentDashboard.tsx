'use client';

import React from 'react';
import {
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  Clock,
  IndianRupee,
  Megaphone,
  PartyPopper,
  PencilLine,
  Trophy,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { useAuthStore } from '@/store/useAuthStore';
import { useCurrentAcademicYear } from '@/hooks/queries/useAcademics';
import { useAnnouncements, useEvents } from '@/hooks/queries/useCommunication';
import { useAssignments } from '@/hooks/queries/useHomework';
import { useExamsList } from '@/hooks/queries/useExams';
import { asList } from '@/lib/utils';
import { formatDate, isUpcoming } from '@/lib/format';
import { normalizeRole } from '@/config/navigation';
import {
  HeroCard,
  HeroButton,
  Panel,
  PanelLink,
  EmptyState,
  QuickActions,
  greeting,
  todayLabel,
} from './kit';

export function StudentParentDashboard() {
  const { activeUser, activeTenant } = useAuthStore();
  const isParent = normalizeRole(activeUser?.role || '') === 'parent';
  const { data: currentAY } = useCurrentAcademicYear();
  const { data: announcementsData, isPending: noticesPending } = useAnnouncements(1, 5, 'STUDENT');
  const { data: eventsData, isPending: eventsPending } = useEvents();
  const { data: homeworkData, isPending: homeworkPending } = useAssignments();
  const { data: examsData, isPending: examsPending } = useExamsList();

  const notices = asList(announcementsData);
  const homework = asList(homeworkData);
  const openHomework = homework.filter((h: any) => isUpcoming(h.dueDate));
  const upcomingExams = asList(examsData)
    .filter((e: any) => isUpcoming(e.endDate ?? e.startDate))
    .sort((a: any, b: any) => +new Date(a.startDate) - +new Date(b.startDate));
  const upcomingEvents = asList(eventsData)
    .filter((e: any) => isUpcoming(e.endDate ?? e.startDate))
    .sort((a: any, b: any) => +new Date(a.startDate) - +new Date(b.startDate));

  const who = isParent ? 'your child' : 'you';

  return (
    <div className="flex flex-col gap-6 pb-6">
      <HeroCard
        eyebrow={
          <>
            <CalendarDays className="size-3.5" /> {todayLabel()}
            {currentAY?.name && <span className="opacity-75">· Session {currentAY.name}</span>}
          </>
        }
        title={
          <>
            {greeting()}, {activeUser?.name?.split(' ')[0] || 'there'} 👋
          </>
        }
        subtitle={`Everything happening at ${activeTenant?.name || 'school'} for ${who} — homework, exams, events and notices.`}
        actions={
          <>
            <HeroButton href="/assignments">
              <BookOpenCheck className="size-4" /> {isParent ? 'View homework' : 'My homework'}
            </HeroButton>
            <HeroButton href="/exams" variant="glass">
              <Trophy className="size-4" /> Exam results
            </HeroButton>
          </>
        }
        aside={
          upcomingExams[0] && (
            <div className="glass w-64 rounded-3xl p-5">
              <p className="text-xs text-white/70">Next exam</p>
              <p className="mt-1 font-display text-xl font-semibold leading-tight">
                {upcomingExams[0].name}
              </p>
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs">
                <CalendarDays className="size-3.5" /> {formatDate(upcomingExams[0].startDate)}
              </p>
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Homework due"
          value={openHomework.length}
          icon={BookOpenCheck}
          gradientClass="from-violet-500 to-indigo-500"
          footerText={`${homework.length} set this session`}
          loading={homeworkPending}
        />
        <StatCard
          label="Upcoming exams"
          value={upcomingExams.length}
          icon={PencilLine}
          gradientClass="from-pink-500 to-rose-500"
          footerText={
            upcomingExams[0]
              ? `Starts ${formatDate(upcomingExams[0].startDate)}`
              : 'Nothing scheduled'
          }
          loading={examsPending}
        />
        <StatCard
          label="School events"
          value={upcomingEvents.length}
          icon={PartyPopper}
          gradientClass="from-amber-400 to-orange-500"
          footerText={upcomingEvents[0] ? upcomingEvents[0].title : 'No events coming up'}
          loading={eventsPending}
        />
        <StatCard
          label="New notices"
          value={notices.length}
          icon={Megaphone}
          gradientClass="from-emerald-400 to-teal-500"
          footerText="From the school office"
          loading={noticesPending}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Shortcuts" subtitle="Where you’ll go most often">
          <QuickActions
            columns={2}
            actions={[
              {
                label: 'Timetable',
                href: '/academics/timetable',
                icon: Clock,
                gradient: 'from-sky-400 to-cyan-500',
              },
              {
                label: 'Attendance',
                href: '/attendance',
                icon: ClipboardCheck,
                gradient: 'from-emerald-400 to-teal-500',
              },
              {
                label: 'Fees',
                href: '/fee',
                icon: IndianRupee,
                gradient: 'from-amber-400 to-orange-500',
              },
              {
                label: 'Homework',
                href: '/assignments',
                icon: BookOpenCheck,
                gradient: 'from-violet-500 to-indigo-500',
              },
              {
                label: 'Library',
                href: '/library',
                icon: BookOpen,
                gradient: 'from-fuchsia-500 to-purple-600',
              },
              {
                label: 'Results',
                href: '/exams',
                icon: Trophy,
                gradient: 'from-pink-500 to-rose-500',
              },
            ]}
          />
        </Panel>

        <Panel
          title="Homework"
          subtitle="What’s due next"
          action={<PanelLink href="/assignments">All</PanelLink>}
        >
          {openHomework.length > 0 ? (
            <ul className="space-y-2.5">
              {openHomework.slice(0, 5).map((h: any) => (
                <li
                  key={h.id}
                  className="flex items-center gap-3 rounded-2xl border border-border p-3"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                    <BookOpenCheck className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
                      {h.title}
                    </span>
                    <span className="block text-xs text-zinc-500">Due {formatDate(h.dueDate)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={BookOpenCheck}
              text={
                homeworkPending
                  ? 'Loading homework…'
                  : 'All caught up — no homework due right now. 🎉'
              }
            />
          )}
        </Panel>

        <Panel
          title="Notice board"
          subtitle="Latest from school"
          action={<PanelLink href="/communication">All</PanelLink>}
        >
          {notices.length > 0 ? (
            <ul className="space-y-2.5">
              {notices.slice(0, 4).map((n: any) => (
                <li key={n.id} className="rounded-2xl bg-zinc-50 p-3.5 dark:bg-white/[0.03]">
                  <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">
                    {n.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                    {n.content || n.description}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Megaphone}
              text={noticesPending ? 'Loading notices…' : 'No new notices.'}
            />
          )}
        </Panel>
      </div>

      <Panel
        title="Coming up"
        subtitle="Exams and school events"
        action={<PanelLink href="/communication">Calendar</PanelLink>}
      >
        {upcomingExams.length + upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ...upcomingExams
                .slice(0, 2)
                .map((e: any) => ({ id: e.id, title: e.name, date: e.startDate, kind: 'Exam' })),
              ...upcomingEvents
                .slice(0, 2)
                .map((e: any) => ({ id: e.id, title: e.title, date: e.startDate, kind: 'Event' })),
            ].map((item) => (
              <div
                key={item.kind + item.id}
                className="flex gap-3 rounded-2xl border border-border p-4"
              >
                <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-soft py-1.5 dark:bg-white/5">
                  <span className="text-[10px] font-semibold uppercase text-brand">
                    {new Date(item.date).toLocaleString('en-IN', { month: 'short' })}
                  </span>
                  <span className="font-display text-lg font-semibold leading-none text-zinc-900 dark:text-white">
                    {new Date(item.date).getDate()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    {item.kind}
                  </p>
                  <p className="truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
                    {item.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={CalendarDays} text="Nothing on the calendar yet." />
        )}
      </Panel>
    </div>
  );
}
