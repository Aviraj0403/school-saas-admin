'use client';

import React from 'react';
import {
  BookOpenCheck,
  CalendarClock,
  CalendarMinus,
  ClipboardCheck,
  Clock,
  FileText,
  Megaphone,
  PencilLine,
  Upload,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { useAuthStore } from '@/store/useAuthStore';
import { useCurrentAcademicYear } from '@/hooks/queries/useAcademics';
import { useAnnouncements } from '@/hooks/queries/useCommunication';
import { useAssignments } from '@/hooks/queries/useHomework';
import { useLeavesList } from '@/hooks/queries/useLeave';
import { useExamsList } from '@/hooks/queries/useExams';
import { asList } from '@/lib/utils';
import { formatDate, isUpcoming } from '@/lib/format';
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

export function TeacherDashboard() {
  const { activeUser } = useAuthStore();
  const { data: currentAY } = useCurrentAcademicYear();
  const { data: announcementsData, isPending: announcementsPending } = useAnnouncements(
    1,
    4,
    'TEACHER'
  );
  const { data: assignmentsData, isPending: assignmentsPending } = useAssignments();
  const { data: examsData, isPending: examsPending } = useExamsList();
  const { data: leavesData, isPending: leavesPending } = useLeavesList(1, 20, {
    applicantId: activeUser?.id,
    applicantType: 'STAFF',
  });

  const assignments = asList(assignmentsData);
  const announcements = asList(announcementsData);
  const exams = asList(examsData);
  const leaves = asList(leavesData);

  const openAssignments = assignments.filter((a: any) => isUpcoming(a.dueDate));
  const upcomingExams = exams
    .filter((e: any) => isUpcoming(e.endDate ?? e.startDate))
    .sort((a: any, b: any) => +new Date(a.startDate) - +new Date(b.startDate));
  const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING').length;

  return (
    <div className="flex flex-col gap-6 pb-6">
      <HeroCard
        eyebrow={
          <>
            <CalendarClock className="size-3.5" /> {todayLabel()}
            {currentAY?.name && <span className="opacity-75">· Session {currentAY.name}</span>}
          </>
        }
        title={
          <>
            {greeting()}, {activeUser?.name?.split(' ')[0] || 'Teacher'} 👋
          </>
        }
        subtitle="Your classroom at a glance — attendance, homework, exams and notices."
        actions={
          <>
            <HeroButton href="/attendance">
              <ClipboardCheck className="size-4" /> Mark attendance
            </HeroButton>
            <HeroButton href="/assignments" variant="glass">
              <Upload className="size-4" /> Add homework
            </HeroButton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Homework set"
          value={assignments.length}
          icon={BookOpenCheck}
          gradientClass="from-violet-500 to-indigo-500"
          footerText={`${openAssignments.length} still open for submission`}
          loading={assignmentsPending}
        />
        <StatCard
          label="Upcoming exams"
          value={upcomingExams.length}
          icon={PencilLine}
          gradientClass="from-pink-500 to-rose-500"
          footerText={upcomingExams[0] ? `Next: ${upcomingExams[0].name}` : 'Nothing scheduled'}
          loading={examsPending}
        />
        <StatCard
          label="Notices for staff"
          value={announcements.length}
          icon={Megaphone}
          gradientClass="from-amber-400 to-orange-500"
          footerText="Latest school circulars"
          loading={announcementsPending}
        />
        <StatCard
          label="My leave requests"
          value={leaves.length}
          icon={CalendarMinus}
          gradientClass="from-emerald-400 to-teal-500"
          footerText={`${pendingLeaves} awaiting approval`}
          loading={leavesPending}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Teaching tools" subtitle="Everything you use every day">
          <QuickActions
            columns={2}
            actions={[
              {
                label: 'Mark attendance',
                href: '/attendance',
                icon: ClipboardCheck,
                gradient: 'from-emerald-400 to-teal-500',
              },
              {
                label: 'Homework',
                href: '/assignments',
                icon: Upload,
                gradient: 'from-violet-500 to-indigo-500',
              },
              {
                label: 'Timetable',
                href: '/academics/timetable',
                icon: Clock,
                gradient: 'from-sky-400 to-cyan-500',
              },
              {
                label: 'Lesson plans',
                href: '/academics/lesson-plans',
                icon: FileText,
                gradient: 'from-amber-400 to-orange-500',
              },
              {
                label: 'Exams & marks',
                href: '/exams',
                icon: PencilLine,
                gradient: 'from-pink-500 to-rose-500',
              },
              {
                label: 'Apply for leave',
                href: '/leave',
                icon: CalendarMinus,
                gradient: 'from-fuchsia-500 to-purple-600',
              },
            ]}
          />
        </Panel>

        <Panel
          title="Homework due"
          subtitle="Assignments still open"
          action={<PanelLink href="/assignments">All homework</PanelLink>}
        >
          {openAssignments.length > 0 ? (
            <ul className="space-y-2.5">
              {openAssignments.slice(0, 5).map((a: any) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-2xl border border-border p-3"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                    <BookOpenCheck className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-zinc-900 dark:text-white">
                      {a.title}
                    </span>
                    <span className="block text-xs text-zinc-500">Due {formatDate(a.dueDate)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={BookOpenCheck}
              text="No homework is open right now. New assignments will appear here."
            />
          )}
        </Panel>

        <Panel
          title="Staff notices"
          subtitle="Circulars from the office"
          action={<PanelLink href="/communication">All notices</PanelLink>}
        >
          {announcements.length > 0 ? (
            <ul className="space-y-2.5">
              {announcements.slice(0, 4).map((n: any) => (
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
              text={announcementsPending ? 'Loading notices…' : 'No notices for staff today.'}
            />
          )}
        </Panel>
      </div>

      <Panel
        title="Exam calendar"
        subtitle="Upcoming assessments this session"
        action={<PanelLink href="/exams">Exams</PanelLink>}
      >
        {upcomingExams.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {upcomingExams.slice(0, 4).map((e: any) => (
              <div key={e.id} className="rounded-2xl border border-border p-4">
                <p className="text-xs font-medium text-pink-600">{formatDate(e.startDate)}</p>
                <p className="mt-1 font-display text-base font-semibold text-zinc-900 dark:text-white">
                  {e.name}
                </p>
                <p className="text-xs text-zinc-500">Ends {formatDate(e.endDate)}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={PencilLine} text="No upcoming exams have been scheduled." />
        )}
      </Panel>
    </div>
  );
}
