'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { useClasses, useTimetable, useCreateTimetableEntry, useSubjects } from '@/hooks/queries/useAcademics';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_MAP: Record<number, string> = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };

export default function TimetablePage() {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ subjectId: '', teacherId: '', dayOfWeek: 1, startTime: '09:00', endTime: '10:00' });

  const { data: classes } = useClasses(1, 100);
  const { data: timetable, isPending } = useTimetable(selectedClassId);
  const { data: subjects } = useSubjects(selectedClassId);
  const createMutation = useCreateTimetableEntry();

  const classOptions = classes?.data?.items?.map((c: any) => ({ label: `${c.name} - ${c.section}`, value: c.id })) || [];
  const subjectOptions = Array.isArray(subjects) ? subjects.map((s: any) => ({ label: s.name, value: s.id })) : [];
  const dayOptions = DAYS.map((d, i) => ({ label: d, value: i + 1 }));

  const handleCreate = () => {
    if (!selectedClassId) return;
    createMutation.mutate(
      { ...form, classId: selectedClassId },
      {
        onSuccess: () => {
          setShowDialog(false);
          setForm({ subjectId: '', teacherId: '', dayOfWeek: 1, startTime: '09:00', endTime: '10:00' });
        },
      }
    );
  };

  // Group timetable entries by day
  const grouped: Record<number, any[]> = {};
  if (Array.isArray(timetable)) {
    timetable.forEach((entry: any) => {
      const day = entry.dayOfWeek;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(entry);
    });
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto p-1">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 rounded-2xl shadow-xl text-white">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Academic Timetable</h1>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              Set schedules, configure periodic slots, and assign teacher lectures by classroom.
            </p>
          </div>
          <button 
            disabled={!selectedClassId}
            onClick={() => setShowDialog(true)}
            className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm"
          >
            <i className="pi pi-plus"></i>
            Add Period
          </button>
        </div>

        {/* Class Selection Dropdown Block */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex items-center gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5 w-full md:w-80">
            <span className="text-xs font-semibold text-slate-400">Target Classroom</span>
            <Dropdown
              value={selectedClassId}
              options={classOptions}
              onChange={(e) => setSelectedClassId(e.value)}
              placeholder="Choose academic class"
              className="border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl w-full"
            />
          </div>
        </div>

        {/* Timetable Weekly Grid */}
        {selectedClassId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((day) => (
              <div 
                key={day} 
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-5 rounded-3xl shadow-sm flex flex-col gap-4"
              >
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-base">{DAY_MAP[day]}</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {grouped[day]?.length || 0} Periods
                  </span>
                </div>
                
                {isPending ? (
                  <span className="text-xs text-slate-400">Loading period data...</span>
                ) : grouped[day]?.length ? (
                  <div className="flex flex-col gap-3">
                    {grouped[day]
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((entry: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="flex items-center gap-3.5 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/10 rounded-2xl group hover:scale-[1.02] transition-all duration-200"
                        >
                          <div className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 w-24 shrink-0 bg-indigo-500/10 dark:bg-indigo-950/30 p-2 rounded-xl text-center">
                            {entry.startTime} – {entry.endTime}
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-150">
                              {entry.subjectName || 'Lecture Period'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                              {entry.teacherName || 'Not Assigned'}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs italic py-4">No schedules registered.</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-20 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
            <i className="pi pi-calendar-plus text-5xl text-slate-300 dark:text-slate-700 mb-3 block"></i>
            <p className="text-slate-400 font-semibold text-sm">Please select a class from the dropdown above to view the schedule.</p>
          </div>
        )}

      </div>

      {/* Dialog: Add Period */}
      <Dialog 
        header="Add Schedule Period Slot" 
        visible={showDialog} 
        style={{ width: '420px' }} 
        modal 
        onHide={() => setShowDialog(false)}
        className="dialog-custom rounded-3xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowDialog(false)} />
            <Button 
              label="Add Period" 
              icon="pi pi-check" 
              loading={createMutation.isPending} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" 
              onClick={handleCreate} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Day of Week *</label>
            <Dropdown value={form.dayOfWeek} options={dayOptions} onChange={(e) => setForm({ ...form, dayOfWeek: e.value })} className="border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Subject *</label>
            <Dropdown value={form.subjectId} options={subjectOptions} onChange={(e) => setForm({ ...form, subjectId: e.value })} placeholder="Select subject" className="border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Teacher ID</label>
            <InputText value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="p-2 border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="Staff UUID" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Start Time</label>
              <InputText type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="p-2 border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">End Time</label>
              <InputText type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl" />
            </div>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
