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

/** KPI tile in the Central admin style: calm surface, small tinted icon well, tabular number. */
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
    <div className="surface-card group relative flex w-full min-w-0 flex-col overflow-hidden p-4 hover:-translate-y-px">
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradientClass} text-white shadow-sm`}
          >
            {typeof icon === 'string' ? (
              <i className={`${icon} text-base text-white`}></i>
            ) : typeof icon === 'function' ||
              (typeof icon === 'object' && icon !== null && 'render' in icon) ? (
              React.createElement(icon as React.ElementType, {
                className: 'size-[18px] text-white',
              })
            ) : (
              <div className="text-white">{icon}</div>
            )}
          </div>
        )}
        <span className="min-w-0 truncate text-[13px] font-medium text-muted-foreground">
          {label}
        </span>
      </div>

      {loading ? (
        <div className="mt-4 h-8 w-24 animate-pulse rounded-lg bg-muted" />
      ) : (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <span className="tabular truncate text-[26px] font-semibold leading-none tracking-tight text-foreground">
            {value}
          </span>
          {trendPercentage && (
            <span
              className={`mb-0.5 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
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

      <p className="mt-2 truncate text-xs text-muted-foreground">{footerText}</p>
    </div>
  );
}
