'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { toast } from 'sonner';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import PageHeader from '@/components/layout/PageHeader';

import {
  useDepartmentsList,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '@/hooks/queries/useAcademics';
import { usePermissions } from '@/hooks/usePermissions';
import { errorMessage } from '@/lib/errorMessage';
import { Pencil, Plus, Trash2 } from 'lucide-react';

export default function DepartmentsPage() {
  const [showDeptDialog, setShowDeptDialog] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '' });
  const [editing, setEditing] = useState<any>(null);
  const { isAdmin } = usePermissions();

  // Queries
  const { data: departments, isPending: loadingDepts } = useDepartmentsList();

  // Mutations
  const createDeptMutation = useCreateDepartment();
  const updateDeptMutation = useUpdateDepartment();
  const deleteDeptMutation = useDeleteDepartment();

  const deptList = departments || [];

  const handleCreateDept = () => {
    if (!deptForm.name.trim()) return;
    const done = (msg: string) => () => {
      setShowDeptDialog(false);
      setEditing(null);
      setDeptForm({ name: '' });
      toast.success(msg);
    };
    const fail = (err: unknown) => toast.error(errorMessage(err, 'Could not save department'));
    if (editing) {
      updateDeptMutation.mutate(
        { id: editing.id, data: { name: deptForm.name.trim() } },
        { onSuccess: done('Department updated'), onError: fail }
      );
    } else {
      createDeptMutation.mutate(
        { name: deptForm.name.trim() },
        { onSuccess: done('Department created'), onError: fail }
      );
    }
  };

  const handleDelete = (dept: any) => {
    if (!confirm(`Delete department "${dept.name}"?`)) return;
    deleteDeptMutation.mutate(dept.id, {
      onSuccess: () => toast.success('Department deleted'),
      onError: (err) => toast.error(errorMessage(err, 'Could not delete department')),
    });
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Departments" subtitle="Academics" />
      <div className="flex flex-col gap-4 pb-10 animate-fade-in">
        {/* Header Block */}
        <PageHeader
          title="Departments"
          description="Curriculum departments configured in this school"
          actions={
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setEditing(null);
                setDeptForm({ name: '' });
                setShowDeptDialog(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Department
            </Button>
          }
        />

        {/* Directory Layout Card */}
        <div className="bg-card border border-border rounded-2xl p-3.5 sm:p-5 flex flex-col gap-4 shadow-sm min-w-0">
          <div>
            <h2 className="text-card-title">Active Departments</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              List of active course curriculum departments configured in this school.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Department Name</th>
                  <th className="p-3">Status</th>
                  {isAdmin && <th className="p-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loadingDepts ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-400">
                      Loading departments...
                    </td>
                  </tr>
                ) : deptList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-400">
                      No departments configured yet.
                    </td>
                  </tr>
                ) : (
                  deptList.map((dept: any) => (
                    <tr
                      key={dept.id || dept.name}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                    >
                      <td className="p-3 font-semibold text-foreground">{dept.name}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase border border-emerald-500/20">
                          Active
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-2 sm:p-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="icon-sm"
                              title="Edit"
                              onClick={() => {
                                setEditing(dept);
                                setDeptForm({ name: dept.name });
                                setShowDeptDialog(true);
                              }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              title="Delete"
                              onClick={() => handleDelete(dept)}
                              disabled={deleteDeptMutation.isPending}
                            >
                              <Trash2 className="size-4 text-rose-600" />
                            </Button>
                          </div>
                        </td>
                      )}
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
        onClose={() => {
          setShowDeptDialog(false);
          setEditing(null);
        }}
        title={editing ? 'Edit Department' : 'Add New Academic Department'}
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
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4 pt-4 border-t border-border [&>button]:w-full sm:[&>button]:w-auto">
            <Button variant="outline" onClick={() => setShowDeptDialog(false)}>
              Cancel
            </Button>
            <Button
              isLoading={createDeptMutation.isPending || updateDeptMutation.isPending}
              onClick={handleCreateDept}
            >
              {editing ? 'Save Department' : 'Create Department'}
            </Button>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
