'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useQuery } from '@tanstack/react-query';
import { observabilityService } from '@/services/platform.service';

const LEVELS = ['', 'trace', 'debug', 'info', 'warn', 'error', 'fatal'];

const LEVEL_STYLES: Record<string, string> = {
  error: 'bg-rose-500/10 text-rose-600',
  fatal: 'bg-rose-500/20 text-rose-700',
  warn: 'bg-amber-500/10 text-amber-600',
  info: 'bg-blue-500/10 text-blue-600',
  debug: 'bg-zinc-500/10 text-zinc-500',
  trace: 'bg-zinc-500/10 text-zinc-400',
};

/**
 * Server metrics and logs (superadmin).
 *
 * Four endpoints that had no UI, so the only way to read process health or
 * server logs was to SSH into the VPS. During this project's own deploys that
 * meant a failure could only be diagnosed from GitHub Actions output.
 */
export default function ObservabilityPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [level, setLevel] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: metrics, isPending: loadingMetrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: observabilityService.metrics,
    refetchInterval: 30_000,
  });

  const { data: logs, isPending: loadingLogs } = useQuery({
    queryKey: ['admin-logs', date, level, search, page],
    queryFn: () => observabilityService.logs({ date, level, search, page, lines: 100 }),
  });

  const entries = (logs as any)?.entries ?? (logs as any)?.items ?? (Array.isArray(logs) ? logs : []);

  const fmtBytes = (n?: number) => (n == null ? '—' : `${(n / 1024 / 1024).toFixed(0)} MB`);
  const fmtUptime = (s?: number) => {
    if (s == null) return '—';
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const m: any = metrics ?? {};

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Observability" subtitle="SuperAdmin" />

      <div className="flex flex-col gap-4 pb-10 animate-fade-in">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Uptime', value: fmtUptime(m.uptime ?? m.process?.uptime) },
            { label: 'Heap used', value: fmtBytes(m.memory?.heapUsed ?? m.process?.memory?.heapUsed) },
            { label: 'RSS', value: fmtBytes(m.memory?.rss ?? m.process?.memory?.rss) },
            { label: 'Requests', value: m.http?.total ?? m.requests?.total ?? '—' },
          ].map((c) => (
            <div key={c.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{c.label}</span>
              <div className="text-xl font-black text-zinc-900 dark:text-white mt-1">
                {loadingMetrics ? '…' : String(c.value)}
              </div>
            </div>
          ))}
        </div>

        {/* Log filters */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Date</label>
            <input type="date" value={date} max={today} onChange={(e) => { setDate(e.target.value); setPage(1); }} className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md text-sm" />
          </div>
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Level</label>
            <Dropdown value={level} options={LEVELS.map((l) => ({ label: l || 'all', value: l }))} onChange={(e) => { setLevel(e.value); setPage(1); }} className="text-sm" />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Search</label>
            <InputText value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setPage(1)} placeholder="full-text over the entry" className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md text-sm" />
          </div>
          <Button icon="pi pi-refresh" onClick={() => refetchMetrics()} className="p-2.5 px-4 rounded-md border border-zinc-200 dark:border-zinc-700" />
          <a
            href={`/api/v1/admin/logs/download?date=${date}`}
            className="p-2.5 px-4 rounded-md border border-zinc-200 dark:border-zinc-700 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300"
          >
            Download
          </a>
        </div>

        {/* Log table */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm">
          <DataTable value={entries} loading={loadingLogs} emptyMessage="No log entries for these filters." dataKey="time">
            <Column header="Time" body={(e: any) => (
              <span className="text-xs font-mono text-zinc-500">
                {e.time ? new Date(e.time).toLocaleTimeString() : '—'}
              </span>
            )} />
            <Column header="Level" body={(e: any) => {
              const lvl = String(e.level ?? '').toLowerCase();
              return <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${LEVEL_STYLES[lvl] ?? ''}`}>{lvl || '—'}</span>;
            }} />
            <Column header="Context" body={(e: any) => <span className="text-xs text-zinc-500">{e.context ?? e.name ?? '—'}</span>} />
            <Column header="Message" body={(e: any) => (
              <span className="text-xs text-zinc-700 dark:text-zinc-200 break-all">{e.msg ?? e.message ?? JSON.stringify(e)}</span>
            )} />
          </DataTable>
          <div className="flex justify-between items-center p-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button label="Previous" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-2 px-4 text-xs rounded-md border border-zinc-200 dark:border-zinc-700" />
            <span className="text-xs text-zinc-500">Page {page}</span>
            <Button label="Next" disabled={entries.length === 0} onClick={() => setPage((p) => p + 1)} className="p-2 px-4 text-xs rounded-md border border-zinc-200 dark:border-zinc-700" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
