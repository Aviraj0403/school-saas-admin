'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Boxes, Pencil } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { errorMessage } from '@/lib/errorMessage';
import { cn } from '@/lib/utils';
import {
  useModuleCatalog,
  useUpdateCatalogEntry,
} from '@/modules/superadmin/hooks/useModuleControl';
import { useModuleRegistry } from '@/modules/superadmin/hooks/useSubscriptions';
import type { CatalogRow } from '@/modules/superadmin/services/subscription-modules.service';

const TIER_TONE: Record<string, string> = {
  BASIC: 'tone-teal',
  STANDARD: 'tone-indigo',
  PREMIUM: 'tone-orange',
  ENTERPRISE: 'tone-violet',
};

export default function ModuleCatalogPage() {
  const { data: catalog = [], isPending, error } = useModuleCatalog();
  const { data: registry } = useModuleRegistry();
  const [editing, setEditing] = useState<CatalogRow | null>(null);

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Module Catalog" subtitle="Superadmin" />

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <div>
          <h1 className="text-page-title flex items-center gap-2">
            <Boxes className="h-5 w-5 text-brand" /> Module Catalog
          </h1>
          <p className="text-caption mt-1">
            Every module the platform offers, its add-on price and how many schools use it.
          </p>
        </div>

        {isPending && <p className="text-sm text-zinc-500">Loading catalogue...</p>}
        {error && (
          <p className="text-sm text-rose-600">{errorMessage(error, 'Could not load catalogue')}</p>
        )}
        {!isPending && !error && catalog.length === 0 && (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-zinc-500">
            No modules found.
          </p>
        )}

        {catalog.length > 0 && (
          <div className="surface-card overflow-x-auto">
            <table className="modern-table w-full">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Module</th>
                  <th>Description</th>
                  <th>Tier</th>
                  <th>Add-on price</th>
                  <th>Schools</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {catalog.map((m) => (
                  <tr key={m.key}>
                    <td className="text-caption">{registry?.groups?.[m.group] ?? m.group}</td>
                    <td className="font-semibold">{m.label}</td>
                    <td className="text-caption max-w-xs">{m.description}</td>
                    <td>
                      {m.tier && (
                        <span
                          className={cn(
                            'tone-chip inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
                            TIER_TONE[m.tier] ?? 'tone-indigo'
                          )}
                        >
                          {m.tier}
                        </span>
                      )}
                    </td>
                    <td>
                      {m.priceMonthly != null
                        ? `₹${Number(m.priceMonthly).toLocaleString('en-IN')}/month`
                        : '-'}
                    </td>
                    <td>
                      {m.schools} of {m.totalSchools}
                    </td>
                    <td className="text-right">
                      <Button size="xs" variant="outline" onClick={() => setEditing(m)}>
                        <Pencil className="h-3 w-3" /> Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && <EditDialog row={editing} onClose={() => setEditing(null)} />}
    </DashboardLayout>
  );
}

function EditDialog({ row, onClose }: { row: CatalogRow; onClose: () => void }) {
  const update = useUpdateCatalogEntry();
  const [label, setLabel] = useState(row.label);
  const [description, setDescription] = useState(row.description);
  const [price, setPrice] = useState(row.priceMonthly != null ? String(row.priceMonthly) : '');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      {
        key: row.key,
        body: {
          label: label.trim(),
          description: description.trim(),
          priceMonthly: price === '' ? null : Number(price),
        },
      },
      {
        onSuccess: () => {
          toast.success('Module updated');
          onClose();
        },
        onError: (err) => toast.error(errorMessage(err, 'Could not update module')),
      }
    );
  };

  return (
    <Dialog isOpen onClose={onClose} title={`Edit ${row.label}`}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-semibold">
          Name
          <Input value={label} required onChange={(e) => setLabel(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold">
          Description
          <Textarea
            className="min-h-20"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold">
          Add-on price (₹ per month, blank = none)
          <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={update.isPending}>
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
