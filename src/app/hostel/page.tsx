'use client';

import React, { useState, useEffect } from 'react';
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
  useHostelDashboard,
  useHostels,
  useCreateHostel,
  useHostelRooms,
  useCreateHostelRoom,
  useAdmitBoarder,
  useDischargeBoarder,
  useAllBoarders,
} from '@/hooks/queries/useHostel';
import { toast } from 'sonner';
import { Building, Plus, UserPlus, LogOut, Home, Users, ShieldCheck } from 'lucide-react';

export default function HostelPage() {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (pathname.includes('/rooms') || tabParam === 'rooms') setActiveTab(0);
      else if (pathname.includes('/allocations') || tabParam === 'allocations') setActiveTab(1);
      else if (pathname.includes('/wardens') || tabParam === 'wardens') setActiveTab(2);
    }
  }, []);

  const { data: dashboard } = useHostelDashboard();
  const { data: hostels, isLoading: isLoadingHostels } = useHostels();
  const { data: allBoardersData, isPending: isLoadingBoarders } = useAllBoarders();

  const hostelList = Array.isArray(hostels) ? hostels : hostels?.data || [];

  const wardensList = hostelList.map((h: any) => ({
    id: h.id,
    name: h.wardenId || 'Unassigned',
    hostelBlock: h.name,
    phone: h.wardenPhone || 'N/A',
    email: 'N/A',
    status: 'ON_DUTY',
  }));

  const wardenLogs: any[] = [];

  const boardersList = (allBoardersData || []).map((b: any) => ({
    id: b.studentId,
    studentName: b.student?.name || 'Unknown',
    hostelName: b.room?.hostel?.name || 'Unknown',
    roomNo: b.room?.roomNo || 'Unknown',
    academicYear: b.academicYear?.name || 'N/A',
    academicYearId: b.academicYearId,
    joinDate: b.joinDate ? new Date(b.joinDate).toISOString().split('T')[0] : 'N/A',
  }));

  const dischargeBoarderMutation = useDischargeBoarder();

  const handleDischarge = (studentId: string, academicYearId: string) => {
    if (confirm('Are you sure you want to discharge this resident boarder?')) {
      dischargeBoarderMutation.mutate(
        { studentId, academicYearId },
        {
          onSuccess: () => toast.success('Resident boarder discharged successfully.'),
          onError: () => toast.error('Failed to discharge boarder.'),
        }
      );
    }
  };

  const createHostelMutation = useCreateHostel();
  const createRoomMutation = useCreateHostelRoom();
  const admitBoarderMutation = useAdmitBoarder();

  const [selectedHostel, setSelectedHostel] = useState<any>(null);
  const { data: rooms, isLoading: isLoadingRooms } = useHostelRooms(selectedHostel?.id || '');

  const [showHostelDialog, setShowHostelDialog] = useState(false);
  const [hostelForm, setHostelForm] = useState({
    name: '',
    type: 'BOYS',
    capacity: 0,
    address: '',
  });

  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [roomForm, setRoomForm] = useState({ roomNo: '', type: 'STANDARD', capacity: 0 });

  const [showAdmitDialog, setShowAdmitDialog] = useState(false);
  const [admitForm, setAdmitForm] = useState({
    studentId: '',
    hostelRoomId: '',
    academicYearId: '',
  });

  const hostelTypes = [
    { label: 'Boys Hostel', value: 'BOYS' },
    { label: 'Girls Hostel', value: 'GIRLS' },
    { label: 'Co-ed Residence', value: 'COED' },
  ];

  const handleCreateHostel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostelForm.name) {
      toast.error('Hostel name is required.');
      return;
    }
    createHostelMutation.mutate(hostelForm as any, {
      onSuccess: () => {
        setShowHostelDialog(false);
        setHostelForm({ name: '', type: 'BOYS', capacity: 0, address: '' });
        toast.success('Hostel block added successfully.');
      },
      onError: () => toast.error('Failed to create hostel block.'),
    });
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHostel || !roomForm.roomNo) {
      toast.error('Room number is required.');
      return;
    }
    createRoomMutation.mutate(
      { hostelId: selectedHostel.id, data: roomForm },
      {
        onSuccess: () => {
          setShowRoomDialog(false);
          setRoomForm({ roomNo: '', type: 'STANDARD', capacity: 0 });
          toast.success('Room added successfully.');
        },
        onError: () => toast.error('Failed to create room.'),
      }
    );
  };

  const handleAdmitBoarder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitForm.studentId || !admitForm.hostelRoomId) {
      toast.error('Student and room selection are required.');
      return;
    }
    admitBoarderMutation.mutate(admitForm, {
      onSuccess: () => {
        setShowAdmitDialog(false);
        setAdmitForm({ studentId: '', hostelRoomId: '', academicYearId: '' });
        toast.success('Student admitted to hostel room.');
      },
      onError: () => toast.error('Failed to admit boarder.'),
    });
  };

  const roomList = Array.isArray(rooms) ? rooms : rooms?.data || [];

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Hostels & Residences" />

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        {/* Header Block */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Building className="w-6 h-6 text-brand" />
              Hostels & Residential Blocks
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Manage residential halls, room allocations, and warden access logs
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowAdmitDialog(true)}>
              <UserPlus className="w-4 h-4 mr-2" /> Admit Boarder
            </Button>
            <Button onClick={() => setShowHostelDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Hostel Block
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          <StatCard
            label="Total Hostels"
            value={dashboard?.totalHostels ?? hostelList.length}
            icon="pi pi-building"
            gradientClass="from-blue-500 to-blue-500"
            iconBgClass="bg-blue-500/10 dark:bg-blue-500/20"
            iconColorClass="text-blue-600 dark:text-blue-400"
            footerText="Active residential blocks"
          />
          <StatCard
            label="Total Capacity"
            value={`${dashboard?.totalCapacity || 0} Beds`}
            icon="pi pi-users"
            gradientClass="from-emerald-500 to-teal-500"
            iconBgClass="bg-emerald-500/10 dark:bg-emerald-500/20"
            iconColorClass="text-emerald-600 dark:text-emerald-400"
            footerText="Maximum occupancy"
          />
          <StatCard
            label="Currently Occupied"
            value={`${dashboard?.totalOccupied || 0} Beds`}
            icon="pi pi-user"
            gradientClass="from-orange-500 to-amber-500"
            iconBgClass="bg-orange-500/10 dark:bg-orange-500/20"
            iconColorClass="text-orange-600 dark:text-orange-400"
            footerText="Students admitted"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 w-fit">
          <button
            onClick={() => {
              setActiveTab(0);
              window.history.pushState({}, '', '/hostel/rooms');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 0
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Hostel Rooms & Blocks
          </button>
          <button
            onClick={() => {
              setActiveTab(1);
              window.history.pushState({}, '', '/hostel/allocations');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 1
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Room Allocations
          </button>
          <button
            onClick={() => {
              setActiveTab(2);
              window.history.pushState({}, '', '/hostel/wardens');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 2
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Warden Logbook & Entry Logs
          </button>
        </div>

        {/* Tab Content Board */}
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm">
          {activeTab === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Hostel Blocks Table */}
              <div className="lg:col-span-3 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col gap-3 bg-zinc-50/50 dark:bg-zinc-900/30">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Hostel Blocks
                  </h2>
                  <p className="text-xs text-zinc-500">Select a block to inspect room allotments</p>
                </div>

                <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-4 py-3">Block Name</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Bed Capacity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {isLoadingHostels ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-zinc-500">
                            <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-brand border-t-transparent" />
                          </td>
                        </tr>
                      ) : hostelList.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-zinc-500">
                            No hostel blocks registered.
                          </td>
                        </tr>
                      ) : (
                        hostelList.map((h: any) => {
                          const isSel = selectedHostel?.id === h.id;
                          return (
                            <tr
                              key={h.id}
                              onClick={() => setSelectedHostel(h)}
                              className={`cursor-pointer transition-colors ${
                                isSel
                                  ? 'bg-brand/10 dark:bg-brand/20 font-semibold text-brand'
                                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                              }`}
                            >
                              <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                                {h.name}
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="secondary">{h.type}</Badge>
                              </td>
                              <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-400">
                                {h.capacity} beds
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rooms List Panel */}
              <div className="lg:col-span-2 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 flex flex-col gap-4 bg-white dark:bg-zinc-900">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {selectedHostel ? `Rooms — ${selectedHostel.name}` : 'Rooms Allotment'}
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {selectedHostel
                        ? 'Bed capacity & allotment status'
                        : 'Select a block to inspect rooms'}
                    </p>
                  </div>
                  {selectedHostel && (
                    <Button size="sm" onClick={() => setShowRoomDialog(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Room
                    </Button>
                  )}
                </div>

                {selectedHostel ? (
                  <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                        <tr>
                          <th className="px-4 py-3">Room</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Beds</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                        {isLoadingRooms ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                              <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-brand border-t-transparent" />
                            </td>
                          </tr>
                        ) : roomList.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                              No rooms configured yet.
                            </td>
                          </tr>
                        ) : (
                          roomList.map((r: any) => {
                            const isFull = r.occupied >= r.capacity;
                            return (
                              <tr
                                key={r.id}
                                className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                              >
                                <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                                  {r.roomNo}
                                </td>
                                <td className="px-4 py-3 text-zinc-500">{r.type}</td>
                                <td className="px-4 py-3 font-mono">
                                  {r.occupied}/{r.capacity}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant={isFull ? 'danger' : 'success'}>
                                    {isFull ? 'Full' : 'Available'}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-zinc-400 min-h-[220px]">
                    <Home className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      No Block Selected
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Active Resident Boarders
                </h2>
                <p className="text-xs text-zinc-500">
                  All current resident allocations across hostel beds
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                    <tr>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Hostel Block</th>
                      <th className="px-4 py-3">Room No</th>
                      <th className="px-4 py-3">Academic Term</th>
                      <th className="px-4 py-3">Admission Date</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                    {boardersList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                          No resident boarders found.
                        </td>
                      </tr>
                    ) : (
                      boardersList.map((b: any, idx: number) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                            {b.studentName}
                          </td>
                          <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                            {b.hostelName}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-brand">{b.roomNo}</td>
                          <td className="px-4 py-3 text-zinc-500">{b.academicYear}</td>
                          <td className="px-4 py-3 font-mono text-zinc-500">{b.joinDate}</td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                              onClick={() => handleDischarge(b.id, b.academicYearId)}
                            >
                              <LogOut className="w-3 h-3 mr-1" /> Discharge
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Wardens List */}
              <div className="lg:col-span-2 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col gap-4 bg-zinc-50/50 dark:bg-zinc-900/30">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Hostel Wardens
                  </h2>
                  <p className="text-xs text-zinc-500">Assigned safety and oversight wardens</p>
                </div>

                <div className="flex flex-col gap-3">
                  {wardensList.map((warden: any) => (
                    <div
                      key={warden.id}
                      className="p-3 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl bg-white dark:bg-zinc-900 flex justify-between items-center shadow-sm"
                    >
                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                          {warden.name}
                        </h4>
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {warden.hostelBlock}
                        </span>
                        <div className="text-[10px] text-zinc-500 mt-1 flex flex-col">
                          <span>Phone: {warden.phone}</span>
                          <span>Email: {warden.email}</span>
                        </div>
                      </div>
                      <Badge variant="success">On Duty</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gate Entry / Exit logs */}
              <div className="lg:col-span-3 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 flex flex-col gap-4 bg-white dark:bg-zinc-900">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Access Entry & Exit Logbook
                  </h2>
                  <p className="text-xs text-zinc-500">Real-time gate logs managed by wardens</p>
                </div>

                <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Room</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Time Logged</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                          No gate logs recorded today.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog: Add Hostel */}
      <Dialog
        isOpen={showHostelDialog}
        onClose={() => setShowHostelDialog(false)}
        title="Add New Hostel Block"
      >
        <form onSubmit={handleCreateHostel} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Hostel Block Name *
            </label>
            <Input
              value={hostelForm.name}
              onChange={(e) => setHostelForm({ ...hostelForm, name: e.target.value })}
              placeholder="e.g. Boys Hostel Block A"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Hostel Category *
            </label>
            <Select
              value={hostelForm.type}
              options={hostelTypes}
              onChange={(e) => setHostelForm({ ...hostelForm, type: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Total Bed Capacity *
            </label>
            <Input
              type="number"
              value={hostelForm.capacity}
              onChange={(e) => setHostelForm({ ...hostelForm, capacity: Number(e.target.value) })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Address / Location
            </label>
            <Input
              value={hostelForm.address}
              onChange={(e) => setHostelForm({ ...hostelForm, address: e.target.value })}
              placeholder="Campus location details..."
            />
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setShowHostelDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createHostelMutation.isPending}>
              Save Block
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: Add Room */}
      <Dialog
        isOpen={showRoomDialog}
        onClose={() => setShowRoomDialog(false)}
        title={`Add Room to ${selectedHostel?.name || 'Block'}`}
      >
        <form onSubmit={handleCreateRoom} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Room Number *
            </label>
            <Input
              value={roomForm.roomNo}
              onChange={(e) => setRoomForm({ ...roomForm, roomNo: e.target.value })}
              placeholder="e.g. 101"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Category Type *
            </label>
            <Input
              value={roomForm.type}
              onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
              placeholder="e.g. STANDARD"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Bed Capacity Count *
            </label>
            <Input
              type="number"
              value={roomForm.capacity}
              onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })}
            />
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setShowRoomDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createRoomMutation.isPending}>
              Add Room
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: Admit Boarder */}
      <Dialog
        isOpen={showAdmitDialog}
        onClose={() => setShowAdmitDialog(false)}
        title="Admit Student as Resident"
      >
        <form onSubmit={handleAdmitBoarder} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Student UUID / Adm No *
            </label>
            <Input
              value={admitForm.studentId}
              onChange={(e) => setAdmitForm({ ...admitForm, studentId: e.target.value })}
              placeholder="Enter Student ID..."
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Hostel Room *
            </label>
            <Select
              value={admitForm.hostelRoomId}
              options={[
                { label: 'Select Room', value: '' },
                ...roomList.map((r: any) => ({
                  label: `Room ${r.roomNo} (${r.occupied}/${r.capacity} occupied)`,
                  value: r.id,
                })),
              ]}
              onChange={(e) => setAdmitForm({ ...admitForm, hostelRoomId: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Academic Term Year *
            </label>
            <AcademicYearSelect
              value={admitForm.academicYearId}
              onChange={(id) => setAdmitForm({ ...admitForm, academicYearId: id })}
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" type="button" onClick={() => setShowAdmitDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={admitBoarderMutation.isPending}>
              Admit Resident
            </Button>
          </div>
        </form>
      </Dialog>
    </DashboardLayout>
  );
}
