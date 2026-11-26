import { navigationConfig, NavItem, canAccessNav, normalizeRole, isCustomRole } from './navigation';
import type { Role } from '@/store/useAuthStore';
import { isModuleActive } from '@/lib/moduleAccess';

/**
 * One route -> {roles, module} map, derived from navigationConfig so the
 * sidebar, search and the page guard can never disagree. Pages that are not in
 * the sidebar are listed in EXTRA_RULES.
 */
export interface RouteRule {
  path: string;
  roles?: Role[];
  module?: string;
}

const ADMINS: Role[] = ['SuperAdmin', 'Principal', 'school_admin'];

const EXTRA_RULES: RouteRule[] = [
  { path: '/fee', roles: [...ADMINS, 'Accountant'], module: 'fee' },
  { path: '/staff', roles: ADMINS, module: 'staff' },
  { path: '/academics/departments', roles: ADMINS, module: 'academics' },
  { path: '/academics/subjects', roles: ADMINS, module: 'academics' },
  { path: '/academics', roles: ADMINS, module: 'academics' },
  { path: '/inventory', roles: [...ADMINS, 'lab_assistant'], module: 'inventory' },
  { path: '/superadmin', roles: ['SuperAdmin'] },
  { path: '/users', roles: ['SuperAdmin'] },
];

function flatten(items: NavItem[], out: RouteRule[] = []): RouteRule[] {
  for (const it of items) {
    if (it.path) out.push({ path: it.path, roles: it.roles, module: it.module });
    if (it.children) flatten(it.children, out);
  }
  return out;
}

let cached: RouteRule[] | null = null;
function rules(): RouteRule[] {
  if (!cached) {
    // Nav entries win over EXTRA_RULES for the same path; longest path matches first.
    const all = [...flatten(navigationConfig), ...EXTRA_RULES];
    const byPath = new Map<string, RouteRule>();
    for (const r of all) {
      const prev = byPath.get(r.path);
      // The same path can appear twice in the nav (e.g. /fee/slabs for staff and for
      // family). Union the roles instead of letting the last one win.
      if (prev && prev.roles && r.roles)
        byPath.set(r.path, { ...prev, roles: [...prev.roles, ...r.roles] });
      else if (!prev) byPath.set(r.path, r);
    }
    cached = [...byPath.values()].sort((a, b) => b.path.length - a.path.length);
  }
  return cached;
}

export function matchRoute(pathname: string): RouteRule | undefined {
  const p = pathname.replace(/\/+$/, '') || '/';
  return rules().find((r) => p === r.path || p.startsWith(r.path + '/'));
}

export type RouteStatus = 'ok' | 'off' | 'denied';

export function evaluateRoute(
  pathname: string,
  ctx: {
    role: string;
    isSuperAdmin: boolean;
    isMirroring?: boolean;
    /** superadmin not inside any school: only platform pages are meaningful */
    outsideSchool?: boolean;
    activeModules: string[] | undefined;
    canRead?: (module: string) => boolean;
  }
): RouteStatus {
  const rule = matchRoute(pathname);
  if (!rule) return 'ok';
  // A mirrored preview is a layout preview of that role, so the role rules apply to it.
  if (ctx.isSuperAdmin && !ctx.isMirroring) {
    if (
      ctx.outsideSchool &&
      !pathname.startsWith('/superadmin') &&
      !pathname.startsWith('/dashboard') &&
      !pathname.startsWith('/users') &&
      !pathname.startsWith('/profile') &&
      !pathname.startsWith('/settings')
    )
      return 'denied';
    return 'ok';
  }
  const grantedByRole =
    isCustomRole(ctx.role) &&
    !!ctx.canRead &&
    !!rule.module &&
    rule.module !== 'core' &&
    ctx.canRead(rule.module);
  if (
    !canAccessNav(rule.roles, ctx.role) &&
    !grantedByRole &&
    normalizeRole(ctx.role) !== 'superadmin'
  )
    return 'denied';
  if (rule.module && !isModuleActive(ctx.activeModules, rule.module)) return 'off';
  return 'ok';
}
