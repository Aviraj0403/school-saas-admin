'use client';

import React, { useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
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
    return (
      <Tag 
        value={isFull ? 'Full' : 'Available'} 
        severity={isFull ? 'danger' : 'success'} 
        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
          isFull 
            ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' 
            : 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
        }`}
      />
    );
  };

  const hostelList = Array.isArray(hostels) ? hostels : (hostels?.data || []);
  const roomList = Array.isArray(rooms) ? rooms : (rooms?.data || []);

  return (
    <DashboardLayout>
      <Toast ref={toast} />
      <div className="flex flex-col gap-6 max-w-7xl mx-auto p-1">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 rounded-2xl shadow-xl text-white">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Hostel & Residences</h1>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              Manage residential blocks, configure capacities, and assign student boarders.
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowAdmitDialog(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all active:scale-95 text-xs md:text-sm flex items-center gap-2"
            >
              <i className="pi pi-user-plus"></i>
              Admit Boarder
            </button>
            <button 
              onClick={() => setShowHostelDialog(true)}
              className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs md:text-sm flex items-center gap-2"
            >
              <i className="pi pi-plus"></i>
              Add Hostel
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-slate-500">Total Hostels</span>
              <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
                {dashboard?.totalHostels ?? hostelList.length}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
              <i className="pi pi-building text-lg"></i>
            </div>
          </div>
          <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Total Capacity</span>
              <h2 className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">{dashboard?.totalCapacity || 0} Beds</h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <i className="pi pi-users text-lg"></i>
            </div>
          </div>
          <div className="bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/20 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">Currently Occupied</span>
              <h2 className="text-3xl font-extrabold text-orange-700 dark:text-orange-400 mt-1">{dashboard?.totalOccupied || 0} Beds</h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20">
              <i className="pi pi-user text-lg"></i>
            </div>
          </div>
        </div>

        {/* Hostel and Rooms Split Board */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Hostel list panel */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Hostel Blocks</h2>
              <p className="text-xs text-slate-400">Select a block to inspect room allotments.</p>
            </div>
            
            <DataTable
              value={hostelList}
              loading={isLoadingHostels}
              selectionMode="single"
              selection={selectedHostel}
              onSelectionChange={(e) => setSelectedHostel(e.value)}
              dataKey="id"
              emptyMessage="No hostels found."
              className="p-datatable-sm"
              rowClassName={(data: any) => `cursor-pointer transition-all duration-100 ${selectedHostel?.id === data.id ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''}`}
            >
              <Column field="name" header="Block Name" sortable className="font-semibold text-slate-800 dark:text-white" />
              <Column field="type" header="Type" sortable body={(d) => <Tag value={d.type} className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-bold text-[9px] px-2.5 py-0.5 rounded-full" />} />
              <Column field="capacity" header="Bed Capacity" sortable />
            </DataTable>
          </div>

          {/* Rooms List Panel */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  {selectedHostel ? `Rooms — ${selectedHostel.name}` : 'Rooms Allotment'}
                </h2>
                <p className="text-xs text-slate-400">
                  {selectedHostel ? 'Beds configuration details.' : 'Select block to view rooms list.'}
                </p>
              </div>
              {selectedHostel && (
                <button 
                  onClick={() => setShowRoomDialog(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <i className="pi pi-plus text-[10px]"></i>
                  Add Room
                </button>
              )}
            </div>

            {selectedHostel ? (
              <DataTable
                value={roomList}
                loading={isLoadingRooms}
                emptyMessage="No rooms mapped to this hostel block yet."
                className="p-datatable-sm mt-1"
              >
                <Column field="roomNo" header="Room" className="font-semibold text-slate-800 dark:text-white" />
                <Column field="type" header="Room Type" />
                <Column field="occupied" header="Occupied" body={(d) => `${d.occupied}/${d.capacity} beds`} />
                <Column body={statusBodyTemplate} header="Status" />
              </DataTable>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 border border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                <i className="pi pi-home text-3xl mb-2"></i>
                <p className="text-xs font-semibold">No Hostel Selected</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Dialog: Add Hostel */}
      <Dialog header="Add New Hostel" visible={showHostelDialog} style={{ width: '450px' }} modal onHide={() => setShowHostelDialog(false)} className="dialog-custom rounded-3xl">
        <form onSubmit={handleCreateHostel} className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Hostel Name *</label>
            <InputText value={hostelForm.name} onChange={(e) => setHostelForm({ ...hostelForm, name: e.target.value })} required className="p-2 border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="e.g. Boys Hostel Block A" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Hostel Type *</label>
            <Dropdown value={hostelForm.type} options={hostelTypes} onChange={(e) => setHostelForm({ ...hostelForm, type: e.value })} className="border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Total Bed Capacity *</label>
            <InputNumber value={hostelForm.capacity} onValueChange={(e) => setHostelForm({ ...hostelForm, capacity: e.value || 0 })} required className="border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Address Location</label>
            <InputText value={hostelForm.address} onChange={(e) => setHostelForm({ ...hostelForm, address: e.target.value })} className="p-2 border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="Campus block location details" />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-2">
            <Button type="button" label="Cancel" className="p-button-text p-2" onClick={() => setShowHostelDialog(false)} />
            <Button type="submit" label="Save Block" icon="pi pi-check" loading={createHostelMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" />
          </div>
        </form>
      </Dialog>

      {/* Dialog: Add Room */}
      <Dialog header={`Add Room to ${selectedHostel?.name || 'Hostel'}`} visible={showRoomDialog} style={{ width: '400px' }} modal onHide={() => setShowRoomDialog(false)} className="dialog-custom rounded-3xl">
        <form onSubmit={handleCreateRoom} className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Room Number *</label>
            <InputText value={roomForm.roomNo} onChange={(e) => setRoomForm({ ...roomForm, roomNo: e.target.value })} required className="p-2 border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="e.g. 101" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Room Category Type *</label>
            <InputText value={roomForm.type} onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })} required className="p-2 border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="e.g. STANDARD" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Bed Capacity Count *</label>
            <InputNumber value={roomForm.capacity} onValueChange={(e) => setRoomForm({ ...roomForm, capacity: e.value || 0 })} required className="border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl" />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-2">
            <Button type="button" label="Cancel" className="p-button-text p-2" onClick={() => setShowRoomDialog(false)} />
            <Button type="submit" label="Add Room" icon="pi pi-check" loading={createRoomMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" />
          </div>
        </form>
      </Dialog>

      {/* Dialog: Admit Boarder */}
      <Dialog header="Admit Student as Resident" visible={showAdmitDialog} style={{ width: '420px' }} modal onHide={() => setShowAdmitDialog(false)} className="dialog-custom rounded-3xl">
        <form onSubmit={handleAdmitBoarder} className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Student ID *</label>
            <InputText value={admitForm.studentId} onChange={(e) => setAdmitForm({ ...admitForm, studentId: e.target.value })} required className="p-2 border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="Student UUID or Admission No" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Hostel Room *</label>
            <Dropdown
              value={admitForm.hostelRoomId}
              options={roomList.map((r: any) => ({ label: `Room ${r.roomNo} (${r.occupied}/${r.capacity} occupied)`, value: r.id }))}
              onChange={(e) => setAdmitForm({ ...admitForm, hostelRoomId: e.value })}
              placeholder="Select Room"
              className="border border-gray-255 dark:border-slate-700 dark:bg-slate-900 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Academic Term Year *</label>
            <InputText value={admitForm.academicYear} onChange={(e) => setAdmitForm({ ...admitForm, academicYear: e.target.value })} required className="p-2 border border-gray-250 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="e.g. 2026" />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-2">
            <Button type="button" label="Cancel" className="p-button-text p-2" onClick={() => setShowAdmitDialog(false)} />
            <Button type="submit" label="Admit Resident" icon="pi pi-check" loading={admitBoarderMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" />
          </div>
        </form>
      </Dialog>
    </DashboardLayout>
  );
}
