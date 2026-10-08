'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Search, X, FilterX, LayoutGrid, List } from 'lucide-react';

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
  searchPlaceholder = 'Search...',
  filters = [],
  actions,
  onClearFilters,
  viewMode = 'grid',
  onViewModeChange,
}: FormFilterBarProps) {
  const hasActiveFilters =
    searchValue.trim().length > 0 ||
    filters.some((f) => f.value !== undefined && f.value !== '' && f.value !== null);

  return (
    <div className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-sm mb-6 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        {/* Search Input Box */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
          <Input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-10 pr-9"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange?.('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Dropdown Filters & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {filters.map((filter) => (
            <div key={filter.id} className="min-w-[140px] sm:min-w-[160px]">
              <Select value={filter.value || ''} onChange={(e) => filter.onChange(e.target.value)}>
                <option value="">{filter.label}</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          ))}

          {hasActiveFilters && onClearFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              <FilterX className="size-4" />
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
                    ? 'bg-white dark:bg-brand text-brand dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                onClick={() => onViewModeChange('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-brand text-brand dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Table View"
              >
                <List className="size-4" />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          {actions}
        </div>
      </div>
    </div>
  );
}
