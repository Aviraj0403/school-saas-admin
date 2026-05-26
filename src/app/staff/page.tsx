'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { useStaffList, useCreateStaff, useDeleteStaff } from '@/hooks/queries/useStaff';
import { Role } from '@/store/useAuthStore';

export default function StaffPage() {
  const [lazyState, setLazyState] = useState({
    first: 0,
    rows: 10,
    page: 1,
    search: '',
  });

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Teacher' as Role,
    department: '',
    designation: '',
  });

  const { data, isPending, isError, error } = useStaffList(lazyState.page, lazyState.rows, lazyState.search);
  const createMutation = useCreateStaff();
  const deleteMutation = useDeleteStaff();

  const onPage = (event: DataTablePageEvent) => {
    setLazyState((prev) => ({
      ...prev,
      first: event.first,
      rows: event.rows,
      page: (event.page || 0) + 1,
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLazyState((prev) => ({
      ...prev,
      search: e.target.value,
      page: 1,
      first: 0
    }));
  };

  const handleAddStaff = () => {
    createMutation.mutate(newStaff, {
      onSuccess: () => {
        setShowAddDialog(false);
        setNewStaff({
          name: '',
          email: '',
          phone: '',
          role: 'Teacher',
          department: '',
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
    
    if (rowData.role === 'SuperAdmin') {
      severity = 'danger';
      style = 'bg-rose-500/10 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400';
    } else if (rowData.role === 'Principal') {
      severity = 'success';
      style = 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
    } else if (rowData.role === 'Accountant') {
      severity = 'warning';
      style = 'bg-amber-500/10 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400';
    }
    
    return <Tag value={rowData.role} severity={severity} className={`px-2.5 py-1 text-xs font-bold rounded-full ${style}`} />;
  };

  const actionsBodyTemplate = (rowData: any) => {
    return (
      <div className="flex gap-1 justify-center">
        <Button 
          icon="pi pi-trash" 
          rounded 
          text 
          severity="danger" 
          onClick={() => handleDeleteStaff(rowData.id)} 
          tooltip="Delete Staff"
          className="hover:scale-105 active:scale-95 transition-all"
        />
      </div>
    );
  };

  const roleOptions = [
    { label: 'Teacher', value: 'Teacher' },
    { label: 'Principal', value: 'Principal' },
    { label: 'Accountant', value: 'Accountant' },
  ];

  const staffList = data?.items || (data as any)?.data?.items || [];
  const totalRecords = data?.meta?.total || (data as any)?.data?.meta?.total || 0;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto p-1">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 rounded-2xl shadow-xl text-white">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Staff & Directory</h1>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              Manage school faculty teachers, administrators, system roles, and logs.
            </p>
          </div>
          <button 
            onClick={() => setShowAddDialog(true)}
            className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm"
          >
            <i className="pi pi-user-plus"></i>
            Register Staff
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Registered</span>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2">{isPending ? '...' : totalRecords}</h2>
          </div>
          <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 p-5 rounded-2xl shadow-sm">
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Teachers</span>
            <h2 className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2">
              {isPending ? '...' : staffList.filter((s: any) => s.role === 'Teacher' || s.role === 'TEACHER').length}
            </h2>
          </div>
          <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/20 p-5 rounded-2xl shadow-sm">
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Administration</span>
            <h2 className="text-3xl font-extrabold text-amber-700 dark:text-amber-400 mt-2">
              {isPending ? '...' : staffList.filter((s: any) => s.role !== 'Teacher' && s.role !== 'TEACHER').length}
            </h2>
          </div>
          <div className="bg-violet-50/50 dark:bg-violet-950/10 border border-violet-100/50 dark:border-violet-900/20 p-5 rounded-2xl shadow-sm">
            <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">Active Departments</span>
            <h2 className="text-3xl font-extrabold text-violet-700 dark:text-violet-400 mt-2">
              {isPending ? '...' : Math.max(1, new Set(staffList.map((s: any) => s.department).filter(Boolean)).size)}
            </h2>
          </div>
        </div>

        {/* Filter and Control Bar */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <i className="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <InputText
                value={lazyState.search}
                onChange={handleSearchChange}
                placeholder="Search staff by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl outline-none focus:border-indigo-500 transition-all text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid' 
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
              }`}
              title="Grid Cards"
            >
              <i className="pi pi-th-large text-lg"></i>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'table' 
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
              }`}
              title="Table View"
            >
              <i className="pi pi-list text-lg"></i>
            </button>
          </div>
        </div>

        {/* Dynamic Display Section */}
        {isError ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30">
            Error loading staff data: {error.message}
          </div>
        ) : isPending ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-semibold text-slate-400">Loading staff directory...</span>
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-20 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
            <p className="text-slate-400 font-medium">No staff members found.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {staffList.map((member: any) => {
              const initials = member.name ? member.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'ST';
              return (
                <div 
                  key={member.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700/80 transition-all duration-200 flex flex-col justify-between gap-4 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-base border border-indigo-100 dark:border-indigo-900/30 group-hover:scale-105 transition-all duration-300">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-150">
                          {member.name}
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                          {member.designation || 'Faculty Member'} · <span className="text-slate-500 dark:text-slate-400">{member.department || 'General'}</span>
                        </p>
                      </div>
                    </div>
                    {roleBodyTemplate(member)}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl text-xs flex flex-col gap-1 text-slate-600 dark:text-slate-400 border border-slate-100/50 dark:border-slate-800/50">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Email:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-300">{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Phone:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-300">{member.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
                    <button 
                      onClick={() => handleDeleteStaff(member.id)}
                      className="px-3.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 rounded-xl transition-all active:scale-95"
                    >
                      Delete Registration
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <DataTable 
              value={staffList} 
              lazy 
              paginator 
              first={lazyState.first}
              rows={lazyState.rows}
              totalRecords={totalRecords}
              onPage={onPage}
              loading={isPending}
              className="p-datatable-sm"
              emptyMessage="No staff members registered."
            >
              <Column field="name" header="Name" className="font-semibold"></Column>
              <Column field="email" header="Email"></Column>
              <Column field="phone" header="Phone"></Column>
              <Column field="role" header="Role" body={roleBodyTemplate}></Column>
              <Column field="department" header="Department"></Column>
              <Column field="designation" header="Designation"></Column>
              <Column header="Actions" body={actionsBodyTemplate}></Column>
            </DataTable>
          </div>
        )}
      </div>

      {/* Dialog: Add Staff */}
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
              className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="staffEmail" className="font-semibold text-xs text-gray-500 dark:text-gray-400">Email Address *</label>
            <InputText 
              id="staffEmail" 
              value={newStaff.email} 
              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} 
              placeholder="e.g., janesmith@school.com"
              className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="staffPhone" className="font-semibold text-xs text-gray-500 dark:text-gray-400">Phone Number</label>
            <InputText 
              id="staffPhone" 
              value={newStaff.phone} 
              onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} 
              placeholder="e.g., +91 98765 43210"
              className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="staffRole" className="font-semibold text-xs text-gray-500 dark:text-gray-400">System Role</label>
            <Dropdown 
              id="staffRole" 
              value={newStaff.role} 
              options={roleOptions} 
              onChange={(e) => setNewStaff({ ...newStaff, role: e.value })} 
              placeholder="Select a Role"
              className="border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="staffDept" className="font-semibold text-xs text-gray-500 dark:text-gray-400">Department</label>
              <InputText 
                id="staffDept" 
                value={newStaff.department} 
                onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })} 
                placeholder="e.g., Science"
                className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="staffDesig" className="font-semibold text-xs text-gray-500 dark:text-gray-400">Designation</label>
              <InputText 
                id="staffDesig" 
                value={newStaff.designation} 
                onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })} 
                placeholder="e.g., Physics Teacher"
                className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
              />
            </div>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
