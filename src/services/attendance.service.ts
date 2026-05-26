import { api } from './api';
import { AttendanceRecord } from '@/types/api.types';

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
    return response.data;
  },

  markSingle: async (data: MarkSingleAttendancePayload) => {
    const response = await api.post<{ success: boolean }>('/attendance/single', data);
    return response.data;
  },
};
