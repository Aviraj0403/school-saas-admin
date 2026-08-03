'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { documentsService } from '@/services/documents.service';
import { studentsService } from '@/services/students.service';
import { examsService } from '@/services/exams.service';

type DocKind = 'id-card' | 'admit-card' | 'marksheet';

/**
 * Student documents.
 *
 * The generators have existed since the documents module shipped and had no UI
 * on either client, so a school could not issue an ID card, an admit card or a
 * marksheet from the product at all. Each returns a structured payload rather
 * than a PDF, so this renders it and hands it to the browser's print dialog.
 */
export default function StudentDocumentsPage() {
  const toast = React.useRef<Toast>(null);

  const [studentId, setStudentId] = useState<string | null>(null);
  const [examId, setExamId] = useState<string | null>(null);
  const [kind, setKind] = useState<DocKind>('id-card');
  const [doc, setDoc] = useState<any>(null);

  const { data: studentsData } = useQuery({
    queryKey: ['students-for-docs'],
    queryFn: () => studentsService.getStudents(1, 100),
  });
  const { data: exams = [] } = useQuery({
    queryKey: ['exams-for-docs'],
    queryFn: () => examsService.getExams(),
  });

  const students = (studentsData as any)?.items ?? (studentsData as any)?.data?.items ?? [];

  const needsExam = kind !== 'id-card';

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!studentId) throw new Error('no student');
      if (kind === 'id-card') return documentsService.generateIdCard(studentId);
      if (!examId) throw new Error('no exam');
      return kind === 'admit-card'
        ? documentsService.generateAdmitCard(studentId, examId)
        : documentsService.generateMarksheet(studentId, examId);
    },
    onSuccess: (data) => setDoc(data),
    onError: () =>
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not generate the document.', life: 3000 }),
  });

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Student Documents" subtitle="Students" />
      <Toast ref={toast} />

      <div className="flex flex-col gap-4 pb-10 animate-fade-in">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-4 flex flex-wrap items-end gap-4 print:hidden">
          <div className="flex flex-col gap-1 min-w-[220px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Document</label>
            <Dropdown
              value={kind}
              options={[
                { label: 'ID Card', value: 'id-card' },
                { label: 'Admit Card', value: 'admit-card' },
                { label: 'Marksheet', value: 'marksheet' },
              ]}
              onChange={(e) => { setKind(e.value); setDoc(null); }}
              className="text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[260px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Student</label>
            <Dropdown
              value={studentId}
              options={students.map((s: any) => ({ label: `${s.name} — ${s.admissionNo}`, value: s.id }))}
              onChange={(e) => { setStudentId(e.value); setDoc(null); }}
              placeholder="Select a student"
              filter
              className="text-sm"
            />
          </div>
          {needsExam && (
            <div className="flex flex-col gap-1 min-w-[220px]">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Exam</label>
              <Dropdown
                value={examId}
                options={(exams as any[]).map((e: any) => ({ label: e.name, value: e.id }))}
                onChange={(e) => { setExamId(e.value); setDoc(null); }}
                placeholder="Select an exam"
                className="text-sm"
              />
            </div>
          )}
          <Button
            label="Generate"
            icon="pi pi-file"
            loading={generateMutation.isPending}
            disabled={!studentId || (needsExam && !examId)}
            onClick={() => generateMutation.mutate()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 px-5 rounded-md border-0"
          />
          {doc && (
            <Button
              label="Print"
              icon="pi pi-print"
              onClick={() => window.print()}
              className="p-2.5 px-5 rounded-md border border-zinc-200 dark:border-zinc-700"
            />
          )}
        </div>

        {!doc && (
          <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-md p-12 text-center">
            <i className="pi pi-id-card text-3xl text-zinc-300"></i>
            <p className="text-sm text-zinc-500 mt-3">
              Pick a document and a student, then generate. The result appears here ready to print.
            </p>
          </div>
        )}

        {doc && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-8 print:border-0">
            {/* The payload shape differs per document, so render the school
                header, then the student block, then whatever detail rows the
                generator returned. */}
            <div className="text-center border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-6">
              <h2 className="text-xl font-black text-zinc-900 dark:text-white">
                {doc.school?.name ?? doc.tenant?.name ?? 'School'}
              </h2>
              {doc.school?.address && <p className="text-xs text-zinc-500">{doc.school.address}</p>}
              <p className="text-sm font-bold uppercase tracking-widest text-blue-600 mt-3">
                {kind.replace('-', ' ')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {Object.entries(doc.student ?? {}).map(([k, v]) => (
                typeof v === 'string' || typeof v === 'number' ? (
                  <div key={k} className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 py-1.5">
                    <span className="text-zinc-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100">{String(v)}</span>
                  </div>
                ) : null
              ))}
            </div>

            {Array.isArray(doc.subjects) && doc.subjects.length > 0 && (
              <table className="w-full mt-6 text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700 text-left text-xs uppercase text-zinc-500">
                    {Object.keys(doc.subjects[0]).map((h) => <th key={h} className="py-2 capitalize">{h.replace(/([A-Z])/g, ' $1')}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {doc.subjects.map((row: any, i: number) => (
                    <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                      {Object.values(row).map((cell: any, j) => (
                        <td key={j} className="py-2 text-zinc-700 dark:text-zinc-200">
                          {typeof cell === 'object' ? JSON.stringify(cell) : String(cell ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {doc.result && (
              <div className="mt-6 flex gap-6 text-sm">
                {Object.entries(doc.result).map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-[10px] uppercase text-zinc-500">{k}</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-100">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
