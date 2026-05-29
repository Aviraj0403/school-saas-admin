'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { 
  useClasses, 
  useCreateClass, 
  useSubjects, 
  useCreateSubject, 
  useCurrentAcademicYear,
  useAcademicYears,
  useCreateAcademicYear,
  useDepartmentsList,
  useCreateDepartment
} from '@/hooks/queries/useAcademics';

export default function ClassesPage() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  
  // Dialog visibility states
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [showDeptDialog, setShowDeptDialog] = useState(false);
  const [showAyDialog, setShowAyDialog] = useState(false);
  
  // Form states
  const [classForm, setClassForm] = useState({ name: '', section: '', maxStrength: 40 });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', classId: '', teacherId: '' });
  const [deptForm, setDeptForm] = useState({ name: '' });
  const [ayForm, setAyForm] = useState<any>({ name: '', startDate: null, endDate: null, isCurrent: false });

  // Queries
  const { data: currentYear } = useCurrentAcademicYear();
  const { data: academicYears, isPending: loadingYears } = useAcademicYears();
  const { data: classes, isPending } = useClasses(page, 20);
  const { data: subjects, isPending: loadingSubjects } = useSubjects(selectedClass?.id || '');
  const { data: departments, isPending: loadingDepts } = useDepartmentsList();
  
  // Mutations
  const createClassMutation = useCreateClass();
  const createSubjectMutation = useCreateSubject();
  const createDeptMutation = useCreateDepartment();
  const createAyMutation = useCreateAcademicYear();

  const classList = classes?.data?.items || [];
  const deptList = departments || [];
  const ayList = academicYears || [];

  const handleCreateClass = () => {
    if (!currentYear?.id) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { severity: 'error', summary: 'Error', detail: 'Active academic year not found. Please create an academic year first.', life: 4000 }
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

  const handleCreateDept = () => {
    if (!deptForm.name) return;
    createDeptMutation.mutate(deptForm, {
      onSuccess: () => {
        setShowDeptDialog(false);
        setDeptForm({ name: '' });
      }
    });
  };

  const handleCreateAy = () => {
    if (!ayForm.name || !ayForm.startDate || !ayForm.endDate) return;
    createAyMutation.mutate(
      {
        name: ayForm.name,
        startDate: (ayForm.startDate as Date).toISOString(),
        endDate: (ayForm.endDate as Date).toISOString(),
        isCurrent: ayForm.isCurrent
      },
      {
        onSuccess: () => {
          setShowAyDialog(false);
          setAyForm({ name: '', startDate: null, endDate: null, isCurrent: false });
        }
      }
    );
  };

  const dateTemplate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN');
    } catch {
      return dateStr;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto p-1">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 rounded-2xl shadow-xl text-white">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Classes & Curriculums</h1>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              Establish classrooms, academic years, departments, and assign study syllabus.
            </p>
          </div>
          {activeTab === 0 && (
            <button 
              onClick={() => setShowClassDialog(true)}
              className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm"
            >
              <i className="pi pi-plus"></i>
              Add Class
            </button>
          )}
          {activeTab === 1 && (
            <button 
              onClick={() => setShowDeptDialog(true)}
              className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm"
            >
              <i className="pi pi-plus"></i>
              Add Department
            </button>
          )}
          {activeTab === 2 && (
            <button 
              onClick={() => setShowAyDialog(true)}
              className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm"
            >
              <i className="pi pi-plus"></i>
              Add Academic Year
            </button>
          )}
        </div>

        {/* Tab Boards */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <style>{`
            .p-tabview, .p-tabview-nav, .p-tabview-panels, .p-datatable, .p-datatable-wrapper {
              background: transparent !important;
            }
            .p-datatable-thead > tr > th, .p-datatable-tbody > tr, .p-datatable-tbody > tr > td {
              background: transparent !important;
            }
            .p-tabview-nav li .p-tabview-nav-link {
              background: transparent !important;
            }
          `}</style>
          <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
            
            {/* Tab 0: Classes & Syllabus */}
            <TabPanel header="Classes & Syllabus">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-4">
                
                {/* Classes Column (Left 3 columns) */}
                <div className="lg:col-span-3 bg-slate-50/20 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 flex flex-col gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Active Classrooms</h2>
                    <p className="text-xs text-slate-405">Select a class row to inspect assigned study subjects.</p>
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
                    <Column field="maxStrength" header="Capacity (Max)" sortable />
                  </DataTable>
                </div>

                {/* Subjects Column (Right 2 columns) */}
                <div className="lg:col-span-2 bg-slate-50/20 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                        {selectedClass ? `${selectedClass.name} - ${selectedClass.section}` : 'Class Syllabus'}
                      </h2>
                      <p className="text-xs text-slate-455">
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
            </TabPanel>

            {/* Tab 1: Departments */}
            <TabPanel header="Academic Departments">
              <div className="p-4 flex flex-col gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Active Departments</h2>
                  <p className="text-xs text-slate-450">List of curriculum departments configured in this institution.</p>
                </div>
                
                <DataTable
                  value={deptList}
                  loading={loadingDepts}
                  emptyMessage="No departments configured yet."
                  className="p-datatable-sm"
                >
                  <Column field="name" header="Department Name" sortable className="font-bold text-slate-800 dark:text-white" />
                  <Column header="Status" body={() => <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-full text-[10px] font-extrabold uppercase">Active</span>} />
                </DataTable>
              </div>
            </TabPanel>

            {/* Tab 2: Academic Years */}
            <TabPanel header="Academic Years & Terms">
              <div className="p-4 flex flex-col gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Onboarding Academic Terms</h2>
                  <p className="text-xs text-slate-450">Manage the active academic calendar terms and settings for this school.</p>
                </div>
                
                <DataTable
                  value={ayList}
                  loading={loadingYears}
                  emptyMessage="No academic years configured yet."
                  className="p-datatable-sm"
                >
                  <Column field="name" header="Academic Term" sortable className="font-bold text-slate-800 dark:text-white" />
                  <Column header="Start Date" body={(d) => dateTemplate(d.startDate)} />
                  <Column header="End Date" body={(d) => dateTemplate(d.endDate)} />
                  <Column header="Status" body={(d) => d.isCurrent ? <Tag value="Active Term" severity="success" className="bg-emerald-500/10 text-emerald-650 px-2.5 py-1 text-[10px] font-bold rounded-full uppercase" /> : <Tag value="Archived" severity="secondary" className="bg-slate-100 text-slate-500 px-2.5 py-1 text-[10px] font-bold rounded-full uppercase" />} />
                </DataTable>
              </div>
            </TabPanel>

          </TabView>
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
            <InputNumber value={classForm.maxStrength} onValueChange={(e) => setClassForm({ ...classForm, maxStrength: e.value || 40 })} className="border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl" />
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

      {/* Dialog: Add Department */}
      <Dialog 
        header="Add New Academic Department" 
        visible={showDeptDialog} 
        style={{ width: '400px' }} 
        modal 
        onHide={() => setShowDeptDialog(false)}
        className="dialog-custom rounded-3xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowDeptDialog(false)} />
            <Button 
              label="Create Department" 
              icon="pi pi-check" 
              loading={createDeptMutation.isPending} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" 
              onClick={handleCreateDept} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Department Name *</label>
            <InputText value={deptForm.name} onChange={(e) => setDeptForm({ name: e.target.value })} className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="e.g. Science, Languages" />
          </div>
        </div>
      </Dialog>

      {/* Dialog: Add Academic Year */}
      <Dialog 
        header="Add New Academic Term" 
        visible={showAyDialog} 
        style={{ width: '400px' }} 
        modal 
        onHide={() => setShowAyDialog(false)}
        className="dialog-custom rounded-3xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowAyDialog(false)} />
            <Button 
              label="Create Term" 
              icon="pi pi-check" 
              loading={createAyMutation.isPending} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" 
              onClick={handleCreateAy} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Term Name *</label>
            <InputText value={ayForm.name} onChange={(e) => setAyForm({ ...ayForm, name: e.target.value })} className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="e.g. 2026-2027, 2027" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Start Date *</label>
              <Calendar value={ayForm.startDate} onChange={(e) => setAyForm({ ...ayForm, startDate: e.value })} required showIcon dateFormat="yy-mm-dd" className="border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl w-full" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">End Date *</label>
              <Calendar value={ayForm.endDate} onChange={(e) => setAyForm({ ...ayForm, endDate: e.value })} required showIcon dateFormat="yy-mm-dd" className="border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl w-full" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Checkbox id="isCurrentAy" checked={ayForm.isCurrent} onChange={(e) => setAyForm({ ...ayForm, isCurrent: e.checked || false })} />
            <label htmlFor="isCurrentAy" className="font-semibold text-xs text-slate-650 dark:text-slate-350 cursor-pointer select-none">Set as Current Active Term</label>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
