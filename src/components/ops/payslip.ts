import { escapeHtml, fmtDate, inr, printHtml } from './OpsKit';

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function printPayslip(
  p: any,
  opts: { schoolName?: string; employeeName?: string }
): boolean {
  const e = escapeHtml;
  const name = opts.employeeName ?? p.user?.name ?? '';
  const earnings = (Number(p.baseSalary) || 0) + (Number(p.hra) || 0) + (Number(p.allowance) || 0);
  const body = `
    <div class="head"><h1>${e(opts.schoolName || 'School')}</h1><h2>Payslip — ${e(MONTH_NAMES[(p.month ?? 1) - 1])} ${e(p.year)}</h2></div>
    <div class="row"><span class="muted">Employee</span><span>${e(name)}</span></div>
    <div class="row"><span class="muted">Basic salary</span><span>${e(inr(p.baseSalary))}</span></div>
    <div class="row"><span class="muted">HRA</span><span>${e(inr(p.hra))}</span></div>
    <div class="row"><span class="muted">Allowances</span><span>${e(inr(p.allowance))}</span></div>
    <div class="row"><span class="muted">Gross earnings</span><span>${e(inr(earnings))}</span></div>
    <div class="row"><span class="muted">Deductions</span><span>- ${e(inr(p.deductions))}</span></div>
    ${Number(p.leaveDeduction) > 0 ? `<div class="row"><span class="muted">Unpaid leave deduction (${e(p.unpaidLeaves ?? 0)} days)</span><span>- ${e(inr(p.leaveDeduction))}</span></div>` : ''}
    <div class="row total"><span>Net salary</span><span>${e(inr(p.netSalary))}</span></div>
    <p class="muted">Status: ${e(p.status)}${p.paidAt ? ` on ${e(fmtDate(p.paidAt))}` : ''}${p.paymentMethod ? ` via ${e(p.paymentMethod)}` : ''}</p>
    <p class="muted" style="margin-top:32px">This is a computer-generated payslip.</p>`;
  return printHtml(`Payslip ${name}`, body);
}
