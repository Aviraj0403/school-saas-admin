'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';

import { 
  useClasses, 
  useCreateClass, 
  useSubjects, 
  useAllSubjects,
  useCreateSubject, 
  useDeleteSubject,
  useCurrentAcademicYear,
  useDepartmentsList,
  useAssignSubjectsToClass,
} from '@/hooks/queries/useAcademics';

const SUBJECT_TYPES = [
  { label: 'Theory', value: 'theory' },
  { label: 'Practical', value: 'practical' },
  { label: 'Theory + Practical', value: 'both' },
  { label: 'Language', value: 'language' },
  { label: 'Co-Curricular', value: 'cocurricular' },
];

export default function ClassesPage() {
  const [page, setPage] = useState(1);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  
  // Dialog visibility states
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  
  // Form states
  const [classForm, setClassForm] = useState({ name: '', section: '', maxStrength: 40, roomNo: '' });
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    type: 'theory',
    departmentId: '',
    maxMarks: 100,
    passMarks: 33,
  });
  const [assignSubjectIds, setAssignSubjectIds] = useState<string[]>([]);

  // Queries
  const { data: currentYear } = useCurrentAcademicYear();
  const { data: classes, isPending } = useClasses(page, 20);
  const { data: subjects, isPending: loadingSubjects } = useSubjects(selectedClass?.id || '');
  const { data: allSubjectsData } = useAllSubjects();
  const { data: departments } = useDepartmentsList();
  
  // Mutations
  const createClassMutation = useCreateClass();
  const createSubjectMutation = useCreateSubject();
  const deleteSubjectMutation = useDeleteSubject();
  const assignSubjectsMutation = useAssignSubjectsToClass();

  const classList = classes?.items || classes?.data?.items || [];
  const subjectList = Array.isArray(subjects) ? subjects : [];
  const allSubjectsList = Array.isArray(allSubjectsData) ? allSubjectsData : [];
  
  const departmentOptions = Array.isArray(departments)
    ? departments.map((d: any) => ({ label: d.name, value: d.id }))
    : [];

  const handleCreateClass = () => {
    if (!currentYear?.id) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { severity: 'error', summary: 'No Active Academic Year', detail: 'Please create an Academic Year first under Academics → Terms & Years.', life: 5000 }
      }));
      return;
    }
    createClassMutation.mutate(
      {
        name: classForm.name,
        section: classForm.section,
        maxStrength: classForm.maxStrength,
        academicYearId: currentYear.id,
        roomNo: classForm.roomNo || undefined,
      },
      {
        onSuccess: () => {
          setShowClassDialog(false);
          setClassForm({ name: '', section: '', maxStrength: 40, roomNo: '' });
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { severity: 'success', summary: 'Class Created', detail: `${classForm.name} - ${classForm.section} added successfully.`, life: 3000 }
          }));
        },
        onError: (err: any) => {
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { severity: 'error', summary: 'Error', detail: err?.response?.data?.message || 'Failed to create class.', life: 4000 }
          }));
        }
      }
    );
  };

  const handleCreateSubject = () => {
    if (!subjectForm.name || !subjectForm.code) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { severity: 'warn', summary: 'Validation', detail: 'Subject Name and Code are required.', life: 3000 }
      }));
      return;
    }
    createSubjectMutation.mutate(
      {
        name: subjectForm.name,
        code: subjectForm.code,
        type: subjectForm.type,
        departmentId: subjectForm.departmentId || undefined,
        maxMarks: subjectForm.maxMarks,
        passMarks: subjectForm.passMarks,
        classIds: selectedClass ? [selectedClass.id] : [],
      },
      {
        onSuccess: () => {
          setShowSubjectDialog(false);
          setSubjectForm({ name: '', code: '', type: 'theory', departmentId: '', maxMarks: 100, passMarks: 33 });
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { severity: 'success', summary: 'Subject Added', detail: `${subjectForm.name} created${selectedClass ? ` and linked to ${selectedClass.name}` : ''}.`, life: 3000 }
          }));
        },
        onError: (err: any) => {
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { severity: 'error', summary: 'Error', detail: err?.response?.data?.message || 'Failed to add subject.', life: 4000 }
          }));
        }
      }
    );
  };

  const handleAssignSubjects = () => {
    if (!selectedClass || assignSubjectIds.length === 0) return;
    
    // Merge existing subject IDs with newly selected ones so we don't drop existing ones
    const existingIds = subjectList.map((s: any) => s.id);
    const newSubjectIds = Array.from(new Set([...existingIds, ...assignSubjectIds]));

    assignSubjectsMutation.mutate(
      { classId: selectedClass.id, subjectIds: newSubjectIds },
      {
        onSuccess: () => {
          setShowAssignDialog(false);
          setAssignSubjectIds([]);
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { severity: 'success', summary: 'Subjects Assigned', detail: `Successfully updated subjects for ${selectedClass.name}`, life: 3000 }
          }));
        },
        onError: (err: any) => {
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { severity: 'error', summary: 'Error', detail: err?.response?.data?.message || 'Failed to assign subjects.', life: 4000 }
          }));
        }
      }
    );
  };

  const subjectTypeTag = (type: string) => {
    const map: Record<string, { label: string; color: string }> = {
      theory: { label: 'Theory', color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400' },
      practical: { label: 'Practical', color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400' },
      both: { label: 'Theory+Prac', color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400' },
      language: { label: 'Language', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' },
      cocurricular: { label: 'Co-Curr.', color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' },
    };
    const t = map[type] || map.theory;
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.color}`}>{t.label}</span>;
  };

  // Filter out subjects already assigned to the selected class
  const availableSubjectsToAssign = allSubjectsList.filter(
    (sub: any) => !subjectList.some((s: any) => s.id === sub.id)
  );

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Classes" subtitle="Academics" />
<div className="flex flex-col gap-4 pb-10 animate-fade-in">
        
        {/* Header Block */}
        <div className="flex flex-col items-start gap-4 pb-4">
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setShowSubjectDialog(true)}
              className="flex-1 md:flex-none px-4 py-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium rounded-md shadow-sm transition-all text-sm flex items-center justify-center gap-2"
            >
              <i className="pi pi-book text-xs"></i> New Subject
            </button>
            <button 
              onClick={() => setShowClassDialog(true)}
              className="w-full sm:w-auto bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold border-0 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all active:scale-95 flex items-center justify-center gap-2 text-sm ring-1 ring-slate-900/5 dark:ring-white/10 px-5 py-3"
            >
              <i className="pi pi-plus text-xs"></i>
              New Class
            </button>
          </div>
        </div>

        {/* Academic year pill */}
        {currentYear && (
          <div className="flex items-center gap-2 -mt-3">
            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1.5">
              <i className="pi pi-calendar text-[10px]"></i>
              Active Year: {currentYear.name}
            </span>
          </div>
        )}

        {/* Directory Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Classes Column (Left 3 columns) */}
          <div className="lg:col-span-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md p-5 flex flex-col gap-4 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Active Classrooms</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Select a class row to view its assigned subjects.</p>
            </div>
            
            <DataTable
              value={classList}
              loading={isPending}
              selectionMode="single"
              selection={selectedClass}
              onSelectionChange={(e) => setSelectedClass(e.value)}
              dataKey="id"
              emptyMessage="No classes configured yet. Create one using 'New Class'."
              className="p-datatable-sm"
              rowClassName={(data: any) => `cursor-pointer transition-all duration-100 ${selectedClass?.id === data.id ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : ''}`}
            >
              <Column field="name" header="Class" sortable className="font-semibold text-zinc-900 dark:text-zinc-100" />
              <Column field="section" header="Section" sortable />
              <Column field="roomNo" header="Room" body={(d) => d.roomNo || '—'} />
              <Column field="maxStrength" header="Capacity" sortable />
              <Column 
                header="Students" 
                body={(d) => (
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {d._count?.students ?? 0}
                  </span>
                )} 
              />
            </DataTable>
          </div>

          {/* Subjects Column (Right 2 columns) */}
          <div className="lg:col-span-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md p-5 flex flex-col gap-4 shadow-sm relative">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  {selectedClass ? `${selectedClass.name} — ${selectedClass.section}` : 'Subject Catalog'}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {selectedClass ? 'Subjects linked to this class.' : 'Select a class to view its subjects.'}
                </p>
              </div>
              {selectedClass && (
                <button
                  onClick={() => setShowAssignDialog(true)}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-md transition-all flex items-center gap-1.5"
                >
                  <i className="pi pi-link text-[10px]"></i> Link Existing
                </button>
              )}
            </div>

            {selectedClass ? (
              subjectList.length === 0 && !loadingSubjects ? (
                <div className="flex flex-col items-center justify-center p-10 text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-md gap-3 mt-4">
                  <i className="pi pi-book text-3xl"></i>
                  <div>
                    <p className="text-sm font-semibold text-center text-zinc-600 dark:text-zinc-300">No subjects linked yet</p>
                    <p className="text-xs text-center opacity-70 mt-1 max-w-[200px]">Link existing subjects or create a new one to assign it automatically.</p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => setShowAssignDialog(true)}
                      className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded text-xs font-medium"
                    >
                      Link Existing
                    </button>
                    <button 
                      onClick={() => setShowSubjectDialog(true)}
                      className="px-3 py-1.5 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded text-xs font-medium"
                    >
                      Create New
                    </button>
                  </div>
                </div>
              ) : (
                <DataTable
                  value={subjectList}
                  loading={loadingSubjects}
                  emptyMessage="No subjects for this class."
                  className="p-datatable-sm mt-1"
                >
                  <Column field="name" header="Subject" className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs" />
                  <Column field="code" header="Code" className="font-mono text-xs text-zinc-500" />
                  <Column field="type" header="Type" body={(d) => subjectTypeTag(d.type)} />
                  <Column 
                    header="Marks" 
                    body={(d) => (
                      <span className="text-xs text-zinc-500 font-medium">
                        {d.maxMarks}/{d.passMarks}
                      </span>
                    )} 
                  />
                </DataTable>
              )
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-md mt-4">
                <i className="pi pi-arrow-left text-3xl mb-2"></i>
                <p className="text-sm font-semibold">Select a Class</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Dialog: Add Class ───────────────────────────────────────── */}
      <Dialog 
        header="Create New Class" 
        visible={showClassDialog} 
        style={{ width: '440px' }} 
        modal 
        onHide={() => setShowClassDialog(false)}
        className="rounded-md shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
        contentClassName="p-6"
        headerClassName="border-b border-zinc-100 dark:border-zinc-800 p-5 font-bold text-zinc-900 dark:text-white"
        footer={
          <div className="flex justify-end gap-2 p-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button label="Cancel" className="p-button-text p-2 font-medium text-sm text-zinc-500" onClick={() => setShowClassDialog(false)} />
            <Button 
              label="Create Class" 
              icon="pi pi-check" 
              loading={createClassMutation.isPending} 
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 px-4 rounded-md border-0 font-medium text-sm" 
              onClick={handleCreateClass} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Class Name *</label>
              <InputText 
                value={classForm.name} 
                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} 
                className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md outline-none focus:border-blue-500 text-sm" 
                placeholder="e.g. Class 10, Grade 5" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Section *</label>
              <InputText 
                value={classForm.section} 
                onChange={(e) => setClassForm({ ...classForm, section: e.target.value })} 
                className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md outline-none focus:border-blue-500 text-sm" 
                placeholder="e.g. A, B, Science" 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Room No.</label>
              <InputText 
                value={classForm.roomNo} 
                onChange={(e) => setClassForm({ ...classForm, roomNo: e.target.value })} 
                className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md outline-none focus:border-blue-500 text-sm" 
                placeholder="e.g. Room 101" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Capacity Limit</label>
              <InputNumber 
                value={classForm.maxStrength} 
                onValueChange={(e) => setClassForm({ ...classForm, maxStrength: e.value || 40 })} 
                min={1} max={200}
                className="border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md w-full outline-none" 
                inputClassName="p-2 rounded-md outline-none w-full dark:bg-zinc-950 text-sm" 
              />
            </div>
          </div>
          {!currentYear && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30 rounded-md text-amber-700 dark:text-amber-400 text-xs font-medium flex items-center gap-2">
              <i className="pi pi-exclamation-triangle"></i>
              No active academic year found. Please create one first.
            </div>
          )}
        </div>
      </Dialog>

      {/* ── Dialog: Add Subject ─────────────────────────────────────── */}
      <Dialog 
        header="Add New Subject"
        visible={showSubjectDialog} 
        style={{ width: '480px' }} 
        modal 
        onHide={() => setShowSubjectDialog(false)}
        className="rounded-md shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
        contentClassName="p-6"
        headerClassName="border-b border-zinc-100 dark:border-zinc-800 p-5 font-bold text-zinc-900 dark:text-white"
        footer={
          <div className="flex justify-end gap-2 p-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button label="Cancel" className="p-button-text p-2 font-medium text-sm text-zinc-500" onClick={() => setShowSubjectDialog(false)} />
            <Button 
              label="Save Subject" 
              icon="pi pi-check" 
              loading={createSubjectMutation.isPending} 
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 px-4 rounded-md border-0 font-medium text-sm" 
              onClick={handleCreateSubject} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          {selectedClass && (
            <div className="p-2 px-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/30 dark:border-blue-800/20 rounded-md flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs font-medium mb-1">
              <i className="pi pi-info-circle"></i>
              This subject will be automatically linked to {selectedClass.name} — {selectedClass.section}.
            </div>
          )}
          {/* Name + Code */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Subject Name *</label>
              <InputText 
                value={subjectForm.name} 
                onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} 
                className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md outline-none focus:border-blue-500 text-sm" 
                placeholder="e.g. Mathematics" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Subject Code *</label>
              <InputText 
                value={subjectForm.code} 
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} 
                className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md outline-none focus:border-blue-500 font-mono text-sm" 
                placeholder="e.g. MATH-10" 
              />
            </div>
          </div>

          {/* Department + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Department</label>
              <Dropdown 
                value={subjectForm.departmentId} 
                options={[{ label: '— None —', value: '' }, ...departmentOptions]}
                onChange={(e) => setSubjectForm({ ...subjectForm, departmentId: e.value })} 
                placeholder="Select Department"
                className="text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Subject Type</label>
              <Dropdown 
                value={subjectForm.type} 
                options={SUBJECT_TYPES} 
                onChange={(e) => setSubjectForm({ ...subjectForm, type: e.value })} 
                className="text-sm"
              />
            </div>
          </div>

          {/* Max Marks + Pass Marks */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Max Marks</label>
              <InputNumber 
                value={subjectForm.maxMarks} 
                onValueChange={(e) => setSubjectForm({ ...subjectForm, maxMarks: e.value || 100 })} 
                min={1} max={500}
                className="border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md w-full outline-none" 
                inputClassName="p-2 rounded-md outline-none w-full dark:bg-zinc-950 text-sm" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pass Marks</label>
              <InputNumber 
                value={subjectForm.passMarks} 
                onValueChange={(e) => setSubjectForm({ ...subjectForm, passMarks: e.value || 33 })} 
                min={1} max={subjectForm.maxMarks}
                className="border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md w-full outline-none" 
                inputClassName="p-2 rounded-md outline-none w-full dark:bg-zinc-950 text-sm" 
              />
            </div>
          </div>
        </div>
      </Dialog>

      {/* ── Dialog: Assign Subjects ─────────────────────────────────────── */}
      <Dialog 
        header={`Link Subjects to ${selectedClass?.name || 'Class'}`}
        visible={showAssignDialog} 
        style={{ width: '480px' }} 
        modal 
        onHide={() => {
          setShowAssignDialog(false);
          setAssignSubjectIds([]);
        }}
        className="rounded-md shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
        contentClassName="p-6"
        headerClassName="border-b border-zinc-100 dark:border-zinc-800 p-5 font-bold text-zinc-900 dark:text-white"
        footer={
          <div className="flex justify-end gap-2 p-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button label="Cancel" className="p-button-text p-2 font-medium text-sm text-zinc-500" onClick={() => setShowAssignDialog(false)} />
            <Button 
              label="Assign Selected" 
              icon="pi pi-link" 
              disabled={assignSubjectIds.length === 0}
              loading={assignSubjectsMutation.isPending} 
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 px-4 rounded-md border-0 font-medium text-sm" 
              onClick={handleAssignSubjects} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Select Subjects</label>
            <MultiSelect
              value={assignSubjectIds}
              options={availableSubjectsToAssign.map((s: any) => ({ label: `${s.name} (${s.code})`, value: s.id }))}
              onChange={(e) => setAssignSubjectIds(e.value)}
              placeholder="Select existing subjects..."
              display="chip"
              filter
              className="w-full border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md outline-none p-1 text-sm"
              emptyMessage="No available subjects to assign."
            />
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed mt-1">
            Selected subjects will be added to the curriculum of <strong>{selectedClass?.name} {selectedClass?.section}</strong>. You can view them in the right pane.
          </p>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
