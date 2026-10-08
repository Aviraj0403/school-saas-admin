'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  useClasses,
  useTimetable,
  useCreateTimetableEntry,
  useAllSubjects,
  useDeleteTimetableSlot,
} from '@/hooks/queries/useAcademics';
import { useStaffList } from '@/hooks/queries/useStaff';
import { toast } from 'sonner';
import { Calendar, Plus, Clock, Trash2, User, BookOpen, AlertTriangle } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_MAP: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export default function TimetablePage() {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    subjectId: '',
    teacherId: '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
  });

  const { data: classes } = useClasses(1, 100);
  const { data: timetable, isPending } = useTimetable(selectedClassId);
  const { data: subjects } = useAllSubjects();
  const { data: staffData } = useStaffList(1, 100);

  const createMutation = useCreateTimetableEntry();
  const deleteMutation = useDeleteTimetableSlot();

  const handleDeleteSlot = (slotId: string) => {
    if (confirm('Are you sure you want to delete this period?')) {
      deleteMutation.mutate(slotId, {
        onSuccess: () => {
          toast.success('Period deleted successfully.');
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Failed to delete period.');
        },
      });
    }
  };

  const classOptions = (classes?.items || classes?.data?.items || []).map((c: any) => ({
    label: `${c.name} — ${c.section}`,
    value: c.id,
  }));

  const subjectOptions = Array.isArray(subjects)
    ? subjects.map((s: any) => ({ label: `${s.name} (${s.code})`, value: s.id }))
    : [];

  const teacherOptions = (staffData?.items || []).map((t: any) => ({
    label: `${t.name || t.fullName} — ${t.designation || t.role || 'Teacher'}`,
    value: t.id,
  }));

  const dayOptions = DAYS.map((d, i) => ({ label: d, value: (i + 1).toString() }));

  // Group timetable by day
  const grouped: Record<number, any[]> = {};
  if (Array.isArray(timetable)) {
    timetable.forEach((entry: any) => {
      const day = entry.dayOfWeek;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(entry);
    });
  }

  const totalPeriods = Array.isArray(timetable) ? timetable.length : 0;
  const uniqueSubjects = new Set(
    Array.isArray(timetable) ? timetable.map((e: any) => e.subjectId) : []
  ).size;
  const uniqueTeachers = new Set(
    Array.isArray(timetable) ? timetable.map((e: any) => e.teacherId) : []
  ).size;

  const handleCreate = () => {
    if (!selectedClassId) return;
    if (!form.subjectId || !form.teacherId || !form.startTime || !form.endTime) {
      toast.error('Please fill all required fields.');
      return;
    }
    createMutation.mutate(
      { ...form, classId: selectedClassId },
      {
        onSuccess: () => {
          setShowDialog(false);
          setForm({
            subjectId: '',
            teacherId: '',
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '10:00',
          });
          toast.success('Timetable slot saved successfully.');
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Failed to add period.');
        },
      }
    );
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Timetable" subtitle="Academics" />
      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-brand" />
              Class Timetable
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Structure weekly class schedules and teacher allocations
            </p>
          </div>
          <Button disabled={!selectedClassId} onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Period
          </Button>
        </div>

        {/* Class Selector + Stats */}
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          <div className="flex flex-col gap-1.5 w-full md:w-96">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Active Class
            </label>
            <Select
              value={selectedClassId}
              options={[{ label: 'Select a Class to manage schedule', value: '' }, ...classOptions]}
              onChange={(e) => setSelectedClassId(e.target.value)}
            />
          </div>

          {selectedClassId && (
            <div className="flex gap-4 flex-wrap">
              <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand/10 text-brand">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                    {totalPeriods}
                  </p>
                  <p className="text-xs text-zinc-500 font-medium">Weekly Periods</p>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                    {uniqueSubjects}
                  </p>
                  <p className="text-xs text-zinc-500 font-medium">Total Subjects</p>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                    {uniqueTeachers}
                  </p>
                  <p className="text-xs text-zinc-500 font-medium">Teachers</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timetable Grid */}
        {selectedClassId ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((day) => (
                <div
                  key={day}
                  className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl flex flex-col shadow-sm overflow-hidden"
                >
                  <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/40 flex justify-between items-center">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                      {DAY_MAP[day]}
                    </h3>
                    <Badge variant="secondary">{grouped[day]?.length || 0} slots</Badge>
                  </div>

                  <div className="p-3 flex-1 flex flex-col gap-3 min-h-[260px]">
                    {isPending ? (
                      <div className="flex items-center justify-center h-full py-10">
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-brand border-t-transparent" />
                      </div>
                    ) : grouped[day]?.length ? (
                      <div className="flex flex-col gap-3">
                        {grouped[day]
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map((entry: any, idx: number) => (
                            <div
                              key={entry.id || idx}
                              className="relative group/slot flex flex-col gap-1.5 p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 hover:border-brand/40 transition-all"
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 pr-4 leading-tight">
                                  {entry.subject?.name || entry.subjectName || 'Subject'}
                                </span>
                                <button
                                  onClick={() => handleDeleteSlot(entry.id)}
                                  className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-all opacity-0 group-hover/slot:opacity-100"
                                  title="Delete Period"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                                <Clock className="w-3 h-3 text-brand" />
                                <span className="text-xs font-mono">
                                  {entry.startTime} – {entry.endTime}
                                </span>
                              </div>
                              {(entry.teacher?.name || entry.teacherName) && (
                                <div className="flex items-center gap-1.5 mt-1 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
                                  <User className="w-3 h-3 text-zinc-400" />
                                  <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate">
                                    {entry.teacher?.name || entry.teacherName}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
                        <Calendar className="w-8 h-8 mb-1" />
                        <span className="text-xs font-medium">Free Day</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-900/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setForm((f) => ({
                          ...f,
                          dayOfWeek: day,
                          startTime: '09:00',
                          endTime: '10:00',
                        }));
                        setShowDialog(true);
                      }}
                      className="w-full text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Period
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Teacher Subject Allocation Summary */}
            {Array.isArray(timetable) && timetable.length > 0 && (
              <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-brand" />
                  Teacher — Subject Allocation Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(
                    timetable.reduce((acc: any, entry: any) => {
                      const tName =
                        entry.teacher?.name || entry.teacherName || entry.teacherId || 'Unknown';
                      if (!acc[tName]) acc[tName] = new Set();
                      acc[tName].add(entry.subject?.name || entry.subjectName || 'Subject');
                      return acc;
                    }, {})
                  ).map(([teacher, subjectsSet]: [string, any]) => (
                    <div
                      key={teacher}
                      className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80"
                    >
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-brand" />
                        {teacher}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {[...subjectsSet].map((sub: string) => (
                          <Badge key={sub} variant="secondary">
                            {sub}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-16 text-center bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl shadow-sm">
            <Calendar className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-600 dark:text-zinc-400 font-semibold text-sm">
              Select a class from the dropdown above to view and manage its timetable.
            </p>
            <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1">
              You can add periods for each day once a class is selected.
            </p>
          </div>
        )}
      </div>

      {/* Add Period Dialog */}
      <Dialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title={`Add Period — ${DAY_MAP[form.dayOfWeek]}`}
      >
        <div className="flex flex-col gap-4 py-2">
          {/* Day of Week */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Day of Week *
            </label>
            <Select
              value={form.dayOfWeek.toString()}
              options={dayOptions}
              onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
            />
          </div>

          {/* Subject */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Subject *
            </label>
            <Select
              value={form.subjectId}
              options={[{ label: 'Select Subject', value: '' }, ...subjectOptions]}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
            />
          </div>

          {/* Teacher */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Assigned Teacher *
            </label>
            <Select
              value={form.teacherId}
              options={[{ label: 'Select Teacher', value: '' }, ...teacherOptions]}
              onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
            />
          </div>

          {/* Time Slot */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Start Time
              </label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                End Time
              </label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
          </div>

          {subjectOptions.length === 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              No subjects in curriculum yet. Add subjects first via Subjects page.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} isLoading={createMutation.isPending}>
            Save Period
          </Button>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
