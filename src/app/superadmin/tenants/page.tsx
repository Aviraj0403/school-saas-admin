'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  useTenantsList,
  useCreateTenant,
  useSuspendTenant,
  useActivateTenant,
  useSetTenantPlan,
  useSetTenantModules,
  useUpdateTenant,
  useTenantInvoices,
  useTenantActivityLogs,
} from '@/modules/superadmin/hooks/useTenants';
import { CreateTenantDto, Tenant } from '@/types/api.types';
import { useAuthStore } from '@/store/useAuthStore';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { toast } from 'sonner';
import {
  Plus,
  Eye,
  ArrowRightLeft,
  Ban,
  CheckCircle,
  Building,
  Printer,
  Video,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

const PLANS = [
  { label: 'Basic', value: 'BASIC' },
  { label: 'Standard', value: 'STANDARD' },
  { label: 'Premium', value: 'PREMIUM' },
  { label: 'Enterprise', value: 'ENTERPRISE' },
];

export default function TenantsPage() {
  const { switchTenant, activeTenant } = useAuthStore();
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'biometrics' | 'jitsi'>('grid');
  const [page, setPage] = useState(1);
  const rows = 10;
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
      if (parts.length >= 2 && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        const suffix = parts.slice(1).join('.');
        setBaseDomain(`.${suffix}`);
      }
    }
  }, []);

  const { data, isPending } = useTenantsList(page, rows);
  const createMutation = useCreateTenant();
  const suspendMutation = useSuspendTenant();
  const activateMutation = useActivateTenant();

  const tenants: Tenant[] = data?.data?.items || [];
  const totalRecords = data?.data?.meta?.total || 0;
  const totalPages = Math.ceil(totalRecords / rows) || 1;

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
        toast.success('New school onboarded successfully.');
      },
    });
  };

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('BASIC');
  const [tenantModules, setTenantModules] = useState<string[]>([]);
  const [detailsTab, setDetailsTab] = useState<
    'config' | 'subscriptions' | 'ledger' | 'audit_logs' | 'theme'
  >('config');

  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');

  const planMutation = useSetTenantPlan();
  const modulesMutation = useSetTenantModules();
  const updateTenantMutation = useUpdateTenant();

  const { data: invoicesData } = useTenantInvoices(selectedTenant?.id || '');
  const { data: logsData } = useTenantActivityLogs(selectedTenant?.id || '');

  const invoices: any[] = Array.isArray(invoicesData?.data)
    ? invoicesData.data
    : invoicesData?.data?.items ||
      (invoicesData as any)?.data?.data ||
      (invoicesData as any)?.items ||
      [];

  const activityLogs: any[] = Array.isArray(logsData?.data)
    ? logsData.data
    : logsData?.data?.items || (logsData as any)?.data?.data || (logsData as any)?.items || [];

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
    updateTenantMutation.mutate(
      {
        id: selectedTenant.id,
        data: {
          theme: {
            primaryColor,
            secondaryColor,
          },
        },
      },
      {
        onSuccess: () => {
          toast.success(`School theme primary color is now ${primaryColor}.`);
          setSelectedTenant((prev) =>
            prev ? { ...prev, theme: { primaryColor, secondaryColor } } : null
          );
        },
      }
    );
  };

  const handleUpdatePlan = (plan: string) => {
    if (!selectedTenant) return;
    planMutation.mutate(
      { id: selectedTenant.id, plan },
      {
        onSuccess: () => {
          setSelectedPlan(plan);
          setSelectedTenant((prev) => (prev ? { ...prev, plan: plan as any } : null));
          toast.success(`Updated plan to ${plan}`);
        },
      }
    );
  };

  const handleToggleModule = (mod: string) => {
    if (!selectedTenant) return;
    const isEnabled = tenantModules.includes(mod);
    const updated = isEnabled ? tenantModules.filter((m) => m !== mod) : [...tenantModules, mod];
    setTenantModules(updated);
    modulesMutation.mutate({ id: selectedTenant.id, modules: updated });
  };

  const handleSwitchTenant = (tenant: Tenant) => {
    switchTenant({
      id: tenant.id,
      name: tenant.name,
      activeModules: tenant.activeModules || [
        'students',
        'staff',
        'academics',
        'attendance',
        'fee',
        'exams',
        'library',
        'communication',
        'whatsapp',
        'hostel',
        'leave',
        'transport',
        'homework',
        'website',
        'settings',
      ],
      projectCode: tenant.projectCode,
      subdomain: tenant.subdomain,
      theme: tenant.theme as any,
    });

    toast.success(`Connecting workspace context to ${tenant.name}...`);
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1200);
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Tenants Directory" subtitle="Superadmin" />

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        {/* Header Block */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Building className="w-6 h-6 text-brand" /> Tenant Schools Directory
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Onboard new institute domains, configure active modules, and route multi-tenant SaaS
              environments.
            </p>
          </div>

          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Onboard New School
          </Button>
        </div>

        {/* Global Multi-Tab Control Menu */}
        <div className="flex bg-white dark:bg-zinc-900/60 p-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl w-max">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-xs transition-all ${
              viewMode === 'grid' || viewMode === 'table'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" /> Schools Directory
          </button>
          <button
            onClick={() => setViewMode('biometrics')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-xs transition-all ${
              viewMode === 'biometrics'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5" /> Biometric Terminals
          </button>
          <button
            onClick={() => setViewMode('jitsi')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-xs transition-all ${
              viewMode === 'jitsi'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" /> Jitsi Telemetry
          </button>
        </div>

        {viewMode === 'biometrics' && (
          <div className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-8 bg-white dark:bg-zinc-900/60 backdrop-blur-xl flex flex-col items-center text-center gap-3">
            <Printer className="w-10 h-10 text-brand" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Biometric Hardware Terminals
            </h3>
            <p className="text-xs text-zinc-500 max-w-md">
              Device provisioning and punch ingestion are per-school. Switch into a tenant from the
              directory below, then open Attendance → Devices.
            </p>
            <a href="/attendance/devices">
              <Button variant="outline">Open Device Manager</Button>
            </a>
          </div>
        )}

        {viewMode === 'jitsi' && (
          <div className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-8 bg-white dark:bg-zinc-900/60 backdrop-blur-xl flex flex-col items-center text-center gap-3">
            <Video className="w-10 h-10 text-purple-500" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Online Class Rooms
            </h3>
            <p className="text-xs text-zinc-500 max-w-md">
              Scheduled Jitsi rooms belong to a school's academics module. Switch into a tenant from
              the directory below, then open Academics → Online Classes.
            </p>
            <a href="/academics/online-classes">
              <Button variant="outline">Open Online Classes</Button>
            </a>
          </div>
        )}

        {/* Schools Directory Grid */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                onClick={() => handleSwitchTenant(tenant)}
                className={`bg-white dark:bg-zinc-900/60 border rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4 backdrop-blur-xl ${
                  tenant.isSuspended
                    ? 'border-rose-200 dark:border-rose-950/40'
                    : 'border-zinc-200/80 dark:border-zinc-800/80'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-zinc-400 block uppercase">
                      {tenant.projectCode || 'NO CODE'}
                    </span>
                    <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {tenant.name}
                    </h4>
                    <p className="text-xs font-mono text-brand mt-1 flex items-center gap-1">
                      {tenant.subdomain}
                      {baseDomain} <ExternalLink className="w-3 h-3" />
                    </p>
                  </div>
                  <Badge variant={tenant.isSuspended ? 'danger' : 'success'}>{tenant.plan}</Badge>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex flex-col gap-1.5 text-xs text-zinc-500">
                  <div>
                    Admin:{' '}
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono">
                      {tenant.adminEmail}
                    </span>
                  </div>
                  <div>
                    Modules:{' '}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {tenant.activeModules?.length || 0} Enabled
                    </span>
                  </div>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex justify-between items-center">
                  <Badge variant={tenant.isSuspended ? 'danger' : 'success'}>
                    {tenant.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                  </Badge>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      onClick={() => handleOpenDetails(tenant)}
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>

                    {activeTenant?.id !== tenant.id ? (
                      <Button
                        variant="outline"
                        onClick={() => handleSwitchTenant(tenant)}
                        title="Switch Workspace"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-brand" />
                      </Button>
                    ) : (
                      <Badge variant="success">CURRENT</Badge>
                    )}

                    {!tenant.isSuspended ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Suspend ${tenant.name}?`)) suspendMutation.mutate(tenant.id);
                        }}
                        className="text-rose-600 border-rose-200/80 hover:bg-rose-50"
                        title="Suspend"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Reactivate ${tenant.name}?`))
                            activateMutation.mutate(tenant.id);
                        }}
                        className="text-emerald-600 border-emerald-200/80 hover:bg-emerald-50"
                        title="Reactivate"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-2 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80">
            <span className="text-xs text-zinc-500 font-mono">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Onboard Dialog */}
      <Dialog isOpen={showDialog} onClose={() => setShowDialog(false)} title="Onboard New School">
        <form onSubmit={handleCreate} className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                School Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Oakridge International"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Subdomain *
              </label>
              <Input
                value={formData.subdomain}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  })
                }
                placeholder="e.g. oakridge"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Admin Email *
              </label>
              <Input
                type="email"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                placeholder="admin@school.com"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Admin Phone *
              </label>
              <Input
                value={formData.adminPhone || ''}
                onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                placeholder="+91 98765 43210"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Prefix Code
              </label>
              <Input
                value={formData.prefix || ''}
                onChange={(e) =>
                  setFormData({ ...formData, prefix: e.target.value.toUpperCase().slice(0, 4) })
                }
                placeholder="OAKR"
                maxLength={4}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">Plan</label>
              <Select
                value={formData.plan}
                options={PLANS}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value as any })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Onboard School
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        isOpen={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        title={`Workspace Config — ${selectedTenant?.name || ''}`}
      >
        {selectedTenant && (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs font-mono font-bold text-brand">
                {selectedTenant.subdomain}
                {baseDomain}
              </span>
              <Badge variant="info">{selectedPlan}</Badge>
            </div>

            <div className="flex flex-col gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Change Plan
              </label>
              <Select
                value={selectedPlan}
                options={PLANS}
                onChange={(e) => handleUpdatePlan(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Active Modules
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  'students',
                  'staff',
                  'academics',
                  'attendance',
                  'fee',
                  'exams',
                  'library',
                  'communication',
                  'whatsapp',
                  'hostel',
                  'leave',
                  'transport',
                ].map((mod) => {
                  const active = tenantModules.includes(mod);
                  return (
                    <button
                      type="button"
                      key={mod}
                      onClick={() => handleToggleModule(mod)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium capitalize flex items-center justify-between ${
                        active
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {mod}
                      <span
                        className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-zinc-300'}`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </DashboardLayout>
  );
}
