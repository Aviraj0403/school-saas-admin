'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { 
  useClasses, 
  useTimetable, 
  useCreateTimetableEntry, 
  useAllSubjects 
} from '@/hooks/queries/useAcademics';
import { useStaffList } from '@/hooks/queries/useStaff';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_MAP: Record<number, string> = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };

const DAY_COLORS: Record<number, string> = {
  1: 'from-blue-50   to-blue-100/50   dark:from-blue-950/20   dark:to-blue-950/10   border-blue-200/50   dark:border-blue-800/30',
  2: 'from-violet-50  to-violet-100/50  dark:from-violet-950/20  dark:to-violet-950/10  border-violet-200/50  dark:border-violet-800/30',
  3: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-950/10 border-emerald-200/50 dark:border-emerald-800/30',
  4: 'from-amber-50   to-amber-100/50   dark:from-amber-950/20   dark:to-amber-950/10   border-amber-200/50   dark:border-amber-800/30',
  5: 'from-rose-50    to-rose-100/50    dark:from-rose-950/20    dark:to-rose-950/10    border-rose-200/50    dark:border-rose-800/30',
  6: 'from-indigo-50  to-indigo-100/50  dark:from-indigo-950/20  dark:to-indigo-950/10  border-indigo-200/50  dark:border-indigo-800/30',
};

const SLOT_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-teal-500',
];

