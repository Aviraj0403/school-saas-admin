'use client';

import React, { useState } from 'react';
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
  const [picked, setPicked] = useState<number | null>(null);

  // Tabs: Mon–Sat, plus Sunday only when something is scheduled.
  const dayIdx = [1, 2, 3, 4, 5, 6, ...(slots.some((s) => s.dayOfWeek === 0) ? [0] : [])];
  const selected = picked ?? (dayIdx.includes(today) ? today : 1);

  const daySlots = slots
    .filter((s) => s.dayOfWeek === selected)
    .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));

  return (
    <QueryState
      query={query}
      isEmpty={slots.length === 0}
      emptyText="The class timetable has not been published yet."
      emptyIcon={Clock}
    >
      <div className="flex flex-col gap-4">
        <div
          role="tablist"
          aria-label="Day of week"
          className="-mx-3.5 flex gap-2 overflow-x-auto px-3.5 pb-1 scrollbar-none sm:mx-0 sm:px-0"
        >
          {dayIdx.map((d) => {
            const active = d === selected;
            return (
              <button
                key={d}
                role="tab"
                aria-selected={active}
                onClick={() => setPicked(d)}
                className={cn(
                  'flex h-14 min-w-16 shrink-0 flex-col items-center justify-center rounded-2xl border px-3 text-sm font-semibold transition-colors active:scale-[0.97]',
                  active
                    ? 'border-transparent bg-brand-gradient text-white shadow-glow'
                    : 'border-border bg-card text-foreground'
                )}
              >
                <span>{DAYS[d].slice(0, 3)}</span>
                {d === today && (
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      active ? 'text-white/80' : 'text-brand'
                    )}
                  >
                    Today
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {daySlots.length === 0 ? (
          <div className="surface-card p-8 text-center text-sm text-muted-foreground">
            No periods scheduled for {DAYS[selected]}.
          </div>
        ) : (
          <ol className="flex flex-col gap-3">
            {daySlots.map((s) => (
              <li
                key={s.id ?? `${s.startTime}-${s.periodNumber}`}
                className="surface-card flex items-center gap-4 p-4"
              >
                <div className="tone-chip tone-indigo flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl">
                  <span className="text-[10px] font-semibold uppercase">Period</span>
                  <span className="tabular text-xl font-semibold leading-none">
                    {s.periodNumber ?? '–'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-card-title truncate">{s.subject?.name ?? 'Class'}</p>
                  <p className="text-caption tabular">
                    {s.startTime} – {s.endTime}
                  </p>
                  <p className="text-caption truncate">
                    {[s.teacher?.name, s.roomNo && `Room ${s.roomNo}`].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
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
