'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { examsService } from '@/services/exams.service';
import { academicsService } from '@/services/academics.service';
import { FileSpreadsheet, UserCheck, Calendar } from 'lucide-react';

/**
 * Exam controller reports.
 *
 * Two endpoints that had no UI: the teacher/class coverage report — which
 * teacher is responsible for which class and subject — and the weekly test
 * summary a class teacher would use to spot gaps. Both are read-only and
 * admin-facing.
 */
export default function ExamReportsPage() {
  const [activeTab, setActiveTab] = useState<'coverage' | 'weekly'>('coverage');
  const [classId, setClassId] = useState<string>('');

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

  const classes =
    (classesData as any)?.items ?? (classesData as any)?.data?.items ?? classesData ?? [];
  const weeklyRows =
    (weekly as any)?.students ?? (weekly as any)?.rows ?? (Array.isArray(weekly) ? weekly : []);

  const classOptions = [
    { label: 'Select a class...', value: '' },
    ...classes.map((c: any) => ({
      label: `${c.name}${c.section ? ' — ' + c.section : ''}`,
      value: c.id,
    })),
  ];

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Exam Reports" subtitle="Exams" />

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        {/* Header Title */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-brand" />
              Examination Analytics & Reports
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Audit teacher-class coverage and weekly test performance metrics
            </p>
          </div>
        </div>

        {/* Tab Header Bar */}
        <div className="flex bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 w-fit">
          <button
            onClick={() => setActiveTab('coverage')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'coverage'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Teacher / Class Coverage
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'weekly'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-4 h-4" /> Weekly Test Summary
          </button>
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm">
          {activeTab === 'coverage' && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-2xl">
                Which teacher is assigned to which class and subject — spot unassigned subjects
                before evaluation begins.
              </p>

              {loadingCoverage ? (
                <div className="p-12 text-center text-zinc-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                  <p className="text-xs">Loading coverage matrix...</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-6 py-4">Class</th>
                        <th className="px-6 py-4">Subject</th>
                        <th className="px-6 py-4">Teacher Assigned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {coverage.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">
                            No coverage data available.
                          </td>
                        </tr>
                      ) : (
                        coverage.map((r: any, idx: number) => {
                          const teacherName = r.teacherName ?? r.teacher?.name;
                          return (
                            <tr
                              key={r.id || idx}
                              className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                            >
                              <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                                {r.className ?? r.class?.name ?? '—'}
                                {r.section ? ` — ${r.section}` : ''}
                              </td>
                              <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                                {r.subjectName ?? r.subject?.name ?? '—'}
                              </td>
                              <td className="px-6 py-4">
                                {teacherName ? (
                                  <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                                    {teacherName}
                                  </span>
                                ) : (
                                  <Badge variant="warning">Unassigned</Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'weekly' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5 max-w-xs">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Filter by Class *
                </label>
                <Select
                  value={classId}
                  options={classOptions}
                  onChange={(e) => setClassId(e.target.value)}
                />
              </div>

              {!classId ? (
                <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center text-sm text-zinc-500">
                  Select a class above to inspect its weekly test summary and class averages.
                </div>
              ) : loadingWeekly ? (
                <div className="p-12 text-center text-zinc-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                  <p className="text-xs">Fetching weekly summaries...</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Total Tests Conducted</th>
                        <th className="px-6 py-4">Class Average</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {weeklyRows.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">
                            No weekly tests recorded for this class.
                          </td>
                        </tr>
                      ) : (
                        weeklyRows.map((r: any, idx: number) => (
                          <tr
                            key={r.studentId || idx}
                            className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                          >
                            <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                              {r.studentName ?? r.student?.name ?? '—'}
                            </td>
                            <td className="px-6 py-4 font-mono text-zinc-700 dark:text-zinc-300">
                              {r.testCount ?? r.tests ?? '—'}
                            </td>
                            <td className="px-6 py-4 font-mono font-semibold text-brand">
                              {r.average != null ? Number(r.average).toFixed(1) : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