export default function TimetablePage() {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    subjectId: '',
    teacherId: '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime:   '10:00',
  });

  const { data: classes }           = useClasses(1, 100);
  const { data: timetable, isPending } = useTimetable(selectedClassId);
  const { data: subjects }           = useAllSubjects();           // global subjects list
  const { data: staffData }          = useStaffList(1, 200);       // all teachers

  const createMutation = useCreateTimetableEntry();

  // ── Options ───────────────────────────────────────────────────────
  const classOptions = (classes?.items || classes?.data?.items || []).map((c: any) => ({
    label: `${c.name} — ${c.section}`,
    value: c.id,
  }));

  const subjectOptions = Array.isArray(subjects)
    ? subjects.map((s: any) => ({ label: `${s.name} (${s.code})`, value: s.id }))
    : [];

  const teacherOptions = (staffData?.items || []).map((t: any) => ({
    label: `${t.name} — ${t.designation || t.role || 'Teacher'}`,
    value: t.id,
  }));

  const dayOptions = DAYS.map((d, i) => ({ label: d, value: i + 1 }));

  const selectedClass = (classes?.items || classes?.data?.items || []).find((c: any) => c.id === selectedClassId);

  // ── Group timetable by day ─────────────────────────────────────
  const grouped: Record<number, any[]> = {};
  if (Array.isArray(timetable)) {
    timetable.forEach((entry: any) => {
      const day = entry.dayOfWeek;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(entry);
    });
  }

  const totalPeriods = Array.isArray(timetable) ? timetable.length : 0;
  const uniqueSubjects = new Set(Array.isArray(timetable) ? timetable.map((e: any) => e.subjectId) : []).size;
  const uniqueTeachers = new Set(Array.isArray(timetable) ? timetable.map((e: any) => e.teacherId) : []).size;

  const handleCreate = () => {
    if (!selectedClassId) return;
    if (!form.subjectId || !form.teacherId) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { severity: 'warn', summary: 'Required', detail: 'Please select both a Subject and a Teacher.', life: 3000 }
      }));
      return;
    }
    createMutation.mutate(
      { ...form, classId: selectedClassId },
      {
        onSuccess: () => {
          setShowDialog(false);
          setForm({ subjectId: '', teacherId: '', dayOfWeek: 1, startTime: '09:00', endTime: '10:00' });
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { severity: 'success', summary: 'Period Added', detail: 'Timetable slot saved successfully.', life: 3000 }
          }));
        },
        onError: (err: any) => {
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { severity: 'error', summary: 'Error', detail: err?.response?.data?.message || 'Failed to add period.', life: 4000 }
          }));
        }
      }
    );
  };
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 pb-10 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 rounded-2xl shadow-xl text-white">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Class Timetable Builder</h1>
            <p className="text-blue-100 mt-1.5 text-xs md:text-sm">
              Configure weekly schedules, assign teachers to periods, and manage the academic calendar.
            </p>
          </div>
          <button
            disabled={!selectedClassId}
            onClick={() => setShowDialog(true)}
            className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm"
          >
            <i className="pi pi-plus"></i> Add Period
          </button>
        </div>

        {/* Class Selector + Stats */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-end gap-5">
          <div className="flex flex-col gap-1.5 w-full md:w-80">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Select Class</label>
            <Dropdown
              value={selectedClassId}
              options={[{ label: '— Choose a Class —', value: '' }, ...classOptions]}
              onChange={(e) => setSelectedClassId(e.value)}
              placeholder="Choose academic class"
              filter
              filterPlaceholder="Search class..."
              className="border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl w-full"
            />
          </div>

          {selectedClassId && (
            <div className="flex gap-4 flex-wrap">
              {[
                { label: 'Total Periods', val: totalPeriods,    icon: 'pi-clock',       color: 'indigo' },
                { label: 'Subjects',      val: uniqueSubjects,  icon: 'pi-book',         color: 'emerald' },
                { label: 'Teachers',      val: uniqueTeachers,  icon: 'pi-user',         color: 'violet' },
              ].map(stat => (
                <div key={stat.label} className={`bg-${stat.color}-50 dark:bg-${stat.color}-950/20 border border-${stat.color}-100/50 dark:border-${stat.color}-800/30 rounded-xl px-4 py-2.5 flex items-center gap-2.5`}>
                  <i className={`pi ${stat.icon} text-${stat.color}-500`}></i>
                  <div>
                    <p className={`text-xs font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.val}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timetable Grid */}
        {selectedClassId ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((day) => (
                <div
                  key={day}
                  className={`bg-gradient-to-br ${DAY_COLORS[day]} border rounded-2xl p-5 flex flex-col gap-3 shadow-sm`}
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700/40">
                    <h3 className="font-black text-slate-800 dark:text-white text-sm">{DAY_MAP[day]}</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/60 dark:bg-slate-800/40 px-2 py-0.5 rounded-full">
                      {grouped[day]?.length || 0} periods
                    </span>
                  </div>

                  {isPending ? (
                    <div className="flex items-center gap-2 py-2">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-slate-400">Loading...</span>
                    </div>
                  ) : grouped[day]?.length ? (
                    <div className="flex flex-col gap-2">
                      {grouped[day]
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map((entry: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2.5 p-2.5 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/50 dark:border-slate-700/30 hover:shadow-sm transition-all"
                          >
                            <div className={`w-1 h-10 rounded-full ${SLOT_COLORS[idx % SLOT_COLORS.length]} shrink-0`} />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                                {entry.subject?.name || entry.subjectName || 'Subject'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {entry.startTime} – {entry.endTime}
                              </span>
                              {(entry.teacher?.name || entry.teacherName) && (
                                <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold truncate">
                                  <i className="pi pi-user text-[8px] mr-0.5"></i>
                                  {entry.teacher?.name || entry.teacherName}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs font-medium">
                      <i className="pi pi-calendar block text-2xl mb-1 opacity-30"></i>
                      No periods scheduled
                    </div>
                  )}

                  <button
                    onClick={() => { setForm(f => ({ ...f, dayOfWeek: day })); setShowDialog(true); }}
                    className="mt-1 w-full py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/30 hover:bg-white/80 dark:hover:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/30 rounded-lg transition-all flex items-center justify-center gap-1"
                  >
                    <i className="pi pi-plus text-[8px]"></i> Add Period
                  </button>
                </div>
              ))}
            </div>

            {/* Teacher Subject Assignment Summary */}
            {Array.isArray(timetable) && timetable.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <i className="pi pi-id-card text-indigo-500"></i>
                  Teacher — Subject Allocation Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(
                    timetable.reduce((acc: any, entry: any) => {
                      const tName = entry.teacher?.name || entry.teacherName || entry.teacherId || 'Unknown';
                      if (!acc[tName]) acc[tName] = new Set();
                      acc[tName].add(entry.subject?.name || entry.subjectName || 'Subject');
                      return acc;
                    }, {})
                  ).map(([teacher, subjectsSet]: [string, any]) => (
                    <div key={teacher} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <p className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                        <i className="pi pi-user text-indigo-500 text-[10px]"></i>
                        {teacher}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {[...subjectsSet].map((sub: string) => (
                          <span key={sub} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full border border-indigo-100/50 dark:border-indigo-800/30">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-20 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
            <i className="pi pi-calendar text-5xl text-slate-200 dark:text-slate-700 mb-4 block"></i>
            <p className="text-slate-400 font-semibold text-sm">Select a class from the dropdown above to view and manage its timetable.</p>
            <p className="text-slate-300 dark:text-slate-600 text-xs mt-1">You can add periods for each day once a class is selected.</p>
          </div>
        )}
      </div>

      {/* ── Dialog: Add Period ──────────────────────────────────── */}
      <Dialog
        header={`Add Period — ${DAY_MAP[form.dayOfWeek]}`}
        visible={showDialog}
        style={{ width: '460px' }}
        modal
        onHide={() => setShowDialog(false)}
        className="rounded-3xl shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
        contentClassName="p-6"
        headerClassName="border-b border-gray-150 dark:border-slate-800 p-6 font-extrabold text-slate-800 dark:text-white"
        footer={
          <div className="flex justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800/80">
            <Button label="Cancel" className="p-button-text p-2 font-bold text-xs" onClick={() => setShowDialog(false)} />
            <Button
              label="Save Period"
              icon="pi pi-check"
              loading={createMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl border-0 font-bold text-xs"
              onClick={handleCreate}
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-2">

          {/* Day of Week */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Day of Week *</label>
            <Dropdown
              value={form.dayOfWeek}
              options={dayOptions}
              onChange={(e) => setForm({ ...form, dayOfWeek: e.value })}
              className="border border-gray-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          {/* Subject */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subject *</label>
            <Dropdown
              value={form.subjectId}
              options={[{ label: '— Select Subject —', value: '' }, ...subjectOptions]}
              onChange={(e) => setForm({ ...form, subjectId: e.value })}
              placeholder="Select subject from curriculum"
              filter
              filterPlaceholder="Search subjects..."
              className="border border-gray-200 dark:border-slate-700 rounded-xl"
              emptyMessage="No subjects added yet. Add subjects in Classes page."
            />
          </div>

          {/* Teacher */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned Teacher *</label>
            <Dropdown
              value={form.teacherId}
              options={[{ label: '— Select Teacher —', value: '' }, ...teacherOptions]}
              onChange={(e) => setForm({ ...form, teacherId: e.value })}
              placeholder="Select from staff directory"
              filter
              filterPlaceholder="Search by name..."
              className="border border-gray-200 dark:border-slate-700 rounded-xl"
              emptyMessage="No staff found. Add teachers in the Teacher Directory."
            />
          </div>

          {/* Time Slot */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Start Time</label>
              <InputText
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="p-2.5 border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">End Time</label>
              <InputText
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="p-2.5 border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {subjectOptions.length === 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-800/30 rounded-xl text-amber-700 dark:text-amber-400 text-[11px] font-semibold flex items-center gap-2">
              <i className="pi pi-exclamation-triangle"></i>
              No subjects in curriculum yet. Add subjects first via <strong>Classes &amp; Subjects</strong> page.
            </div>
          )}
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
