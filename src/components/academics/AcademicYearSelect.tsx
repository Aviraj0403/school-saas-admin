'use client';

import { useAcademicYears } from '@/hooks/queries/useAcademics';

interface AcademicYearSelectProps {
  value: string;
  onChange: (academicYearId: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Shared academic-year picker. Always resolves to a real AcademicYear id —
 * replaces the free-text "e.g. 2024-2025" inputs previously used on the
 * student, hostel, transport and fee forms.
 */
export function AcademicYearSelect({
  value,
  onChange,
  className,
  placeholder = 'Select academic year',
  disabled,
}: AcademicYearSelectProps) {
  const { data: academicYears, isLoading } = useAcademicYears();
  const years = academicYears || [];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || isLoading}
      className={
        className ??
        'p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 rounded-md outline-none focus:border-blue-500 text-sm w-full'
      }
    >
      <option value="" disabled>
        {isLoading ? 'Loading…' : placeholder}
      </option>
      {years.map((y) => (
        <option key={y.id} value={y.id}>
          {y.name}
          {y.isCurrent ? ' (Current)' : ''}
        </option>
      ))}
    </select>
  );
}
