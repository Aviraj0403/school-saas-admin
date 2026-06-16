'use client';

import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { useStudentsList, useDeleteStudent } from '@/hooks/queries/useStudents';
import Link from 'next/link';
import { TanstackTable } from '@/components/TanstackTable';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { StatCard } from '@/components/ui/StatCard';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';



export default function StudentsPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const { data, isPending, isError, error } = useStudentsList(pagination.pageIndex + 1, pagination.pageSize, search || undefined);
  const deleteMutation = useDeleteStudent();

  const handleDelete = (id: string) => {
    if (confirm('Soft-delete this student? Their data will be retained.')) {
      deleteMutation.mutate(id);
    }
  };

  const statusTemplate = (rowData: any) => {
    const isActive = rowData.status === 'ACTIVE';
    return (
      <Tag 
        value={rowData.status} 
        severity={isActive ? 'success' : 'warning'}
        className={`px-3 py-1 text-xs font-bold rounded-full ${
          isActive 
            ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
            : 'bg-amber-500/10 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
        }`}
      />
    );
  };

  const actionsTemplate = (rowData: any) => (
    <div className="flex gap-2 justify-center">
      <Link href={`/students/${rowData.id}`}>
        <button className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-md transition-all active:scale-95" title="View Profile">
          <i className="pi pi-eye"></i>
        </button>
      </Link>
      <button 
        onClick={() => handleDelete(rowData.id)}
        disabled={deleteMutation.isPending}
        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-md transition-all active:scale-95 disabled:opacity-50"
        title="Remove"
      >
        <i className={deleteMutation.isPending ? "pi pi-spin pi-spinner" : "pi pi-trash"}></i>
      </button>
    </div>
  );

  const studentsList = data?.items || data?.data?.items || [];
  const totalRecords = data?.meta?.total || data?.data?.meta?.total || 0;
  const pageCount = data?.meta?.totalPages || data?.data?.meta?.totalPages || Math.ceil(totalRecords / pagination.pageSize) || 0;

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'admissionNo',
        header: 'Admission No.',
        cell: (info) => <span className="font-medium text-zinc-700 dark:text-zinc-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'firstName',
        header: 'First Name',
      },
      {
        accessorKey: 'lastName',
        header: 'Last Name',
      },
      {
        accessorKey: 'className',
        header: 'Class',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => statusTemplate(info.row.original),
      },
      {
        id: 'actions',
        header: () => <div className="text-center">Actions</div>,
        cell: (info) => actionsTemplate(info.row.original),
      },
    ],
    [deleteMutation.isPending]
  );

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Students" />
<div className="flex flex-col gap-4 sm:gap-6 md:gap-8 pb-6 md:pb-10 w-full">
        
        {/* Header Block */}
        <div className="flex flex-col items-start gap-4 pb-4">
          {/* <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Student Directory</h1>
            <p className="text-slate-400 mt-1 text-sm">
              Manage student profiles, academic admissions, and records.
            </p>
          </div> */}
          <Link href="/students/admissions" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold border-0 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all active:scale-95 flex items-center justify-center gap-2 text-sm ring-1 ring-slate-900/5 dark:ring-white/10 px-5 py-3">

              <i className="pi pi-plus text-xs"></i>
              New Admission
            </button>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            label="Total Enrolled"
            value={isPending ? '...' : totalRecords}
            icon="pi pi-users"
            gradientClass="from-blue-500 to-blue-600"
            iconBgClass="bg-blue-50 dark:bg-blue-900/20"
            iconColorClass="text-blue-600 dark:text-blue-400"
            footerText="Total students in system"
          />
          <StatCard
            label="Active"
            value={isPending ? '...' : studentsList.filter((s: any) => s.status === 'ACTIVE').length}
            icon="pi pi-check-circle"
            gradientClass="from-emerald-500 to-teal-500"
            iconBgClass="bg-emerald-500/10 dark:bg-emerald-500/20"
            iconColorClass="text-emerald-600 dark:text-emerald-400"
            footerText="Currently active students"
          />
          <StatCard
            label="Suspended"
            value={isPending ? '...' : studentsList.filter((s: any) => s.status !== 'ACTIVE').length}
            icon="pi pi-exclamation-triangle"
            gradientClass="from-amber-500 to-orange-500"
            iconBgClass="bg-amber-500/10 dark:bg-amber-500/20"
            iconColorClass="text-amber-600 dark:text-amber-400"
            footerText="Inactive or suspended"
          />
          <StatCard
            label="Newly Added"
            value={isPending ? '...' : Math.min(totalRecords, 5)}
            icon="pi pi-user-plus"
            gradientClass="from-purple-500 to-purple-600"
            iconBgClass="bg-purple-50 dark:bg-purple-900/20"
            iconColorClass="text-purple-600 dark:text-purple-400"
            footerText="Recent enrollments"
          />
        </div>

        {/* Filter and Control Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <i className="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"></i>
              <InputText
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md dark:bg-zinc-950 text-sm outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 px-4 rounded-md text-xs font-medium transition-all ${
                viewMode === 'grid' 
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <i className="pi pi-th-large text-sm mr-2"></i>
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 px-4 rounded-md text-xs font-medium transition-all ${
                viewMode === 'table' 
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <i className="pi pi-list text-sm mr-2"></i>
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* Dynamic Catalog Section */}
        {isError ? (
          <div className="p-6 bg-red-50 text-red-600 rounded-md border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50 flex items-center gap-4 shadow-sm">
            <i className="pi pi-exclamation-circle text-2xl"></i>
            <div>
              <h3 className="font-bold">Failed to load</h3>
              <p className="text-sm opacity-80">{(error as any)?.message}</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {isPending ? (
               <div className="col-span-full py-12 flex flex-col items-center justify-center gap-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950">
                 <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin"></div>
                 <span className="text-sm font-medium text-zinc-500">Loading directory...</span>
               </div>
            ) : studentsList.length === 0 ? (
               <div className="col-span-full py-12 text-center border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950">
                 <p className="text-zinc-500 text-sm">No students found matching current filters.</p>
               </div>
            ) : (
              studentsList.map((student: any) => {
                const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unnamed Student';
                return (
                  <div key={student.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-all duration-300 animate-fade-in group">
                    <div className="p-4 flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold text-lg uppercase ring-2 ring-white dark:ring-zinc-900">
                        {student.firstName ? student.firstName[0] : '?'}
                        {student.lastName ? student.lastName[0] : ''}
                      </div>
                      <div className="flex flex-col flex-1">
                        <h3 className="font-semibold text-sm text-zinc-900 dark:text-white line-clamp-1">
                          {fullName}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                          {student.admissionNo}
                        </p>
                      </div>
                      {statusTemplate(student)}
                    </div>
                    
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-sm py-2 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-zinc-500">Class</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-200">{student.className || 'Not Assigned'}</span>
                      </div>

                      <div className="flex justify-end gap-2 mt-1">
                        <Link href={`/students/${student.id}`} className="flex-1">
                          <button className="w-full px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 border border-transparent rounded-md transition-all flex justify-center items-center">
                            View Profile
                          </button>
                        </Link>
                        <button 
                          onClick={() => handleDelete(student.id)}
                          className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-900/20 border border-zinc-200 dark:border-zinc-800 rounded-md transition-colors"
                          title="Delete Student"
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
            {!isPending && studentsList.length > 0 && (
              <div className="col-span-full flex justify-between items-center pt-4">
                <span className="text-sm font-medium text-zinc-500">Page {pagination.pageIndex + 1} of {pageCount}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPagination(p => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}
                    disabled={pagination.pageIndex === 0}
                    className="px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors text-zinc-700 dark:text-zinc-300"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setPagination(p => ({ ...p, pageIndex: Math.min(pageCount - 1, p.pageIndex + 1) }))}
                    disabled={pagination.pageIndex >= pageCount - 1}
                    className="px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors text-zinc-700 dark:text-zinc-300"
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
              data={studentsList} 
              columns={columns} 
              isLoading={isPending}
              pagination={pagination}
              setPagination={setPagination}
              pageCount={pageCount}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
