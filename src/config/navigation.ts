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
    label: 'Academic Control',
    icon: PrimeIcons.BOOK,
    path: '/academics/classes',
    roles: ['SuperAdmin', 'Principal', 'school_admin'],
    children: [
      { label: 'Classes & Syllabus', icon: PrimeIcons.HOME, path: '/academics/classes', module: 'academics' },
      { label: 'Academic Departments', icon: PrimeIcons.SITEMAP, path: '/academics/departments', module: 'academics' },
      { label: 'Academic Years & Terms', icon: PrimeIcons.CALENDAR, path: '/academics/terms', module: 'academics' },
    ],
  },
  {
    label: 'Student Portal',
    icon: PrimeIcons.USER,
    path: '/students',
    children: [
      { label: 'All Students', icon: PrimeIcons.USERS, path: '/students', module: 'student' },
      { label: 'New Admission', icon: PrimeIcons.USER_PLUS, path: '/students/admissions', module: 'student' },
      { label: 'Attendance logs', icon: PrimeIcons.CHECK_SQUARE, path: '/attendance', module: 'attendance' },
      { label: 'Assignments & Homework', icon: PrimeIcons.UPLOAD, path: '/assignments', module: 'homework' },
      { label: 'Exams & Results', icon: PrimeIcons.PENCIL, path: '/exams', module: 'exams' },
    ],
  },
  {
    label: 'Teacher Console',
    icon: PrimeIcons.ID_CARD,
    path: '/staff',
    roles: ['SuperAdmin', 'Principal', 'school_admin'],
    children: [
      { label: 'Teacher Directory', icon: PrimeIcons.LIST, path: '/staff/directory', module: 'staff' },
      { label: 'Leave Applications', icon: PrimeIcons.CALENDAR_MINUS, path: '/leave', module: 'leave' },
      { label: 'HR Payroll & Salary', icon: PrimeIcons.MONEY_BILL, path: '/fee/payroll', module: 'staff' },
    ],
  },
  {
    label: 'Library Catalog',
    icon: PrimeIcons.BOOK,
    path: '/library',
    module: 'library',
    children: [
      { label: 'All Books', icon: PrimeIcons.BOOKMARK, path: '/library/books', module: 'library' },
      { label: 'Book Issue / Returns', icon: PrimeIcons.REPLAY, path: '/library/issues', module: 'library' },
      { label: 'Fine Collections', icon: PrimeIcons.DOLLAR, path: '/library/fines', module: 'library' },
    ],
  },
  {
    label: 'School Transport',
    icon: PrimeIcons.CAR,
    path: '/transport',
    module: 'transport',
    children: [
      { label: 'Vehicle Directory', icon: PrimeIcons.CAR, path: '/transport/vehicles', module: 'transport' },
      { label: 'Bus Routes & Stops', icon: PrimeIcons.MAP_MARKER, path: '/transport/routes', module: 'transport' },
      { label: 'Driver Allocations', icon: PrimeIcons.USER, path: '/transport/vehicles', module: 'transport' },
    ],
  },
  {
    label: 'Hostel Registry',
    icon: PrimeIcons.BUILDING,
    path: '/hostel',
    module: 'hostel',
    children: [
      { label: 'Hostel Rooms', icon: PrimeIcons.HOME, path: '/hostel/rooms', module: 'hostel' },
      { label: 'Room Allocations', icon: PrimeIcons.KEY, path: '/hostel/allocations', module: 'hostel' },
      { label: 'Warden Logbook', icon: PrimeIcons.BOOK, path: '/hostel/wardens', module: 'hostel' },
    ],
  },
  {
    label: 'Financial Console',
    icon: PrimeIcons.MONEY_BILL,
    path: '/fee',
    roles: ['SuperAdmin', 'Principal', 'Accountant', 'school_admin'],
    children: [
      { label: 'Fee Invoices', icon: PrimeIcons.TICKET, path: '/fee/slabs', module: 'fee' },
      { label: 'Online Collections', icon: PrimeIcons.CREDIT_CARD, path: '/fee/ledgers', module: 'fee' },
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
    label: 'Website CMS',
    icon: PrimeIcons.DESKTOP,
    path: '/website',
    module: 'website',
    children: [
      { label: 'Homepage Banners', icon: PrimeIcons.IMAGES, path: '/website/banners', module: 'website' },
      { label: 'Download Center', icon: PrimeIcons.DOWNLOAD, path: '/website/downloads', module: 'website' },
      { label: 'Admission Inquiries', icon: PrimeIcons.ENVELOPE, path: '/website/inquiries', module: 'website' },
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

