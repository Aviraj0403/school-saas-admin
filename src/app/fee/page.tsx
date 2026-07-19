'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { StatCard } from '@/components/ui/StatCard';
import { useFeeStructures, useCreateFeeStructure, useCollectFee, useFeeCollections, useRevenueSummary, useStudentDues } from '@/hooks/queries/useFee';
import { useClasses } from '@/hooks/queries/useAcademics';
import { useStudentsList } from '@/hooks/queries/useStudents';
import { useStaffList } from '@/hooks/queries/useStaff';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';

import { 
  useSalaryStructure, 
  useUpsertSalaryStructure, 
  useGeneratePayslips, 
  usePayslips, 
  usePayPayslip, 
  useFinanceSummary 
} from '@/hooks/queries/usePayroll';


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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Form states
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [newStructure, setNewStructure] = useState({ name: '', amount: 1000, type: 'TUITION', classId: '' });
  const [collectFee, setCollectFee] = useState({ studentId: '', amount: 0, paymentMethod: 'CASH' as 'CASH' | 'ONLINE' | 'CHEQUE', remarks: '' });

  // Student Ledger datasets
  const [selectedStudentLedger, setSelectedStudentLedger] = useState<any>(null);
  // Removed mock studentsLedgerData in favor of real studentsList
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
  // Real Student Ledger Query
  const { data: ledgerDuesData, isPending: loadingLedger } = useStudentDues(selectedStudentId);

  // Staff Payroll section states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUserForSalary, setSelectedUserForSalary] = useState<string>('');
  const [showSalaryStructureDialog, setShowSalaryStructureDialog] = useState(false);
  const [salaryForm, setSalaryForm] = useState({ baseSalary: 25000, hra: 5000, allowance: 3000, deductions: 1000 });
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
  const classOptions = classesList.map((c: any) => ({ label: `${c.name} - ${c.section}`, value: c.id }));

  const { data: studentsData } = useStudentsList(1, 100, undefined, selectedClassId || undefined);
  const studentsList = studentsData?.data?.items || studentsData?.items || [];
  const studentOptions = studentsList.map((s: any) => ({ label: `${s.name} (${s.rollNo ? 'Roll: ' + s.rollNo : s.admissionNo})`, value: s.id }));

  const { data: duesData } = useStudentDues(collectFee.studentId);
  
  const { data: payslips, isPending: loadingPayslips } = usePayslips({ month: selectedMonth, year: selectedYear });
  const { data: financeSummary } = useFinanceSummary(selectedYear.toString());
  const { data: activeStructure, isPending: loadingStructure } = useSalaryStructure(selectedUserForSalary);

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
    createStructureMutation.mutate(newStructure, {
      onSuccess: () => {
        setShowAddStructureDialog(false);
        setNewStructure({ name: '', amount: 1000, type: 'TUITION', classId: '' });
      }
    });
  };

  const handleCollectFee = () => {
    collectFeeMutation.mutate(collectFee, {
      onSuccess: () => {
        // Refresh is handled by invalidation in useCollectFee
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { severity: 'success', summary: 'Fee Collected', detail: `Receipt recorded successfully.`, life: 3000 }
        }));
        setShowCollectFeeDialog(false);
        setCollectFee({ studentId: '', amount: 0, paymentMethod: 'CASH', remarks: '' });
      }
    });
  };

  const handleGeneratePayslips = () => {
    generatePayslipsMutation.mutate({ month: selectedMonth, year: selectedYear }, {
      onSuccess: () => {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { severity: 'success', summary: 'Payslips Generated', detail: `Payslips for month ${selectedMonth}/${selectedYear} created.`, life: 3000 }
        }));
      }
    });
  };

  const handleSaveSalaryStructure = () => {
    if (!selectedUserForSalary) return;
    upsertStructureMutation.mutate({ userId: selectedUserForSalary, data: salaryForm }, {
      onSuccess: () => {
        setShowSalaryStructureDialog(false);
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { severity: 'success', summary: 'Salary Structure Updated', detail: 'Employee salary configuration saved.', life: 3000 }
        }));
      }
    });
  };

  const handlePaySalary = () => {
    if (!selectedPayslipId) return;
    payPayslipMutation.mutate({ id: selectedPayslipId, paymentMethod }, {
      onSuccess: () => {
        setShowPayoutDialog(false);
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { severity: 'success', summary: 'Payslip Disbursed', detail: 'Transaction successfully registered.', life: 3000 }
        }));
      }
    });
  };

  const staffList = staffData?.items || [];

  const getStaffName = (userId: string) => {
    const staff = staffList.find((s: any) => s.id === userId || s.userId === userId);
    return staff?.name || 'Faculty Member';
  };

  const monthsList = [
    { label: 'January', value: 1 }, { label: 'February', value: 2 }, { label: 'March', value: 3 },
    { label: 'April', value: 4 }, { label: 'May', value: 5 }, { label: 'June', value: 6 },
    { label: 'July', value: 7 }, { label: 'August', value: 8 }, { label: 'September', value: 9 },
    { label: 'October', value: 10 }, { label: 'November', value: 11 }, { label: 'December', value: 12 },
  ];

  const yearsList = [
    { label: '2025', value: 2025 }, { label: '2026', value: 2026 }, { label: '2027', value: 2027 }
  ];

  const totalRevenue = Number(revenueSummary?.totalRevenue ?? revenueSummary?.totalCollected ?? 0);
  const totalSalaries = (payslips || []).reduce((acc: number, p: any) => acc + (p.status === 'PAID' ? p.netSalary : 0), 0);
  const netFinProfit = totalRevenue - totalSalaries;

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Fee" />
<div className="flex flex-col gap-4 pb-10">
        
        {/* Header Block */}
        <div className="flex flex-col items-start gap-4 pb-4">
          {/* <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">School Finance Console</h1>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              Establish fee structures, configure student double-entry ledgers, and manage employee payroll payouts.
            </p>
          </div> */}
          <div className="flex flex-wrap gap-2">

            {activeTab === 0 && (
              <button 
                onClick={() => setShowAddStructureDialog(true)}
                className="w-full md:w-auto px-4 py-2 bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium rounded-md shadow-sm transition-all text-sm flex justify-center items-center gap-2"
              >
                <i className="pi pi-plus"></i>
                Add Structure
              </button>
            )}
            {activeTab === 1 && (
              <button 
                onClick={() => setShowCollectFeeDialog(true)}
                className="w-full md:w-auto px-4 py-2 bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium rounded-md shadow-sm transition-all text-sm flex justify-center items-center gap-2"
              >
                <i className="pi pi-dollar"></i>
                Record Fee Receipt
              </button>
            )}
            {activeTab === 2 && (
              <button 
                onClick={handleGeneratePayslips}
                disabled={generatePayslipsMutation.isPending}
                className="w-full md:w-auto px-4 py-2 bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium rounded-md shadow-sm transition-all text-sm flex justify-center items-center gap-2 disabled:opacity-50"
              >
                <i className="pi pi-cog"></i>
                Generate Payslips
              </button>
            )}
          </div>
        </div>

        {/* Finance Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
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

        {/* Tab Boards */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <style>{`
            .p-tabview, .p-tabview-nav, .p-tabview-panels, .p-datatable, .p-datatable-wrapper, .p-paginator {
              background: transparent !important;
            }
            .p-datatable-thead > tr > th, .p-datatable-tbody > tr, .p-datatable-tbody > tr > td {
              background: transparent !important;
            }
            .p-tabview-nav li .p-tabview-nav-link {
              background: transparent !important;
            }
          `}</style>
          <TabView activeIndex={activeTab} onTabChange={(e) => {
            setActiveTab(e.index);
            const tabPaths = ['/fee/slabs', '/fee/ledgers', '/fee/payroll'];
            window.history.pushState({}, '', tabPaths[e.index]);
          }}>
            
            {/* Tab 0: Fee Slabs */}
            <TabPanel header="Fee Slabs & Structures">
              <div className="p-4">
                {loadingStructures ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-zinc-400">Loading structures...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
                    {((structures as any)?.data || structures || []).map((struct: any) => (
                      <div 
                        key={struct.id} 
                        className="border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-zinc-900 dark:text-white text-base leading-snug">{struct.name}</h3>
                          <Tag value={struct.type} className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider" />
                        </div>
                        <div className="flex justify-between items-baseline border-t border-zinc-200 dark:border-zinc-800 pt-3 mt-1">
                          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Amount Slabs</span>
                          <span className="text-base font-bold text-zinc-900 dark:text-white">₹{struct.amount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabPanel>

            {/* Tab 1: Student Ledgers */}
            <TabPanel header="Student Fee Ledgers">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-4">
                
                {/* Students list */}
                <div className="lg:col-span-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Student Directory</h2>
                    <p className="text-[11px] text-zinc-500">Select a student to view double-entry billing logs.</p>
                  </div>
                  
                  <DataTable
                    value={studentsList}
                    selectionMode="single"
                    selection={selectedStudentLedger}
                    onSelectionChange={(e) => {
                      setSelectedStudentLedger(e.value);
                      setSelectedStudentId(e.value?.id || '');
                    }}
                    dataKey="id"
                    className="p-datatable-sm"
                    rowClassName={(data: any) => `cursor-pointer transition-all ${selectedStudentLedger?.id === data.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    paginator rows={10}
                  >
                    <Column field="name" header="Name" className="font-semibold text-xs" />
                    <Column field="admissionNo" header="Adm No" className="text-xs" />
                  </DataTable>
                </div>

                {/* Ledger sheet */}
                <div className="lg:col-span-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
                  {selectedStudentLedger ? (
                    <div className="flex flex-col gap-5">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{selectedStudentLedger.name} — Ledger Account</h2>
                          <p className="text-xs text-zinc-500">Roll No: {selectedStudentLedger.rollNo || 'N/A'} · Adm No: {selectedStudentLedger.admissionNo}</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-950 p-3 rounded-md text-[10px] font-bold uppercase tracking-wider flex gap-4 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                          <div>
                            <span className="text-zinc-500 block">Total Billed:</span>
                            <span className="text-zinc-900 dark:text-white font-bold text-xs">₹{((ledgerDuesData?.totalDue || 0) + (ledgerDuesData?.totalPaid || 0)).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-emerald-600 dark:text-emerald-400 block">Total Paid:</span>
                            <span className="text-emerald-700 dark:text-emerald-500 font-bold text-xs">₹{(ledgerDuesData?.totalPaid || 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-rose-600 dark:text-rose-400 block">Outs. Balance:</span>
                            <span className="text-rose-700 dark:text-rose-500 font-bold text-xs">₹{(ledgerDuesData?.totalDue || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {loadingLedger ? (
                        <div className="p-8 text-center text-zinc-400"><i className="pi pi-spin pi-spinner text-2xl"></i></div>
                      ) : (
                        <DataTable 
                          value={[
                            ...(ledgerDuesData?.outstanding || []).map((o: any) => ({
                              id: `out-${o.id}`,
                              date: o.createdAt,
                              description: `${o.name} (Unpaid)`,
                              type: 'DEBIT',
                              amount: o.amount
                            })),
                            ...(ledgerDuesData?.paid || []).map((p: any) => ({
                              id: `paid-${p.id}`,
                              date: p.paidAt,
                              description: `Paid: ${p.feeStructure?.name || 'Fee'} via ${p.paymentMethod}`,
                              type: 'CREDIT',
                              amount: p.totalAmount
                            }))
                          ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
                          className="p-datatable-sm mt-1" 
                          stripedRows
                          emptyMessage="No transactions found for this student."
                        >
                          <Column field="date" header="Transaction Date" body={(d) => new Date(d.date).toLocaleDateString()} className="text-xs text-zinc-500 font-mono" />
                          <Column field="description" header="Item Ledger Description" className="font-semibold text-xs text-zinc-700 dark:text-zinc-300" />
                          <Column 
                            field="type" 
                            header="Type" 
                            body={(d) => (
                              <Tag 
                                value={d.type} 
                                className={`font-bold text-[9px] ${d.type === 'DEBIT' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}
                              />
                            )}
                          />
                          <Column field="amount" header="Amount" body={(d) => `₹${Number(d.amount).toLocaleString()}`} className="font-mono text-xs font-bold text-right" />
                        </DataTable>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-zinc-400 h-full min-h-[300px]">
                      <i className="pi pi-book text-3xl mb-2"></i>
                      <p className="text-xs font-semibold text-center">No Student Account Selected</p>
                      <span className="text-[10px] text-zinc-400 text-center mt-1">Select a student on the left menu directory to audit transactions.</span>
                    </div>
                  )}
                </div>

              </div>
            </TabPanel>

            {/* Tab 2: HR Payroll payouts */}
            <TabPanel header="Teacher & Staff Payroll">
              <div className="p-4 flex flex-col gap-6">
                
                {/* Payroll Header */}
                <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase">Month</label>
                      <Dropdown value={selectedMonth} options={monthsList} onChange={(e) => setSelectedMonth(e.value)} className="text-xs" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase">Year</label>
                      <Dropdown value={selectedYear} options={yearsList} onChange={(e) => setSelectedYear(e.value)} className="text-xs" />
                    </div>
                  </div>
                </div>

                {/* Payslips DataTable */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <DataTable 
                    value={payslips} 
                    loading={loadingPayslips} 
                    className="p-datatable-sm" 
                    emptyMessage={`No payslips generated for this term.`}
                  >
                    <Column header="Employee Name" body={(d) => getStaffName(d.userId)} className="font-semibold text-zinc-900 dark:text-white" />
                    <Column field="baseSalary" header="Base (₹)" body={(d) => `₹${d.baseSalary.toLocaleString()}`} />
                    <Column field="hra" header="HRA (₹)" body={(d) => `₹${d.hra.toLocaleString()}`} />
                    <Column field="allowance" header="Allowances (₹)" body={(d) => `₹${d.allowance.toLocaleString()}`} />
                    <Column field="deductions" header="Deductions (₹)" body={(d) => `₹${d.deductions.toLocaleString()}`} />
                    <Column field="netSalary" header="Net Salary (₹)" className="font-extrabold" body={(d) => `₹${d.netSalary.toLocaleString()}`} />
                    <Column 
                      field="status" 
                      header="Payout Status" 
                      body={(d) => (
                        <Tag 
                          value={d.status} 
                          className={`font-bold text-[10px] px-2.5 py-0.5 rounded-full ${
                            d.status === 'PAID' 
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
                              : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                          }`}
                        />
                      )} 
                    />
                    <Column 
                      header="Payout Actions" 
                      align="center"
                      body={(d) => (
                        d.status === 'PENDING' ? (
                          <Button 
                            label="Disburse" 
                            icon="pi pi-check-circle" 
                            size="small" 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 px-3 text-xs rounded-md"
                            onClick={() => {
                              setSelectedPayslipId(d.id);
                              setShowPayoutDialog(true);
                            }}
                          />
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-mono">Paid via {d.paymentMethod}</span>
                        )
                      )}
                    />
                  </DataTable>
                </div>

              </div>
            </TabPanel>

          </TabView>
        </div>

      </div>

      {/* Dialog: Add Structure */}
      <Dialog 
        header="Create Fee Structure Slab" 
        visible={showAddStructureDialog} 
        style={{ width: '400px' }} 
        modal 
        onHide={() => setShowAddStructureDialog(false)}
        className="dialog-custom rounded-xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowAddStructureDialog(false)} />
            <Button 
              label="Save Slab" 
              icon="pi pi-check" 
              onClick={handleCreateStructure} 
              loading={createStructureMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 px-4 rounded-md" 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Structure Name *</label>
            <InputText 
              value={newStructure.name} 
              onChange={(e) => setNewStructure({ ...newStructure, name: e.target.value })} 
              placeholder="e.g., Tuition Fee Q1"
              className="p-2 border border-gray-255 dark:border-zinc-700 dark:bg-zinc-900 rounded-md"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Amount (₹) *</label>
            <InputNumber 
              value={newStructure.amount} 
              onValueChange={(e) => setNewStructure({ ...newStructure, amount: e.value || 0 })} 
              mode="currency" 
              currency="INR" 
              locale="en-IN"
              className="border border-gray-255 dark:border-zinc-700 dark:bg-zinc-900 rounded-md"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Fee Category *</label>
            <Dropdown 
              value={newStructure.type} 
              options={[{ label: 'Tuition', value: 'TUITION' }, { label: 'Transport', value: 'TRANSPORT' }, { label: 'Exam', value: 'EXAM' }, { label: 'Hostel', value: 'HOSTEL' }]} 
              onChange={(e) => setNewStructure({ ...newStructure, type: e.value })} 
              className=""
            />
          </div>
        </div>
      </Dialog>

      {/* Dialog: Collect Fee */}
      <Dialog 
        header="Record Fee Collection" 
        visible={showCollectFeeDialog} 
        style={{ width: '400px' }} 
        modal 
        onHide={() => {
          setShowCollectFeeDialog(false);
          setSelectedClassId('');
          setCollectFee({ studentId: '', amount: 0, paymentMethod: 'CASH', remarks: '' });
        }}
        className="dialog-custom rounded-xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => {
              setShowCollectFeeDialog(false);
              setSelectedClassId('');
              setCollectFee({ studentId: '', amount: 0, paymentMethod: 'CASH', remarks: '' });
            }} />
            <Button 
              label="Record Receipt" 
              icon="pi pi-dollar" 
              onClick={handleCollectFee} 
              loading={collectFeeMutation.isPending}
              disabled={!collectFee.studentId}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 px-4 rounded-md disabled:opacity-50" 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Class *</label>
            <Dropdown 
              value={selectedClassId} 
              options={classOptions} 
              onChange={(e) => {
                setSelectedClassId(e.value);
                setCollectFee({ ...collectFee, studentId: '' });
              }} 
              placeholder="Select Class"
              className=""
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Student *</label>
            <Dropdown 
              value={collectFee.studentId} 
              options={studentOptions} 
              onChange={(e) => setCollectFee({ ...collectFee, studentId: e.value })} 
              disabled={!selectedClassId}
              placeholder={selectedClassId ? "Select Student" : "First select a class"}
              className=""
            />
          </div>

          {collectFee.studentId && duesData && (
            <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-md text-xs flex flex-col gap-2 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Total Outstanding Dues:</span>
                <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                  ₹{Number(duesData.totalDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {duesData.outstanding && duesData.outstanding.length > 0 && (
                <div className="mt-1 border-t border-blue-100 dark:border-blue-900/30 pt-2 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Dues breakdown:</span>
                  {duesData.outstanding.map((out: any) => (
                    <div key={out.id} className="flex justify-between text-[11px] text-zinc-600 dark:text-zinc-350">
                      <span>{out.name}</span>
                      <span className="font-semibold">₹{Number(out.amount).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Collected Amount (₹) *</label>
            <InputNumber 
              value={collectFee.amount} 
              onValueChange={(e) => setCollectFee({ ...collectFee, amount: e.value || 0 })} 
              mode="currency" 
              currency="INR" 
              locale="en-IN"
              className="border border-gray-255 dark:border-zinc-700 dark:bg-zinc-900 rounded-md"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-550 dark:text-zinc-400">Payment Mode *</label>
            <Dropdown 
              value={collectFee.paymentMethod} 
              options={[{ label: 'Cash', value: 'CASH' }, { label: 'Online / Card', value: 'ONLINE' }, { label: 'Cheque', value: 'CHEQUE' }]} 
              onChange={(e) => setCollectFee({ ...collectFee, paymentMethod: e.value })} 
              className=""
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-555 dark:text-zinc-400">Remarks</label>
            <InputText 
              value={collectFee.remarks} 
              onChange={(e) => setCollectFee({ ...collectFee, remarks: e.target.value })} 
              placeholder="Cheque No / Online txn ID..."
              className="p-2 border border-gray-255 dark:border-zinc-700 dark:bg-zinc-900 rounded-md"
            />
          </div>
        </div>
      </Dialog>

      {/* Dialog: Disburse Salary Payout */}
      <Dialog 
        header="Disburse Salary Payout" 
        visible={showPayoutDialog} 
        style={{ width: '400px' }} 
        modal 
        onHide={() => setShowPayoutDialog(false)}
        className="dialog-custom rounded-xl animate-scalein"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowPayoutDialog(false)} />
            <Button 
              label="Disburse Funds" 
              icon="pi pi-check" 
              onClick={handlePaySalary} 
              loading={payPayslipMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 px-4 rounded-md font-bold" 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-550 dark:text-zinc-400">Payment Payout Method *</label>
            <Dropdown 
              value={paymentMethod} 
              options={[
                { label: 'Bank Direct Transfer', value: 'BANK_TRANSFER' },
                { label: 'Cash Payment Handed Over', value: 'CASH' },
                { label: 'Cheque Disbursed', value: 'CHEQUE' }
              ]} 
              onChange={(e) => setPaymentMethod(e.value)} 
              className=""
            />
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
