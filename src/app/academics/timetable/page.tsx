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
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Timetable</h1>
            <p className="text-gray-500 mt-1">View and configure weekly class schedules.</p>
          </div>
          <Button label="Add Period" icon="pi pi-plus" className="bg-primary text-white p-2 px-4" onClick={() => setShowDialog(true)} disabled={!selectedClassId} />
        </div>

        {/* Class selector */}
        <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="font-semibold text-gray-700 dark:text-gray-300">Select Class:</label>
            <Dropdown
              value={selectedClassId}
              options={classOptions}
              onChange={(e) => setSelectedClassId(e.value)}
              placeholder="Choose a class to view timetable"
              className="border border-gray-200 rounded-md min-w-64"
            />
          </div>
        </Card>

        {/* Timetable grid */}
        {selectedClassId && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((day) => (
              <Card key={day} className="shadow-sm border border-gray-100 dark:border-slate-800">
                <h3 className="font-bold text-gray-800 dark:text-white mb-3">{DAY_MAP[day]}</h3>
                {isPending ? (
                  <div className="text-gray-400 text-sm">Loading...</div>
                ) : grouped[day]?.length ? (
                  <div className="flex flex-col gap-2">
                    {grouped[day]
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((entry: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 w-20 shrink-0">
                            {entry.startTime} – {entry.endTime}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-800 dark:text-white">{entry.subjectName || 'Subject'}</div>
                            <div className="text-xs text-gray-500">{entry.teacherName || 'Teacher'}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm italic">No periods scheduled</div>
                )}
              </Card>
            ))}
          </div>
        )}

        {!selectedClassId && (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <div className="text-center">
              <i className="pi pi-calendar text-5xl mb-3 block"></i>
              <p>Select a class above to view its timetable</p>
            </div>
          </div>
        )}
      </div>

      {/* Dialog: Add Period */}
      <Dialog header="Add Timetable Period" visible={showDialog} style={{ width: '420px' }} modal onHide={() => setShowDialog(false)}>
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Day of Week *</label>
            <Dropdown value={form.dayOfWeek} options={dayOptions} onChange={(e) => setForm({ ...form, dayOfWeek: e.value })} className="border border-gray-200 rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Subject *</label>
            <Dropdown value={form.subjectId} options={subjectOptions} onChange={(e) => setForm({ ...form, subjectId: e.value })} placeholder="Select subject" className="border border-gray-200 rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Teacher ID</label>
            <InputText value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="Staff UUID" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Start Time</label>
              <InputText type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="p-2 border border-gray-200 rounded-md" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">End Time</label>
              <InputText type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="p-2 border border-gray-200 rounded-md" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowDialog(false)} />
            <Button label="Add Period" icon="pi pi-check" loading={createMutation.isPending} className="bg-primary text-white p-2 px-4" onClick={handleCreate} />
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
