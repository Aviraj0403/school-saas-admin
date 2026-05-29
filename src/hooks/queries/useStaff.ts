import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '@/services/staff.service';
import { useAuthStore } from '@/store/useAuthStore';
import { CreateStaffDto } from '@/types/api.types';

export function useStaffList(page: number, limit: number, search?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['staff', { page, limit, search }],
    queryFn: () => staffService.getStaffList(page, limit, search),
    enabled: isAuthenticated,
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => staffService.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffService.deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}

export function useRoles() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => staffService.getRoles(),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useDepartments() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => staffService.getDepartments(),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useResetStaffPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffService.resetPassword(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}

