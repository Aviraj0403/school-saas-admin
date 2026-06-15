'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { TanstackTable } from '@/components/TanstackTable';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { StatCard } from '@/components/ui/StatCard';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { useStaffList, useCreateStaff, useDeleteStaff, useRoles, useDepartments } from '@/hooks/queries/useStaff';
import { 
  useSalaryStructure, 
  useUpsertSalaryStructure
} from '@/hooks/queries/usePayroll';

export default function StaffPage() {
  const [selectedUserForSalary, setSelectedUserForSalary] = useState<string>('');
  const [showSalaryStructureDialog, setShowSalaryStructureDialog] = useState(false);
  
  // Salary structure form fields
  const [salaryForm, setSalaryForm] = useState({ baseSalary: 25000, hra: 5000, allowance: 3000, deductions: 1000 });

  // Queries / Mutations
  const { data: activeStructure, isPending: loadingStructure } = useSalaryStructure(selectedUserForSalary);
  const upsertStructureMutation = useUpsertSalaryStructure();

  useEffect(() => {
    if (activeStructure) {
      setSalaryForm({
        baseSalary: activeStructure.baseSalary || 0,
        hra: activeStructure.hra || 0,
        allowance: activeStructure.allowance || 0,
        deductions: activeStructure.deductions || 0,
      });
    }
  }, [activeStructure]);

  const handleSaveSalaryStructure = () => {
    if (!selectedUserForSalary) return;
    upsertStructureMutation.mutate({ userId: selectedUserForSalary, data: salaryForm }, {
      onSuccess: () => {
        setShowSalaryStructureDialog(false);
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { severity: 'success', summary: 'Salary Updated', detail: 'Employee salary structure updated successfully.', life: 3000 }
        }));
      }
    });
  };

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState('');

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    roleId: '',
    departmentId: '',
    designation: '',
  });

  const { data: rolesData } = useRoles();
  const { data: deptsData } = useDepartments();

  const roleOptions = (rolesData || []).map((r: any) => ({ label: r.name, value: r.id }));
  const deptOptions = (deptsData || []).map((d: any) => ({ label: d.name, value: d.id }));

  const getDeptName = (deptId: string) => {
    const dept = (deptsData || []).find((d: any) => d.id === deptId);
    return dept?.name || 'General';
  };

  const { data, isPending, isError, error } = useStaffList(pagination.pageIndex + 1, pagination.pageSize, search || undefined);
  const createMutation = useCreateStaff();
  const deleteMutation = useDeleteStaff();

  const handleAddStaff = () => {
    const payload = {
      name: newStaff.name,
      email: newStaff.email,
      phone: newStaff.phone || undefined,
      designation: newStaff.designation || undefined,
      departmentId: newStaff.departmentId || undefined,
      roleIds: newStaff.roleId ? [newStaff.roleId] : undefined,
    };
    createMutation.mutate(payload, {
      onSuccess: () => {
        setShowAddDialog(false);
        setNewStaff({
          name: '',
          email: '',
          phone: '',
          roleId: '',
          departmentId: '',
          designation: '',
        });
      }
    });
  };

  const handleDeleteStaff = (id: string) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      deleteMutation.mutate(id);
    }
  };

  const roleBodyTemplate = (rowData: any) => {
    let severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary' = 'info';
    let style = 'bg-blue-500/10 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400';
    
    const roleObj = rowData.roles?.[0]?.role;
    const roleName = roleObj?.name || rowData.role || 'Teacher';
    const roleSlug = roleObj?.slug || '';
    
    if (roleSlug === 'school_admin' || roleName === 'School Admin' || roleName === 'SuperAdmin') {
      severity = 'danger';
      style = 'bg-rose-500/10 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400';
    } else if (roleSlug === 'teacher' || roleName === 'Teacher') {
      severity = 'success';
      style = 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
    } else if (roleSlug === 'accountant' || roleName === 'Accountant') {
      severity = 'warning';
      style = 'bg-amber-500/10 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400';
    }
    
    return <Tag value={roleName} severity={severity} className={`px-2.5 py-1 text-xs font-bold rounded-full ${style}`} />;
  };

  const actionsBodyTemplate = (rowData: any) => {
    return (
      <div className="flex gap-2 justify-center">
        <button 
          onClick={() => handleDeleteStaff(rowData.id)}
          disabled={deleteMutation.isPending}
          className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 rounded-lg transition-all active:scale-95 disabled:opacity-50"
          title="Delete Staff"
        >
          <i className={deleteMutation.isPending ? "pi pi-spin pi-spinner" : "pi pi-trash"}></i>
        </button>
      </div>
    );
  };

  const staffList = data?.items || (data as any)?.data?.items || [];
  const totalRecords = data?.meta?.total || (data as any)?.data?.meta?.total || 0;
  const pageCount = data?.meta?.totalPages || (data as any)?.data?.meta?.totalPages || Math.ceil(totalRecords / pagination.pageSize) || 0;

  const getStaffName = (userId: string) => {
    const staff = staffList.find((s: any) => s.id === userId || s.userId === userId);
    return staff?.name || 'Faculty Member';
  };

  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: (info: any) => <span className="font-semibold text-slate-800 dark:text-slate-200">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'email',
        header: 'Email',
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: (info: any) => roleBodyTemplate(info.row.original),
      },
      {
        id: 'department',
        header: 'Department',
        cell: (info: any) => getDeptName(info.row.original.departmentId),
      },
      {
        accessorKey: 'designation',
        header: 'Designation',
      },
      {
        id: 'salary',
        header: 'Salary Structure',
        cell: (info: any) => (
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-xl transition-all"
            onClick={() => {
              setSelectedUserForSalary(info.row.original.id);
              setShowSalaryStructureDialog(true);
            }}
          >
            <i className="pi pi-pencil"></i> Configure
          </button>
        )
      },
      {
        id: 'actions',
        header: () => <div className="text-center">Actions</div>,
        cell: (info: any) => actionsBodyTemplate(info.row.original),
      },
    ],
    [deptsData, deleteMutation.isPending]
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 lg:gap-8 pb-10 max-w-[100vw] overflow-x-hidden">
        
        {/* Header Block */}
        <div className="flex flex-col items-start gap-4 pt-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Staff Directory</h1>
            <p className="text-slate-400 mt-1 text-sm">
              Manage school employees, teachers, and administrative staff.
            </p>
          </div>
          <button 
            onClick={() => setShowAddDialog(true)}
            className="w-full sm:w-auto bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold border-0 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all active:scale-95 flex items-center justify-center gap-2 text-sm ring-1 ring-slate-900/5 dark:ring-white/10 px-5 py-3"
          >
            <i className="pi pi-plus text-xs"></i>
            Add Staff Member
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            label="Total Registered"
            value={isPending ? '...' : totalRecords}
            icon="pi pi-users"
            gradientClass="from-blue-500 to-indigo-500"
            iconBgClass="bg-blue-500/10 dark:bg-blue-500/20"
            iconColorClass="text-blue-600 dark:text-blue-400"
            footerText="Total faculty and staff"
          />
          <StatCard
            label="Teachers"
            value={isPending ? '...' : staffList.filter((s: any) => s.role === 'Teacher' || s.role === 'TEACHER').length}
            icon="pi pi-briefcase"
            gradientClass="from-emerald-500 to-teal-500"
            iconBgClass="bg-emerald-500/10 dark:bg-emerald-500/20"
            iconColorClass="text-emerald-600 dark:text-emerald-400"
            footerText="Active teaching staff"
          />
          <StatCard
            label="Administration"
            value={isPending ? '...' : staffList.filter((s: any) => s.role !== 'Teacher' && s.role !== 'TEACHER').length}
            icon="pi pi-id-card"
            gradientClass="from-amber-500 to-orange-500"
            iconBgClass="bg-amber-500/10 dark:bg-amber-500/20"
            iconColorClass="text-amber-600 dark:text-amber-400"
            footerText="Admin & support roles"
          />
          <StatCard
            label="Active Departments"
            value={isPending ? '...' : Math.max(1, new Set(staffList.map((s: any) => s.department).filter(Boolean)).size)}
            icon="pi pi-sitemap"
            gradientClass="from-violet-500 to-purple-500"
            iconBgClass="bg-violet-500/10 dark:bg-violet-500/20"
            iconColorClass="text-violet-600 dark:text-violet-400"
            footerText="Configured departments"
          />
        </div>

        {/* Filter and Control Bar */}
        <div className="flex flex-col items-start gap-4 bg-slate-100/50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/40 dark:border-slate-800">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <i className="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <InputText
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPagination((p: PaginationState) => ({ ...p, pageIndex: 0 })); }}
                placeholder="Search staff by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 text-sm outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 px-5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-slate-950 text-primary shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <i className="pi pi-th-large text-sm mr-2"></i>
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 px-5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-950 text-primary shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <i className="pi pi-list text-sm mr-2"></i>
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* Dynamic Display Section */}
        {isError ? (
          <div className="p-6 bg-red-50 text-red-600 rounded-3xl border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 flex items-center gap-4 shadow-sm">
            <i className="pi pi-exclamation-circle text-2xl"></i>
            <div>
              <h3 className="font-bold">Failed to load</h3>
              <p className="text-sm opacity-80">{(error as any)?.message}</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {isPending ? (
               <div className="col-span-full py-12 flex flex-col items-center justify-center gap-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950">
                 <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                 <span className="text-sm font-medium text-slate-500">Loading directory...</span>
               </div>
            ) : staffList.length === 0 ? (
               <div className="col-span-full py-12 text-center border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950">
                 <p className="text-slate-500 text-sm">No staff members found.</p>
               </div>
            ) : (
              staffList.map((member: any) => {
                const initials = member.name ? member.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'ST';
                return (
                  <div key={member.id} className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-all animate-fade-in group">
                  <div className="p-5 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase ring-2 ring-white dark:ring-slate-900 group-hover:scale-105 transition-transform">
                      {initials}
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                        {member.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {member.designation || 'Faculty Member'} · <span className="font-medium text-slate-700 dark:text-slate-300">{getDeptName(member.departmentId)}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      {roleBodyTemplate(member)}
                    </div>

                    <div className="py-2 flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2 truncate">
                        <i className="pi pi-envelope text-slate-400"></i>
                        <span>{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2">
                          <i className="pi pi-phone text-slate-400"></i>
                          <span>{member.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 mt-2">
                      <button 
                        onClick={() => {
                          setSelectedUserForSalary(member.id);
                          setShowSalaryStructureDialog(true);
                        }}
                        className="flex-1 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition-colors flex justify-center items-center gap-2 mt-2"
                      >
                        <i className="pi pi-money-bill text-xs"></i>
                        Salary Config
                      </button>
                      <button 
                        onClick={() => handleDeleteStaff(member.id)}
                        className="px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors flex justify-center items-center mt-2"
                        title="Delete Staff"
                      >
                        <i className="pi pi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
                );
              })
            )}
            
            {/* Grid Pagination */}
            {!isPending && staffList.length > 0 && (
              <div className="col-span-full flex justify-between items-center pt-4">
                <span className="text-sm font-medium text-slate-500">Page {pagination.pageIndex + 1} of {pageCount}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPagination((p: PaginationState) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}
                    disabled={pagination.pageIndex === 0}
                    className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors text-slate-700 dark:text-slate-300"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setPagination((p: PaginationState) => ({ ...p, pageIndex: Math.min(pageCount - 1, p.pageIndex + 1) }))}
                    disabled={pagination.pageIndex >= pageCount - 1}
                    className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors text-slate-700 dark:text-slate-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full">
            <TanstackTable 
              data={staffList} 
              columns={columns} 
              isLoading={isPending}
              pagination={pagination}
              setPagination={setPagination}
              pageCount={pageCount}
            />
          </div>
        )}
      </div>

      {/* Dialog: Register Staff */}
      <Dialog 
        header="Register New Staff Member" 
        visible={showAddDialog} 
        style={{ width: '450px' }} 
        modal 
        onHide={() => setShowAddDialog(false)}
        className="dialog-custom rounded-3xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" icon="pi pi-times" onClick={() => setShowAddDialog(false)} className="p-button-text p-2" />
            <Button 
              label="Register" 
              icon="pi pi-check" 
              onClick={handleAddStaff} 
              loading={createMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="staffName" className="font-semibold text-xs text-gray-500 dark:text-gray-400">Full Name *</label>
            <InputText 
              id="staffName" 
              value={newStaff.name} 
              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} 
              placeholder="e.g., Jane Smith"
              className="p-2 border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="staffEmail" className="font-semibold text-xs text-gray-500 dark:text-gray-400">Email Address *</label>
            <InputText 
              id="staffEmail" 
              value={newStaff.email} 
              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} 
              placeholder="e.g., janesmith@school.com"
              className="p-2 border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="staffPhone" className="font-semibold text-xs text-gray-500 dark:text-gray-400">Phone Number</label>
            <InputText 
              id="staffPhone" 
              value={newStaff.phone} 
              onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} 
              placeholder="e.g., +91 98765 43210"
              className="p-2 border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="staffRole" className="font-semibold text-xs text-gray-500 dark:text-gray-400">System Role</label>
            <Dropdown 
              id="staffRole" 
              value={newStaff.roleId} 
              options={roleOptions} 
              onChange={(e) => setNewStaff({ ...newStaff, roleId: e.value })} 
              placeholder="Select a Role"
              className="border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="staffDept" className="font-semibold text-xs text-gray-500 dark:text-gray-400">Department</label>
              <Dropdown 
                id="staffDept" 
                value={newStaff.departmentId} 
                options={deptOptions} 
                onChange={(e) => setNewStaff({ ...newStaff, departmentId: e.value })} 
                placeholder="Select Dept"
                className="border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="staffDesig" className="font-semibold text-xs text-gray-500 dark:text-gray-400">Designation</label>
              <InputText 
                id="staffDesig" 
                value={newStaff.designation} 
                onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })} 
                placeholder="e.g., Physics Teacher"
                className="p-2 border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
              />
            </div>
          </div>
        </div>
      </Dialog>

      {/* Dialog: Salary Structure Configuration */}
      <Dialog 
        header={`Salary Structure Config - ${getStaffName(selectedUserForSalary)}`} 
        visible={showSalaryStructureDialog} 
        style={{ width: '400px' }} 
        modal 
        onHide={() => setShowSalaryStructureDialog(false)}
        className="dialog-custom rounded-3xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowSalaryStructureDialog(false)} />
            <Button 
              label="Save Structure" 
              icon="pi pi-check" 
              onClick={handleSaveSalaryStructure} 
              loading={upsertStructureMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" 
            />
          </div>
        }
      >
        {loadingStructure ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold text-slate-400">Fetching structure configuration...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Base Salary (₹/month) *</label>
              <InputNumber 
                value={salaryForm.baseSalary} 
                onValueChange={(e) => setSalaryForm({ ...salaryForm, baseSalary: e.value || 0 })} 
                mode="currency" 
                currency="INR" 
                locale="en-IN"
                className="border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">HRA Allowance (₹/month)</label>
              <InputNumber 
                value={salaryForm.hra} 
                onValueChange={(e) => setSalaryForm({ ...salaryForm, hra: e.value || 0 })} 
                mode="currency" 
                currency="INR" 
                locale="en-IN"
                className="border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Other Allowances (₹/month)</label>
              <InputNumber 
                value={salaryForm.allowance} 
                onValueChange={(e) => setSalaryForm({ ...salaryForm, allowance: e.value || 0 })} 
                mode="currency" 
                currency="INR" 
                locale="en-IN"
                className="border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Deductions / PF (₹/month)</label>
              <InputNumber 
                value={salaryForm.deductions} 
                onValueChange={(e) => setSalaryForm({ ...salaryForm, deductions: e.value || 0 })} 
                mode="currency" 
                currency="INR" 
                locale="en-IN"
                className="border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
              />
            </div>
          </div>
        )}
      </Dialog>
    </DashboardLayout>
  );
}
