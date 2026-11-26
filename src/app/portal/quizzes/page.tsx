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
import { cn } from '@/lib/utils';

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
  const [step, setStep] = useState(0);
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
      <div className="space-y-4 px-5 pb-6 text-center sm:px-7">
        <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
        <p className="text-sm text-muted-foreground">
          {result.status === 'GRADED' ? 'Your score' : 'Submitted — a teacher will finish grading'}
        </p>
        {result.score != null && (
          <p className="tabular text-4xl font-semibold">
            {result.score}
            {totalMarks > 0 ? ` / ${totalMarks}` : ''}
          </p>
        )}
        <Button size="lg" className="w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  if (questions.isPending)
    return (
      <div className="px-5 pb-6 sm:px-7">
        <LoadingBlock text="Loading questions…" />
      </div>
    );
  if (questions.isError)
    return (
      <div className="px-5 pb-6 sm:px-7">
        <ErrorBlock error={questions.error} onRetry={() => questions.refetch()} />
      </div>
    );
  if (qs.length === 0)
    return (
      <div className="px-5 pb-6 sm:px-7">
        <EmptyBlock text="This quiz has no questions yet." />
      </div>
    );

  const idx = Math.min(step, qs.length - 1);
  const q = qs[idx];
  const isLast = idx === qs.length - 1;
  const progress = ((idx + 1) / qs.length) * 100;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-6 sm:px-7">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span className="tabular">
            Question {idx + 1} of {qs.length}
          </span>
          <span className="tabular">
            {q.marks} mark{q.marks === 1 ? '' : 's'}
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={qs.length}
          aria-valuenow={idx + 1}
        >
          <div
            className="h-full rounded-full bg-brand-gradient transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <fieldset key={q.id} className="space-y-3">
        <legend className="text-base font-semibold leading-snug">{q.questionText}</legend>
        {q.questionType === 'SHORT_ANSWER' || !(q.options ?? []).length ? (
          <Textarea
            rows={4}
            value={answers[q.id] ?? ''}
            onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
          />
        ) : (
          (q.options as any[]).map((o) => {
            const checked = answers[q.id] === o.id;
            return (
              <label
                key={o.id}
                className={cn(
                  'flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-[15px] transition-colors',
                  checked ? 'border-brand bg-brand/10 font-semibold' : 'border-border bg-card'
                )}
              >
                <input
                  type="radio"
                  name={q.id}
                  className="size-5 accent-[var(--brand)]"
                  checked={checked}
                  onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                />
                {o.text}
              </label>
            );
          })
        )}
      </fieldset>

      <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row-reverse">
        {isLast ? (
          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={finish}
            isLoading={submit.isPending}
          >
            Submit quiz
          </Button>
        ) : (
          <Button size="lg" className="w-full sm:w-auto" onClick={() => setStep(idx + 1)}>
            Next
          </Button>
        )}
        {idx > 0 ? (
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setStep(idx - 1)}
          >
            Back
          </Button>
        ) : (
          <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Save for later
          </Button>
        )}
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
          {quizzes.map((q) => {
            const notStarted = q.startTime && new Date(q.startTime) > now;
            const closed = q.endTime && new Date(q.endTime) < now;
            return (
              <article key={q.id} className="surface-card flex min-w-0 flex-col gap-3 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-card-title break-words">{q.title}</h3>
                    <p className="text-caption">{q.subject?.name}</p>
                  </div>
                  <Badge
                    className="shrink-0"
                    variant={closed ? 'secondary' : notStarted ? 'warning' : 'success'}
                  >
                    {closed ? 'Closed' : notStarted ? 'Upcoming' : 'Open'}
                  </Badge>
                </div>
                {q.description && <p className="text-caption line-clamp-2">{q.description}</p>}
                <p className="text-caption tabular">
                  {q._count?.questions ?? 0} questions · {q.duration} min
                  {q.endTime ? ` · closes ${formatDate(q.endTime)}` : ''}
                </p>
                <Button
                  size="lg"
                  className="w-full"
                  disabled={!!notStarted || !!closed}
                  isLoading={start.isPending && start.variables?.quizId === q.id}
                  onClick={() => open(q)}
                >
                  {closed ? 'Closed' : notStarted ? 'Not open yet' : 'Take / resume quiz'}
                </Button>
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
