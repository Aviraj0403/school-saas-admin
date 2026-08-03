'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { useQuery } from '@tanstack/react-query';
import { examsService } from '@/services/exams.service';
import { academicsService } from '@/services/academics.service';

/**
 * Exam controller reports.
 *
 * Two endpoints that had no UI: the teacher/class coverage report — which
 * teacher is responsible for which class and subject — and the weekly test
 * summary a class teacher would use to spot gaps. Both are read-only and
 * admin-facing.
 */
export default function ExamReportsPage() {
  const [classId, setClassId] = useState<string | null>(null);

  const { data: coverage = [], isPending: loadingCoverage } = useQuery({
    queryKey: ['teacher-class-report'],
    queryFn: examsService.getTeacherClassReport,
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes-for-reports'],
    queryFn: () => academicsService.getClasses(1, 100),
  });

  const { data: weekly, isPending: loadingWeekly } = useQuery({
    queryKey: ['weekly-summary', classId],
    queryFn: () => examsService.getWeeklySummary(classId!),
    enabled: !!classId,
  });

  const classes = (classesData as any)?.items ?? (classesData as any)?.data?.items ?? classesData ?? [];
  const weeklyRows = (weekly as any)?.students ?? (weekly as any)?.rows ?? (Array.isArray(weekly) ? weekly : []);

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Exam Reports" subtitle="Exams" />

      <div className="pb-10 animate-fade-in">
        <TabView>
          <TabPanel header="Teacher / Class Coverage">
            <p className="text-xs text-zinc-500 mb-4 max-w-2xl">
              Which teacher is assigned to which class and subject — the quickest way to spot a
              subject with no one attached to it before results are due.
            </p>
            <DataTable value={coverage} loading={loadingCoverage} emptyMessage="No assignments found." dataKey="id" paginator rows={20}>
              <Column header="Class" body={(r: any) => (
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {r.className ?? r.class?.name ?? '—'}{r.section ? ` — ${r.section}` : ''}
                </span>
              )} />
              <Column header="Subject" body={(r: any) => <span className="text-sm">{r.subjectName ?? r.subject?.name ?? '—'}</span>} />
              <Column header="Teacher" body={(r: any) => (
                r.teacherName ?? r.teacher?.name
                  ? <span className="text-sm">{r.teacherName ?? r.teacher?.name}</span>
                  : <span className="text-xs font-bold text-amber-600">Unassigned</span>
              )} />
            </DataTable>
          </TabPanel>

          <TabPanel header="Weekly Test Summary">
            <div className="flex items-end gap-3 mb-4">
              <div className="flex flex-col gap-1 min-w-[260px]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Class</label>
                <Dropdown
                  value={classId}
                  options={(classes as any[]).map((c: any) => ({ label: `${c.name}${c.section ? ' — ' + c.section : ''}`, value: c.id }))}
                  onChange={(e) => setClassId(e.value)}
                  placeholder="Select a class"
                  filter
                  className="text-sm"
                />
              </div>
            </div>

            {!classId ? (
              <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-md p-10 text-center text-sm text-zinc-500">
                Pick a class to see its weekly test summary.
              </div>
            ) : (
              <DataTable value={weeklyRows} loading={loadingWeekly} emptyMessage="No weekly tests recorded for this class." dataKey="studentId">
                <Column header="Student" body={(r: any) => (
                  <span className="font-semibold text-zinc-800 dark:text-zinc-100">{r.studentName ?? r.student?.name ?? '—'}</span>
                )} />
                <Column header="Tests" body={(r: any) => <span className="text-sm">{r.testCount ?? r.tests ?? '—'}</span>} />
                <Column header="Average" body={(r: any) => (
                  <span className="text-sm font-semibold">{r.average != null ? Number(r.average).toFixed(1) : '—'}</span>
                )} />
              </DataTable>
            )}
          </TabPanel>
        </TabView>
      </div>
    </DashboardLayout>
  );
}
