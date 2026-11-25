import { api } from './api';
import { asList, unwrap } from '@/lib/utils';

export interface BookInput {
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  category?: string;
  totalCopies?: number;
  shelfNo?: string;
}

export const libraryService = {
  getBooks: async (page = 1, limit = 10, search?: string) => {
    const res = await api.get('/library/books', {
      params: { page, limit, ...(search ? { search } : {}) },
    });
    const body = unwrap<any>(res);
    const items = asList(body);
    const meta = body?.meta ??
      body?.data?.meta ?? { total: items.length, page, limit, totalPages: 1 };
    return { items, meta, data: { items, meta } };
  },

  createBook: async (data: BookInput) => unwrap(await api.post('/library/books', data)),

  updateBook: async (id: string, data: Partial<BookInput>) =>
    unwrap(await api.patch(`/library/books/${id}`, data)),

  deleteBook: async (id: string) => unwrap(await api.delete(`/library/books/${id}`)),

  /** issuedTo is a student id or a staff (user) id. */
  issueBook: async (data: { bookId: string; issuedTo: string; dueDate: string }) =>
    unwrap(await api.post('/library/issues', data)),

  /** fineAmount (rupees) is entered by the librarian for a late return. */
  returnBook: async (issueId: string, data: { fineAmount?: number } = {}) =>
    unwrap(await api.patch(`/library/issues/${issueId}/return`, data)),

  // admin / librarian only on the backend
  getActiveIssues: async () => asList<any>(unwrap(await api.get('/library/issues/active'))),
  getOverdueIssues: async () => asList<any>(unwrap(await api.get('/library/issues/overdue'))),

  /** Outstanding fines — raised on return, neither paid nor waived. */
  getFines: async (): Promise<{ total: number; count: number; issues: any[] }> =>
    unwrap<any>(await api.get('/library/fines')) ?? { total: 0, count: 0, issues: [] },

  payFine: async (issueId: string) =>
    unwrap(await api.patch(`/library/issues/${issueId}/fine/pay`)),

  waiveFine: async (issueId: string, note?: string) =>
    unwrap(await api.patch(`/library/issues/${issueId}/fine/waive`, { note })),

  /** Borrowing history for one member (student id or staff id). */
  getMemberHistory: async (memberId: string) =>
    asList<any>(unwrap(await api.get(`/library/issues/member/${memberId}`))),
};
