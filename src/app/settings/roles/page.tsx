'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  rbacService,
  RbacRole,
  SystemModule,
  Submodule,
  ModulePermission,
  SystemUser,
} from '@/services/rbac.service';
import { useAuthStore } from '@/store/useAuthStore';
import {
  ShieldCheck,
  Plus,
  Loader2,
  Trash2,
  Users,
  Eye,
  PencilLine,
  RefreshCw,
  Blocks,
  ChevronRight,
  Sparkles,
  Sliders,
  Layers,
  Check,
  AlertTriangle,
  Building,
  GraduationCap,
  CreditCard,
  BookOpen,
  Bus,
  CheckSquare,
  Building2,
  Megaphone,
} from 'lucide-react';

type TabType = 'matrix' | 'roles' | 'modules' | 'users';

interface PermToggleProps {
  checked: boolean;
  disabled?: boolean;
  label: string;
  icon: React.ReactNode;
  activeColor: string;
  loading?: boolean;
  onClick: () => void;
}

function PermToggle({
  checked,
  disabled,
  label,
  icon,
  activeColor,
  loading,
  onClick,
}: PermToggleProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none border ${
        checked
          ? activeColor
          : 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/60 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : icon}
      <span>{label}</span>
      {checked && <Check className="w-3 h-3 ml-0.5" />}
    </button>
  );
}

