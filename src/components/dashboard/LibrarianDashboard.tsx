'use client';

import React from 'react';
import {
  AlarmClock,
  BookCopy,
  BookOpen,
  BookPlus,
  IndianRupee,
  Library,
  RotateCcw,
  Search,
  UserSearch,
} from 'lucide-react';

import { StatCard } from '@/components/ui/StatCard';
import { useAuthStore } from '@/store/useAuthStore';
import {
  useBooksList,
  useActiveIssues,
  useOverdueIssues,
  useLibraryFines,
} from '@/hooks/queries/useLibrary';
import { asList } from '@/lib/utils';
import { formatDate } from '@/lib/format';
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
import { Donut } from './charts';

export function LibrarianDashboard() {
  const { activeUser } = useAuthStore();
  const { data: booksData, isPending: booksPending } = useBooksList(1, 1);
  const { data: activeIssuesData, isPending: issuesPending } = useActiveIssues();
  const { data: overdueIssuesData, isPending: overduePending } = useOverdueIssues();

  const { data: finesData, isPending: finesPending } = useLibraryFines();
  const totalBooks = Number((booksData as any)?.meta?.total ?? asList(booksData).length);
  const issued = asList(activeIssuesData);
  const overdue = asList(overdueIssuesData);
  const onTime = Math.max(issued.length - overdue.length, 0);
  const [now] = React.useState(() => Date.now());

  return (
    <div className="flex flex-col gap-4 sm:gap-6 pb-6">
      <HeroCard
        eyebrow={
          <>
            <Library className="size-3.5" /> {todayLabel()}
          </>
        }
        title={
          <>
            {greeting()}, {activeUser?.name?.split(' ')[0] || 'there'} 👋
          </>
        }
        subtitle="Your library today — loans, returns and overdue books."
        actions={
          <>
            <HeroButton href="/library/issues">
              <BookCopy className="size-4" /> Issue a book
            </HeroButton>
            <HeroButton href="/library/books" variant="glass">
              <BookPlus className="size-4" /> Add to catalogue
            </HeroButton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Books in catalogue"
          value={totalBooks}
          icon={BookOpen}
          gradientClass="from-violet-500 to-indigo-500"
          footerText="Titles on record"
          loading={booksPending}
        />
        <StatCard
          label="On loan"
          value={issued.length}
          icon={BookCopy}
          gradientClass="from-sky-400 to-cyan-500"
          footerText="Currently with students"
          loading={issuesPending}
        />
        <StatCard
          label="Overdue"
          value={overdue.length}
          icon={AlarmClock}
          gradientClass="from-pink-500 to-rose-500"
          footerText="Past their due date"
          loading={overduePending}
        />
        <StatCard
          label="Fines due"
          value={`₹${Number(finesData?.total ?? 0).toLocaleString('en-IN')}`}
          icon={IndianRupee}
          gradientClass="from-amber-400 to-orange-500"
          footerText={`${finesData?.count ?? 0} unpaid fine${(finesData?.count ?? 0) === 1 ? '' : 's'}`}
          loading={finesPending}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
        <Panel title="Loan health" subtitle="Books out right now">
          <Donut
            data={[
              { name: 'On time', value: onTime, color: 'var(--brand)' },
              { name: 'Overdue', value: overdue.length, color: '#f0435c' },
            ]}
            center={issued.length}
            caption="on loan"
          />
          <div className="mt-5 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-brand-soft p-3 dark:bg-white/5">
              <p className="tabular text-xl font-semibold">{onTime}</p>
              <p className="text-xs text-muted-foreground">On time</p>
            </div>
            <div className="rounded-2xl bg-rose-500/[0.08] p-3">
              <p className="tabular text-xl font-semibold">{overdue.length}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </div>
        </Panel>

        <Panel
          className="xl:col-span-2"
          title="Overdue returns"
          subtitle="Follow up with these borrowers"
          action={<PanelLink href="/library/issues">All loans</PanelLink>}
        >
          {overdue.length > 0 ? (
            <div className="divide-y divide-border">
              {overdue.slice(0, 6).map((i: any) => {
                const days = Math.max(1, Math.round((now - +new Date(i.dueDate)) / 86400000));
                return (
                  <div key={i.id} className="flex items-center gap-3 py-3 min-w-0">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
                      <AlarmClock className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-foreground">
                        {i.book?.title || 'Book'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Was due {formatDate(i.dueDate)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-600">
                      {days} day{days === 1 ? '' : 's'} late
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={AlarmClock}
              text={overduePending ? 'Loading…' : 'Nothing overdue — every book is on time. 📚'}
            />
          )}
        </Panel>
      </div>

      <Panel title="Library desk" subtitle="Shortcuts">
        <QuickActions
          columns={3}
          actions={[
            {
              label: 'Issue a book',
              href: '/library/issues',
              icon: BookCopy,
              gradient: 'from-sky-400 to-cyan-500',
            },
            {
              label: 'Returns & fines',
              href: '/library/fines',
              icon: RotateCcw,
              gradient: 'from-amber-400 to-orange-500',
            },
            {
              label: 'Member lookup',
              href: '/library/books?tab=members',
              icon: UserSearch,
              gradient: 'from-fuchsia-500 to-purple-500',
            },
            {
              label: 'Search catalogue',
              href: '/library/books',
              icon: Search,
              gradient: 'from-violet-500 to-indigo-500',
            },
          ]}
        />
      </Panel>
    </div>
  );
}
