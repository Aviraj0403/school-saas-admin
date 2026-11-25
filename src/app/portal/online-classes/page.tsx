'use client';

import React from 'react';
import { Video } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import { EmptyBlock, QueryState } from '@/components/portal/QueryState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePortalOnlineClasses } from '@/hooks/queries/useFamily';

const fmt = (v: string) =>
  new Date(v).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

function ClassCard({ c, past }: { c: any; past?: boolean }) {
  const live = c.status === 'LIVE';
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-semibold">{c.title}</h3>
          <p className="text-xs text-zinc-500">{c.subject?.name ?? 'General'}</p>
        </div>
        <Badge variant={live ? 'success' : past ? 'secondary' : 'info'}>
          {live ? 'Live now' : past ? c.status?.toLowerCase() : 'Scheduled'}
        </Badge>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        {fmt(c.scheduledAt)} · {c.duration} min
      </p>
      {c.description && <p className="line-clamp-2 text-xs text-zinc-500">{c.description}</p>}
      <div className="flex flex-wrap gap-2">
        {!past && c.joinUrl && (
          <a href={c.joinUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant={live ? 'default' : 'outline'}>
              <Video /> Join class
            </Button>
          </a>
        )}
        {c.recordingUrl && (
          <a href={c.recordingUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">
              Recording
            </Button>
          </a>
        )}
      </div>
    </article>
  );
}

function OnlineClassesView({ classId }: { classId?: string | null }) {
  const query = usePortalOnlineClasses(classId);
  if (!classId) {
    return (
      <EmptyBlock
        icon={Video}
        text="You have not been assigned to a class yet, so there are no online classes to show."
      />
    );
  }
  const all = query.data ?? [];
  const isPast = (c: any) => ['COMPLETED', 'CANCELLED'].includes(c.status);
  const upcoming = all
    .filter((c) => !isPast(c))
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
  const past = all.filter(isPast);

  return (
    <QueryState
      query={query}
      isEmpty={all.length === 0}
      emptyText="No online classes have been scheduled for your class."
      emptyIcon={Video}
    >
      <div className="flex flex-col gap-8">
        <section>
          <h3 className="mb-3 font-display text-lg font-semibold">Upcoming</h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-zinc-500">Nothing scheduled right now.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {upcoming.map((c) => (
                <ClassCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </section>
        {past.length > 0 && (
          <section>
            <h3 className="mb-3 font-display text-lg font-semibold">Earlier</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {past.map((c) => (
                <ClassCard key={c.id} c={c} past />
              ))}
            </div>
          </section>
        )}
      </div>
    </QueryState>
  );
}

export default function PortalOnlineClassesPage() {
  return (
    <PortalShell title="Online Classes" description="Live classes for your class">
      {({ child }) => <OnlineClassesView classId={child.classId} />}
    </PortalShell>
  );
}
