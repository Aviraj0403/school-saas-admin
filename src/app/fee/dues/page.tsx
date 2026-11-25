'use client';

import React, { useState } from 'react';
import { BellRing } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState, ErrorState, Panel, Spinner, errMsg, inr } from '@/components/ops/OpsKit';
import { usePermissions } from '@/hooks/usePermissions';
import { usePendingByClass, usePendingSummary, useSendFeeReminders } from '@/hooks/queries/useFee';
import { CollectDialog } from '../_components/CollectDialog';

export default function FeeDuesPage() {
  const { can, isAdmin, isRole, hasModule } = usePermissions();
  const canFinance = isAdmin || isRole('accountant');
  const canRemind = canFinance && hasModule('whatsapp');

  const [classId, setClassId] = useState('');
  const [collectFor, setCollectFor] = useState<{ id: string; classId?: string } | null>(null);

  const summary = usePendingSummary(canFinance);
  const students = usePendingByClass(classId);
  const remindM = useSendFeeReminders();

  const rows = summary.data ?? [];
  const totalPending = rows.reduce((a, r) => a + Number(r.pendingAmount || 0), 0);
  const totalStudents = rows.reduce((a, r) => a + Number(r.pendingCount || 0), 0);

  const sendReminders = () => {
    if (!confirm('Send WhatsApp fee-due reminders to parents with upcoming dues?')) return;
    remindM.mutate(3, {
      onSuccess: () => toast.success('Fee reminders queued.'),
      onError: (e: any) => toast.error(errMsg(e, 'Could not send reminders.')),
    });
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Fee Dues & Defaulters" />
      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Fee Dues &amp; Defaulters
            </h1>
            <p className="text-sm text-zinc-500">Outstanding fees by class and by student</p>
          </div>
          {canRemind && (
            <Button onClick={sendReminders} isLoading={remindM.isPending}>
              <BellRing className="w-4 h-4 mr-2" /> Send Reminders
            </Button>
          )}
        </div>

        {!canFinance ? (
          <Panel>
            <EmptyState
              title="Fee dues are visible to the accountant and school admin."
              hint="Your role can view fee structures from the Fee page."
            />
          </Panel>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <StatCard
                label="Total Pending"
                value={inr(totalPending)}
                icon="pi pi-wallet"
                gradientClass="from-rose-500 to-red-500"
                iconBgClass="bg-rose-500/10"
                iconColorClass="text-rose-600"
                footerText="All classes"
              />
              <StatCard
                label="Students with Dues"
                value={String(totalStudents)}
                icon="pi pi-users"
                gradientClass="from-amber-500 to-orange-500"
                iconBgClass="bg-amber-500/10"
                iconColorClass="text-amber-600"
                footerText={`${rows.length} classes affected`}
              />
            </div>

            <Panel>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="w-64">
                  <Select
                    value={classId}
                    options={[
                      { label: 'All classes (summary)', value: '' },
                      ...rows.map((r) => ({
                        label: `${r.className} - ${r.section}`,
                        value: r.classId,
                      })),
                    ]}
                    onChange={(e) => setClassId(e.target.value)}
                  />
                </div>
              </div>

              {!classId ? (
                summary.isPending ? (
                  <Spinner />
                ) : summary.error ? (
                  <ErrorState error={summary.error} onRetry={() => summary.refetch()} />
                ) : rows.length === 0 ? (
                  <EmptyState title="No pending dues" hint="Every student is fully paid." />
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800/80">
                        <tr>
                          <th className="px-4 py-3">Class</th>
                          <th className="px-4 py-3">Students pending</th>
                          <th className="px-4 py-3 text-right">Amount pending</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                        {rows.map((r) => (
                          <tr key={r.classId}>
                            <td className="px-4 py-3 font-semibold">
                              {r.className} - {r.section}
                            </td>
                            <td className="px-4 py-3">{r.pendingCount}</td>
                            <td className="px-4 py-3 font-mono font-bold text-right text-rose-600">
                              {inr(r.pendingAmount)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setClassId(r.classId)}
                              >
                                View students
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : students.isPending ? (
                <Spinner />
              ) : students.error ? (
                <ErrorState error={students.error} onRetry={() => students.refetch()} />
              ) : (students.data ?? []).length === 0 ? (
                <EmptyState title="No defaulters in this class" />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Adm. No</th>
                        <th className="px-4 py-3">Roll</th>
                        <th className="px-4 py-3 text-right">Due</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {(students.data ?? []).map((s) => (
                        <tr key={s.studentId}>
                          <td className="px-4 py-3 font-semibold">{s.name}</td>
                          <td className="px-4 py-3 font-mono text-zinc-500">{s.admissionNo}</td>
                          <td className="px-4 py-3">{s.rollNo ?? '—'}</td>
                          <td className="px-4 py-3 font-mono font-bold text-right text-rose-600">
                            {inr(s.totalDue)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {can('fee:create') && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  setCollectFor({ id: s.studentId, classId: s.classId })
                                }
                              >
                                Collect
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </>
        )}
      </div>
      <CollectDialog
        open={!!collectFor}
        onClose={() => setCollectFor(null)}
        initialStudent={collectFor}
      />
    </DashboardLayout>
  );
}
