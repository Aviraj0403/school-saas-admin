'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Time-of-day greeting used across the role dashboards. */
export function greeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function todayLabel(): string {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

export const inr = (v: unknown) => `₹${Number(v ?? 0).toLocaleString('en-IN')}`;

/** Gradient hero that opens every dashboard. */
export function HeroCard({
  eyebrow,
  title,
  subtitle,
  actions,
  aside,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[28px] bg-brand-gradient p-6 text-white shadow-glow sm:p-8',
        className
      )}
    >
      <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-50" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-white/15 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-black/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-8 top-8 hidden size-40 rounded-full border border-white/15 lg:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-20 top-20 hidden size-40 rounded-full border border-white/10 lg:block"
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          {eyebrow && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              {eyebrow}
            </div>
          )}
          <h1 className="font-display text-[30px] font-semibold leading-[1.1] sm:text-[38px]">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-sm text-white/80 sm:text-[15px]">{subtitle}</p>}
          {actions && <div className="mt-6 flex flex-wrap gap-2.5">{actions}</div>}
        </div>
        {aside && <div className="relative shrink-0">{aside}</div>}
      </div>
    </section>
  );
}

/** Light (white) and glass (translucent) buttons that sit on the hero gradient. */
export function HeroButton({
  href,
  children,
  variant = 'light',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'light' | 'glass';
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold no-underline transition-all hover:-translate-y-px',
        variant === 'light'
          ? 'bg-white text-zinc-900 shadow-lg shadow-black/10 hover:shadow-xl'
          : 'border border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20'
      )}
    >
      {children}
    </Link>
  );
}

/** Standard white surface with a title row. */
export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn('rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6', className)}
    >
      {(title || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h3 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-[13px] text-zinc-500 dark:text-zinc-400">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 no-underline transition-colors hover:bg-brand-muted hover:text-brand dark:bg-white/5 dark:text-zinc-300"
    >
      {children}
      <ArrowUpRight className="size-3.5" />
    </Link>
  );
}

export function EmptyState({
  text,
  icon: Icon = Inbox,
  className,
}: {
  text: string;
  icon?: React.ElementType;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-200 px-6 py-10 text-center dark:border-white/10',
        className
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-white/5">
        <Icon className="size-5" />
      </span>
      <p className="max-w-xs text-[13px] text-zinc-500">{text}</p>
    </div>
  );
}

export interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Tailwind gradient stops, e.g. 'from-violet-500 to-fuchsia-500' */
  gradient: string;
}

export function QuickActions({
  actions,
  columns = 3,
}: {
  actions: QuickAction[];
  columns?: 2 | 3 | 6;
}) {
  const cols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    6: 'grid-cols-3 sm:grid-cols-6',
  }[columns];
  return (
    <div className={cn('grid gap-3', cols)}>
      {actions.map(({ label, href, icon: Icon, gradient }) => (
        <Link
          key={label}
          href={href}
          className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-zinc-50/60 p-4 no-underline transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:bg-card hover:shadow-card-hover dark:bg-white/[0.03]"
        >
          <span
            className={cn(
              'flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg shadow-black/10 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6',
              gradient
            )}
          >
            <Icon className="size-5" />
          </span>
          <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}

/** Row inside a list panel: icon chip, label, value, optional link. */
export function GlanceRow({
  icon: Icon,
  label,
  value,
  href,
  tone = 'bg-zinc-100 text-zinc-500 dark:bg-white/5',
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  href?: string;
  tone?: string;
}) {
  const body = (
    <>
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', tone)}>
        <Icon className="size-4" />
      </span>
      <span className="flex-1 text-[13px] text-zinc-600 dark:text-zinc-300">{label}</span>
      <span className="font-display tabular text-base font-semibold text-zinc-900 dark:text-white">
        {value}
      </span>
    </>
  );
  return href ? (
    <Link
      href={href}
      className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 no-underline transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
    >
      {body}
    </Link>
  ) : (
    <div className="flex items-center gap-3 py-2.5">{body}</div>
  );
}

/**
 * The fee-trend API only returns months that had collections. Fill the last `months`
 * calendar months so gaps show as ₹0 instead of the chart collapsing to a point.
 */
export function lastMonthsSeries(
  raw: unknown,
  months = 6
): Array<{ month: string; amount: number }> {
  const byKey = new Map<string, number>();
  if (Array.isArray(raw)) {
    for (const d of raw as Array<{ month: string; amount: unknown }>) {
      byKey.set(d.month, (byKey.get(d.month) ?? 0) + (Number(d.amount) || 0));
    }
  }
  const now = new Date();
  const out: Array<{ month: string; amount: number }> = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    out.push({ month: d.toLocaleString('en-IN', { month: 'short' }), amount: byKey.get(key) ?? 0 });
  }
  return out;
}
