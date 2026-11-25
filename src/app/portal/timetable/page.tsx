'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import { QueryState } from '@/components/portal/QueryState';
import { useFamilyTimetable } from '@/hooks/queries/useFamily';
import { cn } from '@/lib/utils';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function TimetableView({ studentId }: { studentId: string }) {
  const query = useFamilyTimetable(studentId);
  const slots: any[] = query.data?.slots?.slots ?? [];
  const today = new Date().getDay();

  // Columns: Mon–Sat, plus Sunday only when something is scheduled.
  const dayIdx = [1, 2, 3, 4, 5, 6, ...(slots.some((s) => s.dayOfWeek === 0) ? [0] : [])];

  // Rows: one per distinct period (by number, else by start time).
  const rowKey = (s: any) => (s.periodNumber != null ? `p${s.periodNumber}` : `t${s.startTime}`);
  const rows = Array.from(
    new Map(
      [...slots]
        .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))
        .map((s) => [rowKey(s), s])
    ).values()
  );

  return (
    <QueryState
      query={query}
      isEmpty={slots.length === 0}
      emptyText="The class timetable has not been published yet."
      emptyIcon={Clock}
    >
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-zinc-400">
              <th className="px-4 py-3">Period</th>
              {dayIdx.map((d) => (
                <th key={d} className={cn('px-3 py-3', d === today && 'text-brand')}>
                  {DAYS[d]}
                  {d === today && ' · Today'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-border last:border-0">
                <td className="whitespace-nowrap px-4 py-3 align-top">
                  <div className="font-semibold">
                    {row.periodNumber != null ? `Period ${row.periodNumber}` : '—'}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {row.startTime} – {row.endTime}
                  </div>
                </td>
                {dayIdx.map((d) => {
                  const cell = slots.find((s) => s.dayOfWeek === d && rowKey(s) === rowKey(row));
                  return (
                    <td key={d} className={cn('px-3 py-3 align-top', d === today && 'bg-brand/5')}>
                      {cell ? (
                        <div className="rounded-xl bg-brand-soft px-3 py-2 dark:bg-white/5">
                          <div className="font-semibold text-zinc-900 dark:text-white">
                            {cell.subject?.name ?? 'Class'}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {[cell.teacher?.name, cell.roomNo && `Room ${cell.roomNo}`]
                              .filter(Boolean)
                              .join(' · ')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </QueryState>
  );
}

export default function PortalTimetablePage() {
  return (
    <PortalShell title="Timetable" description="Weekly class timetable">
      {({ studentId }) => <TimetableView studentId={studentId} />}
    </PortalShell>
  );
}
