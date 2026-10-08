'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { toast } from 'sonner';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';

import { useDepartmentsList, useCreateDepartment } from '@/hooks/queries/useAcademics';

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
      },
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
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Active Departments</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              List of active course curriculum departments configured in this school.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Department Name</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loadingDepts ? (
                  <tr>
                    <td colSpan={2} className="p-6 text-center text-slate-400">
                      Loading departments...
                    </td>
                  </tr>
                ) : deptList.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-6 text-center text-slate-400">
                      No departments configured yet.
                    </td>
                  </tr>
                ) : (
                  deptList.map((dept: any) => (
                    <tr
                      key={dept.id || dept.name}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                    >
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                        {dept.name}
                      </td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase border border-emerald-500/20">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dialog: Add Department */}
      <Dialog
        isOpen={showDeptDialog}
        onClose={() => setShowDeptDialog(false)}
        title="Add New Academic Department"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Department Name *
            </label>
            <Input
              value={deptForm.name}
              onChange={(e) => setDeptForm({ name: e.target.value })}
              placeholder="e.g. Science, Languages"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setShowDeptDialog(false)}>
              Cancel
            </Button>
            <Button isLoading={createDeptMutation.isPending} onClick={handleCreateDept}>
              Create Department
            </Button>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
