import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryService } from '@/services/library.service';

export function useBooksList(page: number, limit: number, search?: string) {
  return useQuery({
    queryKey: ['library-books', { page, limit, search }],
    queryFn: () => libraryService.getBooks(page, limit, search),
    placeholderData: (previousData) => previousData,
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
    mutationFn: (data: { bookId: string; studentId: string; dueDate: string }) => libraryService.issueBook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      queryClient.invalidateQueries({ queryKey: ['library-active-issues'] });
    },
  });
}

export function useReturnBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ issueId, remarks }: { issueId: string; remarks?: string }) => libraryService.returnBook(issueId, { remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      queryClient.invalidateQueries({ queryKey: ['library-active-issues'] });
      queryClient.invalidateQueries({ queryKey: ['library-overdue-issues'] });
    },
  });
}

export function useActiveIssues() {
  return useQuery({
    queryKey: ['library-active-issues'],
    queryFn: () => libraryService.getActiveIssues(),
  });
}

export function useOverdueIssues() {
  return useQuery({
    queryKey: ['library-overdue-issues'],
    queryFn: () => libraryService.getOverdueIssues(),
  });
}
