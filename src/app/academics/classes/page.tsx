'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dropdown } from 'primereact/dropdown';
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
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Classes & Subjects</h1>
            <p className="text-gray-500 mt-1">Manage class sections and assign subjects to each class.</p>
          </div>
          <Button label="Add Class" icon="pi pi-plus" className="bg-primary text-white p-2 px-4" onClick={() => setShowClassDialog(true)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Classes list */}
          <Card className="shadow-sm border border-gray-100 dark:border-slate-800" title="All Classes">
            <DataTable
              value={classList}
              loading={isPending}
              selectionMode="single"
              selection={selectedClass}
              onSelectionChange={(e) => setSelectedClass(e.value)}
              dataKey="id"
              emptyMessage="No classes configured yet."
              stripedRows
              className="p-datatable-sm mt-2"
            >
              <Column field="name" header="Class" sortable />
              <Column field="section" header="Section" sortable />
              <Column field="capacity" header="Capacity" sortable />
            </DataTable>
          </Card>

          {/* Subjects for selected class */}
          <Card
            className="shadow-sm border border-gray-100 dark:border-slate-800"
            title={selectedClass ? `Subjects — ${selectedClass.name} ${selectedClass.section}` : 'Select a class to view subjects'}
          >
            {selectedClass && (
              <div className="flex justify-end mb-3">
                <Button label="Add Subject" icon="pi pi-plus" size="small" className="bg-primary text-white p-1 px-3" onClick={() => setShowSubjectDialog(true)} />
              </div>
            )}
            <DataTable
              value={Array.isArray(subjects) ? subjects : []}
              loading={loadingSubjects}
              emptyMessage={selectedClass ? 'No subjects assigned.' : 'Select a class first.'}
              stripedRows
              className="p-datatable-sm"
            >
              <Column field="name" header="Subject Name" />
              <Column field="code" header="Code" />
            </DataTable>
          </Card>
        </div>
      </div>

      {/* Dialog: Add Class */}
      <Dialog header="Add New Class" visible={showClassDialog} style={{ width: '400px' }} modal onHide={() => setShowClassDialog(false)}>
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Class Name *</label>
            <InputText value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="e.g. Class 10, Grade 5" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Section *</label>
            <InputText value={classForm.section} onChange={(e) => setClassForm({ ...classForm, section: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="e.g. A, B, Science" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Capacity</label>
            <InputNumber value={classForm.capacity} onValueChange={(e) => setClassForm({ ...classForm, capacity: e.value || 40 })} className="border border-gray-200 rounded-md" />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowClassDialog(false)} />
            <Button label="Create Class" icon="pi pi-check" loading={createClassMutation.isPending} className="bg-primary text-white p-2 px-4" onClick={handleCreateClass} />
          </div>
        </div>
      </Dialog>

      {/* Dialog: Add Subject */}
      <Dialog header={`Add Subject to ${selectedClass?.name || ''}`} visible={showSubjectDialog} style={{ width: '400px' }} modal onHide={() => setShowSubjectDialog(false)}>
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Subject Name *</label>
            <InputText value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="e.g. Mathematics, Physics" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Subject Code *</label>
            <InputText value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="e.g. MATH-10, PHY-12" />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowSubjectDialog(false)} />
            <Button label="Add Subject" icon="pi pi-check" loading={createSubjectMutation.isPending} className="bg-primary text-white p-2 px-4" onClick={handleCreateSubject} />
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
