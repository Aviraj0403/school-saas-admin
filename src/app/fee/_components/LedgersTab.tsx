'use client';

import React, { useState } from 'react';
import { BookOpen, Printer, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  EmptyState,
  ErrorState,
  Spinner,
  TabBar,
  errMsg,
  fmtDate,
  inr,
} from '@/components/ops/OpsKit';
import { usePermissions } from '@/hooks/usePermissions';
import { useFeeCollections, useReconcileCollection, useStudentDues } from '@/hooks/queries/useFee';
import { useClasses } from '@/hooks/queries/useAcademics';
import { useStudentsList } from '@/hooks/queries/useStudents';
import { useAuthStore } from '@/store/useAuthStore';
import { asList } from '@/lib/utils';
import { printFeeReceipt } from './receipt';
import { RazorpayPanel } from './RazorpayPanel';

function StudentLedgers() {
  const schoolName = useAuthStore((s) => s.activeTenant?.name);
  const [classId, setClassId] = useState('');
  const [student, setStudent] = useState<any>(null);
  const { data: classesData } = useClasses(1, 100);
  const classes = asList<any>(classesData);
  const { data: studentsData, isPending: loadingStudents } = useStudentsList(
    1,
    100,
    undefined,
    classId || undefined
  );
  const students = asList<any>(studentsData);
  const { data: dues, isPending: loadingLedger, error } = useStudentDues(student?.id ?? '');

  const paid: any[] = dues?.paid ?? [];
  const outstanding: any[] = dues?.outstanding ?? [];
  const rows = [
    ...outstanding.map((o: any) => ({
      id: `out-${o.id}`,
      date: o.dueDate ?? o.createdAt,
      description: `${o.name} (due)`,
      type: 'DEBIT',
      amount: o.remainingAmount ?? o.amount,
    })),
    ...paid.map((p: any) => ({
      id: `paid-${p.id}`,
      date: p.paidAt ?? p.createdAt,
      description: `Paid: ${p.feeStructure?.name ?? 'Fee'} via ${p.paymentMethod} (${p.receiptNo})`,
      type: 'CREDIT',
      amount: p.totalAmount,
      collection: p,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col gap-3 bg-zinc-50/50 dark:bg-zinc-900/30">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Student Directory</h2>
        <Select
          value={classId}
          options={[
            { label: 'All classes', value: '' },
            ...classes.map((c: any) => ({ label: `${c.name} - ${c.section}`, value: c.id })),
          ]}
          onChange={(e) => {
            setClassId(e.target.value);
            setStudent(null);
          }}
        />
        {loadingStudents ? (
          <Spinner />
        ) : students.length === 0 ? (
          <EmptyState title="No students found" />
        ) : (
          <div className="overflow-y-auto max-h-[420px] rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800/80">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Adm. No</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                {students.map((s: any) => (
                  <tr
                    key={s.id}
                    onClick={() => setStudent(s)}
                    className={`cursor-pointer ${student?.id === s.id ? 'bg-brand/10 font-semibold text-brand' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'}`}
                  >
                    <td className="px-4 py-3">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-zinc-500">{s.admissionNo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="lg:col-span-3 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 bg-white dark:bg-zinc-900">
        {!student ? (
          <div className="flex flex-col items-center justify-center p-12 text-zinc-400 min-h-[250px]">
            <BookOpen className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              No student selected
            </p>
          </div>
        ) : loadingLedger ? (
          <Spinner />
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-start flex-wrap gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {student.name}
                </h2>
                <p className="text-xs text-zinc-500">
                  Adm: {student.admissionNo}
                  {student.rollNo ? ` · Roll ${student.rollNo}` : ''}
                </p>
              </div>
              <div className="flex gap-4 text-xs bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
                <div>
                  <span className="text-[10px] text-emerald-500 font-semibold uppercase block">
                    Paid
                  </span>
                  <span className="font-mono font-bold">{inr(dues?.totalPaid)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-500 font-semibold uppercase block">
                    Balance
                  </span>
                  <span className="font-mono font-bold">{inr(dues?.totalDue)}</span>
                </div>
              </div>
            </div>
            {rows.length === 0 ? (
              <EmptyState title="No fee activity for this student" />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800/80">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                    {rows.map((tx: any) => (
                      <tr key={tx.id}>
                        <td className="px-4 py-3 font-mono text-zinc-500">{fmtDate(tx.date)}</td>
                        <td className="px-4 py-3 font-medium">{tx.description}</td>
                        <td className="px-4 py-3">
                          <Badge variant={tx.type === 'DEBIT' ? 'danger' : 'success'}>
                            {tx.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-right">
                          {inr(tx.amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {tx.collection && (
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label="Print receipt"
                              onClick={() => {
                                if (
                                  !printFeeReceipt(tx.collection, {
                                    schoolName,
                                    studentName: student.name,
                                    admissionNo: student.admissionNo,
                                  })
                                )
                                  toast.error('Allow pop-ups to print the receipt.');
                              }}
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CollectionsLedger() {
  const { can } = usePermissions();
  const schoolName = useAuthStore((s) => s.activeTenant?.name);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, isPending, error, refetch } = useFeeCollections(page, 15, {
    status: status || undefined,
  });
  const reconcileM = useReconcileCollection();
  const items = asList<any>(data);
  const meta = (data as any)?.meta;

  const reconcile = (id: string) =>
    reconcileM.mutate(id, {
      onSuccess: () => toast.success('Payment confirmed with Razorpay and settled.'),
      onError: (e: any) => toast.error(errMsg(e, 'Could not reconcile this payment.')),
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="w-56">
        <Select
          value={status}
          options={[
            { label: 'All statuses', value: '' },
            { label: 'Paid', value: 'PAID' },
            { label: 'Pending (online)', value: 'PENDING' },
            { label: 'Failed', value: 'FAILED' },
          ]}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        />
      </div>
      {isPending ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="No collections found" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <tr>
                <th className="px-4 py-3">Receipt</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
              {items.map((c: any) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono">{c.receiptNo}</td>
                  <td className="px-4 py-3 font-semibold">
                    {c.student?.name}
                    <span className="block text-[10px] text-zinc-400 font-normal">
                      {c.student?.admissionNo}
                    </span>
                  </td>
                  <td className="px-4 py-3">{c.feeStructure?.name ?? '—'}</td>
                  <td className="px-4 py-3">{c.paymentMethod}</td>
                  <td className="px-4 py-3 font-mono text-zinc-500">
                    {fmtDate(c.paidAt ?? c.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-right">{inr(c.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        c.status === 'PAID'
                          ? 'success'
                          : c.status === 'PENDING'
                            ? 'warning'
                            : 'danger'
                      }
                    >
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      {c.status === 'PENDING' && c.razorpayOrderId && can('fee:update') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          isLoading={reconcileM.isPending && reconcileM.variables === c.id}
                          onClick={() => reconcile(c.id)}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" /> Reconcile
                        </Button>
                      )}
                      {c.status === 'PAID' && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Print receipt"
                          onClick={() => {
                            if (!printFeeReceipt(c, { schoolName }))
                              toast.error('Allow pop-ups to print the receipt.');
                          }}
                        >
                          <Printer className="w-4 h-4" />
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
        <div className="flex items-center justify-end gap-2 text-xs text-zinc-500">
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
    </div>
  );
}

export function LedgersTab() {
  const { isAdmin } = usePermissions();
  const [sub, setSub] = useState(0);
  const tabs = isAdmin
    ? ['Collections & Online Payments', 'Student Ledgers', 'Razorpay Setup']
    : ['Collections & Online Payments', 'Student Ledgers'];
  return (
    <div className="flex flex-col gap-5">
      <TabBar tabs={tabs} active={sub} onChange={setSub} />
      {sub === 0 && <CollectionsLedger />}
      {sub === 1 && <StudentLedgers />}
      {sub === 2 && isAdmin && <RazorpayPanel />}
    </div>
  );
}
