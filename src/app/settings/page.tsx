'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/settings.service';
import { useStaffList, useResetStaffPassword } from '@/hooks/queries/useStaff';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import {
  Building,
  Sliders,
  ShieldCheck,
  Check,
  LockKeyhole,
  Users,
  BookOpen,
  CheckSquare,
  Wallet,
  BookMarked,
  Megaphone,
  MessageSquare,
  Home,
  CalendarMinus,
  MapPin,
  IdCard,
} from 'lucide-react';

const ALL_MODULES = [
  {
    id: 'students',
    label: 'Students',
    desc: 'Manage admission files, profile rosters, and student metrics.',
    icon: Users,
  },
  {
    id: 'staff',
    label: 'Staff Directory',
    desc: 'Track employee listings, admin roles, and instructor files.',
    icon: IdCard,
  },
  {
    id: 'academics',
    label: 'Academics Suite',
    desc: 'Timetables, classes, subject schedules, and syllabi.',
    icon: BookOpen,
  },
  {
    id: 'attendance',
    label: 'Attendance Roster',
    desc: 'Daily attendance registry with bulk check-in tools.',
    icon: CheckSquare,
  },
  {
    id: 'fee',
    label: 'Finance & Fees',
    desc: 'Slabs, invoices, receipt collections, and transaction logs.',
    icon: Wallet,
  },
  {
    id: 'exams',
    label: 'Exams & Seating',
    desc: 'Define exam terms, schedules, and seating layouts.',
    icon: Sliders,
  },
  {
    id: 'library',
    label: 'Library Catalog',
    desc: 'Track book catalogs, borrowing logs, and return status.',
    icon: BookMarked,
  },
  {
    id: 'communication',
    label: 'Communication Hub',
    desc: 'Post bulletins, newsletters, and announcements.',
    icon: Megaphone,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp Bot',
    desc: 'Trigger chatbot auto-responders and template logs.',
    icon: MessageSquare,
  },
  {
    id: 'hostel',
    label: 'Hostel System',
    desc: 'Manage room boarding, capacities, and occupancies.',
    icon: Home,
  },
  {
    id: 'leave',
    label: 'Leave Manager',
    desc: 'Process student/staff leaves and request approvals.',
    icon: CalendarMinus,
  },
  {
    id: 'transport',
    label: 'Transport Fleet',
    desc: 'Configure route roadmaps, stops, and coordinates.',
    icon: MapPin,
  },
];

