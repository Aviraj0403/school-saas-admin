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
      <div className="flex flex-col gap-6">
        {groups.map((g) => (
          <section
            key={g.exam?.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6"
          >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-semibold">{g.exam?.name}</h3>
                <p className="text-xs text-zinc-500">
                  {formatDate(g.exam?.startDate)}
                  {g.exam?.type ? ` · ${g.exam.type}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="primary">
                  {g.obtained}
                  {g.hasMax ? ` / ${g.max}` : ''}
                  {g.hasMax && g.max > 0 ? ` · ${((g.obtained / g.max) * 100).toFixed(1)}%` : ''}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => printGroup(g, studentName)}>
                  <Printer /> Print
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-zinc-400">
                    <th className="py-2 pr-3">Subject</th>
                    <th className="py-2 pr-3">Marks</th>
                    <th className="py-2 pr-3">Max</th>
                    <th className="py-2 pr-3">Grade</th>
                    <th className="py-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="py-2.5 pr-3 font-medium">{r.subject?.name ?? '—'}</td>
                      <td className="py-2.5 pr-3">
                        {r.isAbsent ? (
                          <Badge variant="danger">Absent</Badge>
                        ) : (
                          Number(r.marksObtained)
                        )}
                      </td>
                      <td className="py-2.5 pr-3">{r.maxMarks ?? '—'}</td>
                      <td className="py-2.5 pr-3">{r.grade ?? '—'}</td>
                      <td className="py-2.5 text-zinc-500">{r.remarks ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
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
