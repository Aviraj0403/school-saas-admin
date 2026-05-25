import { api } from './api';
import { Book, BookIssue } from '@/types/api.types';

export const libraryService = {
  getBooks: async (page = 1, limit = 10, search?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) params.append('search', search);
    const response = await api.get<{ success: boolean; data: Book[]; meta: any }>(`/library/books?${params}`);
    return { items: response.data.data ?? [], meta: response.data.meta ?? { total: 0, page, limit, totalPages: 0 } };
  },

  createBook: async (data: any) => {
    const response = await api.post<{ success: boolean; data: Book }>('/library/books', data);
    return response.data.data;
  },

  issueBook: async (data: { bookId: string; studentId: string; dueDate: string }) => {
    const response = await api.post<{ success: boolean; data: BookIssue }>('/library/issues', data);
    return response.data.data;
  },

  returnBook: async (issueId: string, data?: { remarks?: string }) => {
    const response = await api.patch<{ success: boolean }>(`/library/issues/${issueId}/return`, data || {});
    return response.data;
  },

  getActiveIssues: async () => {
    const response = await api.get<{ success: boolean; data: BookIssue[] }>('/library/issues/active');
    return response.data.data ?? [];
  },

  getOverdueIssues: async () => {
    const response = await api.get<{ success: boolean; data: BookIssue[] }>('/library/issues/overdue');
    return response.data.data ?? [];
  },
};
