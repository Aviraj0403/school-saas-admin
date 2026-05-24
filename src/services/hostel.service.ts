import { api } from './api';
import { Hostel, HostelRoom, HostelBoarder } from '@/types/api.types';

export const hostelService = {
  getDashboard: async () => {
    const response = await api.get<{ success: boolean; data: any }>('/hostel/dashboard');
    return response.data.data;
  },

  getHostels: async () => {
    const response = await api.get<{ success: boolean; data: Hostel[] }>('/hostel');
    return response.data;
  },

  createHostel: async (data: { name: string; type: 'BOYS' | 'GIRLS' | 'COED'; capacity: number; address?: string }) => {
    const response = await api.post<{ success: boolean; data: Hostel }>('/hostel', data);
    return response.data;
  },

  getRooms: async (hostelId: string) => {
    const response = await api.get<{ success: boolean; data: HostelRoom[] }>(`/hostel/${hostelId}/rooms`);
    return response.data;
  },

  createRoom: async (hostelId: string, data: { roomNo: string; type: string; capacity: number }) => {
    const response = await api.post<{ success: boolean; data: HostelRoom }>(`/hostel/${hostelId}/rooms`, data);
    return response.data;
  },

  admitBoarder: async (data: { studentId: string; hostelRoomId: string; academicYear: string }) => {
    const response = await api.post<{ success: boolean; data: HostelBoarder }>('/hostel/boarders/admit', data);
    return response.data;
  },

  dischargeBoarder: async (studentId: string, academicYear: string) => {
    const response = await api.patch<{ success: boolean }>(`/hostel/boarders/${studentId}/discharge`, { academicYear });
    return response.data;
  }
};