export default function RolesPermissionsPage() {
  const queryClient = useQueryClient();
  const activeUser = useAuthStore((s) => s.activeUser);
  const isSuperAdmin = Boolean(activeUser?.isSuperAdmin || activeUser?.role === 'SuperAdmin');

  const [activeTab, setActiveTab] = useState<TabType>('matrix');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [pendingToggle, setPendingToggle] = useState<string | null>(null);

  // Modals
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#4f46e5',
  });

  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleForm, setModuleForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'Blocks',
  });

  const [showSubmoduleModal, setShowSubmoduleModal] = useState(false);
  const [targetParentModuleId, setTargetParentModuleId] = useState('');
  const [submoduleForm, setSubmoduleForm] = useState({ name: '', slug: '', description: '' });

  // ── Queries ──────────────────────────────────────────────────
  const { data: roles = [], isPending: loadingRoles } = useQuery<RbacRole[]>({
    queryKey: ['rbac-roles'],
    queryFn: rbacService.getRoles,
  });

  // Select first role automatically if none selected
  React.useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      const defaultRole = roles.find((r) => r.slug === 'teacher') || roles[0];
      setSelectedRoleId(defaultRole.id);
    }
  }, [roles, selectedRoleId]);

  const { data: modules = [], isPending: loadingModules } = useQuery<SystemModule[]>({
    queryKey: ['rbac-modules'],
    queryFn: () => rbacService.getModules(true),
  });

  const { data: rolePermissions = [], isPending: loadingPermissions } = useQuery<
    ModulePermission[]
  >({
    queryKey: ['rbac-role-permissions', selectedRoleId],
    queryFn: () =>
      selectedRoleId ? rbacService.getRolePermissions(selectedRoleId) : Promise.resolve([]),
    enabled: Boolean(selectedRoleId),
  });

  const { data: systemUsers = [], isPending: loadingUsers } = useQuery<SystemUser[]>({
    queryKey: ['rbac-users'],
    queryFn: rbacService.getAllUsers,
    enabled: activeTab === 'users',
  });

  // ── Mutations ────────────────────────────────────────────────
  const invalidateMatrix = () => {
    queryClient.invalidateQueries({ queryKey: ['rbac-role-permissions', selectedRoleId] });
    queryClient.invalidateQueries({ queryKey: ['rbac-roles'] });
  };

  const togglePermissionMutation = useMutation({
    mutationFn: rbacService.updatePermission,
    onSuccess: () => {
      invalidateMatrix();
      setPendingToggle(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update permission');
      setPendingToggle(null);
    },
  });

  const revokeModuleMutation = useMutation({
    mutationFn: ({ roleId, moduleId }: { roleId: string; moduleId: string }) =>
      rbacService.revokeModuleFromRole(roleId, moduleId),
    onSuccess: (res: any) => {
      invalidateMatrix();
      toast.success(res?.message || 'Module access revoked for this role');
    },
    onError: () => toast.error('Failed to revoke module access'),
  });

  const createRoleMutation = useMutation({
    mutationFn: () => rbacService.createRole(roleForm),
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: ['rbac-roles'] });
      setShowRoleModal(false);
      setRoleForm({ name: '', slug: '', description: '', color: '#4f46e5' });
      if (newRole?.id) setSelectedRoleId(newRole.id);
      toast.success('New role created.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create role'),
  });

  const toggleRoleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      rbacService.updateRole(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac-roles'] });
      toast.success('Role status updated.');
    },
    onError: () => toast.error('Could not update role status'),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => rbacService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac-roles'] });
      toast.success('Role deleted.');
    },
    onError: () => toast.error('Could not delete role.'),
  });

  const createModuleMutation = useMutation({
    mutationFn: () => rbacService.createModule(moduleForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac-modules'] });
      setShowModuleModal(false);
      setModuleForm({ name: '', slug: '', description: '', icon: 'Blocks' });
      toast.success('System module created.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create module'),
  });

  const toggleModuleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      rbacService.updateModule(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac-modules'] });
      toast.success('Module status updated.');
    },
    onError: () => toast.error('Failed to update module'),
  });

  const createSubmoduleMutation = useMutation({
    mutationFn: () =>
      rbacService.createSubmodule({
        moduleId: targetParentModuleId,
        name: submoduleForm.name,
        slug: submoduleForm.slug,
        description: submoduleForm.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac-modules'] });
      setShowSubmoduleModal(false);
      setSubmoduleForm({ name: '', slug: '', description: '' });
      toast.success('Submodule created.');
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || 'Failed to create submodule'),
  });

  const toggleSubmoduleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      rbacService.updateSubmodule(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac-modules'] });
      toast.success('Submodule status updated.');
    },
    onError: () => toast.error('Failed to update submodule'),
  });

  const deleteSubmoduleMutation = useMutation({
    mutationFn: (id: string) => rbacService.deleteSubmodule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac-modules'] });
      toast.success('Submodule deleted.');
    },
    onError: () => toast.error('Failed to delete submodule'),
  });

  const updateUserRolesMutation = useMutation({
    mutationFn: ({ userId, roleIds }: { userId: string; roleIds: string[] }) =>
      rbacService.updateUserRoles(userId, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac-users'] });
      toast.success('User roles updated.');
    },
    onError: () => toast.error('Failed to update user roles'),
  });

  // ── Helper getters ───────────────────────────────────────────
  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const isSuperadminRole =
    selectedRole?.slug === 'superadmin' || selectedRole?.slug === 'school_admin';

  const getSubmodulePerm = (submoduleId: string) => {
    const p = rolePermissions.find((perm) => perm.submoduleId === submoduleId);
    return {
      canRead: p?.canRead ?? false,
      canWrite: p?.canWrite ?? false,
      canUpdate: p?.canUpdate ?? false,
      canDelete: p?.canDelete ?? false,
    };
  };

  const handleToggle = (
    submoduleId: string,
    action: 'canRead' | 'canWrite' | 'canUpdate' | 'canDelete',
    currentVal: boolean
  ) => {
    if (!selectedRoleId || isSuperadminRole) return;
    const key = `${submoduleId}-${action}`;
    setPendingToggle(key);

    const existing = getSubmodulePerm(submoduleId);
    const payload = {
      roleId: selectedRoleId,
      submoduleId,
      canRead: existing.canRead,
      canWrite: existing.canWrite,
      canUpdate: existing.canUpdate,
      canDelete: existing.canDelete,
      [action]: !currentVal,
    };
    togglePermissionMutation.mutate(payload);
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Roles & Permissions" subtitle="Settings" />

      <div className="flex flex-col gap-6 pb-12 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-brand" />
              <span>Permission Matrix &amp; Role Management</span>
            </h1>
            <p className="text-xs text-zinc-500 max-w-2xl mt-1">
              Configure granular module-based access (Read, Write, Update, Delete) per role,
              register custom system roles, and assign permissions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setShowRoleModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Role
            </Button>
            {isSuperAdmin && (
              <Button variant="outline" onClick={() => setShowModuleModal(true)}>
                <Blocks className="w-4 h-4 mr-1.5 text-brand" /> Add System Module
              </Button>
            )}
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex bg-white dark:bg-zinc-900/60 p-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl w-max overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Permissions Matrix
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Roles Master ({roles.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('modules')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'modules'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Blocks className="w-3.5 h-3.5" /> System Modules ({modules.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> User Role Assignment
          </button>
        </div>

        {/* ── TAB 1: PERMISSIONS MATRIX (KCA Pattern) ──────────────── */}
        {activeTab === 'matrix' && (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
            {/* Left: Role Selector */}
            <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Select Role
                </span>
                <span className="text-[11px] font-semibold text-zinc-400">
                  {roles.length} Roles
                </span>
              </div>

              {loadingRoles ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-brand animate-spin" />
                </div>
              ) : (
                <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 no-scrollbar">
                  {roles.map((r) => {
                    const isSelected = r.id === selectedRoleId;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRoleId(r.id)}
                        className={`text-left flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                            : 'bg-zinc-50/50 dark:bg-zinc-900/30 border-transparent hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                            isSelected
                              ? 'bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900'
                              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold truncate">{r.name}</span>
                            {r.isSystem && (
                              <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-zinc-200/60 dark:bg-zinc-800 text-zinc-500">
                                Sys
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono opacity-70 truncate">{r.slug}</div>
                        </div>
                        {isSelected && (
                          <ChevronRight className="w-4 h-4 shrink-0 hidden lg:block" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Permission Accordion per Module & Submodule */}
            <div className="flex flex-col gap-4">
              {/* Role Header Banner */}
              <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-black text-sm">
                    {selectedRole?.name?.charAt(0) || 'R'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {selectedRole?.name}
                      </h2>
                      <Badge variant={selectedRole?.isSystem ? 'secondary' : 'info'}>
                        {selectedRole?.isSystem ? 'System Role' : 'Custom Role'}
                      </Badge>
                      {selectedRole?.isActive === false && <Badge variant="danger">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                      Slug: <span className="font-bold">{selectedRole?.slug}</span> &bull;{' '}
                      {selectedRole?.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                {isSuperadminRole ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    <Sparkles className="w-4 h-4" /> Global Admin Access (All Permitted)
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toggleRoleActiveMutation.mutate({
                          id: selectedRole!.id,
                          isActive: selectedRole?.isActive !== false ? false : true,
                        })
                      }
                    >
                      {selectedRole?.isActive !== false ? 'Deactivate Role' : 'Activate Role'}
                    </Button>
                    {!selectedRole?.isSystem && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50"
                        onClick={() => {
                          if (confirm(`Delete role "${selectedRole?.name}"?`)) {
                            deleteRoleMutation.mutate(selectedRole!.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Modules Matrix */}
              {loadingModules || loadingPermissions ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80">
                  <Loader2 className="w-8 h-8 text-brand animate-spin" />
                  <span className="text-xs text-zinc-400">Loading module permissions...</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {modules
                    .filter((m) => m.isActive)
                    .map((mod) => {
                      const modSubmodules = mod.submodules?.filter((s) => s.isActive) || [];

                      return (
                        <div
                          key={mod.id}
                          className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm"
                        >
                          {/* Module Header */}
                          <div className="px-5 py-3.5 bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                {mod.name}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                {mod.slug}
                              </span>
                              <span className="text-xs text-zinc-400 hidden sm:inline">
                                ({modSubmodules.length} submodules)
                              </span>
                            </div>

                            {!isSuperadminRole && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Revoke all permissions for module "${mod.name}" from role "${selectedRole?.name}"?`
                                    )
                                  ) {
                                    revokeModuleMutation.mutate({
                                      roleId: selectedRoleId,
                                      moduleId: mod.id,
                                    });
                                  }
                                }}
                                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" /> Revoke Module
                              </button>
                            )}
                          </div>

                          {/* Submodules Rows */}
                          <div className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                            {modSubmodules.length === 0 ? (
                              <div className="p-4 text-xs text-zinc-400 italic">
                                No active submodules under this module.
                              </div>
                            ) : (
                              modSubmodules.map((sub) => {
                                const perms = getSubmodulePerm(sub.id);
                                const isPermLoading = (action: string) =>
                                  pendingToggle === `${sub.id}-${action}`;

                                return (
                                  <div
                                    key={sub.id}
                                    className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors"
                                  >
                                    <div className="min-w-0">
                                      <div className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                                        {sub.name}
                                      </div>
                                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                        {sub.slug} &bull; {sub.description || 'Access submodule'}
                                      </div>
                                    </div>

                                    {/* Action Toggle Pills */}
                                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                                      <PermToggle
                                        checked={isSuperadminRole || perms.canRead}
                                        disabled={isSuperadminRole}
                                        label="Read"
                                        loading={isPermLoading('canRead')}
                                        icon={<Eye className="w-3 h-3" />}
                                        activeColor="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                        onClick={() =>
                                          handleToggle(sub.id, 'canRead', perms.canRead)
                                        }
                                      />
                                      <PermToggle
                                        checked={isSuperadminRole || perms.canWrite}
                                        disabled={isSuperadminRole}
                                        label="Write"
                                        loading={isPermLoading('canWrite')}
                                        icon={<PencilLine className="w-3 h-3" />}
                                        activeColor="bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                                        onClick={() =>
                                          handleToggle(sub.id, 'canWrite', perms.canWrite)
                                        }
                                      />
                                      <PermToggle
                                        checked={isSuperadminRole || perms.canUpdate}
                                        disabled={isSuperadminRole}
                                        label="Update"
                                        loading={isPermLoading('canUpdate')}
                                        icon={<RefreshCw className="w-3 h-3" />}
                                        activeColor="bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                                        onClick={() =>
                                          handleToggle(sub.id, 'canUpdate', perms.canUpdate)
                                        }
                                      />
                                      <PermToggle
                                        checked={isSuperadminRole || perms.canDelete}
                                        disabled={isSuperadminRole}
                                        label="Delete"
                                        loading={isPermLoading('canDelete')}
                                        icon={<Trash2 className="w-3 h-3" />}
                                        activeColor="bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                                        onClick={() =>
                                          handleToggle(sub.id, 'canDelete', perms.canDelete)
                                        }
                                      />
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: ROLES MASTER ─────────────────────────────────── */}
        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((r) => (
              <div
                key={r.id}
                className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-sm">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {r.name}
                          </h3>
                          {r.isActive === false && (
                            <Badge variant="danger" className="text-[10px]">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400">{r.slug}</div>
                      </div>
                    </div>

                    <Badge variant={r.isSystem ? 'secondary' : 'info'}>
                      {r.isSystem ? 'System' : 'Custom'}
                    </Badge>
                  </div>

                  <p className="text-xs text-zinc-500 mt-3 line-clamp-2">
                    {r.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRoleId(r.id);
                      setActiveTab('matrix');
                    }}
                    className="text-xs font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" /> Configure Matrix
                  </button>

                  {!r.isSystem && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete role "${r.name}"?`)) {
                          deleteRoleMutation.mutate(r.id);
                        }
                      }}
                      className="text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB 3: SYSTEM MODULES & SUBMODULES ─────────────────── */}
        {activeTab === 'modules' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-zinc-500">
                System modules define the top-level sections of School SaaS. Add custom submodules
                or toggle module availability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules.map((m) => (
                <div
                  key={m.id}
                  className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {m.name}
                          </h3>
                          {m.isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="danger">Inactive</Badge>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400 mt-0.5">{m.slug}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSuperAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTargetParentModuleId(m.id);
                              setShowSubmoduleModal(true);
                            }}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Submodule
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            toggleModuleActiveMutation.mutate({
                              id: m.id,
                              isActive: !m.isActive,
                            })
                          }
                        >
                          {m.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-500 mt-2 mb-3">
                      {m.description || 'System module.'}
                    </p>

                    {/* Submodules List */}
                    <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        Submodules ({m.submodules?.length || 0})
                      </span>
                      {m.submodules?.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40"
                        >
                          <div>
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                              {sub.name}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400 ml-2">
                              {sub.slug}
                            </span>
                          </div>

                          {isSuperAdmin && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleSubmoduleActiveMutation.mutate({
                                    id: sub.id,
                                    isActive: !sub.isActive,
                                  })
                                }
                                className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                              >
                                {sub.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Delete submodule "${sub.name}"?`)) {
                                    deleteSubmoduleMutation.mutate(sub.id);
                                  }
                                }}
                                className="text-rose-500 hover:text-rose-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: USER ROLE ASSIGNMENT ─────────────────────────── */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Staff &amp; User Account Role Mappings
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Assign one or more roles to any user account to grant their matrix permissions.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                  <tr>
                    <th className="px-4 py-3.5">User</th>
                    <th className="px-4 py-3.5">Email / Phone</th>
                    <th className="px-4 py-3.5">Assigned Roles</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-zinc-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand mb-2" />
                        Loading user accounts...
                      </td>
                    </tr>
                  ) : systemUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-zinc-400">
                        No users found in this school.
                      </td>
                    </tr>
                  ) : (
                    systemUsers.map((u) => {
                      const userRoleIds = u.roles?.map((ur) => ur.role.id) || [];

                      return (
                        <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="px-4 py-3">
                            <div className="font-bold text-zinc-900 dark:text-zinc-100">
                              {u.name}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono">{u.id}</div>
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                            <div>{u.email}</div>
                            {u.phone && <div className="text-[10px]">{u.phone}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {u.roles?.map((ur) => (
                                <Badge key={ur.role.id} variant="info">
                                  {ur.role.name}
                                </Badge>
                              ))}
                              {(!u.roles || u.roles.length === 0) && (
                                <span className="text-zinc-400 italic">No role assigned</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={u.isActive ? 'success' : 'danger'}>
                              {u.isActive ? 'Active' : 'Disabled'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <select
                              className="text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1"
                              value={userRoleIds[0] || ''}
                              onChange={(e) => {
                                const newRoleId = e.target.value;
                                if (newRoleId) {
                                  updateUserRolesMutation.mutate({
                                    userId: u.id,
                                    roleIds: [newRoleId],
                                  });
                                }
                              }}
                            >
                              <option value="" disabled>
                                Select primary role
                              </option>
                              {roles.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── CREATE ROLE MODAL ─────────────────────────────────────── */}
      <Dialog
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Create New Role"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Role Name *
            </label>
            <Input
              value={roleForm.name}
              onChange={(e) =>
                setRoleForm({
                  ...roleForm,
                  name: e.target.value,
                  slug: roleForm.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                })
              }
              placeholder="e.g. Hostel Warden, Sports Coach"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Role Slug *
            </label>
            <Input
              value={roleForm.slug}
              onChange={(e) => setRoleForm({ ...roleForm, slug: e.target.value })}
              placeholder="e.g. hostel_warden"
              className="font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Description
            </label>
            <Input
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              placeholder="Permissions summary..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowRoleModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createRoleMutation.mutate()}
            isLoading={createRoleMutation.isPending}
            disabled={!roleForm.name || !roleForm.slug}
          >
            Create Role
          </Button>
        </div>
      </Dialog>

      {/* ── CREATE MODULE MODAL ───────────────────────────────────── */}
      <Dialog
        isOpen={showModuleModal}
        onClose={() => setShowModuleModal(false)}
        title="Create System Module"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Module Name *
            </label>
            <Input
              value={moduleForm.name}
              onChange={(e) =>
                setModuleForm({
                  ...moduleForm,
                  name: e.target.value,
                  slug: moduleForm.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                })
              }
              placeholder="e.g. Inventory Management"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Module Slug *
            </label>
            <Input
              value={moduleForm.slug}
              onChange={(e) => setModuleForm({ ...moduleForm, slug: e.target.value })}
              placeholder="inventory"
              className="font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Description
            </label>
            <Input
              value={moduleForm.description}
              onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
              placeholder="Warehouse assets, stock issuance..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowModuleModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createModuleMutation.mutate()}
            isLoading={createModuleMutation.isPending}
            disabled={!moduleForm.name || !moduleForm.slug}
          >
            Create Module
          </Button>
        </div>
      </Dialog>

      {/* ── CREATE SUBMODULE MODAL ────────────────────────────────── */}
      <Dialog
        isOpen={showSubmoduleModal}
        onClose={() => setShowSubmoduleModal(false)}
        title="Add Submodule"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Submodule Name *
            </label>
            <Input
              value={submoduleForm.name}
              onChange={(e) =>
                setSubmoduleForm({
                  ...submoduleForm,
                  name: e.target.value,
                  slug:
                    submoduleForm.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                })
              }
              placeholder="e.g. Asset Auditing"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Submodule Slug *
            </label>
            <Input
              value={submoduleForm.slug}
              onChange={(e) => setSubmoduleForm({ ...submoduleForm, slug: e.target.value })}
              placeholder="asset_auditing"
              className="font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Description
            </label>
            <Input
              value={submoduleForm.description}
              onChange={(e) => setSubmoduleForm({ ...submoduleForm, description: e.target.value })}
              placeholder="Permissions scope description..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowSubmoduleModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createSubmoduleMutation.mutate()}
            isLoading={createSubmoduleMutation.isPending}
            disabled={!submoduleForm.name || !submoduleForm.slug}
          >
            Add Submodule
          </Button>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
