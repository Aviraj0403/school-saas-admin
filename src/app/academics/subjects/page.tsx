'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academicsService } from '@/services/academics.service';
import { staffService } from '@/services/staff.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { useToast } from '@/hooks/useToast';

export default function SubjectsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', code: '', type: 'theory', departmentId: '', teacherId: '' });

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
    queryFn: () => staffService.getStaffList(1, 1000),
  });
  const staff = staffData?.items || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => academicsService.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsDialogVisible(false);
      toast({ title: 'Success', description: 'Subject created successfully' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to create subject', variant: 'destructive' })
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => academicsService.updateSubject(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsDialogVisible(false);
      toast({ title: 'Success', description: 'Subject updated successfully' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to update subject', variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => academicsService.deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast({ title: 'Success', description: 'Subject deleted successfully' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to delete subject', variant: 'destructive' })
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
      toast({ title: 'Validation', description: 'Name and Code are required', variant: 'destructive' });
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

  const deptOptions = Array.isArray(departments) ? departments.map((d: any) => ({ label: d.name, value: d.id })) : [];
  const teacherOptions = Array.isArray(staff) ? staff.map((t: any) => ({ label: t.name, value: t.id })) : [];
  const typeOptions = [
    { label: 'Theory', value: 'theory' },
    { label: 'Practical', value: 'practical' },
    { label: 'Both', value: 'both' },
  ];

  const actionBodyTemplate = (rowData: any) => (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => openEdit(rowData)}>Edit</Button>
      <Button variant="destructive" size="sm" onClick={() => confirmDelete(rowData.id)}>Delete</Button>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Subjects</h1>
          <p className="text-sm text-zinc-500">Manage school subjects and assigned teachers</p>
        </div>
        <Button onClick={openNew}>+ Add Subject</Button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-lg overflow-hidden">
        <DataTable value={subjects} loading={isLoading} paginator rows={10} emptyMessage="No subjects found.">
          <Column field="name" header="Name" sortable></Column>
          <Column field="code" header="Code" sortable></Column>
          <Column field="type" header="Type"></Column>
          <Column field="department.name" header="Department"></Column>
          <Column field="teacher.name" header="Assigned Teacher" body={(rowData) => rowData.teacher?.name || '-'}></Column>
          <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }}></Column>
        </DataTable>
      </div>

      <Dialog visible={isDialogVisible} style={{ width: '450px' }} header={formData.id ? 'Edit Subject' : 'New Subject'} modal className="p-fluid" onHide={() => setIsDialogVisible(false)}>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject Name *</label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Mathematics" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject Code *</label>
            <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. MATH101" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <Dropdown value={formData.type} options={typeOptions} onChange={(e) => setFormData({ ...formData, type: e.value })} placeholder="Select Type" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Department</label>
            <Dropdown value={formData.departmentId} options={deptOptions} onChange={(e) => setFormData({ ...formData, departmentId: e.value })} placeholder="Select Department" showClear />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Assigned Teacher</label>
            <Dropdown value={formData.teacherId} options={teacherOptions} onChange={(e) => setFormData({ ...formData, teacherId: e.value })} placeholder="Select Teacher" showClear />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setIsDialogVisible(false)}>Cancel</Button>
          <Button onClick={saveSubject}>Save</Button>
        </div>
      </Dialog>
    </div>
  );
}
