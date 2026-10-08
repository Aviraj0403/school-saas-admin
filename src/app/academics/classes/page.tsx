'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { toast } from 'sonner';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import {
  useClasses,
  useCreateClass,
  useSubjects,
  useAllSubjects,
  useCreateSubject,
  useDeleteSubject,
  useCurrentAcademicYear,
  useDepartmentsList,
  useAssignSubjectsToClass,
} from '@/hooks/queries/useAcademics';
import { useStaffList } from '@/hooks/queries/useStaff';
import { academicsService } from '@/services/academics.service';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen, Trash2, Link as LinkIcon } from 'lucide-react';

const SUBJECT_TYPES = [
  { label: 'Theory', value: 'theory' },
  { label: 'Practical', value: 'practical' },
];

export default function ClassesPage() {
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  const [classForm, setClassForm] = useState({
    name: '',
    section: '',
    roomNo: '',
    maxStrength: 40,
  });

  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    departmentId: '',
    type: 'theory',
    maxMarks: 100,
    passMarks: 33,
  });

  const [assignSubjectIds, setAssignSubjectIds] = useState<string[]>([]);
  const [savingTeacher, setSavingTeacher] = useState(false);

  const { data: currentYear } = useCurrentAcademicYear();
  const { data: classesData, isPending } = useClasses();
  const { data: subjectsData, isPending: loadingSubjects } = useSubjects(selectedClass?.id);
  const { data: allSubjectsData } = useAllSubjects();
  const { data: departmentsData } = useDepartmentsList();
  const { data: staffData } = useStaffList(1, 100);

  const createClassMutation = useCreateClass();
  const createSubjectMutation = useCreateSubject();
  const deleteSubjectMutation = useDeleteSubject();
  const assignSubjectsMutation = useAssignSubjectsToClass();

  const classList = Array.isArray(classesData) ? classesData : (classesData?.items ?? []);
  const subjectList = Array.isArray(subjectsData) ? subjectsData : (subjectsData?.items ?? []);
  const allSubjects = Array.isArray(allSubjectsData)
    ? allSubjectsData
    : (allSubjectsData?.items ?? []);
  const departments = Array.isArray(departmentsData)
    ? departmentsData
    : (departmentsData?.items ?? []);
  const teachers = staffData?.items ?? [];

  useEffect(() => {
    if (classList.length > 0 && !selectedClass) {
      setSelectedClass(classList[0]);
    }
  }, [classList, selectedClass]);

  const teacherOptions = teachers.map((t: any) => ({
    label: `${t.name} (${t.designation || 'Teacher'})`,
    value: t.id,
  }));

  const departmentOptions = departments.map((d: any) => ({
    label: d.name,
    value: d.id,
  }));

  const availableSubjectsToAssign = allSubjects.filter(
    (s: any) => !subjectList.some((existing: any) => existing.id === s.id)
  );

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentYear?.id) {
      toast.error('No active academic year session found.');
      return;
    }
    createClassMutation.mutate(
      { ...classForm, academicYearId: currentYear.id },
      {
        onSuccess: (newCls) => {
          setShowClassDialog(false);
          setClassForm({ name: '', section: '', roomNo: '', maxStrength: 40 });
          setSelectedClass(newCls);
          toast.success('New classroom created successfully.');
        },
        onError: () => toast.error('Failed to create classroom.'),
      }
    );
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    createSubjectMutation.mutate(
      {
        ...subjectForm,
        classIds: selectedClass?.id ? [selectedClass.id] : [],
      },
      {
        onSuccess: () => {
          setShowSubjectDialog(false);
          setSubjectForm({
            name: '',
            code: '',
            departmentId: '',
            type: 'theory',
            maxMarks: 100,
            passMarks: 33,
          });
          toast.success('Subject added and linked.');
        },
        onError: () => toast.error('Failed to create subject.'),
      }
    );
  };

  const handleAssignSubjects = () => {
    if (!selectedClass?.id || assignSubjectIds.length === 0) return;
    assignSubjectsMutation.mutate(
      {
        classId: selectedClass.id,
        subjectIds: assignSubjectIds,
      },
      {
        onSuccess: () => {
          setShowAssignDialog(false);
          setAssignSubjectIds([]);
          toast.success('Subjects linked to class curriculum.');
        },
        onError: () => toast.error('Failed to link subjects.'),
      }
    );
  };

  const handleAssignClassTeacher = async (teacherId: string) => {
    if (!selectedClass?.id) return;
    setSavingTeacher(true);
    try {
      await academicsService.updateClass(selectedClass.id, { classTeacherId: teacherId });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setSelectedClass((prev: any) => (prev ? { ...prev, classTeacherId: teacherId } : null));
      toast.success('Class teacher assigned.');
    } catch {
      toast.error('Could not assign class teacher.');
    } finally {
      setSavingTeacher(false);
    }
  };

  const handleDeleteSubject = (id: string, name: string) => {
    if (confirm(`Remove "${name}" from this class catalog?`)) {
      deleteSubjectMutation.mutate(id, {
        onSuccess: () => toast.success(`Removed ${name}`),
        onError: () => toast.error('Could not remove subject.'),
      });
    }
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Classrooms & Subjects" subtitle="Academics" />

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        {/* Header Block */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand" /> Academic Classrooms Directory
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Configure section divisions, capacity limits, class instructors, and subject
              curricula.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowSubjectDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Subject
            </Button>
            <Button onClick={() => setShowClassDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create Class
            </Button>
          </div>
        </div>

        {/* Directory Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Classes Column (Left 3 columns) */}
          <div className="lg:col-span-3 bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 flex flex-col gap-4 shadow-sm backdrop-blur-xl">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Active Classrooms
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Select a class row to inspect its subject curriculum.
              </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                  <tr>
                    <th className="px-3 py-2.5">Class</th>
                    <th className="px-3 py-2.5">Section</th>
                    <th className="px-3 py-2.5">Room</th>
                    <th className="px-3 py-2.5">Capacity</th>
                    <th className="px-3 py-2.5">Students</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                  {isPending ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-zinc-400">
                        Loading classrooms...
                      </td>
                    </tr>
                  ) : classList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-zinc-400">
                        No classes configured yet.
                      </td>
                    </tr>
                  ) : (
                    classList.map((c: any) => {
                      const isSelected = selectedClass?.id === c.id;
                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedClass(c)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-brand/10 dark:bg-brand/20 font-bold'
                              : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                          }`}
                        >
                          <td className="px-3 py-2.5 text-zinc-900 dark:text-zinc-100 font-bold">
                            {c.name}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-zinc-600 dark:text-zinc-300">
                            {c.section}
                          </td>
                          <td className="px-3 py-2.5 text-zinc-500">{c.roomNo || '—'}</td>
                          <td className="px-3 py-2.5 font-mono">{c.maxStrength}</td>
                          <td className="px-3 py-2.5 font-mono text-brand font-bold">
                            {c._count?.students ?? 0}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subjects Column (Right 2 columns) */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 flex flex-col gap-4 shadow-sm backdrop-blur-xl">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedClass
                    ? `${selectedClass.name} — ${selectedClass.section}`
                    : 'Subject Catalog'}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {selectedClass
                    ? 'Subjects linked to this class.'
                    : 'Select a class to view its subjects.'}
                </p>
              </div>
              {selectedClass && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={selectedClass.classTeacherId ?? selectedClass.classTeacher?.id ?? ''}
                    options={[{ label: 'Assign Class Teacher...', value: '' }, ...teacherOptions]}
                    onChange={(e) => handleAssignClassTeacher(e.target.value)}
                    disabled={savingTeacher}
                    className="w-44 text-xs"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setShowAssignDialog(true)}
                    className="text-xs"
                  >
                    <LinkIcon className="w-3.5 h-3.5 mr-1" /> Link Existing
                  </Button>
                </div>
              )}
            </div>

            {selectedClass ? (
              loadingSubjects ? (
                <div className="p-8 text-center text-zinc-400 text-xs">Loading subject list...</div>
              ) : subjectList.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl gap-3">
                  <BookOpen className="w-8 h-8 opacity-40" />
                  <p className="text-xs font-semibold text-center text-zinc-600 dark:text-zinc-300">
                    No subjects linked yet.
                  </p>
                  <Button variant="outline" onClick={() => setShowSubjectDialog(true)}>
                    Create Subject
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-3 py-2.5">Subject</th>
                        <th className="px-3 py-2.5">Code</th>
                        <th className="px-3 py-2.5">Type</th>
                        <th className="px-3 py-2.5">Marks</th>
                        <th className="px-3 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {subjectList.map((s: any) => (
                        <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="px-3 py-2.5 font-semibold text-zinc-900 dark:text-zinc-100">
                            {s.name}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-zinc-500">{s.code}</td>
                          <td className="px-3 py-2.5">
                            <Badge variant={s.type === 'practical' ? 'warning' : 'info'}>
                              {s.type}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-zinc-500">
                            {s.maxMarks}/{s.passMarks}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <Button
                              variant="outline"
                              onClick={() => handleDeleteSubject(s.id, s.name)}
                              className="text-rose-600 border-rose-200/80 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                <BookOpen className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-xs font-semibold">Select a class from the list</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog: Add Class */}
      <Dialog
        isOpen={showClassDialog}
        onClose={() => setShowClassDialog(false)}
        title="Create New Classroom"
      >
        <form onSubmit={handleCreateClass} className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Class Name *
              </label>
              <Input
                value={classForm.name}
                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                placeholder="e.g. Class 10"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Section *
              </label>
              <Input
                value={classForm.section}
                onChange={(e) => setClassForm({ ...classForm, section: e.target.value })}
                placeholder="e.g. Section A"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Room Number
              </label>
              <Input
                value={classForm.roomNo}
                onChange={(e) => setClassForm({ ...classForm, roomNo: e.target.value })}
                placeholder="e.g. Room 101"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Seating Capacity
              </label>
              <Input
                type="number"
                value={classForm.maxStrength}
                onChange={(e) =>
                  setClassForm({ ...classForm, maxStrength: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setShowClassDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createClassMutation.isPending}>
              Create Class
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: Add Subject */}
      <Dialog
        isOpen={showSubjectDialog}
        onClose={() => setShowSubjectDialog(false)}
        title="Create New Subject"
      >
        <form onSubmit={handleCreateSubject} className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Subject Name *
              </label>
              <Input
                value={subjectForm.name}
                onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                placeholder="e.g. Mathematics"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Subject Code *
              </label>
              <Input
                value={subjectForm.code}
                onChange={(e) =>
                  setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })
                }
                placeholder="e.g. MATH-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Department
              </label>
              <Select
                value={subjectForm.departmentId}
                options={[{ label: '— Select Department —', value: '' }, ...departmentOptions]}
                onChange={(e) => setSubjectForm({ ...subjectForm, departmentId: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Subject Type
              </label>
              <Select
                value={subjectForm.type}
                options={SUBJECT_TYPES}
                onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Max Marks
              </label>
              <Input
                type="number"
                value={subjectForm.maxMarks}
                onChange={(e) =>
                  setSubjectForm({ ...subjectForm, maxMarks: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Pass Marks
              </label>
              <Input
                type="number"
                value={subjectForm.passMarks}
                onChange={(e) =>
                  setSubjectForm({ ...subjectForm, passMarks: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setShowSubjectDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createSubjectMutation.isPending}>
              Save Subject
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: Assign Subjects */}
      <Dialog
        isOpen={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        title={`Link Existing Subjects to ${selectedClass?.name || 'Class'}`}
      >
        <div className="flex flex-col gap-4 py-2">
          <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
            Select Available Subjects
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg p-3 bg-zinc-50/50 dark:bg-zinc-900/30">
            {availableSubjectsToAssign.length === 0 ? (
              <span className="text-xs text-zinc-400 col-span-2">
                All subjects are already linked.
              </span>
            ) : (
              availableSubjectsToAssign.map((s: any) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={assignSubjectIds.includes(s.id)}
                    onChange={() =>
                      setAssignSubjectIds((prev) =>
                        prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                      )
                    }
                    className="rounded border-zinc-300 text-brand focus:ring-brand"
                  />
                  <span>
                    {s.name} ({s.code})
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssignSubjects}
            isLoading={assignSubjectsMutation.isPending}
            disabled={assignSubjectIds.length === 0}
          >
            Assign Subjects
          </Button>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
