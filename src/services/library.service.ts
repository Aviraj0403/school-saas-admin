import { api } from './api';
import { Book, BookIssue } from '@/types/api.types';

export const libraryService = {
  getBooks: async (page = 1, limit = 10, search?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) params.append('search', search);
    const response = await api.get<{ success: boolean; data: Book[]; meta: any }>(`/library/books?${params}`);
    const items = (response.data.data as any)?.items ?? [];
    const meta = (response.data.data as any)?.meta ?? { total: 0, page, limit, totalPages: 0 };
    return { items, meta, data: { items, meta } };
  },

  createBook: async (data: any) => {
    const response = await api.post<{ success: boolean; data: Book }>('/library/books', data);
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  issueBook: async (data: { bookId: string; studentId: string; dueDate: string }) => {
    const response = await api.post<{ success: boolean; data: BookIssue }>('/library/issues', data);
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  returnBook: async (issueId: string, data?: { remarks?: string }) => {
    const response = await api.patch<{ success: boolean }>(`/library/issues/${issueId}/return`, data || {});
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  getActiveIssues: async () => {
    const response = await api.get<{ success: boolean; data: BookIssue[] }>('/library/issues/active');
    return ((response.data as any)?.data as any)?.items || (response.data?.data ?? []);
  },

  getOverdueIssues: async () => {
    const response = await api.get<{ success: boolean; data: BookIssue[] }>('/library/issues/overdue');
    return ((response.data as any)?.data as any)?.items || (response.data?.data ?? []);
  },

  // ── Fines ──────────────────────────────────────────────────────
  // These endpoints did not exist until v34: the fines tab tracked paid/waived
  // in React state, so every settlement was lost on refresh.

  /** Outstanding fines — raised on return, neither paid nor waived. */
  getFines: async () => {
    const response = await api.get<{ success: boolean; data: any }>('/library/fines');
    return (response.data as any)?.data ?? { total: 0, count: 0, issues: [] };
  },

  payFine: async (issueId: string) => {
    const response = await api.patch<{ success: boolean }>(`/library/issues/${issueId}/fine/pay`);
    return (response.data as any)?.data ?? response.data;
  },

  waiveFine: async (issueId: string, note?: string) => {
    const response = await api.patch<{ success: boolean }>(`/library/issues/${issueId}/fine/waive`, { note });
    return (response.data as any)?.data ?? response.data;
  },

  /** Borrowing history for one member (students see only their own). */
  getMemberHistory: async (memberId: string) => {
    const response = await api.get<{ success: boolean; data: BookIssue[] }>(`/library/issues/member/${memberId}`);
    return ((response.data as any)?.data as any)?.items || (response.data?.data ?? []);
  },
};




