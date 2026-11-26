'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

/** Pulls the backend's message out of an axios error. */
export function errMsg(err: any, fallback = 'Something went wrong.'): string {
  const m = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message;
  if (Array.isArray(m)) return m.join(', ');
  return typeof m === 'string' && m ? m : fallback;
}

export const inr = (n: unknown) =>
  `₹${(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const fmtDate = (d?: string | Date | null) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="p-8 sm:p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      {label && <span className="text-xs">{label}</span>}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="p-6 sm:p-10 text-center border border-dashed border-border rounded-2xl">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="p-6 sm:p-8 text-center border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl">
      <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">
        Could not load this data
      </p>
      <p className="text-xs text-zinc-500 mt-1">{errMsg(error, 'Request failed.')}</p>
      {onRetry && (
        <Button size="sm" variant="outline" className="mt-3" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="flex overflow-x-auto scrollbar-none bg-card p-1.5 rounded-xl border border-border w-fit max-w-full print:hidden">
      {tabs.map((t, i) => (
        <button
          key={t}
          onClick={() => onChange(i)}
          className={`shrink-0 whitespace-nowrap px-4 h-10 sm:h-9 text-xs font-semibold rounded-lg transition-all ${
            active === i
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function Panel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm min-w-0 ${className}`}
    >
      {children}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-semibold text-xs text-foreground/80">{label}</label>
      {children}
    </div>
  );
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6 pt-4 border-t border-border [&>button]:w-full sm:[&>button]:w-auto">
      {children}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog isOpen={open} onClose={onClose} title={title}>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{message}</p>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} isLoading={loading}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

/** Active tab index derived from the URL (these pages are one component behind several paths). */
export function tabFromLocation(map: Record<string, number>, fallback = 0): number {
  if (typeof window === 'undefined') return fallback;
  const tab = new URLSearchParams(window.location.search).get('tab');
  if (tab && tab in map) return map[tab];
  for (const [key, idx] of Object.entries(map)) {
    if (window.location.pathname.includes(`/${key}`)) return idx;
  }
  return fallback;
}

export const escapeHtml = (v: unknown) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );

/** Opens a clean print window with the given (already escaped) HTML body. */
export function printHtml(title: string, bodyHtml: string): boolean {
  const w = window.open('', '_blank', 'width=720,height=900');
  if (!w) return false;
  w.document
    .write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#18181b;margin:32px;font-size:13px}
h1{font-size:20px;margin:0}h2{font-size:14px;margin:0 0 4px;color:#52525b;font-weight:600}
.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e4e4e7}
.row.total{font-weight:700;font-size:15px;border-bottom:2px solid #18181b}
.muted{color:#71717a}.head{border-bottom:2px solid #18181b;padding-bottom:12px;margin-bottom:16px}
table{width:100%;border-collapse:collapse}td,th{padding:6px 4px;border-bottom:1px solid #e4e4e7;text-align:left}
</style></head><body>${bodyHtml}<script>window.onload=function(){window.print()}</script></body></html>`);
  w.document.close();
  return true;
}
