const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  super_admin: 'Super Admin',
  school_admin: 'School Admin',
  schooladmin: 'School Admin',
  admin: 'School Admin',
};

/** Turns a role slug ('school_admin', 'teacher', 'SuperAdmin') into a display label. */
export function formatRole(role?: string | null): string {
  if (!role) return 'Member';
  const key = role.trim().toLowerCase();
  if (ROLE_LABELS[key]) return ROLE_LABELS[key];
  return key
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

/** Up to two initials for avatars, e.g. 'Demo School Admin' → 'DS'. */
export function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

/** '12 Oct 2026' — tolerant of missing or invalid input. */
export function formatDate(value?: string | Date | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** True when the date is today or later (start of today, local time). */
export function isUpcoming(value?: string | Date | null): boolean {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return d >= start;
}

/** Local calendar date as YYYY-MM-DD (toISOString() would shift to UTC). */
export function localDateISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Students carry `isActive` (older code expected a `status` string); accept either. */
export function isStudentActive(
  s: { isActive?: boolean; status?: string } | null | undefined
): boolean {
  if (!s) return false;
  if (typeof s.isActive === 'boolean') return s.isActive;
  return s.status === 'ACTIVE';
}
