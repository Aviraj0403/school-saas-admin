'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useClasses } from '@/hooks/queries/useAcademics';
import { useStudentsList } from '@/hooks/queries/useStudents';
import { useAttendance, useMarkBulkAttendance } from '@/hooks/queries/useAttendance';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { StatCard } from '@/components/ui/StatCard';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';

interface LocalRecord {
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
  note: string;
}

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<'marking' | 'biometric'>('marking');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [localAttendance, setLocalAttendance] = useState<Record<string, LocalRecord>>({});
  const [isModified, setIsModified] = useState(false);

  // Format date to YYYY-MM-DD
  const formattedDate = date ? date.toISOString().split('T')[0] : '';

  // Queries
  const { data: classesData, isPending: loadingClasses } = useClasses(1, 100);
  const classes = classesData?.items || [];

  // Set default class if available
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // Fetch students for selected class
  const { data: studentsData, isPending: loadingStudents } = useStudentsList(
    1,
    200,
    undefined,
    selectedClassId || undefined
  );
  const students = studentsData?.items || [];

  // Fetch already marked attendance
  const { data: attendanceData, isPending: loadingAttendance } = useAttendance(
    formattedDate,
    selectedClassId || undefined
  );
  const markedAttendance = attendanceData?.items || [];

  const studentsKey = studentsData?.items?.map((s: any) => s.id).join(',') || '';
  const attendanceKey =
    attendanceData?.items
      ?.map((a: any) => `${a.studentId}-${a.status}-${a.remarks || ''}`)
      .join(',') || '';

  // Sync marked attendance into local state
  useEffect(() => {
    const initialRecords: Record<string, LocalRecord> = {};

    // Default all students to PRESENT
    const activeStudents = studentsData?.items || [];
    activeStudents.forEach((student: any) => {
      initialRecords[student.id] = {
        status: 'PRESENT',
        note: '',
      };
    });

    // Overwrite with already saved attendance from backend if present
    const marked = attendanceData?.items || [];
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
          toast.error(err.message || 'Failed to save attendance');
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
                value={date.toISOString().split('T')[0]}
                onChange={(e) => setDate(new Date(e.target.value))}
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
            onClick={() => setActiveTab('biometric')}
            className={`p-2 px-4 rounded-md text-xs font-semibold transition-all ${activeTab === 'biometric' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-zinc-500'}`}
          >
            <i className="pi pi-print mr-2 text-[10px]"></i>
            Biometric Sync & Telemetry
          </button>
        </div>

        {activeTab === 'biometric' ? (
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
                            <h3 className="font-semibold text-zinc-900 dark:text-white leading-snug">
                              {fullName}
                            </h3>
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
    </DashboardLayout>
  );
}
