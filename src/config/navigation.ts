import { Role } from '@/store/useAuthStore';

export interface NavItem {
  label: string;
  icon?: string;
  path?: string;
  module?: string; // Corresponds to TenantContext.activeModule
  roles?: Role[]; // If undefined, available to all roles that have the module
  children?: NavItem[];
  isSection?: boolean; // For grouping headers
}

/**
 * Role names in this file are display names ('Teacher', 'Parent', 'Accountant')
 * but `activeUser.role` holds the backend role *slug* — 'teacher', 'parent',
 * 'accountant' (useAuthStore reads `roles[0].slug` straight from the login
 * response). String equality between the two never held, so every nav entry
 * that did not also list 'school_admin' or 'SuperAdmin' was invisible to the
 * exact role it was written for. Matching therefore normalizes both sides.
 *
 * 'Principal' and 'Warden' are not roles the backend has. TenantService
 * .createDefaultRoles seeds precisely six: school_admin, teacher, accountant,
 * librarian, parent, student. Both are aliased to school_admin, which is what
 * the seed data itself does — its "Principal" staff member is created with
 * roleSlug 'school_admin' — and it is what makes the hostel warden pages
 * reachable at all. If either ever becomes a real seeded role, delete its alias
 * here and the entries start resolving on their own.
 */
const ROLE_ALIASES: Record<string, string> = {
  principal: 'school_admin',
  warden: 'school_admin',
  admin: 'school_admin',
  schooladmin: 'school_admin',
};

export function normalizeRole(role: string): string {
  const key = role
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  return ROLE_ALIASES[key] ?? ROLE_ALIASES[key.replace(/_/g, '')] ?? key;
}

/** An item with no `roles` is open to every role that has the module. */
export function canAccessNav(itemRoles: Role[] | undefined, userRole: string): boolean {
  if (!itemRoles || itemRoles.length === 0) return true;
  const mine = normalizeRole(userRole);
  return itemRoles.some((r) => normalizeRole(r) === mine);
}

