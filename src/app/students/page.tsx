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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

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
      <Button 
        icon="pi pi-eye" 
        rounded 
        text 
        severity="info" 
        size="small" 
        tooltip="View Profile" 
        className="hover:scale-105 active:scale-95 transition-all"
      />
      <Button 
        icon="pi pi-trash" 
        rounded 
        text 
        severity="danger" 
        size="small" 
        tooltip="Remove" 
        onClick={() => handleDelete(rowData.id)} 
        loading={deleteMutation.isPending} 
        className="hover:scale-105 active:scale-95 transition-all"
      />
    </div>
  );

  const studentsList = data?.items || data?.data?.items || [];
  const totalRecords = data?.meta?.total || data?.data?.meta?.total || 0;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto p-1">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 rounded-2xl shadow-xl text-white">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Student Directory</h1>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              Manage student profile catalogs, academic admissions, and structural data.
            </p>
          </div>
          <Link href="/students/admissions">
            <button className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm">
              <i className="pi pi-user-plus"></i>
              New Admission
            </button>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Enrolled</span>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2">{isPending ? '...' : totalRecords}</h2>
          </div>
          <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 p-5 rounded-2xl shadow-sm">
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
            <h2 className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2">
              {isPending ? '...' : studentsList.filter((s: any) => s.status === 'ACTIVE').length}
            </h2>
          </div>
          <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/20 p-5 rounded-2xl shadow-sm">
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Suspended</span>
            <h2 className="text-3xl font-extrabold text-amber-700 dark:text-amber-400 mt-2">
              {isPending ? '...' : studentsList.filter((s: any) => s.status !== 'ACTIVE').length}
            </h2>
          </div>
          <div className="bg-violet-50/50 dark:bg-violet-950/10 border border-violet-100/50 dark:border-violet-900/20 p-5 rounded-2xl shadow-sm">
            <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">Newly Added</span>
            <h2 className="text-3xl font-extrabold text-violet-700 dark:text-violet-400 mt-2">
              {isPending ? '...' : Math.min(totalRecords, 5)}
            </h2>
          </div>
        </div>

        {/* Filter and Control Bar */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <i className="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <InputText
                value={search}
                onChange={(e) => { setSearch(e.target.value); setLazyState((p) => ({ ...p, page: 1, first: 0 })); }}
                placeholder="Search by name or admission no..."
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

        {/* Dynamic Catalog Section */}
        {isError ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30">
            Error loading students: {(error as any)?.message}
          </div>
        ) : isPending ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-semibold text-slate-400">Loading student directory...</span>
          </div>
        ) : studentsList.length === 0 ? (
          <div className="p-20 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
            <p className="text-slate-400 font-medium">No students found matching current filters.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {studentsList.map((student: any) => {
              const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unnamed Student';
              return (
                <div 
                  key={student.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700/80 transition-all duration-200 flex flex-col justify-between gap-4 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-base border border-indigo-100 dark:border-indigo-900/30 group-hover:scale-105 transition-all duration-300">
                        {student.firstName ? student.firstName[0] : '?'}
                        {student.lastName ? student.lastName[0] : ''}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-150">
                          {fullName}
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                          Adm No: <span className="font-mono text-slate-600 dark:text-slate-400">{student.admissionNo}</span>
                        </p>
                      </div>
                    </div>
                    {statusTemplate(student)}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl text-xs flex justify-between items-center text-slate-600 dark:text-slate-400 border border-slate-100/50 dark:border-slate-800/50">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Academic Class</span>
                    <span className="font-bold text-slate-800 dark:text-slate-300">{student.className || 'Not Assigned'}</span>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
                    <button 
                      className="px-3.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 rounded-xl transition-all active:scale-95"
                    >
                      View Profile
                    </button>
                    <button 
                      onClick={() => handleDelete(student.id)}
                      className="px-3.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 rounded-xl transition-all active:scale-95"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <DataTable
              value={studentsList}
              lazy
              paginator
              first={lazyState.first}
              rows={lazyState.rows}
              totalRecords={totalRecords}
              onPage={onPage}
              loading={isPending}
              className="p-datatable-sm"
              emptyMessage="No students found."
            >
              <Column field="admissionNo" header="Admission No." className="font-semibold" />
              <Column field="firstName" header="First Name" />
              <Column field="lastName" header="Last Name" />
              <Column field="className" header="Class" />
              <Column field="status" header="Status" body={statusTemplate} />
              <Column header="Actions" body={actionsTemplate} align="center" />
            </DataTable>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
