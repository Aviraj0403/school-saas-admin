import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryService, BookInput } from '@/services/library.service';
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

function useInvalidateLibrary() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['library-books'] });
    qc.invalidateQueries({ queryKey: ['library-active-issues'] });
    qc.invalidateQueries({ queryKey: ['library-overdue-issues'] });
    qc.invalidateQueries({ queryKey: ['library-fines'] });
    qc.invalidateQueries({ queryKey: ['library-member-history'] });
  };
}

export function useCreateBook() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: (data: BookInput) => libraryService.createBook(data),
    onSuccess: invalidate,
  });
}

export function useUpdateBook() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BookInput> }) =>
      libraryService.updateBook(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteBook() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: (id: string) => libraryService.deleteBook(id),
    onSuccess: invalidate,
  });
}

export function useIssueBook() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: (data: { bookId: string; issuedTo: string; dueDate: string }) =>
      libraryService.issueBook(data),
    onSuccess: invalidate,
  });
}

export function useReturnBook() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: ({ issueId, fineAmount }: { issueId: string; fineAmount?: number }) =>
      libraryService.returnBook(issueId, { fineAmount }),
    onSuccess: invalidate,
  });
}

/** Admin / librarian only — callers must pass enabled=false for every other role. */
export function useActiveIssues(enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['library-active-issues'],
    queryFn: () => libraryService.getActiveIssues(),
    enabled: isAuthenticated && enabled,
    retry: false,
  });
}

/** Admin / librarian only. */
export function useOverdueIssues(enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['library-overdue-issues'],
    queryFn: () => libraryService.getOverdueIssues(),
    enabled: isAuthenticated && enabled,
    retry: false,
  });
}

export function useLibraryFines(enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['library-fines'],
    queryFn: () => libraryService.getFines(),
    enabled: isAuthenticated && enabled,
    retry: false,
  });
}

export function usePayFine() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: (id: string) => libraryService.payFine(id),
    onSuccess: invalidate,
  });
}

export function useWaiveFine() {
  const invalidate = useInvalidateLibrary();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => libraryService.waiveFine(id, note),
    onSuccess: invalidate,
  });
}

export function useMemberHistory(memberId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['library-member-history', memberId],
    queryFn: () => libraryService.getMemberHistory(memberId),
    enabled: isAuthenticated && !!memberId,
    retry: false,
  });
}
