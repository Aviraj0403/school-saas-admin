import { api } from './api';
import { AttendanceRecord, MarkAttendanceDto, PaginatedResponse } from '@/types/api.types';

export const attendanceService = {
  getAttendance: async (date: string, classId?: string) => {
    const params = new URLSearchParams({ date });
    if (classId) params.append('classId', classId);
    
    // For specific date/class query, returning array directly or paginated
    const response = await api.get<PaginatedResponse<AttendanceRecord>>(`/attendance?${params.toString()}`);
    return response.data;
  },

  markAttendance: async (data: MarkAttendanceDto | MarkAttendanceDto[]) => {
    // Bulk or single mark depending on payload
    const response = await api.post<{ success: boolean }>('/attendance', Array.isArray(data) ? { records: data } : data);
    return response.data;
  }
};
