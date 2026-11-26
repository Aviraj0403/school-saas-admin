'use client';

import React from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const e = err as any;
  const m = e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message;
  return Array.isArray(m) ? m.join(', ') : typeof m === 'string' && m ? m : fallback;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-muted', className)} />;
}

/** Skeleton cards shown while a query is loading. `text` is kept for screen readers. */
export function LoadingBlock({ text = 'Loading…' }: { text?: string }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label={text}>
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <span className="sr-only">{text}</span>
    </div>
  );
}

export function ErrorBlock({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-8 text-center dark:border-rose-500/20 dark:bg-rose-500/5">
      <AlertTriangle className="size-6 text-rose-500" />
      <p className="max-w-md text-sm text-rose-700 dark:text-rose-300">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="h-11 w-full sm:w-auto">
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
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="max-w-sm text-[13px] text-muted-foreground">{text}</p>
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
