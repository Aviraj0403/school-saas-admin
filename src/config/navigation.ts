import { Role } from '@/store/useAuthStore';
import { isModuleActive } from '@/lib/moduleAccess';

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

const ADMIN: Role[] = ['SuperAdmin', 'Principal', 'school_admin'];
/** Every staff login (not parents/students). */
const STAFF: Role[] = [
  ...ADMIN,
  'Teacher',
  'Accountant',
  'Librarian',
  'clerk',
  'lab_assistant',
  'support_staff',
];
const FAMILY: Role[] = ['Parent', 'Student'];

export const navigationConfig: NavItem[] = [
  // ── Platform owner: the control panel comes first ───────────
  { label: 'Platform', isSection: true },
  { label: 'Control Panel', icon: 'LayoutDashboard', path: '/superadmin', roles: ['SuperAdmin'] },
  { label: 'Schools', icon: 'Building', path: '/superadmin/tenants', roles: ['SuperAdmin'] },
  { label: 'Plans & Pricing', icon: 'Star', path: '/superadmin/plans', roles: ['SuperAdmin'] },
  { label: 'Module Catalog', icon: 'Package', path: '/superadmin/modules', roles: ['SuperAdmin'] },
  {
    label: 'Billing & Invoices',
    icon: 'CreditCard',
    path: '/superadmin/billing',
    roles: ['SuperAdmin'],
  },
  { label: 'School Users', icon: 'Users', path: '/users', roles: ['SuperAdmin'] },
  {
    label: 'System Health',
    icon: 'TrendingUp',
    path: '/superadmin/observability',
    roles: ['SuperAdmin'],
  },

  { label: 'Overview', isSection: true },
  {
    label: 'Dashboard',
    icon: 'Home',
    path: '/dashboard',
    // the platform owner lands on the Control Panel instead
    roles: [
      'Principal',
      'school_admin',
      'Teacher',
      'Accountant',
      'Librarian',
      'clerk',
      'lab_assistant',
      'support_staff',
      'Parent',
      'Student',
      'Warden',
    ],
  },

  // ── School setup (admin) ────────────────────────────────────
  { label: 'School Setup (Steps 1-6)', isSection: true, roles: ADMIN },
  {
    label: '1. Academic Years',
    icon: 'Calendar',
    path: '/academics/terms',
    module: 'academics',
    roles: ADMIN,
  },
  {
    label: '2. Staff & Teachers',
    icon: 'Users',
    path: '/staff/directory',
    module: 'staff',
    roles: ADMIN,
  },
  {
    label: '3. Classes & Sections',
    icon: 'Home',
    path: '/academics/classes',
    module: 'academics',
    roles: ADMIN,
  },
  {
    label: '4. Student Admission',
    icon: 'UserPlus',
    path: '/students/admissions',
    module: 'student',
    roles: ADMIN,
  },
  {
    label: '5. Fee Slabs & Invoices',
    icon: 'Ticket',
    path: '/fee/slabs',
    module: 'fee',
    roles: ADMIN,
  },
  {
    label: '6. Setup & Integrations',
    icon: 'Link',
    path: '/settings/integrations',
    module: 'core',
    roles: ADMIN,
  },

  // ── Directories ─────────────────────────────────────────────
  {
    label: 'School Directories',
    isSection: true,
    roles: [...ADMIN, 'Teacher', 'Accountant', 'Librarian', 'clerk', 'lab_assistant'],
  },
  {
    label: 'Student Directory',
    icon: 'IdCard',
    path: '/students',
    module: 'student',
    roles: [...ADMIN, 'Teacher', 'Accountant', 'Librarian', 'clerk', 'lab_assistant'],
  },
  {
    label: 'Student Documents',
    icon: 'Folder',
    path: '/students/documents',
    module: 'student',
    roles: [...ADMIN, 'Teacher'],
  },
  {
    label: 'Departments',
    icon: 'Building',
    path: '/academics/departments',
    module: 'academics',
    roles: ADMIN,
  },
  {
    label: 'Subjects',
    icon: 'BookOpen',
    path: '/academics/subjects',
    module: 'academics',
    roles: ADMIN,
  },
  {
    label: 'Staff Attendance',
    icon: 'CheckCircle',
    path: '/staff/attendance',
    module: 'staff',
    roles: ADMIN,
  },
  {
    label: 'Biometric Devices',
    icon: 'Server',
    path: '/attendance/devices',
    module: 'attendance',
    roles: ADMIN,
  },

  // ── Teaching & learning (staff) ─────────────────────────────
  { label: 'Academics & Learning', isSection: true, roles: [...ADMIN, 'Teacher'] },
  {
    label: 'Attendance Tracker',
    icon: 'CheckSquare',
    path: '/attendance',
    module: 'attendance',
    roles: [...ADMIN, 'Teacher'],
  },
  {
    label: 'Class Timetable',
    icon: 'Clock',
    path: '/academics/timetable',
    module: 'academics',
    roles: [...ADMIN, 'Teacher'],
  },
  {
    label: 'Lesson Planning',
    icon: 'FileEdit',
    path: '/academics/lesson-plans',
    module: 'academics',
    roles: [...ADMIN, 'Teacher'],
  },
  {
    label: 'Assignments & Homework',
    icon: 'Upload',
    path: '/assignments',
    module: 'homework',
    roles: [...ADMIN, 'Teacher'],
  },
  {
    label: 'Exams & Results',
    icon: 'Pencil',
    path: '/exams',
    module: 'exam',
    roles: [...ADMIN, 'Teacher'],
  },
  {
    label: 'Exam Reports',
    icon: 'BarChart3',
    path: '/exams/reports',
    module: 'exam',
    roles: [...ADMIN, 'Teacher'],
  },
  {
    label: 'Online Classes',
    icon: 'Video',
    path: '/academics/online-classes',
    module: 'academics',
    roles: [...ADMIN, 'Teacher'],
  },
  {
    label: 'LMS Quizzes',
    icon: 'HelpCircle',
    path: '/academics/quizzes',
    module: 'academics',
    roles: [...ADMIN, 'Teacher'],
  },

  // ── Student & parent portal (family API) ────────────────────
  { label: 'My Child / My School', isSection: true, roles: FAMILY },
  {
    label: 'Attendance',
    icon: 'CheckSquare',
    path: '/portal/attendance',
    module: 'attendance',
    roles: FAMILY,
  },
  {
    label: 'Timetable',
    icon: 'Clock',
    path: '/portal/timetable',
    module: 'academics',
    roles: FAMILY,
  },
  {
    label: 'Homework',
    icon: 'Upload',
    path: '/portal/homework',
    module: 'homework',
    roles: FAMILY,
  },
  { label: 'Exam Results', icon: 'Pencil', path: '/portal/results', module: 'exam', roles: FAMILY },
  {
    label: 'Fees & Payments',
    icon: 'CreditCard',
    path: '/portal/fees',
    module: 'fee',
    roles: FAMILY,
  },
  {
    label: 'School Bus',
    icon: 'Bus',
    path: '/portal/transport',
    module: 'transport',
    roles: ['Parent'],
  },
  { label: 'Library', icon: 'BookOpen', path: '/portal/library', module: 'library', roles: FAMILY },
  {
    label: 'Online Classes',
    icon: 'Video',
    path: '/portal/online-classes',
    module: 'academics',
    roles: ['Student'],
  },
  {
    label: 'Quizzes',
    icon: 'HelpCircle',
    path: '/portal/quizzes',
    module: 'academics',
    roles: ['Student'],
  },

  // ── Finance & HR ────────────────────────────────────────────
  { label: 'Finance & HR', isSection: true, roles: [...ADMIN, 'Accountant', 'clerk'] },
  {
    label: 'Fee Structures & Collection',
    icon: 'Ticket',
    path: '/fee/slabs',
    module: 'fee',
    roles: ['Accountant', 'clerk'],
  },
  {
    label: 'Online Collections',
    icon: 'CreditCard',
    path: '/fee/ledgers',
    module: 'fee',
    roles: [...ADMIN, 'Accountant'],
  },
  {
    label: 'Fee Dues & Defaulters',
    icon: 'AlertCircle',
    path: '/fee/dues',
    module: 'fee',
    roles: [...ADMIN, 'Accountant', 'clerk'],
  },
  {
    label: 'Expenses',
    icon: 'DollarSign',
    path: '/fee/expenses',
    module: 'hr_payroll',
    roles: [...ADMIN, 'Accountant'],
  },
  {
    label: 'Payroll & Salary',
    icon: 'DollarSign',
    path: '/fee/payroll',
    module: 'hr_payroll',
    roles: [...ADMIN, 'Accountant'],
  },

  // ── Everyone on staff: my own HR ────────────────────────────
  { label: 'My Work', isSection: true, roles: STAFF },
  { label: 'Leave', icon: 'CalendarMinus', path: '/leave', module: 'leave', roles: STAFF },
  { label: 'My Payslips', icon: 'DollarSign', path: '/my-pay', module: 'hr_payroll', roles: STAFF },

  // ── Operations ──────────────────────────────────────────────
  {
    label: 'Operations & Outreach',
    isSection: true,
    roles: [...ADMIN, 'Teacher', 'Librarian', 'lab_assistant', 'Warden'],
  },
  {
    label: 'Library Management',
    icon: 'BookOpen',
    path: '/library',
    module: 'library',
    roles: [...ADMIN, 'Librarian', 'Teacher', 'clerk'],
    children: [
      {
        label: 'All Books',
        icon: 'Bookmark',
        path: '/library/books',
        module: 'library',
        roles: [...ADMIN, 'Librarian', 'Teacher', 'clerk'],
      },
      {
        label: 'Book Issue',
        icon: 'RotateCcw',
        path: '/library/issues',
        module: 'library',
        roles: [...ADMIN, 'Librarian'],
      },
      {
        label: 'Fine Collections',
        icon: 'DollarSign',
        path: '/library/fines',
        module: 'library',
        roles: [...ADMIN, 'Librarian', 'Accountant'],
      },
    ],
  },
  {
    label: 'Transport Management',
    icon: 'Bus',
    path: '/transport',
    module: 'transport',
    roles: [...ADMIN, 'Teacher'],
    children: [
      {
        label: 'Vehicle Directory',
        icon: 'Bus',
        path: '/transport/vehicles',
        module: 'transport',
        roles: ADMIN,
      },
      {
        label: 'Routes & Stops',
        icon: 'MapPin',
        path: '/transport/routes',
        module: 'transport',
        roles: [...ADMIN, 'Teacher'],
      },
    ],
  },
  {
    label: 'Hostel Management',
    icon: 'Building2',
    path: '/hostel',
    module: 'hostel',
    roles: [...ADMIN, 'Warden'],
    children: [
      {
        label: 'Hostel Rooms',
        icon: 'Home',
        path: '/hostel/rooms',
        module: 'hostel',
        roles: [...ADMIN, 'Warden'],
      },
      {
        label: 'Room Allocations',
        icon: 'Key',
        path: '/hostel/allocations',
        module: 'hostel',
        roles: [...ADMIN, 'Warden'],
      },
    ],
  },
  {
    label: 'Inventory & Assets',
    icon: 'Package',
    path: '/inventory',
    module: 'inventory',
    roles: [...ADMIN, 'lab_assistant'],
  },
  {
    label: 'Announcements',
    icon: 'Bell',
    path: '/communication',
    module: 'communication',
    roles: [...STAFF, ...FAMILY],
  },
  {
    label: 'WhatsApp Business',
    icon: 'MessageSquare',
    path: '/whatsapp',
    module: 'whatsapp',
    roles: ADMIN,
  },
  {
    label: 'Website CMS',
    icon: 'Globe',
    path: '/website',
    module: 'website',
    roles: ADMIN,
    children: [
      {
        label: 'Homepage Banners',
        icon: 'Image',
        path: '/website/banners',
        module: 'website',
        roles: ADMIN,
      },
      {
        label: 'Download Center',
        icon: 'Download',
        path: '/website/downloads',
        module: 'website',
        roles: ADMIN,
      },
      {
        label: 'Admission Inquiries',
        icon: 'Mail',
        path: '/website/inquiries',
        module: 'website',
        roles: ADMIN,
      },
      {
        label: 'Pages & Gallery',
        icon: 'Pencil',
        path: '/website/content',
        module: 'website',
        roles: ADMIN,
      },
    ],
  },

  // ── Settings & analytics ────────────────────────────────────
  { label: 'Settings & Analytics', isSection: true, roles: [...ADMIN, 'Accountant'] },
  {
    label: 'System Analytics',
    icon: 'BarChart3',
    path: '/analytics',
    module: 'analytics',
    roles: [...ADMIN, 'Accountant'],
  },
  {
    label: 'Role Access',
    icon: 'Sliders',
    path: '/settings/role-access',
    module: 'core',
    roles: ADMIN,
  },
  {
    label: 'Roles & Permissions',
    icon: 'Key',
    path: '/settings/roles',
    module: 'core',
    roles: ADMIN,
  },
  { label: 'Platform Settings', icon: 'Settings', path: '/settings', module: 'core', roles: ADMIN },
];

