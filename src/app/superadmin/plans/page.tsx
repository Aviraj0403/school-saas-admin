'use client';

import React, { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Layers, Plus, Pencil, Check } from 'lucide-react';
import { errorMessage } from '@/lib/errorMessage';
import {
  usePlans,
  useModuleRegistry,
  useCreatePlan,
  useUpdatePlan,
} from '@/modules/superadmin/hooks/useSubscriptions';
import type { Plan, PlanInput } from '@/modules/superadmin/services/subscription.service';

const LIMIT_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'students', label: 'Students' },
  { key: 'staff', label: 'Staff' },
  { key: 'storage_mb', label: 'Storage (MB)' },
  { key: 'whatsapp_month', label: 'WhatsApp msgs / month' },
];

interface FormState {
  name: string;
  slug: string;
  description: string;
  price: string;
  billingCycle: string;
  modules: string[];
  limitsJson: string;
  featuresText: string;
  isPublic: boolean;
  sortOrder: string;
}

const emptyForm = (): FormState => ({
  name: '',
  slug: '',
  description: '',
  price: '0',
  billingCycle: 'monthly',
  modules: ['core'],
  limitsJson: JSON.stringify(
    { students: 200, staff: 20, storage_mb: 1024, whatsapp_month: 0 },
    null,
    2
  ),
  featuresText: '',
  isPublic: true,
  sortOrder: '0',
});

const money = (p: number | string) => `₹${Number(p).toLocaleString('en-IN')}`;

