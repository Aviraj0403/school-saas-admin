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
