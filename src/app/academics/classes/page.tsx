'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { useClasses, useCreateClass, useSubjects, useCreateSubject } from '@/hooks/queries/useAcademics';

export default function ClassesPage() {
  const [page, setPage] = useState(1);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [classForm, setClassForm] = useState({ name: '', section: '', capacity: 40 });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', classId: '', teacherId: '' });

  const { data: classes, isPending } = useClasses(page, 20);
  const { data: subjects, isPending: loadingSubjects } = useSubjects(selectedClass?.id || '');
  const createClassMutation = useCreateClass();
  const createSubjectMutation = useCreateSubject();

  const classList = classes?.data?.items || [];

  const handleCreateClass = () => {
    createClassMutation.mutate(classForm, {
      onSuccess: () => {
        setShowClassDialog(false);
        setClassForm({ name: '', section: '', capacity: 40 });
      },
    });
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
      <div className="flex flex-col gap-6 max-w-7xl mx-auto p-1">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 rounded-2xl shadow-xl text-white">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Classes & Curriculums</h1>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              Establish academic classrooms, configure student capacity limits, and assign study subjects.
            </p>
          </div>
          <button 
            onClick={() => setShowClassDialog(true)}
            className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm"
          >
            <i className="pi pi-plus"></i>
            Add Class
          </button>
        </div>

        {/* Workspace Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Classes Column (Left 3 columns) */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Active Classes</h2>
              <p className="text-xs text-slate-400">Select a class row to inspect assigned study subjects.</p>
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
              rowClassName={(data: any) => `cursor-pointer transition-all duration-100 ${selectedClass?.id === data.id ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''}`}
            >
              <Column field="name" header="Class Name" sortable className="font-semibold text-slate-800 dark:text-white" />
              <Column field="section" header="Section" sortable />
              <Column field="capacity" header="Capacity (Max)" sortable />
            </DataTable>
          </div>

          {/* Subjects Column (Right 2 columns) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  {selectedClass ? `${selectedClass.name} - ${selectedClass.section}` : 'Class Syllabus'}
                </h2>
                <p className="text-xs text-slate-400">
                  {selectedClass ? 'Assigned subjects curriculum.' : 'Select class to view assigned subjects.'}
                </p>
              </div>
              {selectedClass && (
                <button 
                  onClick={() => setShowSubjectDialog(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <i className="pi pi-plus text-[10px]"></i>
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
                <Column field="name" header="Subject Title" className="font-semibold text-slate-800 dark:text-white" />
                <Column field="code" header="Syllabus Code" className="font-mono text-xs text-slate-500" />
              </DataTable>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 border border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
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
        className="dialog-custom rounded-3xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowClassDialog(false)} />
            <Button 
              label="Create Class" 
              icon="pi pi-check" 
              loading={createClassMutation.isPending} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" 
              onClick={handleCreateClass} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Class Name *</label>
            <InputText value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="e.g. Class 10, Grade 5" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Section *</label>
            <InputText value={classForm.section} onChange={(e) => setClassForm({ ...classForm, section: e.target.value })} className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="e.g. A, B, Science" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Capacity Limit</label>
            <InputNumber value={classForm.capacity} onValueChange={(e) => setClassForm({ ...classForm, capacity: e.value || 40 })} className="border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl" />
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
        className="dialog-custom rounded-3xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowSubjectDialog(false)} />
            <Button 
              label="Add Subject" 
              icon="pi pi-check" 
              loading={createSubjectMutation.isPending} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" 
              onClick={handleCreateSubject} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Subject Name *</label>
            <InputText value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="e.g. Mathematics" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Subject Code *</label>
            <InputText value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="e.g. MATH-10" />
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
