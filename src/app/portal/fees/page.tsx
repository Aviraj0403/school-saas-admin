'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { CreditCard, Printer, Receipt } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import { QueryState, errorMessage } from '@/components/portal/QueryState';
import { loadRazorpay, openRazorpay, RazorpaySuccess } from '@/components/portal/razorpay';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
    <div className="flex flex-col gap-4 sm:gap-6">
      <QueryState query={fees}>
        <section className="relative overflow-hidden rounded-3xl bg-brand-gradient p-5 text-white shadow-glow sm:p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-white/80">Amount due</p>
          <p className="tabular mt-1 text-4xl font-semibold leading-tight">{inr(totalDue)}</p>
          <p className="mt-1 text-sm text-white/80">
            {totalDue > 0
              ? `${data?.outstanding?.length ?? 0} fee item(s) pending · Paid so far ${inr(data?.totalPaid)}`
              : `All clear · Paid so far ${inr(data?.totalPaid)}`}
          </p>
          {totalDue > 0 && (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={totalDue}
                placeholder={`Amount (default ${inr(totalDue)})`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 w-full bg-white text-zinc-900 sm:max-w-64"
              />
              <button
                onClick={pay}
                disabled={paying}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-[15px] font-semibold text-zinc-900 shadow-lg transition active:scale-[0.98] disabled:opacity-60 sm:w-auto sm:px-8"
              >
                <CreditCard className="size-4" /> {paying ? 'Starting…' : 'Pay now'}
              </button>
            </div>
          )}
        </section>

        {(data?.outstanding ?? []).length > 0 && (
          <section className="surface-card p-4 sm:p-6">
            <h3 className="text-card-title mb-3">Dues</h3>
            <ul className="space-y-2">
              {data.outstanding.map((o: any) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{o.name}</div>
                    <div className="text-caption tabular">
                      {o.dueDate ? `Due ${formatDate(o.dueDate)} · ` : ''}
                      {inr(o.paidAmount)} of {inr(o.amount)} paid
                    </div>
                  </div>
                  <span className="tabular shrink-0 font-semibold text-rose-600">
                    {inr(o.remainingAmount)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="surface-card p-4 sm:p-6">
          <h3 className="text-card-title mb-3">Receipts</h3>
          {(data?.paid ?? []).length === 0 ? (
            <p className="text-caption">No payments recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.paid.map((p: any) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold">
                      {p.feeStructure?.name ?? 'Fee payment'}
                    </div>
                    <div className="text-caption truncate">
                      {p.receiptNo} · {formatDate(p.paidAt ?? p.createdAt)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="tabular font-semibold">{inr(p.totalAmount)}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Print receipt"
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
                      <Printer />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </QueryState>

      <section className="surface-card p-4 sm:p-6">
        <h3 className="text-card-title mb-3">Payment history</h3>
        <QueryState
          query={payments}
          isEmpty={(payments.data ?? []).length === 0}
          emptyText="No online payments have been made yet."
          emptyIcon={Receipt}
        >
          <ul className="space-y-2">
            {(payments.data ?? []).map((p: any) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold">{p.receiptNo}</div>
                  <div className="text-caption">{formatDate(p.paidAt ?? p.createdAt)}</div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="tabular font-semibold">{inr(p.totalAmount)}</span>
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
