'use client';

import { asList } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/layout/PageHeader';
import { TanstackTable } from '@/components/TanstackTable';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  useStaffList,
  useCreateStaff,
  useDeleteStaff,
  useRoles,
  useDeactivateStaff,
  useUpdateStaff,
  useResetStaffPassword,
  useDepartments,
  useDesignations,
} from '@/hooks/queries/useStaff';
import { resolveMediaUrl, compressImageForProfile } from '@/lib/media';
import { canManageProfilePhotos } from '@/lib/permissions';
import { useAuthStore } from '@/store/useAuthStore';
import { staffService } from '@/services/staff.service';
import { useQueryClient } from '@tanstack/react-query';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { toast } from 'sonner';
import {
  Users,
  Briefcase,
  IdCard,
  Network,
  Search,
  Plus,
  LayoutGrid,
  List,
  AlertCircle,
  Mail,
  Phone,
  Pencil,
  Trash2,
  Camera,
  Loader2,
  DollarSign,
  User,
  X,
  Check,
} from 'lucide-react';

import { useSalaryStructure, useUpsertSalaryStructure } from '@/hooks/queries/usePayroll';
import { usePermission } from '@/hooks/usePermission';

const hasRole = (s: any, slug: string) =>
  Array.isArray(s?.roles) && s.roles.some((r: any) => (r?.role?.slug ?? '').toLowerCase() === slug);

import StaffEditDialog from './StaffEditDialog';
import { errorMessage } from '@/lib/errorMessage';

