'use client';

import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/settings.service';
import { useStaffList, useResetStaffPassword } from '@/hooks/queries/useStaff';

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
  const [activeTab, setActiveTab] = useState<'profile' | 'modules' | 'users'>('profile');
  const [baseDomain, setBaseDomain] = useState('.jdinfotechsolutions.in');

  const [formData, setFormData] = useState<any>({
    name: '',
    slug: '',
    adminEmail: '',
    plan: 'BASIC',
    activeModules: [],
  });

  // Queries
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getTenantDetails,
  });

  const { data: staffData, isPending: loadingStaff } = useStaffList(1, 40);
  const resetPasswordMutation = useResetStaffPassword();

  const staffItems = staffData?.items || [];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
          const suffix = parts.slice(1).join('.');
          setBaseDomain(`.${suffix}`);
        }
      }
    }
  }, []);

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

  const handleResetPassword = (id: string, name: string) => {
    if (confirm(`Reset login password to the default default "School@123" for ${name}?`)) {
      resetPasswordMutation.mutate(id, {
        onSuccess: () => {
          toast.current?.show({
            severity: 'success',
            summary: 'Password Reset',
            detail: `Successfully reset password for ${name} to "School@123"`,
            life: 4000
          });
        },
        onError: () => {
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to reset password',
            life: 3000
          });
        }
      });
    }
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
      <div className="flex flex-col gap-8 pb-10 animate-fade-in">
        
        {/* Header Block */}
        <div className="flex flex-col items-start gap-4 pt-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">School Settings & Credentials Control</h1>
            <p className="text-slate-400 mt-1.5 text-sm md:text-base">
              Manage your institute's profile parameters, subscription plan levels, modules, and app login credentials.
            </p>
          </div>
        </div>

        {/* Configurations Sub-Tabs Selector */}
        <div className="flex bg-slate-100/60 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/40 dark:border-slate-800/80 w-max overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`p-2.5 px-5 rounded-xl flex items-center gap-2 font-bold text-xs transition-all border-0 ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-slate-950 text-indigo-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <i className="pi pi-building"></i>
            <span>Identity & Subscription</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('modules')}
            className={`p-2.5 px-5 rounded-xl flex items-center gap-2 font-bold text-xs transition-all border-0 ${
              activeTab === 'modules'
                ? 'bg-white dark:bg-slate-950 text-indigo-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <i className="pi pi-cog"></i>
            <span>Module Matrix</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`p-2.5 px-5 rounded-xl flex items-center gap-2 font-bold text-xs transition-all border-0 ${
              activeTab === 'users'
                ? 'bg-white dark:bg-slate-950 text-indigo-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <i className="pi pi-id-card"></i>
            <span>App Login Credentials (Users)</span>
          </button>
        </div>

        {/* Tab Content Rendering */}
        <div className="mt-2">
          
          {/* Tab 1: Profile & Pricing */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                <div>
                  <h2 className="text-base font-extrabold text-slate-800 dark:text-white">School Profile Parameters</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Basic metadata details about this institutional workspace.</p>
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
                        {baseDomain}
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

              {/* Pricing package slabs */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                <div>
                  <h2 className="text-base font-extrabold text-slate-800 dark:text-white">Subscription Package Tier</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Upgrade or inspect school subscription pricing limits.</p>
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

              {/* Submit actions */}
              <div className="flex justify-end gap-3">
                <Button
                  type="submit"
                  label="Save Profile Settings"
                  icon="pi pi-check"
                  loading={mutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 px-6 rounded-xl border-0 shadow-md transition-all active:scale-95"
                />
              </div>
            </form>
          )}

          {/* Tab 2: Module Matrix */}
          {activeTab === 'modules' && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                <div>
                  <h2 className="text-base font-extrabold text-slate-800 dark:text-white">Module Matrix Switcher</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Enable or disable panel modules in your sidebar index menu.</p>
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

              <div className="flex justify-end gap-3">
                <Button
                  type="submit"
                  label="Save Modules Activation"
                  icon="pi pi-check"
                  loading={mutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 px-6 rounded-xl border-0 shadow-md transition-all active:scale-95"
                />
              </div>
            </form>
          )}

          {/* Tab 3: App Login Credentials */}
          {activeTab === 'users' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              
              {/* Educational info strip */}
              <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
                <div className="z-10">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    SaaS Portal Workflows
                  </span>
                  <h3 className="text-xl font-black mt-2">School Login & Subdomain Context Routing</h3>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-xl leading-relaxed">
                    Staff and teachers login using their registered emails. The SaaS cockpit maps their school automatically via domain matching, separating rosters securely.
                  </p>
                </div>
                
                <div className="flex flex-col gap-1.5 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 text-[10px] text-slate-400 font-bold tracking-wide uppercase min-w-[200px] shadow-inner backdrop-blur-sm">
                  <div className="flex justify-between"><span>Default Password:</span><span className="text-indigo-400 font-mono">School@123</span></div>
                  <div className="flex justify-between mt-1"><span>Target School Subdomain:</span><span className="text-emerald-400 font-mono lowercase">{formData.slug}{baseDomain}</span></div>
                </div>
              </div>

              {/* Roster list */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-800 dark:text-white">Active Login Users</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">List of active school administrators, teachers, and accountants authorized to sign in.</p>
                </div>

                <DataTable
                  value={staffItems}
                  loading={loadingStaff}
                  emptyMessage="No login users registered yet in this school."
                  className="p-datatable-sm"
                >
                  <Column field="name" header="Name" sortable className="font-bold text-slate-850 dark:text-slate-100" />
                  <Column field="email" header="Login Email (Username)" className="font-mono text-xs text-indigo-600 dark:text-indigo-400" />
                  <Column 
                    field="roles" 
                    header="Role Context" 
                    body={(d) => {
                      const rolesList = Array.isArray(d.roles) ? d.roles : [];
                      const primary = rolesList[0]?.name || d.designation || 'Teacher';
                      return (
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-md text-[10px] font-black uppercase tracking-wider border border-indigo-500/20">
                          {primary}
                        </span>
                      );
                    }} 
                  />
                  <Column 
                    header="Account Status" 
                    body={(d) => (
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${d.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-350'}`}></span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {d.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    )} 
                  />
                  <Column 
                    header="Actions (Credentials)" 
                    align="center"
                    body={(d) => (
                      <Button
                        label="Reset Password"
                        icon="pi pi-lock-open"
                        onClick={() => handleResetPassword(d.id, d.name)}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold p-1 px-3 border-0 text-[10px] rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1"
                      />
                    )} 
                  />
                </DataTable>
              </div>

            </div>
          )}

        </div>

      </div>
    </DashboardLayout>
  );
}
