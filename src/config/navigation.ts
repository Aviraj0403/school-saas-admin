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
    module: 'dashboard',
  },
  {
    label: 'Students',
    icon: PrimeIcons.USERS,
    path: '/students',
    module: 'students',
    children: [
      { label: 'All Students', icon: PrimeIcons.LIST, path: '/students' },
      { label: 'Admissions', icon: PrimeIcons.USER_PLUS, path: '/students/admissions' },
    ]
  },
  {
    label: 'Staff & Roles',
    icon: PrimeIcons.ID_CARD,
    path: '/staff',
    module: 'staff',
    roles: ['SuperAdmin', 'Principal']
  },
  {
    label: 'Academics',
    icon: PrimeIcons.BOOK,
    path: '/academics',
    module: 'academics',
    children: [
      { label: 'Classes & Subjects', icon: PrimeIcons.SITEMAP, path: '/academics/classes' },
      { label: 'Timetable', icon: PrimeIcons.CALENDAR, path: '/academics/timetable' },
    ]
  },
  {
    label: 'Attendance',
    icon: PrimeIcons.CHECK_SQUARE,
    path: '/attendance',
    module: 'attendance',
  },
  {
    label: 'Fee Management',
    icon: PrimeIcons.MONEY_BILL,
    path: '/fee',
    module: 'fee',
    roles: ['SuperAdmin', 'Principal', 'Accountant']
  },
  {
    label: 'Exams & Results',
    icon: PrimeIcons.PENCIL,
    path: '/exams',
    module: 'exams',
  },
  {
    label: 'Library',
    icon: PrimeIcons.BOOKMARK,
    path: '/library',
    module: 'library',
  },
  {
    label: 'Communication',
    icon: PrimeIcons.SEND,
    path: '/communication',
    module: 'communication',
  },
  {
    label: 'Analytics',
    icon: PrimeIcons.CHART_BAR,
    path: '/analytics',
    module: 'analytics',
    roles: ['SuperAdmin', 'Principal', 'Accountant']
  },
  {
    label: 'WhatsApp Bot',
    icon: PrimeIcons.WHATSAPP,
    path: '/whatsapp',
    module: 'whatsapp',
    roles: ['SuperAdmin', 'Principal']
  },
  {
    label: 'Super Admin',
    icon: PrimeIcons.SHIELD,
    path: '/superadmin',
    roles: ['SuperAdmin'],
    children: [
      { label: 'Tenant Schools', icon: PrimeIcons.BUILDING, path: '/superadmin/tenants' },
      { label: 'SaaS Plans', icon: PrimeIcons.STAR, path: '/superadmin/plans' },
    ]
  },
  {
    label: 'Hostel Management',
    icon: PrimeIcons.HOME,
    path: '/hostel',
    module: 'hostel',
    roles: ['SuperAdmin', 'Principal']
  },
  {
    label: 'Leave Management',
    icon: PrimeIcons.CALENDAR_MINUS,
    path: '/leave',
    module: 'leave',
  },
  {
    label: 'Settings',
    icon: PrimeIcons.COG,
    path: '/settings',
    module: 'settings',
    roles: ['SuperAdmin', 'Principal']
  }
];
