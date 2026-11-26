'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { rbacService, type ModulePermissionRow, type RbacRole } from '@/services/rbac.service';
import { errorMessage } from '@/lib/errorMessage';

type Flags = Pick<ModulePermissionRow, 'canRead' | 'canWrite' | 'canUpdate' | 'canDelete'>;
const COLS: Array<[keyof Flags, string]> = [
  ['canRead', 'View'],
  ['canWrite', 'Create'],
  ['canUpdate', 'Edit'],
  ['canDelete', 'Delete'],
];
const NONE: Flags = { canRead: false, canWrite: false, canUpdate: false, canDelete: false };

/** Module permission matrix: one row per submodule, View / Create / Edit / Delete. */
export default function RoleMatrixDialog({
  role,
  onClose,
}: {
  role: RbacRole | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const roleId = role?.id;
  const {
    data: modules = [],
    isPending: loadingModules,
    error: modErr,
  } = useQuery({
    queryKey: ['rbac', 'modules'],
    queryFn: rbacService.getModules,
    enabled: !!roleId,
  });
  const {
    data: saved,
    isPending: loadingRows,
    error: rowErr,
  } = useQuery({
    queryKey: ['rbac', 'matrix', roleId],
    queryFn: () => rbacService.getRoleMatrix(roleId!),
    enabled: !!roleId,
  });

  const [grid, setGrid] = useState<Record<string, Flags>>({});
  const [orig, setOrig] = useState<Record<string, Flags>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const m: Record<string, Flags> = {};
    saved.forEach((r) => {
      m[r.submoduleId] = {
        canRead: r.canRead,
        canWrite: r.canWrite,
        canUpdate: r.canUpdate,
        canDelete: r.canDelete,
      };
    });
    setGrid(m);
    setOrig(m);
  }, [saved]);

  const get = (id: string) => grid[id] ?? NONE;
  const toggle = (id: string, k: keyof Flags) =>
    setGrid((g) => ({ ...g, [id]: { ...(g[id] ?? NONE), [k]: !(g[id] ?? NONE)[k] } }));

  const save = async () => {
    if (!roleId) return;
    const changed = Object.keys(grid).filter(
      (id) => JSON.stringify(grid[id]) !== JSON.stringify(orig[id] ?? NONE)
    );
    if (changed.length === 0) return toast.info('No changes to save.');
    setSaving(true);
    const results = await Promise.allSettled(
      changed.map((id) => rbacService.setMatrixRow({ roleId, submoduleId: id, ...grid[id] }))
    );
    setSaving(false);
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failed.length) {
      toast.error(
        `${failed.length} of ${changed.length} rows failed: ${errorMessage(failed[0].reason)}`
      );
    } else {
      toast.success('Permission matrix saved.');
    }
    qc.invalidateQueries({ queryKey: ['rbac'] });
    qc.invalidateQueries({ queryKey: ['rbac-roles'] });
    if (!failed.length) onClose();
  };

  const loading = loadingModules || loadingRows;
  return (
    <Dialog
      isOpen={!!role}
      onClose={onClose}
      title={role ? `Module access - ${role.name}` : 'Module access'}
      className="max-w-3xl"
    >
      <div className="flex min-h-0 flex-col gap-3">
        {loading && <p className="text-sm text-zinc-500">Loading matrix...</p>}
        {(modErr || rowErr) && (
          <p className="text-sm text-rose-600">{errorMessage(modErr || rowErr)}</p>
        )}
        {!loading && modules.length === 0 && (
          <p className="text-sm text-zinc-500">No modules are defined for permission control.</p>
        )}
        {modules.map((mod) => (
          <div key={mod.id} className="rounded-xl border border-border">
            <div className="border-b border-border bg-zinc-50/60 px-3 py-2 text-xs font-bold uppercase tracking-wider dark:bg-white/5">
              {mod.name}
            </div>
            <table className="w-full text-xs">
              <thead className="text-zinc-400">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium">Section</th>
                  {COLS.map(([, label]) => (
                    <th key={label} className="px-2 py-1.5 text-center font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(mod.submodules ?? []).map((sub) => (
                  <tr key={sub.id}>
                    <td className="px-3 py-1.5">{sub.name}</td>
                    {COLS.map(([k, label]) => (
                      <td key={k} className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${sub.name} ${label}`}
                          checked={get(sub.id)[k]}
                          onChange={() => toggle(sub.id, k)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} isLoading={saving} disabled={loading}>
            Save matrix
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
