import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryService } from '@/services/library.service';
import { useAuthStore } from '@/store/useAuthStore';

export function useBooksList(page: number, limit: number, search?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['library-books', { page, limit, search }],
    queryFn: () => libraryService.getBooks(page, limit, search),
    enabled: isAuthenticated,
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => libraryService.createBook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
    },
  });
}

export function useIssueBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { bookId: string; studentId: string; dueDate: string }) =>
      libraryService.issueBook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      queryClient.invalidateQueries({ queryKey: ['library-active-issues'] });
    },
  });
}

export function useReturnBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, remarks }: { issueId: string; remarks?: string }) =>
      libraryService.returnBook(issueId, { remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      queryClient.invalidateQueries({ queryKey: ['library-active-issues'] });
    },
  });
}

export function useActiveIssues() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['library-active-issues'],
    queryFn: () => libraryService.getActiveIssues(),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useOverdueIssues() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['library-overdue-issues'],
    queryFn: async () => {
      const res = await libraryService.getActiveIssues(); // Get active issues
      // Filter overdue on frontend since we don't have getOverdueIssues exported in libraryService (or call it directly if it exists, let's call the api directly)
      const { api } = await import('@/services/api');
      const apiRes = await api.get('/library/issues/overdue');
      return apiRes.data?.data || apiRes.data || [];
    },
    enabled: isAuthenticated,
    retry: false,
  });
}
