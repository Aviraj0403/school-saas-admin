'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { BookOpenCheck, CalendarClock, Paperclip, Upload } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import { QueryState, errorMessage } from '@/components/portal/QueryState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useFamilyHomework, useSubmitFamilyHomework } from '@/hooks/queries/useFamily';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const STATUS: Record<string, { label: string; variant: any }> = {
  pending: { label: 'Pending', variant: 'warning' },
  missing: { label: 'Missing', variant: 'danger' },
  submitted: { label: 'Submitted', variant: 'info' },
  late: { label: 'Submitted late', variant: 'warning' },
  graded: { label: 'Graded', variant: 'success' },
};

const MAX_FILE_MB = 10;

function HomeworkView({ studentId, canSubmit }: { studentId: string; canSubmit: boolean }) {
  const query = useFamilyHomework(studentId);
  const submit = useSubmitFamilyHomework();
  const [active, setActive] = useState<any | null>(null);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const list = [...(query.data ?? [])].sort((a, b) => +new Date(b.dueDate) - +new Date(a.dueDate));

  const open = (a: any) => {
    setActive(a);
    setNotes(a.submission?.notes ?? '');
    setFile(null);
  };

  const onSubmit = () => {
    if (!active) return;
    if (!notes.trim() && !file) {
      toast.error('Add a note or attach a file before submitting');
      return;
    }
    if (file && file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`File must be smaller than ${MAX_FILE_MB} MB`);
      return;
    }
    submit.mutate(
      { assignmentId: active.id, studentId, notes: notes.trim(), file },
      {
        onSuccess: () => {
          toast.success('Homework submitted');
          setActive(null);
        },
        onError: (e) => toast.error(errorMessage(e, 'Could not submit homework')),
      }
    );
  };

  return (
    <>
      <QueryState
        query={query}
        isEmpty={list.length === 0}
        emptyText="No homework has been assigned yet."
        emptyIcon={BookOpenCheck}
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          {list.map((a) => {
            const st = STATUS[a.status] ?? { label: a.status, variant: 'secondary' };
            const sub = a.submission;
            const overdue = !sub && new Date(a.dueDate) < new Date();
            return (
              <article key={a.id} className="surface-card flex min-w-0 flex-col gap-3 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-card-title break-words">{a.title}</h3>
                    <p className="text-caption">{a.subject}</p>
                  </div>
                  <Badge variant={st.variant} className="shrink-0">
                    {st.label}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={cn(
                      'tone-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                      overdue ? 'tone-rose' : 'tone-sky'
                    )}
                  >
                    <CalendarClock className="size-3.5" /> Due {formatDate(a.dueDate)}
                  </span>
                  {a.maxMarks != null && (
                    <span className="tone-chip tone-violet rounded-full px-3 py-1 text-xs font-semibold">
                      Max {a.maxMarks}
                    </span>
                  )}
                  {sub?.submittedAt && (
                    <span className="tone-chip tone-emerald rounded-full px-3 py-1 text-xs font-semibold">
                      Submitted {formatDate(sub.submittedAt)}
                    </span>
                  )}
                </div>
                {sub?.marksAwarded != null && (
                  <p className="tabular text-sm font-semibold text-emerald-600">
                    Marks: {sub.marksAwarded}
                    {a.maxMarks != null ? ` / ${a.maxMarks}` : ''}
                  </p>
                )}
                {sub?.feedback && (
                  <p className="text-caption rounded-xl bg-muted/60 p-3">
                    Teacher feedback: {sub.feedback}
                  </p>
                )}
                {canSubmit && sub?.marksAwarded == null && (
                  <Button
                    size="lg"
                    variant={sub ? 'outline' : 'default'}
                    onClick={() => open(a)}
                    className="w-full"
                  >
                    <Upload /> {sub ? 'Resubmit' : 'Submit'}
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      </QueryState>

      <Dialog
        isOpen={!!active}
        onClose={() => setActive(null)}
        title={`Submit: ${active?.title ?? ''}`}
      >
        <div className="space-y-4 overflow-y-auto px-5 pb-6 sm:px-7">
          <Textarea
            placeholder="Write your answer or a note for the teacher…"
            value={notes}
            maxLength={1000}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
          />
          <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            <Paperclip className="size-4 shrink-0" />
            <span className="truncate">
              {file ? file.name : `Attach a file (optional, max ${MAX_FILE_MB} MB)`}
            </span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" size="lg" onClick={() => setActive(null)}>
              Cancel
            </Button>
            <Button size="lg" onClick={onSubmit} isLoading={submit.isPending}>
              Submit
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default function PortalHomeworkPage() {
  return (
    <PortalShell title="Homework" description="Assignments, due dates and submissions">
      {({ studentId, isStudent }) => <HomeworkView studentId={studentId} canSubmit={isStudent} />}
    </PortalShell>
  );
}
