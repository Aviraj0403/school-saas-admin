'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { CreditCard, IndianRupee, Printer, Receipt } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import { QueryState, errorMessage } from '@/components/portal/QueryState';
import { loadRazorpay, openRazorpay, RazorpaySuccess } from '@/components/portal/razorpay';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/ui/StatCard';
import {
  useFamilyFees,
  useFamilyPayments,
  useInitiateFamilyPayment,
  useVerifyFamilyPayment,
} from '@/hooks/queries/useFamily';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate } from '@/lib/format';
import { inr } from '@/components/dashboard/kit';

const esc = (v: unknown) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );

function printReceipt(
  r: { receiptNo: string; amount: number; date: any; head?: string },
  studentName: string
) {
  const w = window.open('', '_blank', 'width=700,height=700');
  if (!w) {
    toast.error('Allow pop-ups to print the receipt');
    return;
  }
  w.document.write(`<!doctype html><html><head><title>Receipt ${esc(r.receiptNo)}</title>
<style>body{font-family:Arial,sans-serif;padding:32px;color:#111}table{width:100%;border-collapse:collapse;margin-top:16px}td{border:1px solid #999;padding:10px;font-size:14px}td:first-child{background:#f1f1f1;width:35%}</style></head>
<body><h2>Fee Receipt</h2><table>
<tr><td>Receipt no.</td><td>${esc(r.receiptNo)}</td></tr>
<tr><td>Student</td><td>${esc(studentName)}</td></tr>
${r.head ? `<tr><td>Fee head</td><td>${esc(r.head)}</td></tr>` : ''}
<tr><td>Amount paid</td><td>&#8377;${esc(Number(r.amount).toLocaleString('en-IN'))}</td></tr>
<tr><td>Date</td><td>${esc(formatDate(r.date))}</td></tr></table>
<script>window.onload=function(){window.print()}</script></body></html>`);
  w.document.close();
}

