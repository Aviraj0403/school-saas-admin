'use client';

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface Props {
  /** e.g. 'fee:create' */
  permission?: string;
  /** role slugs allowed, e.g. ['school_admin','teacher'] */
  roles?: string[];
  module?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/** Hides (or replaces) UI the current role/plan may not use. */
export function PermissionGate({ permission, roles, module, fallback = null, children }: Props) {
  const { can, isRole, hasModule } = usePermissions();
  if (permission && !can(permission)) return <>{fallback}</>;
  if (roles && !isRole(...roles)) return <>{fallback}</>;
  if (module && !hasModule(module)) return <>{fallback}</>;
  return <>{children}</>;
}