export default function StaffPage() {
  const [selectedUserForSalary, setSelectedUserForSalary] = useState<string>('');
  const [showSalaryStructureDialog, setShowSalaryStructureDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [uploadingStaffPhoto, setUploadingStaffPhoto] = useState(false);
  const queryClient = useQueryClient();
  const activeUser = useAuthStore((s) => s.activeUser);
  const { hasPermission, isSchoolAdmin, isSuperAdmin } = usePermission();
  const canEditPhoto = canManageProfilePhotos(
    activeUser?.role,
    activeUser?.isSuperAdmin ?? false,
    hasPermission
  );
  const canWriteStaff =
    isSuperAdmin ||
    isSchoolAdmin ||
    hasPermission('staff', 'write') ||
    hasPermission('staff_directory', 'write');
  const canDeleteStaff =
    isSuperAdmin ||
    isSchoolAdmin ||
    hasPermission('staff', 'delete') ||
    hasPermission('staff_directory', 'delete');

  const handleStaffPhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    staffId: string
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingStaffPhoto(true);
    try {
      const blob = await compressImageForProfile(file);
      if (!blob) throw new Error('Image could not be compressed under 100 KB');
      const updated = await staffService.uploadPhoto(staffId, blob);
      setSelectedProfile((p: any) =>
        p && p.id === staffId ? { ...p, avatarUrl: (updated as any)?.avatarUrl ?? p.avatarUrl } : p
      );
      await queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Profile photo updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Photo upload failed');
    } finally {
      setUploadingStaffPhoto(false);
    }
  };

  // Salary structure form fields
  const [salaryForm, setSalaryForm] = useState({
    baseSalary: 25000,
    hra: 5000,
    allowance: 3000,
    deductions: 1000,
  });

  // Queries / Mutations
  const { data: activeStructure, isPending: loadingStructure } =
    useSalaryStructure(selectedUserForSalary);
  const upsertStructureMutation = useUpsertSalaryStructure();

  useEffect(() => {
    if (activeStructure) {
      setSalaryForm({
        baseSalary: activeStructure.baseSalary || 0,
        hra: activeStructure.hra || 0,
        allowance: activeStructure.allowance || 0,
        deductions: activeStructure.deductions || 0,
      });
    }
  }, [activeStructure]);

  const handleSaveSalaryStructure = () => {
    if (!selectedUserForSalary) return;
    upsertStructureMutation.mutate(
      { userId: selectedUserForSalary, data: salaryForm },
      {
        onSuccess: () => {
          setShowSalaryStructureDialog(false);
          toast.success('Salary structure updated successfully');
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Failed to save salary structure');
        },
      }
    );
  };

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState('');

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    roleId: '',
    departmentId: '',
    designation: '',
  });

  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: rolesData } = useRoles();
  const { data: deptsData } = useDepartments();
  const { data: designationsData } = useDesignations();

  const roleOptions = (rolesData || []).map((r: any) => ({ label: r.name, value: r.id }));
  const deptOptions = (deptsData || []).map((d: any) => ({ label: d.name, value: d.id }));
  const designationOptions = (designationsData || []).map((d: any) => ({
    label: `${d.name}${d._count?.users != null ? ` (${d._count.users})` : ''}`,
    value: d.id,
  }));
  const designationNameOptions = (designationsData || []).map((d: any) => ({
    label: d.name,
    value: d.name,
  }));

  const getDeptName = (deptId: string) => {
    const dept = (deptsData || []).find((d: any) => d.id === deptId);
    return dept?.name || 'General';
  };

  const { data, isPending, isError, error } = useStaffList(
    pagination.pageIndex + 1,
    pagination.pageSize,
    search || undefined,
    categoryFilter || undefined
  );
  const createMutation = useCreateStaff();
  const deactivateMutation = useDeactivateStaff();
  const reactivateMutation = useUpdateStaff();
  const resetPwMutation = useResetStaffPassword();
  const [editStaff, setEditStaff] = useState<any>(null);
  const deleteMutation = useDeleteStaff();

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.email) {
      toast.error('Name and Email are required');
      return;
    }
    const payload = {
      name: newStaff.name,
      email: newStaff.email,
      phone: newStaff.phone || undefined,
      designation: newStaff.designation || undefined,
      departmentId: newStaff.departmentId || undefined,
      roleIds: newStaff.roleId ? [newStaff.roleId] : undefined,
    };
    createMutation.mutate(payload, {
      onSuccess: () => {
        setShowAddDialog(false);
        setNewStaff({
          name: '',
          email: '',
          phone: '',
          roleId: '',
          departmentId: '',
          designation: '',
        });
        toast.success('Staff member created successfully');
      },
      onError: (err: any) => {
        toast.error(errorMessage(err, 'Failed to add staff'));
      },
    });
  };

  const handleDeleteStaff = (id: string) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast.success('Staff member deleted'),
        onError: (err: any) => toast.error(errorMessage(err, 'Failed to delete staff')),
      });
    }
  };

  const roleBodyTemplate = (rowData: any) => {
    let variant: 'primary' | 'danger' | 'success' | 'warning' | 'info' = 'info';

    const roleObj = rowData.roles?.[0]?.role;
    const roleName = roleObj?.name || rowData.role || 'Teacher';
    const roleSlug = roleObj?.slug || '';

    if (roleSlug === 'school_admin' || roleName === 'School Admin' || roleName === 'SuperAdmin') {
      variant = 'danger';
    } else if (roleSlug === 'teacher' || roleName === 'Teacher') {
      variant = 'success';
    } else if (roleSlug === 'accountant' || roleName === 'Accountant') {
      variant = 'warning';
    }

    return <Badge variant={variant}>{roleName}</Badge>;
  };

  const actionsBodyTemplate = (rowData: any) => {
    return (
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => {
            setSelectedProfile(rowData);
            setShowProfileDialog(true);
          }}
          className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-md transition-all active:scale-95"
          title="View Profile"
        >
          <User className="w-4 h-4" />
        </button>
        {canDeleteStaff && (
          <button
            onClick={() => handleDeleteStaff(rowData.id)}
            disabled={deleteMutation.isPending}
            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 rounded-md transition-all active:scale-95 disabled:opacity-50"
            title="Delete Staff"
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
  };

  const staffList = asList(data);
  const totalRecords = data?.meta?.total || (data as any)?.data?.meta?.total || 0;
  const pageCount =
    data?.meta?.totalPages ||
    (data as any)?.data?.meta?.totalPages ||
    Math.ceil(totalRecords / pagination.pageSize) ||
    0;

  const getStaffName = (userId: string) => {
    const staff = staffList.find((s: any) => s.id === userId || s.userId === userId);
    return staff?.name || 'Faculty Member';
  };

  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: (info: any) => (
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: (info: any) => roleBodyTemplate(info.row.original),
      },
      {
        id: 'department',
        header: 'Department',
        cell: (info: any) => getDeptName(info.row.original.departmentId),
      },
      {
        accessorKey: 'designation',
        header: 'Designation',
      },
      {
        id: 'salary',
        header: 'Salary Structure',
        cell: (info: any) => (
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-md transition-all"
            onClick={() => {
              setSelectedUserForSalary(info.row.original.id);
              setShowSalaryStructureDialog(true);
            }}
          >
            <Pencil className="w-3.5 h-3.5" /> Configure
          </button>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-center">Actions</div>,
        cell: (info: any) => actionsBodyTemplate(info.row.original),
      },
    ],
    [deptsData, deleteMutation.isPending]
  );

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Staff" />
      <div className="flex w-full min-w-0 flex-col gap-4 pb-4 sm:gap-6">
        {/* Header Block */}
        <PageHeader
          title="Staff"
          description="Teachers, office staff and their roles, salaries and profiles."
          actions={
            canWriteStaff ? (
              <Button className="w-full sm:w-auto" onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4" />
                Add staff member
              </Button>
            ) : undefined
          }
        />

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Registered"
            value={isPending ? '...' : totalRecords}
            icon={Users}
            gradientClass="from-blue-500 to-blue-500"
            footerText="Total faculty and staff"
          />
          <StatCard
            label="Teachers"
            value={isPending ? '...' : staffList.filter((s: any) => hasRole(s, 'teacher')).length}
            icon={Briefcase}
            gradientClass="from-emerald-500 to-teal-500"
            footerText="Active teaching staff"
          />
          <StatCard
            label="Administration"
            value={isPending ? '...' : staffList.filter((s: any) => !hasRole(s, 'teacher')).length}
            icon={IdCard}
            gradientClass="from-amber-500 to-orange-500"
            footerText="Admin & support roles"
          />
          <StatCard
            label="Active Departments"
            value={
              isPending
                ? '...'
                : Math.max(
                    1,
                    new Set(staffList.map((s: any) => s.departmentId).filter(Boolean)).size
                  )
            }
            icon={Network}
            gradientClass="from-violet-500 to-purple-500"
            footerText="Configured departments"
          />
        </div>

        {/* Filter and Control Bar */}
        <div className="surface-card flex flex-col gap-3 p-3 sm:p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((p: PaginationState) => ({ ...p, pageIndex: 0 }));
                }}
                placeholder="Search staff by name or email..."
                className="w-full pl-10"
              />
            </div>
            <Select
              value={categoryFilter}
              options={[{ label: 'All Categories', value: '' }, ...designationOptions]}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPagination((p: PaginationState) => ({ ...p, pageIndex: 0 }));
              }}
              placeholder="Category"
              className="w-full sm:w-52"
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

        {/* Dynamic Display Section */}
        {isError ? (
          <div className="flex items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
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
                    <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
                  ))}
                </>
              ) : staffList.length === 0 ? (
                <div className="surface-card col-span-full flex flex-col items-center gap-3 p-8 text-center">
                  <p className="text-sm text-muted-foreground">No staff members found.</p>
                  {canWriteStaff && (
                    <Button size="sm" onClick={() => setShowAddDialog(true)}>
                      <Plus className="size-4" /> Add staff member
                    </Button>
                  )}
                </div>
              ) : (
                staffList.map((member: any) => {
                  const initials = member.name
                    ? member.name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()
                    : 'ST';
                  return (
                    <div
                      key={member.id}
                      className="surface-card animate-fade-in group flex min-w-0 flex-col"
                    >
                      <div className="flex items-center gap-3 border-b border-border p-4">
                        {resolveMediaUrl(member.avatarUrl) ? (
                          <img
                            src={resolveMediaUrl(member.avatarUrl)!}
                            alt={member.name || 'Staff'}
                            className="size-12 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="tone-indigo tone-chip flex size-12 shrink-0 items-center justify-center rounded-full text-base font-semibold uppercase">
                            {initials}
                          </div>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col">
                          <h3 className="truncate text-sm font-semibold text-foreground">
                            {member.name}
                          </h3>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {member.designation || 'Faculty Member'} ·{' '}
                            <span className="font-medium text-foreground/80">
                              {getDeptName(member.departmentId)}
                            </span>
                          </p>
                        </div>
                        <div className="shrink-0">{roleBodyTemplate(member)}</div>
                      </div>

                      <div className="flex flex-col gap-3 p-4">
                        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                          <div className="flex min-w-0 items-center gap-2">
                            <Mail className="size-4 shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </div>
                          {member.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="size-4 shrink-0" />
                              <span className="tabular">{member.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 border-t border-border pt-3">
                          <button
                            onClick={() => {
                              setSelectedProfile(member);
                              setShowProfileDialog(true);
                            }}
                            className="tone-indigo tone-chip flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] sm:h-10"
                          >
                            <User className="size-3.5" />
                            Profile
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUserForSalary(member.id);
                              setShowSalaryStructureDialog(true);
                            }}
                            className="tone-sky tone-chip flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] sm:h-10"
                          >
                            <DollarSign className="size-3.5" />
                            Salary
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(member.id)}
                            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20 sm:size-10"
                            title="Delete Staff"
                            aria-label="Delete staff member"
                          >
                            <Trash2 className="size-4" />
                          </button>
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
                  data={staffList}
                  columns={columns}
                  isLoading={isPending}
                  pagination={pagination}
                  setPagination={setPagination}
                  pageCount={pageCount}
                />
              </div>
            )}

            {/* Pagination for card view (phones, and grid mode) */}
            {!isPending && staffList.length > 0 && (
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
                      setPagination((p: PaginationState) => ({
                        ...p,
                        pageIndex: Math.max(0, p.pageIndex - 1),
                      }))
                    }
                    disabled={pagination.pageIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((p: PaginationState) => ({
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

      {/* Dialog: Register Staff */}
      <Dialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        title="Register New Staff Member"
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">
              Full Name *
            </label>
            <Input
              value={newStaff.name}
              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
              placeholder="e.g., Jane Smith"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">
              Email Address *
            </label>
            <Input
              value={newStaff.email}
              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
              placeholder="e.g., janesmith@school.com"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">
              Phone Number
            </label>
            <Input
              value={newStaff.phone}
              onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
              placeholder="e.g., +91 98765 43210"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">
              System Role
            </label>
            <Select
              value={newStaff.roleId}
              options={roleOptions}
              onChange={(e) => setNewStaff({ ...newStaff, roleId: e.target.value })}
              placeholder="Select a Role"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">
                Department
              </label>
              <Select
                value={newStaff.departmentId}
                options={deptOptions}
                onChange={(e) => setNewStaff({ ...newStaff, departmentId: e.target.value })}
                placeholder="Select Dept"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">
                Category / Designation
              </label>
              <Input
                value={newStaff.designation}
                onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })}
                placeholder="Designation title"
              />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStaff} isLoading={createMutation.isPending}>
              Register
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Dialog: Salary Structure Configuration */}
      <Dialog
        isOpen={showSalaryStructureDialog}
        onClose={() => setShowSalaryStructureDialog(false)}
        title={`Salary Structure Config - ${getStaffName(selectedUserForSalary)}`}
      >
        {loadingStructure ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-semibold text-zinc-400">
              Fetching structure configuration...
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">
                Base Salary (₹/month) *
              </label>
              <Input
                type="number"
                value={salaryForm.baseSalary}
                onChange={(e) =>
                  setSalaryForm({ ...salaryForm, baseSalary: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">
                HRA Allowance (₹/month)
              </label>
              <Input
                type="number"
                value={salaryForm.hra}
                onChange={(e) => setSalaryForm({ ...salaryForm, hra: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">
                Other Allowances (₹/month)
              </label>
              <Input
                type="number"
                value={salaryForm.allowance}
                onChange={(e) =>
                  setSalaryForm({ ...salaryForm, allowance: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">
                Deductions / PF (₹/month)
              </label>
              <Input
                type="number"
                value={salaryForm.deductions}
                onChange={(e) =>
                  setSalaryForm({ ...salaryForm, deductions: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setShowSalaryStructureDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveSalaryStructure}
                isLoading={upsertStructureMutation.isPending}
              >
                Save Structure
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Dialog: Staff Profile */}
      <Dialog
        isOpen={showProfileDialog}
        onClose={() => setShowProfileDialog(false)}
        title={selectedProfile ? `${selectedProfile.name}'s Profile` : 'Staff Profile'}
      >
        {selectedProfile && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <label
                className={`relative ${canEditPhoto ? 'cursor-pointer' : ''}`}
                title={canEditPhoto ? 'Change profile photo' : selectedProfile.name}
              >
                {resolveMediaUrl(selectedProfile.avatarUrl) ? (
                  <img
                    src={resolveMediaUrl(selectedProfile.avatarUrl)!}
                    alt={selectedProfile.name}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-800"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 font-bold text-2xl uppercase ring-2 ring-zinc-200 dark:ring-zinc-800">
                    {selectedProfile.name
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                )}
                {canEditPhoto && (
                  <>
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] shadow">
                      {uploadingStaffPhoto ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Camera className="w-3 h-3" />
                      )}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingStaffPhoto}
                      onChange={(e) => handleStaffPhotoChange(e, selectedProfile.id)}
                    />
                  </>
                )}
              </label>
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {selectedProfile.name}
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                  {selectedProfile.designation || 'Faculty'} ·{' '}
                  {getDeptName(selectedProfile.departmentId)}
                </p>
                <div className="mt-1">{roleBodyTemplate(selectedProfile)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                  Contact Details
                </h3>
                <div className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-zinc-400" /> {selectedProfile.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-zinc-400" /> {selectedProfile.phone || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2">
                    <IdCard className="w-4 h-4 text-zinc-400" />{' '}
                    {selectedProfile.employeeId || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                  Class Teacher Assigned
                </h3>
                <div className="flex flex-col gap-2">
                  {selectedProfile.classTeacherOf && selectedProfile.classTeacherOf.length > 0 ? (
                    selectedProfile.classTeacherOf.map((cls: any) => (
                      <div
                        key={cls.id}
                        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        Class {cls.name} - Section {cls.section}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-zinc-500 italic">Not a class teacher.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 border-t border-border pt-4 min-[420px]:flex min-[420px]:flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setEditStaff(selectedProfile)}>
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                isLoading={resetPwMutation.isPending}
                onClick={() => {
                  if (
                    !confirm(
                      `Reset password for ${selectedProfile.name} to the default temporary password?`
                    )
                  )
                    return;
                  resetPwMutation.mutate(selectedProfile.id, {
                    onSuccess: (r: any) => toast.success(r?.message || 'Password reset.'),
                    onError: (err) => toast.error(errorMessage(err, 'Could not reset password')),
                  });
                }}
              >
                Reset password
              </Button>
              {selectedProfile.isActive !== false ? (
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={deactivateMutation.isPending}
                  onClick={() => {
                    if (
                      !confirm(
                        `Deactivate ${selectedProfile.name}? They will no longer be able to sign in.`
                      )
                    )
                      return;
                    deactivateMutation.mutate(selectedProfile.id, {
                      onSuccess: () => {
                        toast.success('Staff member deactivated.');
                        setSelectedProfile({ ...selectedProfile, isActive: false });
                      },
                      onError: (err) => toast.error(errorMessage(err, 'Could not deactivate')),
                    });
                  }}
                >
                  Deactivate
                </Button>
              ) : (
                <Button
                  size="sm"
                  isLoading={reactivateMutation.isPending}
                  onClick={() =>
                    reactivateMutation.mutate(
                      { id: selectedProfile.id, data: { isActive: true } },
                      {
                        onSuccess: () => {
                          toast.success('Staff member reactivated.');
                          setSelectedProfile({ ...selectedProfile, isActive: true });
                        },
                        onError: (err) => toast.error(errorMessage(err, 'Could not reactivate')),
                      }
                    )
                  }
                >
                  Reactivate
                </Button>
              )}
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                Subjects Taught
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedProfile.subjectsTaught && selectedProfile.subjectsTaught.length > 0 ? (
                  selectedProfile.subjectsTaught.map((sub: any) => (
                    <div
                      key={sub.id}
                      className="flex min-w-[120px] flex-col gap-1 rounded-lg border border-border bg-card p-2"
                    >
                      <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
                        {sub.name}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">{sub.code}</span>
                      {sub.classes && sub.classes.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {sub.classes.map((c: any, i: number) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded"
                            >
                              {c.name}-{c.section}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-zinc-500 italic w-full">
                    No subjects assigned yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Dialog>
      <StaffEditDialog
        staff={editStaff}
        isOpen={!!editStaff}
        onClose={() => setEditStaff(null)}
        onSaved={(u) => setSelectedProfile((p: any) => (p && u ? { ...p, ...u } : p))}
      />
    </DashboardLayout>
  );
}
