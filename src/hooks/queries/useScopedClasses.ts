import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { asList, unwrap } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermissions } from '@/hooks/usePermissions';

export interface ClassOption {
  id: string;
  name: string;
  section?: string;
  label: string;
  [k: string]: any;
}

/**
 * Classes the current user may work with. Admins see every class; a teacher sees
 * only the classes in `scope.classIds` (the ones they teach or are class teacher of).
 */
export function useScopedClasses() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isAdmin, isRole, scope } = usePermissions();
  const query = useQuery({
    queryKey: ['academics', 'classes', 'all'],
    queryFn: async () => asList<any>(unwrap(await api.get('/academics/classes'))),
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: false,
  });
  const isTeacher = isRole('teacher') && !isAdmin;
  const classes = useMemo<ClassOption[]>(() => {
    const all = query.data ?? [];
    const allowed = isTeacher ? new Set(scope?.classIds ?? []) : null;
    return all
      .filter((c: any) => !allowed || allowed.has(c.id))
      .map((c: any) => ({ ...c, label: `${c.name}${c.section ? ` - ${c.section}` : ''}` }));
  }, [query.data, isTeacher, scope?.classIds]);
  return { classes, isLoading: query.isLoading, isError: query.isError, isTeacher };
}