export default function PlansPage() {
  const { data: plans = [], isPending, error } = usePlans();
  const { data: registry } = useModuleRegistry();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const grouped = useMemo(() => {
    const out: Record<string, NonNullable<typeof registry>['modules']> = {};
    (registry?.modules ?? []).forEach((m) => {
      (out[m.group] ??= []).push(m);
    });
    return out;
  }, [registry]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (p: Plan) => {
    setEditing(p);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description ?? '',
      price: String(p.price),
      billingCycle: p.billingCycle,
      modules: p.modules ?? [],
      limitsJson: JSON.stringify(p.limits ?? {}, null, 2),
      featuresText: (p.features ?? []).join(', '),
      isPublic: p.isPublic,
      sortOrder: String(p.sortOrder ?? 0),
    });
    setOpen(true);
  };

  const toggleModule = (key: string) =>
    setForm((f) => ({
      ...f,
      modules: f.modules.includes(key) ? f.modules.filter((m) => m !== key) : [...f.modules, key],
    }));

  const setLimit = (key: string, value: string) => {
    try {
      const cur = JSON.parse(form.limitsJson || '{}');
      if (value === '') delete cur[key];
      else cur[key] = Number(value);
      setForm({ ...form, limitsJson: JSON.stringify(cur, null, 2) });
    } catch {
      toast.error('Fix the limits JSON before using the quick fields.');
    }
  };

  const parsedLimits = useMemo(() => {
    try {
      const v = JSON.parse(form.limitsJson || '{}');
      return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, number>) : null;
    } catch {
      return null;
    }
  }, [form.limitsJson]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedLimits)
      return toast.error('Limits must be a valid JSON object, e.g. {"students": 500}.');
    const body: PlanInput = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      description: form.description.trim() || undefined,
      price: Number(form.price) || 0,
      billingCycle: form.billingCycle,
      modules: form.modules,
      limits: parsedLimits,
      features: form.featuresText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      isPublic: form.isPublic,
      sortOrder: Number(form.sortOrder) || 0,
    };
    const done = () => {
      toast.success(editing ? 'Plan updated' : 'Plan created');
      setOpen(false);
    };
    const fail = (err: unknown) => toast.error(errorMessage(err, 'Could not save plan'));
    if (editing) {
      // slug and billing cycle are fixed once created (not accepted by the update endpoint)
      const { slug: _s, billingCycle: _b, ...patch } = body;
      void _s;
      void _b;
      updatePlan.mutate({ id: editing.id, body: patch }, { onSuccess: done, onError: fail });
    } else {
      createPlan.mutate(body, { onSuccess: done, onError: fail });
    }
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Subscription Plans" subtitle="Superadmin" />
      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              <Layers className="h-6 w-6 text-brand" /> Subscription Plans
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Plans define price, modules, limits and features. Schools inherit them through their
              subscription.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> New plan
          </Button>
        </div>

        {isPending && <p className="text-sm text-zinc-500">Loading plans…</p>}
        {error && (
          <p className="text-sm text-rose-600">{errorMessage(error, 'Could not load plans')}</p>
        )}
        {!isPending && !error && plans.length === 0 && (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-zinc-500">
            No plans yet. Create the first one.
          </p>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{p.name}</h3>
                  <p className="font-mono text-[11px] text-zinc-400">{p.slug}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={p.isActive ? 'success' : 'secondary'}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {!p.isPublic && <Badge variant="warning">Private</Badge>}
                </div>
              </div>
              <p className="text-2xl font-bold text-brand">
                {money(p.price)}
                <span className="text-xs font-normal text-zinc-500"> / {p.billingCycle}</span>
              </p>
              {p.description && <p className="text-xs text-zinc-500">{p.description}</p>}
              <div className="text-xs text-zinc-500">
                <p className="mb-1 font-semibold text-zinc-700 dark:text-zinc-300">Limits</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(p.limits ?? {}).map(([k, v]) => (
                    <Badge key={k} variant="secondary">
                      {k}: {Number(v) < 0 ? 'unlimited' : v}
                    </Badge>
                  ))}
                  {Object.keys(p.limits ?? {}).length === 0 && <span>None set</span>}
                </div>
              </div>
              <div className="text-xs text-zinc-500">
                <p className="mb-1 font-semibold text-zinc-700 dark:text-zinc-300">
                  Modules ({p.modules?.length ?? 0})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(p.modules ?? []).map((m) => (
                    <Badge key={m} variant="info">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
              {(p.trialDays != null || p.graceDays != null) && (
                <p className="text-[11px] text-zinc-400">
                  Trial {p.trialDays ?? 0} days · Grace {p.graceDays ?? 0} days
                </p>
              )}
              <div className="mt-auto flex gap-2 border-t border-border pt-3">
                <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit plan — ${editing.name}` : 'New plan'}
        className="max-w-3xl"
      >
        <form onSubmit={save} className="flex min-h-0 flex-col gap-4 overflow-y-auto px-7 pb-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
              Name *
              <Input
                value={form.name}
                required
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
              Slug *
              <Input
                value={form.slug}
                required
                disabled={!!editing}
                onChange={(e) =>
                  setForm({
                    ...form,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                  })
                }
                placeholder="standard"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
              Price (₹) *
              <Input
                type="number"
                min={0}
                value={form.price}
                required
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
              Billing cycle
              <Select
                value={form.billingCycle}
                disabled={!!editing}
                options={[
                  { label: 'Monthly', value: 'monthly' },
                  { label: 'Yearly', value: 'yearly' },
                  { label: 'One time', value: 'one_time' },
                ]}
                onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold sm:col-span-2">
              Description
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold">
              Sort order
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              />
            </label>
            <label className="flex items-center gap-2 pt-6 text-xs font-semibold">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
              />
              Public plan (visible for self sign-up)
            </label>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold">Limits (-1 = unlimited)</p>
            <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LIMIT_FIELDS.map((f) => (
                <label key={f.key} className="flex flex-col gap-1 text-[11px] text-zinc-500">
                  {f.label}
                  <Input
                    type="number"
                    value={parsedLimits?.[f.key] ?? ''}
                    onChange={(e) => setLimit(f.key, e.target.value)}
                  />
                </label>
              ))}
            </div>
            <Textarea
              className="font-mono text-xs"
              value={form.limitsJson}
              onChange={(e) => setForm({ ...form, limitsJson: e.target.value })}
            />
            {!parsedLimits && <p className="mt-1 text-xs text-rose-600">Invalid JSON object.</p>}
          </div>

          <label className="flex flex-col gap-1.5 text-xs font-semibold">
            Features (comma separated)
            <Input
              value={form.featuresText}
              onChange={(e) => setForm({ ...form, featuresText: e.target.value })}
              placeholder="whatsapp, api_access, webhooks"
            />
          </label>

          <div>
            <p className="mb-2 text-xs font-semibold">Modules included</p>
            {Object.keys(grouped).length === 0 && (
              <p className="text-xs text-zinc-500">Loading module registry…</p>
            )}
            {Object.entries(grouped).map(([group, mods]) => (
              <div key={group} className="mb-3">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {registry?.groups?.[group] ?? group}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {mods.map((m) => {
                    const on = form.modules.includes(m.key) || !!m.core;
                    return (
                      <button
                        type="button"
                        key={m.key}
                        title={m.description}
                        disabled={m.core}
                        onClick={() => toggleModule(m.key)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-left text-xs font-medium ${
                          on
                            ? 'border-brand bg-brand/10 text-brand'
                            : 'border-zinc-200 text-zinc-500 dark:border-zinc-800'
                        }`}
                      >
                        {m.label}
                        {on && <Check className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createPlan.isPending || updatePlan.isPending}>
              {editing ? 'Save changes' : 'Create plan'}
            </Button>
          </div>
        </form>
      </Dialog>
    </DashboardLayout>
  );
}
