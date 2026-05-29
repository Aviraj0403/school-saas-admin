'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { 
  useClasses, 
  useCreateClass, 
  useSubjects, 
  useCreateSubject, 
  useCurrentAcademicYear
} from '@/hooks/queries/useAcademics';

export default function ClassesPage() {
  const [page, setPage] = useState(1);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  
  // Dialog visibility states
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  
  // Form states
  const [classForm, setClassForm] = useState({ name: '', section: '', maxStrength: 40 });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', classId: '', teacherId: '' });

  // Queries
  const { data: currentYear } = useCurrentAcademicYear();
  const { data: classes, isPending } = useClasses(page, 20);
  const { data: subjects, isPending: loadingSubjects } = useSubjects(selectedClass?.id || '');
  
  // Mutations
  const createClassMutation = useCreateClass();
  const createSubjectMutation = useCreateSubject();

  const classList = classes?.items || classes?.data?.items || [];

  const handleCreateClass = () => {
    if (!currentYear?.id) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { severity: 'error', summary: 'Error', detail: 'Active academic year not found. Please create an academic year first under "Academic Years & Terms".', life: 5000 }
      }));
      return;
    }
    createClassMutation.mutate(
      {
        name: classForm.name,
        section: classForm.section,
        maxStrength: classForm.maxStrength,
        academicYearId: currentYear.id,
      },
      {
        onSuccess: () => {
          setShowClassDialog(false);
          setClassForm({ name: '', section: '', maxStrength: 40 });
        },
      }
    );
  };

  const handleCreateSubject = () => {
    if (!selectedClass) return;
    createSubjectMutation.mutate(
      { ...subjectForm, classId: selectedClass.id },
      {
        onSuccess: () => {
          setShowSubjectDialog(false);
          setSubjectForm({ name: '', code: '', classId: '', teacherId: '' });
        },
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto p-1 animate-fade-in">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600 via-indigo-650 to-indigo-800 p-6 rounded-2xl shadow-xl text-white">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Classes & Syllabus Directory</h1>
            <p className="text-indigo-100 mt-1.5 text-xs md:text-sm">
              Setup active school grades, classes, sections and manage the academic course curriculum.
            </p>
          </div>
          <button 
            onClick={() => setShowClassDialog(true)}
            className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-xs"
          >
            <i className="pi pi-plus"></i>
            Create New Class
          </button>
        </div>

        {/* Directory Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Classes Column (Left 3 columns) */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-white">Active Classrooms</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Select a class row to inspect or modify assigned study subjects.</p>
            </div>
            
            <DataTable
              value={classList}
              loading={isPending}
              selectionMode="single"
              selection={selectedClass}
              onSelectionChange={(e) => setSelectedClass(e.value)}
              dataKey="id"
              emptyMessage="No classes configured yet."
              className="p-datatable-sm"
              rowClassName={(data: any) => `cursor-pointer transition-all duration-100 ${selectedClass?.id === data.id ? 'bg-indigo-550/5 text-indigo-600 dark:text-indigo-400 font-semibold' : ''}`}
            >
              <Column field="name" header="Class Name" sortable className="font-bold text-slate-800 dark:text-slate-100" />
              <Column field="section" header="Section" sortable />
              <Column field="maxStrength" header="Capacity (Max)" sortable />
            </DataTable>
          </div>

          {/* Subjects Column (Right 2 columns) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 dark:text-white">
                  {selectedClass ? `${selectedClass.name} (${selectedClass.section})` : 'Class Syllabus'}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {selectedClass ? 'Assigned subjects curriculum.' : 'Select a classroom to view subjects.'}
                </p>
              </div>
              {selectedClass && (
                <button 
                  onClick={() => setShowSubjectDialog(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1.5 transition-all active:scale-95 border-0"
                >
                  <i className="pi pi-plus text-[8px]"></i>
                  Add Subject
                </button>
              )}
            </div>

            {selectedClass ? (
              <DataTable
                value={Array.isArray(subjects) ? subjects : []}
                loading={loadingSubjects}
                emptyMessage="No subjects assigned to this classroom yet."
                className="p-datatable-sm mt-1"
              >
                <Column field="name" header="Subject Title" className="font-semibold text-slate-800 dark:text-slate-100 text-xs" />
                <Column field="code" header="Syllabus Code" className="font-mono text-[10px] text-slate-500" />
              </DataTable>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <i className="pi pi-book text-3xl mb-2"></i>
                <p className="text-xs font-semibold">No Class Selected</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Dialog: Add Class */}
      <Dialog 
        header="Add New Class" 
        visible={showClassDialog} 
        style={{ width: '400px' }} 
        modal 
        onHide={() => setShowClassDialog(false)}
        className="rounded-3xl shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
        contentClassName="p-6"
        headerClassName="border-b border-gray-150 dark:border-slate-800 p-6 font-bold"
        footer={
          <div className="flex justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800/80">
            <Button label="Cancel" className="p-button-text p-2 font-bold text-xs" onClick={() => setShowClassDialog(false)} />
            <Button 
              label="Create Class" 
              icon="pi pi-check" 
              loading={createClassMutation.isPending} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl border-0 font-bold text-xs" 
              onClick={handleCreateClass} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-slate-550 dark:text-slate-450 uppercase tracking-wider">Class Name *</label>
            <InputText value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} className="p-2.5 border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Class 10, Grade 5" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-slate-550 dark:text-slate-450 uppercase tracking-wider">Section *</label>
            <InputText value={classForm.section} onChange={(e) => setClassForm({ ...classForm, section: e.target.value })} className="p-2.5 border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. A, B, Science" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-slate-550 dark:text-slate-450 uppercase tracking-wider">Capacity Limit</label>
            <InputNumber value={classForm.maxStrength} onValueChange={(e) => setClassForm({ ...classForm, maxStrength: e.value || 40 })} className="border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl w-full" inputClassName="p-2.5 rounded-xl outline-none w-full" />
          </div>
        </div>
      </Dialog>

      {/* Dialog: Add Subject */}
      <Dialog 
        header={`Add Subject to ${selectedClass?.name || ''}`} 
        visible={showSubjectDialog} 
        style={{ width: '400px' }} 
        modal 
        onHide={() => setShowSubjectDialog(false)}
        className="rounded-3xl shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
        contentClassName="p-6"
        headerClassName="border-b border-gray-150 dark:border-slate-800 p-6 font-bold"
        footer={
          <div className="flex justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800/80">
            <Button label="Cancel" className="p-button-text p-2 font-bold text-xs" onClick={() => setShowSubjectDialog(false)} />
            <Button 
              label="Add Subject" 
              icon="pi pi-check" 
              loading={createSubjectMutation.isPending} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl border-0 font-bold text-xs" 
              onClick={handleCreateSubject} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-slate-550 dark:text-slate-450 uppercase tracking-wider">Subject Name *</label>
            <InputText value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} className="p-2.5 border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Mathematics" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-slate-550 dark:text-slate-450 uppercase tracking-wider">Subject Code *</label>
            <InputText value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} className="p-2.5 border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. MATH-10" />
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
