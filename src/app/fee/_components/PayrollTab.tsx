'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, Cog, Pencil, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  DialogFooter,
  EmptyState,
  ErrorState,
  Field,
  Spinner,
  TabBar,
  errMsg,
  inr,
} from '@/components/ops/OpsKit';
import { MONTH_NAMES, printPayslip } from '@/components/ops/payslip';
import { usePermissions } from '@/hooks/usePermissions';
import { useStaffLite } from '@/hooks/queries/useStaffLite';
import {
  useGeneratePayslips,
  usePayPayslip,
  usePayslips,
  useSalaryStructure,
  useUpsertSalaryStructure,
} from '@/hooks/queries/usePayroll';
import { useAuthStore } from '@/store/useAuthStore';

function SalaryStructurePanel() {
  const { isAdmin } = usePermissions();
  const { data: staff, isPending: loadingStaff } = useStaffLite();
  const [userId, setUserId] = useState('');
  const { data, isPending, error } = useSalaryStructure(userId);
  const upsertM = useUpsertSalaryStructure();
  const [form, setForm] = useState({ baseSalary: '', hra: '', allowance: '', deductions: '' });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setEditing(false);
    setForm({
      baseSalary: String(Number(data?.baseSalary ?? 0)),
      hra: String(Number(data?.hra ?? 0)),
      allowance: String(Number(data?.allowance ?? 0)),
      deductions: String(Number(data?.deductions ?? 0)),
    });
  }, [data, userId]);

  const notSet = !!error && (error as any)?.response?.status === 404;

  const save = () => {
    const payload = {
      baseSalary: Number(form.baseSalary) || 0,
      hra: Number(form.hra) || 0,
      allowance: Number(form.allowance) || 0,
      deductions: Number(form.deductions) || 0,
    };
    upsertM.mutate(
      { userId, data: payload },
      {
        onSuccess: () => {
          toast.success('Salary structure saved.');
          setEditing(false);
        },
        onError: (e: any) => toast.error(errMsg(e, 'Could not save the salary structure.')),
      }
    );
  };

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <Field label="Staff member">
        <Select
          value={userId}
          disabled={loadingStaff}
          options={[
            { label: 'Select staff...', value: '' },
            ...(staff ?? []).map((s) => ({
              label: `${s.name}${s.designation ? ` — ${s.designation}` : ''}`,
              value: s.id,
            })),
          ]}
          onChange={(e) => setUserId(e.target.value)}
        />
      </Field>
      {userId && isPending && <Spinner />}
      {userId && !isPending && error && !notSet && <ErrorState error={error} />}
      {userId && !isPending && (!error || notSet) && (
        <div className="border border-border rounded-2xl p-3 sm:p-4 flex flex-col gap-3">
          {notSet && (
            <p className="text-xs text-amber-600">
              No salary structure has been set for this person yet.
            </p>
          )}
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
            {(
              [
                ['baseSalary', 'Basic salary'],
                ['hra', 'HRA'],
                ['allowance', 'Allowances'],
                ['deductions', 'Deductions'],
              ] as const
            ).map(([k, label]) => (
              <Field key={k} label={`${label} (₹)`}>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  disabled={!editing}
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                />
              </Field>
            ))}
          </div>
          {isAdmin ? (
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end [&>button]:w-full sm:[&>button]:w-auto">
              {editing ? (
                <>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={save} isLoading={upsertM.isPending}>
                    Save
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Pencil className="w-4 h-4 mr-1" /> {notSet ? 'Set structure' : 'Edit'}
                </Button>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-zinc-500">
              Only the school admin can change salary structures.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function PayrollTab() {
  const { isAdmin, isRole } = usePermissions();
  const canRun = isAdmin || isRole('accountant');
  const schoolName = useAuthStore((s) => s.activeTenant?.name);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [sub, setSub] = useState(0);
  const [payId, setPayId] = useState('');
  const [method, setMethod] = useState('BANK_TRANSFER');

  const { data: payslips, isPending, error, refetch } = usePayslips({ month, year }, canRun);
  const generateM = useGeneratePayslips();
  const payM = usePayPayslip();

  const years = [year - 2, year - 1, year, year + 1].filter((v, i, a) => a.indexOf(v) === i);

  const generate = () =>
    generateM.mutate(
      { month, year },
      {
        onSuccess: () => toast.success(`Payslips generated for ${MONTH_NAMES[month - 1]} ${year}.`),
        onError: (e: any) => toast.error(errMsg(e, 'Could not generate payslips.')),
      }
    );

  const pay = () =>
    payM.mutate(
      { id: payId, paymentMethod: method },
      {
        onSuccess: () => {
          toast.success('Salary marked as paid.');
          setPayId('');
        },
        onError: (e: any) => toast.error(errMsg(e, 'Could not record the salary payment.')),
      }
    );

  if (!canRun) {
    return <EmptyState title="Payroll is managed by the school admin and accountant." />;
  }

  return (
    <div className="flex flex-col gap-5">
      <TabBar tabs={['Monthly Payslips', 'Salary Structures']} active={sub} onChange={setSub} />
      {sub === 1 && <SalaryStructurePanel />}
      {sub === 0 && (
        <>
          <div className="grid grid-cols-2 sm:flex sm:items-end gap-3 sm:gap-4 bg-muted/40 p-3 sm:p-4 rounded-2xl border border-border sm:flex-wrap">
            <div className="sm:w-40">
              <Field label="Month">
                <Select
                  value={String(month)}
                  options={MONTH_NAMES.map((m, i) => ({ label: m, value: String(i + 1) }))}
                  onChange={(e) => setMonth(Number(e.target.value))}
                />
              </Field>
            </div>
            <div className="sm:w-32">
              <Field label="Year">
                <Select
                  value={String(year)}
                  options={years.map((y) => ({ label: String(y), value: String(y) }))}
                  onChange={(e) => setYear(Number(e.target.value))}
                />
              </Field>
            </div>
            {canRun && (
              <Button
                className="col-span-2 sm:col-span-1"
                onClick={generate}
                isLoading={generateM.isPending}
              >
                <Cog className="w-4 h-4 mr-2" /> Generate Payslips
              </Button>
            )}
          </div>

          {isPending ? (
            <Spinner />
          ) : error ? (
            <ErrorState error={error} onRetry={() => refetch()} />
          ) : (payslips ?? []).length === 0 ? (
            <EmptyState
              title="No payslips for this month"
              hint="Generate payslips to create them from each salary structure."
            />
          ) : (
            <>
              <ul className="md:hidden flex flex-col gap-2.5">
                {(payslips ?? []).map((d: any) => (
                  <li
                    key={d.id}
                    className="rounded-2xl border border-border bg-card p-3.5 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{d.user?.name ?? '—'}</p>
                        <p className="text-caption">
                          Base {inr(d.baseSalary)} · Ded.{' '}
                          {inr(Number(d.deductions) + Number(d.leaveDeduction ?? 0))}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="tabular font-bold text-brand text-base">{inr(d.netSalary)}</p>
                        <Badge
                          variant={
                            d.status === 'PAID'
                              ? 'success'
                              : d.status === 'CANCELLED'
                                ? 'secondary'
                                : 'warning'
                          }
                        >
                          {d.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {d.status === 'PENDING' && canRun && (
                        <Button
                          size="sm"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => setPayId(d.id)}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" /> Pay
                        </Button>
                      )}
                      {d.status === 'PAID' && (
                        <span className="self-center text-[11px] text-muted-foreground font-mono">
                          {d.paymentMethod}
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          if (!printPayslip(d, { schoolName }))
                            toast.error('Allow pop-ups to print.');
                        }}
                      >
                        <Printer className="w-4 h-4 mr-1" /> Payslip
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="hidden md:block overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800/80">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Base</th>
                      <th className="px-4 py-3">HRA</th>
                      <th className="px-4 py-3">Allowances</th>
                      <th className="px-4 py-3">Deductions</th>
                      <th className="px-4 py-3 font-bold">Net</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                    {(payslips ?? []).map((d: any) => (
                      <tr key={d.id}>
                        <td className="px-4 py-3 font-semibold">{d.user?.name ?? '—'}</td>
                        <td className="px-4 py-3 font-mono">{inr(d.baseSalary)}</td>
                        <td className="px-4 py-3 font-mono">{inr(d.hra)}</td>
                        <td className="px-4 py-3 font-mono">{inr(d.allowance)}</td>
                        <td className="px-4 py-3 font-mono text-rose-500">
                          {inr(Number(d.deductions) + Number(d.leaveDeduction ?? 0))}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-brand">
                          {inr(d.netSalary)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              d.status === 'PAID'
                                ? 'success'
                                : d.status === 'CANCELLED'
                                  ? 'secondary'
                                  : 'warning'
                            }
                          >
                            {d.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center items-center">
                            {d.status === 'PENDING' && canRun && (
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => setPayId(d.id)}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" /> Pay
                              </Button>
                            )}
                            {d.status === 'PAID' && (
                              <span className="text-[10px] text-zinc-400 font-mono">
                                {d.paymentMethod}
                              </span>
                            )}
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label="Print payslip"
                              onClick={() => {
                                if (!printPayslip(d, { schoolName }))
                                  toast.error('Allow pop-ups to print.');
                              }}
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      <Dialog isOpen={!!payId} onClose={() => setPayId('')} title="Disburse Salary">
        <Field label="Payment method *">
          <Select
            value={method}
            options={[
              { label: 'Bank transfer', value: 'BANK_TRANSFER' },
              { label: 'Cash', value: 'CASH' },
              { label: 'Cheque', value: 'CHEQUE' },
            ]}
            onChange={(e) => setMethod(e.target.value)}
          />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPayId('')}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={pay}
            isLoading={payM.isPending}
          >
            Confirm payment
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
