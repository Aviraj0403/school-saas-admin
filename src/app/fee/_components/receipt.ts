import { escapeHtml, fmtDate, inr, printHtml } from '@/components/ops/OpsKit';

/** Prints a fee receipt for a FeeCollection row (as returned by /fee/collect or /fee/collections). */
export function printFeeReceipt(
  c: any,
  opts: { schoolName?: string; studentName?: string; admissionNo?: string; structureName?: string }
): boolean {
  const e = escapeHtml;
  const studentName = opts.studentName ?? c.student?.name ?? '';
  const admissionNo = opts.admissionNo ?? c.student?.admissionNo ?? '';
  const structure = opts.structureName ?? c.feeStructure?.name ?? 'Fee payment';
  const body = `
    <div class="head"><h1>${e(opts.schoolName || 'School')}</h1><h2>Fee Receipt</h2></div>
    <div class="row"><span class="muted">Receipt No</span><span>${e(c.receiptNo)}</span></div>
    <div class="row"><span class="muted">Date</span><span>${e(fmtDate(c.paidAt ?? c.createdAt))}</span></div>
    <div class="row"><span class="muted">Student</span><span>${e(studentName)}${admissionNo ? ` (${e(admissionNo)})` : ''}</span></div>
    <div class="row"><span class="muted">Towards</span><span>${e(structure)}</span></div>
    <div class="row"><span class="muted">Payment mode</span><span>${e(c.paymentMethod)}</span></div>
    <div class="row"><span class="muted">Amount</span><span>${e(inr(c.amount))}</span></div>
    ${Number(c.lateFeeAmount) > 0 ? `<div class="row"><span class="muted">Late fee</span><span>${e(inr(c.lateFeeAmount))}</span></div>` : ''}
    ${Number(c.discountAmount) > 0 ? `<div class="row"><span class="muted">Discount</span><span>- ${e(inr(c.discountAmount))}</span></div>` : ''}
    <div class="row total"><span>Total received</span><span>${e(inr(c.totalAmount))}</span></div>
    ${c.note ? `<p class="muted">Note: ${e(c.note)}</p>` : ''}
    <p class="muted" style="margin-top:32px">This is a computer-generated receipt.</p>`;
  return printHtml(`Receipt ${c.receiptNo ?? ''}`, body);
}
