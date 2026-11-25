'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { BookOpenCheck, Paperclip, Upload } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import { QueryState, errorMessage } from '@/components/portal/QueryState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useFamilyHomework, useSubmitFamilyHomework } from '@/hooks/queries/useFamily';
import { formatDate } from '@/lib/format';

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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {list.map((a) => {
            const st = STATUS[a.status] ?? { label: a.status, variant: 'secondary' };
            const sub = a.submission;
            const overdue = !sub && new Date(a.dueDate) < new Date();
            return (
              <article
                key={a.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-semibold">{a.title}</h3>
                    <p className="text-xs text-zinc-500">{a.subject}</p>
                  </div>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500">
                  <span className={overdue ? 'font-semibold text-rose-600' : undefined}>
                    Due {formatDate(a.dueDate)}
                  </span>
                  {a.maxMarks != null && <span>Max marks {a.maxMarks}</span>}
                  {sub?.submittedAt && <span>Submitted {formatDate(sub.submittedAt)}</span>}
                </div>
                {sub?.marksAwarded != null && (
                  <p className="text-sm font-semibold text-emerald-600">
                    Marks: {sub.marksAwarded}
                    {a.maxMarks != null ? ` / ${a.maxMarks}` : ''}
                  </p>
                )}
                {sub?.feedback && (
                  <p className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-white/[0.03] dark:text-zinc-300">
                    Teacher feedback: {sub.feedback}
                  </p>
                )}
                {canSubmit && sub?.marksAwarded == null && (
                  <div>
                    <Button size="sm" variant={sub ? 'outline' : 'default'} onClick={() => open(a)}>
                      <Upload /> {sub ? 'Resubmit' : 'Submit'}
                    </Button>
                  </div>
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
        <div className="space-y-4 px-7 pb-6">
          <Textarea
            placeholder="Write your answer or a note for the teacher…"
            value={notes}
            maxLength={1000}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
          />
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-300">
            <Paperclip className="size-4" />
            <span className="truncate">
              {file ? file.name : `Attach a file (optional, max ${MAX_FILE_MB} MB)`}
            </span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActive(null)}>
              Cancel
            </Button>
            <Button onClick={onSubmit} isLoading={submit.isPending}>
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
