'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  BookmarkPlus,
  BookOpen,
  CheckCircle,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  ConfirmDialog,
  DialogFooter,
  EmptyState,
  ErrorState,
  Field,
  Panel,
  Spinner,
  TabBar,
  errMsg,
  fmtDate,
  inr,
  tabFromLocation,
} from '@/components/ops/OpsKit';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useActiveIssues,
  useBooksList,
  useCreateBook,
  useDeleteBook,
  useIssueBook,
  useLibraryFines,
  useMemberHistory,
  usePayFine,
  useReturnBook,
  useUpdateBook,
  useWaiveFine,
} from '@/hooks/queries/useLibrary';
import { useStudentsList } from '@/hooks/queries/useStudents';
import { useStaffLite } from '@/hooks/queries/useStaffLite';
import { asList } from '@/lib/utils';
import { Member, MemberPicker } from '@/components/ops/MemberPicker';

type TabKey = 'books' | 'issues' | 'fines' | 'members';
const blankBook = {
  title: '',
  author: '',
  isbn: '',
  publisher: '',
  category: '',
  totalCopies: '1',
  shelfNo: '',
};

function MemberHistory({ member }: { member: Member }) {
  const { data, isPending, error, refetch } = useMemberHistory(member.id);
  if (isPending) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  const rows = data ?? [];
  if (rows.length === 0) return <EmptyState title="No borrowing history" />;
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
      <table className="w-full text-left text-xs">
        <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <tr>
            <th className="px-4 py-3">Book</th>
            <th className="px-4 py-3">Issued</th>
            <th className="px-4 py-3">Due</th>
            <th className="px-4 py-3">Returned</th>
            <th className="px-4 py-3">Fine</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
          {rows.map((r: any) => (
            <tr key={r.id}>
              <td className="px-4 py-3 font-semibold">
                {r.book?.title}
                <span className="block text-[10px] font-normal text-zinc-400">
                  {r.book?.author}
                </span>
              </td>
              <td className="px-4 py-3 font-mono">{fmtDate(r.issueDate)}</td>
              <td className="px-4 py-3 font-mono">{fmtDate(r.dueDate)}</td>
              <td className="px-4 py-3">
                {r.returnDate ? fmtDate(r.returnDate) : <Badge variant="warning">On loan</Badge>}
              </td>
              <td className="px-4 py-3 font-mono">
                {Number(r.fineAmount) > 0
                  ? `${inr(r.fineAmount)} ${r.finePaid ? '(paid)' : r.fineWaived ? '(waived)' : '(due)'}`
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function LibraryPage() {
  const { can, isAdmin, isRole } = usePermissions();
  const isLibrarian = isAdmin || isRole('librarian');
  const canCreate = can('library:create');
  const canUpdate = can('library:update');
  const canDelete = can('library:delete');
  const isAccountant = isRole('accountant');
  const isTeacher = isRole('teacher');

  // GET /library/issues/active and /overdue are admin/librarian only; /fines also admits the accountant.
  const tabs = useMemo(() => {
    const t: { key: TabKey; label: string }[] = [];
    if (!isAccountant) t.push({ key: 'books', label: 'Book Directory' });
    if (isLibrarian) t.push({ key: 'issues', label: 'Active Loans' });
    if (isLibrarian || isAccountant) t.push({ key: 'fines', label: 'Fines & Overdues' });
    if (isLibrarian || isTeacher) t.push({ key: 'members', label: 'Member Lookup' });
    return t;
  }, [isAccountant, isLibrarian, isTeacher]);

  const [tabKey, setTabKey] = useState<TabKey>('books');
  useEffect(() => {
    const idx = tabFromLocation({ books: 0, issues: 1, fines: 2, members: 3 });
    setTabKey((['books', 'issues', 'fines', 'members'] as TabKey[])[idx]);
  }, []);
  const activeKey: TabKey = tabs.some((t) => t.key === tabKey) ? tabKey : (tabs[0]?.key ?? 'books');

  const [now] = useState(() => Date.now());
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const books = useBooksList(page, 12, search || undefined);
  const bookList = asList<any>(books.data);
  const bookMeta = (books.data as any)?.meta;

  const active = useActiveIssues(isLibrarian && activeKey === 'issues');
  const fines = useLibraryFines((isLibrarian || isAccountant) && activeKey === 'fines');

  // Names for loan rows (issuedTo is a student or staff id).
  const students = useStudentsList(1, 100);
  const staffLite = useStaffLite();
  const nameOf = useMemo(() => {
    const m = new Map<string, string>();
    asList<any>(students.data).forEach((s) => m.set(s.id, s.name));
    (staffLite.data ?? []).forEach((s) => m.set(s.id, s.name));
    return (id: string) => m.get(id) ?? `Member ${id.slice(0, 6)}`;
  }, [students.data, staffLite.data]);

  const createM = useCreateBook();
  const updateM = useUpdateBook();
  const deleteM = useDeleteBook();
  const issueM = useIssueBook();
  const returnM = useReturnBook();
  const payM = usePayFine();
  const waiveM = useWaiveFine();

  const [bookOpen, setBookOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [bookForm, setBookForm] = useState({ ...blankBook });
  const [toDelete, setToDelete] = useState<any | null>(null);
  const [issueFor, setIssueFor] = useState<any | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [returning, setReturning] = useState<any | null>(null);
  const [fineAmt, setFineAmt] = useState('0');
  const [waiving, setWaiving] = useState<any | null>(null);
  const [waiveNote, setWaiveNote] = useState('');
  const [lookup, setLookup] = useState<Member | null>(null);

  const closeBook = () => {
    setBookOpen(false);
    setEditing(null);
    setBookForm({ ...blankBook });
  };
  const startEdit = (b: any) => {
    setEditing(b);
    setBookForm({
      title: b.title ?? '',
      author: b.author ?? '',
      isbn: b.isbn ?? '',
      publisher: b.publisher ?? '',
      category: b.category ?? '',
      totalCopies: String(b.totalCopies ?? 1),
      shelfNo: b.shelfNo ?? '',
    });
    setBookOpen(true);
  };

  const saveBook = () => {
    if (!bookForm.title.trim() || !bookForm.author.trim())
      return toast.error('Title and author are required.');
    const copies = Number(bookForm.totalCopies);
    if (!Number.isInteger(copies) || copies < 1)
      return toast.error('Copies must be a whole number of at least 1.');
    const payload = {
      title: bookForm.title.trim(),
      author: bookForm.author.trim(),
      isbn: bookForm.isbn.trim() || undefined,
      publisher: bookForm.publisher.trim() || undefined,
      category: bookForm.category.trim() || undefined,
      shelfNo: bookForm.shelfNo.trim() || undefined,
      totalCopies: copies,
    };
    const done = {
      onSuccess: () => {
        toast.success(editing ? 'Book updated.' : 'Book added to catalogue.');
        closeBook();
      },
      onError: (e: any) => toast.error(errMsg(e, 'Could not save the book.')),
    };
    if (editing) updateM.mutate({ id: editing.id, data: payload }, done);
    else createM.mutate(payload, done);
  };

  const submitIssue = () => {
    if (!member) return toast.error('Pick who the book is being issued to.');
    if (!dueDate) return toast.error('Return due date is required.');
    issueM.mutate(
      { bookId: issueFor.id, issuedTo: member.id, dueDate },
      {
        onSuccess: () => {
          toast.success('Book issued.');
          setIssueFor(null);
          setMember(null);
          setDueDate('');
        },
        onError: (e: any) => toast.error(errMsg(e, 'Could not issue the book.')),
      }
    );
  };

  const submitReturn = () => {
    const fine = Number(fineAmt) || 0;
    if (fine < 0) return toast.error('Fine cannot be negative.');
    returnM.mutate(
      { issueId: returning.id, fineAmount: fine },
      {
        onSuccess: () => {
          toast.success('Book marked as returned.');
          setReturning(null);
          setFineAmt('0');
        },
        onError: (e: any) => toast.error(errMsg(e, 'Could not record the return.')),
      }
    );
  };

  const avail = (b: any) => Number(b.available ?? 0) > 0;
  const hasActions = canCreate || canUpdate || canDelete;
  const bookActions = (b: any) => (
    <div className="flex gap-1 justify-end items-center">
      {canCreate && avail(b) && (
        <Button
          size="sm"
          onClick={() => {
            setIssueFor(b);
            setMember(null);
            setDueDate('');
          }}
        >
          <BookmarkPlus className="w-3.5 h-3.5 mr-1" /> Issue
        </Button>
      )}
      {canUpdate && (
        <Button size="icon-sm" variant="ghost" aria-label="Edit book" onClick={() => startEdit(b)}>
          <Pencil className="w-4 h-4" />
        </Button>
      )}
      {canDelete && (
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Delete book"
          onClick={() => setToDelete(b)}
        >
          <Trash2 className="w-4 h-4 text-rose-500" />
        </Button>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Library & Resources" />
      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand" /> Library Catalog &amp; Loans
            </h1>
            <p className="text-sm text-zinc-500">
              {canCreate
                ? 'Catalogue books, register loans and process fines'
                : 'Browse the school library catalogue'}
            </p>
          </div>
          {canCreate && activeKey === 'books' && (
            <Button
              onClick={() => {
                setEditing(null);
                setBookForm({ ...blankBook });
                setBookOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Add New Book
            </Button>
          )}
        </div>

        <TabBar
          tabs={tabs.map((t) => t.label)}
          active={Math.max(
            0,
            tabs.findIndex((t) => t.key === activeKey)
          )}
          onChange={(i) => setTabKey(tabs[i].key)}
        />

        <Panel>
          {activeKey === 'books' && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="relative w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input
                    className="pl-9 h-9"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search title, author or ISBN..."
                  />
                </div>
                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                  <button
                    aria-label="Grid view"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-900 text-brand shadow-sm' : 'text-zinc-400'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    aria-label="Table view"
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-white dark:bg-zinc-900 text-brand shadow-sm' : 'text-zinc-400'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {books.isPending ? (
                <Spinner label="Loading directory..." />
              ) : books.error ? (
                <ErrorState error={books.error} onRetry={() => books.refetch()} />
              ) : bookList.length === 0 ? (
                <EmptyState title="No books found" />
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {bookList.map((b: any) => (
                    <div
                      key={b.id}
                      className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden flex flex-col justify-between bg-white dark:bg-zinc-900"
                    >
                      <div className="p-5 flex flex-col gap-1">
                        <h3 className="font-bold text-sm line-clamp-2">{b.title}</h3>
                        <p className="text-xs text-zinc-500">By {b.author}</p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-1">
                          ISBN {b.isbn || '—'}
                          {b.shelfNo ? ` · Shelf ${b.shelfNo}` : ''}
                        </p>
                      </div>
                      <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <Badge variant={avail(b) ? 'success' : 'warning'}>
                          {b.available}/{b.totalCopies} available
                        </Badge>
                        {bookActions(b)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Author</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">ISBN</th>
                        <th className="px-4 py-3">Availability</th>
                        {hasActions && <th className="px-4 py-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {bookList.map((b: any) => (
                        <tr key={b.id}>
                          <td className="px-4 py-3 font-semibold">{b.title}</td>
                          <td className="px-4 py-3">{b.author}</td>
                          <td className="px-4 py-3">{b.category ?? '—'}</td>
                          <td className="px-4 py-3 font-mono text-zinc-500">{b.isbn || '—'}</td>
                          <td className="px-4 py-3">
                            <Badge variant={avail(b) ? 'success' : 'warning'}>
                              {b.available}/{b.totalCopies} available
                            </Badge>
                          </td>
                          {hasActions && <td className="px-4 py-3">{bookActions(b)}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {bookMeta && bookMeta.totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 text-xs text-zinc-500">
                  <span>
                    Page {bookMeta.page} of {bookMeta.totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= bookMeta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeKey === 'issues' &&
            (active.isPending ? (
              <Spinner label="Loading active loans..." />
            ) : active.error ? (
              <ErrorState error={active.error} onRetry={() => active.refetch()} />
            ) : (active.data ?? []).length === 0 ? (
              <EmptyState title="No outstanding loans" />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800/80">
                    <tr>
                      <th className="px-4 py-3">Book</th>
                      <th className="px-4 py-3">Issued to</th>
                      <th className="px-4 py-3">Issued</th>
                      <th className="px-4 py-3">Due</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                    {(active.data ?? []).map((d: any) => {
                      const overdue = new Date(d.dueDate).getTime() < now;
                      return (
                        <tr key={d.id}>
                          <td className="px-4 py-3 font-semibold">{d.book?.title}</td>
                          <td className="px-4 py-3">{nameOf(d.issuedTo)}</td>
                          <td className="px-4 py-3 font-mono">{fmtDate(d.issueDate)}</td>
                          <td
                            className={`px-4 py-3 font-mono font-bold ${overdue ? 'text-rose-500' : ''}`}
                          >
                            {fmtDate(d.dueDate)}
                            {overdue && ' (overdue)'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {canUpdate && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReturning(d);
                                  setFineAmt('0');
                                }}
                              >
                                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Return
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}

          {activeKey === 'fines' &&
            (fines.isPending ? (
              <Spinner label="Loading fines..." />
            ) : fines.error ? (
              <ErrorState error={fines.error} onRetry={() => fines.refetch()} />
            ) : (fines.data?.issues ?? []).length === 0 ? (
              <EmptyState title="No outstanding fines" />
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Total outstanding: <b>{inr(fines.data?.total)}</b> across {fines.data?.count}{' '}
                  fine(s)
                </p>
                <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-4 py-3">Member</th>
                        <th className="px-4 py-3">Book</th>
                        <th className="px-4 py-3">Returned</th>
                        <th className="px-4 py-3">Fine</th>
                        {canUpdate && <th className="px-4 py-3 text-center">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {(fines.data?.issues ?? []).map((d: any) => (
                        <tr key={d.id}>
                          <td className="px-4 py-3 font-semibold">{nameOf(d.issuedTo)}</td>
                          <td className="px-4 py-3">{d.book?.title}</td>
                          <td className="px-4 py-3 font-mono">{fmtDate(d.returnDate)}</td>
                          <td className="px-4 py-3 font-mono font-bold">{inr(d.fineAmount)}</td>
                          {canUpdate && (
                            <td className="px-4 py-3 text-center">
                              <div className="flex gap-2 justify-center">
                                {isLibrarian && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setWaiving(d);
                                      setWaiveNote('');
                                    }}
                                  >
                                    Waive
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                  isLoading={payM.isPending && payM.variables === d.id}
                                  onClick={() =>
                                    payM.mutate(d.id, {
                                      onSuccess: () => toast.success('Fine recorded as paid.'),
                                      onError: (e: any) =>
                                        toast.error(errMsg(e, 'Could not record the payment.')),
                                    })
                                  }
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark paid
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

          {activeKey === 'members' && (
            <div className="flex flex-col gap-4 max-w-2xl">
              <p className="text-sm text-zinc-500">
                Look up a student or staff member to see everything they have borrowed.
              </p>
              <MemberPicker value={lookup} onChange={setLookup} />
              {lookup && <MemberHistory member={lookup} />}
            </div>
          )}
        </Panel>
      </div>

      <Dialog
        isOpen={bookOpen}
        onClose={closeBook}
        title={editing ? 'Edit Book' : 'Add Book to Catalogue'}
      >
        <div className="flex flex-col gap-4 py-2">
          <Field label="Title *">
            <Input
              value={bookForm.title}
              onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
            />
          </Field>
          <Field label="Author *">
            <Input
              value={bookForm.author}
              onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ISBN">
              <Input
                value={bookForm.isbn}
                onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
              />
            </Field>
            <Field label="Publisher">
              <Input
                value={bookForm.publisher}
                onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
              />
            </Field>
            <Field label="Category">
              <Input
                value={bookForm.category}
                onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
              />
            </Field>
            <Field label="Shelf no.">
              <Input
                value={bookForm.shelfNo}
                onChange={(e) => setBookForm({ ...bookForm, shelfNo: e.target.value })}
              />
            </Field>
            <Field label="Total copies *">
              <Input
                type="number"
                min={1}
                value={bookForm.totalCopies}
                onChange={(e) => setBookForm({ ...bookForm, totalCopies: e.target.value })}
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeBook}>
            Cancel
          </Button>
          <Button onClick={saveBook} isLoading={createM.isPending || updateM.isPending}>
            {editing ? 'Save changes' : 'Save book'}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        isOpen={!!issueFor}
        onClose={() => setIssueFor(null)}
        title={`Issue: ${issueFor?.title ?? ''}`}
      >
        <div className="flex flex-col gap-4 py-2">
          <Field label="Issue to *">
            <MemberPicker value={member} onChange={setMember} />
          </Field>
          <Field label="Return due date *">
            <Input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIssueFor(null)}>
            Cancel
          </Button>
          <Button onClick={submitIssue} isLoading={issueM.isPending}>
            Issue book
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog isOpen={!!returning} onClose={() => setReturning(null)} title="Record return">
        <div className="flex flex-col gap-4 py-2">
          <p className="text-sm">
            {returning?.book?.title} — {returning ? nameOf(returning.issuedTo) : ''}
          </p>
          {returning && new Date(returning.dueDate).getTime() < now && (
            <p className="text-xs text-rose-600">
              This book is overdue (due {fmtDate(returning.dueDate)}). Enter a late fine if one
              applies.
            </p>
          )}
          <Field label="Late fine (₹)">
            <Input
              type="number"
              min={0}
              value={fineAmt}
              onChange={(e) => setFineAmt(e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setReturning(null)}>
            Cancel
          </Button>
          <Button onClick={submitReturn} isLoading={returnM.isPending}>
            Confirm return
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog isOpen={!!waiving} onClose={() => setWaiving(null)} title="Waive fine">
        <Field label="Reason">
          <Input
            value={waiveNote}
            onChange={(e) => setWaiveNote(e.target.value)}
            placeholder="Why is this fine being waived?"
          />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => setWaiving(null)}>
            Cancel
          </Button>
          <Button
            isLoading={waiveM.isPending}
            onClick={() =>
              waiveM.mutate(
                { id: waiving.id, note: waiveNote.trim() || undefined },
                {
                  onSuccess: () => {
                    toast.success('Fine waived.');
                    setWaiving(null);
                  },
                  onError: (e: any) => toast.error(errMsg(e, 'Could not waive the fine.')),
                }
              )
            }
          >
            Waive fine
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete book"
        message={`Delete "${toDelete?.title ?? ''}" from the catalogue? Books with loan history cannot be deleted — set copies to 0 instead.`}
        loading={deleteM.isPending}
        onConfirm={() =>
          toDelete &&
          deleteM.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success('Book deleted.');
              setToDelete(null);
            },
            onError: (e: any) => {
              toast.error(errMsg(e, 'Could not delete the book.'));
              setToDelete(null);
            },
          })
        }
        onClose={() => setToDelete(null)}
      />
    </DashboardLayout>
  );
}
