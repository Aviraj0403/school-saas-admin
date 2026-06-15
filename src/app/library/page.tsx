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
  
  // Local state for tracking paid/waived fines since backend doesn't persist fine payments yet
  const [clearedFines, setClearedFines] = useState<Record<string, string>>({});

  const finesList = (overdueIssuesData || []).map((issue: any) => {
    // Calculate days overdue
    const due = new Date(issue.dueDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - due.getTime());
    const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const fineAmount = daysOverdue * 10; // Rs 10 per day

    return {
      id: issue.id,
      studentName: issue.studentName || 'Unknown Student',
      bookTitle: issue.bookTitle || issue.book?.title || 'Unknown Book',
      fineAmount: clearedFines[issue.id] === 'WAIVED' ? 0 : fineAmount,
      daysOverdue: daysOverdue,
      status: clearedFines[issue.id] || 'UNPAID',
    };
  });

  const handlePayFine = (id: string) => {
    setClearedFines(prev => ({ ...prev, [id]: 'PAID' }));
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { severity: 'success', summary: 'Fine Paid', detail: 'Fine has been marked as paid.', life: 3000 }
    }));
  };

  const handleWaiveFine = (id: string) => {
    setClearedFines(prev => ({ ...prev, [id]: 'WAIVED' }));
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { severity: 'info', summary: 'Fine Waived', detail: 'Penalty has been waived.', life: 3000 }
    }));
  };

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
      <div className="flex flex-col gap-8 pb-10">
        
        {/* Header Block */}
        <div className="flex flex-col items-start gap-4 pt-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Library Catalog</h1>
            <p className="text-slate-400 mt-1 text-sm md:text-base">
              Catalog physical books, register student loans, and check return due dates.
            </p>
          </div>
          <button 
            onClick={() => setShowAddBookDialog(true)}
            className="w-full md:w-auto px-5 py-3 bg-primary hover:opacity-95 text-white font-bold border-0 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
          >
            <i className="pi pi-plus text-xs"></i>
            Add New Book
          </button>
        </div>

        {/* View mode bar */}
        <div className="bg-slate-100/50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/40 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-full md:w-80">
            <div className="relative">
              <i className="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <InputText 
                value={lazyState.search} 
                onChange={handleSearchChange} 
                placeholder="Search catalog by title, author, or ISBN..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 outline-none focus:border-primary transition-all text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 px-5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-slate-950 text-primary shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="Catalog Grid"
            >
              <i className="pi pi-th-large text-sm"></i>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 px-5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-950 text-primary shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="List View"
            >
              <i className="pi pi-list text-sm"></i>
            </button>
          </div>
        </div>

        {/* Tab Boards */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
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
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-slate-400">Loading directory...</span>
                  </div>
                ) : activeBooks.length === 0 ? (
                  <p className="p-8 text-center text-slate-400">No books cataloged yet.</p>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
                    {activeBooks.map((book: any) => (
                    <div key={book.id} className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-all group animate-fade-in">
                      <div className="p-5 flex items-start gap-4">
                        <div className="w-14 h-20 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-300 dark:text-slate-600 border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                          <i className="pi pi-book text-2xl"></i>
                        </div>
                        <div className="flex flex-col gap-1 w-full">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-tight">
                            {book.title}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">By {book.author}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-1">ISBN: {book.isbn}</p>
                        </div>
                      </div>
                      
                      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</span>
                          {statusTemplate(book.status || 'AVAILABLE')}
                        </div>
                        {book.status === 'AVAILABLE' && (
                        <button 
                          onClick={() => {
                            setIssueBook({ ...issueBook, bookId: book.id });
                            setShowIssueDialog(true);
                          }}
                          disabled={book.status !== 'AVAILABLE'}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-primary rounded-lg hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
                    <Column field="title" header="Book Title" className="font-semibold text-slate-850 dark:text-white"></Column>
                    <Column field="author" header="Author"></Column>
                    <Column field="isbn" header="ISBN" className="font-mono text-xs"></Column>
                    <Column field="status" header="Status" body={(d) => statusTemplate(d.status || 'AVAILABLE')}></Column>
                    <Column header="Actions" body={(d) => (
                      d.status === 'AVAILABLE' && (
                        <Button 
                          label="Issue" 
                          icon="pi pi-bookmark" 
                          size="small" 
                          className="bg-indigo-600 text-white p-1 px-2 text-xs"
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
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-slate-400">Loading issues...</span>
                  </div>
                ) : activeLoans.length === 0 ? (
                  <p className="p-8 text-center text-slate-400">No books currently loaned out.</p>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                    {activeLoans.map((loan: any) => (
                      <div 
                        key={loan.id} 
                        className="border border-slate-105 dark:border-slate-800 p-5 rounded-3xl bg-slate-50/30 dark:bg-slate-900/40 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Active Loan</span>
                            <h3 className="font-extrabold text-slate-850 dark:text-white text-sm leading-snug mt-0.5">{loan.bookTitle}</h3>
                          </div>
                          <Tag value="Loaned" severity="warning" className="bg-amber-500 text-white font-bold text-[9px] px-2.5 py-0.5 rounded-full" />
                        </div>

                        <div className="bg-slate-100/50 dark:bg-slate-850 p-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider flex flex-col gap-1.5 border border-slate-150/40 text-slate-450">
                          <div className="flex justify-between">
                            <span>Issued To (Student):</span>
                            <span className="text-slate-850 dark:text-slate-300 font-extrabold">{loan.studentName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Issue Date:</span>
                            <span className="text-slate-850 dark:text-slate-350">{loan.issueDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Due Return:</span>
                            <span className="text-rose-600 dark:text-rose-400 font-extrabold">{loan.dueDate}</span>
                          </div>
                        </div>

                        <div className="flex justify-end border-t border-slate-100 dark:border-slate-850 pt-3 mt-1">
                          <button 
                            onClick={() => handleReturnBook(loan.id)}
                            className="px-3.5 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20 rounded-xl transition-all active:scale-95 flex items-center gap-1"
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
                    <Column field="bookTitle" header="Book Title" className="font-semibold text-slate-850 dark:text-white"></Column>
                    <Column field="studentName" header="Issued To"></Column>
                    <Column field="issueDate" header="Issue Date"></Column>
                    <Column field="dueDate" header="Due Date"></Column>
                    <Column header="Actions" body={(d) => (
                      <Button 
                        label="Return" 
                        icon="pi pi-replay" 
                        size="small" 
                        severity="success"
                        className="bg-emerald-600 text-white p-1 px-2 text-xs"
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
                {loadingOverdues ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-slate-400">Loading overdues...</span>
                  </div>
                ) : finesList.length === 0 ? (
                  <p className="p-8 text-center text-slate-400">No overdue books or fines found.</p>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                    {finesList.map((fine: any) => (
                      <div 
                        key={fine.id} 
                        className="border border-slate-105 dark:border-slate-800 p-5 rounded-3xl bg-slate-50/30 dark:bg-slate-900/40 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-bold text-red-650 dark:text-red-400 uppercase tracking-widest">Fine Notice</span>
                            <h3 className="font-extrabold text-slate-850 dark:text-white text-sm leading-snug mt-0.5">{fine.studentName}</h3>
                          </div>
                          <Tag 
                            value={fine.status} 
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                              fine.status === 'PAID' 
                                ? 'bg-emerald-500/10 text-emerald-650' 
                                : fine.status === 'WAIVED' 
                                  ? 'bg-slate-500/10 text-slate-500' 
                                  : 'bg-rose-500/10 text-rose-650'
                            }`} 
                          />
                        </div>

                        <div className="bg-slate-100/50 dark:bg-slate-850 p-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider flex flex-col gap-1.5 border border-slate-150/40 text-slate-400">
                          <div className="flex justify-between">
                            <span>Overdue Book:</span>
                            <span className="text-slate-850 dark:text-slate-300 font-extrabold">{fine.bookTitle}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Days Overdue:</span>
                            <span className="text-rose-650 dark:text-rose-450 font-extrabold">{fine.daysOverdue} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fine Penalty:</span>
                            <span className="text-slate-850 dark:text-white font-extrabold">₹{fine.fineAmount}</span>
                          </div>
                        </div>

                        {fine.status === 'UNPAID' && (
                          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-850 pt-3 mt-1">
                            <button 
                              onClick={() => handleWaiveFine(fine.id)}
                              className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                            >
                              Waive Fine
                            </button>
                            <button 
                              onClick={() => handlePayFine(fine.id)}
                              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all active:scale-95 flex items-center gap-1"
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
                    <Column field="studentName" header="Student Name" className="font-semibold text-slate-850 dark:text-white"></Column>
                    <Column field="bookTitle" header="Book Title"></Column>
                    <Column field="daysOverdue" header="Days Overdue" body={(d) => `${d.daysOverdue} days`}></Column>
                    <Column field="fineAmount" header="Fine Amount" body={(d) => `₹${d.fineAmount}`}></Column>
                    <Column field="status" header="Status" body={(d) => (
                      <Tag 
                        value={d.status} 
                        className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          d.status === 'PAID' 
                            ? 'bg-emerald-500/10 text-emerald-650' 
                            : d.status === 'WAIVED' 
                              ? 'bg-slate-500/10 text-slate-500' 
                              : 'bg-rose-500/10 text-rose-650'
                        }`} 
                      />
                    )}></Column>
                    <Column header="Actions" body={(d) => (
                      d.status === 'UNPAID' && (
                        <div className="flex gap-2 justify-center">
                          <Button 
                            label="Waive" 
                            size="small" 
                            className="p-button-text text-xs p-1"
                            onClick={() => handleWaiveFine(d.id)}
                          />
                          <Button 
                            label="Pay Fine" 
                            icon="pi pi-check" 
                            size="small" 
                            severity="success"
                            className="bg-emerald-600 text-white p-1 px-2 text-xs"
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
        className="dialog-custom rounded-3xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowAddBookDialog(false)} />
            <Button 
              label="Save Book" 
              icon="pi pi-check" 
              onClick={handleCreateBook} 
              loading={createBookMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Book Title *</label>
            <InputText 
              value={newBook.title} 
              onChange={(e) => setNewBook({ ...newBook, title: e.target.value })} 
              placeholder="e.g. Concept of Physics Vol. 1"
              className="p-2 border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Author Name *</label>
            <InputText 
              value={newBook.author} 
              onChange={(e) => setNewBook({ ...newBook, author: e.target.value })} 
              placeholder="e.g. H.C. Verma"
              className="p-2 border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">ISBN Code</label>
            <InputText 
              value={newBook.isbn} 
              onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })} 
              placeholder="e.g., 978-0131103627"
              className="p-2 border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
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
        className="dialog-custom rounded-3xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowIssueDialog(false)} />
            <Button 
              label="Issue Book" 
              icon="pi pi-check" 
              onClick={handleIssueBook} 
              loading={issueBookMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Student ID / Admission No *</label>
            <InputText 
              value={issueBook.studentId} 
              onChange={(e) => setIssueBook({ ...issueBook, studentId: e.target.value })} 
              placeholder="e.g. stud-uuid"
              className="p-2 border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Return Due Date *</label>
            <Calendar 
              value={issueBook.dueDate ? new Date(issueBook.dueDate) : null} 
              onChange={(e) => setIssueBook({ ...issueBook, dueDate: e.value ? e.value.toISOString().split('T')[0] : '' })} 
              dateFormat="yy-mm-dd"
              showIcon
              className="border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl w-full"
            />
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
