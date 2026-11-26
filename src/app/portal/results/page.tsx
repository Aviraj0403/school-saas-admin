'use client';

import React, { useMemo } from 'react';
import { toast } from 'sonner';
import { Printer, Trophy } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import { QueryState } from '@/components/portal/QueryState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFamilyResults } from '@/hooks/queries/useFamily';
import { formatDate } from '@/lib/format';

interface ExamGroup {
  exam: any;
  rows: any[];
  obtained: number;
  max: number;
  hasMax: boolean;
}

const esc = (v: unknown) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );

function printGroup(g: ExamGroup, studentName: string) {
  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) {
    toast.error('Allow pop-ups to print the result card');
    return;
  }
  const rows = g.rows
    .map(
      (r) =>
        `<tr><td>${esc(r.subject?.name)}</td><td>${r.isAbsent ? 'Absent' : esc(Number(r.marksObtained))}</td><td>${esc(r.maxMarks ?? '—')}</td><td>${esc(r.grade ?? '—')}</td><td>${esc(r.remarks ?? '')}</td></tr>`
    )
    .join('');
  w.document
    .write(`<!doctype html><html><head><title>${esc(g.exam?.name)} - ${esc(studentName)}</title>
<style>body{font-family:Arial,sans-serif;padding:32px;color:#111}h1{margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:20px}
th,td{border:1px solid #999;padding:8px;text-align:left;font-size:14px}th{background:#f1f1f1}.meta{color:#555;font-size:14px}.total{margin-top:16px;font-weight:bold}</style></head>
<body><h1>${esc(g.exam?.name)}</h1><div class="meta">Student: ${esc(studentName)} &middot; ${esc(formatDate(g.exam?.startDate))}</div>
<table><thead><tr><th>Subject</th><th>Marks</th><th>Max</th><th>Grade</th><th>Remarks</th></tr></thead><tbody>${rows}</tbody></table>
<div class="total">Total: ${g.obtained}${g.hasMax ? ` / ${g.max} (${g.max ? ((g.obtained / g.max) * 100).toFixed(1) : 0}%)` : ''}</div>
<script>window.onload=function(){window.print()}</script></body></html>`);
  w.document.close();
}

function ResultsView({ studentId, studentName }: { studentId: string; studentName: string }) {
  const query = useFamilyResults(studentId);

  const groups = useMemo<ExamGroup[]>(() => {
    const map = new Map<string, ExamGroup>();
    for (const r of query.data ?? []) {
      const g = map.get(r.examId) ?? { exam: r.exam, rows: [], obtained: 0, max: 0, hasMax: false };
      g.rows.push(r);
      if (!r.isAbsent) g.obtained += Number(r.marksObtained ?? 0);
      if (r.maxMarks != null) {
        g.max += Number(r.maxMarks);
        g.hasMax = true;
      }
      map.set(r.examId, g);
    }
    return [...map.values()].sort(
      (a, b) => +new Date(b.exam?.startDate ?? 0) - +new Date(a.exam?.startDate ?? 0)
    );
  }, [query.data]);

  return (
    <QueryState
      query={query}
      isEmpty={groups.length === 0}
      emptyText="No exam results have been published yet."
      emptyIcon={Trophy}
    >
      <div className="flex flex-col gap-4 sm:gap-6">
        {groups.map((g) => {
          const pct = g.hasMax && g.max > 0 ? (g.obtained / g.max) * 100 : null;
          return (
            <section key={g.exam?.id} className="surface-card min-w-0 p-4 sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-card-title break-words">{g.exam?.name}</h3>
                  <p className="text-caption">
                    {formatDate(g.exam?.startDate)}
                    {g.exam?.type ? ` · ${g.exam.type}` : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="tabular text-2xl font-semibold leading-none">
                    {pct != null ? `${pct.toFixed(1)}%` : g.obtained}
                  </p>
                  {g.hasMax && (
                    <p className="text-caption tabular mt-1">
                      {g.obtained} / {g.max}
                    </p>
                  )}
                </div>
              </div>

              <ul className="flex flex-col gap-3">
                {g.rows.map((r) => {
                  const max = r.maxMarks != null ? Number(r.maxMarks) : 0;
                  const got = Number(r.marksObtained ?? 0);
                  const p = max > 0 && !r.isAbsent ? Math.min(100, (got / max) * 100) : 0;
                  const bar = p >= 75 ? 'bg-emerald-500' : p >= 40 ? 'bg-amber-500' : 'bg-rose-500';
                  return (
                    <li key={r.id}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium">
                          {r.subject?.name ?? '—'}
                        </span>
                        <span className="tabular flex shrink-0 items-center gap-2">
                          {r.isAbsent ? (
                            <Badge variant="danger">Absent</Badge>
                          ) : (
                            <span className="font-semibold">
                              {got}
                              {max > 0 && (
                                <span className="font-normal text-muted-foreground"> / {max}</span>
                              )}
                            </span>
                          )}
                          {r.grade && <Badge variant="primary">{r.grade}</Badge>}
                        </span>
                      </div>
                      {max > 0 && (
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${bar}`}
                            style={{ width: `${p}%` }}
                          />
                        </div>
                      )}
                      {r.remarks && <p className="text-caption mt-1">{r.remarks}</p>}
                    </li>
                  );
                })}
              </ul>

              <Button
                variant="outline"
                size="lg"
                className="mt-5 w-full sm:w-auto"
                onClick={() => printGroup(g, studentName)}
              >
                <Printer /> Print result card
              </Button>
            </section>
          );
        })}
      </div>
    </QueryState>
  );
}

export default function PortalResultsPage() {
  return (
    <PortalShell title="Exam Results" description="Marks and grades for every exam">
      {({ studentId, child }) => <ResultsView studentId={studentId} studentName={child.name} />}
    </PortalShell>
  );
}
