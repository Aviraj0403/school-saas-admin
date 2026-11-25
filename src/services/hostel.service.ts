import { api } from './api';
import { asList, unwrap } from '@/lib/utils';

export type HostelType = 'boys' | 'girls' | 'mixed';
export type RoomType = 'shared' | 'single' | 'double';

export interface HostelInput {
  name: string;
  type?: HostelType;
  capacity: number;
  wardenPhone?: string;
  address?: string;
}

export interface RoomInput {
  roomNo: string;
  floor?: number;
  capacity?: number;
  type?: RoomType;
}

const list = (res: any) => asList<any>(unwrap(res));

export const hostelService = {
  getDashboard: async () => unwrap<any>(await api.get('/hostel/dashboard')),

  getHostels: async () => list(await api.get('/hostel', { params: { limit: 100 } })),

  createHostel: async (data: HostelInput) => unwrap(await api.post('/hostel', data)),

  updateHostel: async (id: string, data: Partial<HostelInput>) =>
    unwrap(await api.patch(`/hostel/${id}`, data)),

  deleteHostel: async (id: string) => unwrap(await api.delete(`/hostel/${id}`)),

  getWardens: async () => list(await api.get('/hostel/wardens')),

  /** wardenId null clears the assignment. */
  assignWarden: async (
    id: string,
    data: { wardenId: string | null; wardenPhone?: string | null }
  ) => unwrap(await api.patch(`/hostel/${id}/warden`, data)),

  getRooms: async (hostelId: string) =>
    list(await api.get(`/hostel/${hostelId}/rooms`, { params: { limit: 100 } })),

  createRoom: async (hostelId: string, data: RoomInput) =>
    unwrap(await api.post(`/hostel/${hostelId}/rooms`, data)),

  updateRoom: async (roomId: string, data: Partial<RoomInput>) =>
    unwrap(await api.patch(`/hostel/rooms/${roomId}`, data)),

  deleteRoom: async (roomId: string) => unwrap(await api.delete(`/hostel/rooms/${roomId}`)),

  getBoarders: async () => list(await api.get('/hostel/boarders', { params: { limit: 100 } })),

  /** hostelRoomId is accepted as an alias of roomId (used by the admissions form). */
  admitBoarder: async (data: {
    studentId: string;
    roomId?: string;
    hostelRoomId?: string;
    academicYearId: string;
    feeAmount?: number;
  }) =>
    unwrap(
      await api.post('/hostel/boarders/admit', {
        studentId: data.studentId,
        roomId: data.roomId ?? data.hostelRoomId,
        academicYearId: data.academicYearId,
        feeAmount: data.feeAmount,
      })
    ),

  dischargeBoarder: async (studentId: string, academicYearId: string) =>
    unwrap(await api.patch(`/hostel/boarders/${studentId}/discharge`, { academicYearId })),
};
