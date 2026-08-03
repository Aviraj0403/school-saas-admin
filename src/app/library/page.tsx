'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { useBooksList, useCreateBook, useIssueBook, useReturnBook, useActiveIssues, useOverdueIssues } from '@/hooks/queries/useLibrary';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryService } from '@/services/library.service';



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

  // Fines come from the server now. This tab used to hold paid/waived in React
  // state with a note that "backend doesn't persist fine payments yet" — every
  // settlement was lost on refresh, and the amount shown was a hardcoded
  // ₹10/day guess rather than the fine actually recorded on return.
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
  const toastEvent = (severity: string, summary: string, detail: string) =>
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { severity, summary, detail, life: 3000 } }));

  const payFineMutation = useMutation({
    mutationFn: (id: string) => libraryService.payFine(id),
    onSuccess: () => { refreshFines(); toastEvent('success', 'Fine Paid', 'Recorded against the issue.'); },
    onError: () => toastEvent('error', 'Error', 'Could not record the payment.'),
  });

  const waiveFineMutation = useMutation({
    mutationFn: (id: string) => libraryService.waiveFine(id),
    onSuccess: () => { refreshFines(); toastEvent('info', 'Fine Waived', 'Penalty waived.'); },
    onError: () => toastEvent('error', 'Error', 'Could not waive the fine.'),
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
  const { data: books, isPending: loadingBooks } = useBooksList(lazyState.page, lazyState.rows, lazyState.search);
  const { data: activeIssues, isPending: loadingIssues } = useActiveIssues();

  const createBookMutation = useCreateBook();
  const issueBookMutation = useIssueBook();
  const returnBookMutation = useReturnBook();

  const onPage = (event: DataTablePageEvent) => {
    setLazyState((prev) => ({
      ...prev,
      first: event.first,
      rows: event.rows,
      page: (event.page || 0) + 1,
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLazyState((prev) => ({
      ...prev,
      search: e.target.value,
      page: 1,
      first: 0
    }));
  };

  const handleCreateBook = () => {
    createBookMutation.mutate(newBook, {
      onSuccess: () => {
        setShowAddBookDialog(false);
        setNewBook({ title: '', author: '', isbn: '' });
      }
    });
  };

  const handleIssueBook = () => {
    issueBookMutation.mutate(issueBook, {
      onSuccess: () => {
        setShowIssueDialog(false);
        setIssueBook({ bookId: '', studentId: '', dueDate: '' });
      }
    });
  };

  const handleReturnBook = (issueId: string) => {
    if (confirm('Are you sure you want to mark this book as returned?')) {
      returnBookMutation.mutate({ issueId });
    }
  };

  const statusTemplate = (status: string) => {
    const isAvail = status === 'AVAILABLE';
    return (
      <Tag 
        value={status} 
        className={`px-2.5 py-1 text-xs font-bold rounded-full ${
          isAvail 
            ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
            : 'bg-amber-500/10 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
        }`}
      />
    );
  };

  const activeBooks = books?.data?.items || [];
  const totalBooks = books?.data?.meta?.total || 0;
  const activeLoans = activeIssues || [];

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Library" />
<div className="flex flex-col gap-4 pb-10">
        
        {/* Header Block */}
        <div className="flex flex-col items-start gap-4 pb-4">
          {/* <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Library Catalog</h1>
            <p className="text-slate-400 mt-1 text-sm md:text-base">
              Catalog physical books, register student loans, and check return due dates.
            </p>
          </div> */}

          <button 
            onClick={() => setShowAddBookDialog(true)}
            className="w-full md:w-auto bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white font-extrabold shadow-md border-0 ring-1 ring-black/5 dark:ring-white/10 uppercase tracking-wider text-[11px] px-5 py-2.5 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <i className="pi pi-plus text-xs"></i>
            Add New Book
          </button>
        </div>

        {/* View mode bar */}
        <div className="bg-zinc-50 dark:bg-zinc-900/60 p-2 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-full md:w-80">
            <div className="relative">
              <i className="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"></i>
              <InputText 
                value={lazyState.search} 
                onChange={handleSearchChange} 
                placeholder="Search catalog by title, author, or ISBN..." 
                className="w-full pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-md dark:bg-zinc-950 outline-none focus:border-blue-500 transition-all text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 px-3 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-zinc-950 text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200 dark:border-zinc-800' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
              title="Catalog Grid"
            >
              <i className="pi pi-th-large mr-1.5 text-[10px]"></i> Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 px-3 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-zinc-950 text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200 dark:border-zinc-800' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
              title="List View"
            >
              <i className="pi pi-list mr-1.5 text-[10px]"></i> Table
            </button>
          </div>
        </div>

        {/* Tab Boards */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm overflow-hidden">
          <style>{`
            .p-tabview, .p-tabview-nav, .p-tabview-panels, .p-datatable, .p-datatable-wrapper, .p-paginator {
              background: transparent !important;
            }
            .p-datatable-thead > tr > th, .p-datatable-tbody > tr, .p-datatable-tbody > tr > td {
              background: transparent !important;
            }
            .p-tabview-nav li .p-tabview-nav-link {
              background: transparent !important;
            }
          `}</style>
          <TabView activeIndex={activeTab} onTabChange={(e) => {
            setActiveTab(e.index);
            const tabPaths = ['/library/books', '/library/issues', '/library/fines'];
            window.history.pushState({}, '', tabPaths[e.index]);
          }}>
            
            {/* Book directory Panel */}
            <TabPanel header="Book Directory">
              <div className="p-4">
                {loadingBooks ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-zinc-400">Loading directory...</span>
                  </div>
                ) : activeBooks.length === 0 ? (
                  <p className="p-8 text-center text-zinc-400">No books cataloged yet.</p>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
                    {activeBooks.map((book: any) => (
                    <div key={book.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-all group animate-fade-in">
                      <div className="p-5 flex items-start gap-4">
                        <div className="w-14 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-md flex items-center justify-center text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                          <i className="pi pi-book text-2xl"></i>
                        </div>
                        <div className="flex flex-col gap-1 w-full">
                          <h3 className="font-semibold text-sm text-zinc-900 dark:text-white line-clamp-2 leading-tight">
                            {book.title}
                          </h3>
                          <p className="text-xs text-zinc-500 font-medium">By {book.author}</p>
                          <p className="text-[10px] text-zinc-400 font-mono mt-1">ISBN: {book.isbn}</p>
                        </div>
                      </div>
                      
                      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">Status</span>
                          {statusTemplate(book.status || 'AVAILABLE')}
                        </div>
                        {book.status === 'AVAILABLE' && (
                        <button 
                          onClick={() => {
                            setIssueBook({ ...issueBook, bookId: book.id });
                            setShowIssueDialog(true);
                          }}
                          disabled={book.status !== 'AVAILABLE'}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          Issue Book
                        </button>
                        )}
                      </div>
                    </div>
                    ))}
                  </div>
                ) : (
                  <DataTable 
                    value={activeBooks} 
                    lazy 
                    paginator 
                    first={lazyState.first}
                    rows={lazyState.rows}
                    totalRecords={totalBooks}
                    onPage={onPage}
                    loading={loadingBooks} 
                    className="p-datatable-sm mt-1" 
                  >
                    <Column field="title" header="Book Title" className="font-semibold text-zinc-900 dark:text-white"></Column>
                    <Column field="author" header="Author" className="text-zinc-700 dark:text-zinc-300"></Column>
                    <Column field="isbn" header="ISBN" className="font-mono text-xs text-zinc-500"></Column>
                    <Column field="status" header="Status" body={(d) => statusTemplate(d.status || 'AVAILABLE')}></Column>
                    <Column header="Actions" body={(d) => (
                      d.status === 'AVAILABLE' && (
                        <Button 
                          label="Issue" 
                          icon="pi pi-bookmark" 
                          size="small" 
                          className="bg-blue-600 text-white p-1 px-2 text-xs rounded-md"
                          onClick={() => {
                            setIssueBook((prev) => ({ ...prev, bookId: d.id }));
                            setShowIssueDialog(true);
                          }}
                        />
                      )
                    )} align="center"></Column>
                  </DataTable>
                )}
              </div>
            </TabPanel>

            {/* Issued books Panel */}
            <TabPanel header="Outstanding Active Loans">
              <div className="p-4">
                {loadingIssues ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-zinc-500">Loading issues...</span>
                  </div>
                ) : activeLoans.length === 0 ? (
                  <p className="p-8 text-center text-zinc-500">No books currently loaned out.</p>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                    {activeLoans.map((loan: any) => (
                      <div 
                        key={loan.id} 
                        className="border border-zinc-200 dark:border-zinc-800 p-5 rounded-md bg-white dark:bg-zinc-900 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Active Loan</span>
                            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm leading-snug mt-0.5">{loan.bookTitle}</h3>
                          </div>
                          <Tag value="Loaned" severity="warning" className="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 font-bold text-[9px] px-2.5 py-0.5 rounded-md" />
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-md text-[10px] font-semibold uppercase tracking-wider flex flex-col gap-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-500">
                          <div className="flex justify-between">
                            <span>Issued To (Student):</span>
                            <span className="text-zinc-900 dark:text-zinc-300 font-bold">{loan.studentName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Issue Date:</span>
                            <span className="text-zinc-900 dark:text-zinc-300">{loan.issueDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Due Return:</span>
                            <span className="text-red-600 dark:text-red-400 font-bold">{loan.dueDate}</span>
                          </div>
                        </div>

                        <div className="flex justify-end border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-1">
                          <button 
                            onClick={() => handleReturnBook(loan.id)}
                            className="px-3.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 rounded-md transition-all active:scale-95 flex items-center gap-1"
                          >
                            <i className="pi pi-replay text-[10px]"></i>
                            Record Return
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <DataTable 
                    value={activeLoans} 
                    loading={loadingIssues} 
                    className="p-datatable-sm mt-1" 
                  >
                    <Column field="bookTitle" header="Book Title" className="font-semibold text-zinc-900 dark:text-white"></Column>
                    <Column field="studentName" header="Issued To" className="text-zinc-700 dark:text-zinc-300"></Column>
                    <Column field="issueDate" header="Issue Date" className="text-xs text-zinc-500"></Column>
                    <Column field="dueDate" header="Due Date" className="text-xs font-semibold text-red-500"></Column>
                    <Column header="Actions" body={(d) => (
                      <Button 
                        label="Return" 
                        icon="pi pi-replay" 
                        size="small" 
                        severity="success"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 px-2 text-xs rounded-md border-0"
                        onClick={() => handleReturnBook(d.id)}
                      />
                    )} align="center"></Column>
                  </DataTable>
                )}
              </div>
            </TabPanel>

            {/* Fine Collections Panel */}
            <TabPanel header="Fine Collections & Overdues">
              <div className="p-4">
                {loadingFines ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-zinc-400">Loading fines...</span>
                  </div>
                ) : finesList.length === 0 ? (
                  <p className="p-8 text-center text-zinc-400">No overdue books or fines found.</p>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                    {finesList.map((fine: any) => (
                      <div 
                        key={fine.id} 
                        className="border border-zinc-200 dark:border-zinc-800 p-5 rounded-md bg-white dark:bg-zinc-900 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Fine Notice</span>
                            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm leading-snug mt-0.5">{fine.studentName}</h3>
                          </div>
                          <Tag 
                            value={fine.status} 
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${
                              fine.status === 'PAID' 
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
                                : fine.status === 'WAIVED' 
                                  ? 'bg-zinc-50 text-zinc-500 dark:bg-zinc-800' 
                                  : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                            }`} 
                          />
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-md text-[10px] font-semibold uppercase tracking-wider flex flex-col gap-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-500">
                          <div className="flex justify-between">
                            <span>Overdue Book:</span>
                            <span className="text-zinc-900 dark:text-zinc-300 font-bold">{fine.bookTitle}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Days Overdue:</span>
                            <span className="text-red-600 dark:text-red-400 font-bold">{fine.daysOverdue} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fine Penalty:</span>
                            <span className="text-zinc-900 dark:text-white font-bold">₹{fine.fineAmount}</span>
                          </div>
                        </div>

                        {fine.status === 'UNPAID' && (
                          <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-1">
                            <button 
                              onClick={() => handleWaiveFine(fine.id)}
                              className="px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-all"
                            >
                              Waive Fine
                            </button>
                            <button 
                              onClick={() => handlePayFine(fine.id)}
                              className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-all active:scale-95 flex items-center gap-1"
                            >
                              <i className="pi pi-check text-[10px]"></i>
                              Clear & Pay
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <DataTable 
                    value={finesList} 
                    className="p-datatable-sm mt-1" 
                  >
                    <Column field="studentName" header="Student Name" className="font-semibold text-zinc-900 dark:text-white"></Column>
                    <Column field="bookTitle" header="Book Title" className="text-zinc-700 dark:text-zinc-300"></Column>
                    <Column field="daysOverdue" header="Days Overdue" body={(d) => `${d.daysOverdue} days`} className="text-xs text-red-600 dark:text-red-400 font-medium"></Column>
                    <Column field="fineAmount" header="Fine Amount" body={(d) => `₹${d.fineAmount}`} className="font-bold"></Column>
                    <Column field="status" header="Status" body={(d) => (
                      <Tag 
                        value={d.status} 
                        className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                          d.status === 'PAID' 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
                            : d.status === 'WAIVED' 
                              ? 'bg-zinc-50 text-zinc-500 dark:bg-zinc-800' 
                              : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                        }`} 
                      />
                    )}></Column>
                    <Column header="Actions" body={(d) => (
                      d.status === 'UNPAID' && (
                        <div className="flex gap-2 justify-center">
                          <Button 
                            label="Waive" 
                            size="small" 
                            className="p-button-text text-xs p-1 text-zinc-500"
                            onClick={() => handleWaiveFine(d.id)}
                          />
                          <Button 
                            label="Pay Fine" 
                            icon="pi pi-check" 
                            size="small" 
                            severity="success"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 px-2 text-xs rounded-md border-0"
                            onClick={() => handlePayFine(d.id)}
                          />
                        </div>
                      )
                    )} align="center"></Column>
                  </DataTable>
                )}
              </div>
            </TabPanel>

          </TabView>
        </div>

      </div>

      {/* Dialog: Add Book */}
      <Dialog 
        header="Add Book to Catalog" 
        visible={showAddBookDialog} 
        style={{ width: '400px' }} 
        modal 
        onHide={() => setShowAddBookDialog(false)}
        className="dialog-custom rounded-md"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button label="Cancel" className="p-button-text p-2 text-zinc-500" onClick={() => setShowAddBookDialog(false)} />
            <Button 
              label="Save Book" 
              icon="pi pi-check" 
              onClick={handleCreateBook} 
              loading={createBookMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 px-4 rounded-md font-medium" 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Book Title *</label>
            <InputText 
              value={newBook.title} 
              onChange={(e) => setNewBook({ ...newBook, title: e.target.value })} 
              placeholder="e.g. Concept of Physics Vol. 1"
              className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-md outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Author Name *</label>
            <InputText 
              value={newBook.author} 
              onChange={(e) => setNewBook({ ...newBook, author: e.target.value })} 
              placeholder="e.g. H.C. Verma"
              className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-md outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">ISBN Code</label>
            <InputText 
              value={newBook.isbn} 
              onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })} 
              placeholder="e.g., 978-0131103627"
              className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-md outline-none"
            />
          </div>
        </div>
      </Dialog>

      {/* Dialog: Issue Book */}
      <Dialog 
        header="Issue Book to Student" 
        visible={showIssueDialog} 
        style={{ width: '400px' }} 
        modal 
        onHide={() => setShowIssueDialog(false)}
        className="dialog-custom rounded-md"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button label="Cancel" className="p-button-text p-2 text-zinc-500" onClick={() => setShowIssueDialog(false)} />
            <Button 
              label="Issue Book" 
              icon="pi pi-check" 
              onClick={handleIssueBook} 
              loading={issueBookMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 px-4 rounded-md font-medium" 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Student ID / Admission No *</label>
            <InputText 
              value={issueBook.studentId} 
              onChange={(e) => setIssueBook({ ...issueBook, studentId: e.target.value })} 
              placeholder="e.g. stud-uuid"
              className="p-2 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-md outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Return Due Date *</label>
            <Calendar 
              value={issueBook.dueDate ? new Date(issueBook.dueDate) : null} 
              onChange={(e) => setIssueBook({ ...issueBook, dueDate: e.value ? e.value.toISOString().split('T')[0] : '' })} 
              dateFormat="yy-mm-dd"
              showIcon
              className="border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-md w-full"
            />
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
