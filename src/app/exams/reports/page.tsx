'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { examsService } from '@/services/exams.service';
import { useScopedClasses } from '@/hooks/queries/useScopedClasses';
import { useStaffDirectory } from '@/hooks/queries/useStaffDirectory';
import { formatDate } from '@/lib/format';
import { apiMessage } from '@/lib/apiMessage';
import { FileSpreadsheet, UserCheck, Calendar } from 'lucide-react';

/**
 * Exam controller reports.
 *
 * - Coverage: per class, who is the class teacher and which teacher covers each
 *   subject. Teachers only receive the classes they teach; if the backend
 *   refuses (403) the card is hidden instead of showing an error.
 * - Weekly summary: tests conducted in the last 7 days for a class.
 */
export default function ExamReportsPage() {
  const [activeTab, setActiveTab] = useState<'coverage' | 'weekly'>('coverage');
  const [classId, setClassId] = useState<string>('');
  const { classes } = useScopedClasses();
  const { data: staffDir = [] } = useStaffDirectory();
  const teacherName = (id?: string) => staffDir.find((s) => s.id === id)?.name;

  const {
    data: coverage = [],
    isPending: loadingCoverage,
    error: coverageError,
  } = useQuery({
    queryKey: ['teacher-class-report'],
    queryFn: examsService.getTeacherClassReport,
    retry: false,
  });
  const coverageForbidden = (coverageError as any)?.response?.status === 403;

  const {
    data: weekly,
    isPending: loadingWeekly,
    error: weeklyError,
  } = useQuery({
    queryKey: ['weekly-summary', classId],
    queryFn: () => examsService.getWeeklySummary(classId),
    enabled: !!classId,
    retry: false,
  });
  const weeklyRows: any[] = Array.isArray(weekly) ? weekly : [];

  const classOptions = [
    { label: 'Select a class...', value: '' },
    ...classes.map((c) => ({ label: c.label, value: c.id })),
  ];

  const tabs = [
    ...(coverageForbidden
      ? []
      : [{ key: 'coverage' as const, label: 'Teacher / Class Coverage', icon: UserCheck }]),
    { key: 'weekly' as const, label: 'Weekly Test Summary', icon: Calendar },
  ];
  const tab = coverageForbidden ? 'weekly' : activeTab;

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Exam Reports" subtitle="Exams" />

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-page-title flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-brand" />
              Examination Analytics & Reports
            </h1>
            <p className="text-sm text-muted-foreground">
              Audit teacher-class coverage and recent test performance
            </p>
          </div>
        </div>

        <div className="flex bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === t.key
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                  : 'text-muted-foreground hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="surface-card p-6 shadow-sm">
          {tab === 'coverage' && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground max-w-2xl">
                Class teacher and subject teachers for each class.
              </p>

              {loadingCoverage ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  Loading coverage...
                </div>
              ) : coverageError ? (
                <div className="p-8 text-center text-sm text-rose-600">
                  {apiMessage(coverageError, 'Could not load coverage report.')}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-muted-foreground font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-6 py-4">Class</th>
                        <th className="px-6 py-4">Class Teacher</th>
                        <th className="px-6 py-4">Students</th>
                        <th className="px-6 py-4">Subject Teachers</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {coverage.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                            No coverage data available.
                          </td>
                        </tr>
                      ) : (
                        coverage.map((r: any) => (
                          <tr
                            key={r.id}
                            className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                          >
                            <td className="px-6 py-4 font-semibold text-foreground">
                              {r.name}
                              <span className="block text-[11px] font-normal text-muted-foreground">
                                {r.academicYear}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {r.classTeacher?.name ? (
                                r.classTeacher.name
                              ) : (
                                <Badge variant="warning">Unassigned</Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 font-mono">{r.studentCount}</td>
                            <td className="px-6 py-4">
                              {(r.subjectTeachers ?? []).length === 0 ? (
                                <Badge variant="warning">No timetable</Badge>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {r.subjectTeachers.map((st: any, i: number) => (
                                    <Badge key={i} variant="secondary">
                                      {st.subject}: {teacherName(st.teacherId) ?? 'Teacher'}
                                    </Badge>
                                  ))}
                                </div>
                              )}
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

          {tab === 'weekly' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5 max-w-xs">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Class *
                </label>
                <Select
                  value={classId}
                  options={classOptions}
                  onChange={(e) => setClassId(e.target.value)}
                />
              </div>

              {!classId ? (
                <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center text-sm text-muted-foreground">
                  Select a class to see tests published in the last 7 days.
                </div>
              ) : loadingWeekly ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  Fetching weekly summaries...
                </div>
              ) : weeklyError ? (
                <div className="p-8 text-center text-sm text-rose-600">
                  {apiMessage(weeklyError, 'Could not load the weekly summary.')}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-muted-foreground font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-6 py-4">Test</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Results</th>
                        <th className="px-6 py-4">Class Average</th>
                        <th className="px-6 py-4">Top Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {weeklyRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                            No published weekly tests for this class in the last 7 days.
                          </td>
                        </tr>
                      ) : (
                        weeklyRows.map((r: any, idx: number) => (
                          <tr
                            key={idx}
                            className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                          >
                            <td className="px-6 py-4 font-semibold text-foreground">
                              {r.examName}
                            </td>
                            <td className="px-6 py-4">{formatDate(r.date)}</td>
                            <td className="px-6 py-4 font-mono">{r.studentCount}</td>
                            <td className="px-6 py-4 font-mono font-semibold text-brand">
                              {Number(r.average).toFixed(1)}
                            </td>
                            <td className="px-6 py-4 font-mono">{r.topScore}</td>
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
