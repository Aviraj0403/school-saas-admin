'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/useAuthStore';
import { useStudentsList } from '@/hooks/queries/useStudents';
import { api } from '@/services/api';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Users,
  Search,
  Eye,
  Copy,
  MessageSquare,
  Info,
} from 'lucide-react';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role:
    | 'SuperAdmin'
    | 'Principal'
    | 'Teacher'
    | 'Accountant'
    | 'school_admin'
    | 'Student'
    | 'Parent'
    | string;
  isActive: boolean;
  empIdOrAdmNo?: string;
  parentLinked?: string;
}

export default function UsersRegistryPage() {
  const { activeTenant, mirrorUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'staff' | 'students' | 'parents'>('staff');
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
    toast.warning(`Mirror Mode Active: Mirroring profile for ${userObj.name} (${userObj.role})`);
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

  const { data: studentsData, isPending: loadingStudents } = useStudentsList(1, 100);
  const rawStudents = studentsData?.items || studentsData?.data?.items || [];

  const mappedStudents: SystemUser[] = rawStudents.map((s: any) => ({
    id: s.id,
    name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
    email:
      s.email ||
      `student.${(s.admissionNo || '').toLowerCase().replace(/[^a-z0-9]/g, '-')}@${activeTenant?.subdomain || 'school'}.com`,
    phone: s.phone || 'N/A',
    role: 'Student',
    isActive: s.status === 'ACTIVE',
    empIdOrAdmNo: s.admissionNo,
    parentLinked: s.parentName || 'N/A',
  }));

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [staffRes, parentRes] = await Promise.all([api.get('/staff'), api.get('/parents')]);

      if (staffRes.data?.success) {
        const mappedStaff = staffRes.data.data.map((s: any) => ({
          id: s.id,
          name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
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
          name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
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
    toast.success(`Credentials copied to clipboard for ${userObj.name}.`);
  };

  const handleShareWhatsApp = (userObj: SystemUser) => {
    const defaultPass =
      userObj.role === 'Student'
        ? 'Student@123'
        : userObj.role === 'Parent'
          ? 'Parent@123'
          : 'School@123';
    const message = `Hello ${userObj.name},\n\nWelcome to ${activeTenant?.name || 'our school'}.\nYour portal access is ready.\n\n🌐 Login: ${schoolLoginUrl}\n📧 Email: ${userObj.email}\n🔑 Temp Password: ${defaultPass}`;
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

  const filteredStaff = filterList(staffList);
  const filteredStudents = filterList(mappedStudents);
  const filteredParents = filterList(parentsList);

  return (
    <DashboardLayout>
      <PageBreadcrumb title="User & Staff Management" />
      <div className="flex flex-col gap-6 pb-12 animate-fade-in">
        {/* Executive Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950 border border-zinc-800 p-6 md:p-8 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-400/30 rounded-full flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Access Governance
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
                mirroring or dispatch credentials via WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* Identity & Account KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Faculty & Staff
              </span>
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
                {staffList.length} Accounts
              </div>
            </div>
            <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Enrolled Students
              </span>
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
                {mappedStudents.length} Accounts
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Registered Parents
              </span>
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
                {parentsList.length} Accounts
              </div>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Multi-Tenant Subdomain Routing Banner */}
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block uppercase tracking-wider text-[10px] mb-0.5">
              Multi-Tenant Subdomain Isolation
            </span>
            Users authenticate through secure tenant subdomains (e.g.,{' '}
            <code className="font-mono">
              https://{activeTenant?.subdomain || 'demo'}
              {baseDomain}
            </code>
            ). Parent accounts with wards in multiple schools map safely with isolated landing
            views.
          </div>
        </div>

        {/* Main Data Registry Card */}
        <div className="rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl p-6 shadow-sm space-y-5">
          {/* Search & Tabs Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-4">
            <div className="flex p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 gap-1 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('staff')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'staff'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" /> Staff & Faculty ({filteredStaff.length})
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'students'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" /> Students ({filteredStudents.length})
              </button>
              <button
                onClick={() => setActiveTab('parents')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'parents'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Parents ({filteredParents.length})
              </button>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, email, phone, ID..."
                className="pl-9 text-xs"
              />
            </div>
          </div>

          {/* Tab Content: Staff */}
          {activeTab === 'staff' && (
            <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                  <tr>
                    <th className="px-4 py-3">Employee ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email Username</th>
                    <th className="px-4 py-3">Contact Phone</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                        <p className="text-xs">Loading staff registry...</p>
                      </td>
                    </tr>
                  ) : filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-zinc-400">
                        No staff records found.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-4 py-3 font-mono font-bold text-brand">
                          {u.empIdOrAdmNo}
                        </td>
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          {u.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-500">{u.email}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{u.phone}</td>
                        <td className="px-4 py-3">
                          <Badge variant="info">{u.role}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              onClick={() => handleMirrorUser(u)}
                              title="Mirror User (Impersonate)"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleCopyCredentials(u)}
                              title="Copy Credentials"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleShareWhatsApp(u)}
                              title="Share via WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab Content: Students */}
          {activeTab === 'students' && (
            <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                  <tr>
                    <th className="px-4 py-3">Admission No</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Assigned Username</th>
                    <th className="px-4 py-3">Linked Guardian</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                  {loadingStudents ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                        <p className="text-xs">Loading students...</p>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-zinc-400">
                        No student records found.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-4 py-3 font-mono font-bold text-blue-500">
                          {u.empIdOrAdmNo}
                        </td>
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          {u.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-500">{u.email}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                          {u.parentLinked}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={u.isActive ? 'success' : 'warning'}>
                            {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              onClick={() => handleMirrorUser(u)}
                              title="Mirror User (Impersonate)"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleCopyCredentials(u)}
                              title="Copy Credentials"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleShareWhatsApp(u)}
                              title="Share via WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab Content: Parents */}
          {activeTab === 'parents' && (
            <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                  <tr>
                    <th className="px-4 py-3">Parent Name</th>
                    <th className="px-4 py-3">Username Email</th>
                    <th className="px-4 py-3">WhatsApp Phone</th>
                    <th className="px-4 py-3">Associated Ward(s)</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                        <p className="text-xs">Loading parent accounts...</p>
                      </td>
                    </tr>
                  ) : filteredParents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-zinc-400">
                        No parent records found.
                      </td>
                    </tr>
                  ) : (
                    filteredParents.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          {u.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-500">{u.email}</td>
                        <td className="px-4 py-3 font-mono text-emerald-500">{u.phone}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                          {u.parentLinked}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              onClick={() => handleMirrorUser(u)}
                              title="Mirror User (Impersonate)"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleCopyCredentials(u)}
                              title="Copy Credentials"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleShareWhatsApp(u)}
                              title="Share via WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
