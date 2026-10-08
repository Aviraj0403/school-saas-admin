'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academicsService } from '@/services/academics.service';
import { staffService } from '@/services/staff.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { toast } from 'sonner';
import { BookOpen, Plus, Edit2, Trash2, Search } from 'lucide-react';

export default function SubjectsPage() {
  const queryClient = useQueryClient();

  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    code: '',
    type: 'theory',
    departmentId: '',
    teacherId: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const { data: subjects, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => academicsService.getSubjects(),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => academicsService.getDepartments(),
  });

  const { data: staffData } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffService.getStaffList(1, 100),
  });
  const staff = staffData?.items || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => academicsService.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsDialogVisible(false);
      toast.success('Subject created successfully');
    },
    onError: () => toast.error('Failed to create subject'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => academicsService.updateSubject(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsDialogVisible(false);
      toast.success('Subject updated successfully');
    },
    onError: () => toast.error('Failed to update subject'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => academicsService.deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Subject deleted successfully');
    },
    onError: () => toast.error('Failed to delete subject'),
  });

  const openNew = () => {
    setFormData({ id: '', name: '', code: '', type: 'theory', departmentId: '', teacherId: '' });
    setIsDialogVisible(true);
  };

  const openEdit = (subject: any) => {
    setFormData({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      type: subject.type || 'theory',
      departmentId: subject.departmentId || '',
      teacherId: subject.teacherId || '',
    });
    setIsDialogVisible(true);
  };

  const saveSubject = () => {
    if (!formData.name || !formData.code) {
      toast.error('Name and Code are required');
      return;
    }
    const payload = {
      name: formData.name,
      code: formData.code,
      type: formData.type,
      ...(formData.departmentId && { departmentId: formData.departmentId }),
      ...(formData.teacherId && { teacherId: formData.teacherId }),
    };

    if (formData.id) updateMutation.mutate({ id: formData.id, ...payload });
    else createMutation.mutate(payload);
  };

  const confirmDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      deleteMutation.mutate(id);
    }
  };

  const deptOptions = Array.isArray(departments)
    ? departments.map((d: any) => ({ label: d.name, value: d.id }))
    : [];
  const teacherOptions = Array.isArray(staff)
    ? staff.map((t: any) => ({ label: t.name || t.fullName || 'Unnamed', value: t.id }))
    : [];
  const typeOptions = [
    { label: 'Theory', value: 'theory' },
    { label: 'Practical', value: 'practical' },
    { label: 'Both', value: 'both' },
  ];

  const filteredSubjects = (Array.isArray(subjects) ? subjects : []).filter(
    (s: any) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Subjects" subtitle="Academics" />
      <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand" />
            Subjects
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Manage school subjects and assigned teachers
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add Subject
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects by name or code..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Assigned Teacher</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                    <p>Loading subjects...</p>
                  </td>
                </tr>
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    No subjects found.
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subject: any) => (
                  <tr
                    key={subject.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      {subject.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-600 dark:text-zinc-300">
                      {subject.code}
                    </td>
                    <td className="px-6 py-4 capitalize">
                      <Badge variant="secondary">{subject.type || 'Theory'}</Badge>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {subject.department?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {subject.teacher?.name || subject.teacher?.fullName || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(subject)}>
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => confirmDelete(subject.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        isOpen={isDialogVisible}
        onClose={() => setIsDialogVisible(false)}
        title={formData.id ? 'Edit Subject' : 'New Subject'}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Subject Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Mathematics"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Subject Code *
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g. MATH101"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Type</label>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={typeOptions}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Department
            </label>
            <Select
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              options={[{ label: 'Select Department', value: '' }, ...deptOptions]}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Assigned Teacher
            </label>
            <Select
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              options={[{ label: 'Select Teacher', value: '' }, ...teacherOptions]}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setIsDialogVisible(false)}>
            Cancel
          </Button>
          <Button
            onClick={saveSubject}
            isLoading={createMutation.isPending || updateMutation.isPending}
          >
            Save
          </Button>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
