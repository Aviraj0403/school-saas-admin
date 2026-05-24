import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsService } from '@/services/students.service';
import { CreateStudentDto } from '@/types/api.types';

export function useStudentsList(page: number, limit: number, search?: string) {
  return useQuery({
    queryKey: ['students', { page, limit, search }],
    queryFn: () => studentsService.getStudents(page, limit, search),
    // Keep previous data while fetching new page to prevent UI flicker
    placeholderData: (previousData) => previousData,
  });
}

export function useStudentDetails(id: string) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => studentsService.getStudentById(id),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStudentDto) => studentsService.createStudent(data),
    onSuccess: () => {
      // Invalidate and refetch students list
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
