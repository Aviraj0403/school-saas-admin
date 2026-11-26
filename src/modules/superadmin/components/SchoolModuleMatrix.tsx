'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { errorMessage } from '@/lib/errorMessage';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useSchoolModules, useSetModuleOverride, useSetAddon } from '../hooks/useModuleControl';
import { useModuleRegistry } from '../hooks/useSubscriptions';
import type { SchoolModuleRow, ModuleSource } from '../services/subscription-modules.service';

const money = (n: number | null | undefined) =>
  n == null ? '-' : `₹${Number(n).toLocaleString('en-IN')}`;

const SOURCE_UI: Record<ModuleSource, { label: string; tone: string }> = {
  core: { label: 'Core', tone: 'tone-violet' },
  plan: { label: 'Plan', tone: 'tone-sky' },
  override: { label: 'Override', tone: 'tone-amber' },
  addon: { label: 'Add-on', tone: 'tone-emerald' },
  off: { label: 'Off', tone: 'tone-rose' },
};

const TIER_TONE: Record<string, string> = {
  BASIC: 'tone-teal',
  STANDARD: 'tone-indigo',
  PREMIUM: 'tone-orange',
  ENTERPRISE: 'tone-violet',
};

function Chip({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'tone-chip inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
        tone
      )}
    >
      {children}
    </span>
  );
}

type Choice = 'default' | 'on' | 'off';

