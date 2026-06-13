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
import { useInventoryItems, useInventoryCategories, useCreateInventoryItem } from '@/hooks/queries/useInventory';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';



export default function InventoryPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState('');
  
  // Queries
  const { data: itemsData, isPending: itemsLoading } = useInventoryItems();
  const { data: categoriesData, isPending: categoriesLoading } = useInventoryCategories();
  const createMutation = useCreateInventoryItem();

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    categoryId: '',
    quantity: 1,
    status: 'ACTIVE',
    location: ''
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
    if (!formData.name || !formData.categoryId || !formData.sku) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { severity: 'warn', summary: 'Missing Fields', detail: 'Please fill in SKU, Name and Category.', life: 3000 }
      }));
      return;
    }

    createMutation.mutate(
      {
        sku: formData.sku,
        name: formData.name,
        categoryId: formData.categoryId,
        location: formData.location,
        quantity: formData.quantity,
        status: formData.status
      },
      {
        onSuccess: () => {
          setShowDialog(false);
          setFormData({ sku: '', name: '', categoryId: '', quantity: 1, status: 'ACTIVE', location: '' });
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { severity: 'success', summary: 'Success', detail: 'Asset added to inventory.', life: 3000 }
          }));
        },
        onError: (err: any) => {
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { severity: 'error', summary: 'Error', detail: err?.response?.data?.message || 'Failed to add asset.', life: 3000 }
          }));
        }
      }
    );
  };

  const categoryOptions = Array.isArray(categoriesData) 
    ? categoriesData.map(c => ({ label: c.name, value: c.id })) 
    : [];

  const rawItems = Array.isArray(itemsData) ? itemsData : [];
  const filteredItems = rawItems.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.sku.toLowerCase().includes(search.toLowerCase()) ||
    (item.category?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Inventory" />
<div className="flex flex-col gap-6 animate-fade-in pb-10">
        
        {/* Header Block */}
        <div className="flex justify-end w-full -mt-8 mb-2 z-10 relative">
          
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              className="flex-1 md:flex-none px-4 py-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium rounded-md shadow-sm transition-all text-sm flex items-center justify-center gap-2"
            >
              <i className="pi pi-check-square text-xs"></i>
              Checkout Item
            </button>
            <button 
              onClick={() => setShowDialog(true)}
              className="flex-1 md:flex-none bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white font-extrabold shadow-md border-0 ring-1 ring-black/5 dark:ring-white/10 uppercase tracking-wider text-[11px] px-5 py-2.5 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <i className="pi pi-plus text-xs"></i>
              Add Asset
            </button>
          </div>
        </div>

        {/* Stats / Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-80">
            <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"></i>
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU, name, category..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md outline-none focus:border-blue-500 transition-all text-sm"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-end bg-zinc-50 dark:bg-zinc-900/60 p-1 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-sm">
             <button className="p-1.5 px-3 rounded-md transition-all font-semibold flex items-center gap-2 text-sm bg-white dark:bg-zinc-950 text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200 dark:border-zinc-800">
               <i className="pi pi-list text-sm"></i> Items
             </button>
             <button className="p-1.5 px-3 rounded-md transition-all font-semibold flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
               <i className="pi pi-book text-sm"></i> Checkouts
             </button>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden shadow-sm">
          <style>{`
            .p-datatable, .p-datatable-wrapper, .p-paginator {
              background: transparent !important;
            }
            .p-datatable-thead > tr > th, .p-datatable-tbody > tr, .p-datatable-tbody > tr > td {
              background: transparent !important;
            }
          `}</style>
          <DataTable 
            value={filteredItems} 
            loading={itemsLoading}
            className="p-datatable-sm" 
            emptyMessage="No items in inventory."
            paginator rows={10}
            rowHover
          >
            <Column field="sku" header="SKU" sortable className="text-xs font-mono text-zinc-500" />
            <Column field="name" header="Asset Name" sortable className="text-sm font-semibold text-zinc-900 dark:text-white" />
            <Column field="category.name" header="Category" body={(d) => d.category?.name || '—'} sortable className="text-sm text-zinc-700 dark:text-zinc-300" />
            <Column field="location" header="Location" sortable className="text-sm text-zinc-700 dark:text-zinc-300" />
            <Column field="quantity" header="Quantity" sortable className="text-sm font-semibold" />
            <Column field="status" header="Status" body={statusTemplate} sortable className="w-32" />
            <Column 
              body={() => (
                <div className="flex gap-2 justify-end">
                  <button className="w-7 h-7 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors flex items-center justify-center">
                    <i className="pi pi-pencil text-xs"></i>
                  </button>
                  <button className="w-7 h-7 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors flex items-center justify-center">
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
        className="rounded-md shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
        headerClassName="border-b border-zinc-100 dark:border-zinc-800 p-5 font-bold text-zinc-900 dark:text-white"
        contentClassName="p-6"
        footer={
          <div className="flex justify-end gap-2 p-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button label="Cancel" className="p-button-text p-2 font-medium text-sm text-zinc-500" onClick={() => setShowDialog(false)} />
            <Button 
              label="Save Asset" 
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 px-4 rounded-md border-0 font-medium text-sm" 
              onClick={handleSave} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">SKU / Code</label>
              <InputText 
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                placeholder="e.g. IT-LT-001"
                className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md outline-none focus:border-blue-500 text-sm font-mono uppercase"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Asset Name</label>
              <InputText 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Dell Latitude 3420"
                className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md outline-none focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Category</label>
              <Dropdown 
                value={formData.categoryId}
                onChange={(e) => setFormData({...formData, categoryId: e.value})}
                options={categoryOptions} 
                placeholder="Select Category"
                className="w-full border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md text-sm outline-none" 
                emptyMessage="No categories found. Please add in backend."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</label>
              <Dropdown 
                value={formData.status} 
                options={[{label: 'Active', value: 'ACTIVE'}, {label: 'Damaged', value: 'DAMAGED'}, {label: 'Retired', value: 'RETIRED'}]} 
                onChange={(e) => setFormData({...formData, status: e.value})} 
                className="w-full border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md text-sm outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Initial Quantity</label>
              <InputNumber 
                value={formData.quantity} 
                onValueChange={(e) => setFormData({...formData, quantity: e.value || 1})} 
                min={1} max={1000}
                className="w-full border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md outline-none" 
                inputClassName="p-2 text-sm outline-none w-full dark:bg-zinc-950" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Location</label>
              <InputText 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="e.g. Science Lab"
                className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md outline-none focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
