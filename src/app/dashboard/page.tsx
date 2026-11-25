'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { useAuthStore } from '@/store/useAuthStore';
import { normalizeRole } from '@/config/navigation';
import { SuperAdminDashboard } from '@/components/dashboard/SuperAdminDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { TeacherDashboard } from '@/components/dashboard/TeacherDashboard';
import { AccountantDashboard } from '@/components/dashboard/AccountantDashboard';
import { LibrarianDashboard } from '@/components/dashboard/LibrarianDashboard';
import { StudentParentDashboard } from '@/components/dashboard/StudentParentDashboard';
import { StaffDashboard } from '@/components/dashboard/StaffDashboard';

export default function DashboardPage() {
  const { activeUser } = useAuthStore();
  const rawRole = activeUser?.role || (activeUser?.isSuperAdmin ? 'SuperAdmin' : 'school_admin');
  const role = normalizeRole(rawRole);

  const renderRoleDashboard = () => {
    switch (role) {
      case 'superadmin':
        return <SuperAdminDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'accountant':
        return <AccountantDashboard />;
      case 'librarian':
        return <LibrarianDashboard />;
      case 'student':
      case 'parent':
        return <StudentParentDashboard />;
      case 'clerk':
      case 'lab_assistant':
      case 'support_staff':
        return <StaffDashboard />;
      case 'school_admin':
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Dashboard" />
      {renderRoleDashboard()}
    </DashboardLayout>
  );
}
