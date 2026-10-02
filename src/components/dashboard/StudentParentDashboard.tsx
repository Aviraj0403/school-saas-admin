'use client';

import React from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { useAuthStore } from '@/store/useAuthStore';
import { useCurrentAcademicYear } from '@/hooks/queries/useAcademics';
import { useAnnouncements } from '@/hooks/queries/useCommunication';
import { useStudentAssignments } from '@/hooks/queries/useHomework';

export function StudentParentDashboard() {
  const { activeUser } = useAuthStore();
  const { data: currentAY } = useCurrentAcademicYear();
  const { data: announcementsData } = useAnnouncements(1, 4, 'STUDENT');
  const { data: studentAssignmentsData } = useStudentAssignments(activeUser?.id || '');

  const pendingAssignmentsCount = Array.isArray(studentAssignmentsData)
    ? studentAssignmentsData.filter((a: any) => !a.submitted).length
    : 2;

  const greeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const announcementsList = announcementsData?.items || announcementsData || [];

  return (
    <div className="flex flex-col gap-5 sm:gap-7 md:gap-8 pb-6 md:pb-10 mt-1">
      {/* Welcome Section */}
      <div className="border-b border-zinc-200 dark:border-zinc-800/80 pb-5 flex flex-col sm:flex-row sm:justify-between sm:items-end flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            {greeting()}, {activeUser?.name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
            Here is your personal academic overview and class schedule today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-semibold">
            Role: Student / Guardian Portal
          </span>
          <span className="px-3.5 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg text-[11px] font-bold uppercase tracking-widest shadow-sm">
            Term: {currentAY?.name || 'Active Term'}
          </span>
        </div>
      </div>

      {/* Student Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Pending Assignments"
          value={pendingAssignmentsCount}
          icon="pi pi-file-edit"
          gradientClass="from-blue-500 to-blue-500"
          iconBgClass="bg-blue-500/10"
          iconColorClass="text-blue-600 dark:text-blue-400"
          footerText="Assignments due this week"
          loading={false}
        />
        <StatCard
          label="My Attendance"
          value="98%"
          icon="pi pi-check-square"
          gradientClass="from-emerald-500 to-teal-500"
          iconBgClass="bg-emerald-500/10"
          iconColorClass="text-emerald-600 dark:text-emerald-400"
          footerText="Present 48/49 school days"
          loading={false}
        />
        <StatCard
          label="Unpaid Dues"
          value="₹0"
          icon="pi pi-wallet"
          gradientClass="from-amber-500 to-yellow-500"
          iconBgClass="bg-amber-500/10"
          iconColorClass="text-amber-600 dark:text-amber-400"
          footerText="Fee balance all clear"
          loading={false}
        />
        <StatCard
          label="Upcoming Exams"
          value="1 Exam"
          icon="pi pi-calendar"
          gradientClass="from-purple-500 to-violet-500"
          iconBgClass="bg-purple-500/10"
          iconColorClass="text-purple-600 dark:text-purple-400"
          footerText="Mid-terms schedule updated"
          loading={false}
        />
      </div>

      {/* Student Quick Actions */}
      <div className="premium-glow-effect border border-zinc-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 sm:p-6 overflow-hidden">
        <h3 className="font-bold text-zinc-800 dark:text-white text-lg mb-4 sm:mb-6">
          Student Portal Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
          {[
            {
              label: 'View Timetable',
              icon: 'pi pi-clock',
              href: '/academics/timetable',
              color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
            },
            {
              label: 'My Attendance',
              icon: 'pi pi-check-square',
              href: '/attendance',
              color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            },
            {
              label: 'Pay Fees',
              icon: 'pi pi-money-bill',
              href: '/fee/slabs',
              color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold',
            },
            {
              label: 'Assignments',
              icon: 'pi pi-upload',
              href: '/assignments',
              color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
            },
            {
              label: 'Library Books',
              icon: 'pi pi-bookmark',
              href: '/library/books',
              color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
            },
            {
              label: 'Exam Results',
              icon: 'pi pi-chart-bar',
              href: '/exams',
              color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
            },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className={`flex flex-col items-center gap-3 p-5 rounded-xl ${action.color} hover:opacity-90 hover:scale-[1.03] hover:shadow-md transition-all duration-300 cursor-pointer no-underline border border-zinc-100 dark:border-zinc-800`}
            >
              <i className={`${action.icon} text-2xl`}></i>
              <span className="text-xs font-bold text-center leading-tight">{action.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Student Announcements & Class Timetable Widget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
        {/* Today's Timetable */}
        <div className="premium-glow-effect border border-zinc-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="font-bold text-zinc-800 dark:text-white text-lg">
                Today's Class Schedule
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Your daily subject period timetable</p>
            </div>
            <a
              href="/academics/timetable"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Full Timetable &rarr;
            </a>
          </div>

          <div className="flex flex-col gap-3">
            {[
              {
                time: '09:00 - 09:45 AM',
                subject: 'Mathematics',
                teacher: 'Mr. Sharma',
                room: 'Room 201',
              },
              {
                time: '09:45 - 10:30 AM',
                subject: 'English Grammar',
                teacher: 'Ms. Gupta',
                room: 'Room 201',
              },
              {
                time: '10:45 - 11:30 AM',
                subject: 'Science & Physics',
                teacher: 'Dr. Verma',
                room: 'Lab 2',
              },
            ].map((slot, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150/60 dark:border-zinc-800/80"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    <i className="pi pi-clock"></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {slot.subject}
                    </h4>
                    <p className="text-[11px] text-zinc-400 font-semibold">
                      {slot.teacher} • {slot.room}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-md text-[10px] font-extrabold uppercase">
                  {slot.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Student Notices */}
        <div className="premium-glow-effect border border-zinc-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="font-bold text-zinc-800 dark:text-white text-lg">School Notices</h3>
              <p className="text-xs text-zinc-400 mt-1">Announcements for students & parents</p>
            </div>
            <a
              href="/communication"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              All Notices &rarr;
            </a>
          </div>

          <div className="flex flex-col gap-3">
            {announcementsList && announcementsList.length > 0 ? (
              announcementsList.slice(0, 3).map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150/60 dark:border-zinc-800/80"
                >
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                    {item.content || item.description}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                No active announcements for students today.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
