'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { useStudentsList, useDeleteStudent } from '@/hooks/queries/useStudents';
import Link from 'next/link';

export default function StudentsPage() {
  const [lazyState, setLazyState] = useState({ first: 0, rows: 10, page: 1 });
  const [search, setSearch] = useState('');

  const { data, isPending, isError, error } = useStudentsList(lazyState.page, lazyState.rows, search || undefined);
  const deleteMutation = useDeleteStudent();

  const onPage = (event: DataTablePageEvent) => {
    setLazyState({ first: event.first, rows: event.rows, page: (event.page || 0) + 1 });
  };

  const handleDelete = (id: string) => {
    if (confirm('Soft-delete this student? Their data will be retained.')) {
      deleteMutation.mutate(id);
    }
  };

  const statusTemplate = (rowData: any) => (
    <Tag value={rowData.status} severity={rowData.status === 'ACTIVE' ? 'success' : 'warning'} />
  );

  const actionsTemplate = (rowData: any) => (
    <div className="flex gap-1">
      <Button icon="pi pi-eye" rounded text size="small" tooltip="View Profile" />
      <Button icon="pi pi-trash" rounded text severity="danger" size="small" tooltip="Remove" onClick={() => handleDelete(rowData.id)} loading={deleteMutation.isPending} />
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Students</h1>
            <p className="text-gray-500 mt-1">Manage student records, admissions, and documents.</p>
          </div>
          <Link href="/students/admissions">
            <Button label="New Admission" icon="pi pi-user-plus" className="bg-primary text-white p-2 px-4" />
          </Link>
        </div>

        <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                value={search}
                onChange={(e) => { setSearch(e.target.value); setLazyState((p) => ({ ...p, page: 1, first: 0 })); }}
                placeholder="Search by name, admission no..."
                className="pl-8 py-2 border border-gray-200 rounded-md w-72"
              />
            </span>
            <span className="text-sm text-gray-500">
              {data?.data?.meta?.total ?? 0} students total
            </span>
          </div>

          {isError ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-md">
              Error loading students: {(error as any)?.message}
            </div>
          ) : (
            <DataTable
              value={data?.data?.items || []}
              lazy
              paginator
              first={lazyState.first}
              rows={lazyState.rows}
              totalRecords={data?.meta?.total || 0}
              onPage={onPage}
              loading={isPending}
              className="p-datatable-sm"
              emptyMessage="No students found."
              stripedRows
            >
              <Column field="admissionNo" header="Admission No." sortable />
              <Column field="firstName" header="First Name" sortable />
              <Column field="lastName" header="Last Name" sortable />
              <Column field="className" header="Class" />
              <Column field="status" header="Status" body={statusTemplate} />
              <Column header="Actions" body={actionsTemplate} align="center" />
            </DataTable>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
