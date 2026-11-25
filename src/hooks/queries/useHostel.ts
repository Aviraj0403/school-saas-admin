import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hostelService, HostelInput, RoomInput } from '@/services/hostel.service';
import { useAuthStore } from '@/store/useAuthStore';

function useAuthed() {
  return useAuthStore((s) => s.isAuthenticated);
}

export function useHostelDashboard() {
  const ok = useAuthed();
  return useQuery({
    queryKey: ['hostel-dashboard'],
    queryFn: () => hostelService.getDashboard(),
    enabled: ok,
    retry: false,
  });
}

export function useHostels() {
  const ok = useAuthed();
  return useQuery({
    queryKey: ['hostels'],
    queryFn: () => hostelService.getHostels(),
    enabled: ok,
    retry: false,
  });
}

export function useWardens() {
  const ok = useAuthed();
  return useQuery({
    queryKey: ['hostel-wardens'],
    queryFn: () => hostelService.getWardens(),
    enabled: ok,
    retry: false,
  });
}

export function useHostelRooms(hostelId: string) {
  const ok = useAuthed();
  return useQuery({
    queryKey: ['hostel-rooms', hostelId],
    queryFn: () => hostelService.getRooms(hostelId),
    enabled: ok && !!hostelId,
    retry: false,
  });
}

export function useAllBoarders() {
  const ok = useAuthed();
  return useQuery({
    queryKey: ['hostel-boarders'],
    queryFn: () => hostelService.getBoarders(),
    enabled: ok,
    retry: false,
  });
}

function useInvalidateHostel() {
  const qc = useQueryClient();
  return () => {
    for (const key of [
      'hostels',
      'hostel-wardens',
      'hostel-rooms',
      'hostel-boarders',
      'hostel-dashboard',
    ]) {
      qc.invalidateQueries({ queryKey: [key] });
    }
  };
}

export function useCreateHostel() {
  const invalidate = useInvalidateHostel();
  return useMutation({
    mutationFn: (data: HostelInput) => hostelService.createHostel(data),
    onSuccess: invalidate,
  });
}

export function useUpdateHostel() {
  const invalidate = useInvalidateHostel();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HostelInput> }) =>
      hostelService.updateHostel(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteHostel() {
  const invalidate = useInvalidateHostel();
  return useMutation({
    mutationFn: (id: string) => hostelService.deleteHostel(id),
    onSuccess: invalidate,
  });
}

export function useAssignWarden() {
  const invalidate = useInvalidateHostel();
  return useMutation({
    mutationFn: ({
      id,
      wardenId,
      wardenPhone,
    }: {
      id: string;
      wardenId: string | null;
      wardenPhone?: string | null;
    }) => hostelService.assignWarden(id, { wardenId, wardenPhone }),
    onSuccess: invalidate,
  });
}

export function useCreateHostelRoom() {
  const invalidate = useInvalidateHostel();
  return useMutation({
    mutationFn: ({ hostelId, data }: { hostelId: string; data: RoomInput }) =>
      hostelService.createRoom(hostelId, data),
    onSuccess: invalidate,
  });
}

export function useUpdateHostelRoom() {
  const invalidate = useInvalidateHostel();
  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: string; data: Partial<RoomInput> }) =>
      hostelService.updateRoom(roomId, data),
    onSuccess: invalidate,
  });
}

export function useDeleteHostelRoom() {
  const invalidate = useInvalidateHostel();
  return useMutation({
    mutationFn: (roomId: string) => hostelService.deleteRoom(roomId),
    onSuccess: invalidate,
  });
}

export function useAdmitBoarder() {
  const invalidate = useInvalidateHostel();
  return useMutation({
    mutationFn: (data: {
      studentId: string;
      roomId?: string;
      hostelRoomId?: string;
      academicYearId: string;
      feeAmount?: number;
    }) => hostelService.admitBoarder(data),
    onSuccess: invalidate,
  });
}

export function useDischargeBoarder() {
  const invalidate = useInvalidateHostel();
  return useMutation({
    mutationFn: ({ studentId, academicYearId }: { studentId: string; academicYearId: string }) =>
      hostelService.dischargeBoarder(studentId, academicYearId),
    onSuccess: invalidate,
  });
}
