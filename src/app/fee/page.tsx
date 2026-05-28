'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
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

export default function FeePage() {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'slabs') setActiveTab(0);
      else if (tabParam === 'collections') setActiveTab(1);
    }
  }, []);

  const [showAddStructureDialog, setShowAddStructureDialog] = useState(false);
  const [showCollectFeeDialog, setShowCollectFeeDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Form states
  const [newStructure, setNewStructure] = useState({ name: '', amount: 1000, type: 'TUITION', classId: '' });
  const [collectFee, setCollectFee] = useState({ studentId: '', amount: 0, paymentMethod: 'CASH' as 'CASH' | 'ONLINE' | 'CHEQUE', remarks: '' });

  // Collections state pagination
  const [collectionLazy, setCollectionLazy] = useState({ first: 0, rows: 10, page: 1 });

  // TanStack queries
  const { data: structures, isPending: loadingStructures } = useFeeStructures();
  const { data: collections, isPending: loadingCollections } = useFeeCollections(collectionLazy.page, collectionLazy.rows);
  const { data: revenueSummary } = useRevenueSummary();

  const createStructureMutation = useCreateFeeStructure();
  const collectFeeMutation = useCollectFee();

  const onCollectionPage = (event: DataTablePageEvent) => {
    setCollectionLazy({
      first: event.first,
      rows: event.rows,
      page: (event.page || 0) + 1,
    });
  };

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
        setShowCollectFeeDialog(false);
        setCollectFee({ studentId: '', amount: 0, paymentMethod: 'CASH', remarks: '' });
      }
    });
  };

  const statusBodyTemplate = (status: string) => {
    const isPaid = status === 'PAID';
    let style = 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
    if (status === 'PARTIAL') {
      style = 'bg-amber-500/10 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400';
    } else if (status === 'PENDING') {
      style = 'bg-rose-500/10 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400';
    }
    return <Tag value={status} className={`px-2.5 py-1 text-xs font-bold rounded-full ${style}`} />;
  };

  const paymentMethodOptions = [
    { label: 'Cash', value: 'CASH' },
    { label: 'Online / Card', value: 'ONLINE' },
    { label: 'Cheque', value: 'CHEQUE' },
  ];

  const activeStructures = (structures as any)?.data || structures || [];
  const activeCollections = collections?.data?.items || [];
  const totalCollections = collections?.data?.meta?.total || 0;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto p-1">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 rounded-2xl shadow-xl text-white">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Fee & Finance Ledgers</h1>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              Establish fee structures, configure tuition slabs, and record student transaction entries.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setShowCollectFeeDialog(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all active:scale-95 text-xs md:text-sm flex items-center gap-2"
            >
              <i className="pi pi-dollar"></i>
              Collect Fee
            </button>
            <button 
              onClick={() => setShowAddStructureDialog(true)}
              className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs md:text-sm flex items-center gap-2"
            >
              <i className="pi pi-plus"></i>
              Add Structure
            </button>
          </div>
        </div>

        {/* Finance Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20 p-6 rounded-3xl shadow-sm flex flex-col gap-1">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Total Revenue Collected</span>
            <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
              ₹{(revenueSummary?.totalCollected || 184500).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/20 p-6 rounded-3xl shadow-sm flex flex-col gap-1">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Pending Dues Ledger</span>
            <span className="text-3xl font-extrabold text-rose-700 dark:text-rose-300 mt-1">
              ₹{(revenueSummary?.pendingDues || 45200).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/20 p-6 rounded-3xl shadow-sm flex flex-col gap-1">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Transactions Recorded</span>
            <span className="text-3xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">
              {revenueSummary?.transactionCount || 58} Receipts
            </span>
          </div>
        </div>

        {/* Control Bar */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex justify-end gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid' 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
            }`}
            title="Grid Mode"
          >
            <i className="pi pi-th-large text-lg"></i>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'table' 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
            }`}
            title="Tabular View"
          >
            <i className="pi pi-list text-lg"></i>
          </button>
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
            const tabNames = ['slabs', 'collections'];
            window.history.pushState({}, '', `?tab=${tabNames[e.index]}`);
          }}>
            
            {/* Fee Structures Panel */}
            <TabPanel header="Fee Slabs & Structures">
              <div className="p-4">
                {loadingStructures ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-slate-400">Loading structures...</span>
                  </div>
                            ) : activeStructures.length === 0 ? (
                  <p className="p-8 text-center text-slate-400">No fee structures created yet.</p>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
                    {activeStructures.map((struct: any) => (
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
                ) : (
                  <DataTable 
                    value={activeStructures} 
                    loading={loadingStructures} 
                    className="p-datatable-sm mt-1" 
                  >
                    <Column field="name" header="Structure Name" className="font-semibold text-slate-800 dark:text-white"></Column>
                    <Column field="type" header="Category Type"></Column>
                    <Column field="amount" header="Amount" body={(d) => `₹${d.amount.toLocaleString()}`}></Column>
                    <Column field="className" header="Target Class" body={(d) => d.className || 'All Classes'}></Column>
                  </DataTable>
                )}
              </div>
            </TabPanel>

            {/* History Panel */}
            <TabPanel header="Transaction Logs Ledger">
              <div className="p-4">
                {loadingCollections ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-slate-400">Loading ledger logs...</span>
                  </div>
                ) : activeCollections.length === 0 ? (
                  <p className="p-8 text-center text-slate-400">No collection records found.</p>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                    {activeCollections.map((log: any) => (
                      <div 
                        key={log.id} 
                        className="border border-slate-105 dark:border-slate-800 p-5 rounded-3xl bg-slate-50/30 dark:bg-slate-900/40 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Receipt: {log.receiptNo || '—'}</span>
                            <h3 className="font-extrabold text-slate-850 dark:text-white text-sm leading-snug mt-0.5">{log.studentName}</h3>
                          </div>
                          {statusBodyTemplate(log.status || 'PAID')}
                        </div>

                        <div className="bg-slate-100/50 dark:bg-slate-850 p-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider flex flex-col gap-1.5 border border-slate-150/40 text-slate-400">
                          <div className="flex justify-between">
                            <span>Payment Method:</span>
                            <span className="text-slate-850 dark:text-slate-355 font-extrabold">{log.paymentMethod}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Amount Paid:</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">₹{log.amount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Recorded Date:</span>
                            <span className="text-slate-850 dark:text-slate-355">{log.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <DataTable 
                    value={activeCollections} 
                    lazy 
                    paginator 
                    first={collectionLazy.first}
                    rows={collectionLazy.rows}
                    totalRecords={totalCollections}
                    onPage={onCollectionPage}
                    loading={loadingCollections} 
                    className="p-datatable-sm mt-1" 
                  >
                    <Column field="receiptNo" header="Receipt No."></Column>
                    <Column field="studentName" header="Student Name" className="font-semibold text-slate-850 dark:text-white"></Column>
                    <Column field="amount" header="Amount" body={(d) => `₹${d.amount.toLocaleString()}`}></Column>
                    <Column field="paymentMethod" header="Method"></Column>
                    <Column field="status" header="Status" body={(d) => statusBodyTemplate(d.status || 'PAID')}></Column>
                    <Column field="date" header="Collection Date"></Column>
                  </DataTable>
                )}
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
        header="Collect Student Fee" 
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
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Student ID / Admission No *</label>
            <InputText 
              value={collectFee.studentId} 
              onChange={(e) => setCollectFee({ ...collectFee, studentId: e.target.value })} 
              placeholder="e.g. stud-uuid"
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
              options={paymentMethodOptions} 
              onChange={(e) => setCollectFee({ ...collectFee, paymentMethod: e.value })} 
              className="border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-555 dark:text-slate-400">Remarks</label>
            <InputText 
              value={collectFee.remarks} 
              onChange={(e) => setCollectFee({ ...collectFee, remarks: e.target.value })} 
              placeholder="Cheque No / online txn reference..."
              className="p-2 border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
