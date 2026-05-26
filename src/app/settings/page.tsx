'use client';

import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/settings.service';

const ALL_MODULES = [
  { id: 'students', label: 'Students', desc: 'Manage admission files, profile rosters, and student metrics.', icon: 'pi pi-users', color: 'text-blue-500' },
  { id: 'staff', label: 'Staff Directory', desc: 'Track employee listings, admin roles, and instructor files.', icon: 'pi pi-id-card', color: 'text-orange-500' },
  { id: 'academics', label: 'Academics Suite', desc: 'Timetables, classes, subject schedules, and syllabi.', icon: 'pi pi-book', color: 'text-purple-500' },
  { id: 'attendance', label: 'Attendance Roster', desc: 'Daily attendance registry with bulk check-in tools.', icon: 'pi pi-check-square', color: 'text-emerald-500' },
  { id: 'fee', label: 'Finance & Fees', desc: 'Slabs, invoices, receipt collections, and transaction logs.', icon: 'pi pi-wallet', color: 'text-teal-500' },
  { id: 'exams', label: 'Exams & Seating', desc: 'Define exam terms, schedules, and seating layouts.', icon: 'pi pi-sitemap', color: 'text-indigo-500' },
  { id: 'library', label: 'Library Catalog', desc: 'Track book catalogs, borrowing logs, and return status.', icon: 'pi pi-bookmark', color: 'text-rose-500' },
  { id: 'communication', label: 'Communication Hub', desc: 'Post bulletins, newsletters, and announcements.', icon: 'pi pi-megaphone', color: 'text-pink-500' },
  { id: 'whatsapp', label: 'WhatsApp Bot', desc: 'Trigger chatbot auto-responders and template logs.', icon: 'pi pi-whatsapp', color: 'text-green-500' },
  { id: 'hostel', label: 'Hostel System', desc: 'Manage room boarding, capacities, and occupancies.', icon: 'pi pi-home', color: 'text-violet-500' },
  { id: 'leave', label: 'Leave Manager', desc: 'Process student/staff leaves and request approvals.', icon: 'pi pi-calendar-minus', color: 'text-amber-500' },
  { id: 'transport', label: 'Transport Fleet', desc: 'Configure route roadmaps, stops, and coordinates.', icon: 'pi pi-map-marker', color: 'text-cyan-500' },
];

const PLANS = [
  { value: 'BASIC', label: 'Basic Slab', price: '₹4,999/mo', desc: 'Core student directory, library catalog, and leave approvals.', color: 'from-slate-400 to-slate-500' },
  { value: 'STANDARD', label: 'Standard Tier', price: '₹9,999/mo', desc: 'Includes fee management, staff metrics, and exams scheduling.', color: 'from-blue-500 to-indigo-650' },
  { value: 'PREMIUM', label: 'Premium Gold', price: '₹19,999/mo', desc: 'Includes auto seating charts, WhatsApp bots, and advanced analytics.', color: 'from-amber-500 to-orange-650' },
  { value: 'ENTERPRISE', label: 'Enterprise Pro', price: 'Custom Quote', desc: 'Full transport timeline mappings, multi-branch panels, and dedicated databases.', color: 'from-purple-500 to-fuchsia-700' },
];

