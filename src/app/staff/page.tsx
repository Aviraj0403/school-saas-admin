'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
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

export default function StaffPage() {
  const [selectedUserForSalary, setSelectedUserForSalary] = useState<string>('');
  const [showSalaryStructureDialog, setShowSalaryStructureDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [uploadingStaffPhoto, setUploadingStaffPhoto] = useState(false);
  const queryClient = useQueryClient();
  const activeUser = useAuthStore((s) => s.activeUser);
  const canEditPhoto = canManageProfilePhotos(activeUser?.role, activeUser?.isSuperAdmin ?? false);

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
        toast.error(err?.message || 'Failed to add staff');
      },
    });
  };

  const handleDeleteStaff = (id: string) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast.success('Staff member deleted'),
        onError: (err: any) => toast.error(err?.message || 'Failed to delete staff'),
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
      </div>
    );
  };

  const staffList = data?.items || (data as any)?.data?.items || [];
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
      <div className="flex flex-col gap-6 lg:gap-8 pb-10 w-full">
        {/* Header Block */}
        <div className="flex flex-col items-start gap-4 pb-4">
          <Button
            onClick={() => setShowAddDialog(true)}
            className="w-full sm:w-auto font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm px-5 py-3"
          >
            <Plus className="w-4 h-4" />
            Add Staff Member
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            label="Total Registered"
            value={isPending ? '...' : totalRecords}
            icon={Users}
            gradientClass="from-blue-500 to-blue-500"
            iconBgClass="bg-blue-500/10 dark:bg-blue-500/20"
            iconColorClass="text-blue-600 dark:text-blue-400"
            footerText="Total faculty and staff"
          />
          <StatCard
            label="Teachers"
            value={
              isPending
                ? '...'
                : staffList.filter((s: any) => s.role === 'Teacher' || s.role === 'TEACHER').length
            }
            icon={Briefcase}
            gradientClass="from-emerald-500 to-teal-500"
            iconBgClass="bg-emerald-500/10 dark:bg-emerald-500/20"
            iconColorClass="text-emerald-600 dark:text-emerald-400"
            footerText="Active teaching staff"
          />
          <StatCard
            label="Administration"
            value={
              isPending
                ? '...'
                : staffList.filter((s: any) => s.role !== 'Teacher' && s.role !== 'TEACHER').length
            }
            icon={IdCard}
            gradientClass="from-amber-500 to-orange-500"
            iconBgClass="bg-amber-500/10 dark:bg-amber-500/20"
            iconColorClass="text-amber-600 dark:text-amber-400"
            footerText="Admin & support roles"
          />
          <StatCard
            label="Active Departments"
            value={
              isPending
                ? '...'
                : Math.max(1, new Set(staffList.map((s: any) => s.department).filter(Boolean)).size)
            }
            icon={Network}
            gradientClass="from-violet-500 to-purple-500"
            iconBgClass="bg-violet-500/10 dark:bg-violet-500/20"
            iconColorClass="text-violet-600 dark:text-violet-400"
            footerText="Configured departments"
          />
        </div>

        {/* Filter and Control Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
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
              className="w-full sm:w-52 text-sm"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 px-4 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
                viewMode === 'grid'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 px-4 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
                viewMode === 'table'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* Dynamic Display Section */}
        {isError ? (
          <div className="p-6 bg-red-50 text-red-600 rounded-md border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 flex items-center gap-4 shadow-sm">
            <AlertCircle className="w-6 h-6" />
            <div>
              <h3 className="font-bold">Failed to load</h3>
              <p className="text-sm opacity-80">{(error as any)?.message}</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {isPending ? (
              <div className="col-span-full py-12 flex flex-col items-center justify-center gap-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                <span className="text-sm font-medium text-zinc-500">Loading directory...</span>
              </div>
            ) : staffList.length === 0 ? (
              <div className="col-span-full py-12 text-center border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950">
                <p className="text-zinc-500 text-sm">No staff members found.</p>
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
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-all animate-fade-in group"
                  >
                    <div className="p-4 flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800">
                      {resolveMediaUrl(member.avatarUrl) ? (
                        <img
                          src={resolveMediaUrl(member.avatarUrl)!}
                          alt={member.name || 'Staff'}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-zinc-900 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold text-lg uppercase ring-2 ring-white dark:ring-zinc-900 group-hover:scale-105 transition-transform">
                          {initials}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <h3 className="font-semibold text-sm text-zinc-900 dark:text-white line-clamp-1">
                          {member.name}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {member.designation || 'Faculty Member'} ·{' '}
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">
                            {getDeptName(member.departmentId)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        {roleBodyTemplate(member)}
                      </div>

                      <div className="py-2 flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="w-4 h-4 text-zinc-400" />
                          <span>{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-zinc-400" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                        <button
                          onClick={() => {
                            setSelectedProfile(member);
                            setShowProfileDialog(true);
                          }}
                          className="flex-1 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 rounded-md transition-all flex justify-center items-center gap-2 mt-2"
                        >
                          <User className="w-3.5 h-3.5" />
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUserForSalary(member.id);
                            setShowSalaryStructureDialog(true);
                          }}
                          className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-md transition-all flex justify-center items-center gap-2 mt-2"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          Salary
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(member.id)}
                          className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-900/20 border border-zinc-200 dark:border-zinc-800 rounded-md transition-colors flex justify-center items-center mt-2"
                          title="Delete Staff"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Grid Pagination */}
            {!isPending && staffList.length > 0 && (
              <div className="col-span-full flex justify-between items-center pt-4">
                <span className="text-sm font-medium text-zinc-500">
                  Page {pagination.pageIndex + 1} of {pageCount}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setPagination((p: PaginationState) => ({
                        ...p,
                        pageIndex: Math.max(0, p.pageIndex - 1),
                      }))
                    }
                    disabled={pagination.pageIndex === 0}
                    className="px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors text-zinc-700 dark:text-zinc-300"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPagination((p: PaginationState) => ({
                        ...p,
                        pageIndex: Math.min(pageCount - 1, p.pageIndex + 1),
                      }))
                    }
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
              data={staffList}
              columns={columns}
              isLoading={isPending}
              pagination={pagination}
              setPagination={setPagination}
              pageCount={pageCount}
            />
          </div>
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
          <div className="grid grid-cols-2 gap-3">
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
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
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
            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
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
          <div className="flex flex-col gap-6 p-2">
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

            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                Subjects Taught
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedProfile.subjectsTaught && selectedProfile.subjectsTaught.length > 0 ? (
                  selectedProfile.subjectsTaught.map((sub: any) => (
                    <div
                      key={sub.id}
                      className="flex flex-col gap-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md p-2 min-w-[120px]"
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
    </DashboardLayout>
  );
}
