'use client';

import React from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const e = err as any;
  const m = e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message;
  return Array.isArray(m) ? m.join(', ') : typeof m === 'string' && m ? m : fallback;
}

export function LoadingBlock({ text = 'Loading…' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-16 text-sm text-zinc-500">
      <Loader2 className="size-4 animate-spin" /> {text}
    </div>
  );
}

export function ErrorBlock({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center dark:border-rose-500/20 dark:bg-rose-500/5">
      <AlertTriangle className="size-6 text-rose-500" />
      <p className="max-w-md text-sm text-rose-700 dark:text-rose-300">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyBlock({
  text,
  icon: Icon = Inbox,
}: {
  text: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-200 bg-card px-6 py-14 text-center dark:border-white/10">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-white/5">
        <Icon className="size-5" />
      </span>
      <p className="max-w-sm text-[13px] text-zinc-500">{text}</p>
    </div>
  );
}

interface QueryLike {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

/** Renders loading / error / empty states, then children once data is ready. */
export function QueryState({
  query,
  isEmpty,
  emptyText,
  emptyIcon,
  children,
}: {
  query: QueryLike;
  isEmpty?: boolean;
  emptyText?: string;
  emptyIcon?: React.ElementType;
  children: React.ReactNode;
}) {
  if (query.isPending) return <LoadingBlock />;
  if (query.isError) return <ErrorBlock error={query.error} onRetry={() => query.refetch()} />;
  if (isEmpty) return <EmptyBlock text={emptyText ?? 'Nothing to show yet.'} icon={emptyIcon} />;
  return <>{children}</>;
}
