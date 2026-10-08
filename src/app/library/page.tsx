'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  useBooksList,
  useCreateBook,
  useIssueBook,
  useReturnBook,
  useActiveIssues,
  useOverdueIssues,
} from '@/hooks/queries/useLibrary';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryService } from '@/services/library.service';
import { toast } from 'sonner';
import {
  BookOpen,
  Plus,
  LayoutGrid,
  List,
  Search,
  RotateCcw,
  BookmarkPlus,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (pathname.includes('/books') || tabParam === 'books') setActiveTab(0);
      else if (pathname.includes('/issues') || tabParam === 'issues') setActiveTab(1);
      else if (pathname.includes('/fines') || tabParam === 'fines') setActiveTab(2);
    }
  }, []);

  const { data: overdueIssuesData, isPending: loadingOverdues } = useOverdueIssues();
  const queryClient = useQueryClient();

  const { data: finesData, isPending: loadingFines } = useQuery({
    queryKey: ['library-fines'],
    queryFn: libraryService.getFines,
  });

  const finesList = (finesData?.issues || []).map((issue: any) => {
    const due = new Date(issue.dueDate);
    const returned = issue.returnDate ? new Date(issue.returnDate) : new Date();
    const daysOverdue = Math.max(0, Math.ceil((returned.getTime() - due.getTime()) / 86400000));
    return {
      id: issue.id,
      studentName: issue.issuedTo || 'Unknown',
      bookTitle: issue.book?.title || 'Unknown Book',
      fineAmount: Number(issue.fineAmount ?? 0),
      daysOverdue,
      status: issue.finePaid ? 'PAID' : issue.fineWaived ? 'WAIVED' : 'UNPAID',
    };
  });

  const refreshFines = () => queryClient.invalidateQueries({ queryKey: ['library-fines'] });

  const payFineMutation = useMutation({
    mutationFn: (id: string) => libraryService.payFine(id),
    onSuccess: () => {
      refreshFines();
      toast.success('Fine recorded as paid.');
    },
    onError: () => toast.error('Could not record the payment.'),
  });

  const waiveFineMutation = useMutation({
    mutationFn: (id: string) => libraryService.waiveFine(id),
    onSuccess: () => {
      refreshFines();
      toast.success('Fine penalty waived.');
    },
    onError: () => toast.error('Could not waive the fine.'),
  });

  const handlePayFine = (id: string) => payFineMutation.mutate(id);
  const handleWaiveFine = (id: string) => waiveFineMutation.mutate(id);

  const [showAddBookDialog, setShowAddBookDialog] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Form states
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '' });
  const [issueBook, setIssueBook] = useState({ bookId: '', studentId: '', dueDate: '' });

  // Pagination states
  const [lazyState, setLazyState] = useState({ first: 0, rows: 10, page: 1, search: '' });

  // Queries
  const { data: books, isPending: loadingBooks } = useBooksList(
    lazyState.page,
    lazyState.rows,
    lazyState.search
  );
  const { data: activeIssues, isPending: loadingIssues } = useActiveIssues();

  const createBookMutation = useCreateBook();
  const issueBookMutation = useIssueBook();
  const returnBookMutation = useReturnBook();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLazyState((prev) => ({
      ...prev,
      search: e.target.value,
      page: 1,
      first: 0,
    }));
  };

  const handleCreateBook = () => {
    if (!newBook.title || !newBook.author) {
      toast.error('Book title and author are required.');
      return;
    }
    createBookMutation.mutate(newBook, {
      onSuccess: () => {
        setShowAddBookDialog(false);
        setNewBook({ title: '', author: '', isbn: '' });
        toast.success('Book added to catalog.');
      },
      onError: () => toast.error('Failed to create book.'),
    });
  };

  const handleIssueBook = () => {
    if (!issueBook.bookId || !issueBook.studentId || !issueBook.dueDate) {
      toast.error('Book, student ID, and return due date are required.');
      return;
    }
    issueBookMutation.mutate(issueBook, {
      onSuccess: () => {
        setShowIssueDialog(false);
        setIssueBook({ bookId: '', studentId: '', dueDate: '' });
        toast.success('Book issued successfully.');
      },
      onError: () => toast.error('Failed to issue book.'),
    });
  };

  const handleReturnBook = (issueId: string) => {
    if (confirm('Are you sure you want to mark this book as returned?')) {
      returnBookMutation.mutate(
        { issueId },
        {
          onSuccess: () => toast.success('Book marked as returned.'),
          onError: () => toast.error('Failed to mark return.'),
        }
      );
    }
  };

  const statusBadge = (status: string) => {
    const isAvail = status === 'AVAILABLE';
    return <Badge variant={isAvail ? 'success' : 'warning'}>{status}</Badge>;
  };

  const activeBooks = books?.data?.items || [];
  const totalBooks = books?.data?.meta?.total || 0;
  const activeLoans = activeIssues || [];

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Library & Resources" />

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        {/* Header Block */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand" />
              Library Catalog & Loans
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Catalog physical books, register student loans, and process fines
            </p>
          </div>

          <Button onClick={() => setShowAddBookDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add New Book
          </Button>
        </div>

        {/* Search & Layout Control Bar */}
        <div className="flex justify-between items-center flex-wrap gap-4 bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={lazyState.search}
              onChange={handleSearchChange}
              placeholder="Search title, author, or ISBN..."
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            />
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-900 text-brand shadow-sm'
                  : 'text-zinc-400'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-900 text-brand shadow-sm'
                  : 'text-zinc-400'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Sub-navigation */}
        <div className="flex bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 w-fit">
          <button
            onClick={() => {
              setActiveTab(0);
              window.history.pushState({}, '', '/library/books');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 0
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Book Directory
          </button>
          <button
            onClick={() => {
              setActiveTab(1);
              window.history.pushState({}, '', '/library/issues');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 1
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Outstanding Active Loans
          </button>
          <button
            onClick={() => {
              setActiveTab(2);
              window.history.pushState({}, '', '/library/fines');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 2
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Fine Collections & Overdues
          </button>
        </div>

        {/* Tab Boards */}
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm">
          {/* Tab 0: Book Directory */}
          {activeTab === 0 && (
            <div>
              {loadingBooks ? (
                <div className="p-12 text-center text-zinc-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                  <p className="text-xs">Loading directory...</p>
                </div>
              ) : activeBooks.length === 0 ? (
                <div className="p-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    No Books Cataloged
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {activeBooks.map((book: any) => (
                    <div
                      key={book.id}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                    >
                      <div className="p-5 flex items-start gap-4">
                        <div className="w-12 h-16 bg-brand/10 text-brand rounded-lg flex items-center justify-center font-bold text-xl shrink-0">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col gap-1 w-full">
                          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-tight">
                            {book.title}
                          </h3>
                          <p className="text-xs text-zinc-500">By {book.author}</p>
                          <p className="text-[10px] text-zinc-400 font-mono mt-1">
                            ISBN: {book.isbn || '—'}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between">
                        {statusBadge(book.status || 'AVAILABLE')}
                        {book.status === 'AVAILABLE' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setIssueBook({ ...issueBook, bookId: book.id });
                              setShowIssueDialog(true);
                            }}
                          >
                            <BookmarkPlus className="w-3.5 h-3.5 mr-1" /> Issue
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-4 py-3">Book Title</th>
                        <th className="px-4 py-3">Author</th>
                        <th className="px-4 py-3">ISBN</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {activeBooks.map((d: any) => (
                        <tr key={d.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                            {d.title}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{d.author}</td>
                          <td className="px-4 py-3 font-mono text-zinc-500">{d.isbn || '—'}</td>
                          <td className="px-4 py-3">{statusBadge(d.status || 'AVAILABLE')}</td>
                          <td className="px-4 py-3 text-center">
                            {d.status === 'AVAILABLE' && (
                              <Button
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setIssueBook((prev) => ({ ...prev, bookId: d.id }));
                                  setShowIssueDialog(true);
                                }}
                              >
                                Issue
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 1: Outstanding Active Loans */}
          {activeTab === 1 && (
            <div>
              {loadingIssues ? (
                <div className="p-12 text-center text-zinc-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                  <p className="text-xs">Loading active loans...</p>
                </div>
              ) : activeLoans.length === 0 ? (
                <div className="p-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    No Outstanding Loans
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {activeLoans.map((loan: any) => (
                    <div
                      key={loan.id}
                      className="border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-xl bg-white dark:bg-zinc-900 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-bold text-brand uppercase tracking-widest block">
                            Active Loan
                          </span>
                          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">
                            {loan.bookTitle}
                          </h3>
                        </div>
                        <Badge variant="warning">Loaned</Badge>
                      </div>

                      <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg text-xs flex flex-col gap-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-500">
                        <div className="flex justify-between">
                          <span>Issued To:</span>
                          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                            {loan.studentName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Issue Date:</span>
                          <span className="font-mono text-zinc-600 dark:text-zinc-400">
                            {loan.issueDate}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Return Due:</span>
                          <span className="font-mono text-rose-500 font-bold">{loan.dueDate}</span>
                        </div>
                      </div>

                      <div className="flex justify-end border-t border-zinc-100 dark:border-zinc-800 pt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReturnBook(loan.id)}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Record Return
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-4 py-3">Book Title</th>
                        <th className="px-4 py-3">Issued To</th>
                        <th className="px-4 py-3">Issue Date</th>
                        <th className="px-4 py-3">Due Date</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {activeLoans.map((d: any) => (
                        <tr key={d.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                            {d.bookTitle}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                            {d.studentName}
                          </td>
                          <td className="px-4 py-3 font-mono text-zinc-500">{d.issueDate}</td>
                          <td className="px-4 py-3 font-mono text-rose-500 font-bold">
                            {d.dueDate}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleReturnBook(d.id)}
                            >
                              Return
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Fine Collections */}
          {activeTab === 2 && (
            <div>
              {loadingFines ? (
                <div className="p-12 text-center text-zinc-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                  <p className="text-xs">Loading fine notices...</p>
                </div>
              ) : finesList.length === 0 ? (
                <div className="p-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    No Fine Notices
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {finesList.map((fine: any) => (
                    <div
                      key={fine.id}
                      className="border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-xl bg-white dark:bg-zinc-900 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest block">
                            Overdue Fine
                          </span>
                          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">
                            {fine.studentName}
                          </h3>
                        </div>
                        <Badge
                          variant={
                            fine.status === 'PAID'
                              ? 'success'
                              : fine.status === 'WAIVED'
                                ? 'secondary'
                                : 'danger'
                          }
                        >
                          {fine.status}
                        </Badge>
                      </div>

                      <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg text-xs flex flex-col gap-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-500">
                        <div className="flex justify-between">
                          <span>Overdue Book:</span>
                          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                            {fine.bookTitle}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Days Overdue:</span>
                          <span className="font-mono text-rose-500 font-bold">
                            {fine.daysOverdue} days
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fine Penalty:</span>
                          <span className="font-mono text-zinc-900 dark:text-zinc-100 font-extrabold">
                            ₹{fine.fineAmount}
                          </span>
                        </div>
                      </div>

                      {fine.status === 'UNPAID' && (
                        <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWaiveFine(fine.id)}
                          >
                            Waive Fine
                          </Button>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handlePayFine(fine.id)}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Clear & Pay
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Book Title</th>
                        <th className="px-4 py-3">Overdue Days</th>
                        <th className="px-4 py-3">Fine Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {finesList.map((d: any) => (
                        <tr key={d.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                            {d.studentName}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                            {d.bookTitle}
                          </td>
                          <td className="px-4 py-3 font-mono text-rose-500 font-bold">
                            {d.daysOverdue} days
                          </td>
                          <td className="px-4 py-3 font-mono font-bold">₹{d.fineAmount}</td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                d.status === 'PAID'
                                  ? 'success'
                                  : d.status === 'WAIVED'
                                    ? 'secondary'
                                    : 'danger'
                              }
                            >
                              {d.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {d.status === 'UNPAID' && (
                              <div className="flex gap-2 justify-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() => handleWaiveFine(d.id)}
                                >
                                  Waive
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-emerald-600 text-white"
                                  onClick={() => handlePayFine(d.id)}
                                >
                                  Pay Fine
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialog: Add Book */}
      <Dialog
        isOpen={showAddBookDialog}
        onClose={() => setShowAddBookDialog(false)}
        title="Add Book to Catalog"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Book Title *
            </label>
            <Input
              value={newBook.title}
              onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
              placeholder="e.g. Concept of Physics Vol. 1"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Author Name *
            </label>
            <Input
              value={newBook.author}
              onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
              placeholder="e.g. H.C. Verma"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              ISBN Code
            </label>
            <Input
              value={newBook.isbn}
              onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
              placeholder="e.g. 978-0131103627"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowAddBookDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateBook} isLoading={createBookMutation.isPending}>
            Save Book
          </Button>
        </div>
      </Dialog>

      {/* Dialog: Issue Book */}
      <Dialog
        isOpen={showIssueDialog}
        onClose={() => setShowIssueDialog(false)}
        title="Issue Book to Student"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Student ID / Admission No *
            </label>
            <Input
              value={issueBook.studentId}
              onChange={(e) => setIssueBook({ ...issueBook, studentId: e.target.value })}
              placeholder="Enter Student ID..."
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Return Due Date *
            </label>
            <Input
              type="date"
              value={issueBook.dueDate}
              onChange={(e) => setIssueBook({ ...issueBook, dueDate: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowIssueDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleIssueBook} isLoading={issueBookMutation.isPending}>
            Issue Book
          </Button>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
