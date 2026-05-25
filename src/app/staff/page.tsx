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
    if (rowData.role === 'SuperAdmin') severity = 'danger';
    else if (rowData.role === 'Principal') severity = 'success';
    else if (rowData.role === 'Accountant') severity = 'warning';
    return <Tag value={rowData.role} severity={severity} />;
  };

  const actionsBodyTemplate = (rowData: any) => {
    return (
      <Button 
        icon="pi pi-trash" 
        rounded 
        text 
        severity="danger" 
        onClick={() => handleDeleteStaff(rowData.id)} 
        tooltip="Delete Staff"
      />
    );
  };

  const roleOptions = [
    { label: 'Teacher', value: 'Teacher' },
    { label: 'Principal', value: 'Principal' },
    { label: 'Accountant', value: 'Accountant' },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staff & Roles</h1>
            <p className="text-gray-500 mt-1">Manage teachers, accountants, and school administration staff.</p>
          </div>
          <Button 
            label="Register Staff" 
            icon="pi pi-user-plus" 
            className="p-button-primary bg-primary text-white p-2 px-4" 
            onClick={() => setShowAddDialog(true)} 
          />
        </div>

        <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <span className="p-input-icon-left w-full md:w-80">
              <i className="pi pi-search" />
              <InputText 
                value={lazyState.search} 
                onChange={handleSearchChange} 
                placeholder="Search staff by name or email..." 
                className="w-full pl-8 py-2 border border-gray-200 rounded-md"
              />
            </span>
          </div>

          {isError ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-md">
              Error loading staff data: {error.message}
            </div>
          ) : (
            <DataTable 
              value={data?.data || []} 
              lazy 
              paginator 
              first={lazyState.first}
              rows={lazyState.rows}
              totalRecords={data?.meta?.total || 0}
              onPage={onPage}
              loading={isPending}
              className="p-datatable-sm"
              emptyMessage="No staff members registered."
            >
              <Column field="name" header="Name"></Column>
              <Column field="email" header="Email"></Column>
              <Column field="phone" header="Phone"></Column>
              <Column field="role" header="Role" body={roleBodyTemplate}></Column>
              <Column field="department" header="Department"></Column>
              <Column field="designation" header="Designation"></Column>
              <Column header="Actions" body={actionsBodyTemplate}></Column>
            </DataTable>
          )}
        </Card>

        <Dialog 
          header="Register New Staff Member" 
          visible={showAddDialog} 
          style={{ width: '450px' }} 
          modal 
          onHide={() => setShowAddDialog(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button label="Cancel" icon="pi pi-times" onClick={() => setShowAddDialog(false)} className="p-button-text p-2" />
              <Button 
                label="Register" 
                icon="pi pi-check" 
                onClick={handleAddStaff} 
                loading={createMutation.isPending}
                className="bg-primary text-white p-2 px-4" 
              />
            </div>
          }
        >
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="staffName" className="font-semibold text-gray-700 dark:text-gray-300">Full Name</label>
              <InputText 
                id="staffName" 
                value={newStaff.name} 
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} 
                placeholder="e.g., Jane Smith"
                className="p-2 border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="staffEmail" className="font-semibold text-gray-700 dark:text-gray-300">Email Address</label>
              <InputText 
                id="staffEmail" 
                value={newStaff.email} 
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} 
                placeholder="e.g., janesmith@school.com"
                className="p-2 border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="staffPhone" className="font-semibold text-gray-700 dark:text-gray-300">Phone Number</label>
              <InputText 
                id="staffPhone" 
                value={newStaff.phone} 
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} 
                placeholder="e.g., +91 98765 43210"
                className="p-2 border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="staffRole" className="font-semibold text-gray-700 dark:text-gray-300">System Role</label>
              <Dropdown 
                id="staffRole" 
                value={newStaff.role} 
                options={roleOptions} 
                onChange={(e) => setNewStaff({ ...newStaff, role: e.value })} 
                placeholder="Select a Role"
                className="border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="staffDept" className="font-semibold text-gray-700 dark:text-gray-300">Department</label>
              <InputText 
                id="staffDept" 
                value={newStaff.department} 
                onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })} 
                placeholder="e.g., Science, Administration"
                className="p-2 border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="staffDesig" className="font-semibold text-gray-700 dark:text-gray-300">Designation</label>
              <InputText 
                id="staffDesig" 
                value={newStaff.designation} 
                onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })} 
                placeholder="e.g., Senior Physics Teacher, Receptionist"
                className="p-2 border border-gray-200 rounded-md"
              />
            </div>
          </div>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
