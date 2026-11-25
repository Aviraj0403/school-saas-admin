'use client';

import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AcademicYearSelect } from '@/components/academics/AcademicYearSelect';
import {
  ConfirmDialog,
  DialogFooter,
  EmptyState,
  ErrorState,
  Field,
  Spinner,
  errMsg,
  fmtDate,
  inr,
} from '@/components/ops/OpsKit';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useCreateFeeStructure,
  useDeleteFeeStructure,
  useFeeStructures,
  useUpdateFeeStructure,
} from '@/hooks/queries/useFee';
import { useClasses } from '@/hooks/queries/useAcademics';
import { asList } from '@/lib/utils';

const blank = {
  name: '',
  description: '',
  amount: '',
  lateFee: '',
  dueDate: '',
  academicYearId: '',
  applicableTo: 'all' as 'all' | 'class',
  classIds: [] as string[],
  isActive: true,
};

export function SlabsTab({ addOpen, onAddClose }: { addOpen: boolean; onAddClose: () => void }) {
  const { can, isAdmin } = usePermissions();
  const canEdit = can('fee:update');
  const canDelete = isAdmin && can('fee:delete');

  const { data, isPending, error, refetch } = useFeeStructures();
  const structures = asList<any>(data);
  const { data: classesData } = useClasses(1, 100);
  const classes = asList<any>(classesData);

  const createM = useCreateFeeStructure();
  const updateM = useUpdateFeeStructure();
  const deleteM = useDeleteFeeStructure();

  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [toDelete, setToDelete] = useState<any | null>(null);
  const open = addOpen || !!editing;

  const close = () => {
    setEditing(null);
    setForm({ ...blank });
    onAddClose();
  };

  const startEdit = (s: any) => {
    setForm({
      name: s.name ?? '',
      description: s.description ?? '',
      amount: String(Number(s.amount)),
      lateFee: String(Number(s.lateFee ?? 0)),
      dueDate: s.dueDate ? String(s.dueDate).slice(0, 10) : '',
      academicYearId: s.academicYearId ?? '',
      applicableTo: s.applicableTo === 'class' ? 'class' : 'all',
      classIds: s.classIds ?? [],
      isActive: s.isActive !== false,
    });
    setEditing(s);
  };

  const submit = () => {
    const amount = Number(form.amount);
    if (!form.name.trim()) return toast.error('Structure name is required.');
    if (!(amount > 0)) return toast.error('Enter an amount greater than zero.');
    if (!form.dueDate) return toast.error('Due date is required.');
    if (!form.academicYearId) return toast.error('Select an academic year.');
    if (form.applicableTo === 'class' && form.classIds.length === 0)
      return toast.error('Pick at least one class, or apply to all classes.');

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      amount,
      lateFee: Number(form.lateFee) || 0,
      dueDate: new Date(form.dueDate).toISOString(),
      academicYearId: form.academicYearId,
      applicableTo: form.applicableTo,
      classIds: form.applicableTo === 'class' ? form.classIds : [],
    };
    const done = {
      onSuccess: () => {
        toast.success(editing ? 'Fee structure updated.' : 'Fee structure saved.');
        close();
      },
      onError: (e: any) => toast.error(errMsg(e, 'Could not save the fee structure.')),
    };
    if (editing)
      updateM.mutate({ id: editing.id, data: { ...payload, isActive: form.isActive } }, done);
    else createM.mutate(payload, done);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteM.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success('Fee structure retired.');
        setToDelete(null);
      },
      onError: (e: any) => toast.error(errMsg(e, 'Could not delete the fee structure.')),
    });
  };

  const toggleClass = (id: string) =>
    setForm((f) => ({
      ...f,
      classIds: f.classIds.includes(id) ? f.classIds.filter((c) => c !== id) : [...f.classIds, id],
    }));

  if (isPending) return <Spinner label="Loading structures..." />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  return (
    <div>
      {structures.length === 0 ? (
        <EmptyState
          title="No fee structures yet"
          hint={can('fee:create') ? 'Use "Add Structure Slab" to create the first one.' : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {structures.map((s: any) => (
            <div
              key={s.id}
              className="border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-xl bg-white dark:bg-zinc-900 flex flex-col gap-3 shadow-sm"
            >
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base leading-snug">
                  {s.name}
                </h3>
                <Badge variant={s.isActive === false ? 'secondary' : 'info'}>
                  {s.isActive === false
                    ? 'Retired'
                    : s.applicableTo === 'class'
                      ? 'Selected classes'
                      : 'All classes'}
                </Badge>
              </div>
              {s.description && <p className="text-xs text-zinc-500">{s.description}</p>}
              <div className="text-[11px] text-zinc-500 flex justify-between">
                <span>Due {fmtDate(s.dueDate)}</span>
                <span>{s.academicYear?.name}</span>
              </div>
              <div className="flex justify-between items-baseline border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
                  Amount
                </span>
                <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                  {inr(s.amount)}
                </span>
              </div>
              {(canEdit || canDelete) && (
                <div className="flex justify-end gap-2">
                  {canEdit && (
                    <Button size="sm" variant="outline" onClick={() => startEdit(s)}>
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button size="sm" variant="outline" onClick={() => setToDelete(s)}>
                      <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-500" /> Delete
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog
        isOpen={open}
        onClose={close}
        title={editing ? 'Edit Fee Structure' : 'Create Fee Structure Slab'}
      >
        <div className="flex flex-col gap-4 py-2">
          <Field label="Structure Name *">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Tuition Fee Q1"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (₹) *">
              <Input
                type="number"
                min={0}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
            <Field label="Late fee (₹)">
              <Input
                type="number"
                min={0}
                value={form.lateFee}
                onChange={(e) => setForm({ ...form, lateFee: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Due Date *">
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </Field>
          <Field label="Academic Year *">
            <AcademicYearSelect
              value={form.academicYearId}
              onChange={(id) => setForm({ ...form, academicYearId: id })}
              className="w-full"
            />
          </Field>
          <Field label="Applies to">
            <Select
              value={form.applicableTo}
              options={[
                { label: 'All classes', value: 'all' },
                { label: 'Selected classes', value: 'class' },
              ]}
              onChange={(e) =>
                setForm({ ...form, applicableTo: e.target.value as 'all' | 'class' })
              }
            />
          </Field>
          {form.applicableTo === 'class' && (
            <div className="max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 grid grid-cols-2 gap-1">
              {classes.map((c: any) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form.classIds.includes(c.id)}
                    onChange={() => toggleClass(c.id)}
                  />
                  {c.name} - {c.section}
                </label>
              ))}
            </div>
          )}
          <Field label="Description">
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          {editing && (
            <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active (inactive structures stop appearing in student dues)
            </label>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button onClick={submit} isLoading={createM.isPending || updateM.isPending}>
            {editing ? 'Save Changes' : 'Save Slab'}
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete fee structure"
        message={`Retire "${toDelete?.name ?? ''}"? Collections already raised against it are kept.`}
        loading={deleteM.isPending}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