const PLANS = [
  {
    value: 'BASIC',
    label: 'Basic Slab',
    price: '₹4,999/mo',
    desc: 'Core student directory, library catalog, and leave approvals.',
  },
  {
    value: 'STANDARD',
    label: 'Standard Tier',
    price: '₹9,999/mo',
    desc: 'Includes fee management, staff metrics, and exams scheduling.',
  },
  {
    value: 'PREMIUM',
    label: 'Premium Gold',
    price: '₹19,999/mo',
    desc: 'Includes auto seating charts, WhatsApp bots, and advanced analytics.',
  },
  {
    value: 'ENTERPRISE',
    label: 'Enterprise Pro',
    price: 'Custom Quote',
    desc: 'Full transport timeline mappings, multi-branch panels, and dedicated databases.',
  },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'modules' | 'users'>('profile');
  const [baseDomain, setBaseDomain] = useState('.jdinfotechsolutions.in');

  const activeUser = useAuthStore((s) => s.activeUser);
  const canEditSubscription = Boolean(activeUser?.isSuperAdmin);

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

  const { data: staffData, isPending: loadingStaff } = useStaffList(1, 40);
  const resetPasswordMutation = useResetStaffPassword();

  const staffItems = staffData?.items || [];

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
    mutationFn: (form: any) =>
      settingsService.updateTenantDetails({
        name: form.name,
        adminEmail: form.adminEmail,
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated successfully.');
    },
    onError: () => toast.error('Failed to update settings.'),
  });

  const tenantId = (tenant as any)?.id ?? activeUser?.tenantId ?? '';

  const planMutation = useMutation({
    mutationFn: (plan: string) => settingsService.updateTenantPlan(tenantId, plan),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  const modulesMutation = useMutation({
    mutationFn: (modules: string[]) => settingsService.updateTenantModules(tenantId, modules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Module matrix updated.');
    },
    onError: () => toast.error('Failed to update modules.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
    if (canEditSubscription && tenantId && formData.plan !== (tenant as any)?.plan) {
      planMutation.mutate(formData.plan);
    }
  };

  const handleModulesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSubscription || !tenantId) return;
    modulesMutation.mutate(formData.activeModules);
  };

  const toggleModule = (moduleId: string) => {
    if (!canEditSubscription) return;
    setFormData((prev: any) => {
      const activeModules = prev.activeModules.includes(moduleId)
        ? prev.activeModules.filter((m: string) => m !== moduleId)
        : [...prev.activeModules, moduleId];
      return { ...prev, activeModules };
    });
  };

  const handleResetPassword = (id: string, name: string) => {
    if (confirm(`Reset login password to a secure temporary password for ${name}?`)) {
      resetPasswordMutation.mutate(id, {
        onSuccess: () => {
          toast.success(`Successfully reset password for ${name}.`);
        },
        onError: () => toast.error('Failed to reset password.'),
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageBreadcrumb title="Settings" />
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-zinc-400">Loading settings...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Settings" />

      <div className="flex flex-col gap-6 pb-10 w-full animate-fade-in">
        {/* Navigation Tabs */}
        <div className="flex bg-white dark:bg-zinc-900/60 p-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl w-max overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-xs transition-all ${
              activeTab === 'profile'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" /> Identity & Subscription
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('modules')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-xs transition-all ${
              activeTab === 'modules'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Module Matrix
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-xs transition-all ${
              activeTab === 'users'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Login Credentials
          </button>
        </div>

        {/* Tab 1: Profile & Pricing */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm flex flex-col gap-6 backdrop-blur-xl">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  School Profile Parameters
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Basic metadata details about this institutional workspace.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                    School / Tenant Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Heights Academy Junior Wing"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                    Subdomain Slug
                  </label>
                  <div className="relative">
                    <Input
                      value={formData.slug}
                      disabled
                      className="pr-32 font-mono text-zinc-400"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-brand bg-brand/10 px-2 py-1 rounded">
                      {baseDomain}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                    Administrative Contact Email *
                  </label>
                  <Input
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder="admin@heights.edu"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Pricing package slabs */}
            <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm flex flex-col gap-6 backdrop-blur-xl">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Subscription Tier
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  {canEditSubscription
                    ? 'Upgrade or inspect school subscription pricing limits.'
                    : 'Your current subscription tier.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PLANS.map((p) => {
                  const isSelected = formData.plan === p.value;
                  return (
                    <div
                      key={p.value}
                      onClick={() =>
                        canEditSubscription && setFormData({ ...formData, plan: p.value })
                      }
                      className={`rounded-xl border p-5 flex flex-col justify-between gap-4 transition-all duration-200 ${
                        canEditSubscription
                          ? 'cursor-pointer hover:border-zinc-400'
                          : 'cursor-default'
                      } ${
                        isSelected
                          ? 'border-brand bg-brand/5 dark:bg-brand/10 shadow-sm'
                          : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                            {p.label}
                          </span>
                          {isSelected && <Badge variant="success">ACTIVE</Badge>}
                        </div>
                        <h3 className="text-xl font-bold mt-2 text-zinc-900 dark:text-zinc-100">
                          {p.price}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{p.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="submit" isLoading={mutation.isPending}>
                <Check className="w-4 h-4 mr-2" /> Save Profile Settings
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Module Matrix */}
        {activeTab === 'modules' && (
          <form onSubmit={handleModulesSubmit} className="flex flex-col gap-6">
            <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm flex flex-col gap-6 backdrop-blur-xl">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Module Matrix Switcher
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  {canEditSubscription
                    ? 'Enable or disable modules in sidebar index navigation.'
                    : 'Active modules for your school domain.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {ALL_MODULES.map((m) => {
                  const isActive = formData.activeModules.includes(m.id);
                  const IconComp = m.icon;
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleModule(m.id)}
                      className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                        canEditSubscription ? 'cursor-pointer' : 'cursor-default'
                      } ${
                        isActive
                          ? 'border-brand/50 bg-brand/5 dark:bg-brand/10'
                          : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900'
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-lg ${isActive ? 'bg-brand text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-1">
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                            {m.label}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-zinc-300'}`}
                          />
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-1 leading-snug">{m.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {canEditSubscription && (
              <div className="flex justify-end gap-3">
                <Button type="submit" isLoading={modulesMutation.isPending}>
                  <Check className="w-4 h-4 mr-2" /> Save Module Matrix
                </Button>
              </div>
            )}
          </form>
        )}

        {/* Tab 3: App Login Credentials */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm flex flex-col gap-4 backdrop-blur-xl">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Active Login Credentials
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Authorized personnel and faculty with administrative login access.
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Login Email</th>
                      <th className="px-4 py-3">Role Context</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                    {loadingStaff ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                          <p className="text-xs">Loading user credentials...</p>
                        </td>
                      </tr>
                    ) : staffItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-zinc-400">
                          No login users registered yet.
                        </td>
                      </tr>
                    ) : (
                      staffItems.map((d: any) => {
                        const rolesList = Array.isArray(d.roles) ? d.roles : [];
                        const primary = rolesList[0]?.name || d.designation || 'Teacher';
                        return (
                          <tr key={d.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                            <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                              {d.name}
                            </td>
                            <td className="px-4 py-3 font-mono text-brand">{d.email}</td>
                            <td className="px-4 py-3">
                              <Badge variant="info">{primary}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={d.isActive ? 'success' : 'secondary'}>
                                {d.isActive ? 'ACTIVE' : 'INACTIVE'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="outline"
                                onClick={() => handleResetPassword(d.id, d.name)}
                                className="text-xs"
                              >
                                <LockKeyhole className="w-3.5 h-3.5 mr-1" /> Reset Password
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
