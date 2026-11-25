'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, HelpCircle } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  QueryState,
  errorMessage,
} from '@/components/portal/QueryState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  usePortalQuizzes,
  useQuizQuestions,
  useStartQuizAttempt,
  useSubmitQuizAttempt,
} from '@/hooks/queries/useFamily';
import { formatDate } from '@/lib/format';

function QuizRunner({
  quiz,
  studentId,
  attempt,
  onClose,
}: {
  quiz: any;
  studentId: string;
  attempt: any;
  onClose: () => void;
}) {
  const questions = useQuizQuestions(quiz.id);
  const submit = useSubmitQuizAttempt();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any | null>(
    attempt.status !== 'IN_PROGRESS' ? attempt : null
  );

  const qs = questions.data ?? [];
  const totalMarks = qs.reduce((s, q) => s + Number(q.marks ?? 0), 0);

  const finish = () => {
    const unanswered = qs.filter((q) => !answers[q.id]?.trim()).length;
    if (
      unanswered > 0 &&
      !window.confirm(`${unanswered} question(s) are unanswered. Submit anyway?`)
    )
      return;
    submit.mutate(
      { quizId: quiz.id, studentId, answers },
      {
        onSuccess: (res) => setResult(res),
        onError: (e) => toast.error(errorMessage(e, 'Could not submit the quiz')),
      }
    );
  };

  if (result) {
    return (
      <div className="space-y-4 px-7 pb-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
        <p className="text-sm text-zinc-500">
          {result.status === 'GRADED' ? 'Your score' : 'Submitted — a teacher will finish grading'}
        </p>
        {result.score != null && (
          <p className="font-display text-3xl font-semibold">
            {result.score}
            {totalMarks > 0 ? ` / ${totalMarks}` : ''}
          </p>
        )}
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  if (questions.isPending)
    return (
      <div className="px-7 pb-6">
        <LoadingBlock text="Loading questions…" />
      </div>
    );
  if (questions.isError)
    return (
      <div className="px-7 pb-6">
        <ErrorBlock error={questions.error} onRetry={() => questions.refetch()} />
      </div>
    );
  if (qs.length === 0)
    return (
      <div className="px-7 pb-6">
        <EmptyBlock text="This quiz has no questions yet." />
      </div>
    );

  return (
    <div className="space-y-5 overflow-y-auto px-7 pb-6">
      {qs.map((q, i) => (
        <fieldset key={q.id} className="space-y-2">
          <legend className="text-sm font-semibold">
            {i + 1}. {q.questionText}{' '}
            <span className="font-normal text-zinc-400">
              ({q.marks} mark{q.marks === 1 ? '' : 's'})
            </span>
          </legend>
          {q.questionType === 'SHORT_ANSWER' || !(q.options ?? []).length ? (
            <Textarea
              rows={3}
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
            />
          ) : (
            (q.options as any[]).map((o) => (
              <label
                key={o.id}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  name={q.id}
                  checked={answers[q.id] === o.id}
                  onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                />
                {o.text}
              </label>
            ))
          )}
        </fieldset>
      ))}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Save for later
        </Button>
        <Button onClick={finish} isLoading={submit.isPending}>
          Submit quiz
        </Button>
      </div>
    </div>
  );
}

function QuizzesView({ classId, studentId }: { classId?: string | null; studentId: string }) {
  const query = usePortalQuizzes(classId);
  const start = useStartQuizAttempt();
  const [session, setSession] = useState<{ quiz: any; attempt: any } | null>(null);

  if (!classId) {
    return (
      <EmptyBlock
        icon={HelpCircle}
        text="You have not been assigned to a class yet, so there are no quizzes to show."
      />
    );
  }

  const now = new Date();
  const quizzes = (query.data ?? []).filter((q) => q.isPublished);

  const open = (quiz: any) =>
    start.mutate(
      { quizId: quiz.id, studentId },
      {
        onSuccess: (attempt) => setSession({ quiz, attempt }),
        onError: (e) => toast.error(errorMessage(e, 'Could not start the quiz')),
      }
    );

  return (
    <>
      <QueryState
        query={query}
        isEmpty={quizzes.length === 0}
        emptyText="No quizzes are available for your class."
        emptyIcon={HelpCircle}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quizzes.map((q) => {
            const notStarted = q.startTime && new Date(q.startTime) > now;
            const closed = q.endTime && new Date(q.endTime) < now;
            return (
              <article
                key={q.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-semibold">{q.title}</h3>
                    <p className="text-xs text-zinc-500">{q.subject?.name}</p>
                  </div>
                  <Badge variant={closed ? 'secondary' : notStarted ? 'warning' : 'success'}>
                    {closed ? 'Closed' : notStarted ? 'Upcoming' : 'Open'}
                  </Badge>
                </div>
                {q.description && (
                  <p className="line-clamp-2 text-xs text-zinc-500">{q.description}</p>
                )}
                <p className="text-xs text-zinc-500">
                  {q._count?.questions ?? 0} questions · {q.duration} min
                  {q.endTime ? ` · closes ${formatDate(q.endTime)}` : ''}
                </p>
                <div>
                  <Button
                    size="sm"
                    disabled={!!notStarted || !!closed}
                    isLoading={start.isPending && start.variables?.quizId === q.id}
                    onClick={() => open(q)}
                  >
                    {closed ? 'Closed' : notStarted ? 'Not open yet' : 'Take / resume quiz'}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </QueryState>

      <Dialog
        isOpen={!!session}
        onClose={() => setSession(null)}
        title={session?.quiz.title}
        className="max-w-2xl"
      >
        {session && (
          <QuizRunner
            quiz={session.quiz}
            studentId={studentId}
            attempt={session.attempt}
            onClose={() => setSession(null)}
          />
        )}
      </Dialog>
    </>
  );
}

export default function PortalQuizzesPage() {
  return (
    <PortalShell title="Quizzes" description="Quizzes set for your class">
      {({ child, studentId }) => <QuizzesView classId={child.classId} studentId={studentId} />}
    </PortalShell>
  );
}
