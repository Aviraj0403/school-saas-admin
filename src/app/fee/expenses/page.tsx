'use client';

import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/StatCard';
import {
  ConfirmDialog,
  DialogFooter,
  EmptyState,
  ErrorState,
  Field,
  Panel,
  Spinner,
  errMsg,
  fmtDate,
  inr,
} from '@/components/ops/OpsKit';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
  useFinanceSummary,
  useUpdateExpense,
} from '@/hooks/queries/usePayroll';
import type { Expense } from '@/services/payroll.service';

const CATEGORIES = ['rent', 'utilities', 'maintenance', 'supplies', 'salary', 'other'];
const blank = {
  title: '',
  category: 'supplies',
  amount: '',
  date: '',
  vendor: '',
  referenceNo: '',
  description: '',
};

export default function ExpensesPage() {
  const { isAdmin, isRole } = usePermissions();
  const canManage = isAdmin || isRole('accountant');

  const [page, setPage] = useState(1);
  const { data, isPending, error, refetch } = useExpenses(page, 15, canManage);
  const { data: summary } = useFinanceSummary(undefined, isAdmin); // admin-only on the backend
  const createM = useCreateExpense();
  const updateM = useUpdateExpense();
  const deleteM = useDeleteExpense();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [toDelete, setToDelete] = useState<Expense | null>(null);

  const items = data?.items ?? [];
  const meta = data?.meta;

  const close = () => {
    setOpen(false);
    setEditing(null);
    setForm({ ...blank });
  };
  const startAdd = () => {
    setForm({ ...blank, date: new Date().toISOString().slice(0, 10) });
    setEditing(null);
    setOpen(true);
  };
  const startEdit = (x: Expense) => {
    setEditing(x);
    setForm({
      title: x.title,
      category: x.category,
      amount: String(Number(x.amount)),
      date: String(x.date).slice(0, 10),
      vendor: x.vendor ?? '',
      referenceNo: x.referenceNo ?? '',
      description: x.description ?? '',
    });
    setOpen(true);
  };

  const submit = () => {
    const amount = Number(form.amount);
    if (!form.title.trim()) return toast.error('Title is required.');
    if (!(amount > 0)) return toast.error('Enter an amount greater than zero.');
    if (!form.date) return toast.error('Date is required.');
    const payload = {
      title: form.title.trim(),
      category: form.category,
      amount,
      date: new Date(form.date).toISOString(),
      vendor: form.vendor.trim() || undefined,
      referenceNo: form.referenceNo.trim() || undefined,
      description: form.description.trim() || undefined,
    };
    const done = {
      onSuccess: () => {
        toast.success(editing ? 'Expense updated.' : 'Expense logged.');
        close();
      },
      onError: (e: any) => toast.error(errMsg(e, 'Could not save the expense.')),
    };
    if (editing) updateM.mutate({ id: editing.id, data: payload }, done);
    else createM.mutate(payload, done);
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Expenses" />
      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">School Expenses</h1>
            <p className="text-sm text-zinc-500">
              Rent, utilities, maintenance, supplies and other spending
            </p>
          </div>
          {canManage && (
            <Button onClick={startAdd}>
              <Plus className="w-4 h-4 mr-2" /> Log Expense
            </Button>
          )}
        </div>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCard
              label={`Revenue ${summary.year}`}
              value={inr(summary.totals.totalRevenue)}
              icon="pi pi-wallet"
              gradientClass="from-emerald-500 to-teal-500"
              iconBgClass="bg-emerald-500/10"
              iconColorClass="text-emerald-600"
              footerText="Fees collected"
            />
            <StatCard
              label={`Expenses ${summary.year}`}
              value={inr(summary.totals.totalExpense)}
              icon="pi pi-credit-card"
              gradientClass="from-rose-500 to-red-500"
              iconBgClass="bg-rose-500/10"
              iconColorClass="text-rose-600"
              footerText="All logged expenses"
            />
            <StatCard
              label="Net"
              value={inr(summary.totals.netProfit)}
              icon="pi pi-chart-line"
              gradientClass="from-blue-500 to-blue-500"
              iconBgClass="bg-blue-500/10"
              iconColorClass="text-blue-600"
              footerText="Revenue minus expenses"
            />
          </div>
        )}

        <Panel>
          {!canManage ? (
            <EmptyState title="Expenses are managed by the accountant and school admin." />
          ) : isPending ? (
            <Spinner />
          ) : error ? (
            <ErrorState error={error} onRetry={() => refetch()} />
          ) : items.length === 0 ? (
            <EmptyState
              title="No expenses logged yet"
              hint='Use "Log Expense" to add the first one.'
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800/80">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Vendor</th>
                    <th className="px-4 py-3">Ref</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                  {items.map((x) => (
                    <tr key={x.id}>
                      <td className="px-4 py-3 font-mono text-zinc-500">{fmtDate(x.date)}</td>
                      <td className="px-4 py-3 font-semibold">{x.title}</td>
                      <td className="px-4 py-3">
                        <Badge variant="info">{x.category}</Badge>
                      </td>
                      <td className="px-4 py-3">{x.vendor ?? '—'}</td>
                      <td className="px-4 py-3 font-mono">{x.referenceNo ?? '—'}</td>
                      <td className="px-4 py-3 font-mono font-bold text-right">{inr(x.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Edit expense"
                            onClick={() => startEdit(x)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label="Delete expense"
                              onClick={() => setToDelete(x)}
                            >
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 text-xs text-zinc-500 mt-4">
              <span>
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </Panel>
      </div>

      <Dialog isOpen={open} onClose={close} title={editing ? 'Edit Expense' : 'Log Expense'}>
        <div className="flex flex-col gap-4 py-2">
          <Field label="Title *">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Broadband bill"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category *">
              <Select
                value={form.category}
                options={CATEGORIES.map((c) => ({ label: c, value: c }))}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </Field>
            <Field label="Amount (₹) *">
              <Input
                type="number"
                min={0}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Date *">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vendor">
              <Input
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              />
            </Field>
            <Field label="Reference no.">
              <Input
                value={form.referenceNo}
                onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Description">
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button onClick={submit} isLoading={createM.isPending || updateM.isPending}>
            {editing ? 'Save changes' : 'Save expense'}
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete expense"
        message={`Delete "${toDelete?.title ?? ''}" (${inr(toDelete?.amount)})? This cannot be undone.`}
        loading={deleteM.isPending}
        onConfirm={() =>
          toDelete &&
          deleteM.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success('Expense deleted.');
              setToDelete(null);
            },
            onError: (e: any) => toast.error(errMsg(e, 'Could not delete the expense.')),
          })
        }
        onClose={() => setToDelete(null)}
      />
    </DashboardLayout>
  );
}
