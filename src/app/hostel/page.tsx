'use client';

import React, { useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { useHostelDashboard, useHostels, useCreateHostel, useHostelRooms, useCreateHostelRoom, useAdmitBoarder } from '@/hooks/queries/useHostel';

export default function HostelPage() {
  const toast = useRef<Toast>(null);

  const { data: dashboard } = useHostelDashboard();
  const { data: hostels, isLoading: isLoadingHostels } = useHostels();
  const createHostelMutation = useCreateHostel();
  const createRoomMutation = useCreateHostelRoom();
  const admitBoarderMutation = useAdmitBoarder();

  const [selectedHostel, setSelectedHostel] = useState<any>(null);
  const { data: rooms, isLoading: isLoadingRooms } = useHostelRooms(selectedHostel?.id || '');

  const [showHostelDialog, setShowHostelDialog] = useState(false);
  const [hostelForm, setHostelForm] = useState({ name: '', type: 'BOYS', capacity: 0, address: '' });

  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [roomForm, setRoomForm] = useState({ roomNo: '', type: 'STANDARD', capacity: 0 });

  const [showAdmitDialog, setShowAdmitDialog] = useState(false);
  const [admitForm, setAdmitForm] = useState({ studentId: '', hostelRoomId: '', academicYear: new Date().getFullYear().toString() });

  const hostelTypes = [
    { label: 'Boys', value: 'BOYS' },
    { label: 'Girls', value: 'GIRLS' },
    { label: 'Co-ed', value: 'COED' },
  ];

  const handleCreateHostel = (e: React.FormEvent) => {
    e.preventDefault();
    createHostelMutation.mutate(hostelForm as any, {
      onSuccess: () => {
        setShowHostelDialog(false);
        setHostelForm({ name: '', type: 'BOYS', capacity: 0, address: '' });
        toast.current?.show({ severity: 'success', summary: 'Created', detail: 'Hostel added successfully', life: 3000 });
      },
      onError: () => toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to create hostel', life: 3000 }),
    });
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHostel) return;
    createRoomMutation.mutate({ hostelId: selectedHostel.id, data: roomForm }, {
      onSuccess: () => {
        setShowRoomDialog(false);
        setRoomForm({ roomNo: '', type: 'STANDARD', capacity: 0 });
        toast.current?.show({ severity: 'success', summary: 'Created', detail: 'Room added successfully', life: 3000 });
      },
      onError: () => toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to create room', life: 3000 }),
    });
  };

  const handleAdmitBoarder = (e: React.FormEvent) => {
    e.preventDefault();
    admitBoarderMutation.mutate(admitForm, {
      onSuccess: () => {
        setShowAdmitDialog(false);
        setAdmitForm({ studentId: '', hostelRoomId: '', academicYear: new Date().getFullYear().toString() });
        toast.current?.show({ severity: 'success', summary: 'Admitted', detail: 'Student admitted to hostel', life: 3000 });
      },
      onError: () => toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to admit boarder', life: 3000 }),
    });
  };

  const statusBodyTemplate = (rowData: any) => {
    const isFull = rowData.occupied >= rowData.capacity;
    return <Tag value={isFull ? 'Full' : 'Available'} severity={isFull ? 'danger' : 'success'} />;
  };

  const hostelList = Array.isArray(hostels) ? hostels : (hostels?.data || []);
  const roomList = Array.isArray(rooms) ? rooms : (rooms?.data || []);

  return (
    <DashboardLayout>
      <Toast ref={toast} />
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hostel Management</h1>
            <p className="text-gray-500 mt-1">Manage hostel blocks, rooms, and student boarders.</p>
          </div>
          <div className="flex gap-2">
            <Button label="Admit Boarder" icon="pi pi-user-plus" className="p-button-secondary bg-slate-700 text-white p-2 px-4" onClick={() => setShowAdmitDialog(true)} />
            <Button label="Add Hostel" icon="pi pi-plus" className="bg-primary text-white p-2 px-4" onClick={() => setShowHostelDialog(true)} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-gray-500 font-medium mb-3">Total Hostels</span>
                <div className="font-bold text-3xl text-blue-600">{dashboard?.totalHostels ?? hostelList.length}</div>
              </div>
              <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 rounded-lg w-12 h-12">
                <i className="pi pi-building text-blue-500 text-xl"></i>
              </div>
            </div>
          </Card>
          <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-gray-500 font-medium mb-3">Total Capacity</span>
                <div className="font-bold text-3xl text-green-600">{dashboard?.totalCapacity || 0}</div>
              </div>
              <div className="flex items-center justify-center bg-green-100 dark:bg-green-900/40 rounded-lg w-12 h-12">
                <i className="pi pi-users text-green-500 text-xl"></i>
              </div>
            </div>
          </Card>
          <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-gray-500 font-medium mb-3">Currently Occupied</span>
                <div className="font-bold text-3xl text-orange-600">{dashboard?.totalOccupied || 0}</div>
              </div>
              <div className="flex items-center justify-center bg-orange-100 dark:bg-orange-900/40 rounded-lg w-12 h-12">
                <i className="pi pi-user text-orange-500 text-xl"></i>
              </div>
            </div>
          </Card>
        </div>

        {/* Hostel + Rooms grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm border border-gray-100 dark:border-slate-800" title="Hostel Blocks">
            <DataTable
              value={hostelList}
              loading={isLoadingHostels}
              selectionMode="single"
              selection={selectedHostel}
              onSelectionChange={(e) => setSelectedHostel(e.value)}
              dataKey="id"
              emptyMessage="No hostels found."
              stripedRows
              className="p-datatable-sm mt-2"
            >
              <Column field="name" header="Name" sortable />
              <Column field="type" header="Type" sortable />
              <Column field="capacity" header="Capacity" sortable />
            </DataTable>
          </Card>

          <Card
            className="shadow-sm border border-gray-100 dark:border-slate-800"
            title={selectedHostel ? `Rooms — ${selectedHostel.name}` : 'Select a hostel to view rooms'}
          >
            {selectedHostel && (
              <div className="flex justify-end mb-3">
                <Button label="Add Room" icon="pi pi-plus" size="small" className="bg-primary text-white p-1 px-3" onClick={() => setShowRoomDialog(true)} />
              </div>
            )}
            <DataTable
              value={roomList}
              loading={isLoadingRooms}
              emptyMessage={selectedHostel ? 'No rooms found.' : 'Select a hostel first.'}
              stripedRows
              className="p-datatable-sm"
            >
              <Column field="roomNo" header="Room No" />
              <Column field="type" header="Type" />
              <Column field="capacity" header="Capacity" />
              <Column field="occupied" header="Occupied" />
              <Column body={statusBodyTemplate} header="Status" />
            </DataTable>
          </Card>
        </div>
      </div>

      {/* Dialog: Add Hostel */}
      <Dialog header="Add New Hostel" visible={showHostelDialog} style={{ width: '450px' }} modal onHide={() => setShowHostelDialog(false)}>
        <form onSubmit={handleCreateHostel} className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700 dark:text-gray-300">Hostel Name</label>
            <InputText value={hostelForm.name} onChange={(e) => setHostelForm({ ...hostelForm, name: e.target.value })} required className="p-2 border border-gray-200 rounded-md" placeholder="e.g. Boys Hostel Block A" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700 dark:text-gray-300">Type</label>
            <Dropdown value={hostelForm.type} options={hostelTypes} onChange={(e) => setHostelForm({ ...hostelForm, type: e.value })} className="border border-gray-200 rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700 dark:text-gray-300">Total Capacity</label>
            <InputNumber value={hostelForm.capacity} onValueChange={(e) => setHostelForm({ ...hostelForm, capacity: e.value || 0 })} required className="border border-gray-200 rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700 dark:text-gray-300">Address</label>
            <InputText value={hostelForm.address} onChange={(e) => setHostelForm({ ...hostelForm, address: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="Campus block address" />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" label="Cancel" className="p-button-text p-2" onClick={() => setShowHostelDialog(false)} />
            <Button type="submit" label="Save Hostel" icon="pi pi-check" loading={createHostelMutation.isPending} className="bg-primary text-white p-2 px-4" />
          </div>
        </form>
      </Dialog>

      {/* Dialog: Add Room */}
      <Dialog header={`Add Room to ${selectedHostel?.name || 'Hostel'}`} visible={showRoomDialog} style={{ width: '400px' }} modal onHide={() => setShowRoomDialog(false)}>
        <form onSubmit={handleCreateRoom} className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700 dark:text-gray-300">Room Number</label>
            <InputText value={roomForm.roomNo} onChange={(e) => setRoomForm({ ...roomForm, roomNo: e.target.value })} required className="p-2 border border-gray-200 rounded-md" placeholder="e.g. 101, A-12" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700 dark:text-gray-300">Room Type</label>
            <InputText value={roomForm.type} onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })} required className="p-2 border border-gray-200 rounded-md" placeholder="e.g. STANDARD, DELUXE" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700 dark:text-gray-300">Capacity (beds)</label>
            <InputNumber value={roomForm.capacity} onValueChange={(e) => setRoomForm({ ...roomForm, capacity: e.value || 0 })} required className="border border-gray-200 rounded-md" />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" label="Cancel" className="p-button-text p-2" onClick={() => setShowRoomDialog(false)} />
            <Button type="submit" label="Add Room" icon="pi pi-check" loading={createRoomMutation.isPending} className="bg-primary text-white p-2 px-4" />
          </div>
        </form>
      </Dialog>

      {/* Dialog: Admit Boarder */}
      <Dialog header="Admit Student as Boarder" visible={showAdmitDialog} style={{ width: '420px' }} modal onHide={() => setShowAdmitDialog(false)}>
        <form onSubmit={handleAdmitBoarder} className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700 dark:text-gray-300">Student ID</label>
            <InputText value={admitForm.studentId} onChange={(e) => setAdmitForm({ ...admitForm, studentId: e.target.value })} required className="p-2 border border-gray-200 rounded-md" placeholder="Student UUID or Admission No" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700 dark:text-gray-300">Hostel Room ID</label>
            <Dropdown
              value={admitForm.hostelRoomId}
              options={roomList.map((r: any) => ({ label: `${r.roomNo} (${r.occupied}/${r.capacity})`, value: r.id }))}
              onChange={(e) => setAdmitForm({ ...admitForm, hostelRoomId: e.value })}
              placeholder="Select a room"
              className="border border-gray-200 rounded-md"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-gray-700 dark:text-gray-300">Academic Year</label>
            <InputText value={admitForm.academicYear} onChange={(e) => setAdmitForm({ ...admitForm, academicYear: e.target.value })} required className="p-2 border border-gray-200 rounded-md" placeholder="e.g. 2025-26" />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" label="Cancel" className="p-button-text p-2" onClick={() => setShowAdmitDialog(false)} />
            <Button type="submit" label="Admit Boarder" icon="pi pi-check" loading={admitBoarderMutation.isPending} className="bg-primary text-white p-2 px-4" />
          </div>
        </form>
      </Dialog>
    </DashboardLayout>
  );
}
