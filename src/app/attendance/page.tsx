'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useClasses } from '@/hooks/queries/useAcademics';
import { useStudentsList } from '@/hooks/queries/useStudents';
import { useAttendance, useMarkBulkAttendance } from '@/hooks/queries/useAttendance';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';

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
  const toastRef = React.useRef<Toast>(null);

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
  const attendanceKey = attendanceData?.items?.map((a: any) => `${a.studentId}-${a.status}-${a.remarks || ''}`).join(',') || '';

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

  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY') => {
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
    toastRef.current?.show({
      severity: 'info',
      summary: 'Bulk Action',
      detail: `All students marked as ${status.toLowerCase()}`,
      life: 3000,
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
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Attendance saved successfully',
            life: 3000,
          });
        },
        onError: (err: any) => {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: err.message || 'Failed to save attendance',
            life: 3000,
          });
        },
      }
    );
  };

  // Stats calculation
  const totalCount = students.length;
  const presentCount = Object.values(localAttendance).filter((r) => r.status === 'PRESENT').length;
  const absentCount = Object.values(localAttendance).filter((r) => r.status === 'ABSENT').length;
  const lateCount = Object.values(localAttendance).filter((r) => r.status === 'LATE' || r.status === 'HALF_DAY').length;
  const attendanceRate = totalCount > 0 ? Math.round(((presentCount + lateCount * 0.5) / totalCount) * 100) : 0;

  return (
    <DashboardLayout>
      <Toast ref={toastRef} />
      <div className="flex flex-col gap-8 pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 rounded-2xl shadow-xl text-white">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight">Attendance Management</h1>
            </div>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              Mark, review, and synchronize student attendance status.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20">
            <div className="flex flex-col">
              <span className="text-[10px] text-blue-200 uppercase font-semibold tracking-wider">Select Class</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-transparent text-white font-medium outline-none pr-6 cursor-pointer border-none py-1 focus:ring-0"
              >
                {loadingClasses ? (
                  <option className="text-slate-800">Loading...</option>
                ) : (
                  classes.map((cls: any) => (
                    <option key={cls.id} value={cls.id} className="text-slate-800">
                      {cls.name} - {cls.section}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-blue-200 uppercase font-semibold tracking-wider">Select Date</span>
              <Calendar
                value={date}
                onChange={(e) => setDate(e.value as Date)}
                maxDate={new Date()}
                dateFormat="yy-mm-dd"
                className="bg-transparent text-white border-none py-0 focus:ring-0 calendar-custom"
                inputClassName="bg-transparent text-white border-none p-0 w-24 outline-none font-medium cursor-pointer shadow-none focus:shadow-none"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Tab Selector Bar */}
        <div className="flex bg-slate-100/50 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800 w-max">
          <button
            onClick={() => setActiveTab('marking')}
            className={`p-2 px-5 rounded-lg text-xs font-bold transition-all ${activeTab === 'marking' ? 'bg-white dark:bg-slate-950 text-indigo-500 shadow-sm' : 'text-slate-500'}`}
          >
            <i className="pi pi-users mr-2 text-[10px]"></i>
            Attendance Marking Sheet
          </button>
          <button
            onClick={() => setActiveTab('biometric')}
            className={`p-2 px-5 rounded-lg text-xs font-bold transition-all ${activeTab === 'biometric' ? 'bg-white dark:bg-slate-950 text-indigo-500 shadow-sm' : 'text-slate-500'}`}
          >
            <i className="pi pi-print mr-2 text-[10px]"></i>
            Biometric Sync & Telemetry
          </button>
        </div>

        {activeTab === 'biometric' ? (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Terminal Status telemetry */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-850 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Terminal Main</span>
                    <h4 className="text-md font-bold text-slate-850 dark:text-white mt-1">BIO-01-MAIN</h4>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4 text-xs flex flex-col gap-1.5 font-semibold text-slate-400">
                  <div className="flex justify-between"><span>Status:</span><span className="text-emerald-500">ONLINE</span></div>
                  <div className="flex justify-between"><span>IP Terminal:</span><span className="font-mono text-slate-700 dark:text-slate-350">192.168.1.120</span></div>
                  <div className="flex justify-between"><span>Last Handshake:</span><span>Just now</span></div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-850 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Hostel Terminal</span>
                    <h4 className="text-md font-bold text-slate-850 dark:text-white mt-1">BIO-02-HOSTEL</h4>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4 text-xs flex flex-col gap-1.5 font-semibold text-slate-400">
                  <div className="flex justify-between"><span>Status:</span><span className="text-emerald-500">ONLINE</span></div>
                  <div className="flex justify-between"><span>IP Terminal:</span><span className="font-mono text-slate-700 dark:text-slate-350">192.168.1.121</span></div>
                  <div className="flex justify-between"><span>Last Handshake:</span><span>3 mins ago</span></div>
                </div>
              </div>

              <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <i className="pi pi-plus text-lg text-indigo-500 mb-1"></i>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white">Add Biometric Terminal</h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Link physical fingerprint/face scanner punch logs uploads</p>
              </div>
            </div>

            {/* Recent Logs Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-850 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Recent Biometric Punches Sync Logs</h3>
                <span className="text-[10px] font-extrabold text-indigo-500 uppercase bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">Real-Time Ingestion Enabled</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-400 uppercase font-extrabold text-[9px] tracking-wider">
                      <th className="py-2.5">User ID / Card Code</th>
                      <th className="py-2.5">Student / Staff Name</th>
                      <th className="py-2.5">Terminal ID</th>
                      <th className="py-2.5">Timestamp</th>
                      <th className="py-2.5">Auto-Resolved Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold text-slate-650 dark:text-slate-350">
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 font-mono">1001</td>
                      <td className="py-3 text-slate-800 dark:text-white">Aniket Sharma</td>
                      <td className="py-3">BIO-01-MAIN</td>
                      <td className="py-3">Today, 08:12 AM</td>
                      <td className="py-3"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px]">PRESENT</span></td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 font-mono">1002</td>
                      <td className="py-3 text-slate-800 dark:text-white">Kabir Mehra</td>
                      <td className="py-3">BIO-01-MAIN</td>
                      <td className="py-3">Today, 08:42 AM</td>
                      <td className="py-3"><span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px]">LATE</span></td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 font-mono">1003</td>
                      <td className="py-3 text-slate-800 dark:text-white">Rahul Sen</td>
                      <td className="py-3">BIO-02-HOSTEL</td>
                      <td className="py-3">Today, 11:15 AM</td>
                      <td className="py-3"><span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px]">HALF_DAY</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Students</span>
                <span className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2">
                  {loadingStudents ? '...' : totalCount}
                </span>
              </div>
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Present</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                    {loadingStudents ? '...' : presentCount}
                  </span>
                  {totalCount > 0 && (
                    <span className="text-xs font-semibold text-emerald-600/70">
                      ({Math.round((presentCount / totalCount) * 100)}%)
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">Absent</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-rose-700 dark:text-rose-300">
                    {loadingStudents ? '...' : absentCount}
                  </span>
                  {totalCount > 0 && (
                    <span className="text-xs font-semibold text-rose-600/70">
                      ({Math.round((absentCount / totalCount) * 100)}%)
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100/50 dark:border-violet-900/30 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">Attendance Rate</span>
                <span className="text-3xl font-extrabold text-violet-700 dark:text-violet-300 mt-2">
                  {loadingStudents ? '...' : `${attendanceRate}%`}
                </span>
              </div>
            </div>

            {/* Action Panel */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => markAll('PRESENT')}
                  disabled={loadingStudents || totalCount === 0}
                  className="px-4 py-2 text-xs md:text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/30 dark:hover:bg-emerald-905/40 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50"
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => markAll('ABSENT')}
                  disabled={loadingStudents || totalCount === 0}
                  className="px-4 py-2 text-xs md:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:text-rose-300 dark:bg-rose-950/30 dark:hover:bg-rose-905/40 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50"
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
                  className="px-6 py-2.5 text-xs md:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {markBulkMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Student Roster</h2>
                <span className="text-xs font-semibold text-slate-400">
                  {students.length} students enrolled
                </span>
              </div>

              {loadingStudents || loadingAttendance ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading student profiles...</span>
                </div>
              ) : students.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-slate-500 dark:text-slate-400">No students found in this class.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students.map((student: any) => {
                    const record = localAttendance[student.id] || { status: 'PRESENT', note: '' };
                    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unnamed Student';
                    
                    return (
                      <div
                        key={student.id}
                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-150"
                      >
                        {/* Student Info */}
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm border border-indigo-100 dark:border-indigo-900/30">
                            {student.firstName ? student.firstName[0] : '?'}
                            {student.lastName ? student.lastName[0] : ''}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 dark:text-white leading-snug">
                              {fullName}
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                              Adm No: <span className="font-mono text-slate-500 dark:text-slate-400">{student.admissionNo}</span>
                            </p>
                          </div>
                        </div>

                        {/* Status Select Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleStatusChange(student.id, 'PRESENT')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-200 ${
                              record.status === 'PRESENT'
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20 scale-[1.03]'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.id, 'ABSENT')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-200 ${
                              record.status === 'ABSENT'
                                ? 'bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-500/20 scale-[1.03]'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.id, 'LATE')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-200 ${
                              record.status === 'LATE'
                                ? 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-500/20 scale-[1.03]'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            Late
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.id, 'HALF_DAY')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-200 ${
                              record.status === 'HALF_DAY'
                                ? 'bg-blue-500 border-blue-500 text-white shadow-sm shadow-blue-500/20 scale-[1.03]'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
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
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
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
