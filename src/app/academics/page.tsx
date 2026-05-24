'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useClasses } from '@/hooks/queries/useAcademics';

export default function AcademicsPage() {
  const [lazyState, setLazyState] = useState({
    first: 0,
    rows: 10,
    page: 1,
  });

  const { data, isPending, isError, error } = useClasses(lazyState.page, lazyState.rows);

  const onPage = (event: DataTablePageEvent) => {
    setLazyState({
      first: event.first,
      rows: event.rows,
      page: (event.page || 0) + 1,
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Academics</h1>
          <p className="text-gray-500 mt-1">Manage classes, sections, and subjects.</p>
        </div>

        <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
          {isError ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-md">
              Error loading classes: {error.message}
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
              emptyMessage="No classes configured yet."
            >
              <Column field="name" header="Class Name"></Column>
              <Column field="section" header="Section"></Column>
              <Column field="capacity" header="Capacity"></Column>
            </DataTable>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
