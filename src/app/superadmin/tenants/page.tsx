'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { InputNumber } from 'primereact/inputnumber';
import { useTenantsList, useCreateTenant, useSuspendTenant, useActivateTenant, useSetTenantPlan, useSetTenantModules, useUpdateTenant } from '@/modules/superadmin/hooks/useTenants';
import { CreateTenantDto, Tenant } from '@/types/api.types';
import { useAuthStore } from '@/store/useAuthStore';

const PLANS = [
  { label: 'Basic', value: 'BASIC' },
  { label: 'Standard', value: 'STANDARD' },
  { label: 'Premium', value: 'PREMIUM' },
  { label: 'Enterprise', value: 'ENTERPRISE' },
];

const PLAN_THEMES: Record<string, { bg: string, text: string, border: string, badge: string }> = {
  BASIC: { bg: 'from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-800', badge: 'bg-slate-500/10 text-slate-700 dark:text-slate-300' },
  STANDARD: { bg: 'from-blue-50 to-indigo-100 dark:from-indigo-950/40 dark:to-blue-950/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-100 dark:border-indigo-950', badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' },
  PREMIUM: { bg: 'from-amber-50 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-100 dark:border-amber-950', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  ENTERPRISE: { bg: 'from-purple-50 to-fuchsia-100 dark:from-purple-950/40 dark:to-fuchsia-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-100 dark:border-purple-950', badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300' },
};

export default function TenantsPage() {
  const { switchTenant, activeTenant } = useAuthStore();
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'biometrics' | 'jitsi'>('grid');
  const [lazyState, setLazyState] = useState({ first: 0, rows: 10, page: 1 });
  const [showDialog, setShowDialog] = useState(false);
  const [baseDomain, setBaseDomain] = useState('.jdinfotechsolutions.in');
  const [formData, setFormData] = useState<CreateTenantDto>({
    name: '',
    subdomain: '',
    adminEmail: '',
    plan: 'BASIC',
    adminPhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    prefix: '',
    latitude: undefined,
    longitude: undefined,
  });

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

  const { data, isPending } = useTenantsList(lazyState.page, lazyState.rows);
  const createMutation = useCreateTenant();
  const suspendMutation = useSuspendTenant();
  const activateMutation = useActivateTenant();

  const tenants: Tenant[] = data?.data?.items || [];
  const totalRecords = data?.data?.meta?.total || 0;

  // Stats calculation
  const totalCount = totalRecords;
  const activeCount = tenants.filter(t => t.isActive && !t.isSuspended).length;
  const suspendedCount = tenants.filter(t => t.isSuspended).length;
  const premiumPlansCount = tenants.filter(t => t.plan === 'PREMIUM' || t.plan === 'ENTERPRISE').length;

  const onPage = (event: DataTablePageEvent) => {
    setLazyState({ first: event.first, rows: event.rows, page: (event.page || 0) + 1 });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData, {
      onSuccess: () => {
        setShowDialog(false);
        setFormData({
          name: '',
          subdomain: '',
          adminEmail: '',
          plan: 'BASIC',
          adminPhone: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          prefix: '',
          latitude: undefined,
          longitude: undefined,
        });
      },
    });
  };

  const statusTemplate = (rowData: any) => {
    if (rowData.isSuspended) return <Tag value="SUSPENDED" severity="danger" className="font-semibold text-xs" />;
    if (rowData.isActive) return <Tag value="ACTIVE" severity="success" className="font-semibold text-xs" />;
    return <Tag value="INACTIVE" severity="warning" className="font-semibold text-xs" />;
  };

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('BASIC');
  const [tenantModules, setTenantModules] = useState<string[]>([]);
  const [detailsTab, setDetailsTab] = useState<'config' | 'subscriptions' | 'ledger' | 'audit_logs' | 'theme'>('config');

  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');

  const planMutation = useSetTenantPlan();
  const modulesMutation = useSetTenantModules();
  const updateTenantMutation = useUpdateTenant();

  const handleOpenDetails = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setSelectedPlan(tenant.plan);
    setTenantModules(tenant.activeModules || []);
    
    const theme = (tenant as any).theme || {};
    setPrimaryColor(theme.primaryColor || '#6366f1');
    setSecondaryColor(theme.secondaryColor || '#8b5cf6');
    
    setDetailsTab('config');
    setShowDetailDialog(true);
  };

  const handleSaveTheme = () => {
    if (!selectedTenant) return;
    updateTenantMutation.mutate({
      id: selectedTenant.id,
      data: {
        theme: {
          primaryColor,
          secondaryColor
        }
      }
    }, {
      onSuccess: () => {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            severity: 'success',
            summary: 'Theme Colors Saved',
            detail: `School theme primary color is now ${primaryColor}.`,
            life: 3000
          }
        }));
        setSelectedTenant(prev => prev ? { ...prev, theme: { primaryColor, secondaryColor } } : null);
      }
    });
  };

  const handleUpdatePlan = (plan: string) => {
    if (!selectedTenant) return;
    planMutation.mutate({ id: selectedTenant.id, plan }, {
      onSuccess: () => {
        setSelectedPlan(plan);
        setSelectedTenant(prev => prev ? { ...prev, plan: plan as any } : null);
      }
    });
  };

  const handleToggleModule = (mod: string) => {
    if (!selectedTenant) return;
    const isEnabled = tenantModules.includes(mod);
    const updated = isEnabled ? tenantModules.filter(m => m !== mod) : [...tenantModules, mod];
    setTenantModules(updated);
    modulesMutation.mutate({ id: selectedTenant.id, modules: updated });
  };

  const planTemplate = (rowData: any) => {
    const theme = PLAN_THEMES[rowData.plan] || PLAN_THEMES.BASIC;
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${theme.badge}`}>{rowData.plan}</span>;
  };

  const handleSwitchTenant = (tenant: Tenant) => {
    switchTenant({
      id: tenant.id,
      name: tenant.name,
      activeModules: tenant.activeModules || ['students', 'staff', 'academics', 'attendance', 'fee', 'exams', 'library', 'communication', 'whatsapp', 'hostel', 'leave', 'transport', 'homework', 'website', 'settings'],
      projectCode: tenant.projectCode,
      subdomain: tenant.subdomain,
      theme: tenant.theme as any,
    });

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: {
        severity: 'success',
        summary: 'Workspace Connected',
        detail: `Connecting context to ${tenant.name}. Re-initializing systems...`,
        life: 2500
      }
    }));

    // Redirect to dashboard and force complete page reload to flush all query caches cleanly!
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1200);
  };

  const actionsTemplate = (rowData: any) => (
    <div className="flex gap-2 justify-center items-center">
      <Button
        icon="pi pi-eye"
        rounded text severity="secondary" size="small"
        tooltip="View Details & Modules"
        tooltipOptions={{ position: 'bottom' }}
        onClick={() => handleOpenDetails(rowData)}
      />
      {activeTenant?.id !== rowData.id ? (
        <Button
          icon="pi pi-directions"
          rounded text severity="info" size="small"
          tooltip="Switch Workspace"
          tooltipOptions={{ position: 'bottom' }}
          onClick={() => handleSwitchTenant(rowData)}
        />
      ) : (
        <span className="text-xs font-bold text-emerald-600 px-2">CURRENT</span>
      )}
      {!rowData.isSuspended ? (
        <Button
          icon="pi pi-ban"
          rounded text severity="danger" size="small"
          tooltip="Suspend School"
          tooltipOptions={{ position: 'bottom' }}
          onClick={() => {
            if (confirm(`Suspend ${rowData.name}?`)) suspendMutation.mutate(rowData.id);
          }}
        />
      ) : (
        <Button
          icon="pi pi-check-circle"
          rounded text severity="success" size="small"
          tooltip="Activate School"
          tooltipOptions={{ position: 'bottom' }}
          onClick={() => {
            if (confirm(`Reactivate ${rowData.name}?`)) activateMutation.mutate(rowData.id);
          }}
        />
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 pb-10">
        
        {/* Header Section */}
        <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-3xl font-black text-slate-850 dark:text-white tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-650 bg-clip-text text-transparent">
              SaaS Control & Integrations Cockpit
            </h1>
            <p className="text-slate-400 mt-1 text-sm font-medium">
              Global Platform Command — Manage schools, track subscription lifecycles, and monitor live Biometric & Jitsi telemetry.
            </p>
          </div>
          <Button 
            label="Onboard New School" 
            icon="pi pi-plus" 
            className="bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold shadow-md shadow-indigo-500/10 border-0 p-3 px-5 transition-all rounded-xl" 
            onClick={() => setShowDialog(true)} 
          />
        </div>



        {/* Global Multi-Tab Control Menu */}
        <div className="flex bg-slate-100/60 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/40 dark:border-slate-800/80 w-max overflow-x-auto max-w-full">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2.5 px-5 rounded-xl flex items-center gap-2 font-bold text-xs transition-all ${viewMode === 'grid' || viewMode === 'table' ? 'bg-white dark:bg-slate-950 text-indigo-500 shadow-sm' : 'text-slate-500'}`}
          >
            <i className="pi pi-building"></i>
            Active Schools Directory
          </button>
          <button 
            onClick={() => setViewMode('biometrics')} 
            className={`p-2.5 px-5 rounded-xl flex items-center gap-2 font-bold text-xs transition-all ${viewMode === 'biometrics' ? 'bg-white dark:bg-slate-950 text-indigo-500 shadow-sm' : 'text-slate-500'}`}
          >
            <i className="pi pi-print"></i>
            Biometric Terminals
          </button>
          <button 
            onClick={() => setViewMode('jitsi')} 
            className={`p-2.5 px-5 rounded-xl flex items-center gap-2 font-bold text-xs transition-all ${viewMode === 'jitsi' ? 'bg-white dark:bg-slate-950 text-indigo-500 shadow-sm' : 'text-slate-500'}`}
          >
            <i className="pi pi-video"></i>
            Live Jitsi Telemetry
          </button>
        </div>

        {/* Dynamic Telemetry Sections */}
        {viewMode === 'biometrics' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Devices telemetry */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-850 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Terminal Code</span>
                    <h4 className="text-md font-bold text-slate-800 dark:text-white mt-1">BIO-01-MAIN</h4>
                  </div>
                  <Tag value="ONLINE" severity="success" className="font-bold text-[9px]" />
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4 text-xs flex flex-col gap-1.5 font-semibold text-slate-450">
                  <div className="flex justify-between"><span>IP Address:</span><span className="font-mono text-slate-700 dark:text-slate-350">192.168.1.120</span></div>
                  <div className="flex justify-between"><span>Last Ping:</span><span>Just now</span></div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-850 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Terminal Code</span>
                    <h4 className="text-md font-bold text-slate-800 dark:text-white mt-1">BIO-02-HOSTEL</h4>
                  </div>
                  <Tag value="ONLINE" severity="success" className="font-bold text-[9px]" />
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4 text-xs flex flex-col gap-1.5 font-semibold text-slate-450">
                  <div className="flex justify-between"><span>IP Address:</span><span className="font-mono text-slate-700 dark:text-slate-350">192.168.1.121</span></div>
                  <div className="flex justify-between"><span>Last Ping:</span><span>3 mins ago</span></div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-850 rounded-2xl p-5 shadow-sm border-dashed flex flex-col items-center justify-center py-6 text-center">
                <i className="pi pi-plus text-2xl text-indigo-500 mb-2"></i>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Register Biometric Device</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Generate API key and connect physical logs upload</p>
              </div>
            </div>

            {/* Simulated punch test */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-850 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <h3 className="text-md font-bold text-slate-850 dark:text-white">Simulate Device Punch (API Testing)</h3>
              <div className="flex gap-4 items-end flex-wrap">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Terminal</label>
                  <Dropdown value="BIO-01-MAIN" options={['BIO-01-MAIN', 'BIO-02-HOSTEL']} onChange={() => {}} className="w-48 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Roll No / Staff Code</label>
                  <InputText placeholder="e.g. 1001" className="p-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 rounded-xl w-48 text-sm" />
                </div>
                <Button 
                  label="Inject Biometric Punch" 
                  icon="pi pi-bolt" 
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold p-2.5 px-4 rounded-xl text-xs border-0" 
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('show-toast', {
                      detail: {
                        severity: 'success',
                        summary: 'Punch Log Ingested',
                        detail: 'Processed successfully. Attendance registered in the database.',
                        life: 3000
                      }
                    }));
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {viewMode === 'jitsi' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-850 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <h3 className="text-md font-bold text-slate-850 dark:text-white">Active Online Class Rooms</h3>
                <Tag value="JITSI INTEGRATION ACTIVE" severity="info" className="font-bold text-[9px]" />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150/40 dark:border-slate-800/80 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-800 dark:text-white">demo-room-slot-jitsi-meet-1</span>
                    <span className="text-[10px] text-slate-400">Delhi Public School · Grade 10-A Math</span>
                  </div>
                  <div className="flex gap-2">
                    <Button icon="pi pi-eye" rounded text severity="secondary" size="small" />
                    <Button label="Join Meeting" icon="pi pi-video" className="bg-emerald-500 text-white font-bold text-[10px] p-1.5 px-3 border-0 rounded-lg" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150/40 dark:border-slate-800/80 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-800 dark:text-white">demo-room-slot-jitsi-meet-2</span>
                    <span className="text-[10px] text-slate-400">Oakridge International · Grade 11-B Physics</span>
                  </div>
                  <div className="flex gap-2">
                    <Button icon="pi pi-eye" rounded text severity="secondary" size="small" />
                    <Button label="Join Meeting" icon="pi pi-video" className="bg-emerald-500 text-white font-bold text-[10px] p-1.5 px-3 border-0 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Original Grid/Table Sections for schools onboarding */}
        {(viewMode === 'grid' || viewMode === 'table') && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full translate-x-6 -translate-y-6"></div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Schools</p>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{totalCount}</h3>
                  </div>
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
                    <i className="pi pi-building text-md"></i>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-6 -translate-y-6"></div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Active Schools</p>
                    <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</h3>
                  </div>
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <i className="pi pi-check-circle text-md"></i>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full translate-x-6 -translate-y-6"></div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Suspended</p>
                    <h3 className="text-2xl font-black text-rose-500 dark:text-rose-400 mt-1">{suspendedCount}</h3>
                  </div>
                  <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl">
                    <i className="pi pi-ban text-md"></i>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full translate-x-6 -translate-y-6"></div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Premium Tiers</p>
                    <h3 className="text-2xl font-black text-amber-500 mt-1">{premiumPlansCount}</h3>
                  </div>
                  <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                    <i className="pi pi-star text-md"></i>
                  </div>
                </div>
              </div>
            </div>

        {/* View Switcher & Toolbar */}
        <div className="flex justify-between items-center bg-slate-100/80 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-200/40 dark:border-slate-800/80 flex-wrap gap-4">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 pl-2">Showing onboarding database records</p>
          <div className="flex bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 px-4 rounded-lg flex items-center gap-2 font-medium text-xs transition-all duration-300 ${viewMode === 'grid' ? 'bg-indigo-550 bg-primary text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              <i className="pi pi-grid"></i>
              Grid Cards
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 px-4 rounded-lg flex items-center gap-2 font-medium text-xs transition-all duration-300 ${viewMode === 'table' ? 'bg-indigo-550 bg-primary text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              <i className="pi pi-list"></i>
              Table View
            </button>
          </div>
        </div>

        {/* Content Render Area */}
        {isPending ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <i className="pi pi-spin pi-spinner text-4xl text-primary"></i>
            <span className="text-slate-500 font-semibold">Loading tenant directory data...</span>
          </div>
        ) : tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/20">
            <i className="pi pi-building-columns text-5xl text-slate-300 dark:text-slate-700 mb-4"></i>
            <span className="text-slate-500 dark:text-slate-400 font-bold text-lg">No Schools Onboarded</span>
            <p className="text-slate-400 text-sm mt-1">Get started by clicking the "Onboard New School" button.</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Premium Card Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((tenant) => {
              const theme = PLAN_THEMES[tenant.plan] || PLAN_THEMES.BASIC;
              return (
                <div 
                  key={tenant.id}
                  onClick={() => handleSwitchTenant(tenant)}
                  className={`bg-white dark:bg-slate-900/90 border ${tenant.isSuspended ? 'border-rose-200 dark:border-rose-950/40 bg-rose-50/10' : 'border-slate-250 dark:border-slate-800/80 hover:border-indigo-500/80 dark:hover:border-indigo-500/80'} rounded-3xl shadow-sm hover:shadow-xl hover:translate-y-[-4px] cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden relative group`}
                >
                  {/* Card Header Gradient banner */}
                  <div className={`h-24 bg-gradient-to-r ${theme.bg} p-6 flex justify-between items-start relative`}>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300 w-max shadow-sm">
                        {tenant.projectCode || 'No Code'}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${theme.badge} bg-white dark:bg-slate-950`}>
                      {tenant.plan}
                    </span>
                  </div>

                  {/* School Profile Image placeholder / Avatar */}
                  <div className="absolute top-12 left-6">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-950 shadow-md flex items-center justify-center border-2 border-white dark:border-slate-900 text-2xl font-black text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform duration-300">
                      {tenant.prefix || tenant.name.substring(0, 2).toUpperCase()}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 pt-10 flex-grow flex flex-col justify-between gap-6">
                    <div>
                      <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors duration-300">
                        {tenant.name}
                      </h4>
                      <p className="text-xs text-indigo-600/85 dark:text-indigo-400 mt-1 font-semibold flex items-center gap-1.5">
                        <i className="pi pi-link text-[10px]"></i>
                        {tenant.subdomain}{baseDomain}
                      </p>
                      
                      <div className="mt-4 flex flex-col gap-2.5 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <i className="pi pi-envelope text-slate-400 text-sm"></i>
                          <span className="truncate">{tenant.adminEmail}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <i className="pi pi-calendar text-slate-400 text-sm"></i>
                          <span>Onboarded: {new Date(tenant.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <i className="pi pi-cog text-slate-400 text-sm"></i>
                          <span>{tenant.activeModules?.length || 0} Modules enabled</span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions Footer */}
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${tenant.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`}></div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {tenant.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </div>
                      
                      <div className="flex gap-1.5 items-center">
                        <Button
                          icon="pi pi-eye"
                          className="p-button-rounded p-button-text p-button-secondary hover:bg-slate-500/10 p-2"
                          tooltip="View Details"
                          tooltipOptions={{ position: 'top' }}
                          onClick={(e) => { e.stopPropagation(); handleOpenDetails(tenant); }}
                        />
                        {activeTenant?.id !== tenant.id ? (
                          <Button
                            icon="pi pi-directions"
                            className="p-button-rounded p-button-text p-button-info hover:bg-sky-500/10 p-2"
                            tooltip="Switch Workspace"
                            tooltipOptions={{ position: 'top' }}
                            onClick={(e) => { e.stopPropagation(); handleSwitchTenant(tenant); }}
                          />
                        ) : (
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-200/30" onClick={(e) => e.stopPropagation()}>CURRENT</span>
                        )}
                        {!tenant.isSuspended ? (
                          <Button
                            icon="pi pi-ban"
                            className="p-button-rounded p-button-text p-button-danger hover:bg-rose-500/10 p-2"
                            tooltip="Suspend Tenant"
                            tooltipOptions={{ position: 'top' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Suspend ${tenant.name}?`)) suspendMutation.mutate(tenant.id);
                            }}
                          />
                        ) : (
                          <Button
                            icon="pi pi-check-circle"
                            className="p-button-rounded p-button-text p-button-success hover:bg-emerald-500/10 p-2"
                            tooltip="Reactivate Tenant"
                            tooltipOptions={{ position: 'top' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Reactivate ${tenant.name}?`)) activateMutation.mutate(tenant.id);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Modern Table View */
          <Card className="shadow-sm border border-slate-100 dark:border-slate-800/80 rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
            <DataTable
              value={tenants}
              lazy
              paginator
              first={lazyState.first}
              rows={lazyState.rows}
              totalRecords={totalRecords}
              onPage={onPage}
              loading={isPending}
              className="p-datatable-sm"
              emptyMessage="No schools onboarded yet."
              stripedRows
            >
              <Column field="projectCode" header="Code" body={(d) => d.projectCode || '—'} className="font-bold text-xs" />
              <Column field="prefix" header="Prefix" body={(d) => d.prefix || '—'} className="font-semibold text-xs text-slate-500" />
              <Column field="name" header="School Name" sortable className="font-bold" />
              <Column field="subdomain" header="Subdomain" body={(d) => <span className="text-primary font-semibold">{d.subdomain}{baseDomain}</span>} />
              <Column field="adminEmail" header="Admin Email" />
              <Column field="plan" header="Plan" body={planTemplate} align="center" />
              <Column header="Status" body={statusTemplate} align="center" />
              <Column header="Actions" body={actionsTemplate} align="center" />
            </DataTable>
          </Card>
        )}
      </>
    )}

        {/* Dialog Modal - Create */}
        <Dialog 
          header="Onboard New School" 
          visible={showDialog} 
          style={{ width: '680px' }} 
          modal 
          onHide={() => setShowDialog(false)}
          className="rounded-3xl shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
          contentClassName="p-6"
          headerClassName="border-b border-gray-150 dark:border-slate-800 p-6 font-bold"
        >
          <form onSubmit={handleCreate} className="flex flex-col gap-6 mt-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-xs uppercase tracking-wider text-slate-500">School Name *</label>
                <InputText
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="p-3 border border-slate-200 dark:border-slate-850 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:bg-slate-950 text-sm"
                  placeholder="e.g. Oakridge International School"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-bold text-xs uppercase tracking-wider text-slate-500">Subdomain *</label>
                <InputText
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  required
                  className="p-3 border border-slate-200 dark:border-slate-850 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:bg-slate-950 font-semibold text-primary text-sm"
                  placeholder="e.g. oakridge"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-xs uppercase tracking-wider text-slate-500">Admin Email *</label>
                <InputText
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  required
                  className="p-3 border border-slate-200 dark:border-slate-850 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:bg-slate-950 text-sm"
                  placeholder="admin@school.com"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-bold text-xs uppercase tracking-wider text-slate-500">Admin Phone (Contact) *</label>
                <InputText
                  value={formData.adminPhone || ''}
                  onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                  required
                  className="p-3 border border-slate-200 dark:border-slate-850 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:bg-slate-950 text-sm"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-xs uppercase tracking-wider text-slate-500">School Prefix Code (Optional)</label>
                <InputText
                  value={formData.prefix || ''}
                  onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase().slice(0, 4) })}
                  className="p-3 border border-slate-200 dark:border-slate-850 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:bg-slate-950 text-sm uppercase font-mono"
                  placeholder="e.g. OAKR (Max 4 letters)"
                  maxLength={4}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-bold text-xs uppercase tracking-wider text-slate-500">Subscription Plan</label>
                <Dropdown 
                  value={formData.plan} 
                  options={PLANS} 
                  onChange={(e) => setFormData({ ...formData, plan: e.value })} 
                  className="border border-slate-200 dark:border-slate-850 rounded-xl dark:bg-slate-950 text-sm" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold text-xs uppercase tracking-wider text-slate-500">Street Address</label>
              <InputText
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="p-3 border border-slate-200 dark:border-slate-850 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:bg-slate-950 text-sm"
                placeholder="e.g. 123 Main Street, Sector 4"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-xs uppercase tracking-wider text-slate-500">City</label>
                <InputText
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="p-3 border border-slate-200 dark:border-slate-850 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:bg-slate-950 text-sm"
                  placeholder="e.g. Mumbai"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-xs uppercase tracking-wider text-slate-500">State</label>
                <InputText
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="p-3 border border-slate-200 dark:border-slate-850 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:bg-slate-950 text-sm"
                  placeholder="e.g. Maharashtra"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-xs uppercase tracking-wider text-slate-500">Pincode</label>
                <InputText
                  value={formData.pincode || ''}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="p-3 border border-slate-200 dark:border-slate-850 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:bg-slate-950 text-sm"
                  placeholder="e.g. 400001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-xs uppercase tracking-wider text-slate-500">School Latitude</label>
                <InputNumber 
                  value={formData.latitude} 
                  onValueChange={(e) => setFormData({ ...formData, latitude: e.value || undefined })} 
                  mode="decimal" 
                  minFractionDigits={2} 
                  maxFractionDigits={6} 
                  className="border border-slate-200 dark:border-slate-850 rounded-xl dark:bg-slate-950" 
                  inputClassName="p-3 rounded-xl w-full text-sm"
                  placeholder="e.g. 19.0760 (Optional)"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-xs uppercase tracking-wider text-slate-500">School Longitude</label>
                <InputNumber 
                  value={formData.longitude} 
                  onValueChange={(e) => setFormData({ ...formData, longitude: e.value || undefined })} 
                  mode="decimal" 
                  minFractionDigits={2} 
                  maxFractionDigits={6} 
                  className="border border-slate-200 dark:border-slate-850 rounded-xl dark:bg-slate-950" 
                  inputClassName="p-3 rounded-xl w-full text-sm"
                  placeholder="e.g. 72.8777 (Optional)"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-5 mt-4">
              <Button type="button" label="Cancel" className="p-button-text p-3 px-5 rounded-xl font-semibold" onClick={() => setShowDialog(false)} />
              <Button type="submit" label="Onboard School" icon="pi pi-check" loading={createMutation.isPending} className="bg-primary text-white p-3 px-6 rounded-xl font-semibold shadow-md shadow-indigo-500/10 border-0 hover:opacity-95 text-sm" />
            </div>
          </form>
        </Dialog>

        {/* Dialog Modal - Deep Details */}
        <Dialog
          header={`Workspace Detail Config — ${selectedTenant?.name || ''}`}
          visible={showDetailDialog}
          style={{ width: '680px' }}
          modal
          onHide={() => setShowDetailDialog(false)}
          className="rounded-3xl shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
          contentClassName="p-6"
          headerClassName="border-b border-gray-150 dark:border-slate-800 p-6 font-bold text-slate-850 dark:text-slate-100"
        >
          {selectedTenant && (
            <div className="flex flex-col gap-6">
              {/* Profile identity strip */}
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150/40 dark:border-slate-800/80">
                <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-black">
                  {selectedTenant.prefix || selectedTenant.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">{selectedTenant.name}</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">Project Code: <span className="font-bold text-slate-500">{selectedTenant.projectCode || '—'}</span></p>
                </div>
              </div>

              {/* Details Sub-Tabs Selector */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 -mt-2">
                {[
                  { id: 'config', label: 'Identity & Modules', icon: 'pi-cog' },
                  { id: 'theme', label: 'Theme Configuration', icon: 'pi-palette' },
                  { id: 'subscriptions', label: 'Subscription Specs', icon: 'pi-star' },
                  { id: 'ledger', label: 'Billing Ledger', icon: 'pi-wallet' },
                  { id: 'audit_logs', label: 'System Logs', icon: 'pi-list' }
                ].map((tb) => (
                  <button
                    key={tb.id}
                    type="button"
                    onClick={() => setDetailsTab(tb.id as any)}
                    className={`p-3 px-4 font-bold text-xs uppercase tracking-wider transition-all border-b-2 -mb-[2px] flex items-center gap-1.5 ${
                      detailsTab === tb.id
                        ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                    <i className={`pi ${tb.icon} text-[10px]`}></i>
                    <span>{tb.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Contents: Config & Modules */}
              {detailsTab === 'config' && (
                <div className="flex flex-col gap-6 animate-fade-in">
                  {/* Grid details */}
                  <div className="grid grid-cols-2 gap-4 text-sm border-b border-slate-100 dark:border-slate-800/80 pb-6">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subdomain Link</label>
                      <p className="text-primary font-bold mt-1 text-xs truncate">{selectedTenant.subdomain}{baseDomain}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Administrative Contact</label>
                      <p className="font-semibold text-slate-700 dark:text-slate-350 mt-1 truncate">{selectedTenant.adminEmail}</p>
                    </div>
                  </div>

                  {/* Plan controls */}
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">SaaS Subscription Level</label>
                    <div className="flex gap-4 items-center">
                      <Dropdown
                        value={selectedPlan}
                        options={PLANS}
                        onChange={(e) => handleUpdatePlan(e.value)}
                        className="w-48 border border-slate-200 dark:border-slate-850 rounded-xl dark:bg-slate-950 font-bold"
                      />
                      <small className="text-xs text-slate-400">Upgrades or downgrades tenant access tier instantly.</small>
                    </div>
                  </div>

                  {/* Active Modules Toggles */}
                  <div className="flex flex-col gap-3 mt-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enabled Modules ({tenantModules.length})</label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {['core', 'student', 'staff', 'academics', 'attendance', 'fee', 'exams', 'library', 'communication', 'whatsapp', 'hostel', 'leave', 'transport', 'homework', 'website', 'settings'].map(mod => {
                        const active = tenantModules.includes(mod);
                        return (
                          <button
                            type="button"
                            key={mod}
                            onClick={() => handleToggleModule(mod)}
                            className={`p-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all active:scale-95 ${
                              active 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-400' 
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400'
                            }`}
                          >
                            <span className="capitalize">{mod}</span>
                            <i className={`pi ${active ? 'pi-check-circle text-indigo-500' : 'pi-circle text-slate-300'}`}></i>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Contents: Theme Configuration */}
              {detailsTab === 'theme' && (
                <div className="flex flex-col gap-6 animate-fade-in text-sm">
                  <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-150/40 dark:border-slate-800/80 flex flex-col gap-4">
                    <h4 className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-xs">Color Scheme Customization</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400">Primary Color</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={primaryColor} 
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-10 h-10 border-0 rounded-lg cursor-pointer bg-transparent"
                          />
                          <InputText 
                            value={primaryColor} 
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="p-2 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-mono w-full dark:bg-slate-950"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400">Secondary Color</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={secondaryColor} 
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="w-10 h-10 border-0 rounded-lg cursor-pointer bg-transparent"
                          />
                          <InputText 
                            value={secondaryColor} 
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="p-2 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-mono w-full dark:bg-slate-950"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Theme Preview */}
                  <div className="border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl flex flex-col gap-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Preview</label>
                    <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-900/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black transition-all"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {selectedTenant.prefix || selectedTenant.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-850 dark:text-white block">{selectedTenant.name}</span>
                          <span className="text-[10px] text-slate-400">Previewing custom school theme</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="p-2 px-4 rounded-lg text-white text-xs font-bold transition-all border-0"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Primary
                        </button>
                        <button 
                          className="p-2 px-4 rounded-lg text-white text-xs font-bold transition-all border-0"
                          style={{ backgroundColor: secondaryColor }}
                        >
                          Secondary
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <Button 
                      label="Save Theme Colors" 
                      icon="pi pi-check" 
                      onClick={handleSaveTheme}
                      loading={updateTenantMutation.isPending}
                      className="bg-indigo-600 text-white p-3 px-6 rounded-xl font-bold border-0 hover:opacity-95 text-xs shadow-md shadow-indigo-500/10"
                    />
                  </div>
                </div>
              )}

              {/* Tab Contents: Subscription Specs */}
              {detailsTab === 'subscriptions' && (
                <div className="flex flex-col gap-4 animate-fade-in text-xs">
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-150/40 dark:border-slate-800/80">
                    <div>
                      <span className="text-slate-400 font-bold block">PLAN IDENTIFIER:</span>
                      <span className="text-sm font-extrabold text-indigo-500">{selectedTenant.plan || 'STANDARD'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">PLAN ESTIMATED PRICE:</span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                        {selectedTenant.plan === 'ENTERPRISE' ? '₹9,999 / mo' :
                         selectedTenant.plan === 'PREMIUM' ? '₹4,999 / mo' :
                         selectedTenant.plan === 'STANDARD' ? '₹2,499 / mo' : '₹999 / mo'}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-slate-400 font-bold block">TRIAL EXPIRATION:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-350">
                        {selectedTenant.createdAt ? new Date(new Date(selectedTenant.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN') : '—'}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-slate-400 font-bold block">COUNTRY / TAX ZONE:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-350">India (GST 18% Applicable)</span>
                    </div>
                  </div>
                  
                  <div className="bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-150/30 p-4 rounded-xl flex gap-3 text-slate-650 dark:text-indigo-400/90 leading-relaxed font-semibold">
                    <i className="pi pi-info-circle text-indigo-500 text-sm mt-0.5"></i>
                    <p>
                      Upgrade/downgrade of school plans instantly updates module configurations, concurrency ceilings, and API rate limits. Notifications are automatically dispatched to the school billing contact.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab Contents: Billing Ledger */}
              {detailsTab === 'ledger' && (
                <div className="flex flex-col gap-3 animate-fade-in">
                  <DataTable
                    value={[
                      { id: 'INV-2026-001', amount: 2499, date: '2026-05-15', method: 'Razorpay', status: 'PAID', ref: 'pay_RFt9392J8d' },
                      { id: 'INV-2026-002', amount: 2499, date: '2026-04-15', method: 'Razorpay', status: 'PAID', ref: 'pay_KDs8329Sd1' },
                      { id: 'INV-2026-003', amount: 2499, date: '2026-03-15', method: 'Stripe', status: 'PAID', ref: 'ch_8sd92K3sd0' }
                    ]}
                    className="p-datatable-sm"
                    stripedRows
                  >
                    <Column field="id" header="Invoice ID" className="font-bold text-xs" />
                    <Column field="date" header="Billing Date" className="text-xs" />
                    <Column 
                      header="SaaS Fee" 
                      body={(d) => <span className="font-bold font-mono text-slate-800 dark:text-slate-200">₹{d.amount.toLocaleString('en-IN')}</span>} 
                    />
                    <Column field="method" header="Gateway" className="text-xs font-semibold text-slate-500" />
                    <Column 
                      header="Status" 
                      body={(d) => <Tag value={d.status} severity="success" className="font-bold text-[9px] rounded px-2" />} 
                    />
                    <Column 
                      header="Action" 
                      body={() => (
                        <Button 
                          icon="pi pi-download" 
                          className="p-button-text p-button-sm p-1 text-indigo-500" 
                          tooltip="Download Receipt"
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('show-toast', {
                              detail: {
                                severity: 'success',
                                summary: 'PDF Receipt Rendered',
                                detail: 'SaaS fee tax invoice receipt compiled and downloaded successfully.',
                                life: 3500
                              }
                            }));
                          }}
                        />
                      )} 
                      align="center"
                    />
                  </DataTable>
                </div>
              )}

              {/* Tab Contents: System Activity Audit Logs */}
              {detailsTab === 'audit_logs' && (
                <div className="flex flex-col gap-3 animate-fade-in max-h-72 overflow-y-auto">
                  <div className="divide-y divide-slate-100 dark:divide-slate-850">
                    {[
                      { action: 'Database Sequence STU Initialized', category: 'SYSTEM', user: 'System (Automated)', time: 'Today, 02:40 PM' },
                      { action: `Modified SaaS Subscription Plan to ${selectedPlan}`, category: 'PLAN_CHANGE', user: 'aviraj@superadmin.com', time: 'Today, 01:15 PM' },
                      { action: 'Registered Biometric Scanners Handshake BIO-01-MAIN', category: 'DEVICES', user: 'System (Webhook)', time: 'Yesterday, 11:20 AM' },
                      { action: 'Active Tenant Module [transport] turned ON', category: 'CONFIG', user: 'aviraj@superadmin.com', time: '2026-05-26, 09:30 AM' },
                      { action: 'School Database schema migrated safely to PostgreSQL SAAS DB', category: 'DATABASE', user: 'Db-Migrator (CLI)', time: '2026-05-25, 08:00 AM' }
                    ].map((log, i) => (
                      <div key={i} className="py-3 flex justify-between items-start gap-4 text-xs font-semibold">
                        <div>
                          <p className="text-slate-800 dark:text-slate-350">{log.action}</p>
                          <div className="flex gap-2 items-center text-[10px] text-slate-400 mt-1">
                            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase">{log.category}</span>
                            <span>· By {log.user}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400/80 font-medium whitespace-nowrap">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Done Action */}
              <div className="flex justify-end border-t border-slate-100 dark:border-slate-800/80 pt-5 mt-4">
                <Button label="Done" className="bg-primary text-white p-3 px-6 rounded-xl font-bold border-0 hover:opacity-95" onClick={() => setShowDetailDialog(false)} />
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
