'use client';

import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
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
      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">My Payslips</h1>
          <p className="text-sm text-zinc-500">Your monthly salary statements</p>
        </div>
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
            <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
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
            <div className="flex justify-end">
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
