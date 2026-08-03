'use client';

import React, { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Toast } from 'primereact/toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rbacService, RbacRole, RbacPermission } from '@/services/rbac.service';

/**
 * Roles & Permissions editor.
 *
 * The RBAC module has ten endpoints and had no UI on either client, so the
 * permission model could only be changed by seeding or direct SQL. A school
 * admin could see role names (the staff form reads them for a dropdown) but
 * could not create a role, inspect what it grants, or change it.
 */
export default function RolesPermissionsPage() {
  const toast = React.useRef<Toast>(null);
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

  /** Permissions grouped by module, so the editor reads as a matrix. */
  const grouped = useMemo(() => {
    const map = new Map<string, RbacPermission[]>();
    for (const p of permissions) {
      if (!map.has(p.module)) map.set(p.module, []);
      map.get(p.module)!.push(p);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [permissions]);

  const notify = (severity: 'success' | 'error', detail: string) =>
    toast.current?.show({ severity, summary: severity === 'success' ? 'Saved' : 'Error', detail, life: 3000 });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['rbac-roles'] });

  const createMutation = useMutation({
    mutationFn: () => rbacService.createRole(form),
    onSuccess: () => {
      invalidate();
      setShowCreate(false);
      setForm({ name: '', slug: '', description: '' });
      notify('success', 'Role created');
    },
    onError: () => notify('error', 'Could not create the role'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rbacService.deleteRole(id),
    onSuccess: () => { invalidate(); notify('success', 'Role deleted'); },
    onError: () => notify('error', 'Could not delete the role — system roles cannot be removed'),
  });

  const savePermissionsMutation = useMutation({
    mutationFn: () => rbacService.assignPermissions(editingRole!.id, Array.from(checked)),
    onSuccess: () => { invalidate(); setEditingRole(null); notify('success', 'Permissions updated'); },
    onError: () => notify('error', 'Could not update permissions'),
  });

  const openPermissions = async (role: RbacRole) => {
    const full = await rbacService.getRole(role.id);
    setEditingRole(full ?? role);
    setChecked(new Set((full?.permissions ?? []).map((p) => p.id)));
  };

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
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
      <Toast ref={toast} />

      <div className="flex flex-col gap-4 pb-10 animate-fade-in">
        <div className="flex justify-between items-center">
          <p className="text-xs text-zinc-500 max-w-2xl">
            System roles are seeded per school and cannot be deleted. Their grants can still be
            adjusted — note that defaults are reconciled on every server boot, so custom roles are
            the right place for per-school tailoring.
          </p>
          <Button
            label="New Role"
            icon="pi pi-plus"
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 px-5 rounded-md border-0"
          />
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm">
          <DataTable value={roles} loading={loadingRoles} emptyMessage="No roles found." dataKey="id">
            <Column field="name" header="Role" body={(r: RbacRole) => (
              <div className="flex flex-col">
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{r.name}</span>
                <span className="text-[10px] font-mono text-zinc-400">{r.slug}</span>
              </div>
            )} />
            <Column header="Type" body={(r: RbacRole) => (
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                r.isSystem ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40'
              }`}>
                {r.isSystem ? 'System' : 'Custom'}
              </span>
            )} />
            <Column header="Permissions" body={(r: RbacRole) => (
              <span className="text-xs text-zinc-500">{r._count?.permissions ?? r.permissions?.length ?? 0} granted</span>
            )} />
            <Column header="Actions" body={(r: RbacRole) => (
              <div className="flex gap-2">
                <Button
                  label="Permissions"
                  icon="pi pi-key"
                  onClick={() => openPermissions(r)}
                  className="p-2 px-3 text-xs rounded-md border border-zinc-200 dark:border-zinc-700"
                />
                {!r.isSystem && (
                  <Button
                    icon="pi pi-trash"
                    onClick={() => confirm(`Delete role "${r.name}"?`) && deleteMutation.mutate(r.id)}
                    className="p-2 px-3 text-xs rounded-md border border-rose-200 text-rose-600"
                  />
                )}
              </div>
            )} />
          </DataTable>
        </div>
      </div>

      {/* Create role */}
      <Dialog header="New Role" visible={showCreate} onHide={() => setShowCreate(false)} style={{ width: '420px' }}>
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Name</label>
            <InputText
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_') })}
              placeholder="e.g. Lab Assistant"
              className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Slug</label>
            <InputText
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="lab_assistant"
              className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md font-mono text-xs"
            />
            <span className="text-[10px] text-zinc-400">
              The slug is what @Roles() checks on the server — it cannot be changed later.
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Description</label>
            <InputText
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md"
            />
          </div>
          <Button
            label="Create"
            loading={createMutation.isPending}
            disabled={!form.name || !form.slug}
            onClick={() => createMutation.mutate()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-md border-0 mt-2"
          />
        </div>
      </Dialog>

      {/* Permission matrix */}
      <Dialog
        header={editingRole ? `Permissions — ${editingRole.name}` : 'Permissions'}
        visible={!!editingRole}
        onHide={() => setEditingRole(null)}
        style={{ width: '640px' }}
      >
        <div className="flex flex-col gap-4 pt-2 max-h-[60vh] overflow-y-auto">
          {grouped.length === 0 && <p className="text-sm text-zinc-500">No permissions in the catalogue.</p>}
          {grouped.map(([mod, perms]) => (
            <div key={mod} className="border border-zinc-150 dark:border-zinc-800 rounded-md p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-300">{mod}</span>
                <button
                  type="button"
                  onClick={() => toggleModule(mod, perms)}
                  className="text-[10px] font-bold text-blue-600 uppercase"
                >
                  {perms.every((p) => checked.has(p.id)) ? 'Clear' : 'Select all'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {perms.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                    <Checkbox checked={checked.has(p.id)} onChange={() => toggle(p.id)} />
                    <span>{p.action}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button label="Cancel" onClick={() => setEditingRole(null)} className="p-2 px-4 text-sm rounded-md border border-zinc-200" />
          <Button
            label="Save Permissions"
            loading={savePermissionsMutation.isPending}
            onClick={() => savePermissionsMutation.mutate()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 px-5 rounded-md border-0"
          />
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
