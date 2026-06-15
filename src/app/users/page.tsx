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
  role: 'SuperAdmin' | 'Principal' | 'Teacher' | 'Accountant' | 'school_admin' | 'Student' | 'Parent';
  isActive: boolean;
  empIdOrAdmNo?: string;
  parentLinked?: string;
}

export default function UsersRegistryPage() {
  const { activeTenant } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [staffList, setStaffList] = useState<SystemUser[]>([]);
  const [parentsList, setParentsList] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);

  const baseDomain = typeof window !== 'undefined' ? `.${window.location.hostname.split('.').slice(1).join('.')}` : '.jdinfotechsolutions.in';
  const schoolLoginUrl = activeTenant ? `https://${activeTenant.subdomain}${baseDomain}/login` : 'https://demo.jdinfotechsolutions.in/login';

  // Get student query
  const { data: studentsData, isPending: loadingStudents } = useStudentsList(1, 200);
  const rawStudents = studentsData?.items || studentsData?.data?.items || [];
  
  const mappedStudents: SystemUser[] = rawStudents.map((s: any) => ({
    id: s.id,
    name: s.name || `${s.firstName} ${s.lastName}`,
    email: s.email || `student.${s.admissionNo.toLowerCase().replace(/[^a-z0-9]/g, '-')}@${activeTenant?.subdomain || 'school'}.com`,
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
      const [staffRes, parentRes] = await Promise.all([
        api.get('/staff'),
        api.get('/parents')
      ]);
      
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
          parentLinked: p.students?.map((stu: any) => `${stu.name} (Adm: ${stu.admissionNo})`).join(', ') || 'N/A',
        }));
        setParentsList(mappedParents);
      } else {
        setParentsList([]);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
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
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { severity: 'success', summary: 'Credentials Copied!', detail: `Login credentials copied to clipboard for ${userObj.name}.`, life: 3000 }
    }));
  };

  const handleShareWhatsApp = (userObj: SystemUser) => {
    const defaultPass = userObj.role === 'Student' ? 'Student@123' : userObj.role === 'Parent' ? 'Parent@123' : 'School@123';
    const message = `Hello ${userObj.name},\n\nWelcome to ${activeTenant?.name || 'our school'}.\nYour dynamic portal access has been successfully configured.\n\n🌐 Login Link: ${schoolLoginUrl}\n📧 Email/Username: ${userObj.email}\n🔑 Default Password: ${defaultPass}\n\nPlease update your password upon first login!`;
    const encodedMsg = encodeURIComponent(message);
    const cleanPhone = (userObj.phone || '').replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone || '919876543210'}?text=${encodedMsg}`, '_blank');
  };

  const filterList = (list: SystemUser[]) => {
    return list.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery)) ||
      (u.empIdOrAdmNo && u.empIdOrAdmNo.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const actionsTemplate = (rowData: SystemUser) => (
    <div className="flex gap-2 items-center justify-center">
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
      <PageBreadcrumb title="Users" />
<div className="flex flex-col gap-4 pb-10 animate-fade-in">
        
        {/* Header Title */}
        <div className="flex flex-col items-start gap-4 pt-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Global User Registry</h1>
            <p className="text-slate-400 mt-1.5 text-sm md:text-base">
              Centralized cockpit to audit system accounts, reset passwords, and instantly dispatch portal credentials via WhatsApp.
            </p>
          </div>
        </div>


        {/* Credentials Share Explain Box */}
        <div className="bg-blue-50/30 dark:bg-blue-950/15 border border-blue-150/40 p-5 rounded-md flex flex-col gap-3 text-xs leading-relaxed font-semibold text-zinc-650 dark:text-blue-400/90 shadow-sm">
          <div className="flex gap-3">
            <i className="pi pi-info-circle text-blue-500 text-base mt-0.5"></i>
            <div>
              <p className="font-extrabold uppercase tracking-wider text-[10px] text-blue-600 dark:text-blue-400 mb-1">Multi-Tenant Routing Mechanics</p>
              <p>
                Every school in the SaaS platform runs on its own secure, sandboxed subdomain (e.g. <code>https://{activeTenant?.subdomain || 'school'}{baseDomain}</code>). 
                When students, parents, or staff log in on this specific domain, they are automatically resolved to the correct school context. Under the hood, user emails are unique per school (<code>@@unique([email, tenantId])</code>), allowing parents with children across different schools to have completely isolated landing environments!
              </p>
            </div>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-md p-4 shadow-sm w-full">
          <i className="pi pi-search text-zinc-400 pl-1"></i>
          <InputText
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users globally by name, email, phone or admission/employee code..."
            className="border-0 bg-transparent text-sm w-full outline-none focus:ring-0 pl-1"
          />
        </div>

        {/* Unified Tab Cockpit */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-md p-5 shadow-sm">
          <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)} className="custom-premium-tabs">
            
            {/* Staff / Teachers Tab */}
            <TabPanel header="Staff & Faculty" leftIcon="pi pi-briefcase mr-2">
              <DataTable
                value={filterList(staffList)}
                loading={loading}
                className="p-datatable-sm mt-3"
                paginator rows={10}
                emptyMessage="No staff records match your search."
                stripedRows
              >
                <Column field="empIdOrAdmNo" header="Employee ID" className="font-mono text-xs font-bold" />
                <Column field="name" header="Name" className="font-bold text-zinc-800 dark:text-zinc-150" />
                <Column field="email" header="Email Username" />
                <Column field="phone" header="Contact Phone" />
                <Column field="role" header="Role Badge" body={(d) => <Tag value={d.role} severity="info" className="font-bold" />} />
                <Column header="Credential Actions" body={actionsTemplate} align="center" />
              </DataTable>
            </TabPanel>

            {/* Students Tab */}
            <TabPanel header="Students" leftIcon="pi pi-graduation-cap mr-2">
              <DataTable
                value={filterList(mappedStudents)}
                loading={loadingStudents}
                className="p-datatable-sm mt-3"
                paginator rows={10}
                emptyMessage="No student records match your search."
                stripedRows
              >
                <Column field="empIdOrAdmNo" header="Admission No" className="font-mono text-xs font-bold" />
                <Column field="name" header="Name" className="font-bold text-zinc-800 dark:text-zinc-150" />
                <Column field="email" header="Assigned Username" className="text-xs text-blue-500" />
                <Column field="parentLinked" header="Linked Guardian" />
                <Column header="Status" body={(d) => <Tag value={d.isActive ? 'ACTIVE' : 'INACTIVE'} severity={d.isActive ? 'success' : 'warning'} className="font-bold text-[9px]" />} />
                <Column header="Credential Actions" body={actionsTemplate} align="center" />
              </DataTable>
            </TabPanel>

            {/* Parents Tab */}
            <TabPanel header="Parents / Guardians" leftIcon="pi pi-users mr-2">
              <DataTable
                value={filterList(parentsList)}
                loading={loading}
                className="p-datatable-sm mt-3"
                paginator rows={10}
                emptyMessage="No parent records match your search."
                stripedRows
              >
                <Column field="name" header="Parent Name" className="font-bold text-zinc-800 dark:text-zinc-150" />
                <Column field="email" header="Parent Username" />
                <Column field="phone" header="WhatsApp Phone" />
                <Column field="parentLinked" header="Associated Ward(s)" className="text-xs text-zinc-500 font-semibold" />
                <Column header="Credential Actions" body={actionsTemplate} align="center" />
              </DataTable>
            </TabPanel>

          </TabView>
        </div>

      </div>
    </DashboardLayout>
  );
}
