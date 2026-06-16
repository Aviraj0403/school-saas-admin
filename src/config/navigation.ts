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
    label: 'Academics',
    icon: PrimeIcons.BOOK,
    path: '/academics',
    module: 'academics',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student', 'Parent'],
    children: [
      { label: 'Academic Years', icon: PrimeIcons.CALENDAR, path: '/academics/terms', module: 'academics', roles: ['SuperAdmin', 'Principal', 'school_admin'] },
      { label: 'Departments', icon: PrimeIcons.SITEMAP, path: '/academics/departments', module: 'academics', roles: ['SuperAdmin', 'Principal', 'school_admin'] },
      { label: 'Subjects', icon: PrimeIcons.BOOK, path: '/academics/subjects', module: 'academics', roles: ['SuperAdmin', 'Principal', 'school_admin'] },
      { label: 'Classes & Sections', icon: PrimeIcons.HOME, path: '/academics/classes', module: 'academics', roles: ['SuperAdmin', 'Principal', 'school_admin'] },
      { label: 'Lesson Planning', icon: 'pi pi-file-edit', path: '/academics/lesson-plans', module: 'academics', roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher'] },
      { label: 'LMS Quizzes', icon: PrimeIcons.QUESTION_CIRCLE, path: '/academics/quizzes', module: 'academics', roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student'] },
      { label: 'Class Timetable', icon: PrimeIcons.CLOCK, path: '/academics/timetable', module: 'academics', roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student', 'Parent'] },
      { label: 'Online Classes', icon: PrimeIcons.VIDEO, path: '/academics/online-classes', module: 'academics', roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student'] },
    ],
  },
  {
    label: 'Students',
    icon: PrimeIcons.USERS,
    path: '/students',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student', 'Parent'],
    children: [
      { label: 'New Admission', icon: PrimeIcons.USER_PLUS, path: '/students/admissions', module: 'student', roles: ['SuperAdmin', 'Principal', 'school_admin'] },
      { label: 'Student Directory', icon: PrimeIcons.ID_CARD, path: '/students', module: 'student', roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher'] },
      { label: 'Attendance', icon: PrimeIcons.CHECK_SQUARE, path: '/attendance', module: 'attendance', roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student', 'Parent'] },
      { label: 'Assignments', icon: PrimeIcons.UPLOAD, path: '/assignments', module: 'homework', roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student'] },
      { label: 'Exams & Results', icon: PrimeIcons.PENCIL, path: '/exams', module: 'exam', roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student', 'Parent'] },
    ],
  },
  {
    label: 'Staff & HR',
    icon: PrimeIcons.BRIEFCASE,
    path: '/hr',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Accountant', 'Teacher'],
    children: [
      { label: 'Staff Directory', icon: PrimeIcons.USERS, path: '/staff/directory', module: 'staff', roles: ['SuperAdmin', 'Principal', 'school_admin'] },
      { label: 'Leave Applications', icon: PrimeIcons.CALENDAR_MINUS, path: '/leave', module: 'leave', roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher'] },
      { label: 'Payroll & Salary', icon: PrimeIcons.MONEY_BILL, path: '/fee/payroll', module: 'hr-payroll', roles: ['SuperAdmin', 'Principal', 'school_admin', 'Accountant'] },
    ],
  },
  {
    label: 'Finance',
    icon: PrimeIcons.DOLLAR,
    path: '/fee',
    module: 'fee',
    roles: ['SuperAdmin', 'Principal', 'Accountant', 'school_admin', 'Parent', 'Student'],
    children: [
      { label: 'Fee Invoices', icon: PrimeIcons.TICKET, path: '/fee/slabs', module: 'fee', roles: ['SuperAdmin', 'Principal', 'school_admin', 'Accountant', 'Parent', 'Student'] },
      { label: 'Online Collections', icon: PrimeIcons.CREDIT_CARD, path: '/fee/ledgers', module: 'fee', roles: ['SuperAdmin', 'Principal', 'school_admin', 'Accountant'] },
    ],
  },
  {
    label: 'Library',
    icon: PrimeIcons.BOOK,
    path: '/library',
    module: 'library',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student'],
    children: [
      { label: 'All Books', icon: PrimeIcons.BOOKMARK, path: '/library/books', module: 'library', roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student'] },
      { label: 'Book Issue', icon: PrimeIcons.REPLAY, path: '/library/issues', module: 'library', roles: ['SuperAdmin', 'Principal', 'school_admin'] },
      { label: 'Fine Collections', icon: PrimeIcons.DOLLAR, path: '/library/fines', module: 'library', roles: ['SuperAdmin', 'Principal', 'school_admin', 'Accountant'] },
    ],
  },
  {
    label: 'Transport',
    icon: PrimeIcons.CAR,
    path: '/transport',
    module: 'transport',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student', 'Parent'],
    children: [
      { label: 'Vehicle Directory', icon: PrimeIcons.CAR, path: '/transport/vehicles', module: 'transport', roles: ['SuperAdmin', 'Principal', 'school_admin'] },
      { label: 'Routes & Stops', icon: PrimeIcons.MAP_MARKER, path: '/transport/routes', module: 'transport', roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student', 'Parent'] },
    ],
  },
  {
    label: 'Hostel',
    icon: PrimeIcons.BUILDING,
    path: '/hostel',
    module: 'hostel',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Warden', 'Student'],
    children: [
      { label: 'Hostel Rooms', icon: PrimeIcons.HOME, path: '/hostel/rooms', module: 'hostel', roles: ['SuperAdmin', 'Principal', 'school_admin', 'Warden'] },
      { label: 'Room Allocations', icon: PrimeIcons.KEY, path: '/hostel/allocations', module: 'hostel', roles: ['SuperAdmin', 'Principal', 'school_admin', 'Warden', 'Student'] },
    ],
  },
  {
    label: 'Communication',
    icon: PrimeIcons.SEND,
    path: '/communication',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student', 'Parent'],
    children: [
      { label: 'Announcements', icon: PrimeIcons.BELL, path: '/communication', module: 'communication', roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student', 'Parent'] },
      { label: 'WhatsApp', icon: PrimeIcons.WHATSAPP, path: '/whatsapp', module: 'whatsapp', roles: ['SuperAdmin', 'Principal', 'school_admin'] },
    ],
  },
  {
    label: 'Analytics',
    icon: PrimeIcons.CHART_BAR,
    path: '/analytics',
    module: 'analytics',
    roles: ['SuperAdmin', 'Principal', 'Accountant', 'school_admin'],
  },
  {
    label: 'Website CMS',
    icon: PrimeIcons.DESKTOP,
    path: '/website',
    module: 'website',
    roles: ['SuperAdmin', 'Principal', 'school_admin'],
    children: [
      { label: 'Homepage Banners', icon: PrimeIcons.IMAGES, path: '/website/banners', module: 'website', roles: ['SuperAdmin', 'Principal', 'school_admin'] },
      { label: 'Download Center', icon: PrimeIcons.DOWNLOAD, path: '/website/downloads', module: 'website', roles: ['SuperAdmin', 'Principal', 'school_admin'] },
      { label: 'Admission Inquiries', icon: PrimeIcons.ENVELOPE, path: '/website/inquiries', module: 'website', roles: ['SuperAdmin', 'Principal', 'school_admin'] },
    ],
  },
  {
    label: 'Settings',
    icon: PrimeIcons.COG,
    path: '/settings',
    module: 'core',
    roles: ['SuperAdmin', 'Principal', 'school_admin'],
  },
  {
    label: 'System Admin',
    icon: PrimeIcons.SHIELD,
    path: '/superadmin',
    roles: ['SuperAdmin'],
    children: [
      { label: 'Global Users', icon: PrimeIcons.USERS, path: '/users', roles: ['SuperAdmin'] },
      { label: 'Tenant Schools', icon: PrimeIcons.BUILDING, path: '/superadmin/tenants', roles: ['SuperAdmin'] },
      { label: 'Tenant Roadmap', icon: PrimeIcons.COMPASS, path: '/superadmin/roadmap', roles: ['SuperAdmin'] },
      { label: 'SaaS Plans', icon: PrimeIcons.STAR, path: '/superadmin/plans', roles: ['SuperAdmin'] },
    ],
  },
];
