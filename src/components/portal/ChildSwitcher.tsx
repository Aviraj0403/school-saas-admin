'use client';

import React from 'react';
import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSelectedChild } from './useChildStore';

/** Tab-style picker shown only when a login can see more than one child. */
export function ChildSwitcher({ className }: { className?: string }) {
  const { children, studentId, setChild } = useSelectedChild();
  if (children.length < 2) return null;

  return (
    <div
      role="tablist"
      aria-label="Select child"
      className={cn('flex flex-wrap items-center gap-2', className)}
    >
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        <GraduationCap className="size-4" /> Child
      </span>
      {children.map((c) => {
        const active = c.id === studentId;
        return (
          <button
            key={c.id}
            role="tab"
            aria-selected={active}
            onClick={() => setChild(c.id)}
            className={cn(
              'rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors',
              active
                ? 'bg-brand-gradient text-white shadow-glow'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10'
            )}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
