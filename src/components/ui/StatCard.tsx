'use client';

import React from 'react';
import { Skeleton } from 'primereact/skeleton';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
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
  gradientClass = 'from-indigo-500 to-purple-600',
  iconBgClass = 'bg-indigo-500/10 dark:bg-indigo-500/20',
  iconColorClass = 'text-indigo-600 dark:text-indigo-400',
  footerText,
  trendPercentage,
  trendUp = true,
  loading,
}: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden bg-white/90 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-xl dark:hover:shadow-[0_12px_40px_rgba(99,102,241,0.18)] hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between group min-w-[200px] w-full`}
    >
      {/* Dynamic Ambient Blur Glow Accent */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradientClass} opacity-[0.09] dark:opacity-[0.15] rounded-full translate-x-8 -translate-y-8 transition-transform duration-500 group-hover:scale-125 blur-lg`}
      ></div>
      <div
        className={`absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r ${gradientClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      ></div>

      <div className="flex flex-row items-center justify-between gap-3 relative z-10">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="block text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] truncate">
            {label}
          </span>
          {loading ? (
            <Skeleton width="4rem" height="2rem" className="mt-2" />
          ) : (
            <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
              <span className="font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-slate-50 tracking-tight truncate">
                {value}
              </span>
              {trendPercentage && (
                <span
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    trendUp
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <i
                    className={`pi ${trendUp ? 'pi-arrow-up-right' : 'pi-arrow-down-right'} text-[9px]`}
                  ></i>
                  {trendPercentage}
                </span>
              )}
            </div>
          )}
        </div>
        <div
          className={`flex items-center justify-center ${iconBgClass} rounded-2xl min-w-12 min-h-12 w-12 h-12 sm:w-14 sm:h-14 transition-transform duration-300 group-hover:scale-110 flex-shrink-0 shadow-sm border border-white/20 dark:border-slate-700/50`}
        >
          <i className={`${icon} ${iconColorClass} text-xl sm:text-2xl`}></i>
        </div>
      </div>

      <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-4 sm:mt-5 font-semibold tracking-wide truncate flex items-center gap-1.5 relative z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-80 animate-ping"></span>
        {footerText}
      </p>
    </div>
  );
}
