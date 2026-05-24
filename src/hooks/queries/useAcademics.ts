import { useQuery } from '@tanstack/react-query';
import { academicsService } from '@/services/academics.service';

export function useClasses(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['academics', 'classes', { page, limit }],
    queryFn: () => academicsService.getClasses(page, limit),
    placeholderData: (prev) => prev,
  });
}

export function useSubjects(classId: string) {
  return useQuery({
    queryKey: ['academics', 'subjects', classId],
    queryFn: () => academicsService.getSubjects(classId),
    enabled: !!classId, // Only run if classId is provided
  });
}
