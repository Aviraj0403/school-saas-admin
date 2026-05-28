import { Role } from '@/store/useAuthStore';
import { PrimeIcons } from 'primereact/api';

export interface NavItem {
  label: string;
  icon: string;
  path: string;
  module?: string; // Corresponds to TenantContext.activeModules
  roles?: Role[]; // If undefined, available to all roles that have the module
  children?: NavItem[];
}

export const navigationConfig: NavItem[] = [
  {
    label: 'Dashboard',
    icon: PrimeIcons.HOME,
    path: '/dashboard',
  },
  {
    label: 'Students & Academics',
    icon: PrimeIcons.USERS,
    path: '/students',
    children: [
      { label: 'All Students', icon: PrimeIcons.LIST, path: '/students', module: 'student' },
      { label: 'New Admission', icon: PrimeIcons.USER_PLUS, path: '/students/admissions', module: 'student' },
      { label: 'Attendance logs', icon: PrimeIcons.CHECK_SQUARE, path: '/attendance', module: 'attendance' },
      { label: 'Classes & Subjects', icon: PrimeIcons.SITEMAP, path: '/academics/classes', module: 'academics' },
      { label: 'Timetable Schedule', icon: PrimeIcons.CALENDAR, path: '/academics/timetable', module: 'academics' },
      { label: 'Exams & Results', icon: PrimeIcons.PENCIL, path: '/exams', module: 'exams' },
      { label: 'Library Catalog', icon: PrimeIcons.BOOKMARK, path: '/library', module: 'library' },
    ],
  },
  {
    label: 'Staff & Operations',
    icon: PrimeIcons.ID_CARD,
    path: '/staff',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Accountant'],
    children: [
      { label: 'Staff Directory', icon: PrimeIcons.LIST, path: '/staff', module: 'staff', roles: ['SuperAdmin', 'Principal', 'school_admin'] },
      { label: 'Leave Applications', icon: PrimeIcons.CALENDAR_MINUS, path: '/leave', module: 'leave' },
      { label: 'School Transport', icon: PrimeIcons.CAR, path: '/transport', module: 'transport' },
      { label: 'Hostel Rooms', icon: PrimeIcons.HOME, path: '/hostel', module: 'hostel' },
      { label: 'Fee Collections', icon: PrimeIcons.MONEY_BILL, path: '/fee', module: 'fee', roles: ['SuperAdmin', 'Principal', 'Accountant', 'school_admin'] },
    ],
  },
  {
    label: 'Communications',
    icon: PrimeIcons.SEND,
    path: '/communication',
    module: 'communication',
    children: [
      { label: 'Announcements', icon: PrimeIcons.BELL, path: '/communication', module: 'communication' },
      { label: 'WhatsApp Chatbot', icon: PrimeIcons.WHATSAPP, path: '/whatsapp', module: 'whatsapp', roles: ['SuperAdmin', 'Principal', 'school_admin'] },
    ],
  },
  {
    label: 'Analytics Insights',
    icon: PrimeIcons.CHART_BAR,
    path: '/analytics',
    module: 'analytics',
    roles: ['SuperAdmin', 'Principal', 'Accountant', 'school_admin'],
  },
  {
    label: 'Super Admin Control',
    icon: PrimeIcons.SHIELD,
    path: '/superadmin',
    roles: ['SuperAdmin'],
    children: [
      { label: 'Tenant Schools', icon: PrimeIcons.BUILDING, path: '/superadmin/tenants' },
      { label: 'SaaS Plans', icon: PrimeIcons.STAR, path: '/superadmin/plans' },
    ],
  },
  {
    label: 'Settings',
    icon: PrimeIcons.COG,
    path: '/settings',
    module: 'settings',
    roles: ['SuperAdmin', 'Principal', 'school_admin'],
  },
];

