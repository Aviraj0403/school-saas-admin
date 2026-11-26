'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/StatCard';
import {
  CreditCard,
  Building2,
  Hourglass,
  AlertTriangle,
  CirclePause,
  FileText,
} from 'lucide-react';
import { useSuperDashboard, useSchools } from '@/modules/superadmin/hooks/useSubscriptions';
import { statusVariant, money } from '@/modules/superadmin/statusUi';
import { errorMessage } from '@/lib/errorMessage';
import { formatDate } from '@/lib/format';

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'TRIAL', label: 'Trial' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'PAST_DUE', label: 'Past due' },
  { key: 'SUSPENDED', label: 'Suspended' },
  { key: 'CANCELLED', label: 'Cancelled' },
  { key: 'ENDING_SOON', label: 'Trial ending soon' },
];

const DAY = 86_400_000;

export default function BillingPage() {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [now] = useState(() => Date.now());
  const { data: dash, isPending: dashPending, error: dashError } = useSuperDashboard();
  // "Trial ending soon" is a client-side view over TRIAL schools.
  const serverStatus = filter === 'ENDING_SOON' ? 'TRIAL' : filter;
  const { data, isPending, error } = useSchools({
    page,
    limit: 20,
    status: serverStatus || undefined,
  });

  const rows = useMemo(() => {
    const items = data?.items ?? [];
    if (filter !== 'ENDING_SOON') return items;
    const horizon = now + 7 * DAY;
    return items.filter((s) => {
      const t = s.subscription?.trialEndsAt ? +new Date(s.subscription.trialEndsAt) : null;
      return t !== null && t <= horizon;
    });
  }, [data, filter, now]);

  const totals = dash?.totals;
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Billing" subtitle="Superadmin" />
      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <div>
          <h1 className="flex items-center gap-2 text-page-title">
            <CreditCard className="h-6 w-6 text-brand" /> Billing &amp; Subscriptions
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Subscription status across all schools. Open a school in Tenants to create invoices or
            mark them paid.
          </p>
        </div>

        {dashError && (
          <p className="text-sm text-rose-600">
            {errorMessage(dashError, 'Could not load summary')}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Schools"
            value={totals?.totalTenants ?? 0}
            icon={Building2}
            gradientClass="from-violet-500 to-indigo-500"
            footerText="On the platform"
            loading={dashPending}
          />
          <StatCard
            label="Active"
            value={totals?.activeTenants ?? 0}
            icon={CreditCard}
            gradientClass="from-emerald-400 to-teal-500"
            footerText="Paying subscriptions"
            loading={dashPending}
          />
          <StatCard
            label="On trial"
            value={totals?.trialTenants ?? 0}
            icon={Hourglass}
            gradientClass="from-sky-400 to-cyan-500"
            footerText="Trial subscriptions"
            loading={dashPending}
          />
          <StatCard
            label="Suspended"
            value={totals?.suspendedTenants ?? 0}
            icon={CirclePause}
            gradientClass="from-pink-500 to-rose-500"
            footerText="Access paused"
            loading={dashPending}
          />
          <StatCard
            label="Pending invoices"
            value={dash?.pendingInvoices ?? 0}
            icon={FileText}
            gradientClass="from-amber-400 to-orange-500"
            footerText="Awaiting payment"
            loading={dashPending}
          />
        </div>

        {dash?.planBreakdown && dash.planBreakdown.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            {dash.planBreakdown.map((p) => (
              <Badge key={p.plan} variant="secondary">
                {p.plan}: {p.count}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setFilter(f.key);
                setPage(1);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                filter === f.key
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-border text-zinc-500'
              }`}
            >
              {f.key === 'ENDING_SOON' && <AlertTriangle className="mr-1 inline h-3 w-3" />}
              {f.label}
            </button>
          ))}
        </div>

        {isPending && <p className="text-sm text-zinc-500">Loading schools...</p>}
        {error && (
          <p className="text-sm text-rose-600">{errorMessage(error, 'Could not load schools')}</p>
        )}
        {!isPending && !error && rows.length === 0 && (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-zinc-500">
            No schools in this view.
          </p>
        )}

        {rows.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-zinc-400">
                <tr>
                  <th className="p-3">School</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Trial ends</th>
                  <th className="p-3">Period ends</th>
                  <th className="p-3">Next billing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((s) => {
                  const sub = s.subscription;
                  return (
                    <tr key={s.id}>
                      <td className="p-3 font-semibold">
                        <Link href="/superadmin/tenants" className="hover:text-brand">
                          {s.name}
                        </Link>
                        <div className="font-mono text-[10px] font-normal text-zinc-400">
                          {s.subdomain}
                        </div>
                      </td>
                      <td className="p-3">{sub?.plan?.name ?? s.plan ?? '-'}</td>
                      <td className="p-3">
                        <Badge variant={statusVariant(sub?.status)}>{sub?.status ?? 'NONE'}</Badge>
                      </td>
                      <td className="p-3">
                        {sub ? `${money(sub.amount)} / ${sub.billingCycle}` : '-'}
                      </td>
                      <td className="p-3">
                        {sub?.trialEndsAt ? formatDate(sub.trialEndsAt) : '-'}
                      </td>
                      <td className="p-3">
                        {sub?.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : '-'}
                      </td>
                      <td className="p-3">
                        {sub?.nextBillingAt ? formatDate(sub.nextBillingAt) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Prev
            </Button>
            <span>
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
