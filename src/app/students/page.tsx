'use client';

import { isStudentActive } from '@/lib/format';
import { asList } from '@/lib/utils';
import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Trash2,
  Plus,
  Users,
  CheckCircle,
  AlertTriangle,
  UserPlus,
  Search,
  LayoutGrid,
  List,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useStudentsList, useDeleteStudent } from '@/hooks/queries/useStudents';
import { resolveMediaUrl } from '@/lib/media';
import Link from 'next/link';
import { TanstackTable } from '@/components/TanstackTable';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { StatCard } from '@/components/ui/StatCard';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';

export default function StudentsPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const { hasPermission, isSchoolAdmin, isSuperAdmin } = usePermission();
  const canWriteStudent =
    isSuperAdmin ||
    isSchoolAdmin ||
    hasPermission('students', 'write') ||
    hasPermission('student_admission', 'write');
  const canDeleteStudent =
    isSuperAdmin ||
    isSchoolAdmin ||
    hasPermission('students', 'delete') ||
    hasPermission('student_directory', 'delete');

  const { data, isPending, isError, error } = useStudentsList(
    pagination.pageIndex + 1,
    pagination.pageSize,
    search || undefined
  );
  const deleteMutation = useDeleteStudent();

  const handleDelete = (id: string) => {
    if (confirm('Soft-delete this student? Their data will be retained.')) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast.success('Student deleted'),
        onError: (err: any) =>
          toast.error(err?.response?.data?.message || err?.message || 'Failed to delete student'),
      });
    }
  };

  const statusTemplate = (rowData: any) => {
    const isActive = isStudentActive(rowData);
    return (
      <Badge variant={isActive ? 'success' : 'warning'}>{isActive ? 'Active' : 'Inactive'}</Badge>
    );
  };

  const actionsTemplate = (rowData: any) => (
    <div className="flex justify-center gap-2">
      <Link href={`/students/${rowData.id}`}>
        <button
          className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-md transition-all active:scale-95"
          title="View Profile"
        >
          <Eye className="w-4 h-4" />
        </button>
      </Link>
      {canDeleteStudent && (
        <button
          onClick={() => handleDelete(rowData.id)}
          disabled={deleteMutation.isPending}
          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-md transition-all active:scale-95 disabled:opacity-50"
          title="Remove"
        >
          {deleteMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );

  const studentsList = asList(data);
  const totalRecords = data?.meta?.total || data?.data?.meta?.total || 0;
  const pageCount =
    data?.meta?.totalPages ||
    data?.data?.meta?.totalPages ||
    Math.ceil(totalRecords / pagination.pageSize) ||
    0;

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'admissionNo',
        header: 'Admission No.',
        cell: (info) => (
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Student',
        cell: (info) => {
          const s = info.row.original;
          const url = resolveMediaUrl(s.photo);
          const displayName = s.name || `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || '—';
          return (
            <div className="flex items-center gap-2.5">
              {url ? (
                <img src={url} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center text-xs font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{displayName}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'className',
        header: 'Class',
        cell: (info) => {
          const s = info.row.original;
          return s.className || (s.class ? `${s.class.name} ${s.class.section ?? ''}`.trim() : '—');
        },
      },
      {
        accessorKey: 'rollNo',
        header: 'Roll No.',
        cell: (info) => (info.getValue() as string) || '—',
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
      <div className="flex w-full min-w-0 flex-col gap-4 pb-4 sm:gap-6">
        {/* Header Block */}
        <PageHeader
          title="Students"
          description="Every enrolled student, their class and status in one directory."
          actions={
            canWriteStudent ? (
              <Link href="/students/admissions" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">
                  <Plus className="w-4 h-4" />
                  New admission
                </Button>
              </Link>
            ) : undefined
          }
        />

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Enrolled"
            value={isPending ? '...' : totalRecords}
            icon={Users}
            gradientClass="from-blue-500 to-blue-600"
            footerText="Total students in system"
          />
          <StatCard
            label="Active"
            value={isPending ? '...' : studentsList.filter((s: any) => isStudentActive(s)).length}
            icon={CheckCircle}
            gradientClass="from-emerald-500 to-teal-500"
            footerText="Currently active students"
          />
          <StatCard
            label="Suspended"
            value={isPending ? '...' : studentsList.filter((s: any) => !isStudentActive(s)).length}
            icon={AlertTriangle}
            gradientClass="from-amber-500 to-orange-500"
            footerText="Inactive or suspended"
          />
          <StatCard
            label="Newly Added"
            value={isPending ? '...' : Math.min(totalRecords, 5)}
            icon={UserPlus}
            gradientClass="from-purple-500 to-purple-600"
            footerText="Recent enrollments"
          />
        </div>

        {/* Filter and Control Bar */}
        <div className="surface-card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              placeholder="Search students..."
              className="w-full pl-10"
            />
          </div>
          <div className="hidden gap-1 rounded-xl bg-muted p-1 md:flex">
            {(
              [
                ['grid', LayoutGrid, 'Grid'],
                ['table', List, 'List'],
              ] as const
            ).map(([mode, Icon, label]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex h-9 items-center gap-2 rounded-lg px-4 text-xs font-semibold transition-all ${
                  viewMode === mode
                    ? 'bg-card text-brand shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Catalog Section */}
        {isError ? (
          <div className="flex items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-600 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-400">
            <AlertCircle className="size-6 shrink-0" />
            <div className="min-w-0">
              <h3 className="font-semibold">Failed to load</h3>
              <p className="break-words text-sm opacity-80">{(error as any)?.message}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Cards: always on phones, and on larger screens in grid mode */}
            <div
              className={`grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 ${
                viewMode === 'table' ? 'md:hidden' : ''
              }`}
            >
              {isPending ? (
                <>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
                  ))}
                </>
              ) : studentsList.length === 0 ? (
                <div className="surface-card col-span-full flex flex-col items-center gap-3 p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No students found matching current filters.
                  </p>
                  {canWriteStudent && (
                    <Link href="/students/admissions">
                      <Button size="sm">
                        <Plus className="size-4" /> New admission
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                studentsList.map((student: any) => {
                  const fullName =
                    student.name ||
                    `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
                    'Unnamed student';
                  return (
                    <div
                      key={student.id}
                      className="surface-card animate-fade-in flex min-w-0 flex-col"
                    >
                      <div className="flex items-center gap-3 border-b border-border p-4">
                        <div className="tone-indigo tone-chip flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold uppercase">
                          {student.firstName ? student.firstName[0] : '?'}
                          {student.lastName ? student.lastName[0] : ''}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <h3 className="truncate text-sm font-semibold text-foreground">
                            {fullName}
                          </h3>
                          <p className="tabular mt-0.5 truncate font-mono text-xs text-muted-foreground">
                            {student.admissionNo}
                          </p>
                        </div>
                        {statusTemplate(student)}
                      </div>

                      <div className="flex flex-col gap-3 p-4">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">Class</span>
                          <span className="truncate font-medium text-foreground">
                            {student.className ||
                              (student.class
                                ? `${student.class.name} ${student.class.section ?? ''}`.trim()
                                : 'Not assigned')}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Link href={`/students/${student.id}`} className="flex-1">
                            <button className="tone-indigo tone-chip flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition-all active:scale-[0.98] sm:h-10">
                              View Profile
                            </button>
                          </Link>
                          {canDeleteStudent && (
                            <button
                              onClick={() => handleDelete(student.id)}
                              className="flex size-11 items-center justify-center rounded-xl border border-border bg-card text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20 sm:size-10"
                              title="Delete Student"
                              aria-label="Delete student"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {viewMode === 'table' && (
              <div className="hidden w-full md:block">
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

            {/* Pagination for card view (phones, and grid mode) */}
            {!isPending && studentsList.length > 0 && (
              <div
                className={`flex items-center justify-between gap-3 ${
                  viewMode === 'table' ? 'md:hidden' : ''
                }`}
              >
                <span className="tabular text-sm font-medium text-muted-foreground">
                  Page {pagination.pageIndex + 1} of {pageCount}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))
                    }
                    disabled={pagination.pageIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((p) => ({
                        ...p,
                        pageIndex: Math.min(pageCount - 1, p.pageIndex + 1),
                      }))
                    }
                    disabled={pagination.pageIndex >= pageCount - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
