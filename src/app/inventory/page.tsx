'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  FolderPlus,
  Package,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
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
} from '@/components/ops/OpsKit';
import { Member, MemberPicker } from '@/components/ops/MemberPicker';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useCheckinItem,
  useCheckoutItem,
  useCreateInventoryCategory,
  useCreateInventoryItem,
  useInventoryCategories,
  useInventoryCheckouts,
  useInventoryItems,
  useRetireInventoryItem,
  useUpdateInventoryItem,
} from '@/hooks/queries/useInventory';
import { useStudentsList } from '@/hooks/queries/useStudents';
import { useStaffLite } from '@/hooks/queries/useStaffLite';
import { asList } from '@/lib/utils';

const blankItem = {
  name: '',
  sku: '',
  categoryId: '',
  quantity: '1',
  unit: 'pcs',
  location: '',
  status: 'ACTIVE',
};
const statusVariant = (s: string) =>
  s === 'ACTIVE' ? 'success' : s === 'DAMAGED' ? 'danger' : 'warning';

export default function InventoryPage() {
  // Every inventory mutation requires inventory:create (school admin); lab assistants hold inventory:read only.
  const { can } = usePermissions();
  const canManage = can('inventory:create');

  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const itemsQ = useInventoryItems(categoryFilter || undefined);
  const categoriesQ = useInventoryCategories();
  const checkoutsQ = useInventoryCheckouts();
  const students = useStudentsList(1, 100);
  const staffLite = useStaffLite();

  const createItemM = useCreateInventoryItem();
  const updateItemM = useUpdateInventoryItem();
  const retireM = useRetireInventoryItem();
  const createCategoryM = useCreateInventoryCategory();
  const checkoutM = useCheckoutItem();
  const checkinM = useCheckinItem();

  const items = itemsQ.data ?? [];
  const categories = categoriesQ.data ?? [];
  const checkouts = checkoutsQ.data ?? [];
  const filtered = items.filter(
    (i) => !search || `${i.name} ${i.sku ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const nameOf = useMemo(() => {
    const m = new Map<string, string>();
    asList<any>(students.data).forEach((s) => m.set(s.id, s.name));
    (staffLite.data ?? []).forEach((s) => m.set(s.id, s.name));
    return (id: string) => m.get(id) ?? `Member ${id.slice(0, 6)}`;
  }, [students.data, staffLite.data]);

  const [itemOpen, setItemOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ ...blankItem });
  const [toRetire, setToRetire] = useState<any | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [checkoutFor, setCheckoutFor] = useState<any | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [co, setCo] = useState({ quantity: '1', expectedReturn: '', notes: '' });
  const [checkin, setCheckin] = useState<any | null>(null);
  const [checkinLost, setCheckinLost] = useState(false);
  const [checkinNotes, setCheckinNotes] = useState('');

  const closeItem = () => {
    setItemOpen(false);
    setEditing(null);
    setForm({ ...blankItem });
  };
  const startEdit = (i: any) => {
    setEditing(i);
    setForm({
      name: i.name,
      sku: i.sku ?? '',
      categoryId: i.categoryId,
      quantity: String(i.quantity),
      unit: i.unit ?? 'pcs',
      location: i.location ?? '',
      status: i.status,
    });
    setItemOpen(true);
  };
  const saveItem = () => {
    const quantity = Number(form.quantity);
    if (!form.name.trim()) return toast.error('Item name is required.');
    if (!form.categoryId) return toast.error('Choose a category (create one first if none exist).');
    if (!Number.isFinite(quantity) || quantity < 0)
      return toast.error('Quantity cannot be negative.');
    const payload = {
      name: form.name.trim(),
      categoryId: form.categoryId,
      sku: form.sku.trim() || undefined,
      quantity,
      unit: form.unit.trim() || undefined,
      location: form.location.trim() || undefined,
      status: form.status,
    };
    const done = {
      onSuccess: () => {
        toast.success(editing ? 'Item updated.' : 'Item added.');
        closeItem();
      },
      onError: (e: any) => toast.error(errMsg(e, 'Could not save the item.')),
    };
    if (editing) updateItemM.mutate({ id: editing.id, data: payload }, done);
    else createItemM.mutate(payload, done);
  };

  const saveCategory = () => {
    if (!categoryForm.name.trim()) return toast.error('Category name is required.');
    createCategoryM.mutate(
      { name: categoryForm.name.trim(), description: categoryForm.description.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Category created.');
          setCategoryOpen(false);
          setCategoryForm({ name: '', description: '' });
        },
        onError: (e: any) => toast.error(errMsg(e, 'Could not create the category.')),
      }
    );
  };

  const submitCheckout = () => {
    const quantity = Number(co.quantity);
    if (!member) return toast.error('Pick who is taking the item.');
    if (!Number.isInteger(quantity) || quantity < 1)
      return toast.error('Quantity must be at least 1.');
    if (quantity > checkoutFor.quantity)
      return toast.error(`Only ${checkoutFor.quantity} in stock.`);
    checkoutM.mutate(
      {
        itemId: checkoutFor.id,
        issuedToId: member.id,
        issuedType: member.kind === 'Student' ? 'STUDENT' : 'STAFF',
        quantity,
        expectedReturn: co.expectedReturn || undefined,
        notes: co.notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Item checked out.');
          setCheckoutFor(null);
          setMember(null);
          setCo({ quantity: '1', expectedReturn: '', notes: '' });
        },
        onError: (e: any) => toast.error(errMsg(e, 'Could not check the item out.')),
      }
    );
  };

  const submitCheckin = () => {
    checkinM.mutate(
      { id: checkin.id, lost: checkinLost, notes: checkinNotes.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(checkinLost ? 'Marked as lost.' : 'Item checked back in.');
          setCheckin(null);
          setCheckinLost(false);
          setCheckinNotes('');
        },
        onError: (e: any) => toast.error(errMsg(e, 'Could not check the item in.')),
      }
    );
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Inventory & Assets" />
      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Package className="w-6 h-6 text-brand" /> Inventory &amp; Assets
            </h1>
            <p className="text-sm text-zinc-500">
              {canManage
                ? 'Stock, categories and item checkouts'
                : 'Stock levels and checkouts (view only)'}
            </p>
          </div>
          {canManage && (
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCategoryOpen(true)}>
                <FolderPlus className="w-4 h-4 mr-2" /> New Category
              </Button>
              <Button onClick={() => setItemOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </div>
          )}
        </div>

        <TabBar tabs={['Items', 'Checkouts']} active={tab} onChange={setTab} />

        <Panel>
          {tab === 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-3 flex-wrap">
                <div className="relative w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input
                    className="pl-9 h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name or SKU..."
                  />
                </div>
                <div className="w-56">
                  <Select
                    value={categoryFilter}
                    options={[
                      { label: 'All categories', value: '' },
                      ...categories.map((c) => ({ label: c.name, value: c.id })),
                    ]}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  />
                </div>
              </div>
              {itemsQ.isPending ? (
                <Spinner label="Loading items..." />
              ) : itemsQ.error ? (
                <ErrorState error={itemsQ.error} onRetry={() => itemsQ.refetch()} />
              ) : filtered.length === 0 ? (
                <EmptyState
                  title="No items found"
                  hint={canManage ? 'Add an item to start tracking stock.' : undefined}
                />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">In stock</th>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3">Status</th>
                        {canManage && <th className="px-4 py-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {filtered.map((i) => (
                        <tr key={i.id}>
                          <td className="px-4 py-3 font-semibold">{i.name}</td>
                          <td className="px-4 py-3 font-mono text-zinc-500">{i.sku ?? '—'}</td>
                          <td className="px-4 py-3">{i.category?.name ?? '—'}</td>
                          <td className="px-4 py-3 font-mono">
                            {i.quantity} {i.unit}
                          </td>
                          <td className="px-4 py-3">{i.location ?? '—'}</td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant(i.status)}>{i.status}</Badge>
                          </td>
                          {canManage && (
                            <td className="px-4 py-3 text-right">
                              {i.status === 'ACTIVE' && i.quantity > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setCheckoutFor(i);
                                    setMember(null);
                                    setCo({ quantity: '1', expectedReturn: '', notes: '' });
                                  }}
                                >
                                  <Send className="w-3.5 h-3.5 mr-1" /> Checkout
                                </Button>
                              )}
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                aria-label="Edit item"
                                onClick={() => startEdit(i)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              {i.status !== 'RETIRED' && (
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  aria-label="Retire item"
                                  onClick={() => setToRetire(i)}
                                >
                                  <Trash2 className="w-4 h-4 text-rose-500" />
                                </Button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 1 &&
            (checkoutsQ.isPending ? (
              <Spinner label="Loading checkouts..." />
            ) : checkoutsQ.error ? (
              <ErrorState error={checkoutsQ.error} onRetry={() => checkoutsQ.refetch()} />
            ) : checkouts.length === 0 ? (
              <EmptyState title="No checkouts recorded" />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800/80">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Issued to</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Out</th>
                      <th className="px-4 py-3">Expected back</th>
                      <th className="px-4 py-3">Status</th>
                      {canManage && <th className="px-4 py-3 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                    {checkouts.map((c) => (
                      <tr key={c.id}>
                        <td className="px-4 py-3 font-semibold">{c.item?.name}</td>
                        <td className="px-4 py-3">
                          {nameOf(c.issuedToId)}{' '}
                          <span className="text-zinc-400">({c.issuedType.toLowerCase()})</span>
                        </td>
                        <td className="px-4 py-3 font-mono">{c.quantity}</td>
                        <td className="px-4 py-3 font-mono">{fmtDate(c.checkoutDate)}</td>
                        <td className="px-4 py-3 font-mono">{fmtDate(c.expectedReturn)}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              c.status === 'ISSUED'
                                ? 'warning'
                                : c.status === 'LOST'
                                  ? 'danger'
                                  : 'success'
                            }
                          >
                            {c.status}
                          </Badge>
                        </td>
                        {canManage && (
                          <td className="px-4 py-3 text-center">
                            {c.status === 'ISSUED' && (
                              <Button size="sm" variant="outline" onClick={() => setCheckin(c)}>
                                <ArrowDownToLine className="w-3.5 h-3.5 mr-1" /> Check in
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
        </Panel>
      </div>

      <Dialog isOpen={itemOpen} onClose={closeItem} title={editing ? 'Edit Item' : 'Add Item'}>
        <div className="flex flex-col gap-4 py-2">
          <Field label="Name *">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="SKU">
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </Field>
            <Field label="Category *">
              <Select
                value={form.categoryId}
                options={[
                  { label: 'Select...', value: '' },
                  ...categories.map((c) => ({ label: c.name, value: c.id })),
                ]}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              />
            </Field>
            <Field label="Quantity *">
              <Input
                type="number"
                min={0}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </Field>
            <Field label="Unit">
              <Input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </Field>
            <Field label="Location">
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                options={[
                  { label: 'Active', value: 'ACTIVE' },
                  { label: 'Damaged', value: 'DAMAGED' },
                  { label: 'Retired', value: 'RETIRED' },
                ]}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeItem}>
            Cancel
          </Button>
          <Button onClick={saveItem} isLoading={createItemM.isPending || updateItemM.isPending}>
            {editing ? 'Save changes' : 'Add item'}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog isOpen={categoryOpen} onClose={() => setCategoryOpen(false)} title="New Category">
        <div className="flex flex-col gap-4 py-2">
          <Field label="Name *">
            <Input
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              placeholder="e.g. Lab Equipment"
            />
          </Field>
          <Field label="Description">
            <Input
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCategoryOpen(false)}>
            Cancel
          </Button>
          <Button onClick={saveCategory} isLoading={createCategoryM.isPending}>
            Create
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        isOpen={!!checkoutFor}
        onClose={() => setCheckoutFor(null)}
        title={`Checkout: ${checkoutFor?.name ?? ''}`}
      >
        <div className="flex flex-col gap-4 py-2">
          <Field label="Issue to *">
            <MemberPicker value={member} onChange={setMember} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Quantity (max ${checkoutFor?.quantity ?? 0})`}>
              <Input
                type="number"
                min={1}
                max={checkoutFor?.quantity}
                value={co.quantity}
                onChange={(e) => setCo({ ...co, quantity: e.target.value })}
              />
            </Field>
            <Field label="Expected return">
              <Input
                type="date"
                value={co.expectedReturn}
                onChange={(e) => setCo({ ...co, expectedReturn: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Notes">
            <Input value={co.notes} onChange={(e) => setCo({ ...co, notes: e.target.value })} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCheckoutFor(null)}>
            Cancel
          </Button>
          <Button onClick={submitCheckout} isLoading={checkoutM.isPending}>
            Check out
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog isOpen={!!checkin} onClose={() => setCheckin(null)} title="Check item in">
        <div className="flex flex-col gap-4 py-2">
          <p className="text-sm">
            {checkin?.item?.name} × {checkin?.quantity} —{' '}
            {checkin ? nameOf(checkin.issuedToId) : ''}
          </p>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={checkinLost}
              onChange={(e) => setCheckinLost(e.target.checked)}
            />
            Mark as lost (stock is not restored)
          </label>
          <Field label="Notes">
            <Input value={checkinNotes} onChange={(e) => setCheckinNotes(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCheckin(null)}>
            Cancel
          </Button>
          <Button onClick={submitCheckin} isLoading={checkinM.isPending}>
            {checkinLost ? 'Mark lost' : 'Check in'}
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog
        open={!!toRetire}
        title="Retire item"
        message={`Retire "${toRetire?.name ?? ''}"? Its checkout history is kept.`}
        confirmLabel="Retire"
        loading={retireM.isPending}
        onConfirm={() =>
          toRetire &&
          retireM.mutate(toRetire.id, {
            onSuccess: () => {
              toast.success('Item retired.');
              setToRetire(null);
            },
            onError: (e: any) => {
              toast.error(errMsg(e, 'Could not retire the item.'));
              setToRetire(null);
            },
          })
        }
        onClose={() => setToRetire(null)}
      />
    </DashboardLayout>
  );
}
