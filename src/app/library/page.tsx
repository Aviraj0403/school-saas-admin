'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { useBooksList, useCreateBook, useIssueBook, useReturnBook, useActiveIssues } from '@/hooks/queries/useLibrary';

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [showAddBookDialog, setShowAddBookDialog] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);

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

  const statusBodyTemplate = (rowData: any) => {
    const status = rowData.status || 'AVAILABLE';
    return <Tag value={status} severity={status === 'AVAILABLE' ? 'success' : 'warning'} />;
  };

  const actionsBodyTemplate = (rowData: any) => {
    if (rowData.status === 'AVAILABLE') {
      return (
        <Button 
          label="Issue" 
          icon="pi pi-bookmark" 
          size="small" 
          className="bg-primary text-white p-1 px-2 text-xs"
          onClick={() => {
            setIssueBook((prev) => ({ ...prev, bookId: rowData.id }));
            setShowIssueDialog(true);
          }}
        />
      );
    }
    return <span>—</span>;
  };

  const issueActionsBodyTemplate = (rowData: any) => {
    return (
      <Button 
        label="Return" 
        icon="pi pi-replay" 
        size="small" 
        severity="success"
        className="bg-green-600 text-white p-1 px-2 text-xs"
        onClick={() => handleReturnBook(rowData.id)}
      />
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Library Management</h1>
            <p className="text-gray-500 mt-1">Manage physical book catalogs, issue records, and track outstanding returns.</p>
          </div>
          <Button 
            label="Add New Book" 
            icon="pi pi-plus" 
            className="bg-primary text-white p-2 px-4" 
            onClick={() => setShowAddBookDialog(true)} 
          />
        </div>

        <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
          <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
            
            <TabPanel header="Book Directory">
              <div className="flex justify-between items-center mb-4 mt-3">
                <span className="p-input-icon-left w-full md:w-80">
                  <i className="pi pi-search" />
                  <InputText 
                    value={lazyState.search} 
                    onChange={handleSearchChange} 
                    placeholder="Search books by title, author, or ISBN..." 
                    className="w-full pl-8 py-2 border border-gray-200 rounded-md"
                  />
                </span>
              </div>

              <DataTable 
                value={books?.data?.items || []} 
                lazy 
                paginator 
                first={lazyState.first}
                rows={lazyState.rows}
                totalRecords={books?.data?.meta.total || 0}
                onPage={onPage}
                loading={loadingBooks} 
                className="p-datatable-sm" 
                emptyMessage="No books cataloged yet."
              >
                <Column field="title" header="Book Title"></Column>
                <Column field="author" header="Author"></Column>
                <Column field="isbn" header="ISBN"></Column>
                <Column field="status" header="Status" body={statusBodyTemplate}></Column>
                <Column header="Actions" body={actionsBodyTemplate}></Column>
              </DataTable>
            </TabPanel>

            <TabPanel header="Currently Issued Books">
              <DataTable 
                value={activeIssues || []} 
                loading={loadingIssues} 
                className="p-datatable-sm mt-3" 
                emptyMessage="No books currently issued."
              >
                <Column field="bookTitle" header="Book Title"></Column>
                <Column field="studentName" header="Issued To (Student)"></Column>
                <Column field="issueDate" header="Issue Date"></Column>
                <Column field="dueDate" header="Due Date"></Column>
                <Column header="Actions" body={issueActionsBodyTemplate}></Column>
              </DataTable>
            </TabPanel>

          </TabView>
        </Card>

        {/* Dialog: Add Book */}
        <Dialog 
          header="Add Book to Catalog" 
          visible={showAddBookDialog} 
          style={{ width: '400px' }} 
          modal 
          onHide={() => setShowAddBookDialog(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button label="Cancel" icon="pi pi-times" onClick={() => setShowAddBookDialog(false)} className="p-button-text p-2" />
              <Button 
                label="Add Book" 
                icon="pi pi-check" 
                onClick={handleCreateBook} 
                loading={createBookMutation.isPending}
                className="bg-primary text-white p-2 px-4" 
              />
            </div>
          }
        >
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Book Title</label>
              <InputText 
                value={newBook.title} 
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })} 
                placeholder="e.g. Concept of Physics Vol. 1"
                className="p-2 border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Author Name</label>
              <InputText 
                value={newBook.author} 
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })} 
                placeholder="e.g., H.C. Verma"
                className="p-2 border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">ISBN Code</label>
              <InputText 
                value={newBook.isbn} 
                onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })} 
                placeholder="e.g., 978-0131103627"
                className="p-2 border border-gray-200 rounded-md"
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
          footer={
            <div className="flex justify-end gap-2">
              <Button label="Cancel" icon="pi pi-times" onClick={() => setShowIssueDialog(false)} className="p-button-text p-2" />
              <Button 
                label="Issue Book" 
                icon="pi pi-check" 
                onClick={handleIssueBook} 
                loading={issueBookMutation.isPending}
                className="bg-primary text-white p-2 px-4" 
              />
            </div>
          }
        >
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Student Admission No / ID</label>
              <InputText 
                value={issueBook.studentId} 
                onChange={(e) => setIssueBook({ ...issueBook, studentId: e.target.value })} 
                placeholder="e.g. stud-uuid"
                className="p-2 border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-gray-700 dark:text-gray-300">Return Due Date</label>
              <Calendar 
                value={issueBook.dueDate ? new Date(issueBook.dueDate) : null} 
                onChange={(e) => setIssueBook({ ...issueBook, dueDate: e.value ? e.value.toISOString().split('T')[0] : '' })} 
                dateFormat="yy-mm-dd"
                showIcon
                className="border border-gray-200 rounded-md"
              />
            </div>
          </div>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
