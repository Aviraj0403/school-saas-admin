'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/layout/PageHeader';
import { ChildSwitcher } from './ChildSwitcher';
import { EmptyBlock, LoadingBlock } from './QueryState';
import { useSelectedChild } from './useChildStore';
import { Users } from 'lucide-react';
import type { FamilyChild } from '@/services/family.service';

interface PortalShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** Render prop receives the selected child; only called when one exists. */
  children: (ctx: {
    child: FamilyChild;
    studentId: string;
    isStudent: boolean;
    isParent: boolean;
  }) => React.ReactNode;
}

/** Shared chrome for every /portal page: layout, header, child switcher, no-child guard. */
export default function PortalShell({ title, description, actions, children }: PortalShellProps) {
  const { child, studentId, hasChildren, isStudent, isParent, isLoadingChildren } =
    useSelectedChild();

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 pb-6">
        <PageHeader
          title={title}
          description={
            description && child && !isStudent ? `${description} — ${child.name}` : description
          }
          actions={actions}
        />
        <ChildSwitcher />
        {!hasChildren ? (
          <EmptyBlock
            icon={Users}
            text="No student is linked to this account yet. Please ask the school office to link your child."
          />
        ) : isLoadingChildren && !child ? (
          <LoadingBlock />
        ) : child ? (
          // key remounts page state (dialogs, filters) when the child changes
          <React.Fragment key={studentId}>
            {children({ child, studentId, isStudent, isParent })}
          </React.Fragment>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
