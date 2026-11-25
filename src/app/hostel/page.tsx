'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Building, LogOut, Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/StatCard';
import { AcademicYearSelect } from '@/components/academics/AcademicYearSelect';
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
  tabFromLocation,
} from '@/components/ops/OpsKit';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useAdmitBoarder,
  useAllBoarders,
  useAssignWarden,
  useCreateHostel,
  useCreateHostelRoom,
  useDeleteHostel,
  useDeleteHostelRoom,
  useDischargeBoarder,
  useHostelDashboard,
  useHostelRooms,
  useHostels,
  useUpdateHostel,
  useUpdateHostelRoom,
  useWardens,
} from '@/hooks/queries/useHostel';
import { useStaffLite } from '@/hooks/queries/useStaffLite';
import { useClasses } from '@/hooks/queries/useAcademics';
import { useStudentsList } from '@/hooks/queries/useStudents';
import { asList } from '@/lib/utils';

const HOSTEL_TYPES = [
  { label: 'Boys hostel', value: 'boys' },
  { label: 'Girls hostel', value: 'girls' },
  { label: 'Mixed residence', value: 'mixed' },
];
const ROOM_TYPES = [
  { label: 'Shared', value: 'shared' },
  { label: 'Single', value: 'single' },
  { label: 'Double', value: 'double' },
];
const blankHostel = { name: '', type: 'boys', capacity: '', wardenPhone: '', address: '' };
const blankRoom = { roomNo: '', floor: '0', capacity: '4', type: 'shared' };

