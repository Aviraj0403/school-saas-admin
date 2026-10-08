'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  useInventoryItems,
  useInventoryCategories,
  useCreateInventoryItem,
} from '@/hooks/queries/useInventory';
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
    location: '',
  });

  const statusTemplate = (rowData: any) => {
    return (
      <Badge
        variant={
          rowData.status === 'ACTIVE'
            ? 'success'
            : rowData.status === 'DAMAGED'
              ? 'danger'
              : 'warning'
        }
      >
        {rowData.status}
      </Badge>
    );
  };

  const handleSave = () => {
    if (!formData.name || !formData.categoryId || !formData.sku) {
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            severity: 'warn',
            summary: 'Missing Fields',
            detail: 'Please fill in SKU, Name and Category.',
            life: 3000,
          },
        })
      );
      return;
    }

    createMutation.mutate(
      {
        sku: formData.sku,
        name: formData.name,
        categoryId: formData.categoryId,
        location: formData.location,
        quantity: formData.quantity,
        status: formData.status,
      },
      {
        onSuccess: () => {
          setShowDialog(false);
          setFormData({
            sku: '',
            name: '',
            categoryId: '',
            quantity: 1,
            status: 'ACTIVE',
            location: '',
          });
          window.dispatchEvent(
            new CustomEvent('show-toast', {
              detail: {
                severity: 'success',
                summary: 'Success',
                detail: 'Asset added to inventory.',
                life: 3000,
              },
            })
          );
        },
        onError: (err: any) => {
          window.dispatchEvent(
            new CustomEvent('show-toast', {
              detail: {
                severity: 'error',
                summary: 'Error',
                detail: err?.response?.data?.message || 'Failed to add asset.',
                life: 3000,
              },
            })
          );
        },
      }
    );
  };

  const categoryOptions = Array.isArray(categoriesData)
    ? categoriesData.map((c) => ({ label: c.name, value: c.id }))
    : [];

  const rawItems = Array.isArray(itemsData) ? itemsData : [];
  const filteredItems = rawItems.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      (item.category?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Inventory" />
      <div className="flex flex-col gap-6 animate-fade-in pb-10">
        {/* Header Block */}
        <div className="flex flex-col items-start gap-4 pb-4">
          {/* <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Inventory & Asset Tracking</h1>
            <p className="text-slate-400 mt-1 text-sm md:text-base">
              Manage school assets, lab equipment, IT hardware, and track staff checkouts.
            </p>
          </div> */}
          <div className="flex gap-2">
            <button className="flex-1 md:flex-none px-4 py-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium rounded-md shadow-sm transition-all text-sm flex items-center justify-center gap-2">
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
        <div className="flex flex-col items-start gap-4">
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
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Asset Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {itemsLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Loading inventory items...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No items in inventory.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((d: any) => (
                    <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-slate-500">{d.sku}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{d.name}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {d.category?.name || '—'}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {d.location || '—'}
                      </td>
                      <td className="p-3 font-semibold">{d.quantity}</td>
                      <td className="p-3">{statusTemplate(d)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dialog for New Asset */}
      <Dialog isOpen={showDialog} onClose={() => setShowDialog(false)} title="Add New Asset">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                SKU / Code
              </label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. IT-LT-001"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Asset Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dell Latitude 3420"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Category
              </label>
              <Select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="">Select Category</option>
                {categoryOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Status
              </label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="DAMAGED">Damaged</option>
                <option value="RETIRED">Retired</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Initial Quantity
              </label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                }
                min={1}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Location
              </label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Science Lab"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button isLoading={createMutation.isPending} onClick={handleSave}>
              Save Asset
            </Button>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
