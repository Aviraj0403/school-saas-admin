'use client';

import React, { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rbacService, RbacRole, RbacPermission } from '@/services/rbac.service';
import { Plus, Key, Trash2, Shield } from 'lucide-react';

export default function RolesPermissionsPage() {
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [editingRole, setEditingRole] = useState<RbacRole | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const { data: roles = [], isPending: loadingRoles } = useQuery({
    queryKey: ['rbac-roles'],
    queryFn: rbacService.getRoles,
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['rbac-permissions'],
    queryFn: rbacService.getPermissions,
  });

  const grouped = useMemo(() => {
    const map = new Map<string, RbacPermission[]>();
    for (const p of permissions) {
      if (!map.has(p.module)) map.set(p.module, []);
      map.get(p.module)!.push(p);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [permissions]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['rbac-roles'] });

  const createMutation = useMutation({
    mutationFn: () => rbacService.createRole(form),
    onSuccess: () => {
      invalidate();
      setShowCreate(false);
      setForm({ name: '', slug: '', description: '' });
      toast.success('Role created successfully.');
    },
    onError: () => toast.error('Could not create the role.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rbacService.deleteRole(id),
    onSuccess: () => {
      invalidate();
      toast.success('Role deleted.');
    },
    onError: () => toast.error('Could not delete system role.'),
  });

  const savePermissionsMutation = useMutation({
    mutationFn: () => rbacService.assignPermissions(editingRole!.id, Array.from(checked)),
    onSuccess: () => {
      invalidate();
      setEditingRole(null);
      toast.success('Permissions updated successfully.');
    },
    onError: () => toast.error('Could not update permissions.'),
  });

  const openPermissions = async (role: RbacRole) => {
    const full = await rbacService.getRole(role.id);
    setEditingRole(full ?? role);
    setChecked(new Set((full?.permissions ?? []).map((p) => p.id)));
  };

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleModule = (mod: string, perms: RbacPermission[]) => {
    const allOn = perms.every((p) => checked.has(p.id));
    setChecked((prev) => {
      const next = new Set(prev);
      perms.forEach((p) => (allOn ? next.delete(p.id) : next.add(p.id)));
      return next;
    });
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Roles & Permissions" subtitle="Settings" />

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Shield className="w-6 h-6 text-brand" /> RBAC Authorization Matrix
            </h1>
            <p className="text-xs text-zinc-500 max-w-2xl mt-1">
              System roles are seeded per school domain. Fine-tune granular operation permissions or
              create custom roles.
            </p>
          </div>

          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Role
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 backdrop-blur-xl shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
              <tr>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Granted Permissions</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
              {loadingRoles ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-zinc-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                    <p className="text-xs">Loading roles...</p>
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-zinc-400">
                    No roles found.
                  </td>
                </tr>
              ) : (
                roles.map((r: RbacRole) => (
                  <tr key={r.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {r.name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">{r.slug}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={r.isSystem ? 'secondary' : 'info'}>
                        {r.isSystem ? 'System' : 'Custom'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-300">
                      {r._count?.permissions ?? r.permissions?.length ?? 0} granted
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => openPermissions(r)}>
                          <Key className="w-3.5 h-3.5 mr-1" /> Permissions
                        </Button>
                        {!r.isSystem && (
                          <Button
                            variant="outline"
                            onClick={() =>
                              confirm(`Delete role "${r.name}"?`) && deleteMutation.mutate(r.id)
                            }
                            className="text-rose-600 border-rose-200/80 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create role */}
      <Dialog isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Role">
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Role Name *
            </label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                  slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                })
              }
              placeholder="e.g. Lab Assistant"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Role Slug *
            </label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="lab_assistant"
              className="font-mono"
            />
            <span className="text-[10px] text-zinc-400">Unique server slug check key.</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Description
            </label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description of permissions..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowCreate(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            isLoading={createMutation.isPending}
            disabled={!form.name || !form.slug}
          >
            Create Role
          </Button>
        </div>
      </Dialog>

      {/* Permission matrix */}
      <Dialog
        isOpen={!!editingRole}
        onClose={() => setEditingRole(null)}
        title={editingRole ? `Manage Permissions — ${editingRole.name}` : 'Permissions'}
      >
        <div className="flex flex-col gap-4 py-2 max-h-[60vh] overflow-y-auto">
          {grouped.length === 0 && (
            <p className="text-xs text-zinc-400">No permissions available.</p>
          )}
          {grouped.map(([mod, perms]) => (
            <div
              key={mod}
              className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3 bg-zinc-50/50 dark:bg-zinc-900/30"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  {mod}
                </span>
                <button
                  type="button"
                  onClick={() => toggleModule(mod, perms)}
                  className="text-[10px] font-semibold text-brand hover:underline"
                >
                  {perms.every((p) => checked.has(p.id)) ? 'Clear All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {perms.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(p.id)}
                      onChange={() => toggle(p.id)}
                      className="rounded border-zinc-300 text-brand focus:ring-brand"
                    />
                    <span>{p.action}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setEditingRole(null)}>
            Cancel
          </Button>
          <Button
            onClick={() => savePermissionsMutation.mutate()}
            isLoading={savePermissionsMutation.isPending}
          >
            Save Grant Changes
          </Button>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
