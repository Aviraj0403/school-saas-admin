'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
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
      <div className="flex flex-col gap-6 max-w-7xl mx-auto p-1 animate-fade-in">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600 via-indigo-650 to-indigo-800 p-6 rounded-2xl shadow-xl text-white">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Academic Departments</h1>
            <p className="text-indigo-100 mt-1.5 text-xs md:text-sm">
              Manage the curriculum departments and organizational structure of your academic institution.
            </p>
          </div>
          <button 
            onClick={() => setShowDeptDialog(true)}
            className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-xs"
          >
            <i className="pi pi-plus"></i>
            Create Department
          </button>
        </div>

        {/* Directory Layout Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 dark:text-white">Active Departments</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">List of active course curriculum departments configured in this school.</p>
          </div>
          
          <DataTable
            value={deptList}
            loading={loadingDepts}
            emptyMessage="No departments configured yet."
            className="p-datatable-sm"
          >
            <Column field="name" header="Department Name" sortable className="font-bold text-slate-800 dark:text-slate-100" />
            <Column header="Status" body={() => <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-full text-[10px] font-extrabold uppercase">Active</span>} />
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
        className="rounded-3xl shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
        contentClassName="p-6"
        headerClassName="border-b border-gray-150 dark:border-slate-800 p-6 font-bold"
        footer={
          <div className="flex justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800/80">
            <Button label="Cancel" className="p-button-text p-2 font-bold text-xs" onClick={() => setShowDeptDialog(false)} />
            <Button 
              label="Create Department" 
              icon="pi pi-check" 
              loading={createDeptMutation.isPending} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl border-0 font-bold text-xs" 
              onClick={handleCreateDept} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-slate-550 dark:text-slate-450 uppercase tracking-wider">Department Name *</label>
            <InputText value={deptForm.name} onChange={(e) => setDeptForm({ name: e.target.value })} className="p-2.5 border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Science, Languages" />
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
