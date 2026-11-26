'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { DialogFooter, Field, Spinner, errMsg, inr } from '@/components/ops/OpsKit';
import { useCollectFee, useStudentDues } from '@/hooks/queries/useFee';
import { useClasses } from '@/hooks/queries/useAcademics';
import { useStudentsList } from '@/hooks/queries/useStudents';
import { useAuthStore } from '@/store/useAuthStore';
import { asList } from '@/lib/utils';
import { printFeeReceipt } from './receipt';

const OPENING_ID = 'opening-previous-balance';

export function CollectDialog({
  open,
  onClose,
  initialStudent,
}: {
  open: boolean;
  onClose: () => void;
  /** Pre-select a student (from the dues table). */
  initialStudent?: { id: string; classId?: string } | null;
}) {
  const schoolName = useAuthStore((s) => s.activeTenant?.name);
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [structureId, setStructureId] = useState('');
  const [amount, setAmount] = useState('');
  const [late, setLate] = useState('');
  const [discount, setDiscount] = useState('');
  const [method, setMethod] = useState<'CASH' | 'CHEQUE' | 'DD' | 'NEFT'>('CASH');
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState<any | null>(null);

  useEffect(() => {
    if (open && initialStudent) {
      setClassId(initialStudent.classId ?? '');
      setStudentId(initialStudent.id);
    }
  }, [open, initialStudent]);

  const { data: classesData } = useClasses(1, 100);
  const classes = asList<any>(classesData);
  const { data: studentsData } = useStudentsList(1, 100, undefined, classId || undefined);
  const students = asList<any>(studentsData);
  const { data: dues, isPending: loadingDues } = useStudentDues(studentId);
  const collectM = useCollectFee();

  const allOutstanding: any[] = useMemo(() => dues?.outstanding ?? [], [dues]);
  // The opening previous balance is not a fee structure the server can settle against.
  const outstanding = useMemo(
    () => allOutstanding.filter((o) => o.id !== OPENING_ID),
    [allOutstanding]
  );
  const hasOpening = allOutstanding.length !== outstanding.length;
  const selected = outstanding.find((o) => o.id === structureId);
  const remaining = selected ? Number(selected.remainingAmount ?? selected.amount) : 0;

  useEffect(() => {
    // default to the first collectable item so the form is never blank
    if (outstanding.length && !outstanding.some((o) => o.id === structureId)) {
      setStructureId(outstanding[0].id);
      setAmount(String(Number(outstanding[0].remainingAmount ?? outstanding[0].amount)));
    }
  }, [outstanding, structureId]);

  const reset = () => {
    setClassId('');
    setStudentId('');
    setStructureId('');
    setAmount('');
    setLate('');
    setDiscount('');
    setMethod('CASH');
    setNote('');
    setReceipt(null);
  };
  const close = () => {
    reset();
    onClose();
  };

  const amt = Number(amount) || 0;
  const lateAmt = Number(late) || 0;
  const discAmt = Number(discount) || 0;
  const total = Math.max(0, Math.round((amt + lateAmt - discAmt) * 100) / 100);

  const submit = () => {
    if (!studentId) return toast.error('Select a student first.');
    if (!selected) return toast.error('Choose which fee this payment is for.');
    if (!(amt > 0)) return toast.error('Enter an amount greater than zero.');
    if (amt > remaining + 0.005)
      return toast.error(`Amount is more than the ${inr(remaining)} still due on this fee.`);
    if (discAmt > amt + lateAmt) return toast.error('Discount cannot exceed the amount payable.');
    collectM.mutate(
      {
        studentId,
        feeStructureId: selected.id,
        amount: amt,
        lateFeeAmount: lateAmt || undefined,
        discountAmount: discAmt || undefined,
        totalAmount: total,
        paymentMethod: method,
        note: note.trim() || undefined,
      },
      {
        onSuccess: (res: any) => {
          toast.success('Fee receipt recorded.');
          setReceipt({ ...(res?.collection ?? res), structureName: selected.name });
        },
        onError: (e: any) => toast.error(errMsg(e, 'Could not record the payment.')),
      }
    );
  };

  const student = students.find((s: any) => s.id === studentId) ?? dues?.student;

  if (receipt) {
    return (
      <Dialog isOpen={open} onClose={close} title="Receipt recorded">
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Receipt No</span>
            <span className="font-mono">{receipt.receiptNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Student</span>
            <span>{student?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Towards</span>
            <span>{receipt.structureName}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total received</span>
            <span>{inr(receipt.totalAmount)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Done
          </Button>
          <Button
            onClick={() => {
              if (
                !printFeeReceipt(receipt, {
                  schoolName,
                  studentName: student?.name,
                  admissionNo: student?.admissionNo,
                  structureName: receipt.structureName,
                })
              )
                toast.error('Allow pop-ups to print the receipt.');
            }}
          >
            <Printer className="w-4 h-4 mr-1" /> Print Receipt
          </Button>
        </DialogFooter>
      </Dialog>
    );
  }

  return (
    <Dialog isOpen={open} onClose={close} title="Record Fee Collection Receipt">
      <div className="flex flex-col gap-4 py-2">
        <Field label="Class *">
          <Select
            value={classId}
            options={[
              { label: 'Select class...', value: '' },
              ...classes.map((c: any) => ({ label: `${c.name} - ${c.section}`, value: c.id })),
            ]}
            onChange={(e) => {
              setClassId(e.target.value);
              setStudentId('');
              setStructureId('');
            }}
          />
        </Field>
        <Field label="Student *">
          <Select
            value={studentId}
            disabled={!classId}
            options={[
              { label: 'Select student...', value: '' },
              ...students.map((s: any) => ({
                label: `${s.name} (${s.rollNo ? 'Roll ' + s.rollNo : s.admissionNo})`,
                value: s.id,
              })),
            ]}
            onChange={(e) => {
              setStudentId(e.target.value);
              setStructureId('');
            }}
          />
        </Field>

        {studentId &&
          (loadingDues ? (
            <Spinner label="Fetching dues..." />
          ) : (
            <div className="bg-brand/10 border border-brand/20 p-4 rounded-xl text-xs flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
                  Total outstanding
                </span>
                <span className="tabular text-base font-extrabold text-brand">
                  {inr(dues?.totalDue)}
                </span>
              </div>
              {outstanding.length === 0 && (
                <p className="text-emerald-600 font-semibold">
                  Nothing collectable is due for this student.
                </p>
              )}
              {hasOpening && (
                <p className="text-amber-600">
                  Includes an opening balance carried over from a previous school/session, which
                  cannot be collected from this screen.
                </p>
              )}
            </div>
          ))}

        {outstanding.length > 0 && (
          <>
            <Field label="Fee being paid *">
              <Select
                value={structureId}
                options={outstanding.map((o) => ({
                  label: `${o.name} — due ${inr(o.remainingAmount ?? o.amount)}`,
                  value: o.id,
                }))}
                onChange={(e) => {
                  setStructureId(e.target.value);
                  const o = outstanding.find((x) => x.id === e.target.value);
                  if (o) setAmount(String(Number(o.remainingAmount ?? o.amount)));
                }}
              />
            </Field>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3">
              <Field label="Amount (₹) *">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={remaining}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
              <Field label="Late fee">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={late}
                  onChange={(e) => setLate(e.target.value)}
                />
              </Field>
              <Field label="Discount">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </Field>
            </div>
            <div className="rounded-xl bg-muted/60 px-3 py-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                Max for this fee: <b className="tabular text-foreground">{inr(remaining)}</b>
              </span>
              <span>
                Total to receive: <b className="tabular text-base text-foreground">{inr(total)}</b>
              </span>
            </div>
            <Field label="Payment mode *">
              <Select
                value={method}
                options={[
                  { label: 'Cash', value: 'CASH' },
                  { label: 'Cheque', value: 'CHEQUE' },
                  { label: 'Demand draft', value: 'DD' },
                  { label: 'NEFT / bank transfer', value: 'NEFT' },
                ]}
                onChange={(e) => setMethod(e.target.value as any)}
              />
            </Field>
            <Field label="Note">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Cheque no / transaction reference..."
              />
            </Field>
          </>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button
          onClick={submit}
          isLoading={collectM.isPending}
          disabled={!studentId || outstanding.length === 0}
        >
          Record Receipt
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
