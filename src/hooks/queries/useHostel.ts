import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hostelService } from '@/services/hostel.service';

export function useHostelDashboard() {
  return useQuery({
    queryKey: ['hostel-dashboard'],
    queryFn: () => hostelService.getDashboard(),
  });
}

export function useHostels() {
  return useQuery({
    queryKey: ['hostels'],
    queryFn: () => hostelService.getHostels(),
  });
}

export function useCreateHostel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; type: 'BOYS' | 'GIRLS' | 'COED'; capacity: number; address?: string }) => 
      hostelService.createHostel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
      queryClient.invalidateQueries({ queryKey: ['hostel-dashboard'] });
    },
  });
}

export function useHostelRooms(hostelId: string) {
  return useQuery({
    queryKey: ['hostel-rooms', hostelId],
    queryFn: () => hostelService.getRooms(hostelId),
    enabled: !!hostelId,
  });
}

export function useAllBoarders() {
  return useQuery({
    queryKey: ['hostel-boarders'],
    queryFn: async () => {
      const { api } = await import('@/services/api');
      const res = await api.get('/hostel/boarders');
      return res.data?.data || res.data || [];
    },
  });
}

export function useCreateHostelRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ hostelId, data }: { hostelId: string; data: { roomNo: string; type: string; capacity: number } }) => 
      hostelService.createRoom(hostelId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hostel-rooms', variables.hostelId] });
      queryClient.invalidateQueries({ queryKey: ['hostel-dashboard'] });
    },
  });
}

export function useAdmitBoarder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { studentId: string; hostelRoomId: string; academicYear: string }) => 
      hostelService.admitBoarder(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hostel-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['hostel-dashboard'] });
    },
  });
}

export function useDischargeBoarder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, academicYear }: { studentId: string; academicYear: string }) => 
      hostelService.dischargeBoarder(studentId, academicYear),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostel-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['hostel-dashboard'] });
    },
  });
}
