'use client';

import React from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { useAuthStore } from '@/store/useAuthStore';
import { useBooksList, useActiveIssues, useOverdueIssues } from '@/hooks/queries/useLibrary';

export function LibrarianDashboard() {
  const { activeUser } = useAuthStore();
  const { data: booksData, isPending: booksPending } = useBooksList(1, 10);
  const { data: activeIssuesData, isPending: issuesPending } = useActiveIssues();
  const { data: overdueIssuesData } = useOverdueIssues();

  const totalBooks = booksData?.meta?.total || booksData?.items?.length || 0;
  const activeIssuesList = Array.isArray(activeIssuesData)
    ? activeIssuesData
    : activeIssuesData?.items || [];
  const overdueIssuesList = Array.isArray(overdueIssuesData)
    ? overdueIssuesData
    : overdueIssuesData?.items || [];

  const greeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-7 md:gap-8 pb-6 md:pb-10 mt-1">
      {/* Welcome Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800/80 pb-5 flex flex-col sm:flex-row sm:justify-between sm:items-end flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            {greeting()}, {activeUser?.name?.split(' ')[0] || 'Librarian'} 👋
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
            Here is your library management workspace and catalog status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 rounded-lg text-xs font-semibold">
            Role: Library Administrator
          </span>
        </div>
      </div>

      {/* Librarian Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Total Books Cataloged"
          value={totalBooks}
          icon="pi pi-book"
          gradientClass="from-teal-500 to-cyan-500"
          iconBgClass="bg-teal-500/10"
          iconColorClass="text-teal-600 dark:text-teal-400"
          footerText="Library repository inventory"
          loading={booksPending}
        />
        <StatCard
          label="Currently Issued Books"
          value={activeIssuesList.length}
          icon="pi pi-bookmark"
          gradientClass="from-blue-500 to-indigo-500"
          iconBgClass="bg-blue-500/10"
          iconColorClass="text-blue-600 dark:text-blue-400"
          footerText="Books actively with students/staff"
          loading={issuesPending}
        />
        <StatCard
          label="Overdue Returns"
          value={overdueIssuesList.length}
          icon="pi pi-exclamation-circle"
          gradientClass="from-rose-500 to-red-500"
          iconBgClass="bg-rose-500/10"
          iconColorClass="text-rose-600 dark:text-rose-400"
          footerText="Books past return due date"
          loading={false}
        />
        <StatCard
          label="Fine Collections"
          value="Clear"
          icon="pi pi-dollar"
          gradientClass="from-amber-500 to-yellow-500"
          iconBgClass="bg-amber-500/10"
          iconColorClass="text-amber-600 dark:text-amber-400"
          footerText="Late fee records synced"
          loading={false}
        />
      </div>

      {/* Librarian Quick Tools */}
      <div className="premium-glow-effect border border-zinc-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 sm:p-6 overflow-hidden">
        <h3 className="font-bold text-zinc-800 dark:text-white text-lg mb-4 sm:mb-6">
          Library Management Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: 'Issue Book',
              icon: 'pi pi-replay',
              href: '/library/issues',
              color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
            },
            {
              label: 'Book Directory',
              icon: 'pi pi-book',
              href: '/library/books',
              color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
            },
            {
              label: 'Active Issues',
              icon: 'pi pi-bookmark',
              href: '/library/issues',
              color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
            },
            {
              label: 'Collect Fine',
              icon: 'pi pi-dollar',
              href: '/library/fines',
              color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
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

      {/* Active & Overdue Issues Widget */}
      <div className="premium-glow-effect border border-zinc-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-4 sm:p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h3 className="font-bold text-zinc-800 dark:text-white text-lg">
              Active Book Circulation
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Recently issued and checked out books</p>
          </div>
          <a
            href="/library/issues"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Manage All Issues &rarr;
          </a>
        </div>

        <div className="flex flex-col gap-3">
          {activeIssuesList.length > 0 ? (
            activeIssuesList.slice(0, 5).map((issue: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150/60 dark:border-zinc-800/80"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs">
                    <i className="pi pi-book"></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {issue.book?.title || 'Library Volume'}
                    </h4>
                    <p className="text-[11px] text-zinc-400 font-semibold">
                      Issued to: {issue.student?.name || issue.studentId || 'Student'}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400 rounded-md text-[10px] font-extrabold uppercase">
                  Due: {issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              No active library book issues found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
