/**
 * Helper to check if a specific module is active for the current tenant school.
 * Handles singular / plural naming (e.g., 'student' vs 'students', 'fee' vs 'fees').
 */
export function isModuleActive(activeModules: string[] | undefined, mod: string): boolean {
  if (!activeModules || activeModules.length === 0) return true;
  const modLower = mod.toLowerCase().trim();
  const singular = modLower.endsWith('s') ? modLower.slice(0, -1) : modLower;
  const plural = modLower.endsWith('s') ? modLower : `${modLower}s`;

  return activeModules.some((m) => {
    const mLower = m.toLowerCase().trim();
    return mLower === modLower || mLower === singular || mLower === plural || mLower === 'core';
  });
}
