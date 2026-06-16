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
  gradientClass = 'from-blue-500 to-blue-500', 
  iconBgClass = 'bg-blue-500/10 dark:bg-blue-500/20', 
  iconColorClass = 'text-blue-600 dark:text-blue-400', 
  footerText, 
  loading 
}: StatCardProps) {
  return (
    <div className={`relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl sm:rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group min-w-[200px] w-full premium-glow-effect`}>
      {/* Background Gradient Decorative Shape */}
      <div className={`absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${gradientClass} opacity-5 dark:opacity-[0.03] rounded-full translate-x-6 -translate-y-6 sm:translate-x-8 sm:-translate-y-8`}></div>
      
      <div className="flex flex-row items-center justify-between gap-2">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="block text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px] sm:text-xs truncate">{label}</span>
          {loading ? (
            <Skeleton width="4rem" height="2rem" className="mt-2" />
          ) : (
            <div className="font-black text-2xl sm:text-3xl text-zinc-900 dark:text-zinc-100 mt-1 sm:mt-2 truncate">{value}</div>
          )}
        </div>
        <div className={`flex items-center justify-center ${iconBgClass} rounded-xl sm:rounded-xl min-w-10 min-h-10 w-10 h-10 sm:w-14 sm:h-14 transition-transform duration-300 group-hover:scale-110 flex-shrink-0`}>
          <i className={`${icon} ${iconColorClass} text-xl sm:text-2xl`}></i>
        </div>
      </div>
      
      <p className="text-zinc-500 dark:text-zinc-400 text-[9px] sm:text-[10px] mt-4 sm:mt-5 uppercase font-bold tracking-wide truncate">{footerText}</p>
    </div>
  );
}
