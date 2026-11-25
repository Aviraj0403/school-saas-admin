'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import { QueryState } from '@/components/portal/QueryState';
import { Badge } from '@/components/ui/badge';
import { useLibraryIssues } from '@/hooks/queries/useFamily';
import { formatDate } from '@/lib/format';
import { inr } from '@/components/dashboard/kit';

function LibraryView({ studentId }: { studentId: string }) {
  const query = useLibraryIssues(studentId);
  const list = query.data ?? [];
  const now = new Date();

  return (
    <QueryState
      query={query}
      isEmpty={list.length === 0}
      emptyText="No library books have been borrowed yet."
      emptyIcon={BookOpen}
    >
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-zinc-400">
              <th className="px-4 py-3">Book</th>
              <th className="px-4 py-3">Issued</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Returned</th>
              <th className="px-4 py-3">Fine</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((i: any) => {
              const returned = !!i.returnDate || i.status === 'returned';
              const overdue = !returned && new Date(i.dueDate) < now;
              const fine = Number(i.fineAmount ?? 0);
              return (
                <tr key={i.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{i.book?.title ?? '—'}</div>
                    <div className="text-xs text-zinc-500">{i.book?.author}</div>
                  </td>
                  <td className="px-4 py-3">{formatDate(i.issueDate)}</td>
                  <td className="px-4 py-3">{formatDate(i.dueDate)}</td>
                  <td className="px-4 py-3">{formatDate(i.returnDate)}</td>
                  <td className="px-4 py-3">
                    {fine > 0 ? (
                      <span
                        className={
                          i.finePaid || i.fineWaived
                            ? 'text-zinc-500'
                            : 'font-semibold text-rose-600'
                        }
                      >
                        {inr(fine)}
                        {i.finePaid ? ' (paid)' : i.fineWaived ? ' (waived)' : ''}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={returned ? 'success' : overdue ? 'danger' : 'info'}>
                      {returned ? 'Returned' : overdue ? 'Overdue' : 'Borrowed'}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </QueryState>
  );
}

export default function PortalLibraryPage() {
  return (
    <PortalShell title="Library" description="Books borrowed, due dates and fines">
      {({ studentId }) => <LibraryView studentId={studentId} />}
    </PortalShell>
  );
}
