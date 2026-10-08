'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/StatCard';
import {
  useFeeStructures,
  useCreateFeeStructure,
  useCollectFee,
  useFeeCollections,
  useRevenueSummary,
  useStudentDues,
} from '@/hooks/queries/useFee';
import { useClasses } from '@/hooks/queries/useAcademics';
import { AcademicYearSelect } from '@/components/academics/AcademicYearSelect';
import { useStudentsList } from '@/hooks/queries/useStudents';
import { useStaffList } from '@/hooks/queries/useStaff';
import { toast } from 'sonner';

import {
  useSalaryStructure,
  useUpsertSalaryStructure,
  useGeneratePayslips,
  usePayslips,
  usePayPayslip,
  useFinanceSummary,
} from '@/hooks/queries/usePayroll';
import {
  Wallet,
  CreditCard,
  TrendingUp,
  Plus,
  DollarSign,
  Cog,
  BookOpen,
  CheckCircle,
} from 'lucide-react';

export default function FeePage() {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (pathname.includes('/slabs') || tabParam === 'slabs') setActiveTab(0);
      else if (pathname.includes('/ledgers') || tabParam === 'ledgers') setActiveTab(1);
      else if (pathname.includes('/payroll') || tabParam === 'payroll') setActiveTab(2);
    }
  }, []);

  const [showAddStructureDialog, setShowAddStructureDialog] = useState(false);
  const [showCollectFeeDialog, setShowCollectFeeDialog] = useState(false);

  // Form states
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [newStructure, setNewStructure] = useState({
    name: '',
    amount: 1000,
    type: 'TUITION',
    classId: '',
    academicYearId: '',
  });
  const [collectFee, setCollectFee] = useState({
    studentId: '',
    amount: 0,
    paymentMethod: 'CASH' as 'CASH' | 'ONLINE' | 'CHEQUE',
    remarks: '',
  });

  // Student Ledger datasets
  const [selectedStudentLedger, setSelectedStudentLedger] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Real Student Ledger Query
  const { data: ledgerDuesData, isPending: loadingLedger } = useStudentDues(selectedStudentId);

  // Staff Payroll section states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUserForSalary, setSelectedUserForSalary] = useState<string>('');
  const [showSalaryStructureDialog, setShowSalaryStructureDialog] = useState(false);
  const [salaryForm, setSalaryForm] = useState({
    baseSalary: 25000,
    hra: 5000,
    allowance: 3000,
    deductions: 1000,
  });
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [selectedPayslipId, setSelectedPayslipId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');

  // Queries
  const { data: structures, isPending: loadingStructures } = useFeeStructures();
  const { data: collections, isPending: loadingCollections } = useFeeCollections(1, 10);
  const { data: revenueSummary } = useRevenueSummary();
  const { data: staffData } = useStaffList(1, 100);

  const { data: classesData } = useClasses(1, 100);
  const classesList = classesData?.data?.items || classesData?.items || [];
  const classOptions = [
    { label: 'Select Class...', value: '' },
    ...classesList.map((c: any) => ({ label: `${c.name} - ${c.section}`, value: c.id })),
  ];

  const { data: studentsData } = useStudentsList(1, 100, undefined, selectedClassId || undefined);
  const studentsList = studentsData?.data?.items || studentsData?.items || [];
  const studentOptions = [
    { label: 'Select Student...', value: '' },
    ...studentsList.map((s: any) => ({
      label: `${s.name} (${s.rollNo ? 'Roll: ' + s.rollNo : s.admissionNo})`,
      value: s.id,
    })),
  ];

  const { data: duesData } = useStudentDues(collectFee.studentId);

  const { data: payslips, isPending: loadingPayslips } = usePayslips({
    month: selectedMonth,
    year: selectedYear,
  });
  const { data: activeStructure } = useSalaryStructure(selectedUserForSalary);

  const createStructureMutation = useCreateFeeStructure();
  const collectFeeMutation = useCollectFee();
  const generatePayslipsMutation = useGeneratePayslips();
  const upsertStructureMutation = useUpsertSalaryStructure();
  const payPayslipMutation = usePayPayslip();

  useEffect(() => {
    if (activeStructure) {
      setSalaryForm({
        baseSalary: activeStructure.baseSalary || 0,
        hra: activeStructure.hra || 0,
        allowance: activeStructure.allowance || 0,
        deductions: activeStructure.deductions || 0,
      });
    }
  }, [activeStructure]);

  const handleCreateStructure = () => {
    if (!newStructure.name) {
      toast.error('Structure name is required.');
      return;
    }
    createStructureMutation.mutate(newStructure, {
      onSuccess: () => {
        setShowAddStructureDialog(false);
        setNewStructure({
          name: '',
          amount: 1000,
          type: 'TUITION',
          classId: '',
          academicYearId: '',
        });
        toast.success('Fee structure slab saved.');
      },
      onError: () => toast.error('Failed to create fee structure.'),
    });
  };

  const handleCollectFee = () => {
    if (!collectFee.studentId || collectFee.amount <= 0) {
      toast.error('Student selection and valid amount are required.');
      return;
    }
    collectFeeMutation.mutate(collectFee, {
      onSuccess: () => {
        toast.success('Fee receipt recorded successfully.');
        setShowCollectFeeDialog(false);
        setCollectFee({ studentId: '', amount: 0, paymentMethod: 'CASH', remarks: '' });
      },
      onError: () => toast.error('Failed to record fee receipt.'),
    });
  };

  const handleGeneratePayslips = () => {
    generatePayslipsMutation.mutate(
      { month: selectedMonth, year: selectedYear },
      {
        onSuccess: () => toast.success(`Payslips generated for ${selectedMonth}/${selectedYear}.`),
        onError: () => toast.error('Failed to generate payslips.'),
      }
    );
  };

  const handlePaySalary = () => {
    if (!selectedPayslipId) return;
    payPayslipMutation.mutate(
      { id: selectedPayslipId, paymentMethod },
      {
        onSuccess: () => {
          setShowPayoutDialog(false);
          toast.success('Salary transaction disbursed.');
        },
        onError: () => toast.error('Failed to disburse salary.'),
      }
    );
  };

  const staffList = staffData?.items || [];

  const getStaffName = (userId: string) => {
    const staff = staffList.find((s: any) => s.id === userId || s.userId === userId);
    return staff?.name || 'Faculty Member';
  };

  const monthsList = [
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 },
  ];

  const yearsList = [
    { label: '2025', value: 2025 },
    { label: '2026', value: 2026 },
    { label: '2027', value: 2027 },
  ];

  const totalRevenue = Number(revenueSummary?.totalRevenue ?? revenueSummary?.totalCollected ?? 0);
  const totalSalaries = (payslips || []).reduce(
    (acc: number, p: any) => acc + (p.status === 'PAID' ? p.netSalary : 0),
    0
  );
  const netFinProfit = totalRevenue - totalSalaries;

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Fee & Finance" />
      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        {/* Header Block */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Wallet className="w-6 h-6 text-brand" />
              School Finance Console
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Manage fee structures, student billing ledgers, and staff payroll payouts
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 0 && (
              <Button onClick={() => setShowAddStructureDialog(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Structure Slab
              </Button>
            )}
            {activeTab === 1 && (
              <Button onClick={() => setShowCollectFeeDialog(true)}>
                <DollarSign className="w-4 h-4 mr-2" /> Record Fee Receipt
              </Button>
            )}
            {activeTab === 2 && (
              <Button
                onClick={handleGeneratePayslips}
                isLoading={generatePayslipsMutation.isPending}
              >
                <Cog className="w-4 h-4 mr-2" /> Generate Payslips
              </Button>
            )}
          </div>
        </div>

        {/* Finance Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard
            label="Total Revenue Collected"
            value={`₹${totalRevenue.toLocaleString('en-IN')}`}
            icon="pi pi-wallet"
            gradientClass="from-emerald-500 to-teal-500"
            iconBgClass="bg-emerald-500/10 dark:bg-emerald-500/20"
            iconColorClass="text-emerald-600 dark:text-emerald-400"
            footerText="Total fees and dues collected"
          />
          <StatCard
            label="Staff Payroll Expenses"
            value={`₹${totalSalaries.toLocaleString('en-IN')}`}
            icon="pi pi-credit-card"
            gradientClass="from-rose-500 to-red-500"
            iconBgClass="bg-rose-500/10 dark:bg-rose-500/20"
            iconColorClass="text-rose-600 dark:text-rose-400"
            footerText="Total salary disbursed"
          />
          <StatCard
            label="Net Operating Cashflow"
            value={`₹${netFinProfit.toLocaleString('en-IN')}`}
            icon="pi pi-chart-line"
            gradientClass="from-blue-500 to-blue-500"
            iconBgClass="bg-blue-500/10 dark:bg-blue-500/20"
            iconColorClass="text-blue-600 dark:text-blue-400"
            footerText="Revenue - Payroll"
          />
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 w-fit">
          <button
            onClick={() => {
              setActiveTab(0);
              window.history.pushState({}, '', '/fee/slabs');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 0
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Fee Slabs & Structures
          </button>
          <button
            onClick={() => {
              setActiveTab(1);
              window.history.pushState({}, '', '/fee/ledgers');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 1
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Student Fee Ledgers
          </button>
          <button
            onClick={() => {
              setActiveTab(2);
              window.history.pushState({}, '', '/fee/payroll');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 2
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Teacher & Staff Payroll
          </button>
        </div>

        {/* Tab Boards */}
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm">
          {/* Tab 0: Fee Slabs */}
          {activeTab === 0 && (
            <div>
              {loadingStructures ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-zinc-500">Loading structures...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {((structures as any)?.data || structures || []).map((struct: any) => (
                    <div
                      key={struct.id}
                      className="border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-xl bg-white dark:bg-zinc-900 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base leading-snug">
                          {struct.name}
                        </h3>
                        <Badge variant="info">{struct.type}</Badge>
                      </div>
                      <div className="flex justify-between items-baseline border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-1">
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
                          Amount Slab
                        </span>
                        <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                          ₹{struct.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 1: Student Ledgers */}
          {activeTab === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Students list */}
              <div className="lg:col-span-2 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col gap-3 bg-zinc-50/50 dark:bg-zinc-900/30">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Student Directory
                  </h2>
                  <p className="text-xs text-zinc-500">Select a student to audit transactions</p>
                </div>

                <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Admission No</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {studentsList.map((s: any) => {
                        const isSel = selectedStudentLedger?.id === s.id;
                        return (
                          <tr
                            key={s.id}
                            onClick={() => {
                              setSelectedStudentLedger(s);
                              setSelectedStudentId(s.id);
                            }}
                            className={`cursor-pointer transition-colors ${
                              isSel
                                ? 'bg-brand/10 dark:bg-brand/20 font-semibold text-brand'
                                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                            }`}
                          >
                            <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{s.name}</td>
                            <td className="px-4 py-3 font-mono text-zinc-500">{s.admissionNo}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ledger sheet */}
              <div className="lg:col-span-3 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 flex flex-col gap-4 bg-white dark:bg-zinc-900">
                {selectedStudentLedger ? (
                  <div className="flex flex-col gap-5">
                    <div className="flex justify-between items-start flex-wrap gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                      <div>
                        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                          {selectedStudentLedger.name}
                        </h2>
                        <p className="text-xs text-zinc-500">
                          Roll: {selectedStudentLedger.rollNo || 'N/A'} · Adm:{' '}
                          {selectedStudentLedger.admissionNo}
                        </p>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl text-xs flex gap-4 border border-zinc-200/60 dark:border-zinc-800/60">
                        <div>
                          <span className="text-[10px] text-zinc-400 font-semibold uppercase block">
                            Billed
                          </span>
                          <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                            ₹
                            {(
                              (ledgerDuesData?.totalDue || 0) + (ledgerDuesData?.totalPaid || 0)
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-500 font-semibold uppercase block">
                            Paid
                          </span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{(ledgerDuesData?.totalPaid || 0).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-rose-500 font-semibold uppercase block">
                            Balance
                          </span>
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                            ₹{(ledgerDuesData?.totalDue || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {loadingLedger ? (
                      <div className="p-8 text-center text-zinc-500">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                            <tr>
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">Description</th>
                              <th className="px-4 py-3">Type</th>
                              <th className="px-4 py-3 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                            {[
                              ...(ledgerDuesData?.outstanding || []).map((o: any) => ({
                                id: `out-${o.id}`,
                                date: o.createdAt,
                                description: `${o.name} (Unpaid)`,
                                type: 'DEBIT',
                                amount: o.amount,
                              })),
                              ...(ledgerDuesData?.paid || []).map((p: any) => ({
                                id: `paid-${p.id}`,
                                date: p.paidAt,
                                description: `Paid: ${p.feeStructure?.name || 'Fee'} via ${p.paymentMethod}`,
                                type: 'CREDIT',
                                amount: p.totalAmount,
                              })),
                            ]
                              .sort(
                                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                              )
                              .map((tx: any) => (
                                <tr
                                  key={tx.id}
                                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                                >
                                  <td className="px-4 py-3 font-mono text-zinc-500">
                                    {new Date(tx.date).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                                    {tx.description}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant={tx.type === 'DEBIT' ? 'danger' : 'success'}>
                                      {tx.type}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 font-mono font-bold text-right text-zinc-900 dark:text-zinc-100">
                                    ₹{Number(tx.amount).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-zinc-400 min-h-[250px]">
                    <BookOpen className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      No Student Selected
                    </p>
                    <span className="text-[11px] text-zinc-500 mt-1">
                      Select a student from the directory on the left.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: HR Payroll payouts */}
          {activeTab === 2 && (
            <div className="flex flex-col gap-6">
              {/* Payroll Header */}
              <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 flex-wrap">
                <div className="flex flex-col gap-1 w-40">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Month
                  </label>
                  <Select
                    value={selectedMonth.toString()}
                    options={monthsList.map((m) => ({ label: m.label, value: m.value.toString() }))}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  />
                </div>
                <div className="flex flex-col gap-1 w-32">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Year
                  </label>
                  <Select
                    value={selectedYear.toString()}
                    options={yearsList.map((y) => ({ label: y.label, value: y.value.toString() }))}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Payslips Table */}
              <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                    <tr>
                      <th className="px-4 py-3">Employee Name</th>
                      <th className="px-4 py-3">Base (₹)</th>
                      <th className="px-4 py-3">HRA (₹)</th>
                      <th className="px-4 py-3">Allowances (₹)</th>
                      <th className="px-4 py-3">Deductions (₹)</th>
                      <th className="px-4 py-3 font-bold">Net Salary (₹)</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-center">Payout Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                    {loadingPayslips ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                          <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-brand border-t-transparent" />
                        </td>
                      </tr>
                    ) : payslips?.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                          No payslips generated for this term.
                        </td>
                      </tr>
                    ) : (
                      payslips?.map((d: any) => (
                        <tr key={d.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                            {getStaffName(d.userId)}
                          </td>
                          <td className="px-4 py-3 font-mono">₹{d.baseSalary?.toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono">₹{d.hra?.toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono">₹{d.allowance?.toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-rose-500">
                            ₹{d.deductions?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-brand">
                            ₹{d.netSalary?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={d.status === 'PAID' ? 'success' : 'danger'}>
                              {d.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {d.status === 'PENDING' ? (
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => {
                                  setSelectedPayslipId(d.id);
                                  setShowPayoutDialog(true);
                                }}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" /> Disburse
                              </Button>
                            ) : (
                              <span className="text-[10px] text-zinc-400 font-mono">
                                Paid via {d.paymentMethod}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog: Add Structure */}
      <Dialog
        isOpen={showAddStructureDialog}
        onClose={() => setShowAddStructureDialog(false)}
        title="Create Fee Structure Slab"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Structure Name *
            </label>
            <Input
              value={newStructure.name}
              onChange={(e) => setNewStructure({ ...newStructure, name: e.target.value })}
              placeholder="e.g. Tuition Fee Q1"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Amount (₹) *
            </label>
            <Input
              type="number"
              value={newStructure.amount}
              onChange={(e) => setNewStructure({ ...newStructure, amount: Number(e.target.value) })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Fee Category *
            </label>
            <Select
              value={newStructure.type}
              options={[
                { label: 'Tuition', value: 'TUITION' },
                { label: 'Transport', value: 'TRANSPORT' },
                { label: 'Exam', value: 'EXAM' },
                { label: 'Hostel', value: 'HOSTEL' },
              ]}
              onChange={(e) => setNewStructure({ ...newStructure, type: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Academic Year *
            </label>
            <AcademicYearSelect
              value={newStructure.academicYearId}
              onChange={(id) => setNewStructure({ ...newStructure, academicYearId: id })}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowAddStructureDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateStructure} isLoading={createStructureMutation.isPending}>
            Save Slab
          </Button>
        </div>
      </Dialog>

      {/* Dialog: Collect Fee */}
      <Dialog
        isOpen={showCollectFeeDialog}
        onClose={() => {
          setShowCollectFeeDialog(false);
          setSelectedClassId('');
          setCollectFee({ studentId: '', amount: 0, paymentMethod: 'CASH', remarks: '' });
        }}
        title="Record Fee Collection Receipt"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Class *
            </label>
            <Select
              value={selectedClassId}
              options={classOptions}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setCollectFee({ ...collectFee, studentId: '' });
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Student *
            </label>
            <Select
              value={collectFee.studentId}
              options={studentOptions}
              onChange={(e) => setCollectFee({ ...collectFee, studentId: e.target.value })}
              disabled={!selectedClassId}
            />
          </div>

          {collectFee.studentId && duesData && (
            <div className="bg-brand/10 border border-brand/20 p-4 rounded-xl text-xs flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-zinc-500 uppercase tracking-widest text-[9px]">
                  Total Outstanding Dues:
                </span>
                <span className="text-sm font-extrabold text-brand">
                  ₹
                  {Number(duesData.totalDue || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              {duesData.outstanding && duesData.outstanding.length > 0 && (
                <div className="mt-1 border-t border-brand/20 pt-2 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                    Dues breakdown:
                  </span>
                  {duesData.outstanding.map((out: any) => (
                    <div
                      key={out.id}
                      className="flex justify-between text-[11px] text-zinc-600 dark:text-zinc-300"
                    >
                      <span>{out.name}</span>
                      <span className="font-semibold">
                        ₹{Number(out.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Collected Amount (₹) *
            </label>
            <Input
              type="number"
              value={collectFee.amount}
              onChange={(e) => setCollectFee({ ...collectFee, amount: Number(e.target.value) })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Payment Mode *
            </label>
            <Select
              value={collectFee.paymentMethod}
              options={[
                { label: 'Cash', value: 'CASH' },
                { label: 'Online / Card', value: 'ONLINE' },
                { label: 'Cheque', value: 'CHEQUE' },
              ]}
              onChange={(e) =>
                setCollectFee({ ...collectFee, paymentMethod: e.target.value as any })
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Remarks
            </label>
            <Input
              value={collectFee.remarks}
              onChange={(e) => setCollectFee({ ...collectFee, remarks: e.target.value })}
              placeholder="Cheque No / Online txn ID..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowCollectFeeDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCollectFee}
            isLoading={collectFeeMutation.isPending}
            disabled={!collectFee.studentId}
          >
            Record Receipt
          </Button>
        </div>
      </Dialog>

      {/* Dialog: Disburse Salary Payout */}
      <Dialog
        isOpen={showPayoutDialog}
        onClose={() => setShowPayoutDialog(false)}
        title="Disburse Salary Payout"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Payment Method *
            </label>
            <Select
              value={paymentMethod}
              options={[
                { label: 'Bank Direct Transfer', value: 'BANK_TRANSFER' },
                { label: 'Cash Payment', value: 'CASH' },
                { label: 'Cheque Disbursed', value: 'CHEQUE' },
              ]}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handlePaySalary}
            isLoading={payPayslipMutation.isPending}
          >
            Disburse Funds
          </Button>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
