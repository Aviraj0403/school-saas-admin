'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useSelectedChild } from './useChildStore';

/** Horizontally scrollable chip row (avatar initial + name), shown only when a login sees 2+ children. */
export function ChildSwitcher({ className }: { className?: string }) {
  const { children, studentId, setChild } = useSelectedChild();
  if (children.length < 2) return null;

  return (
    <div
      role="tablist"
      aria-label="Select child"
      className={cn(
        '-mx-3.5 flex snap-x items-center gap-2 overflow-x-auto px-3.5 pb-1 scrollbar-none sm:mx-0 sm:px-0',
        className
      )}
    >
      {children.map((c) => {
        const active = c.id === studentId;
        return (
          <button
            key={c.id}
            role="tab"
            aria-selected={active}
            onClick={() => setChild(c.id)}
            className={cn(
              'flex h-12 shrink-0 snap-start items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 text-[14px] font-semibold transition-colors active:scale-[0.97]',
              active
                ? 'border-transparent bg-brand-gradient text-white shadow-glow'
                : 'border-border bg-card text-foreground hover:bg-muted'
            )}
          >
            <span
              className={cn(
                'flex size-9 items-center justify-center rounded-full text-sm font-bold uppercase',
                active ? 'bg-white/25 text-white' : 'tone-brand tone-chip'
              )}
            >
              {(c.name ?? '?').trim().charAt(0) || '?'}
            </span>
            <span className="max-w-[10rem] truncate">{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}
