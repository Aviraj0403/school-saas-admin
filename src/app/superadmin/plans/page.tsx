'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { MultiSelect } from 'primereact/multiselect';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { api } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ALL_MODULES = [
  { label: 'Students', value: 'students' },
  { label: 'Staff', value: 'staff' },
  { label: 'Academics', value: 'academics' },
  { label: 'Attendance', value: 'attendance' },
  { label: 'Fee Management', value: 'fee' },
  { label: 'Exams', value: 'exams' },
  { label: 'Library', value: 'library' },
  { label: 'Communication', value: 'communication' },
  { label: 'Analytics', value: 'analytics' },
  { label: 'WhatsApp Bot', value: 'whatsapp' },
  { label: 'Hostel', value: 'hostel' },
  { label: 'Leave', value: 'leave' },
  { label: 'Transport', value: 'transport' },
  { label: 'Homework', value: 'homework' },
  { label: 'Website CMS', value: 'website' },
];

const DEFAULT_PLANS = [
  {
    name: 'BASIC',
    price: '₹999/mo',
    color: 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900',
    gradient: 'from-slate-400 to-slate-500',
    modules: ['students', 'staff', 'academics', 'attendance', 'fee'],
    description: 'Core school management for small institutions.',
  },
  {
    name: 'STANDARD',
    price: '₹2,499/mo',
    color: 'border-indigo-100 dark:border-indigo-950 bg-indigo-50/10 dark:bg-indigo-950/10',
    gradient: 'from-blue-500 to-indigo-650',
    modules: ['students', 'staff', 'academics', 'attendance', 'fee', 'exams', 'library', 'communication'],
    description: 'Full academic suite with exams and library.',
  },
  {
    name: 'PREMIUM',
    price: '₹4,999/mo',
    color: 'border-amber-100 dark:border-amber-950 bg-amber-50/10 dark:bg-amber-950/10',
    gradient: 'from-amber-500 to-orange-600',
    modules: ['students', 'staff', 'academics', 'attendance', 'fee', 'exams', 'library', 'communication', 'analytics', 'whatsapp', 'hostel', 'leave'],
    description: 'Everything in Standard + WhatsApp, Hostel, Leave & Analytics.',
  },
  {
    name: 'ENTERPRISE',
    price: 'Custom',
    color: 'border-purple-100 dark:border-purple-950 bg-purple-50/10 dark:bg-purple-950/10',
    gradient: 'from-purple-500 to-fuchsia-700',
    modules: ALL_MODULES.map((m) => m.value),
    description: 'All modules including Transport, Homework, and Website CMS.',
  },
];

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignForm, setAssignForm] = useState({ tenantId: '', modules: [] as string[], plan: 'BASIC' });

  const { data: tenants } = useQuery({
    queryKey: ['superadmin', 'tenants', { page: 1, limit: 100 }],
    queryFn: async () => {
      const res = await api.get('/tenants?page=1&limit=100');
      return res.data;
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (data: { tenantId: string; modules: string[]; plan: string }) => {
      await api.patch(`/tenants/${data.tenantId}/modules`, { modules: data.modules });
      await api.patch(`/tenants/${data.tenantId}/plan`, { plan: data.plan });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'tenants'] });
      setShowAssignDialog(false);
      setAssignForm({ tenantId: '', modules: [], plan: 'BASIC' });
    },
  });

  const tenantOptions = tenants?.data?.items?.map((t: any) => ({ label: `${t.name} (${t.slug})`, value: t.id })) || [];

  const handlePlanSelect = (planName: string) => {
    const plan = DEFAULT_PLANS.find((p) => p.name === planName);
    if (plan) {
      setAssignForm((prev) => ({ ...prev, plan: planName, modules: plan.modules }));
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 pb-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">SaaS Plans & Module Control</h1>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              Manage subscription plans, configure active modules, and provision tenant school workspaces.
            </p>
          </div>
          <button 
            onClick={() => setShowAssignDialog(true)}
            className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs md:text-sm flex items-center gap-2 border-none cursor-pointer"
          >
            <i className="pi pi-cog"></i>
            Assign Modules
          </button>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {DEFAULT_PLANS.map((plan) => (
            <div key={plan.name} className={`rounded-3xl border-2 ${plan.color} p-6 flex flex-col justify-between gap-6 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-200`}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm`}>{plan.name}</span>
                  <span className="font-extrabold text-lg text-slate-800 dark:text-white">{plan.price}</span>
                </div>
                <p className="text-xs text-slate-450 leading-relaxed font-medium">{plan.description}</p>
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Included Modules</span>
                  <div className="flex flex-wrap gap-1">
                    {plan.modules.map((m) => (
                      <span key={m} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className={`h-1.5 rounded-full w-full bg-gradient-to-r ${plan.gradient}`} />
            </div>
          ))}
        </div>

        {/* Tenant plan overview */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl overflow-hidden shadow-sm p-4">
          <h3 className="font-bold text-slate-800 dark:text-white text-lg p-2">Tenant Subscription Directory</h3>
          <DataTable
            value={tenants?.data?.items || []}
            className="p-datatable-sm mt-3"
            emptyMessage="No tenants found."
            stripedRows
          >
            <Column field="name" header="School Name" className="font-bold" />
            <Column field="slug" header="Slug" className="font-mono text-xs" />
            <Column field="plan" header="Plan" body={(d) => <Tag value={d.plan} severity={d.plan === 'ENTERPRISE' ? 'success' : d.plan === 'PREMIUM' ? 'warning' : 'info'} />} align="center" />
            <Column
              field="activeModules"
              header="Active Modules"
              body={(d) => (
                <div className="flex flex-wrap gap-1">
                  {(d.activeModules || []).slice(0, 5).map((m: string) => (
                    <span key={m} className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-650 dark:text-indigo-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-indigo-100/30 dark:border-indigo-900/20">{m}</span>
                  ))}
                  {(d.activeModules || []).length > 5 && (
                    <span className="text-xs text-slate-400 font-semibold self-center ml-1">+{d.activeModules.length - 5} more</span>
                  )}
                </div>
              )}
            />
            <Column
              header="Actions"
              body={(d) => (
                <Button
                  label="Customize"
                  icon="pi pi-pencil"
                  size="small"
                  className="p-button-text p-button-rounded text-indigo-600"
                  onClick={() => {
                    setAssignForm({ tenantId: d.id, modules: d.activeModules || [], plan: d.plan || 'BASIC' });
                    setShowAssignDialog(true);
                  }}
                />
              )}
              align="center"
            />
          </DataTable>
        </div>
      </div>

      {/* Dialog: Assign Modules */}
      <Dialog 
        header="Assign Plan & Modules to School" 
        visible={showAssignDialog} 
        style={{ width: '480px' }} 
        modal 
        onHide={() => setShowAssignDialog(false)}
        className="dialog-custom rounded-3xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowAssignDialog(false)} />
            <Button
              label="Save Custom Settings"
              icon="pi pi-check"
              loading={assignMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl border-none cursor-pointer"
              onClick={() => assignMutation.mutate(assignForm)}
              disabled={!assignForm.tenantId}
            />
          </div>
        }
      >
        <div className="flex flex-col gap-5 mt-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Select School *</label>
            <select
              value={assignForm.tenantId}
              onChange={(e) => setAssignForm({ ...assignForm, tenantId: e.target.value })}
              className="p-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl bg-white dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
            >
              <option value="">-- Choose School --</option>
              {tenantOptions.map((t: any) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quick Plan Preset</label>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_PLANS.map((p) => (
                <Button
                  key={p.name}
                  label={p.name}
                  size="small"
                  outlined={assignForm.plan !== p.name}
                  className={`p-2 px-3 rounded-lg border text-xs font-black transition-all ${assignForm.plan === p.name ? 'bg-indigo-600 text-white border-indigo-650' : 'text-slate-500 border-slate-200'}`}
                  onClick={() => handlePlanSelect(p.name)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Modules (customize)</label>
            <MultiSelect
              value={assignForm.modules}
              options={ALL_MODULES}
              onChange={(e) => setAssignForm({ ...assignForm, modules: e.value })}
              placeholder="Select modules to enable"
              display="chip"
              className="border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
