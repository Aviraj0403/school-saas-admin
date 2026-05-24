import { Role } from '@/store/useAuthStore';

// Common Generic API Responses
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message?: string;
}

// User & Auth Types
export interface AuthResponse {
  user: UserProfile;
  token: string;
  tenant: TenantConfig;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface TenantConfig {
  id: string;
  name: string;
  activeModules: string[];
}

// Student Module Types
export interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  classId: string;
  className: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface CreateStudentDto {
  firstName: string;
  lastName: string;
  admissionNo: string;
  classId: string;
}

// Academics Module Types
export interface AcademicClass {
  id: string;
  name: string;
  section: string;
  teacherId?: string;
  capacity: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  classId: string;
}

// Attendance Module Types
export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
  remarks?: string;
}

export interface MarkAttendanceDto {
  studentId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
  remarks?: string;
}

// SuperAdmin Module Types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  adminEmail: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  plan: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
  activeModules: string[];
  createdAt: string;
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  adminEmail: string;
  plan: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
}

// Staff Module Types
export interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  department: string;
  designation: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface CreateStaffDto {
  name: string;
  email: string;
  phone?: string;
  role: Role;
  department: string;
  designation: string;
}

// Fee Module Types
export interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  type: string;
  classId?: string;
  className?: string;
}

export interface FeeCollection {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'PARTIAL';
  date: string;
  paymentMethod: 'CASH' | 'ONLINE' | 'CHEQUE';
}

export interface CollectFeeDto {
  studentId: string;
  amount: number;
  paymentMethod: 'CASH' | 'ONLINE' | 'CHEQUE';
  remarks?: string;
}

// Exam Module Types
export interface Exam {
  id: string;
  name: string;
  classId: string;
  className?: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED';
}

export interface CreateExamDto {
  name: string;
  classId: string;
  startDate: string;
  endDate: string;
}

export interface ExamResult {
  id: string;
  studentId: string;
  studentName: string;
  examId: string;
  examName: string;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  remarks?: string;
}

// Library Module Types
export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  status: 'AVAILABLE' | 'ISSUED';
}

export interface BookIssue {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
}

// Communication Module Types
export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  authorName: string;
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
}

// WhatsApp Module Types
export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  welcomeMessage: string;
  offHoursStart: string;
  offHoursEnd: string;
  enableRag: boolean;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  status: string;
}

export interface WhatsAppSession {
  id: string;
  phoneNumber: string;
  contactName: string;
  lastMessage: string;
  updatedAt: string;
}

// Hostel Module Types
export interface Hostel {
  id: string;
  name: string;
  type: 'BOYS' | 'GIRLS' | 'COED';
  capacity: number;
  address?: string;
}

export interface HostelRoom {
  id: string;
  hostelId: string;
  roomNo: string;
  type: string;
  capacity: number;
  occupied: number;
}

export interface HostelBoarder {
  id: string;
  studentId: string;
  studentName: string;
  roomNo: string;
  hostelName: string;
  joinDate: string;
}

// Leave Module Types
export interface LeaveApplication {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantType: 'STUDENT' | 'STAFF';
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reason: string;
  remarks?: string;
}