export default function SettingsPage() {
  const toast = useRef<Toast>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<any>({
    name: '',
    slug: '',
    adminEmail: '',
    plan: 'BASIC',
    activeModules: [],
  });

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getTenantDetails,
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: (tenant as any).name || '',
        slug: (tenant as any).slug || '',
        adminEmail: (tenant as any).adminEmail || '',
        plan: (tenant as any).plan || 'BASIC',
        activeModules: (tenant as any).activeModules || [],
      });
    }
  }, [tenant]);

  const mutation = useMutation({
    mutationFn: settingsService.updateTenantDetails,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Settings updated successfully', life: 3000 });
    },
    onError: () => {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to update settings', life: 3000 });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const toggleModule = (moduleId: string) => {
    setFormData((prev: any) => {
      const activeModules = prev.activeModules.includes(moduleId)
        ? prev.activeModules.filter((m: string) => m !== moduleId)
        : [...prev.activeModules, moduleId];
      return { ...prev, activeModules };
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="w-10 h-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-400">Loading settings...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Toast ref={toast} />
      <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 rounded-2xl shadow-xl text-white">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">School Configurations</h1>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              Manage your institute's profile parameters, licensing plans, and system workspace modules.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          {/* General settings card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">Profile Details</h2>
              <p className="text-xs text-slate-400">Basic metadata about your school's workspace.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-xs text-slate-500 uppercase tracking-wider">School / Tenant Name *</label>
                <InputText
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="p-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Heights Academy Junior Wing"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-xs text-slate-500 uppercase tracking-wider">Subdomain Slug</label>
                <div className="relative">
                  <InputText
                    value={formData.slug}
                    disabled
                    className="p-3 w-full border border-slate-200 dark:border-slate-850 dark:bg-slate-800/50 rounded-xl cursor-not-allowed text-slate-400 font-mono text-xs pl-3 pr-28"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-indigo-550 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 p-1 px-2.5 rounded-lg border border-indigo-100/50 dark:border-indigo-900/30">
                    .aviraj.com
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="font-bold text-xs text-slate-500 uppercase tracking-wider">Administrative Contact Email *</label>
                <InputText
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  className="p-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="admin@heights.edu"
                  required
                />
              </div>
            </div>
          </div>

          {/* Pricing slabs cards */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">Subscription Package Tier</h2>
              <p className="text-xs text-slate-400">Upgrade or inspect school subscription pricing limits.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLANS.map((p) => {
                const isSelected = formData.plan === p.value;
                return (
                  <div
                    key={p.value}
                    onClick={() => setFormData({ ...formData, plan: p.value })}
                    className={`cursor-pointer rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:scale-[1.02] ${
                      isSelected 
                        ? 'border-indigo-650 bg-indigo-50/15 dark:bg-indigo-950/10 shadow-md ring-1 ring-indigo-500' 
                        : 'border-slate-150 dark:border-slate-800 bg-slate-50/30 hover:bg-slate-50/70 dark:bg-slate-900 dark:hover:bg-slate-850'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400">{p.label}</span>
                        {isSelected && <i className="pi pi-check-circle text-indigo-600 text-sm animate-pulse"></i>}
                      </div>
                      <h3 className="text-xl font-black mt-2 text-slate-800 dark:text-white">{p.price}</h3>
                      <p className="text-[10px] text-slate-450 mt-2 leading-relaxed">{p.desc}</p>
                    </div>

                    <div className={`h-1.5 rounded-full w-full bg-gradient-to-r ${p.color}`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Core active modules toggle list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">Module Matrix Switcher</h2>
              <p className="text-xs text-slate-400">Enable or disable panel modules in your sidebar index menu.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {ALL_MODULES.map((m) => {
                const isActive = formData.activeModules.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleModule(m.id)}
                    className={`cursor-pointer p-4 rounded-2xl border flex items-start gap-3 transition-all duration-150 active:scale-98 ${
                      isActive 
                        ? 'border-indigo-650/40 bg-indigo-50/20 dark:bg-indigo-950/10' 
                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${isActive ? 'bg-indigo-100 text-indigo-650 dark:bg-indigo-900/40' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'} transition-colors`}>
                      <i className={`${m.icon} text-md`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-1">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{m.label}</span>
                        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${isActive ? 'bg-emerald-500 scale-100' : 'bg-slate-300 scale-75'}`} />
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1 leading-snug break-words">{m.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end gap-3 mt-2">
            <Button
              type="submit"
              label="Save School Settings"
              icon="pi pi-save"
              loading={mutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 px-6 rounded-2xl shadow-md transition-all active:scale-95 text-sm"
            />
          </div>

        </form>

      </div>
    </DashboardLayout>
  );
}