export const navigationConfig: NavItem[] = [
  {
    label: 'Overview',
    isSection: true,
  },
  {
    label: 'Dashboard',
    icon: 'Home',
    path: '/dashboard',
  },
  {
    label: 'System Admin Registry',
    isSection: true,
    roles: ['SuperAdmin'],
  },
  {
    label: 'SaaS Control Plane',
    icon: 'Shield',
    path: '/superadmin',
    roles: ['SuperAdmin'],
    children: [
      { label: 'Global Users', icon: 'Users', path: '/users', roles: ['SuperAdmin'] },
      {
        label: 'Tenant Schools',
        icon: 'Building',
        path: '/superadmin/tenants',
        roles: ['SuperAdmin'],
      },
      {
        label: 'Tenant Roadmap',
        icon: 'Compass',
        path: '/superadmin/roadmap',
        roles: ['SuperAdmin'],
      },
      {
        label: 'SaaS Plans',
        icon: 'Star',
        path: '/superadmin/plans',
        roles: ['SuperAdmin'],
      },
      {
        label: 'Observability',
        icon: 'TrendingUp',
        path: '/superadmin/observability',
        roles: ['SuperAdmin'],
      },
    ],
  },
  {
    label: 'School Setup (Steps 1-6)',
    isSection: true,
    roles: ['SuperAdmin', 'Principal', 'school_admin'],
  },
  {
    label: '1. Academic Years',
    icon: 'Calendar',
    path: '/academics/terms',
    module: 'academics',
    roles: ['SuperAdmin', 'Principal', 'school_admin'],
  },
  {
    label: '2. Staff & Teachers',
    icon: 'Users',
    path: '/staff/directory',
    module: 'staff',
    roles: ['SuperAdmin', 'Principal', 'school_admin'],
  },
  {
    label: '3. Classes & Sections',
    icon: 'Home',
    path: '/academics/classes',
    module: 'academics',
    roles: ['SuperAdmin', 'Principal', 'school_admin'],
  },
  {
    label: '4. Student Admission',
    icon: 'UserPlus',
    path: '/students/admissions',
    module: 'student',
    roles: ['SuperAdmin', 'Principal', 'school_admin'],
  },
  {
    label: '5. Fee Slabs & Invoices',
    icon: 'Ticket',
    path: '/fee/slabs',
    module: 'fee',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Accountant'],
  },
  {
    label: '6. Setup & Integrations',
    icon: 'Link',
    path: '/settings/integrations',
    module: 'core',
    roles: ['SuperAdmin', 'Principal', 'school_admin'],
  },
  {
    label: 'School Directories',
    isSection: true,
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher'],
  },
  {
    label: 'Student Directory',
    icon: 'IdCard',
    path: '/students',
    module: 'student',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher'],
  },
  {
    label: 'Student Documents',
    icon: 'Folder',
    path: '/students/documents',
    module: 'student',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher'],
  },
  {
    label: 'Staff Attendance',
    icon: 'CheckCircle',
    path: '/staff/attendance',
    module: 'staff',
    roles: ['SuperAdmin', 'Principal', 'school_admin'],
  },
  {
    label: 'Biometric Devices',
    icon: 'Server',
    path: '/attendance/devices',
    module: 'attendance',
    roles: ['SuperAdmin', 'Principal', 'school_admin'],
  },
  {
    label: 'Academics & Learning',
    isSection: true,
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student', 'Parent'],
  },
  {
    label: 'Attendance Tracker',
    icon: 'CheckSquare',
    path: '/attendance',
    module: 'attendance',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student', 'Parent'],
  },
  {
    label: 'Class Timetable',
    icon: 'Clock',
    path: '/academics/timetable',
    module: 'academics',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student', 'Parent'],
  },
  {
    label: 'Lesson Planning',
    icon: 'FileEdit',
    path: '/academics/lesson-plans',
    module: 'academics',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher'],
  },
  {
    label: 'Assignments & Homework',
    icon: 'Upload',
    path: '/assignments',
    module: 'homework',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student'],
  },
  {
    label: 'Exams & Results',
    icon: 'Pencil',
    path: '/exams',
    module: 'exam',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student', 'Parent'],
  },
  {
    label: 'Exam Reports',
    icon: 'BarChart3',
    path: '/exams/reports',
    module: 'exam',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher'],
  },
  {
    label: 'Online Classes',
    icon: 'Video',
    path: '/academics/online-classes',
    module: 'academics',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student'],
  },
  {
    label: 'LMS Quizzes',
    icon: 'HelpCircle',
    path: '/academics/quizzes',
    module: 'academics',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student'],
  },
  {
    label: 'Finance & HR',
    isSection: true,
    roles: ['SuperAdmin', 'Principal', 'Accountant', 'school_admin', 'Parent', 'Student'],
  },
  {
    label: 'Fee Payments',
    icon: 'Ticket',
    path: '/fee/slabs',
    module: 'fee',
    roles: ['Parent', 'Student'],
  },
  {
    label: 'Online Collections',
    icon: 'CreditCard',
    path: '/fee/ledgers',
    module: 'fee',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Accountant'],
  },
  {
    label: 'Leave Applications',
    icon: 'CalendarMinus',
    path: '/leave',
    module: 'leave',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher'],
  },
  {
    label: 'Payroll & Salary',
    icon: 'DollarSign',
    path: '/fee/payroll',
    module: 'hr_payroll',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Accountant'],
  },
  {
    label: 'Operations & Outreach',
    isSection: true,
    roles: [
      'SuperAdmin',
      'Principal',
      'school_admin',
      'Teacher',
      'Student',
      'Parent',
      'Warden',
      'Librarian',
    ],
  },
  {
    label: 'Library Management',
    icon: 'BookOpen',
    path: '/library',
    module: 'library',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Librarian', 'Teacher', 'Student'],
    children: [
      {
        label: 'All Books',
        icon: 'Bookmark',
        path: '/library/books',
        module: 'library',
        roles: ['SuperAdmin', 'Principal', 'school_admin', 'Librarian', 'Teacher', 'Student'],
      },
      {
        label: 'Book Issue',
        icon: 'RotateCcw',
        path: '/library/issues',
        module: 'library',
        roles: ['SuperAdmin', 'Principal', 'school_admin', 'Librarian'],
      },
      {
        label: 'Fine Collections',
        icon: 'DollarSign',
        path: '/library/fines',
        module: 'library',
        roles: ['SuperAdmin', 'Principal', 'school_admin', 'Librarian', 'Accountant'],
      },
    ],
  },
  {
    label: 'Transport Management',
    icon: 'Bus',
    path: '/transport',
    module: 'transport',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student', 'Parent'],
    children: [
      {
        label: 'Vehicle Directory',
        icon: 'Bus',
        path: '/transport/vehicles',
        module: 'transport',
        roles: ['SuperAdmin', 'Principal', 'school_admin'],
      },
      {
        label: 'Routes & Stops',
        icon: 'MapPin',
        path: '/transport/routes',
        module: 'transport',
        roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student', 'Parent'],
      },
    ],
  },
  {
    label: 'Hostel Management',
    icon: 'Building2',
    path: '/hostel',
    module: 'hostel',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Warden', 'Student'],
    children: [
      {
        label: 'Hostel Rooms',
        icon: 'Home',
        path: '/hostel/rooms',
        module: 'hostel',
        roles: ['SuperAdmin', 'Principal', 'school_admin', 'Warden'],
      },
      {
        label: 'Room Allocations',
        icon: 'Key',
        path: '/hostel/allocations',
        module: 'hostel',
        roles: ['SuperAdmin', 'Principal', 'school_admin', 'Warden', 'Student'],
      },
    ],
  },
  {
    label: 'Announcements',
    icon: 'Bell',
    path: '/communication',
    module: 'communication',
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Teacher', 'Student', 'Parent'],
  },
  {
    label: 'WhatsApp Business',
    icon: 'MessageSquare',
    path: '/whatsapp',
    module: 'whatsapp',
    roles: ['SuperAdmin', 'Principal', 'school_admin'],
  },
  {
    label: 'Website CMS',
    icon: 'Globe',
    path: '/website',
    module: 'website',
    roles: ['SuperAdmin', 'Principal', 'school_admin'],
    children: [
      {
        label: 'Homepage Banners',
        icon: 'Image',
        path: '/website/banners',
        module: 'website',
        roles: ['SuperAdmin', 'Principal', 'school_admin'],
      },
      {
        label: 'Download Center',
        icon: 'Download',
        path: '/website/downloads',
        module: 'website',
        roles: ['SuperAdmin', 'Principal', 'school_admin'],
      },
      {
        label: 'Admission Inquiries',
        icon: 'Mail',
        path: '/website/inquiries',
        module: 'website',
        roles: ['SuperAdmin', 'Principal', 'school_admin'],
      },
      {
        label: 'Pages & Gallery',
        icon: 'Pencil',
        path: '/website/content',
        module: 'website',
        roles: ['SuperAdmin', 'Principal', 'school_admin'],
      },
    ],
  },
  {
    label: 'Settings & Analytics',
    isSection: true,
    roles: ['SuperAdmin', 'Principal', 'school_admin', 'Accountant'],
  },
  {
    label: 'System Analytics',
    icon: 'BarChart3',
    path: '/analytics',
    module: 'analytics',
    roles: ['SuperAdmin', 'Principal', 'Accountant', 'school_admin'],
  },
  {
    label: 'Roles & Permissions',
    icon: 'Key',
    path: '/settings/roles',
    module: 'core',
    roles: ['SuperAdmin', 'Principal', 'school_admin'],
  },
  {
    label: 'Platform Settings',
    icon: 'Settings',
    path: '/settings',
    module: 'core',
    roles: ['SuperAdmin', 'Principal', 'school_admin'],
  },
];
