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
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  useSubjects,
  useAllSubjects,
  useCreateSubject,
  useDeleteSubject,
  useCurrentAcademicYear,
  useDepartmentsList,
  useAssignSubjectsToClass,
} from '@/hooks/queries/useAcademics';
import { useStaffDirectory } from '@/hooks/queries/useStaffDirectory';
import { useScopedClasses } from '@/hooks/queries/useScopedClasses';
import { usePermissions } from '@/hooks/usePermissions';
import { apiMessage } from '@/lib/apiMessage';
import { Plus, BookOpen, Trash2, Link as LinkIcon, Pencil } from 'lucide-react';

const SUBJECT_TYPES = [
  { label: 'Theory', value: 'theory' },
  { label: 'Practical', value: 'practical' },
];

export default function ClassesPage() {
  const { isAdmin } = usePermissions();
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [editingClass, setEditingClass] = useState<any | null>(null);
  const [deleteClassTarget, setDeleteClassTarget] = useState<any | null>(null);

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

  const { data: currentYear } = useCurrentAcademicYear();
  const { classes: scopedClasses, isLoading: isPending } = useScopedClasses();
  const { data: subjectsData, isPending: loadingSubjects } = useSubjects(selectedClass?.id);
  const { data: allSubjectsData } = useAllSubjects();
  const { data: departmentsData } = useDepartmentsList();
  const { data: staffData = [] } = useStaffDirectory();

  const createClassMutation = useCreateClass();
  const updateClassMutation = useUpdateClass();
  const deleteClassMutation = useDeleteClass();
  const createSubjectMutation = useCreateSubject();
  const deleteSubjectMutation = useDeleteSubject();
  const assignSubjectsMutation = useAssignSubjectsToClass();

  const classList = scopedClasses;
  const subjectList = Array.isArray(subjectsData) ? subjectsData : (subjectsData?.items ?? []);
  const allSubjects = Array.isArray(allSubjectsData)
    ? allSubjectsData
    : (allSubjectsData?.items ?? []);
  const departments = Array.isArray(departmentsData)
    ? departmentsData
    : (departmentsData?.items ?? []);
  const teachers = staffData;

  useEffect(() => {
    if (classList.length > 0 && !selectedClass) {
      setSelectedClass(classList[0]);
    }
  }, [classList, selectedClass]);

  const teacherOptions = teachers.map((t: any) => ({
    label: t.designation ? `${t.name} (${t.designation})` : t.name,
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
    if (editingClass) {
      updateClassMutation.mutate(
        {
          id: editingClass.id,
          data: {
            name: classForm.name,
            section: classForm.section,
            roomNo: classForm.roomNo || undefined,
            maxStrength: classForm.maxStrength,
          },
        },
        {
          onSuccess: (updated) => {
            setShowClassDialog(false);
            setEditingClass(null);
            setSelectedClass((prev: any) =>
              prev && prev.id === editingClass.id
                ? { ...prev, ...(updated || {}), ...classForm }
                : prev
            );
            toast.success('Classroom updated.');
          },
          onError: (err) => toast.error(apiMessage(err, 'Failed to update classroom.')),
        }
      );
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
        onError: (err) => toast.error(apiMessage(err, 'Failed to create classroom.')),
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

  const handleAssignClassTeacher = (teacherId: string) => {
    if (!selectedClass?.id) return;
    updateClassMutation.mutate(
      { id: selectedClass.id, data: { classTeacherId: teacherId || null } },
      {
        onSuccess: () => {
          setSelectedClass((prev: any) =>
            prev ? { ...prev, classTeacherId: teacherId || null } : null
          );
          toast.success('Class teacher updated.');
        },
        onError: (err) => toast.error(apiMessage(err, 'Could not update class teacher.')),
      }
    );
  };

  const openEditClass = (c: any) => {
    setEditingClass(c);
    setClassForm({
      name: c.name,
      section: c.section,
      roomNo: c.roomNo ?? '',
      maxStrength: c.maxStrength ?? 40,
    });
    setShowClassDialog(true);
  };

  const confirmDeleteClass = () => {
    if (!deleteClassTarget) return;
    deleteClassMutation.mutate(deleteClassTarget.id, {
      onSuccess: () => {
        toast.success('Classroom deleted.');
        if (selectedClass?.id === deleteClassTarget.id) setSelectedClass(null);
        setDeleteClassTarget(null);
      },
      onError: (err) => toast.error(apiMessage(err, 'Could not delete classroom.')),
    });
  };

  const handleDeleteSubject = (id: string, name: string) => {
    if (confirm(`Remove "${name}" from this class catalog?`)) {
      deleteSubjectMutation.mutate(id, {
        onSuccess: () => toast.success(`Removed ${name}`),
        onError: (err) => toast.error(apiMessage(err, 'Could not remove subject.')),
      });
    }
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Classrooms & Subjects" subtitle="Academics" />

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        {/* Header Block */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-page-title flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand" /> Academic Classrooms Directory
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Configure section divisions, capacity limits, class instructors, and subject
              curricula.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button variant="outline" onClick={() => setShowSubjectDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Subject
                </Button>
                <Button
                  onClick={() => {
                    setEditingClass(null);
                    setClassForm({ name: '', section: '', roomNo: '', maxStrength: 40 });
                    setShowClassDialog(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Create Class
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Directory Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Classes Column (Left 3 columns) */}
          <div className="lg:col-span-3 surface-card p-5 flex flex-col gap-4 shadow-sm backdrop-blur-xl">
            <div>
              <h2 className="text-base font-bold text-foreground">Active Classrooms</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select a class row to inspect its subject curriculum.
              </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-muted-foreground font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                  <tr>
                    <th className="px-3 py-2.5">Class</th>
                    <th className="px-3 py-2.5">Section</th>
                    <th className="px-3 py-2.5">Room</th>
                    <th className="px-3 py-2.5">Capacity</th>
                    <th className="px-3 py-2.5">Students</th>
                    {isAdmin && <th className="px-3 py-2.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                  {isPending ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="px-3 py-8 text-center text-zinc-400">
                        Loading classrooms...
                      </td>
                    </tr>
                  ) : classList.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="px-3 py-8 text-center text-zinc-400">
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
                          <td className="px-3 py-2.5 text-foreground font-bold">{c.name}</td>
                          <td className="px-3 py-2.5 font-mono text-zinc-600 dark:text-zinc-300">
                            {c.section}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">{c.roomNo || '—'}</td>
                          <td className="px-3 py-2.5 font-mono">{c.maxStrength}</td>
                          <td className="px-3 py-2.5 font-mono text-brand font-bold">
                            {c._count?.students ?? 0}
                          </td>
                          {isAdmin && (
                            <td className="px-3 py-2.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                aria-label="Edit class"
                                className="p-1.5 text-muted-foreground hover:text-brand"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditClass(c);
                                }}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                aria-label="Delete class"
                                className="p-1.5 text-muted-foreground hover:text-rose-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteClassTarget(c);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subjects Column (Right 2 columns) */}
          <div className="lg:col-span-2 surface-card p-5 flex flex-col gap-4 shadow-sm backdrop-blur-xl">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {selectedClass
                    ? `${selectedClass.name} — ${selectedClass.section}`
                    : 'Subject Catalog'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedClass
                    ? 'Subjects linked to this class.'
                    : 'Select a class to view its subjects.'}
                </p>
              </div>
              {selectedClass && isAdmin && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={selectedClass.classTeacherId ?? selectedClass.classTeacher?.id ?? ''}
                    options={[{ label: 'Assign Class Teacher...', value: '' }, ...teacherOptions]}
                    onChange={(e) => handleAssignClassTeacher(e.target.value)}
                    disabled={updateClassMutation.isPending}
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
                  {isAdmin && (
                    <Button variant="outline" onClick={() => setShowSubjectDialog(true)}>
                      Create Subject
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-muted-foreground font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-3 py-2.5">Subject</th>
                        <th className="px-3 py-2.5">Code</th>
                        <th className="px-3 py-2.5">Type</th>
                        <th className="px-3 py-2.5">Marks</th>
                        {isAdmin && <th className="px-3 py-2.5 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {subjectList.map((s: any) => (
                        <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="px-3 py-2.5 font-semibold text-foreground">{s.name}</td>
                          <td className="px-3 py-2.5 font-mono text-muted-foreground">{s.code}</td>
                          <td className="px-3 py-2.5">
                            <Badge variant={s.type === 'practical' ? 'warning' : 'info'}>
                              {s.type}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-muted-foreground">
                            {s.maxMarks}/{s.passMarks}
                          </td>
                          {isAdmin && (
                            <td className="px-3 py-2.5 text-right">
                              <Button
                                variant="outline"
                                onClick={() => handleDeleteSubject(s.id, s.name)}
                                className="text-rose-600 border-rose-200/80 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          )}
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
        title={editingClass ? 'Edit Classroom' : 'Create New Classroom'}
      >
        <form onSubmit={handleCreateClass} className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <Button
              type="submit"
              isLoading={createClassMutation.isPending || updateClassMutation.isPending}
            >
              {editingClass ? 'Save Changes' : 'Create Class'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      {/* Dialog: Delete class */}
      <Dialog
        isOpen={!!deleteClassTarget}
        onClose={() => setDeleteClassTarget(null)}
        title="Delete Classroom"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Delete{' '}
            <b>
              {deleteClassTarget?.name} {deleteClassTarget?.section}
            </b>
            ? A class that still has students, timetable slots or exams cannot be removed.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteClassTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteClass}
              isLoading={deleteClassMutation.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
