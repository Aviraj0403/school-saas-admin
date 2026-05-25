'use client';

import React, { useState } from 'react';
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
  const [showAddStructureDialog, setShowAddStructureDialog] = useState(false);
  const [showCollectFeeDialog, setShowCollectFeeDialog] = useState(false);

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

  const statusBodyTemplate = (rowData: any) => {
    const status = rowData.status || 'PAID';
    return <Tag value={status} severity={status === 'PAID' ? 'success' : status === 'PARTIAL' ? 'warning' : 'danger'} />;
  };

  const amountBodyTemplate = (rowData: any) => {
    return <span>₹{rowData.amount.toLocaleString()}</span>;
  };

  const paymentMethodOptions = [
    { label: 'Cash', value: 'CASH' },
    { label: 'Online / Card', value: 'ONLINE' },
    { label: 'Cheque', value: 'CHEQUE' },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fee Management</h1>
            <p className="text-gray-500 mt-1">Configure classes fees, print receipts, and track collection trends.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              label="Add Structure" 
              icon="pi pi-plus" 
              className="bg-primary text-white p-2 px-4" 
              onClick={() => setShowAddStructureDialog(true)} 
            />
            <Button 
              label="Collect Fee" 
              icon="pi pi-dollar" 
              className="p-button-secondary bg-slate-700 text-white p-2 px-4" 
              onClick={() => setShowCollectFeeDialog(true)} 
            />
          </div>
        </div>

        {/* Quick Revenue Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
            <span className="block text-gray-500 font-medium mb-3">Total Collected</span>
            <div className="text-900 font-bold text-2xl text-green-600">₹{revenueSummary?.totalCollected?.toLocaleString() || '1,84,500'}</div>
          </Card>
          <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
            <span className="block text-gray-500 font-medium mb-3">Pending Dues</span>
            <div className="text-900 font-bold text-2xl text-red-500">₹{revenueSummary?.pendingDues?.toLocaleString() || '45,200'}</div>
          </Card>
          <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
            <span className="block text-gray-500 font-medium mb-3">Transactions Count</span>
            <div className="text-900 font-bold text-2xl text-blue-600">{revenueSummary?.transactionCount || '58'}</div>
          </Card>
        </div>

        <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
          <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
            
            <TabPanel header="Fee Structures">
              <DataTable 
                value={structures?.data || []} 
                loading={loadingStructures} 
                className="p-datatable-sm mt-3" 
                emptyMessage="No fee structures created yet."
              >
                <Column field="name" header="Name"></Column>
                <Column field="type" header="Type"></Column>
                <Column field="amount" header="Amount" body={amountBodyTemplate}></Column>
                <Column field="className" header="Applicable Class" body={(data) => data.className || 'All Classes'}></Column>
              </DataTable>
            </TabPanel>

            <TabPanel header="Collections History">
              <DataTable 
                value={collections?.data?.items || []} 
                lazy 
                paginator 
                first={collectionLazy.first}
                rows={collectionLazy.rows}
                totalRecords={collections?.data?.meta.total || 0}
                onPage={onCollectionPage}
                loading={loadingCollections} 
                className="p-datatable-sm mt-3" 
                emptyMessage="No collection logs found."
              >
                <Column field="receiptNo" header="Receipt No."></Column>
                <Column field="studentName" header="Student Name"></Column>
                <Column field="amount" header="Amount" body={amountBodyTemplate}></Column>
                <Column field="paymentMethod" header="Payment Method"></Column>
                <Column field="status" header="Status" body={statusBodyTemplate}></Column>
                <Column field="date" header="Collection Date"></Column>
              </DataTable>
            </TabPanel>

          </TabView>
        </Card>

        {/* Dialog: Add Structure */}
        <Dialog 
          header="Create Fee Structure" 
          visible={showAddStructureDialog} 
          style={{ width: '400px' }} 
          modal 
          onHide={() => setShowAddStructureDialog(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button label="Cancel" icon="pi pi-times" onClick={() => setShowAddStructureDialog(false)} className="p-button-text p-2" />
              <Button 
                label="Save" 
                icon="pi pi-check" 
                onClick={handleCreateStructure} 
                loading={createStructureMutation.isPending}
                className="bg-primary text-white p-2 px-4" 
              />
            </div>
          }
        >
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Structure Name</label>
              <InputText 
                value={newStructure.name} 
                onChange={(e) => setNewStructure({ ...newStructure, name: e.target.value })} 
                placeholder="e.g., Tuition Fee Q1"
                className="p-2 border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Amount (₹)</label>
              <InputNumber 
                value={newStructure.amount} 
                onValueChange={(e) => setNewStructure({ ...newStructure, amount: e.value || 0 })} 
                mode="currency" 
                currency="INR" 
                locale="en-IN"
                className="border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Fee Category</label>
              <Dropdown 
                value={newStructure.type} 
                options={[{ label: 'Tuition', value: 'TUITION' }, { label: 'Transport', value: 'TRANSPORT' }, { label: 'Exam', value: 'EXAM' }, { label: 'Hostel', value: 'HOSTEL' }]} 
                onChange={(e) => setNewStructure({ ...newStructure, type: e.value })} 
                className="border border-gray-200 rounded-md"
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
          footer={
            <div className="flex justify-end gap-2">
              <Button label="Cancel" icon="pi pi-times" onClick={() => setShowCollectFeeDialog(false)} className="p-button-text p-2" />
              <Button 
                label="Submit Payment" 
                icon="pi pi-dollar" 
                onClick={handleCollectFee} 
                loading={collectFeeMutation.isPending}
                className="bg-primary text-white p-2 px-4" 
              />
            </div>
          }
        >
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Student ID / Admission No</label>
              <InputText 
                value={collectFee.studentId} 
                onChange={(e) => setCollectFee({ ...collectFee, studentId: e.target.value })} 
                placeholder="e.g. Rahul Sharma or stud-uuid"
                className="p-2 border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Collected Amount (₹)</label>
              <InputNumber 
                value={collectFee.amount} 
                onValueChange={(e) => setCollectFee({ ...collectFee, amount: e.value || 0 })} 
                mode="currency" 
                currency="INR" 
                locale="en-IN"
                className="border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Payment Mode</label>
              <Dropdown 
                value={collectFee.paymentMethod} 
                options={paymentMethodOptions} 
                onChange={(e) => setCollectFee({ ...collectFee, paymentMethod: e.value })} 
                className="border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Remarks</label>
              <InputText 
                value={collectFee.remarks} 
                onChange={(e) => setCollectFee({ ...collectFee, remarks: e.target.value })} 
                placeholder="Cheque No / Online Txn Ref..."
                className="p-2 border border-gray-200 rounded-md"
              />
            </div>
          </div>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
