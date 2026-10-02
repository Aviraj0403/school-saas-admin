'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useAuthStore } from '@/store/useAuthStore';
import { useStudentsList } from '@/hooks/queries/useStudents';
import { api } from '@/services/api';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role:
    'SuperAdmin' | 'Principal' | 'Teacher' | 'Accountant' | 'school_admin' | 'Student' | 'Parent';
  isActive: boolean;
  empIdOrAdmNo?: string;
  parentLinked?: string;
}

export default function UsersRegistryPage() {
  const { activeTenant, mirrorUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [staffList, setStaffList] = useState<SystemUser[]>([]);
  const [parentsList, setParentsList] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);

  const handleMirrorUser = (userObj: SystemUser) => {
    mirrorUser({
      id: userObj.id,
      name: userObj.name,
      role: userObj.role,
      email: userObj.email,
    });
    window.dispatchEvent(
      new CustomEvent('show-toast', {
        detail: {
          severity: 'warn',
          summary: 'Mirror Mode Active',
          detail: `Now mirroring user profile: ${userObj.name} (${userObj.role})`,
          life: 3500,
        },
      })
    );
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 300);
  };

  const baseDomain =
    typeof window !== 'undefined'
      ? `.${window.location.hostname.split('.').slice(1).join('.')}`
      : '.jdinfotechsolutions.in';
  const schoolLoginUrl = activeTenant
    ? `https://${activeTenant.subdomain}${baseDomain}/login`
    : 'https://demo.jdinfotechsolutions.in/login';

  // Get student query
  const { data: studentsData, isPending: loadingStudents } = useStudentsList(1, 100);
  const rawStudents = studentsData?.items || studentsData?.data?.items || [];

  const mappedStudents: SystemUser[] = rawStudents.map((s: any) => ({
    id: s.id,
    name: s.name || `${s.firstName} ${s.lastName}`,
    email:
      s.email ||
      `student.${s.admissionNo.toLowerCase().replace(/[^a-z0-9]/g, '-')}@${activeTenant?.subdomain || 'school'}.com`,
    phone: s.phone || 'N/A',
    role: 'Student',
    isActive: s.status === 'ACTIVE',
    empIdOrAdmNo: s.admissionNo,
    parentLinked: s.parentName || 'N/A',
  }));

  // Fetch staff and parents from actual backend
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [staffRes, parentRes] = await Promise.all([api.get('/staff'), api.get('/parents')]);

      if (staffRes.data?.success) {
        const mappedStaff = staffRes.data.data.map((s: any) => ({
          id: s.id,
          name: s.name || `${s.firstName} ${s.lastName}`,
          email: s.email,
          phone: s.phone || 'N/A',
          role: s.role?.name || 'Staff',
          isActive: s.isActive ?? true,
          empIdOrAdmNo: s.employeeId || 'N/A',
        }));
        setStaffList(mappedStaff);
      } else {
        setStaffList([]);
      }

      if (parentRes.data?.success) {
        const mappedParents = parentRes.data.data.map((p: any) => ({
          id: p.id,
          name: p.name || `${p.firstName} ${p.lastName}`,
          email: p.email,
          phone: p.phone || 'N/A',
          role: 'Parent',
          isActive: p.isActive ?? true,
          parentLinked:
            p.students?.map((stu: any) => `${stu.name} (Adm: ${stu.admissionNo})`).join(', ') ||
            'N/A',
        }));
        setParentsList(mappedParents);
      } else {
        setParentsList([]);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setStaffList([]);
      setParentsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTenant]);

  const handleCopyCredentials = (userObj: SystemUser) => {
    const credInfo = `Login URL: ${schoolLoginUrl}\nUsername/Email: ${userObj.email}\nDefault Password: ${userObj.role === 'Student' ? 'Student@123' : userObj.role === 'Parent' ? 'Parent@123' : 'School@123'}`;
    navigator.clipboard.writeText(credInfo);
    window.dispatchEvent(
      new CustomEvent('show-toast', {
        detail: {
          severity: 'success',
          summary: 'Credentials Copied!',
          detail: `Login credentials copied to clipboard for ${userObj.name}.`,
          life: 3000,
        },
      })
    );
  };

  const handleShareWhatsApp = (userObj: SystemUser) => {
    const defaultPass =
      userObj.role === 'Student'
        ? 'Student@123'
        : userObj.role === 'Parent'
          ? 'Parent@123'
          : 'School@123';
    const message = `Hello ${userObj.name},\n\nWelcome to ${activeTenant?.name || 'our school'}.\nYour dynamic portal access has been successfully configured.\n\n🌐 Login Link: ${schoolLoginUrl}\n📧 Email/Username: ${userObj.email}\n🔑 Default Password: ${defaultPass}\n\nPlease update your password upon first login!`;
    const encodedMsg = encodeURIComponent(message);
    const cleanPhone = (userObj.phone || '').replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone || '919876543210'}?text=${encodedMsg}`, '_blank');
  };

  const filterList = (list: SystemUser[]) => {
    return list.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery)) ||
        (u.empIdOrAdmNo && u.empIdOrAdmNo.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const actionsTemplate = (rowData: SystemUser) => (
    <div className="flex gap-2 items-center justify-center">
      <Button
        icon="pi pi-eye"
        className="p-button-text p-button-sm p-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20"
        tooltip="Mirror User View (Impersonate)"
        tooltipOptions={{ position: 'top' }}
        onClick={() => handleMirrorUser(rowData)}
      />
      <Button
        icon="pi pi-copy"
        className="p-button-text p-button-sm p-1 text-zinc-500 hover:bg-zinc-100"
        tooltip="Copy Credentials"
        tooltipOptions={{ position: 'top' }}
        onClick={() => handleCopyCredentials(rowData)}
      />
      <Button
        icon="pi pi-whatsapp"
        className="p-button-text p-button-sm p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
        tooltip="Share via WhatsApp"
        tooltipOptions={{ position: 'top' }}
        onClick={() => handleShareWhatsApp(rowData)}
      />
    </div>
  );

  return (
    <DashboardLayout>
      <PageBreadcrumb title="User & Staff Management" />
      <div className="flex flex-col gap-6 pb-12 animate-fade-in">
        {/* Executive Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border border-indigo-500/20 p-6 md:p-8 shadow-xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/20 border border-blue-400/30 rounded-full">
                  🛡️ Identity & Access Governance
                </span>
                <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  {activeTenant?.subdomain
                    ? `${activeTenant.subdomain}${baseDomain}`
                    : 'Active Subdomain Context'}
                </span>
              </div>
              <h1 className="mt-2 text-2xl md:text-3xl font-black text-white tracking-tight">
                Global User Registry & Impersonation Hub
              </h1>
              <p className="mt-1 text-xs md:text-sm text-zinc-300 max-w-2xl">
                Audit system accounts across faculty, students, and parents. Trigger 1-click persona
                mirroring or dispatch portal login credentials directly via WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* Identity & Account KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-md flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Faculty & Staff
              </span>
              <div className="text-2xl font-black text-white mt-1">
                {staffList.length || '0'} Accounts
              </div>
            </div>
            <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <i className="pi pi-briefcase text-xl"></i>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-md flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Enrolled Students
              </span>
              <div className="text-2xl font-black text-white mt-1">
                {mappedStudents.length || '0'} Accounts
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <i className="pi pi-graduation-cap text-xl"></i>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-md flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Registered Parents
              </span>
              <div className="text-2xl font-black text-white mt-1">
                {parentsList.length || '0'} Accounts
              </div>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <i className="pi pi-users text-xl"></i>
            </div>
          </div>
        </div>

        {/* Multi-Tenant Subdomain Routing Banner */}
        <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-300 flex items-start gap-3 shadow-inner">
          <i className="pi pi-info-circle text-blue-400 text-lg mt-0.5"></i>
          <div>
            <span className="font-extrabold text-white block uppercase tracking-wider text-[10px] mb-0.5">
              Multi-Tenant Subdomain Isolation
            </span>
            Users authenticate through secure tenant subdomains (e.g.,{' '}
            <code>
              https://{activeTenant?.subdomain || 'demo'}
              {baseDomain}
            </code>
            ). Parent accounts with wards in multiple schools map safely with isolated landing
            views.
          </div>
        </div>

        {/* Main Data Registry Card */}
        <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-xl p-6 shadow-xl space-y-5">
          {/* Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div className="relative w-full sm:w-96">
              <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400"></i>
              <InputText
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, phone, or ID code..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-zinc-950/90 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="text-xs text-zinc-400 font-medium">
              Showing matching records across active tabs
            </div>
          </div>

          {/* Unified Tab Cockpit */}
          <TabView
            activeIndex={activeIndex}
            onTabChange={(e) => setActiveIndex(e.index)}
            className="custom-premium-tabs"
          >
            {/* Staff / Teachers Tab */}
            <TabPanel
              header={`Staff & Faculty (${filterList(staffList).length})`}
              leftIcon="pi pi-briefcase mr-2"
            >
              <DataTable
                value={filterList(staffList)}
                loading={loading}
                className="p-datatable-sm mt-3"
                paginator
                rows={10}
                emptyMessage="No staff records match your query."
                stripedRows
              >
                <Column
                  field="empIdOrAdmNo"
                  header="Employee ID"
                  className="font-mono text-xs font-bold text-indigo-400"
                />
                <Column field="name" header="Name" className="font-bold text-white text-sm" />
                <Column
                  field="email"
                  header="Email Username"
                  className="text-zinc-300 font-mono text-xs"
                />
                <Column field="phone" header="Contact Phone" className="text-zinc-300" />
                <Column
                  field="role"
                  header="Role"
                  body={(d) => (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                      {d.role}
                    </span>
                  )}
                />
                <Column header="Credential Actions" body={actionsTemplate} align="center" />
              </DataTable>
            </TabPanel>

            {/* Students Tab */}
            <TabPanel
              header={`Students (${filterList(mappedStudents).length})`}
              leftIcon="pi pi-graduation-cap mr-2"
            >
              <DataTable
                value={filterList(mappedStudents)}
                loading={loadingStudents}
                className="p-datatable-sm mt-3"
                paginator
                rows={10}
                emptyMessage="No student records match your query."
                stripedRows
              >
                <Column
                  field="empIdOrAdmNo"
                  header="Admission No"
                  className="font-mono text-xs font-bold text-blue-400"
                />
                <Column
                  field="name"
                  header="Student Name"
                  className="font-bold text-white text-sm"
                />
                <Column
                  field="email"
                  header="Assigned Username"
                  className="text-xs text-blue-400 font-mono"
                />
                <Column field="parentLinked" header="Linked Guardian" className="text-zinc-300" />
                <Column
                  header="Status"
                  body={(d) => (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        d.isActive
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                      }`}
                    >
                      {d.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  )}
                />
                <Column header="Credential Actions" body={actionsTemplate} align="center" />
              </DataTable>
            </TabPanel>

            {/* Parents Tab */}
            <TabPanel
              header={`Parents / Guardians (${filterList(parentsList).length})`}
              leftIcon="pi pi-users mr-2"
            >
              <DataTable
                value={filterList(parentsList)}
                loading={loading}
                className="p-datatable-sm mt-3"
                paginator
                rows={10}
                emptyMessage="No parent records match your query."
                stripedRows
              >
                <Column
                  field="name"
                  header="Parent Name"
                  className="font-bold text-white text-sm"
                />
                <Column
                  field="email"
                  header="Parent Username"
                  className="text-zinc-300 font-mono text-xs"
                />
                <Column
                  field="phone"
                  header="WhatsApp Phone"
                  className="text-emerald-400 font-mono"
                />
                <Column
                  field="parentLinked"
                  header="Associated Ward(s)"
                  className="text-xs text-zinc-400 font-medium"
                />
                <Column header="Credential Actions" body={actionsTemplate} align="center" />
              </DataTable>
            </TabPanel>
          </TabView>
        </div>
      </div>
    </DashboardLayout>
  );
}
