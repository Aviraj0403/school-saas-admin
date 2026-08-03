'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffAttendanceService, StaffAttendanceStatus } from '@/services/staffAttendance.service';
import { staffService } from '@/services/staff.service';

const STATUSES: StaffAttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE'];

const STATUS_STYLES: Record<string, string> = {
  PRESENT: 'bg-emerald-500/10 text-emerald-600',
  ABSENT: 'bg-rose-500/10 text-rose-600',
  LATE: 'bg-amber-500/10 text-amber-600',
  HALF_DAY: 'bg-blue-500/10 text-blue-600',
  ON_LEAVE: 'bg-zinc-500/10 text-zinc-500',
};

/**
 * Staff attendance register.
 *
 * The employee register has been a separate permission key from the classroom
 * one since the RBAC rework (staff_attendance:*, admin-only) and was fully
 * implemented server-side — but no client ever called it, so a school could
 * mark pupils and not its own staff.
 */
export default function StaffAttendancePage() {
  const toast = React.useRef<Toast>(null);
  const queryClient = useQueryClient();

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [draft, setDraft] = useState<Record<string, StaffAttendanceStatus>>({});

  const { data: staffData, isPending: loadingStaff } = useQuery({
    queryKey: ['staff-for-attendance'],
    queryFn: () => staffService.getStaffList(1, 100),
  });

  const { data: marked = [], isPending: loadingMarked } = useQuery({
    queryKey: ['staff-attendance', date],
    queryFn: () => staffAttendanceService.getByDate(date),
  });

  const staffList = staffData?.items ?? [];

  // Existing marks win over the draft, so re-opening a marked day shows what
  // was actually recorded rather than a blank register.
  const markedBy = useMemo(() => {
    const m: Record<string, string> = {};
    for (const r of marked as any[]) m[r.staffId ?? r.userId] = r.status;
    return m;
  }, [marked]);

  useEffect(() => setDraft({}), [date]);

  const statusFor = (staffId: string): StaffAttendanceStatus | undefined =>
    draft[staffId] ?? (markedBy[staffId] as StaffAttendanceStatus | undefined);

  const saveMutation = useMutation({
    mutationFn: () =>
      staffAttendanceService.markBulk(
        date,
        Object.entries(draft).map(([staffId, status]) => ({ staffId, status })),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-attendance', date] });
      setDraft({});
      toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Staff attendance recorded.', life: 3000 });
    },
    onError: () =>
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not save attendance.', life: 3000 }),
  });

  const markAll = (status: StaffAttendanceStatus) => {
    const next: Record<string, StaffAttendanceStatus> = {};
    for (const s of staffList) next[s.id] = status;
    setDraft(next);
  };

  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of staffList) {
      const st = statusFor(s.id);
      if (st) counts[st] = (counts[st] ?? 0) + 1;
    }
    return counts;
  }, [staffList, draft, markedBy]);

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Staff Attendance" subtitle="Staff" />
      <Toast ref={toast} />

      <div className="flex flex-col gap-4 pb-10 animate-fade-in">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-4 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Date</label>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button label="All Present" onClick={() => markAll('PRESENT')} className="p-2 px-3 text-xs rounded-md border border-emerald-200 text-emerald-600" />
            <Button label="Clear" onClick={() => setDraft({})} className="p-2 px-3 text-xs rounded-md border border-zinc-200 text-zinc-500" />
          </div>
          <div className="flex gap-3 ml-auto text-xs">
            {STATUSES.map((s) => (
              <span key={s} className={`px-2 py-1 rounded font-bold ${STATUS_STYLES[s]}`}>
                {s.replace('_', ' ')}: {summary[s] ?? 0}
              </span>
            ))}
          </div>
          <Button
            label={`Save ${Object.keys(draft).length || ''}`.trim()}
            icon="pi pi-check"
            loading={saveMutation.isPending}
            disabled={Object.keys(draft).length === 0}
            onClick={() => saveMutation.mutate()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 px-5 rounded-md border-0"
          />
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm">
          <DataTable
            value={staffList}
            loading={loadingStaff || loadingMarked}
            emptyMessage="No staff found."
            dataKey="id"
            paginator
            rows={20}
          >
            <Column header="Employee" body={(s: any) => (
              <div className="flex flex-col">
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{s.name}</span>
                <span className="text-[10px] text-zinc-400">{s.email}</span>
              </div>
            )} />
            <Column header="Designation" body={(s: any) => (
              <span className="text-xs text-zinc-500">{s.designation?.name ?? s.designationName ?? '—'}</span>
            )} />
            <Column header="Status" body={(s: any) => {
              const current = statusFor(s.id);
              return (
                <Dropdown
                  value={current ?? null}
                  options={STATUSES.map((v) => ({ label: v.replace('_', ' '), value: v }))}
                  onChange={(e) => setDraft((p) => ({ ...p, [s.id]: e.value }))}
                  placeholder="Not marked"
                  className="w-40 text-xs"
                />
              );
            }} />
            <Column header="Recorded" body={(s: any) => (
              markedBy[s.id]
                ? <span className={`text-[10px] font-bold px-2 py-1 rounded ${STATUS_STYLES[markedBy[s.id]]}`}>{markedBy[s.id].replace('_', ' ')}</span>
                : <span className="text-[10px] text-zinc-400">—</span>
            )} />
          </DataTable>
        </div>
      </div>
    </DashboardLayout>
  );
}
