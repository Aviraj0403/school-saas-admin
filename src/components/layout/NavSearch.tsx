'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { filterNavForUser, NavItem } from '@/config/navigation';

interface PageEntry {
  label: string;
  path: string;
  group: string;
}

function flatten(items: NavItem[]): PageEntry[] {
  const out: PageEntry[] = [];
  let group = '';
  const walk = (list: NavItem[], parent?: string) => {
    for (const item of list) {
      if (item.isSection) {
        group = item.label;
        continue;
      }
      if (item.path && !item.children?.length) {
        out.push({ label: item.label, path: item.path, group: parent || group });
      }
      if (item.children) walk(item.children, item.label);
    }
  };
  walk(items);
  // The same path can appear under several sections; keep the first
  return out.filter((e, i) => out.findIndex((o) => o.path === e.path) === i);
}

/** Jump-to-page search over the navigation the current user can see. Opens with Ctrl/⌘ + K. */
export default function NavSearch() {
  const router = useRouter();
  const { activeUser, activeTenant } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const pages = useMemo(
    () =>
      activeUser && activeTenant
        ? flatten(filterNavForUser(activeUser.role, activeTenant.activeModules))
        : [],
    [activeUser, activeTenant]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages.slice(0, 8);
    return pages
      .filter((p) => p.label.toLowerCase().includes(q) || p.group.toLowerCase().includes(q))
      .slice(0, 10);
  }, [pages, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const go = (entry?: PageEntry) => {
    if (!entry) return;
    setOpen(false);
    router.push(entry.path);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      go(results[cursor]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-3 h-11 w-full max-w-md pl-4 pr-2 rounded-2xl border border-border bg-card text-[13px] text-zinc-400 shadow-xs transition-all hover:shadow-md"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search pages…</span>
        <kbd className="hidden lg:inline-flex items-center rounded-lg bg-zinc-100 dark:bg-white/10 px-2 py-1 text-[11px] font-semibold text-zinc-500">
          Ctrl K
        </kbd>
      </button>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search pages"
        className="md:hidden ml-auto flex size-10 items-center justify-center rounded-full border border-border bg-card text-zinc-500 shadow-xs"
      >
        <Search className="size-[18px]" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
          <div
            className="fixed inset-0 bg-[#140f2d]/45 dark:bg-black/70 backdrop-blur-md animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-xl rounded-3xl border border-border bg-card shadow-pop overflow-hidden animate-slide-up">
            <div className="flex items-center gap-3 px-4 border-b border-border">
              <Search className="size-4 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCursor(0);
                }}
                onKeyDown={onInputKey}
                placeholder="Where do you want to go?"
                className="flex-1 h-14 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
              />
              <kbd className="rounded border border-border px-1.5 text-[11px] text-slate-400">
                Esc
              </kbd>
            </div>
            <ul className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-3 py-8 text-center text-sm text-slate-500">
                  No pages match “{query}”
                </li>
              )}
              {results.map((r, i) => (
                <li key={r.path}>
                  <button
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go(r)}
                    className={`w-full flex items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left ${
                      i === cursor
                        ? 'bg-brand-gradient text-white shadow-glow'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium truncate">{r.label}</span>
                      <span
                        className={`block text-xs truncate ${i === cursor ? 'text-white/75' : 'text-zinc-500'}`}
                      >
                        {r.group}
                      </span>
                    </span>
                    {i === cursor && <CornerDownLeft className="size-3.5 text-white/80 shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
