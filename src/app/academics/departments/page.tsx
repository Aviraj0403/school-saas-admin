'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';

import { 
  useDepartmentsList,
  useCreateDepartment
} from '@/hooks/queries/useAcademics';


export default function DepartmentsPage() {
  const [showDeptDialog, setShowDeptDialog] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '' });

  // Queries
  const { data: departments, isPending: loadingDepts } = useDepartmentsList();
  
  // Mutations
  const createDeptMutation = useCreateDepartment();

  const deptList = departments || [];

  const handleCreateDept = () => {
    if (!deptForm.name) return;
    createDeptMutation.mutate(deptForm, {
      onSuccess: () => {
        setShowDeptDialog(false);
        setDeptForm({ name: '' });
      }
    });
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Departments" subtitle="Academics" />
<div className="flex flex-col gap-4 pb-10 animate-fade-in">
        
        {/* Header Block */}
        <div className="flex flex-col items-start gap-4 pb-4">
          {/* <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Academic Departments</h1>
            <p className="text-slate-400 mt-1.5 text-sm md:text-base">
              Manage the curriculum departments and organizational structure of your academic institution.
            </p>
          </div> */}

          <button 
            onClick={() => setShowDeptDialog(true)}
            className="w-full md:w-auto bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white font-extrabold shadow-md border-0 ring-1 ring-black/5 dark:ring-white/10 uppercase tracking-wider text-[11px] px-5 py-2.5 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <i className="pi pi-plus text-xs"></i>
            Create Department
          </button>
        </div>

        {/* Directory Layout Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-5 flex flex-col gap-4 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Active Departments</h2>
            <p className="text-xs text-zinc-500 mt-0.5">List of active course curriculum departments configured in this school.</p>
          </div>
          
          <DataTable
            value={deptList}
            loading={loadingDepts}
            emptyMessage="No departments configured yet."
            className="p-datatable-sm"
          >
            <Column field="name" header="Department Name" sortable className="font-semibold text-zinc-900 dark:text-zinc-100" />
            <Column header="Status" body={() => <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-md text-[10px] font-bold uppercase border border-emerald-200/50 dark:border-emerald-800/30">Active</span>} />
          </DataTable>
        </div>

      </div>

      {/* Dialog: Add Department */}
      <Dialog 
        header="Add New Academic Department" 
        visible={showDeptDialog} 
        style={{ width: '400px' }} 
        modal 
        onHide={() => setShowDeptDialog(false)}
        className="rounded-md shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
        contentClassName="p-6"
        headerClassName="border-b border-zinc-100 dark:border-zinc-800 p-5 font-bold text-zinc-900 dark:text-white"
        footer={
          <div className="flex justify-end gap-2 p-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button label="Cancel" className="p-button-text p-2 font-medium text-sm text-zinc-500" onClick={() => setShowDeptDialog(false)} />
            <Button 
              label="Create Department" 
              icon="pi pi-check" 
              loading={createDeptMutation.isPending} 
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 px-4 rounded-md border-0 font-medium text-sm" 
              onClick={handleCreateDept} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Department Name *</label>
            <InputText value={deptForm.name} onChange={(e) => setDeptForm({ name: e.target.value })} className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md outline-none focus:border-blue-500 text-sm" placeholder="e.g. Science, Languages" />
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
