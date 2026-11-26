'use client';

import { localDateISO } from '@/lib/format';
import { asList } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useScopedClasses } from '@/hooks/queries/useScopedClasses';
import { usePermissions } from '@/hooks/usePermissions';
import { apiMessage } from '@/lib/apiMessage';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useStudentsList } from '@/hooks/queries/useStudents';
import { Users, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import {
  useAttendance,
  useMarkBulkAttendance,
  useTodayAttendance,
  useClassAttendanceReport,
  useStudentAttendanceSummary,
} from '@/hooks/queries/useAttendance';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';

interface LocalRecord {
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
  note: string;
}

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<'marking' | 'report' | 'biometric'>('marking');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [localAttendance, setLocalAttendance] = useState<Record<string, LocalRecord>>({});
  const [isModified, setIsModified] = useState(false);

  // Format date to YYYY-MM-DD
  const formattedDate = date ? localDateISO(date) : '';

  // Queries
  const { isAdmin } = usePermissions();
  const { classes, isLoading: loadingClasses, isTeacher } = useScopedClasses();
  const [reportFrom, setReportFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return localDateISO(d);
  });
  const [reportTo, setReportTo] = useState<string>(() => localDateISO(new Date()));
  const [drillStudent, setDrillStudent] = useState<{ id: string; name: string } | null>(null);
  const [drillMonth, setDrillMonth] = useState<string>(() => localDateISO(new Date()).slice(0, 7));

  // Set default class if available
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // Fetch students for selected class
  const { data: studentsData, isPending: loadingStudents } = useStudentsList(
    1,
    100, // API maximum page size; larger values are rejected
    undefined,
    selectedClassId || undefined
  );
  const students = asList(studentsData);

  // Fetch already marked attendance
  const { data: attendanceData, isPending: loadingAttendance } = useAttendance(
    formattedDate,
    selectedClassId || undefined
  );
  const { data: today } = useTodayAttendance(selectedClassId || undefined);
  const {
    data: report,
    isLoading: loadingReport,
    isError: reportError,
    error: reportErr,
  } = useClassAttendanceReport(
    activeTab === 'report' ? selectedClassId || undefined : undefined,
    reportFrom,
    reportTo
  );
  const [drillYear, drillMonthNum] = drillMonth.split('-').map(Number);
  const {
    data: drill,
    isLoading: loadingDrill,
    isError: drillError,
  } = useStudentAttendanceSummary(drillStudent?.id, drillMonthNum, drillYear);

  const studentsKey = studentsData?.items?.map((s: any) => s.id).join(',') || '';
  const attendanceKey =
    attendanceData?.items
      ?.map((a: any) => `${a.studentId}-${a.status}-${a.remarks || ''}`)
      .join(',') || '';

  // Sync marked attendance into local state
  useEffect(() => {
    const initialRecords: Record<string, LocalRecord> = {};

    // Default all students to PRESENT
    const activeStudents = asList(studentsData);
    activeStudents.forEach((student: any) => {
      initialRecords[student.id] = {
        status: 'PRESENT',
        note: '',
      };
    });

    // Overwrite with already saved attendance from backend if present
    const marked = asList(attendanceData);
    marked.forEach((record: any) => {
      if (record.studentId) {
        initialRecords[record.studentId] = {
          status: record.status as any,
          note: record.remarks || '',
        };
      }
    });

    setLocalAttendance(initialRecords);
    setIsModified(false);
  }, [studentsKey, attendanceKey]);

  // Mutation
  const markBulkMutation = useMarkBulkAttendance();

  const handleStatusChange = (
    studentId: string,
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY'
  ) => {
    setLocalAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
    setIsModified(true);
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setLocalAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      },
    }));
    setIsModified(true);
  };

  const markAll = (status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY') => {
    const updated = { ...localAttendance };
    students.forEach((student: any) => {
      updated[student.id] = {
        ...updated[student.id],
        status,
      };
    });
    setLocalAttendance(updated);
    setIsModified(true);
    toast.info('Bulk Action', {
      description: `All students marked as ${status.toLowerCase()}`,
    });
  };

  const handleSave = () => {
    if (!selectedClassId) return;

    const records = Object.entries(localAttendance).map(([studentId, data]) => ({
      studentId,
      status: data.status,
      note: data.note,
    }));

    markBulkMutation.mutate(
      {
        classId: selectedClassId,
        date: formattedDate,
        records,
      },
      {
        onSuccess: () => {
          setIsModified(false);
          toast.success('Attendance saved successfully');
        },
        onError: (err: any) => {
          toast.error(apiMessage(err, 'Failed to save attendance'));
        },
      }
    );
  };

  // Stats calculation
  const totalCount = students.length;
  const presentCount = Object.values(localAttendance).filter((r) => r.status === 'PRESENT').length;
  const absentCount = Object.values(localAttendance).filter((r) => r.status === 'ABSENT').length;
  const lateCount = Object.values(localAttendance).filter(
    (r) => r.status === 'LATE' || r.status === 'HALF_DAY'
  ).length;
  const attendanceRate =
    totalCount > 0 ? Math.round(((presentCount + lateCount * 0.5) / totalCount) * 100) : 0;

  const statusOptions: {
    value: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
    label: string;
    on: string;
  }[] = [
    { value: 'PRESENT', label: 'Present', on: 'bg-emerald-500 border-emerald-500 text-white' },
    { value: 'ABSENT', label: 'Absent', on: 'bg-rose-500 border-rose-500 text-white' },
    { value: 'LATE', label: 'Late', on: 'bg-amber-500 border-amber-500 text-white' },
    { value: 'HALF_DAY', label: 'Half', on: 'bg-sky-500 border-sky-500 text-white' },
  ];

  const tabs: { key: 'marking' | 'report' | 'biometric'; label: string }[] = [
    { key: 'marking', label: 'Marking sheet' },
    { key: 'report', label: 'Class report' },
    ...(isAdmin ? [{ key: 'biometric' as const, label: 'Biometric' }] : []),
  ];

  const statTiles = [
    {
      label: 'Students',
      value: loadingStudents ? '...' : totalCount,
      tone: 'tone-sky',
      Icon: Users,
    },
    {
      label: 'Present',
      value: loadingStudents ? '...' : presentCount,
      tone: 'tone-emerald',
      Icon: CheckCircle2,
    },
    {
      label: 'Absent',
      value: loadingStudents ? '...' : absentCount,
      tone: 'tone-rose',
      Icon: XCircle,
    },
    {
      label: 'Rate',
      value: loadingStudents ? '...' : `${attendanceRate}%`,
      tone: 'tone-violet',
      Icon: TrendingUp,
    },
  ];

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Attendance" />
      <div className="flex flex-col gap-4 pb-6">
        <PageHeader
          title="Attendance"
          description="Mark, review, and synchronize student attendance."
        />

        {/* Class + date */}
        <div className="surface-card grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:max-w-2xl">
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-eyebrow">Class</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="h-11 w-full min-w-0 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              {loadingClasses ? (
                <option>Loading...</option>
              ) : (
                classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - {cls.section}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-eyebrow">Date</span>
            <Input
              type="date"
              value={formattedDate}
              onChange={(e) => e.target.value && setDate(new Date(`${e.target.value}T00:00:00`))}
              className="h-11 w-full text-sm"
            />
          </label>
        </div>

        {/* Tab strip */}
        <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors ${
                activeTab === t.key
                  ? 'border-transparent bg-brand-gradient text-white'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {selectedClassId && today && (
          <div
            className={`flex flex-wrap items-center gap-x-2 rounded-xl border px-3 py-2.5 text-xs font-medium ${
              today.isMarked
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-300'
                : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300'
            }`}
          >
            <span>Today ({today.date}):</span>
            <span>
              {today.isMarked
                ? `attendance marked for ${today.markedCount} of ${today.totalStudents} students`
                : `attendance not marked yet (${today.totalStudents} students)`}
            </span>
          </div>
        )}

        {!loadingClasses && classes.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {isTeacher
              ? 'No classes are assigned to you yet. Ask an administrator to assign you as a class teacher or add you to the timetable.'
              : 'No classes found. Create a class under Academics first.'}
          </div>
        )}

        {activeTab === 'report' ? (
          <div className="surface-card overflow-hidden">
            <div className="flex flex-wrap items-end gap-3 border-b border-border p-3 sm:p-4">
              <label className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-none">
                <span className="text-eyebrow">From</span>
                <Input
                  type="date"
                  value={reportFrom}
                  onChange={(e) => setReportFrom(e.target.value)}
                  className="h-11 w-full text-sm sm:w-40"
                />
              </label>
              <label className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-none">
                <span className="text-eyebrow">To</span>
                <Input
                  type="date"
                  value={reportTo}
                  onChange={(e) => setReportTo(e.target.value)}
                  className="h-11 w-full text-sm sm:w-40"
                />
              </label>
              {report && (
                <span className="text-xs text-muted-foreground sm:ml-auto">
                  {report.totalDays} attendance days in range
                </span>
              )}
            </div>
            {!selectedClassId ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                Select a class to see its report.
              </div>
            ) : loadingReport ? (
              <div className="space-y-2 p-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : reportError ? (
              <div className="p-10 text-center text-sm text-rose-600">
                {apiMessage(reportErr, 'Could not load the class report.')}
              </div>
            ) : !report || report.summary.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                No attendance recorded in this period.
              </div>
            ) : (
              <>
                {/* Phones: card per student */}
                <ul className="divide-y divide-border md:hidden">
                  {report.summary.map((r) => (
                    <li key={r.student.id} className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          className="min-w-0 truncate text-left text-sm font-semibold text-foreground"
                          onClick={() =>
                            setDrillStudent({ id: r.student.id, name: r.student.name })
                          }
                        >
                          {r.student.name}
                        </button>
                        <span className="tone-chip tone-violet shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">
                          {r.total ? Math.round(((r.present + r.late * 0.5) / r.total) * 100) : 0}%
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold tabular-nums">
                        <span className="tone-chip tone-emerald rounded-full px-2 py-0.5">
                          P {r.present}
                        </span>
                        <span className="tone-chip tone-rose rounded-full px-2 py-0.5">
                          A {r.absent}
                        </span>
                        <span className="tone-chip tone-amber rounded-full px-2 py-0.5">
                          L {r.late}
                        </span>
                        <span className="tone-chip tone-sky rounded-full px-2 py-0.5">
                          Leave {r.leave}
                        </span>
                        <span className="ml-auto text-muted-foreground">
                          Roll {r.student.rollNo ?? '-'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="hidden overflow-x-auto md:block">
                  <table className="modern-table w-full text-left text-xs">
                    <thead>
                      <tr>
                        <th className="px-4 py-3">Roll</th>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3 text-center">Present</th>
                        <th className="px-4 py-3 text-center">Absent</th>
                        <th className="px-4 py-3 text-center">Late</th>
                        <th className="px-4 py-3 text-center">Leave</th>
                        <th className="px-4 py-3 text-center">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.summary.map((r) => (
                        <tr key={r.student.id}>
                          <td className="px-4 py-3 font-mono text-muted-foreground">
                            {r.student.rollNo ?? '-'}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              className="font-semibold text-blue-600 hover:underline"
                              onClick={() =>
                                setDrillStudent({ id: r.student.id, name: r.student.name })
                              }
                            >
                              {r.student.name}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold tabular-nums text-emerald-600">
                            {r.present}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold tabular-nums text-rose-600">
                            {r.absent}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold tabular-nums text-amber-600">
                            {r.late}
                          </td>
                          <td className="px-4 py-3 text-center tabular-nums">{r.leave}</td>
                          <td className="px-4 py-3 text-center font-semibold tabular-nums">
                            {r.total ? Math.round(((r.present + r.late * 0.5) / r.total) * 100) : 0}
                            %
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        ) : activeTab === 'biometric' && isAdmin ? (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* This tab used to render hardcoded terminals — BIO-01-MAIN,
                192.168.1.120, a pulsing ONLINE dot and a "Real-Time Ingestion
                Enabled" badge — with no network call behind any of it, while the
                real provisioning endpoints went unused. Device management now
                lives on its own screen against those endpoints. */}
            <div className="surface-card flex flex-col items-center gap-3 p-6 text-center sm:p-8">
              <i className="pi pi-server text-3xl text-blue-500"></i>
              <h3 className="text-card-title">Biometric Units</h3>
              <p className="max-w-md text-xs text-muted-foreground">
                Provision fingerprint and face scanners, watch their heartbeat status, and revoke
                units that are lost or decommissioned.
              </p>
              <a
                href="/attendance/devices"
                className="mt-2 inline-flex h-11 items-center rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-white"
              >
                Manage Devices
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
              {statTiles.map((s) => (
                <div key={s.label} className="surface-card flex items-center gap-3 p-3 sm:p-4">
                  <span
                    className={`tone-chip ${s.tone} flex size-9 shrink-0 items-center justify-center rounded-xl`}
                  >
                    <s.Icon className="size-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold leading-tight tabular-nums text-foreground">
                      {s.value}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bulk actions */}
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                onClick={() => markAll('PRESENT')}
                disabled={loadingStudents || totalCount === 0}
                className="tone-chip tone-emerald h-11 rounded-xl px-4 text-sm font-semibold transition active:scale-95 disabled:opacity-50"
              >
                Mark all present
              </button>
              <button
                onClick={() => markAll('ABSENT')}
                disabled={loadingStudents || totalCount === 0}
                className="tone-chip tone-rose h-11 rounded-xl px-4 text-sm font-semibold transition active:scale-95 disabled:opacity-50"
              >
                Mark all absent
              </button>
            </div>

            {/* Students List Card */}
            <div className="surface-card overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <h2 className="text-card-title">Student roster</h2>
                <span className="text-xs font-semibold text-muted-foreground">
                  {students.length} students
                </span>
              </div>

              {loadingStudents || loadingAttendance ? (
                <div className="space-y-2 p-4">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
                  ))}
                </div>
              ) : students.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-sm text-muted-foreground">No students found in this class.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {students.map((student: any) => {
                    const record = localAttendance[student.id] || { status: 'PRESENT', note: '' };
                    const fullName = student.name || 'Unnamed Student';

                    return (
                      <div
                        key={student.id}
                        className="flex flex-col gap-3 p-3 sm:p-4 md:flex-row md:items-center md:justify-between"
                      >
                        {/* Student Info */}
                        <div className="flex min-w-0 items-center gap-3 md:w-64">
                          <div className="tone-chip tone-sky flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                            {student.name ? student.name[0].toUpperCase() : '?'}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setDrillStudent({ id: student.id, name: fullName })}
                              className="block max-w-full truncate text-left font-semibold leading-snug text-foreground hover:underline"
                              title="View monthly attendance summary"
                            >
                              {fullName}
                            </button>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              Adm No: <span className="font-mono">{student.admissionNo}</span>
                            </p>
                          </div>
                        </div>

                        {/* Status toggles */}
                        <div className="grid grid-cols-4 gap-1.5 md:w-80">
                          {statusOptions.map((o) => (
                            <button
                              key={o.value}
                              onClick={() => handleStatusChange(student.id, o.value)}
                              className={`h-11 rounded-xl border text-xs font-semibold transition active:scale-95 ${
                                record.status === o.value
                                  ? `${o.on} shadow-sm`
                                  : 'border-border bg-card text-muted-foreground'
                              }`}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>

                        {/* Remarks Input */}
                        <div className="w-full md:w-56">
                          <input
                            type="text"
                            placeholder="Add note (optional)..."
                            value={record.note}
                            onChange={(e) => handleNoteChange(student.id, e.target.value)}
                            className="h-10 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sticky save bar */}
            <div className="surface-card sticky bottom-24 z-20 flex items-center justify-between gap-3 p-3 shadow-lg md:bottom-4">
              <span
                className={`text-xs font-medium ${isModified ? 'animate-pulse text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}
              >
                {isModified ? '● Unsaved changes' : `${presentCount}/${totalCount} present`}
              </span>
              <button
                onClick={handleSave}
                disabled={loadingStudents || totalCount === 0 || markBulkMutation.isPending}
                className="h-11 min-w-36 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                {markBulkMutation.isPending ? 'Saving...' : 'Save attendance'}
              </button>
            </div>
          </>
        )}
      </div>

      <Dialog
        isOpen={!!drillStudent}
        onClose={() => setDrillStudent(null)}
        title={drillStudent ? `${drillStudent.name} - attendance` : 'Attendance'}
      >
        <div className="flex flex-col gap-4">
          <Input
            type="month"
            value={drillMonth}
            onChange={(e) => e.target.value && setDrillMonth(e.target.value)}
          />
          {loadingDrill ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : drillError || !drill ? (
            <p className="text-sm text-rose-600">Could not load the summary.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="success">Present {drill.present}</Badge>
                <Badge variant="danger">Absent {drill.absent}</Badge>
                <Badge variant="warning">Late {drill.late}</Badge>
                <Badge variant="info">Leave {drill.leave}</Badge>
                <Badge variant="primary">{drill.percentage}%</Badge>
              </div>
              {drill.records.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attendance recorded this month.</p>
              ) : (
                <ul className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                  {drill.records.map((r) => (
                    <li key={r.id} className="py-1.5 flex justify-between">
                      <span className="font-mono">{String(r.date).slice(0, 10)}</span>
                      <span className="font-semibold">{r.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
