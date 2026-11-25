import { api } from './api';
import { AttendanceRecord } from '@/types/api.types';
import { unwrap } from '@/lib/utils';

export interface MarkBulkAttendancePayload {
  classId: string;
  date: string;
  records: Array<{
    studentId: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
    note?: string;
  }>;
}

export interface MarkSingleAttendancePayload {
  studentId: string;
  classId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
  note?: string;
}

export interface TodayStatus {
  totalStudents: number;
  markedCount: number;
  isMarked: boolean;
  date: string;
}

export interface ClassReport {
  summary: Array<{
    student: { id: string; name: string; rollNo?: string | null };
    present: number;
    absent: number;
    late: number;
    leave: number;
    total: number;
  }>;
  totalDays: number;
}

export interface StudentMonthSummary {
  records: Array<{ id: string; date: string; status: string; note?: string | null }>;
  present: number;
  absent: number;
  late: number;
  leave: number;
  total: number;
  percentage: string;
}

export const attendanceService = {
  getAttendance: async (date: string, classId?: string) => {
    if (!classId) {
      return { items: [], meta: { total: 0 }, data: { items: [], meta: { total: 0 } } };
    }

    // Backend path: GET /attendance/class/:classId?date=YYYY-MM-DD
    const response = await api.get<{ success: boolean; data: any[]; meta?: any }>(
      `/attendance/class/${classId}?date=${date}`
    );

    // Map response containing nested student object to the AttendanceRecord flat structure
    const items: AttendanceRecord[] = (response.data.data ?? []).map((item: any) => ({
      id: item.id,
      studentId: item.studentId,
      studentName: item.student?.name || 'Unknown',
      date: item.date,
      status: item.status,
      remarks: item.note || '',
    }));

    const meta = response.data.meta ?? { total: items.length };
    return { items, meta, data: { items, meta } };
  },

  markBulk: async (data: MarkBulkAttendancePayload) => {
    const response = await api.post<{ success: boolean }>('/attendance/bulk', data);
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
  },

  markSingle: async (data: MarkSingleAttendancePayload) => {
    const response = await api.post<{ success: boolean }>('/attendance/single', data);
    return (
      ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data
    );
  },

  getToday: async (classId: string): Promise<TodayStatus> => {
    const res = await api.get(`/attendance/class/${classId}/today`);
    return unwrap<TodayStatus>(res);
  },

  getClassReport: async (
    classId: string,
    startDate: string,
    endDate: string
  ): Promise<ClassReport> => {
    const res = await api.get(`/attendance/class/${classId}/report`, {
      params: { startDate, endDate },
    });
    return unwrap<ClassReport>(res);
  },

  getStudentSummary: async (
    studentId: string,
    month: number,
    year: number
  ): Promise<StudentMonthSummary> => {
    const res = await api.get(`/attendance/student/${studentId}/summary`, {
      params: { month, year },
    });
    return unwrap<StudentMonthSummary>(res);
  },
};
