'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useStudentsList } from '@/hooks/queries/useStudents';
import { Tag } from 'primereact/tag';

export default function StudentsPage() {
  const [lazyState, setLazyState] = useState({
    first: 0,
    rows: 10,
    page: 1,
  });

  // Fetch paginated data via TanStack Query
  const { data, isPending, isError, error } = useStudentsList(lazyState.page, lazyState.rows);

  const onPage = (event: DataTablePageEvent) => {
    setLazyState({
      first: event.first,
      rows: event.rows,
      page: (event.page || 0) + 1,
    });
  };

  const statusBodyTemplate = (rowData: any) => {
    return <Tag value={rowData.status} severity={rowData.status === 'ACTIVE' ? 'success' : 'warning'} />;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Students Management</h1>
          <p className="text-gray-500 mt-1">Manage admissions, details, and documents.</p>
        </div>

        <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
          {isError ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-md">
              Error loading students: {error.message}
            </div>
          ) : (
            <DataTable 
              value={data?.data?.items || []} 
              lazy 
              paginator 
              first={lazyState.first}
              rows={lazyState.rows}
              totalRecords={data?.data?.meta.total || 0}
              onPage={onPage}
              loading={isPending}
              className="p-datatable-sm"
              emptyMessage="No students found."
            >
              <Column field="admissionNo" header="Admission No."></Column>
              <Column field="firstName" header="First Name"></Column>
              <Column field="lastName" header="Last Name"></Column>
              <Column field="className" header="Class"></Column>
              <Column field="status" header="Status" body={statusBodyTemplate}></Column>
            </DataTable>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
