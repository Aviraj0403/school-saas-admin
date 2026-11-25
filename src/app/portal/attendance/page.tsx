'use client';

import React, { useMemo, useState } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import { QueryState } from '@/components/portal/QueryState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/StatCard';
import { useFamilyAttendance } from '@/hooks/queries/useFamily';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';

const STATUS_STYLE: Record<string, { label: string; cell: string; badge: any }> = {
  PRESENT: {
    label: 'Present',
    cell: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    badge: 'success',
  },
  ABSENT: {
    label: 'Absent',
    cell: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
    badge: 'danger',
  },
  LATE: {
    label: 'Late',
    cell: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    badge: 'warning',
  },
  HALF_DAY: {
    label: 'Half day',
    cell: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
    badge: 'info',
  },
  LEAVE: {
    label: 'Leave',
    cell: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
    badge: 'info',
  },
  HOLIDAY: { label: 'Holiday', cell: 'bg-zinc-500/10 text-zinc-500', badge: 'secondary' },
};

const dayKey = (v: string | Date) => new Date(v).toISOString().slice(0, 10);

function AttendanceView({ studentId }: { studentId: string }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const query = useFamilyAttendance(studentId, month, year);
  const data = query.data;

  const byDay = useMemo(() => {
    const map = new Map<string, any>();
    for (const r of data?.records ?? []) map.set(dayKey(r.date), r);
    return map;
  }, [data]);

  const shift = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const label = new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
  const absences = (data?.records ?? []).filter((r: any) => r.status === 'ABSENT');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => shift(-1)}
          aria-label="Previous month"
        >
          <ChevronLeft />
        </Button>
        <span className="min-w-36 text-center text-sm font-semibold">{label}</span>
        <Button variant="outline" size="icon-sm" onClick={() => shift(1)} aria-label="Next month">
          <ChevronRight />
        </Button>
      </div>

      <QueryState
        query={query}
        isEmpty={!data || data.total === 0}
        emptyText={`No attendance has been marked for ${label}.`}
        emptyIcon={CalendarCheck}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Attendance"
            value={`${data?.percentage ?? 0}%`}
            icon={CalendarCheck}
            gradientClass="from-emerald-400 to-teal-500"
            footerText={`${data?.total ?? 0} days marked`}
          />
          <StatCard
            label="Present"
            value={data?.present ?? 0}
            icon={CalendarCheck}
            gradientClass="from-sky-400 to-cyan-500"
            footerText="Days present"
          />
          <StatCard
            label="Absent"
            value={data?.absent ?? 0}
            icon={CalendarCheck}
            gradientClass="from-pink-500 to-rose-500"
            footerText="Days absent"
          />
          <StatCard
            label="Late / Leave"
            value={`${data?.late ?? 0} / ${data?.leave ?? 0}`}
            icon={CalendarCheck}
            gradientClass="from-amber-400 to-orange-500"
            footerText="Late arrivals / leave days"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6 xl:col-span-2">
            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1.5">
              {cells.map((day, i) => {
                if (day === null) return <div key={`e${i}`} />;
                const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const rec = byDay.get(key);
                const style = rec ? STATUS_STYLE[rec.status] : undefined;
                return (
                  <div
                    key={key}
                    title={
                      rec
                        ? `${style?.label ?? rec.status}${rec.note ? ` — ${rec.note}` : ''}`
                        : 'Not marked'
                    }
                    className={cn(
                      'flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-semibold',
                      style ? style.cell : 'bg-zinc-50 text-zinc-400 dark:bg-white/[0.03]'
                    )}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(STATUS_STYLE).map(([k, v]) => (
                <Badge key={k} variant={v.badge}>
                  {v.label}
                </Badge>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6">
            <h3 className="font-display text-lg font-semibold">Absent days</h3>
            {absences.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No absences this month.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {absences.map((r: any) => (
                  <li
                    key={r.id ?? r.date}
                    className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{formatDate(r.date)}</span>
                    {r.note && (
                      <span className="truncate pl-3 text-xs text-zinc-500">{r.note}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </QueryState>
    </div>
  );
}

export default function PortalAttendancePage() {
  return (
    <PortalShell title="Attendance" description="Monthly attendance record">
      {({ studentId }) => <AttendanceView studentId={studentId} />}
    </PortalShell>
  );
}
