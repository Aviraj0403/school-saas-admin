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
import { useFeeStructures, useCreateFeeStructure, useCollectFee, useFeeCollections, useRevenueSummary } from '@/hooks/queries/useFee';
import { useStaffList } from '@/hooks/queries/useStaff';
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
  const [newStructure, setNewStructure] = useState({ name: '', amount: 1000, type: 'TUITION', classId: '' });
  const [collectFee, setCollectFee] = useState({ studentId: '', amount: 0, paymentMethod: 'CASH' as 'CASH' | 'ONLINE' | 'CHEQUE', remarks: '' });

  // Student Ledger datasets
  const [selectedStudentLedger, setSelectedStudentLedger] = useState<any>(null);
  const [studentsLedgerData, setStudentsLedgerData] = useState([
    { id: 'stud-1', name: 'Aarav Mehta', className: 'Grade 9-A', rollNo: '12', billed: 45000, paid: 35000, balance: 10000, transactions: [
      { id: 't-1', date: '2026-04-01', description: 'Tuition Fee Invoice Q1', type: 'DEBIT', amount: 35000 },
      { id: 't-2', date: '2026-04-01', description: 'Transport Bus Route A Invoice', type: 'DEBIT', amount: 10000 },
      { id: 't-3', date: '2026-04-05', description: 'Cash Fee payment received', type: 'CREDIT', amount: 35000 },
    ]},
    { id: 'stud-2', name: 'Riya Sen', className: 'Grade 11-B', rollNo: '08', billed: 55000, paid: 55000, balance: 0, transactions: [
      { id: 't-4', date: '2026-04-01', description: 'Tuition Fee Invoice Q1', type: 'DEBIT', amount: 45000 },
      { id: 't-5', date: '2026-04-01', description: 'Exam Fee Invoice Term 1', type: 'DEBIT', amount: 10000 },
      { id: 't-6', date: '2026-04-08', description: 'Online UPI Payout received', type: 'CREDIT', amount: 55000 },
    ]},
    { id: 'stud-3', name: 'Kabir Dev', className: 'Grade 10-A', rollNo: '21', billed: 40000, paid: 20000, balance: 20000, transactions: [
      { id: 't-7', date: '2026-04-01', description: 'Tuition Fee Invoice Q1', type: 'DEBIT', amount: 40000 },
      { id: 't-8', date: '2026-04-10', description: 'Cheque Payment received', type: 'CREDIT', amount: 20000 },
    ]},
  ]);

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
        // Log receipt locally on selected student if matched
        const matchedStud = studentsLedgerData.find(s => s.id === collectFee.studentId || s.name.toLowerCase() === collectFee.studentId.toLowerCase());
        if (matchedStud) {
          const newTx = {
            id: `t-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            description: `${collectFee.paymentMethod} payment - ${collectFee.remarks || 'Receipt recorded'}`,
            type: 'CREDIT',
            amount: collectFee.amount
          };
          setStudentsLedgerData(prev => prev.map(s => 
            s.id === matchedStud.id ? { ...s, paid: s.paid + collectFee.amount, balance: Math.max(0, s.balance - collectFee.amount), transactions: [...s.transactions, newTx] } : s
          ));
        }
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

  const totalRevenue = revenueSummary?.totalCollected || 184500;
  const totalSalaries = (payslips || []).reduce((acc: number, p: any) => acc + (p.status === 'PAID' ? p.netSalary : 0), 0) || 45000;
  const netFinProfit = totalRevenue - totalSalaries;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto p-1">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 rounded-2xl shadow-xl text-white">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">School Finance Console</h1>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              Establish fee structures, configure student double-entry ledgers, and manage employee payroll payouts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeTab === 0 && (
              <button 
                onClick={() => setShowAddStructureDialog(true)}
                className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs md:text-sm flex items-center gap-2"
              >
                <i className="pi pi-plus"></i>
                Add Structure
              </button>
            )}
            {activeTab === 1 && (
              <button 
                onClick={() => setShowCollectFeeDialog(true)}
                className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs md:text-sm flex items-center gap-2"
              >
                <i className="pi pi-dollar"></i>
                Record Fee Receipt
              </button>
            )}
            {activeTab === 2 && (
              <button 
                onClick={handleGeneratePayslips}
                disabled={generatePayslipsMutation.isPending}
                className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs md:text-sm flex items-center gap-2 disabled:opacity-50"
              >
                <i className="pi pi-cog"></i>
                Generate Payslips
              </button>
            )}
          </div>
        </div>

        {/* Finance Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20 p-5 rounded-2xl shadow-sm flex flex-col gap-1">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Total Revenue Collected</span>
            <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/20 p-5 rounded-2xl shadow-sm flex flex-col gap-1">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Staff Payroll Expenses</span>
            <span className="text-3xl font-extrabold text-rose-700 dark:text-rose-300 mt-1">
              ₹{totalSalaries.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/20 p-5 rounded-2xl shadow-sm flex flex-col gap-1">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Net Operating Cashflow</span>
            <span className="text-3xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">
              ₹{netFinProfit.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Tab Boards */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
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
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-slate-400">Loading structures...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
                    {((structures as any)?.data || structures || []).map((struct: any) => (
                      <div 
                        key={struct.id} 
                        className="border border-slate-100 dark:border-slate-800 p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-extrabold text-slate-850 dark:text-white text-base leading-snug">{struct.name}</h3>
                          <Tag value={struct.type} className="bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider" />
                        </div>
                        <div className="flex justify-between items-baseline border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
                          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Amount Slabs</span>
                          <span className="text-base font-extrabold text-slate-800 dark:text-white">₹{struct.amount.toLocaleString('en-IN')}</span>
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
                <div className="lg:col-span-2 bg-slate-50/30 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-white">Student Directory</h2>
                    <p className="text-[11px] text-slate-400">Select a student to view double-entry billing logs.</p>
                  </div>
                  
                  <DataTable
                    value={studentsLedgerData}
                    selectionMode="single"
                    selection={selectedStudentLedger}
                    onSelectionChange={(e) => setSelectedStudentLedger(e.value)}
                    dataKey="id"
                    className="p-datatable-sm"
                    rowClassName={(data: any) => `cursor-pointer transition-all ${selectedStudentLedger?.id === data.id ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`}
                  >
                    <Column field="name" header="Name" className="font-bold text-xs" />
                    <Column field="className" header="Class" className="text-xs" />
                    <Column field="balance" header="Dues" body={(d) => `₹${d.balance.toLocaleString()}`} className="font-mono text-xs font-bold text-rose-500" />
                  </DataTable>
                </div>

                {/* Ledger sheet */}
                <div className="lg:col-span-3 bg-slate-50/30 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
                  {selectedStudentLedger ? (
                    <div className="flex flex-col gap-5">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <h2 className="text-lg font-bold text-slate-800 dark:text-white">{selectedStudentLedger.name} — Ledger Account</h2>
                          <p className="text-xs text-slate-400">Roll No: {selectedStudentLedger.rollNo} · {selectedStudentLedger.className}</p>
                        </div>
                        <div className="bg-slate-100/80 dark:bg-slate-900 p-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider flex gap-4 border border-slate-200/50">
                          <div>
                            <span className="text-slate-400 block">Total Billed:</span>
                            <span className="text-slate-800 dark:text-white font-black text-xs">₹{selectedStudentLedger.billed.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-emerald-500 block">Total Paid:</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs">₹{selectedStudentLedger.paid.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-rose-500 block">Outs. Balance:</span>
                            <span className="text-rose-600 dark:text-rose-450 font-black text-xs">₹{selectedStudentLedger.balance.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <DataTable value={selectedStudentLedger.transactions} className="p-datatable-sm mt-1" stripedRows>
                        <Column field="date" header="Transaction Date" className="text-xs text-slate-400 font-mono" />
                        <Column field="description" header="Item Ledger Description" className="font-bold text-xs text-slate-700 dark:text-slate-300" />
                        <Column 
                          field="type" 
                          header="Type" 
                          body={(d) => (
                            <Tag 
                              value={d.type} 
                              className={`font-bold text-[9px] ${d.type === 'DEBIT' ? 'bg-rose-500/10 text-rose-650' : 'bg-emerald-500/10 text-emerald-650'}`}
                            />
                          )}
                        />
                        <Column field="amount" header="Amount" body={(d) => `₹${d.amount.toLocaleString()}`} className="font-mono text-xs font-bold text-right" />
                      </DataTable>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-slate-400 h-full min-h-[300px]">
                      <i className="pi pi-book text-3xl mb-2"></i>
                      <p className="text-xs font-semibold text-center">No Student Account Selected</p>
                      <span className="text-[10px] text-slate-400 text-center mt-1">Select a student on the left menu directory to audit transactions.</span>
                    </div>
                  )}
                </div>

              </div>
            </TabPanel>

            {/* Tab 2: HR Payroll payouts */}
            <TabPanel header="Teacher & Staff Payroll">
              <div className="p-4 flex flex-col gap-6">
                
                {/* Payroll Header */}
                <div className="bg-slate-50/30 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Month</label>
                      <Dropdown value={selectedMonth} options={monthsList} onChange={(e) => setSelectedMonth(e.value)} className="border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-lg text-xs" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">Year</label>
                      <Dropdown value={selectedYear} options={yearsList} onChange={(e) => setSelectedYear(e.value)} className="border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-lg text-xs" />
                    </div>
                  </div>
                </div>

                {/* Payslips DataTable */}
                <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl overflow-hidden">
                  <DataTable 
                    value={payslips} 
                    loading={loadingPayslips} 
                    className="p-datatable-sm" 
                    emptyMessage={`No payslips generated for this term.`}
                  >
                    <Column header="Employee Name" body={(d) => getStaffName(d.userId)} className="font-semibold text-slate-850 dark:text-white" />
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
                              ? 'bg-emerald-500/10 text-emerald-650' 
                              : 'bg-rose-500/10 text-rose-650'
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
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 px-3 text-xs rounded-xl"
                            onClick={() => {
                              setSelectedPayslipId(d.id);
                              setShowPayoutDialog(true);
                            }}
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">Paid via {d.paymentMethod}</span>
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
        className="dialog-custom rounded-3xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowAddStructureDialog(false)} />
            <Button 
              label="Save Slab" 
              icon="pi pi-check" 
              onClick={handleCreateStructure} 
              loading={createStructureMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Structure Name *</label>
            <InputText 
              value={newStructure.name} 
              onChange={(e) => setNewStructure({ ...newStructure, name: e.target.value })} 
              placeholder="e.g., Tuition Fee Q1"
              className="p-2 border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Amount (₹) *</label>
            <InputNumber 
              value={newStructure.amount} 
              onValueChange={(e) => setNewStructure({ ...newStructure, amount: e.value || 0 })} 
              mode="currency" 
              currency="INR" 
              locale="en-IN"
              className="border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Fee Category *</label>
            <Dropdown 
              value={newStructure.type} 
              options={[{ label: 'Tuition', value: 'TUITION' }, { label: 'Transport', value: 'TRANSPORT' }, { label: 'Exam', value: 'EXAM' }, { label: 'Hostel', value: 'HOSTEL' }]} 
              onChange={(e) => setNewStructure({ ...newStructure, type: e.value })} 
              className="border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
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
        onHide={() => setShowCollectFeeDialog(false)}
        className="dialog-custom rounded-3xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowCollectFeeDialog(false)} />
            <Button 
              label="Record Receipt" 
              icon="pi pi-dollar" 
              onClick={handleCollectFee} 
              loading={collectFeeMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Student ID or Name *</label>
            <InputText 
              value={collectFee.studentId} 
              onChange={(e) => setCollectFee({ ...collectFee, studentId: e.target.value })} 
              placeholder="e.g., Aarav Mehta"
              className="p-2 border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Collected Amount (₹) *</label>
            <InputNumber 
              value={collectFee.amount} 
              onValueChange={(e) => setCollectFee({ ...collectFee, amount: e.value || 0 })} 
              mode="currency" 
              currency="INR" 
              locale="en-IN"
              className="border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-550 dark:text-slate-400">Payment Mode *</label>
            <Dropdown 
              value={collectFee.paymentMethod} 
              options={[{ label: 'Cash', value: 'CASH' }, { label: 'Online / Card', value: 'ONLINE' }, { label: 'Cheque', value: 'CHEQUE' }]} 
              onChange={(e) => setCollectFee({ ...collectFee, paymentMethod: e.value })} 
              className="border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-555 dark:text-slate-400">Remarks</label>
            <InputText 
              value={collectFee.remarks} 
              onChange={(e) => setCollectFee({ ...collectFee, remarks: e.target.value })} 
              placeholder="Cheque No / Online txn ID..."
              className="p-2 border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
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
        className="dialog-custom rounded-3xl animate-scalein"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowPayoutDialog(false)} />
            <Button 
              label="Disburse Funds" 
              icon="pi pi-check" 
              onClick={handlePaySalary} 
              loading={payPayslipMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 px-4 rounded-xl font-bold" 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-550 dark:text-slate-400">Payment Payout Method *</label>
            <Dropdown 
              value={paymentMethod} 
              options={[
                { label: 'Bank Direct Transfer', value: 'BANK_TRANSFER' },
                { label: 'Cash Payment Handed Over', value: 'CASH' },
                { label: 'Cheque Disbursed', value: 'CHEQUE' }
              ]} 
              onChange={(e) => setPaymentMethod(e.value)} 
              className="border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
