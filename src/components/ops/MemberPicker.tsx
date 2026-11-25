'use client';

import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ops/OpsKit';
import { useStudentsList } from '@/hooks/queries/useStudents';
import { useStaffLite } from '@/hooks/queries/useStaffLite';
import { asList } from '@/lib/utils';

export interface Member {
  id: string;
  name: string;
  kind: 'Student' | 'Staff';
  detail?: string;
}

/** Search + pick a student or staff member; resolves to a real id. */
export function MemberPicker({
  value,
  onChange,
}: {
  value: Member | null;
  onChange: (m: Member | null) => void;
}) {
  const [kind, setKind] = useState<'Student' | 'Staff'>('Student');
  const [q, setQ] = useState('');
  const students = useStudentsList(
    1,
    15,
    kind === 'Student' && q.trim().length >= 2 ? q.trim() : undefined
  );
  const staff = useStaffLite();

  const options: Member[] = useMemo(() => {
    if (kind === 'Student') {
      if (q.trim().length < 2) return [];
      return asList<any>(students.data).map((s) => ({
        id: s.id,
        name: s.name,
        kind: 'Student' as const,
        detail: `Adm ${s.admissionNo}${s.class?.name ? ` · ${s.class.name}${s.class.section ? '-' + s.class.section : ''}` : ''}`,
      }));
    }
    const needle = q.trim().toLowerCase();
    return (staff.data ?? [])
      .filter((s) => !needle || s.name.toLowerCase().includes(needle))
      .slice(0, 15)
      .map((s) => ({
        id: s.id,
        name: s.name,
        kind: 'Staff' as const,
        detail: s.designation ?? undefined,
      }));
  }, [kind, q, students.data, staff.data]);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <Select
          value={kind}
          options={[
            { label: 'Student', value: 'Student' },
            { label: 'Staff', value: 'Staff' },
          ]}
          onChange={(e) => {
            setKind(e.target.value as 'Student' | 'Staff');
            setQ('');
            onChange(null);
          }}
        />
        <div className="col-span-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              kind === 'Student' ? 'Type name or admission no (2+ chars)' : 'Filter staff by name'
            }
          />
        </div>
      </div>
      {value && (
        <p className="text-xs text-emerald-600 font-semibold">
          Selected: {value.name} ({value.kind}
          {value.detail ? ` · ${value.detail}` : ''})
        </p>
      )}
      {(students.isFetching && kind === 'Student') || (staff.isPending && kind === 'Staff') ? (
        <Spinner />
      ) : options.length > 0 ? (
        <div className="max-h-44 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-100 dark:divide-zinc-800">
          {options.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/40 ${value?.id === m.id ? 'bg-brand/10' : ''}`}
            >
              <span className="font-semibold">{m.name}</span>
              {m.detail && <span className="text-zinc-500"> · {m.detail}</span>}
            </button>
          ))}
        </div>
      ) : (
        kind === 'Student' &&
        q.trim().length >= 2 && <p className="text-xs text-zinc-500">No matching students.</p>
      )}
    </div>
  );
}
