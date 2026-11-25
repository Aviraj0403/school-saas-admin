import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useMemo } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useFamilyChildren } from '@/hooks/queries/useFamily';
import type { FamilyChild } from '@/services/family.service';

interface ChildStore {
  selectedId: string | null;
  setSelectedId: (id: string) => void;
}

export const useChildStore = create<ChildStore>()(
  persist(
    (set) => ({
      selectedId: null,
      setSelectedId: (id) => set({ selectedId: id }),
    }),
    { name: 'portal-selected-child' }
  )
);

/**
 * The child the portal is currently showing. Only ids inside the login's own
 * scope are ever returned, so a stale persisted id can never leak through.
 * Names come from GET /family/fees (the only family payload carrying them).
 */
export function useSelectedChild() {
  const { scope, role } = usePermissions();
  const selectedId = useChildStore((s) => s.selectedId);
  const setSelectedId = useChildStore((s) => s.setSelectedId);
  const childrenQuery = useFamilyChildren();

  const ids = scope.studentIds;
  const children: FamilyChild[] = useMemo(() => {
    const byId = new Map((childrenQuery.data ?? []).map((c) => [c.id, c]));
    return ids.map((id, i) => byId.get(id) ?? { id, name: `Child ${i + 1}` });
  }, [ids, childrenQuery.data]);

  const studentId = ids.includes(selectedId ?? '') ? (selectedId as string) : (ids[0] ?? '');
  const child = children.find((c) => c.id === studentId) ?? null;

  return {
    children,
    child,
    studentId,
    setChild: setSelectedId,
    isStudent: role === 'student',
    isParent: role === 'parent',
    hasChildren: ids.length > 0,
    isLoadingChildren: childrenQuery.isPending,
  };
}
