'use client';

import React from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';

export interface FormFilterBarProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: {
    id: string;
    label: string;
    value: any;
    options: { label: string; value: any }[];
    onChange: (val: any) => void;
  }[];
  actions?: React.ReactNode;
  onClearFilters?: () => void;
  viewMode?: 'grid' | 'table';
  onViewModeChange?: (mode: 'grid' | 'table') => void;
}

export function FormFilterBar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters = [],
  actions,
  onClearFilters,
  viewMode,
  onViewModeChange,
}: FormFilterBarProps) {
  const hasActiveFilters =
    searchValue || filters.some((f) => f.value !== '' && f.value !== null && f.value !== undefined);

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm transition-all duration-300 flex flex-col gap-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 flex-wrap">
        {/* Search Input Box */}
        <div className="relative flex-1 min-w-[240px]">
          <i className="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm"></i>
          <InputText
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange?.('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <i className="pi pi-times text-xs"></i>
            </button>
          )}
        </div>

        {/* Dropdown Filters & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {filters.map((filter) => (
            <div key={filter.id} className="min-w-[140px] sm:min-w-[160px]">
              <Dropdown
                value={filter.value}
                options={filter.options}
                onChange={(e) => filter.onChange(e.value)}
                placeholder={filter.label}
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          ))}

          {hasActiveFilters && onClearFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              <i className="pi pi-filter-slash text-xs"></i>
              <span>Clear</span>
            </button>
          )}

          {/* Toggle View Mode Buttons */}
          {onViewModeChange && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <i className="pi pi-th-large"></i>
              </button>
              <button
                onClick={() => onViewModeChange('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Table View"
              >
                <i className="pi pi-list"></i>
              </button>
            </div>
          )}

          {/* Action Buttons (e.g. Add Student, Export CSV) */}
          {actions}
        </div>
      </div>
    </div>
  );
}
