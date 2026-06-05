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
        <button className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-lg transition-all active:scale-95" title="View Profile">
          <i className="pi pi-eye"></i>
        </button>
      </Link>
      <button 
        onClick={() => handleDelete(rowData.id)}
        disabled={deleteMutation.isPending}
        className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 rounded-lg transition-all active:scale-95 disabled:opacity-50"
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
        cell: (info) => <span className="font-semibold text-slate-700 dark:text-slate-300">{info.getValue() as string}</span>,
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
      <div className="flex flex-col gap-6 lg:gap-8 pb-10 max-w-[100vw] overflow-x-hidden">
        
        {/* Header Block */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pt-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Student Directory</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Manage student profiles, academic admissions, and records.
            </p>
          </div>
          <Link href="/students/admissions" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-medium rounded-md transition-colors flex items-center justify-center gap-2 text-sm">
              <i className="pi pi-plus text-xs"></i>
              New Admission
            </button>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Enrolled</span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">{isPending ? '...' : totalRecords}</h2>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col justify-between">
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Active</span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
              {isPending ? '...' : studentsList.filter((s: any) => s.status === 'ACTIVE').length}
            </h2>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col justify-between">
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Suspended</span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
              {isPending ? '...' : studentsList.filter((s: any) => s.status !== 'ACTIVE').length}
            </h2>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col justify-between">
            <span className="text-sm font-medium text-violet-600 dark:text-violet-400">Newly Added</span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
              {isPending ? '...' : Math.min(totalRecords, 5)}
            </h2>
          </div>
        </div>

        {/* Filter and Control Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <InputText
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
                placeholder="Search students..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-end bg-slate-100 dark:bg-slate-900 p-1 rounded-md border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 px-3 rounded-md transition-all font-medium flex items-center gap-2 text-sm ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <i className="pi pi-th-large text-sm"></i>
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 px-3 rounded-md transition-all font-medium flex items-center gap-2 text-sm ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <i className="pi pi-list text-sm"></i>
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* Dynamic Catalog Section */}
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
            ) : studentsList.length === 0 ? (
               <div className="col-span-full py-12 text-center border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950">
                 <p className="text-slate-500 text-sm">No students found matching current filters.</p>
               </div>
            ) : (
              studentsList.map((student: any) => {
                const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unnamed Student';
                return (
                  <div 
                    key={student.id} 
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm border border-slate-200 dark:border-slate-800">
                          {student.firstName ? student.firstName[0] : '?'}
                          {student.lastName ? student.lastName[0] : ''}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                            {fullName}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                            {student.admissionNo}
                          </p>
                        </div>
                      </div>
                      {statusTemplate(student)}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm py-2 border-y border-slate-100 dark:border-slate-800/50">
                      <span className="text-slate-500">Class</span>
                      <span className="font-medium text-slate-900 dark:text-slate-200">{student.className || 'Not Assigned'}</span>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Link href={`/students/${student.id}`} className="flex-1">
                        <button className="w-full px-3 py-1.5 text-sm font-medium text-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md transition-colors flex justify-center items-center gap-2">
                          View
                        </button>
                      </Link>
                      <button 
                        onClick={() => handleDelete(student.id)}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white dark:bg-slate-950 hover:bg-red-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md transition-colors"
                        title="Delete Student"
                      >
                        <i className="pi pi-trash text-xs"></i>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            
            {/* Grid Pagination */}
            {!isPending && studentsList.length > 0 && (
              <div className="col-span-full flex justify-between items-center pt-4">
                <span className="text-sm font-medium text-slate-500">Page {pagination.pageIndex + 1} of {pageCount}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPagination(p => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}
                    disabled={pagination.pageIndex === 0}
                    className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors text-slate-700 dark:text-slate-300"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setPagination(p => ({ ...p, pageIndex: Math.min(pageCount - 1, p.pageIndex + 1) }))}
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
