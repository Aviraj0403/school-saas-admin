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
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  icon,
  gradientClass = 'from-blue-500 to-indigo-500',
  iconBgClass = 'bg-blue-500/10 dark:bg-blue-500/20',
  iconColorClass = 'text-blue-600 dark:text-blue-400',
  footerText,
  loading,
}: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_12px_40px_rgba(59,130,246,0.15)] hover:border-slate-300 dark:hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between group min-w-[200px] w-full`}
    >
      {/* Subtle Glowing Gradient Accent Background */}
      <div
        className={`absolute top-0 right-0 w-28 h-28 sm:w-36 sm:h-36 bg-gradient-to-br ${gradientClass} opacity-[0.08] dark:opacity-[0.12] rounded-full translate-x-8 -translate-y-8 transition-transform duration-500 group-hover:scale-125 blur-md`}
      ></div>
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${gradientClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      ></div>

      <div className="flex flex-row items-center justify-between gap-3 relative z-10">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="block text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest text-[10px] sm:text-[11px] truncate">
            {label}
          </span>
          {loading ? (
            <Skeleton width="4rem" height="2rem" className="mt-2" />
          ) : (
            <div className="font-black text-2xl sm:text-3xl text-slate-900 dark:text-slate-50 mt-1.5 truncate tracking-tight">
              {value}
            </div>
          )}
        </div>
        <div
          className={`flex items-center justify-center ${iconBgClass} rounded-2xl min-w-12 min-h-12 w-12 h-12 sm:w-14 sm:h-14 transition-transform duration-300 group-hover:scale-110 flex-shrink-0 shadow-sm border border-white/10`}
        >
          <i className={`${icon} ${iconColorClass} text-xl sm:text-2xl`}></i>
        </div>
      </div>

      <p className="text-slate-400 dark:text-slate-500 text-[10px] sm:text-[11px] mt-4 sm:mt-5 uppercase font-bold tracking-wider truncate flex items-center gap-1.5 relative z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-70"></span>
        {footerText}
      </p>
    </div>
  );
}