/** The navigation tree a user may see: role-filtered and limited to the tenant's active modules. */
/** Roles every school gets. Anything else is a school-defined custom role. */
const SYSTEM_ROLES = new Set([
  'superadmin',
  'school_admin',
  'teacher',
  'accountant',
  'librarian',
  'lab_assistant',
  'support_staff',
  'clerk',
  'parent',
  'student',
]);
export const isCustomRole = (role: string) => !SYSTEM_ROLES.has(normalizeRole(role));

/**
 * @param canRead  optional: lets a CUSTOM role see the modules it was granted read access to
 *                 (built-in roles ignore it, so a parent's school-wide reads never open staff pages).
 */
export function filterNavForUser(
  role: string,
  activeModules: string[],
  canRead?: (module: string) => boolean
): NavItem[] {
  const custom = isCustomRole(role);
  const filterItem = (item: NavItem): NavItem | null => {
    // A heading's visibility comes only from the items under it (see below), never from its own roles
    if (item.isSection) return item;
    const byRole = canAccessNav(item.roles, role);
    const byGrant =
      custom && !!canRead && !!item.module && item.module !== 'core' && canRead(item.module);
    if (!byRole && !byGrant) return null;
    if (item.module && !isModuleActive(activeModules, item.module)) return null;
    if (item.children) {
      const children = item.children
        .map(filterItem)
        .filter((child): child is NavItem => child !== null);
      if (children.length === 0 && !item.path) return null;
      return { ...item, children };
    }
    return item;
  };
  const visible = navigationConfig.map(filterItem).filter((item): item is NavItem => item !== null);
  // A section heading is only worth showing when something it introduces is visible.
  return visible.filter((item, i) => {
    if (!item.isSection) return true;
    for (let j = i + 1; j < visible.length; j++) {
      if (visible[j].isSection) return false;
      return true;
    }
    return false;
  });
}

/**
 * A platform owner who has not switched into a school has no use for school menus
 * (setup steps, attendance, fees…): show the Platform section only.
 */
export function platformOnlyNav(nav: NavItem[]): NavItem[] {
  const out: NavItem[] = [];
  let inPlatform = false;
  for (const item of nav) {
    if (item.isSection) inPlatform = item.label === 'Platform';
    if (inPlatform) out.push(item);
  }
  return out;
}

/** Accent colour per section heading (stable across roles, themed via CSS tone classes). */
export const SECTION_TONES: Record<string, string> = {
  Overview: 'rose',
  Platform: 'violet',
  'School Setup (Steps 1-6)': 'indigo',
  'School Directories': 'sky',
  'Academics & Learning': 'violet',
  'My Child / My School': 'indigo',
  'Finance & HR': 'amber',
  'My Work': 'teal',
  'Operations & Outreach': 'emerald',
  'Settings & Analytics': 'teal',
};