function FeesView({ studentId, studentName }: { studentId: string; studentName: string }) {
  const qc = useQueryClient();
  const fees = useFamilyFees(studentId);
  const payments = useFamilyPayments(studentId);
  const initiate = useInitiateFamilyPayment();
  const verify = useVerifyFamilyPayment();
  const [amount, setAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const data = fees.data;
  const totalDue = Number(data?.totalDue ?? 0);

  const pay = async () => {
    const value = amount ? Number(amount) : undefined;
    if (value !== undefined && (!(value >= 1) || value > totalDue)) {
      toast.error(`Enter an amount between ₹1 and ${inr(totalDue)}`);
      return;
    }
    setPaying(true);
    try {
      const order = await initiate.mutateAsync({ studentId, amount: value });
      const ready = await loadRazorpay();
      if (!ready) {
        toast.error('Could not load the payment window. Check your connection and try again.');
        return;
      }
      const rzp = openRazorpay({
        key: order.razorpayKeyId,
        order_id: order.razorpayOrderId,
        amount: Math.round(Number(order.amount) * 100),
        currency: order.currency ?? 'INR',
        name: 'School fee payment',
        description: `${order.studentName ?? studentName} — receipt ${order.receiptNo}`,
        prefill: order.prefill,
        theme: { color: '#4f46e5' },
        modal: {
          ondismiss: () => {
            qc.invalidateQueries({ queryKey: ['family', 'payments'] });
          },
        },
        handler: (resp: RazorpaySuccess) => {
          verify.mutate(
            {
              orderId: resp.razorpay_order_id,
              paymentId: resp.razorpay_payment_id,
              signature: resp.razorpay_signature,
            },
            {
              onSuccess: () => {
                toast.success('Payment received. Thank you!');
                setAmount('');
              },
              onError: (e) =>
                toast.error(
                  errorMessage(e, 'Payment made but confirmation failed') +
                    ' — it will update automatically once the bank confirms.'
                ),
            }
          );
        },
      });
      rzp.on('payment.failed', (r: any) =>
        toast.error(r?.error?.description ?? 'Payment failed. You have not been charged.')
      );
      rzp.open();
    } catch (e) {
      // Includes "online payments are not enabled for this school".
      toast.error(errorMessage(e, 'Could not start the payment'));
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <QueryState query={fees}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total due"
            value={inr(totalDue)}
            icon={IndianRupee}
            gradientClass="from-pink-500 to-rose-500"
            footerText={totalDue > 0 ? 'Outstanding balance' : 'All clear'}
          />
          <StatCard
            label="Total paid"
            value={inr(data?.totalPaid)}
            icon={Receipt}
            gradientClass="from-emerald-400 to-teal-500"
            footerText="This session"
          />
          <StatCard
            label="Fee heads pending"
            value={data?.outstanding?.length ?? 0}
            icon={CreditCard}
            gradientClass="from-amber-400 to-orange-500"
            footerText="Items with a balance"
          />
        </div>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-lg font-semibold">Dues</h3>
            {totalDue > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={totalDue}
                  placeholder={`Amount (default ${inr(totalDue)})`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-52"
                />
                <Button onClick={pay} isLoading={paying}>
                  <CreditCard /> Pay online
                </Button>
              </div>
            )}
          </div>
          {(data?.outstanding ?? []).length === 0 ? (
            <p className="text-sm text-zinc-500">No fees are outstanding. 🎉</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-zinc-400">
                    <th className="py-2 pr-3">Fee</th>
                    <th className="py-2 pr-3">Amount</th>
                    <th className="py-2 pr-3">Paid</th>
                    <th className="py-2">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.outstanding.map((o: any) => (
                    <tr key={o.id} className="border-b border-border last:border-0">
                      <td className="py-2.5 pr-3">
                        <div className="font-medium">{o.name}</div>
                        {o.dueDate && (
                          <div className="text-xs text-zinc-500">Due {formatDate(o.dueDate)}</div>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">{inr(o.amount)}</td>
                      <td className="py-2.5 pr-3">{inr(o.paidAmount)}</td>
                      <td className="py-2.5 font-semibold">{inr(o.remainingAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
          <h3 className="mb-4 font-display text-lg font-semibold">Receipts</h3>
          {(data?.paid ?? []).length === 0 ? (
            <p className="text-sm text-zinc-500">No payments recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.paid.map((p: any) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <div className="font-semibold">{p.feeStructure?.name ?? 'Fee payment'}</div>
                    <div className="text-xs text-zinc-500">
                      {p.receiptNo} · {formatDate(p.paidAt ?? p.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{inr(p.totalAmount)}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        printReceipt(
                          {
                            receiptNo: p.receiptNo,
                            amount: p.totalAmount,
                            date: p.paidAt ?? p.createdAt,
                            head: p.feeStructure?.name,
                          },
                          studentName
                        )
                      }
                    >
                      <Printer /> Receipt
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </QueryState>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
        <h3 className="mb-4 font-display text-lg font-semibold">Online payment history</h3>
        <QueryState
          query={payments}
          isEmpty={(payments.data ?? []).length === 0}
          emptyText="No online payments have been made yet."
          emptyIcon={CreditCard}
        >
          <ul className="space-y-2">
            {(payments.data ?? []).map((p: any) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm"
              >
                <div>
                  <div className="font-semibold">{p.receiptNo}</div>
                  <div className="text-xs text-zinc-500">{formatDate(p.paidAt ?? p.createdAt)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{inr(p.totalAmount)}</span>
                  <Badge
                    variant={
                      p.status === 'PAID'
                        ? 'success'
                        : p.status === 'PENDING'
                          ? 'warning'
                          : 'danger'
                    }
                  >
                    {p.status === 'PENDING' ? 'Pending' : p.status === 'PAID' ? 'Paid' : p.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </QueryState>
      </section>
    </div>
  );
}

export default function PortalFeesPage() {
  return (
    <PortalShell title="Fees & Payments" description="Dues, online payment and receipts">
      {({ studentId, child }) => <FeesView studentId={studentId} studentName={child.name} />}
    </PortalShell>
  );
}