export default function HostelPage() {
  // Every hostel route is school_admin only on the backend.
  const { isAdmin } = usePermissions();
  const [tab, setTab] = useState(0);
  useEffect(() => {
    setTab(tabFromLocation({ rooms: 0, allocations: 1, wardens: 2 }));
  }, []);
  const switchTab = (i: number) => {
    setTab(i);
    window.history.pushState({}, '', `/hostel/${['rooms', 'allocations', 'wardens'][i]}`);
  };

  const dashboard = useHostelDashboard();
  const hostelsQ = useHostels();
  const hostels = useMemo(() => hostelsQ.data ?? [], [hostelsQ.data]);
  const boardersQ = useAllBoarders();
  const wardensQ = useWardens();
  const staffQ = useStaffLite();

  const [selectedId, setSelectedId] = useState('');
  const selected = hostels.find((h: any) => h.id === selectedId) ?? null;
  const roomsQ = useHostelRooms(selectedId);
  const rooms = roomsQ.data ?? [];

  const createHostelM = useCreateHostel();
  const updateHostelM = useUpdateHostel();
  const deleteHostelM = useDeleteHostel();
  const createRoomM = useCreateHostelRoom();
  const updateRoomM = useUpdateHostelRoom();
  const deleteRoomM = useDeleteHostelRoom();
  const admitM = useAdmitBoarder();
  const dischargeM = useDischargeBoarder();
  const wardenM = useAssignWarden();

  const [hostelOpen, setHostelOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState<any | null>(null);
  const [hostelForm, setHostelForm] = useState({ ...blankHostel });
  const [hostelToDelete, setHostelToDelete] = useState<any | null>(null);

  const [roomOpen, setRoomOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [roomForm, setRoomForm] = useState({ ...blankRoom });
  const [roomToDelete, setRoomToDelete] = useState<any | null>(null);

  const [admitOpen, setAdmitOpen] = useState(false);
  const [admit, setAdmit] = useState({
    classId: '',
    studentId: '',
    hostelId: '',
    roomId: '',
    academicYearId: '',
  });
  const [toDischarge, setToDischarge] = useState<any | null>(null);

  const [wardenFor, setWardenFor] = useState<any | null>(null);
  const [wardenId, setWardenId] = useState('');
  const [wardenPhone, setWardenPhone] = useState('');

  const { data: classesData } = useClasses(1, 100);
  const classes = asList<any>(classesData);
  const { data: studentsData } = useStudentsList(1, 100, undefined, admit.classId || undefined);
  const students = asList<any>(studentsData);
  const admitRooms = useHostelRooms(admit.hostelId);

  const totalCapacity = useMemo(
    () => hostels.reduce((a: number, h: any) => a + Number(h.capacity || 0), 0),
    [hostels]
  );

  const closeHostel = () => {
    setHostelOpen(false);
    setEditingHostel(null);
    setHostelForm({ ...blankHostel });
  };
  const startEditHostel = (h: any) => {
    setEditingHostel(h);
    setHostelForm({
      name: h.name,
      type: h.type ?? 'boys',
      capacity: String(h.capacity),
      wardenPhone: h.wardenPhone ?? '',
      address: h.address ?? '',
    });
    setHostelOpen(true);
  };
  const saveHostel = () => {
    const capacity = Number(hostelForm.capacity);
    if (!hostelForm.name.trim()) return toast.error('Hostel name is required.');
    if (!Number.isInteger(capacity) || capacity < 1)
      return toast.error('Capacity must be a whole number of at least 1.');
    const payload = {
      name: hostelForm.name.trim(),
      type: hostelForm.type as any,
      capacity,
      address: hostelForm.address.trim() || undefined,
      ...(editingHostel ? {} : { wardenPhone: hostelForm.wardenPhone.trim() || undefined }),
    };
    const done = {
      onSuccess: () => {
        toast.success(editingHostel ? 'Hostel updated.' : 'Hostel block added.');
        closeHostel();
      },
      onError: (e: any) => toast.error(errMsg(e, 'Could not save the hostel.')),
    };
    if (editingHostel) updateHostelM.mutate({ id: editingHostel.id, data: payload }, done);
    else createHostelM.mutate(payload, done);
  };

  const closeRoom = () => {
    setRoomOpen(false);
    setEditingRoom(null);
    setRoomForm({ ...blankRoom });
  };
  const startEditRoom = (r: any) => {
    setEditingRoom(r);
    setRoomForm({
      roomNo: r.roomNo,
      floor: String(r.floor ?? 0),
      capacity: String(r.capacity),
      type: r.type ?? 'shared',
    });
    setRoomOpen(true);
  };
  const saveRoom = () => {
    const capacity = Number(roomForm.capacity);
    if (!roomForm.roomNo.trim()) return toast.error('Room number is required.');
    if (!Number.isInteger(capacity) || capacity < 1)
      return toast.error('Capacity must be at least 1 bed.');
    const payload = {
      roomNo: roomForm.roomNo.trim(),
      floor: Number(roomForm.floor) || 0,
      capacity,
      type: roomForm.type as any,
    };
    const done = {
      onSuccess: () => {
        toast.success(editingRoom ? 'Room updated.' : 'Room added.');
        closeRoom();
      },
      onError: (e: any) => toast.error(errMsg(e, 'Could not save the room.')),
    };
    if (editingRoom) updateRoomM.mutate({ roomId: editingRoom.id, data: payload }, done);
    else createRoomM.mutate({ hostelId: selectedId, data: payload }, done);
  };

  const submitAdmit = () => {
    if (!admit.studentId || !admit.roomId || !admit.academicYearId)
      return toast.error('Student, room and academic year are required.');
    admitM.mutate(
      { studentId: admit.studentId, roomId: admit.roomId, academicYearId: admit.academicYearId },
      {
        onSuccess: () => {
          toast.success('Student admitted to the hostel room.');
          setAdmitOpen(false);
          setAdmit({ classId: '', studentId: '', hostelId: '', roomId: '', academicYearId: '' });
        },
        onError: (e: any) => toast.error(errMsg(e, 'Could not admit the boarder.')),
      }
    );
  };

  const submitWarden = () => {
    wardenM.mutate(
      {
        id: wardenFor.hostelId,
        wardenId: wardenId || null,
        wardenPhone: wardenPhone.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success(wardenId ? 'Warden assigned.' : 'Warden cleared.');
          setWardenFor(null);
        },
        onError: (e: any) => toast.error(errMsg(e, 'Could not update the warden.')),
      }
    );
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Hostels & Residences" />
      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Building className="w-6 h-6 text-brand" /> Hostels &amp; Residential Blocks
            </h1>
            <p className="text-sm text-zinc-500">
              Manage hostel blocks, rooms, boarders and wardens
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setAdmitOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" /> Admit Boarder
              </Button>
              <Button onClick={() => setHostelOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Hostel Block
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          <StatCard
            label="Hostel blocks"
            value={hostels.length}
            icon="pi pi-building"
            gradientClass="from-blue-500 to-blue-500"
            iconBgClass="bg-blue-500/10"
            iconColorClass="text-blue-600"
            footerText="Active residential blocks"
            loading={hostelsQ.isPending}
          />
          <StatCard
            label="Total capacity"
            value={`${totalCapacity} beds`}
            icon="pi pi-users"
            gradientClass="from-emerald-500 to-teal-500"
            iconBgClass="bg-emerald-500/10"
            iconColorClass="text-emerald-600"
            footerText={`${dashboard.data?.totalRooms ?? 0} rooms`}
            loading={hostelsQ.isPending}
          />
          <StatCard
            label="Boarders"
            value={dashboard.data?.totalBoarders ?? 0}
            icon="pi pi-user"
            gradientClass="from-orange-500 to-amber-500"
            iconBgClass="bg-orange-500/10"
            iconColorClass="text-orange-600"
            footerText="Currently resident"
            loading={dashboard.isPending}
          />
          <StatCard
            label="Vacant rooms"
            value={dashboard.data?.vacantRooms ?? 0}
            icon="pi pi-home"
            gradientClass="from-violet-500 to-indigo-500"
            iconBgClass="bg-violet-500/10"
            iconColorClass="text-violet-600"
            footerText={`${dashboard.data?.occupiedRooms ?? 0} occupied`}
            loading={dashboard.isPending}
          />
        </div>

        <TabBar
          tabs={['Hostel Rooms & Blocks', 'Room Allocations', 'Wardens']}
          active={tab}
          onChange={switchTab}
        />

        <Panel>
          {tab === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 flex flex-col gap-3">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Hostel Blocks
                </h2>
                {hostelsQ.isPending ? (
                  <Spinner />
                ) : hostelsQ.error ? (
                  <ErrorState error={hostelsQ.error} onRetry={() => hostelsQ.refetch()} />
                ) : hostels.length === 0 ? (
                  <EmptyState title="No hostel blocks registered" />
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800/80">
                        <tr>
                          <th className="px-4 py-3">Block</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Beds</th>
                          <th className="px-4 py-3">Rooms</th>
                          {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                        {hostels.map((h: any) => (
                          <tr
                            key={h.id}
                            onClick={() => setSelectedId(h.id)}
                            className={`cursor-pointer ${selectedId === h.id ? 'bg-brand/10 text-brand font-semibold' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'}`}
                          >
                            <td className="px-4 py-3 font-semibold">{h.name}</td>
                            <td className="px-4 py-3">
                              <Badge variant="secondary">{h.type}</Badge>
                            </td>
                            <td className="px-4 py-3 font-mono">{h.capacity}</td>
                            <td className="px-4 py-3 font-mono">{h._count?.rooms ?? 0}</td>
                            {isAdmin && (
                              <td
                                className="px-4 py-3 text-right"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  aria-label="Edit hostel"
                                  onClick={() => startEditHostel(h)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  aria-label="Delete hostel"
                                  onClick={() => setHostelToDelete(h)}
                                >
                                  <Trash2 className="w-4 h-4 text-rose-500" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {selected ? `Rooms — ${selected.name}` : 'Rooms'}
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {selected ? 'Beds and current occupants' : 'Select a block to see its rooms'}
                    </p>
                  </div>
                  {selected && isAdmin && (
                    <Button size="sm" onClick={() => setRoomOpen(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Room
                    </Button>
                  )}
                </div>
                {selected &&
                  (roomsQ.isPending ? (
                    <Spinner />
                  ) : roomsQ.error ? (
                    <ErrorState error={roomsQ.error} onRetry={() => roomsQ.refetch()} />
                  ) : rooms.length === 0 ? (
                    <EmptyState title="No rooms in this block yet" />
                  ) : (
                    <div className="flex flex-col gap-3">
                      {rooms.map((r: any) => {
                        const occupied = (r.boarders ?? []).length;
                        return (
                          <div
                            key={r.id}
                            className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg p-3 flex flex-col gap-2"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-sm">
                                Room {r.roomNo}{' '}
                                <span className="text-xs text-zinc-400 font-normal">
                                  · floor {r.floor} · {r.type}
                                </span>
                              </span>
                              <Badge variant={occupied >= r.capacity ? 'danger' : 'success'}>
                                {occupied}/{r.capacity} beds
                              </Badge>
                            </div>
                            {occupied > 0 && (
                              <p className="text-[11px] text-zinc-500">
                                {r.boarders
                                  .map((b: any) => b.student?.name)
                                  .filter(Boolean)
                                  .join(', ')}
                              </p>
                            )}
                            {isAdmin && (
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  aria-label="Edit room"
                                  onClick={() => startEditRoom(r)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  aria-label="Delete room"
                                  onClick={() => setRoomToDelete(r)}
                                >
                                  <Trash2 className="w-4 h-4 text-rose-500" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {tab === 1 &&
            (boardersQ.isPending ? (
              <Spinner />
            ) : boardersQ.error ? (
              <ErrorState error={boardersQ.error} onRetry={() => boardersQ.refetch()} />
            ) : (boardersQ.data ?? []).length === 0 ? (
              <EmptyState
                title="No resident boarders"
                hint='Use "Admit Boarder" to allocate a room.'
              />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800/80">
                    <tr>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Hostel</th>
                      <th className="px-4 py-3">Room</th>
                      <th className="px-4 py-3">Academic year</th>
                      <th className="px-4 py-3">Joined</th>
                      {isAdmin && <th className="px-4 py-3 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                    {(boardersQ.data ?? []).map((b: any) => (
                      <tr key={b.id}>
                        <td className="px-4 py-3 font-semibold">
                          {b.student?.name}
                          <span className="block text-[10px] font-normal text-zinc-400">
                            {b.student?.admissionNo}
                          </span>
                        </td>
                        <td className="px-4 py-3">{b.room?.hostel?.name}</td>
                        <td className="px-4 py-3 font-mono">{b.room?.roomNo}</td>
                        <td className="px-4 py-3">{b.academicYear?.name}</td>
                        <td className="px-4 py-3 font-mono">
                          {fmtDate(b.joinDate ?? b.createdAt)}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-center">
                            <Button size="sm" variant="outline" onClick={() => setToDischarge(b)}>
                              <LogOut className="w-3.5 h-3.5 mr-1" /> Discharge
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {tab === 2 &&
            (wardensQ.isPending ? (
              <Spinner />
            ) : wardensQ.error ? (
              <ErrorState error={wardensQ.error} onRetry={() => wardensQ.refetch()} />
            ) : (wardensQ.data ?? []).length === 0 ? (
              <EmptyState
                title="No hostel blocks yet"
                hint="Add a hostel block before assigning a warden."
              />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800/80">
                    <tr>
                      <th className="px-4 py-3">Hostel</th>
                      <th className="px-4 py-3">Warden</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Contact</th>
                      {isAdmin && <th className="px-4 py-3 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                    {(wardensQ.data ?? []).map((w: any) => (
                      <tr key={w.hostelId}>
                        <td className="px-4 py-3 font-semibold">
                          {w.hostelName}
                          <span className="block text-[10px] font-normal text-zinc-400">
                            {w.hostelType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {w.warden?.name ?? <Badge variant="warning">Unassigned</Badge>}
                        </td>
                        <td className="px-4 py-3">{w.warden?.email ?? '—'}</td>
                        <td className="px-4 py-3 font-mono">{w.contactPhone ?? '—'}</td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setWardenFor(w);
                                setWardenId(w.warden?.id ?? '');
                                setWardenPhone(w.contactPhone ?? '');
                              }}
                            >
                              {w.warden ? 'Change' : 'Assign'}
                            </Button>
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

      <Dialog
        isOpen={hostelOpen}
        onClose={closeHostel}
        title={editingHostel ? 'Edit Hostel Block' : 'Add Hostel Block'}
      >
        <div className="flex flex-col gap-4 py-2">
          <Field label="Block name *">
            <Input
              value={hostelForm.name}
              onChange={(e) => setHostelForm({ ...hostelForm, name: e.target.value })}
              placeholder="e.g. Boys Hostel Block A"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select
                value={hostelForm.type}
                options={HOSTEL_TYPES}
                onChange={(e) => setHostelForm({ ...hostelForm, type: e.target.value })}
              />
            </Field>
            <Field label="Bed capacity *">
              <Input
                type="number"
                min={1}
                value={hostelForm.capacity}
                onChange={(e) => setHostelForm({ ...hostelForm, capacity: e.target.value })}
              />
            </Field>
          </div>
          {!editingHostel && (
            <Field label="Warden phone">
              <Input
                value={hostelForm.wardenPhone}
                onChange={(e) => setHostelForm({ ...hostelForm, wardenPhone: e.target.value })}
              />
            </Field>
          )}
          <Field label="Address">
            <Input
              value={hostelForm.address}
              onChange={(e) => setHostelForm({ ...hostelForm, address: e.target.value })}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeHostel}>
            Cancel
          </Button>
          <Button
            onClick={saveHostel}
            isLoading={createHostelM.isPending || updateHostelM.isPending}
          >
            {editingHostel ? 'Save changes' : 'Add block'}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        isOpen={roomOpen}
        onClose={closeRoom}
        title={
          editingRoom
            ? `Edit Room ${editingRoom.roomNo}`
            : `Add Room to ${selected?.name ?? 'block'}`
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <Field label="Room number *">
            <Input
              value={roomForm.roomNo}
              onChange={(e) => setRoomForm({ ...roomForm, roomNo: e.target.value })}
              placeholder="e.g. 101"
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Floor">
              <Input
                type="number"
                min={0}
                value={roomForm.floor}
                onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
              />
            </Field>
            <Field label="Beds *">
              <Input
                type="number"
                min={1}
                value={roomForm.capacity}
                onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
              />
            </Field>
            <Field label="Type">
              <Select
                value={roomForm.type}
                options={ROOM_TYPES}
                onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeRoom}>
            Cancel
          </Button>
          <Button onClick={saveRoom} isLoading={createRoomM.isPending || updateRoomM.isPending}>
            {editingRoom ? 'Save changes' : 'Add room'}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog isOpen={admitOpen} onClose={() => setAdmitOpen(false)} title="Admit Boarder">
        <div className="flex flex-col gap-4 py-2">
          <Field label="Class *">
            <Select
              value={admit.classId}
              options={[
                { label: 'Select class...', value: '' },
                ...classes.map((c: any) => ({ label: `${c.name} - ${c.section}`, value: c.id })),
              ]}
              onChange={(e) => setAdmit({ ...admit, classId: e.target.value, studentId: '' })}
            />
          </Field>
          <Field label="Student *">
            <Select
              value={admit.studentId}
              disabled={!admit.classId}
              options={[
                { label: 'Select student...', value: '' },
                ...students.map((s: any) => ({
                  label: `${s.name} (${s.admissionNo})`,
                  value: s.id,
                })),
              ]}
              onChange={(e) => setAdmit({ ...admit, studentId: e.target.value })}
            />
          </Field>
          <Field label="Hostel *">
            <Select
              value={admit.hostelId}
              options={[
                { label: 'Select hostel...', value: '' },
                ...hostels.map((h: any) => ({ label: h.name, value: h.id })),
              ]}
              onChange={(e) => setAdmit({ ...admit, hostelId: e.target.value, roomId: '' })}
            />
          </Field>
          <Field label="Room *">
            <Select
              value={admit.roomId}
              disabled={!admit.hostelId}
              options={[
                { label: 'Select room...', value: '' },
                ...(admitRooms.data ?? []).map((r: any) => ({
                  label: `Room ${r.roomNo} (${(r.boarders ?? []).length}/${r.capacity} beds)`,
                  value: r.id,
                })),
              ]}
              onChange={(e) => setAdmit({ ...admit, roomId: e.target.value })}
            />
          </Field>
          <Field label="Academic year *">
            <AcademicYearSelect
              value={admit.academicYearId}
              onChange={(id) => setAdmit({ ...admit, academicYearId: id })}
              className="w-full"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAdmitOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submitAdmit} isLoading={admitM.isPending}>
            Admit
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        isOpen={!!wardenFor}
        onClose={() => setWardenFor(null)}
        title={`Warden — ${wardenFor?.hostelName ?? ''}`}
      >
        <div className="flex flex-col gap-4 py-2">
          <Field label="Staff member">
            <Select
              value={wardenId}
              disabled={staffQ.isPending}
              options={[
                { label: 'No warden (clear)', value: '' },
                ...(staffQ.data ?? []).map((s) => ({
                  label: `${s.name}${s.designation ? ` — ${s.designation}` : ''}`,
                  value: s.id,
                })),
              ]}
              onChange={(e) => setWardenId(e.target.value)}
            />
          </Field>
          <Field label="Contact phone">
            <Input value={wardenPhone} onChange={(e) => setWardenPhone(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setWardenFor(null)}>
            Cancel
          </Button>
          <Button onClick={submitWarden} isLoading={wardenM.isPending}>
            Save
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog
        open={!!hostelToDelete}
        title="Deactivate hostel block"
        message={`Deactivate "${hostelToDelete?.name ?? ''}" and its rooms? Existing boarder history is kept.`}
        confirmLabel="Deactivate"
        loading={deleteHostelM.isPending}
        onConfirm={() =>
          hostelToDelete &&
          deleteHostelM.mutate(hostelToDelete.id, {
            onSuccess: () => {
              toast.success('Hostel block deactivated.');
              if (selectedId === hostelToDelete.id) setSelectedId('');
              setHostelToDelete(null);
            },
            onError: (e: any) => {
              toast.error(errMsg(e, 'Could not deactivate the hostel.'));
              setHostelToDelete(null);
            },
          })
        }
        onClose={() => setHostelToDelete(null)}
      />
      <ConfirmDialog
        open={!!roomToDelete}
        title="Delete room"
        message={`Delete room ${roomToDelete?.roomNo ?? ''}? Rooms with boarders cannot be deleted.`}
        loading={deleteRoomM.isPending}
        onConfirm={() =>
          roomToDelete &&
          deleteRoomM.mutate(roomToDelete.id, {
            onSuccess: () => {
              toast.success('Room deleted.');
              setRoomToDelete(null);
            },
            onError: (e: any) => {
              toast.error(errMsg(e, 'Could not delete the room.'));
              setRoomToDelete(null);
            },
          })
        }
        onClose={() => setRoomToDelete(null)}
      />
      <ConfirmDialog
        open={!!toDischarge}
        title="Discharge boarder"
        message={`Discharge ${toDischarge?.student?.name ?? 'this student'} from Room ${toDischarge?.room?.roomNo ?? ''}?`}
        confirmLabel="Discharge"
        loading={dischargeM.isPending}
        onConfirm={() =>
          toDischarge &&
          dischargeM.mutate(
            { studentId: toDischarge.studentId, academicYearId: toDischarge.academicYearId },
            {
              onSuccess: () => {
                toast.success('Boarder discharged.');
                setToDischarge(null);
              },
              onError: (e: any) => {
                toast.error(errMsg(e, 'Could not discharge the boarder.'));
                setToDischarge(null);
              },
            }
          )
        }
        onClose={() => setToDischarge(null)}
      />
    </DashboardLayout>
  );
}