function Segmented({
  value,
  disabled,
  onChange,
}: {
  value: Choice;
  disabled?: boolean;
  onChange: (c: Choice) => void;
}) {
  const opts: Array<[Choice, string]> = [
    ['default', 'Default'],
    ['on', 'On'],
    ['off', 'Off'],
  ];
  return (
    <div className="inline-flex rounded-lg border border-border p-0.5" role="group">
      {opts.map(([k, label]) => (
        <button
          key={k}
          type="button"
          disabled={disabled}
          aria-pressed={value === k}
          onClick={() => value !== k && onChange(k)}
          className={cn(
            'rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
            value === k
              ? k === 'off'
                ? 'bg-rose-600 text-white'
                : k === 'on'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function SchoolModuleMatrix({ tenantId }: { tenantId: string }) {
  const { data, isPending, error } = useSchoolModules(tenantId);
  const { data: registry } = useModuleRegistry();
  const setOverride = useSetModuleOverride();
  const [addonFor, setAddonFor] = useState<SchoolModuleRow | null>(null);

  const grouped = useMemo(() => {
    const out: Record<string, SchoolModuleRow[]> = {};
    (data?.modules ?? []).forEach((m) => (out[m.group] ??= []).push(m));
    return out;
  }, [data]);

  const activeCount = (data?.modules ?? []).filter((m) => m.effective).length;
  const total = data?.modules.length ?? 0;

  const choose = (m: SchoolModuleRow, c: Choice) => {
    setOverride.mutate(
      { tenantId, key: m.key, value: c === 'default' ? null : c === 'on' },
      {
        onSuccess: () => toast.success(`${m.label} set to ${c}`),
        onError: (err) => toast.error(errorMessage(err, 'Could not update module')),
      }
    );
  };

  if (isPending) return <p className="text-sm text-zinc-500">Loading modules...</p>;
  if (error)
    return <p className="text-sm text-rose-600">{errorMessage(error, 'Could not load modules')}</p>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="surface-card flex flex-wrap items-center justify-between gap-2 p-4">
        <div>
          <p className="text-eyebrow">Active modules</p>
          <p className="text-card-title">
            {activeCount} of {total} modules active
          </p>
        </div>
        <div className="text-right">
          <p className="text-eyebrow">Plan</p>
          <p className="text-card-title">{data.plan?.name ?? 'No plan'}</p>
        </div>
      </div>

      {Object.entries(grouped).map(([group, mods]) => (
        <div key={group} className="flex flex-col gap-2">
          <p className="text-eyebrow">{registry?.groups?.[group] ?? group}</p>
          <div className="surface-card divide-y divide-border">
            {mods.map((m) => {
              const choice: Choice =
                m.override === true ? 'on' : m.override === false ? 'off' : 'default';
              const src = SOURCE_UI[m.source] ?? SOURCE_UI.off;
              return (
                <div key={m.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
                  <div className="min-w-0 flex-1 basis-56">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold">{m.label}</span>
                      {m.tier && <Chip tone={TIER_TONE[m.tier] ?? 'tone-indigo'}>{m.tier}</Chip>}
                      <Chip tone={src.tone}>{src.label}</Chip>
                      {m.addonExpired && <Chip tone="tone-rose">Expired</Chip>}
                    </div>
                    <p className="text-caption mt-0.5">{m.description}</p>
                    {m.addon && (
                      <p className="text-caption mt-0.5">
                        Add-on ({m.addon.mode})
                        {m.addon.mode === 'paid' && ` - ${money(m.addon.priceMonthly)}/month`}
                        {m.addon.endsAt && ` - ends ${formatDate(m.addon.endsAt)}`}
                        {m.addon.note && ` - ${m.addon.note}`}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      'w-14 text-xs font-semibold',
                      m.effective ? 'text-emerald-600' : 'text-zinc-400'
                    )}
                  >
                    {m.effective ? 'Active' : 'Inactive'}
                  </span>
                  <Segmented
                    value={m.core ? 'on' : choice}
                    disabled={m.core || setOverride.isPending}
                    onChange={(c) => choose(m, c)}
                  />
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={m.core}
                    onClick={() => setAddonFor(m)}
                  >
                    <Plus className="h-3 w-3" /> Add-on
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {addonFor && (
        <AddonDialog tenantId={tenantId} module={addonFor} onClose={() => setAddonFor(null)} />
      )}
    </div>
  );
}

function AddonDialog({
  tenantId,
  module: m,
  onClose,
}: {
  tenantId: string;
  module: SchoolModuleRow;
  onClose: () => void;
}) {
  const setAddon = useSetAddon();
  const [mode, setMode] = useState<'paid' | 'free' | 'trial' | 'off'>(m.addon?.mode ?? 'paid');
  const [price, setPrice] = useState(String(m.addon?.priceMonthly ?? m.priceMonthly ?? ''));
  const [endsAt, setEndsAt] = useState(m.addon?.endsAt ? m.addon.endsAt.slice(0, 10) : '');
  const [note, setNote] = useState(m.addon?.note ?? '');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'trial' && !endsAt) return toast.error('Trial needs an end date');
    const body =
      mode === 'off'
        ? { mode }
        : {
            mode,
            priceMonthly: mode === 'paid' && price !== '' ? Number(price) : undefined,
            endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
            note: note.trim() || undefined,
          };
    setAddon.mutate(
      { tenantId, key: m.key, body },
      {
        onSuccess: () => {
          toast.success(mode === 'off' ? 'Add-on removed' : 'Add-on saved');
          onClose();
        },
        onError: (err) => toast.error(errorMessage(err, 'Could not save add-on')),
      }
    );
  };

  return (
    <Dialog isOpen onClose={onClose} title={`Add-on: ${m.label}`}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-semibold">
          Mode
          <Select
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
            options={[
              { label: 'Paid', value: 'paid' },
              { label: 'Free', value: 'free' },
              { label: 'Trial', value: 'trial' },
              { label: 'Remove add-on', value: 'off' },
            ]}
          />
        </label>
        {mode === 'paid' && (
          <label className="flex flex-col gap-1.5 text-xs font-semibold">
            Price per month (₹)
            <Input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={m.priceMonthly != null ? String(m.priceMonthly) : '0'}
            />
          </label>
        )}
        {(mode === 'trial' || mode === 'paid' || mode === 'free') && (
          <label className="flex flex-col gap-1.5 text-xs font-semibold">
            {mode === 'trial' ? 'Trial ends on *' : 'Ends on (optional)'}
            <Input
              type="date"
              required={mode === 'trial'}
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </label>
        )}
        {mode !== 'off' && (
          <label className="flex flex-col gap-1.5 text-xs font-semibold">
            Note
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
        )}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={setAddon.isPending}>
            {mode === 'off' ? 'Remove add-on' : 'Save add-on'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
