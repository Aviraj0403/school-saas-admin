/**
 * Canonical module keys — mirrors the backend registry
 * (libs/common/src/modules/module-registry.ts). Anything stored under an alias
 * is folded onto the canonical key so nav, route guard and dashboards agree.
 */
const ALIASES: Record<string, string> = {
  students: 'student',
  exams: 'exam',
  fees: 'fee',
  payroll: 'hr_payroll',
  'hr-payroll': 'hr_payroll',
  hrpayroll: 'hr_payroll',
  settings: 'core',
  homeworks: 'homework',
  leaves: 'leave',
  libraries: 'library',
  hostels: 'hostel',
};

export function normalizeModuleKey(key: string): string {
  const k = key.toLowerCase().trim();
  return ALIASES[k] ?? k;
}

/**
 * Is a module switched on for the current school? 'core' is always on.
 * An empty/unknown list (not loaded yet) is treated as "on" so nothing flashes away.
 */
export function isModuleActive(activeModules: string[] | undefined, mod: string): boolean {
  const key = normalizeModuleKey(mod);
  if (key === 'core') return true;
  if (!activeModules || activeModules.length === 0) return true;
  return activeModules.some((m) => normalizeModuleKey(m) === key);
}
