'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string | React.ReactNode | React.ElementType;
  gradientClass?: string;
  iconBgClass?: string;
  iconColorClass?: string;
  footerText: string;
  trendPercentage?: string;
  trendUp?: boolean;
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  icon,
  gradientClass = 'from-blue-500 to-fuchsia-500',
  footerText,
  trendPercentage,
  trendUp = true,
  loading,
}: StatCardProps) {
  return (
    <div className="group relative flex w-full min-w-[200px] flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      {/* Soft colour wash in the corner, tinted by the card's accent */}
      <div
        className={`pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-gradient-to-br ${gradientClass} opacity-[0.13] blur-2xl transition-opacity duration-300 group-hover:opacity-25 dark:opacity-20`}
      />

      <div className="relative flex items-center gap-3">
        {icon && (
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientClass} text-white shadow-lg shadow-black/10 ring-4 ring-white dark:ring-white/5`}
          >
            {typeof icon === 'string' ? (
              <i className={`${icon} text-lg text-white`}></i>
            ) : typeof icon === 'function' ||
              (typeof icon === 'object' && icon !== null && 'render' in icon) ? (
              React.createElement(icon as React.ElementType, { className: 'size-5 text-white' })
            ) : (
              <div className="text-white">{icon}</div>
            )}
          </div>
        )}
        <span className="min-w-0 truncate text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
      </div>

      {loading ? (
        <div className="relative mt-5 h-9 w-28 animate-pulse rounded-xl bg-zinc-100 dark:bg-white/5"></div>
      ) : (
        <div className="relative mt-4 flex flex-wrap items-end gap-2">
          <span className="font-display tabular truncate text-[32px] font-semibold leading-none text-zinc-900 dark:text-white">
            {value}
          </span>
          {trendPercentage && (
            <span
              className={`mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                trendUp
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              {trendUp ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {trendPercentage}
            </span>
          )}
        </div>
      )}

      <p className="relative mt-3 truncate text-xs text-zinc-500 dark:text-zinc-400">
        {footerText}
      </p>
    </div>
  );
}
