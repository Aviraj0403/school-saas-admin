'use client';

import { useEffect } from 'react';

/**
 * Phones: every data table becomes a stack of cards (one card per row, "Label  value" lines)
 * instead of a wide table clipped inside its card. Done once, here, by tagging each cell with
 * its column header; the layout itself is the `.rt` CSS in globals.css (under 640px only).
 *
 * Skipped: tables that opt out with data-no-rt, grids with more than 9 columns (timetables),
 * and tables without a header row.
 */
const MAX_COLS = 9;

function tag(table: HTMLTableElement) {
  if (table.hasAttribute('data-no-rt')) return;
  const head = table.tHead?.rows[0];
  if (!head) return;
  const labels = Array.from(head.cells).map((c) =>
    (c.textContent ?? '').replace(/\s+/g, ' ').trim()
  );
  if (labels.length === 0 || labels.length > MAX_COLS) return;
  table.classList.add('rt');
  for (const body of Array.from(table.tBodies)) {
    for (const row of Array.from(body.rows)) {
      Array.from(row.cells).forEach((cell, i) => {
        if (cell.colSpan > 1) {
          cell.setAttribute('data-span', '1');
          return;
        }
        const label = labels[i] ?? '';
        if (label && cell.getAttribute('data-label') !== label)
          cell.setAttribute('data-label', label);
        if (!(cell.textContent ?? '').trim() && cell.querySelector('button,a,input,select')) {
          cell.setAttribute('data-actions', '1');
        }
      });
    }
  }
}

export default function ResponsiveTables({ rootId = 'main-content' }: { rootId?: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        root.querySelectorAll('table').forEach((t) => tag(t as HTMLTableElement))
      );
    };
    run();
    const mo = new MutationObserver(run);
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [rootId]);
  return null;
}
