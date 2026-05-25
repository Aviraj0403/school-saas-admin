import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsService } from '@/services/students.service';
import { useAuthStore } from '@/store/useAuthStore';
import { CreateStudentDto } from '@/types/api.types';

export function useStudentsList(page: number, limit: number, search?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['students', { page, limit, search }],
    queryFn: () => studentsService.getStudents(page, limit, search),
    enabled: isAuthenticated,
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}

export function useStudentDetails(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => studentsService.getStudentById(id),
    enabled: isAuthenticated && !!id,
    retry: false,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStudentDto) => studentsService.createStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentsService.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
