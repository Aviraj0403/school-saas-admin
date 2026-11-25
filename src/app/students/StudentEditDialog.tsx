'use client';

import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { studentsService } from '@/services/students.service';
import { errorMessage } from '@/lib/errorMessage';

const FIELDS: Array<{ key: string; label: string; type?: string; span?: boolean }> = [
  { key: 'name', label: 'Full name *' },
  { key: 'dob', label: 'Date of birth', type: 'date' },
  { key: 'bloodGroup', label: 'Blood group' },
  { key: 'rollNo', label: 'Roll no' },
  { key: 'aadharNo', label: 'Aadhar / National ID' },
  { key: 'motherTongue', label: 'Mother tongue' },
  { key: 'religion', label: 'Religion' },
  { key: 'category', label: 'Category' },
  { key: 'previousSchool', label: 'Previous school' },
  { key: 'address', label: 'Address', span: true },
  { key: 'city', label: 'City' },
  { key: 'pincode', label: 'Pincode' },
  { key: 'parentName', label: 'Parent / guardian name' },
  { key: 'parentPhone', label: 'Parent phone' },
  { key: 'parentEmail', label: 'Parent email', type: 'email' },
  { key: 'alternatePhone', label: 'Alternate phone' },
];

/** PATCH /students/:id — only sends fields that changed (backend forbids unknown keys). */
export default function StudentEditDialog({
  student,
  isOpen,
  onClose,
}: {
  student: any;
  isOpen: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});
  const [gender, setGender] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !student) return;
    const f: Record<string, string> = {};
    FIELDS.forEach(({ key, type }) => {
      const v = student[key];
      f[key] = v == null ? '' : type === 'date' ? String(v).slice(0, 10) : String(v);
    });
    setForm(f);
    setGender(student.gender ?? '');
    setActive(student.isActive !== false && student.status !== 'INACTIVE');
  }, [isOpen, student]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, any> = {};
    FIELDS.forEach(({ key, type }) => {
      const before =
        student[key] == null
          ? ''
          : type === 'date'
            ? String(student[key]).slice(0, 10)
            : String(student[key]);
      if (form[key] !== before && form[key] !== '') body[key] = form[key];
    });
    if (gender && gender !== (student.gender ?? '')) body.gender = gender;
    const wasActive = student.isActive !== false && student.status !== 'INACTIVE';
    if (active !== wasActive) body.isActive = active;
    if (Object.keys(body).length === 0) return toast.info('No changes to save.');
    setSaving(true);
    try {
      await studentsService.updateStudent(student.id, body);
      await qc.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student updated.');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update student'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Edit student" className="max-w-2xl">
      <form onSubmit={submit} className="flex min-h-0 flex-col gap-4 overflow-y-auto px-7 pb-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <label
              key={f.key}
              className={`flex flex-col gap-1.5 text-xs font-semibold ${f.span ? 'sm:col-span-2' : ''}`}
            >
              {f.label}
              <Input
                type={f.type}
                value={form[f.key] ?? ''}
                required={f.key === 'name'}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              />
            </label>
          ))}
          <label className="flex flex-col gap-1.5 text-xs font-semibold">
            Gender
            <Select
              value={gender}
              placeholder="Select"
              options={[
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Other', value: 'other' },
              ]}
              onChange={(e) => setGender(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 pt-6 text-xs font-semibold">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active student
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
