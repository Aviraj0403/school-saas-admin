'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { observabilityService } from '@/services/platform.service';
import { Activity, RefreshCw, Download, ChevronLeft, ChevronRight } from 'lucide-react';

const LEVELS = [
  { label: 'All Levels', value: '' },
  { label: 'trace', value: 'trace' },
  { label: 'debug', value: 'debug' },
  { label: 'info', value: 'info' },
  { label: 'warn', value: 'warn' },
  { label: 'error', value: 'error' },
  { label: 'fatal', value: 'fatal' },
];

const LEVEL_BADGE_VARIANTS: Record<string, 'danger' | 'warning' | 'info' | 'secondary'> = {
  error: 'danger',
  fatal: 'danger',
  warn: 'warning',
  info: 'info',
  debug: 'secondary',
  trace: 'secondary',
};

export default function ObservabilityPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [level, setLevel] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const {
    data: metrics,
    isPending: loadingMetrics,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: observabilityService.metrics,
    refetchInterval: 30_000,
  });

  const { data: logs, isPending: loadingLogs } = useQuery({
    queryKey: ['admin-logs', date, level, search, page],
    queryFn: () => observabilityService.logs({ date, level, search, page, lines: 100 }),
  });

  const entries =
    (logs as any)?.entries ?? (logs as any)?.items ?? (Array.isArray(logs) ? logs : []);

  const fmtBytes = (n?: number) => (n == null ? '—' : `${(n / 1024 / 1024).toFixed(0)} MB`);
  const fmtUptime = (s?: number) => {
    if (s == null) return '—';
    const h = Math.floor(s / 3600),
      m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const m: any = metrics ?? {};

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Observability & Telemetry" subtitle="SuperAdmin" />

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Activity className="w-6 h-6 text-brand" /> System Telemetry & Process Logs
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Process memory, HTTP request metrics, and real-time backend audit logs.
            </p>
          </div>

          <Button variant="outline" onClick={() => refetchMetrics()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh Metrics
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Uptime', value: fmtUptime(m.uptime ?? m.process?.uptime) },
            {
              label: 'Heap Used',
              value: fmtBytes(m.memory?.heapUsed ?? m.process?.memory?.heapUsed),
            },
            { label: 'RSS Memory', value: fmtBytes(m.memory?.rss ?? m.process?.memory?.rss) },
            { label: 'Total Requests', value: m.http?.total ?? m.requests?.total ?? '—' },
          ].map((c) => (
            <div
              key={c.label}
              className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 backdrop-blur-xl shadow-sm"
            >
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                {c.label}
              </span>
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1 font-mono">
                {loadingMetrics ? '...' : String(c.value)}
              </div>
            </div>
          ))}
        </div>

        {/* Log Filters */}
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 backdrop-blur-xl shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Date
              </label>
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => {
                  setDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Level
              </label>
              <Select
                value={level}
                options={LEVELS}
                onChange={(e) => {
                  setLevel(e.target.value);
                  setPage(1);
                }}
                className="text-xs"
              />
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Filter Query
              </label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
                placeholder="Full-text log search..."
                className="text-xs"
              />
            </div>
          </div>

          <a href={`/api/v1/admin/logs/download?date=${date}`} target="_blank" rel="noreferrer">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" /> Download Log File
            </Button>
          </a>
        </div>

        {/* Log Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 backdrop-blur-xl shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
              <tr>
                <th className="px-4 py-3.5">Time</th>
                <th className="px-4 py-3.5">Level</th>
                <th className="px-4 py-3.5">Context</th>
                <th className="px-4 py-3.5">Message Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80 font-mono">
              {loadingLogs ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-zinc-500 font-sans">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                    <p className="text-xs">Fetching log stream...</p>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-zinc-400 font-sans">
                    No log entries matching query filters.
                  </td>
                </tr>
              ) : (
                entries.map((e: any, idx: number) => {
                  const lvl = String(e.level ?? '').toLowerCase();
                  return (
                    <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                        {e.time ? new Date(e.time).toLocaleTimeString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={LEVEL_BADGE_VARIANTS[lvl] || 'secondary'}>
                          {lvl || '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                        {e.context ?? e.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200 break-all">
                        {e.msg ?? e.message ?? JSON.stringify(e)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Simple Pagination */}
          <div className="flex justify-between items-center p-3 border-t border-zinc-200/80 dark:border-zinc-800/80 font-sans">
            <span className="text-xs text-zinc-500 font-mono">Page {page}</span>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                disabled={entries.length === 0}
                onClick={() => setPage(page + 1)}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
