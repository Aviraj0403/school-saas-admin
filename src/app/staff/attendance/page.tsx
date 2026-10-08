'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffAttendanceService, StaffAttendanceStatus } from '@/services/staffAttendance.service';
import { staffService } from '@/services/staff.service';
import { Check, UserCheck, Calendar } from 'lucide-react';

const STATUSES: StaffAttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE'];

const STATUS_BADGE_VARIANTS: Record<
  string,
  'success' | 'danger' | 'warning' | 'info' | 'secondary'
> = {
  PRESENT: 'success',
  ABSENT: 'danger',
  LATE: 'warning',
  HALF_DAY: 'info',
  ON_LEAVE: 'secondary',
};

const STATUS_OPTIONS = STATUSES.map((v) => ({
  label: v.replace('_', ' '),
  value: v,
}));

export default function StaffAttendancePage() {
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
        Object.entries(draft).map(([staffId, status]) => ({ staffId, status }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-attendance', date] });
      setDraft({});
      toast.success('Staff attendance recorded successfully.');
    },
    onError: () => toast.error('Failed to save staff attendance.'),
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

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        {/* Header Control Bar */}
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Select Date
              </label>
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button variant="outline" onClick={() => markAll('PRESENT')}>
                <UserCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> Mark All Present
              </Button>
              <Button variant="outline" onClick={() => setDraft({})}>
                Clear Draft
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-2 flex-wrap items-center">
              {STATUSES.map((s) => (
                <Badge key={s} variant={STATUS_BADGE_VARIANTS[s] || 'secondary'}>
                  {s.replace('_', ' ')}: {summary[s] ?? 0}
                </Badge>
              ))}
            </div>

            <Button
              onClick={() => saveMutation.mutate()}
              isLoading={saveMutation.isPending}
              disabled={Object.keys(draft).length === 0}
            >
              <Check className="w-4 h-4 mr-1.5" />
              Save Attendance{' '}
              {Object.keys(draft).length > 0 ? `(${Object.keys(draft).length})` : ''}
            </Button>
          </div>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 backdrop-blur-xl shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
              <tr>
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Designation</th>
                <th className="px-4 py-3.5">Attendance Mark</th>
                <th className="px-4 py-3.5">Saved Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
              {loadingStaff || loadingMarked ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-zinc-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                    <p className="text-xs">Loading staff register...</p>
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-zinc-400">
                    No staff records found.
                  </td>
                </tr>
              ) : (
                staffList.map((s: any) => {
                  const current = statusFor(s.id);
                  return (
                    <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {s.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">{s.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {s.designation?.name ?? s.designationName ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={current ?? ''}
                          options={[{ label: 'Select status...', value: '' }, ...STATUS_OPTIONS]}
                          onChange={(e) =>
                            setDraft((p) => {
                              if (!e.target.value) {
                                const copy = { ...p };
                                delete copy[s.id];
                                return copy;
                              }
                              return { ...p, [s.id]: e.target.value as StaffAttendanceStatus };
                            })
                          }
                          className="w-44 text-xs"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {markedBy[s.id] ? (
                          <Badge variant={STATUS_BADGE_VARIANTS[markedBy[s.id]] || 'secondary'}>
                            {markedBy[s.id].replace('_', ' ')}
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
