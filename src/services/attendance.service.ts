import { api } from './api';
import { AttendanceRecord, MarkAttendanceDto } from '@/types/api.types';

export const attendanceService = {
  getAttendance: async (date: string, classId?: string) => {
    const params = new URLSearchParams({ date });
    if (classId) params.append('classId', classId);
    const response = await api.get<{ success: boolean; data: AttendanceRecord[]; meta: any }>(`/attendance?${params}`);
    return { items: response.data.data ?? [], meta: response.data.meta ?? { total: 0 } };
  },

  markAttendance: async (data: MarkAttendanceDto | MarkAttendanceDto[]) => {
    const response = await api.post<{ success: boolean }>('/attendance', Array.isArray(data) ? { records: data } : data);
    return response.data;
  },
};
