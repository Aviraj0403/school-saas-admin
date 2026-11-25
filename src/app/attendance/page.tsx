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
import {
  useAttendance,
  useMarkBulkAttendance,
  useTodayAttendance,
  useClassAttendanceReport,
  useStudentAttendanceSummary,
} from '@/hooks/queries/useAttendance';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { StatCard } from '@/components/ui/StatCard';
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

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Attendance" />
      <div className="flex flex-col gap-4 pb-10">
        {/* Header Section */}
        <div className="flex flex-col items-start gap-4 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Attendance Management
              </h1>
            </div>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              Mark, review, and synchronize student attendance status.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">
                Select Class
              </span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-transparent text-zinc-800 dark:text-zinc-200 font-medium outline-none pr-6 cursor-pointer border-none py-1 focus:ring-0 text-sm"
              >
                {loadingClasses ? (
                  <option className="text-zinc-800">Loading...</option>
                ) : (
                  classes.map((cls: any) => (
                    <option
                      key={cls.id}
                      value={cls.id}
                      className="text-zinc-800 dark:text-zinc-200"
                    >
                      {cls.name} - {cls.section}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="h-8 w-px bg-zinc-300 dark:bg-zinc-700"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">
                Select Date
              </span>
              <Input
                type="date"
                value={formattedDate}
                onChange={(e) => e.target.value && setDate(new Date(`${e.target.value}T00:00:00`))}
                className="bg-transparent text-zinc-800 dark:text-zinc-200 border-none py-0 w-36 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Tab Selector Bar */}
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 w-max">
          <button
            onClick={() => setActiveTab('marking')}
            className={`p-2 px-4 rounded-md text-xs font-semibold transition-all ${activeTab === 'marking' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-zinc-500'}`}
          >
            <i className="pi pi-users mr-2 text-[10px]"></i>
            Attendance Marking Sheet
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`p-2 px-4 rounded-md text-xs font-semibold transition-all ${activeTab === 'report' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-zinc-500'}`}
          >
            <i className="pi pi-chart-bar mr-2 text-[10px]"></i>
            Class Report
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('biometric')}
              className={`p-2 px-4 rounded-md text-xs font-semibold transition-all ${activeTab === 'biometric' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-zinc-500'}`}
            >
              <i className="pi pi-print mr-2 text-[10px]"></i>
              Biometric Sync & Telemetry
            </button>
          )}
        </div>

        {selectedClassId && today && (
          <div
            className={`rounded-md border px-4 py-2.5 text-xs font-medium flex flex-wrap items-center gap-2 ${
              today.isMarked
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/40 dark:text-emerald-300'
                : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/40 dark:text-amber-300'
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
          <div className="rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center text-sm text-zinc-500">
            {isTeacher
              ? 'No classes are assigned to you yet. Ask an administrator to assign you as a class teacher or add you to the timetable.'
              : 'No classes found. Create a class under Academics first.'}
          </div>
        )}

        {activeTab === 'report' ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">
                  From
                </span>
                <Input
                  type="date"
                  value={reportFrom}
                  onChange={(e) => setReportFrom(e.target.value)}
                  className="w-40 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">
                  To
                </span>
                <Input
                  type="date"
                  value={reportTo}
                  onChange={(e) => setReportTo(e.target.value)}
                  className="w-40 text-sm"
                />
              </div>
              {report && (
                <span className="text-xs text-zinc-500 ml-auto">
                  {report.totalDays} attendance days in range
                </span>
              )}
            </div>
            {!selectedClassId ? (
              <div className="p-10 text-center text-sm text-zinc-500">
                Select a class to see its report.
              </div>
            ) : loadingReport ? (
              <div className="p-10 text-center text-sm text-zinc-500">Loading report...</div>
            ) : reportError ? (
              <div className="p-10 text-center text-sm text-rose-600">
                {apiMessage(reportErr, 'Could not load the class report.')}
              </div>
            ) : !report || report.summary.length === 0 ? (
              <div className="p-10 text-center text-sm text-zinc-500">
                No attendance recorded in this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
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
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {report.summary.map((r) => (
                      <tr key={r.student.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                        <td className="px-4 py-3 font-mono text-zinc-500">
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
                        <td className="px-4 py-3 text-center text-emerald-600 font-semibold">
                          {r.present}
                        </td>
                        <td className="px-4 py-3 text-center text-rose-600 font-semibold">
                          {r.absent}
                        </td>
                        <td className="px-4 py-3 text-center text-amber-600 font-semibold">
                          {r.late}
                        </td>
                        <td className="px-4 py-3 text-center">{r.leave}</td>
                        <td className="px-4 py-3 text-center font-semibold">
                          {r.total ? Math.round(((r.present + r.late * 0.5) / r.total) * 100) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'biometric' && isAdmin ? (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* This tab used to render hardcoded terminals — BIO-01-MAIN,
                192.168.1.120, a pulsing ONLINE dot and a "Real-Time Ingestion
                Enabled" badge — with no network call behind any of it, while the
                real provisioning endpoints went unused. Device management now
                lives on its own screen against those endpoints. */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-8 flex flex-col items-center text-center gap-3">
              <i className="pi pi-server text-3xl text-blue-500"></i>
              <h3 className="text-base font-bold text-zinc-800 dark:text-white">Biometric Units</h3>
              <p className="text-xs text-zinc-500 max-w-md">
                Provision fingerprint and face scanners, watch their heartbeat status, and revoke
                units that are lost or decommissioned.
              </p>
              <a
                href="/attendance/devices"
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-md transition-all"
              >
                Manage Devices
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard
                label="Total Students"
                value={loadingStudents ? '...' : totalCount}
                icon="pi pi-users"
                gradientClass="from-blue-500 to-blue-500"
                iconBgClass="bg-blue-500/10 dark:bg-blue-500/20"
                iconColorClass="text-blue-600 dark:text-blue-400"
                footerText="Enrolled in class"
              />
              <StatCard
                label="Present"
                value={loadingStudents ? '...' : presentCount}
                icon="pi pi-check-circle"
                gradientClass="from-emerald-500 to-teal-500"
                iconBgClass="bg-emerald-500/10 dark:bg-emerald-500/20"
                iconColorClass="text-emerald-600 dark:text-emerald-400"
                footerText={
                  totalCount > 0 ? `(${Math.round((presentCount / totalCount) * 100)}%)` : 'Active'
                }
              />
              <StatCard
                label="Absent"
                value={loadingStudents ? '...' : absentCount}
                icon="pi pi-times-circle"
                gradientClass="from-rose-500 to-red-500"
                iconBgClass="bg-rose-500/10 dark:bg-rose-500/20"
                iconColorClass="text-rose-600 dark:text-rose-400"
                footerText={
                  totalCount > 0 ? `(${Math.round((absentCount / totalCount) * 100)}%)` : 'Inactive'
                }
              />
              <StatCard
                label="Attendance Rate"
                value={loadingStudents ? '...' : `${attendanceRate}%`}
                icon="pi pi-chart-line"
                gradientClass="from-violet-500 to-purple-500"
                iconBgClass="bg-violet-500/10 dark:bg-violet-500/20"
                iconColorClass="text-violet-600 dark:text-violet-400"
                footerText="Overall attendance rate"
              />
            </div>

            {/* Action Panel */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => markAll('PRESENT')}
                  disabled={loadingStudents || totalCount === 0}
                  className="px-4 py-2 text-xs md:text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 rounded-md transition-all duration-200 active:scale-95 disabled:opacity-50"
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => markAll('ABSENT')}
                  disabled={loadingStudents || totalCount === 0}
                  className="px-4 py-2 text-xs md:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:text-rose-300 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 rounded-md transition-all duration-200 active:scale-95 disabled:opacity-50"
                >
                  Mark All Absent
                </button>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                {isModified && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium animate-pulse">
                    ● Unsaved changes
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={loadingStudents || totalCount === 0 || markBulkMutation.isPending}
                  className="w-full md:w-auto px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white text-white font-bold rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 text-xs tracking-wide"
                >
                  {markBulkMutation.isPending ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Attendance'
                  )}
                </button>
              </div>
            </div>

            {/* Students List Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm overflow-hidden mt-4">
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Student Roster
                </h2>
                <span className="text-xs font-semibold text-zinc-500">
                  {students.length} students enrolled
                </span>
              </div>

              {loadingStudents || loadingAttendance ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Loading student profiles...
                  </span>
                </div>
              ) : students.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-zinc-500 dark:text-zinc-400">
                    No students found in this class.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {students.map((student: any) => {
                    const record = localAttendance[student.id] || { status: 'PRESENT', note: '' };
                    const fullName = student.name || 'Unnamed Student';

                    return (
                      <div
                        key={student.id}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-150"
                      >
                        {/* Student Info */}
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm border border-blue-100 dark:border-blue-800/30">
                            {student.name ? student.name[0].toUpperCase() : '?'}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setDrillStudent({ id: student.id, name: fullName })}
                              className="font-semibold text-zinc-900 dark:text-white leading-snug hover:text-blue-600 hover:underline text-left"
                              title="View monthly attendance summary"
                            >
                              {fullName}
                            </button>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                              Adm No:{' '}
                              <span className="font-mono text-zinc-500 dark:text-zinc-400">
                                {student.admissionNo}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Status Select Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleStatusChange(student.id, 'PRESENT')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all duration-200 ${
                              record.status === 'PRESENT'
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.id, 'ABSENT')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all duration-200 ${
                              record.status === 'ABSENT'
                                ? 'bg-red-500 border-red-500 text-white shadow-sm'
                                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.id, 'LATE')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all duration-200 ${
                              record.status === 'LATE'
                                ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50'
                            }`}
                          >
                            Late
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.id, 'HALF_DAY')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all duration-200 ${
                              record.status === 'HALF_DAY'
                                ? 'bg-blue-500 border-blue-500 text-white shadow-sm'
                                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50'
                            }`}
                          >
                            Half Day
                          </button>
                        </div>

                        {/* Remarks Input */}
                        <div className="w-full md:w-60">
                          <input
                            type="text"
                            placeholder="Add note (optional)..."
                            value={record.note}
                            onChange={(e) => handleNoteChange(student.id, e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-md text-zinc-700 dark:text-zinc-300 outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
            <p className="text-sm text-zinc-500">Loading...</p>
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
                <p className="text-sm text-zinc-500">No attendance recorded this month.</p>
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
