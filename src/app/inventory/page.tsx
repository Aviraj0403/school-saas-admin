'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';

const MOCK_INVENTORY = [
  { id: '1', sku: 'IT-LT-001', name: 'Dell Latitude 3420', category: 'IT Assets', location: 'Staff Room', quantity: 15, status: 'ACTIVE' },
  { id: '2', sku: 'LAB-CHEM-05', name: 'Microscope 400x', category: 'Lab Equipment', location: 'Science Lab', quantity: 8, status: 'ACTIVE' },
  { id: '3', sku: 'SPORT-FB-01', name: 'Football (Size 5)', category: 'Sports', location: 'PE Store', quantity: 20, status: 'DAMAGED' }
];

export default function InventoryPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [items, setItems] = useState(MOCK_INVENTORY);
  
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    quantity: 1,
    status: 'ACTIVE'
  });

  const statusTemplate = (rowData: any) => {
    return (
      <Tag 
        value={rowData.status} 
        severity={rowData.status === 'ACTIVE' ? 'success' : rowData.status === 'DAMAGED' ? 'danger' : 'warning'} 
        className="text-[10px] font-bold"
      />
    );
  };

  const handleSave = () => {
    const newItem = {
      id: Math.random().toString(),
      sku: formData.sku,
      name: formData.name,
      category: 'Selected Category',
      location: 'Main Store',
      quantity: formData.quantity,
      status: formData.status
    };
    setItems([newItem, ...items]);
    setShowDialog(false);
    
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { severity: 'success', summary: 'Success', detail: 'Asset added successfully.', life: 3000 }
    }));
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 animate-fade-in pb-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Inventory & Asset Tracking</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Manage school assets, lab equipment, IT hardware, and track staff checkouts.
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800 font-medium rounded-md transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <i className="pi pi-check-square text-xs"></i>
              Checkout Item
            </button>
            <button 
              onClick={() => setShowDialog(true)}
              className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-medium rounded-md transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <i className="pi pi-plus text-xs"></i>
              Add Asset
            </button>
          </div>
        </div>

        {/* Stats / Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-80">
            <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Search by SKU, name, category..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-end bg-slate-100 dark:bg-slate-900 p-1 rounded-md border border-slate-200 dark:border-slate-800">
             <button className="p-1.5 px-3 rounded-md transition-all font-medium flex items-center gap-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm">
               <i className="pi pi-list text-sm"></i> Items
             </button>
             <button className="p-1.5 px-3 rounded-md transition-all font-medium flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
               <i className="pi pi-book text-sm"></i> Checkouts
             </button>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <DataTable 
            value={items} 
            className="p-datatable-sm" 
            emptyMessage="No items in inventory."
            paginator rows={10}
            rowHover
          >
            <Column field="sku" header="SKU" sortable className="text-xs font-mono text-slate-500" />
            <Column field="name" header="Asset Name" sortable className="text-sm font-semibold text-slate-900 dark:text-white" />
            <Column field="category" header="Category" sortable className="text-sm" />
            <Column field="location" header="Location" sortable className="text-sm" />
            <Column field="quantity" header="Quantity" sortable className="text-sm font-semibold" />
            <Column field="status" header="Status" body={statusTemplate} sortable className="w-32" />
            <Column 
              body={() => (
                <div className="flex gap-2 justify-end">
                  <button className="w-7 h-7 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors flex items-center justify-center">
                    <i className="pi pi-pencil text-xs"></i>
                  </button>
                  <button className="w-7 h-7 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 transition-colors flex items-center justify-center">
                    <i className="pi pi-trash text-xs"></i>
                  </button>
                </div>
              )} 
            />
          </DataTable>
        </div>
      </div>

      {/* Dialog for New Asset */}
      <Dialog 
        header="Add New Asset" 
        visible={showDialog} 
        style={{ width: '450px' }} 
        modal 
        onHide={() => setShowDialog(false)}
        className="rounded-xl shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
        headerClassName="border-b border-gray-150 dark:border-slate-800 p-5 font-bold text-slate-800 dark:text-white"
        contentClassName="p-6"
        footer={
          <div className="flex justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2 font-medium text-sm text-slate-600 dark:text-slate-400" onClick={() => setShowDialog(false)} />
            <Button 
              label="Save Asset" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-md border-0 font-medium text-sm" 
              onClick={handleSave} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">SKU / Code</label>
              <InputText 
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                placeholder="e.g. IT-LT-001"
                className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-md outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-mono uppercase"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Asset Name</label>
              <InputText 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Dell Latitude 3420"
                className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-md outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Category</label>
              <Dropdown 
                options={[{label: 'IT Assets', value: '1'}, {label: 'Lab Equipment', value: '2'}, {label: 'Sports', value: '3'}]} 
                placeholder="Select Category"
                className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-md text-sm" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</label>
              <Dropdown 
                value={formData.status} 
                options={[{label: 'Active', value: 'ACTIVE'}, {label: 'Damaged', value: 'DAMAGED'}, {label: 'Retired', value: 'RETIRED'}]} 
                onChange={(e) => setFormData({...formData, status: e.value})} 
                className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-md text-sm" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Initial Quantity</label>
              <InputNumber 
                value={formData.quantity} 
                onValueChange={(e) => setFormData({...formData, quantity: e.value || 1})} 
                min={1} max={1000}
                className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-md" 
                inputClassName="p-2 text-sm outline-none w-full dark:bg-slate-950" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Location</label>
              <InputText 
                placeholder="e.g. Science Lab"
                className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-950 rounded-md outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
