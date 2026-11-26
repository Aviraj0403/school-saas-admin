'use client';

import React, { useMemo, useState } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import { QueryState } from '@/components/portal/QueryState';
import { Button } from '@/components/ui/button';
import { useFamilyAttendance } from '@/hooks/queries/useFamily';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';

const STATUS_STYLE: Record<string, { label: string; dot: string; text: string }> = {
  PRESENT: { label: 'Present', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  ABSENT: { label: 'Absent', dot: 'bg-rose-500', text: 'text-rose-600' },
  LATE: { label: 'Late', dot: 'bg-amber-500', text: 'text-amber-600' },
  HALF_DAY: { label: 'Half day', dot: 'bg-sky-500', text: 'text-sky-600' },
  LEAVE: { label: 'Leave', dot: 'bg-violet-500', text: 'text-violet-600' },
  HOLIDAY: { label: 'Holiday', dot: 'bg-zinc-400', text: 'text-muted-foreground' },
};

const dayKey = (v: string | Date) => new Date(v).toISOString().slice(0, 10);

function PercentRing({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const r = 52;
  const c = 2 * Math.PI * r;
  const color = pct >= 85 ? '#10b981' : pct >= 70 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="relative size-36 shrink-0">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="11" className="stroke-muted" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="11"
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-3xl font-semibold leading-none">{pct}%</span>
        <span className="text-eyebrow mt-1">Attendance</span>
      </div>
    </div>
  );
}

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
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card p-2">
        <Button variant="ghost" size="icon" onClick={() => shift(-1)} aria-label="Previous month">
          <ChevronLeft />
        </Button>
        <span className="text-card-title text-center">{label}</span>
        <Button variant="ghost" size="icon" onClick={() => shift(1)} aria-label="Next month">
          <ChevronRight />
        </Button>
      </div>

      <QueryState
        query={query}
        isEmpty={!data || data.total === 0}
        emptyText={`No attendance has been marked for ${label}.`}
        emptyIcon={CalendarCheck}
      >
        <section className="surface-card flex flex-col items-center gap-5 p-5 sm:flex-row sm:gap-8 sm:p-6">
          <PercentRing value={data?.percentage ?? 0} />
          <div className="grid w-full flex-1 grid-cols-2 gap-3">
            {[
              { l: 'Present', v: data?.present ?? 0, t: 'tone-emerald' },
              { l: 'Absent', v: data?.absent ?? 0, t: 'tone-rose' },
              { l: 'Late', v: data?.late ?? 0, t: 'tone-amber' },
              { l: 'Leave', v: data?.leave ?? 0, t: 'tone-violet' },
            ].map((s) => (
              <div key={s.l} className={cn('tone-chip rounded-2xl px-4 py-3', s.t)}>
                <p className="tabular text-2xl font-semibold leading-none">{s.v}</p>
                <p className="mt-1 text-xs font-medium">{s.l}</p>
              </div>
            ))}
            <p className="text-caption col-span-2">{data?.total ?? 0} days marked this month</p>
          </div>
        </section>

        <section className="surface-card p-4 sm:p-6">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} />;
              const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const rec = byDay.get(key);
              const style = rec ? STATUS_STYLE[rec.status] : undefined;
              const isToday =
                key ===
                `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
              return (
                <div
                  key={key}
                  title={
                    rec
                      ? `${style?.label ?? rec.status}${rec.note ? ` — ${rec.note}` : ''}`
                      : 'Not marked'
                  }
                  className={cn(
                    'flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-sm font-medium',
                    rec ? 'bg-muted/60' : 'text-muted-foreground',
                    isToday && 'ring-2 ring-brand'
                  )}
                >
                  <span className="tabular">{day}</span>
                  <span
                    className={cn('size-1.5 rounded-full', style ? style.dot : 'bg-transparent')}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {Object.entries(STATUS_STYLE).map(([k, v]) => (
              <span key={k} className="text-caption inline-flex items-center gap-1.5">
                <span className={cn('size-2 rounded-full', v.dot)} /> {v.label}
              </span>
            ))}
          </div>
        </section>

        <section className="surface-card p-4 sm:p-6">
          <h3 className="text-card-title">Absent days</h3>
          {absences.length === 0 ? (
            <p className="text-caption mt-3">No absences this month.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {absences.map((r: any) => (
                <li
                  key={r.id ?? r.date}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <span className="font-medium">{formatDate(r.date)}</span>
                  {r.note && <span className="text-caption truncate">{r.note}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
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
