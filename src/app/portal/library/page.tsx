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

  const fineText = (i: any) => {
    const fine = Number(i.fineAmount ?? 0);
    if (fine <= 0) return '—';
    return `${inr(fine)}${i.finePaid ? ' (paid)' : i.fineWaived ? ' (waived)' : ''}`;
  };

  return (
    <QueryState
      query={query}
      isEmpty={list.length === 0}
      emptyText="No library books have been borrowed yet."
      emptyIcon={BookOpen}
    >
      {/* Phones: stacked cards */}
      <ul className="flex flex-col gap-3 md:hidden">
        {list.map((i: any) => {
          const returned = !!i.returnDate || i.status === 'returned';
          const overdue = !returned && new Date(i.dueDate) < now;
          const fine = Number(i.fineAmount ?? 0);
          return (
            <li key={i.id} className="surface-card flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-card-title break-words">{i.book?.title ?? '—'}</p>
                  <p className="text-caption">{i.book?.author}</p>
                </div>
                <Badge
                  className="shrink-0"
                  variant={returned ? 'success' : overdue ? 'danger' : 'info'}
                >
                  {returned ? 'Returned' : overdue ? 'Overdue' : 'Borrowed'}
                </Badge>
              </div>
              <dl className="tabular grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="text-eyebrow">Issued</dt>
                  <dd>{formatDate(i.issueDate)}</dd>
                </div>
                <div>
                  <dt className="text-eyebrow">Due</dt>
                  <dd className={overdue ? 'font-semibold text-rose-600' : undefined}>
                    {formatDate(i.dueDate)}
                  </dd>
                </div>
                {i.returnDate && (
                  <div>
                    <dt className="text-eyebrow">Returned</dt>
                    <dd>{formatDate(i.returnDate)}</dd>
                  </div>
                )}
                {fine > 0 && (
                  <div>
                    <dt className="text-eyebrow">Fine</dt>
                    <dd
                      className={
                        i.finePaid || i.fineWaived
                          ? 'text-muted-foreground'
                          : 'font-semibold text-rose-600'
                      }
                    >
                      {fineText(i)}
                    </dd>
                  </div>
                )}
              </dl>
            </li>
          );
        })}
      </ul>

      {/* md+: table */}
      <div className="surface-card hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-eyebrow">
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
                    <div className="text-caption">{i.book?.author}</div>
                  </td>
                  <td className="px-4 py-3">{formatDate(i.issueDate)}</td>
                  <td className="px-4 py-3">{formatDate(i.dueDate)}</td>
                  <td className="px-4 py-3">{formatDate(i.returnDate)}</td>
                  <td className="px-4 py-3">
                    {fine > 0 ? (
                      <span
                        className={
                          i.finePaid || i.fineWaived
                            ? 'text-muted-foreground'
                            : 'font-semibold text-rose-600'
                        }
                      >
                        {fineText(i)}
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
