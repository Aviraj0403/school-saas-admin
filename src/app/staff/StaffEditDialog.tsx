'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  useUpdateStaff,
  useRoles,
  useDepartments,
  useDesignations,
} from '@/hooks/queries/useStaff';
import { errorMessage } from '@/lib/errorMessage';

/** PATCH /staff/:id — name, phone, designation, department, employee id, role. */
export default function StaffEditDialog({
  staff,
  isOpen,
  onClose,
  onSaved,
}: {
  staff: any;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updated: any) => void;
}) {
  const update = useUpdateStaff();
  const { data: roles } = useRoles();
  const { data: depts } = useDepartments();
  const { data: designations } = useDesignations();
  const [f, setF] = useState({
    name: '',
    phone: '',
    designation: '',
    departmentId: '',
    employeeId: '',
    roleId: '',
  });

  useEffect(() => {
    if (!isOpen || !staff) return;
    setF({
      name: staff.name ?? '',
      phone: staff.phone ?? '',
      designation: staff.designation ?? '',
      departmentId: staff.departmentId ?? '',
      employeeId: staff.employeeId ?? '',
      roleId: staff.roles?.[0]?.role?.id ?? '',
    });
  }, [isOpen, staff]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, any> = {};
    if (f.name.trim() && f.name !== staff.name) body.name = f.name.trim();
    if (f.phone !== (staff.phone ?? '') && f.phone) body.phone = f.phone;
    if (f.designation !== (staff.designation ?? '') && f.designation)
      body.designation = f.designation;
    if (f.departmentId !== (staff.departmentId ?? '') && f.departmentId)
      body.departmentId = f.departmentId;
    if (f.employeeId !== (staff.employeeId ?? '') && f.employeeId) body.employeeId = f.employeeId;
    if (f.roleId && f.roleId !== (staff.roles?.[0]?.role?.id ?? '')) body.roleIds = [f.roleId];
    if (Object.keys(body).length === 0) return toast.info('No changes to save.');
    update.mutate(
      { id: staff.id, data: body },
      {
        onSuccess: (updated: any) => {
          toast.success('Staff member updated.');
          onSaved?.(updated);
          onClose();
        },
        onError: (err) => toast.error(errorMessage(err, 'Could not update staff member')),
      }
    );
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Edit staff member">
      <form onSubmit={submit} className="flex min-h-0 flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-semibold">
          Name *
          <Input value={f.name} required onChange={(e) => setF({ ...f, name: e.target.value })} />
        </label>
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs font-semibold">
            Phone
            <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold">
            Employee ID
            <Input
              value={f.employeeId}
              onChange={(e) => setF({ ...f, employeeId: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold">
            Designation
            <Select
              value={f.designation}
              placeholder="Select"
              options={(designations || []).map((d: any) => ({ label: d.name, value: d.name }))}
              onChange={(e) => setF({ ...f, designation: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold">
            Department
            <Select
              value={f.departmentId}
              placeholder="Select"
              options={(depts || []).map((d: any) => ({ label: d.name, value: d.id }))}
              onChange={(e) => setF({ ...f, departmentId: e.target.value })}
            />
          </label>
          <label className="col-span-2 flex flex-col gap-1.5 text-xs font-semibold">
            System role
            <Select
              value={f.roleId}
              placeholder="Select"
              options={(roles || []).map((r: any) => ({ label: r.name, value: r.id }))}
              onChange={(e) => setF({ ...f, roleId: e.target.value })}
            />
          </label>
        </div>
        <p className="text-[11px] text-zinc-400">The login email cannot be changed here.</p>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={update.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
