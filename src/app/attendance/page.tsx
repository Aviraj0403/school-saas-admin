'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useAttendance } from '@/hooks/queries/useAttendance';
import { Calendar } from 'primereact/calendar';
import { Tag } from 'primereact/tag';

export default function AttendancePage() {
  const [date, setDate] = useState<Date | null>(new Date());
  
  // Format date to YYYY-MM-DD for the API
  const formattedDate = date ? date.toISOString().split('T')[0] : '';
  
  const { data, isPending, isError, error } = useAttendance(formattedDate);

  const statusBodyTemplate = (rowData: any) => {
    switch (rowData.status) {
      case 'PRESENT': return <Tag value="Present" severity="success" />;
      case 'ABSENT': return <Tag value="Absent" severity="danger" />;
      case 'LATE': return <Tag value="Late" severity="warning" />;
      case 'HALF_DAY': return <Tag value="Half Day" severity="info" />;
      default: return <Tag value="Unknown" severity="secondary" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance</h1>
            <p className="text-gray-500 mt-1">View and mark daily attendance records.</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
            <span className="font-medium text-gray-600 px-2">Select Date:</span>
            <Calendar 
              value={date} 
              onChange={(e) => setDate(e.value as Date)} 
              showIcon 
              maxDate={new Date()}
              dateFormat="yy-mm-dd"
            />
          </div>
        </div>

        <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
          {isError ? (
             <div className="p-4 bg-red-50 text-red-600 rounded-md">
               Error loading attendance: {error.message}
             </div>
          ) : (
            <DataTable 
              value={data?.data?.items || []} 
              loading={isPending}
              className="p-datatable-sm"
              emptyMessage="No attendance records found for this date."
            >
              <Column field="studentName" header="Student Name"></Column>
              <Column field="date" header="Date"></Column>
              <Column field="status" header="Status" body={statusBodyTemplate}></Column>
              <Column field="remarks" header="Remarks"></Column>
            </DataTable>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
