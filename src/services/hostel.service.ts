import { api } from './api';
import { Hostel, HostelRoom, HostelBoarder } from '@/types/api.types';

export const hostelService = {
  getDashboard: async () => {
    const response = await api.get<{ success: boolean; data: any }>('/hostel/dashboard');
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  getHostels: async () => {
    const response = await api.get<{ success: boolean; data: any }>('/hostel');
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || [];
  },

  createHostel: async (data: { name: string; type: 'BOYS' | 'GIRLS' | 'COED'; capacity: number; address?: string }) => {
    const response = await api.post<{ success: boolean; data: Hostel }>('/hostel', data);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  getRooms: async (hostelId: string) => {
    const response = await api.get<{ success: boolean; data: any }>(`/hostel/${hostelId}/rooms`);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || [];
  },

  createRoom: async (hostelId: string, data: { roomNo: string; type: string; capacity: number }) => {
    const response = await api.post<{ success: boolean; data: HostelRoom }>(`/hostel/${hostelId}/rooms`, data);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  admitBoarder: async (data: { studentId: string; hostelRoomId: string; academicYearId: string }) => {
    const response = await api.post<{ success: boolean; data: HostelBoarder }>('/hostel/boarders/admit', {
      studentId: data.studentId,
      roomId: data.hostelRoomId,   // backend expects 'roomId', not 'hostelRoomId'
      academicYearId: data.academicYearId,
    });
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  getStudentBoarder: async (studentId: string) => {
    const response = await api.get<{ success: boolean; data: any }>(`/hostel/boarders/student/${studentId}`);
    return response.data?.data ?? null;
  },

  dischargeBoarder: async (studentId: string, academicYearId: string) => {
    const response = await api.patch<{ success: boolean }>(`/hostel/boarders/${studentId}/discharge`, { academicYearId });
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  }
};



