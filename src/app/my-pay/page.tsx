'use client';

import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState, ErrorState, Panel, Spinner, fmtDate, inr } from '@/components/ops/OpsKit';
import { MONTH_NAMES, printPayslip } from '@/components/ops/payslip';
import { useMyPayslips } from '@/hooks/queries/usePayroll';
import { useAuthStore } from '@/store/useAuthStore';

export default function MyPayPage() {
  const schoolName = useAuthStore((s) => s.activeTenant?.name);
  const userName = useAuthStore((s) => s.activeUser?.name);
  const { data, isPending, error, refetch } = useMyPayslips();
  const [view, setView] = useState<any | null>(null);
  const slips = data ?? [];

  const print = (p: any) => {
    if (!printPayslip(p, { schoolName, employeeName: userName }))
      toast.error('Allow pop-ups to print the payslip.');
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="My Payslips" />
      <div className="flex flex-col gap-4 sm:gap-6 pb-10 animate-fade-in">
        <PageHeader title="My Payslips" description="Your monthly salary statements" />
        <Panel>
          {isPending ? (
            <Spinner />
          ) : error ? (
            <ErrorState error={error} onRetry={() => refetch()} />
          ) : slips.length === 0 ? (
            <EmptyState
              title="No payslips yet"
              hint="Payslips appear here once the school generates them."
            />
          ) : (
            <>
              <ul className="md:hidden flex flex-col gap-2.5">
                {slips.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-2xl border border-border bg-card p-3.5 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">
                          {MONTH_NAMES[p.month - 1]} {p.year}
                        </p>
                        <p className="text-caption">Paid on {fmtDate(p.paidAt)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="tabular font-bold text-base">{inr(p.netSalary)}</p>
                        <Badge
                          variant={
                            p.status === 'PAID'
                              ? 'success'
                              : p.status === 'CANCELLED'
                                ? 'secondary'
                                : 'warning'
                          }
                        >
                          {p.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setView(p)}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => print(p)}
                      >
                        <Printer className="w-4 h-4 mr-1" /> Print
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="hidden md:block overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800/80">
                    <tr>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3 text-right">Net salary</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Paid on</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                    {slips.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-3 font-semibold">
                          {MONTH_NAMES[p.month - 1]} {p.year}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-right">
                          {inr(p.netSalary)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              p.status === 'PAID'
                                ? 'success'
                                : p.status === 'CANCELLED'
                                  ? 'secondary'
                                  : 'warning'
                            }
                          >
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-500">{fmtDate(p.paidAt)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <Button size="sm" variant="outline" onClick={() => setView(p)}>
                              View
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label="Print payslip"
                              onClick={() => print(p)}
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
        </Panel>
      </div>

      <Dialog
        isOpen={!!view}
        onClose={() => setView(null)}
        title={view ? `Payslip — ${MONTH_NAMES[view.month - 1]} ${view.year}` : ''}
      >
        {view && (
          <div className="flex flex-col text-sm">
            {[
              ['Basic salary', view.baseSalary],
              ['HRA', view.hra],
              ['Allowances', view.allowance],
              ['Deductions', -Math.abs(Number(view.deductions))],
              ...(Number(view.leaveDeduction) > 0
                ? [
                    [
                      `Unpaid leave (${view.unpaidLeaves ?? 0} days)`,
                      -Math.abs(Number(view.leaveDeduction)),
                    ],
                  ]
                : []),
            ].map(([label, v]) => (
              <div
                key={String(label)}
                className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800"
              >
                <span className="text-zinc-500">{label as string}</span>
                <span className="font-mono">
                  {Number(v) < 0 ? `- ${inr(Math.abs(Number(v)))}` : inr(v)}
                </span>
              </div>
            ))}
            <div className="flex justify-between py-3 font-bold">
              <span>Net salary</span>
              <span className="font-mono">{inr(view.netSalary)}</span>
            </div>
            <div className="flex justify-end [&>button]:w-full sm:[&>button]:w-auto">
              <Button onClick={() => print(view)}>
                <Printer className="w-4 h-4 mr-1" /> Print
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </DashboardLayout>
  );
}
