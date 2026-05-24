import { api } from './api';
import { ApiResponse, PaginatedResponse, Book, BookIssue } from '@/types/api.types';

export const libraryService = {
  getBooks: async (page = 1, limit = 10, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search ? { search } : {})
    });
    const response = await api.get<PaginatedResponse<Book>>(`/library/books?${params.toString()}`);
    return response.data;
  },

  createBook: async (data: any) => {
    const response = await api.post<{ success: boolean; data: Book }>('/library/books', data);
    return response.data;
  },

  getBookDetails: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Book & { issues: BookIssue[] } }>(`/library/books/${id}`);
    return response.data.data;
  },

  issueBook: async (data: { bookId: string; studentId: string; dueDate: string }) => {
    const response = await api.post<{ success: boolean; data: BookIssue }>('/library/issues', data);
    return response.data;
  },

  returnBook: async (issueId: string, data?: { remarks?: string }) => {
    const response = await api.patch<{ success: boolean }>(`/library/issues/${issueId}/return`, data || {});
    return response.data;
  },

  getActiveIssues: async () => {
    const response = await api.get<{ success: boolean; data: BookIssue[] }>('/library/issues/active');
    return response.data.data;
  },

  getOverdueIssues: async () => {
    const response = await api.get<{ success: boolean; data: BookIssue[] }>('/library/issues/overdue');
    return response.data.data;
  }
};
