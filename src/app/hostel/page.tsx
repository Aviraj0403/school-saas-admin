'use client';

import React, { useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { useHostelDashboard, useHostels, useCreateHostel, useHostelRooms, useCreateHostelRoom } from '@/hooks/queries/useHostel';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';

export default function HostelPage() {
  const toast = useRef<Toast>(null);
  
  const { data: dashboard, isLoading: isLoadingDashboard } = useHostelDashboard();
  const { data: hostels, isLoading: isLoadingHostels } = useHostels();
  const createHostelMutation = useCreateHostel();
  const createRoomMutation = useCreateHostelRoom();

  const [selectedHostel, setSelectedHostel] = useState<any>(null);
  
  const { data: rooms, isLoading: isLoadingRooms } = useHostelRooms(selectedHostel?.id || '');

  const [showHostelDialog, setShowHostelDialog] = useState(false);
  const [hostelForm, setHostelForm] = useState<any>({ name: '', type: 'BOYS', capacity: 0, address: '' });

  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [roomForm, setRoomForm] = useState<any>({ roomNo: '', type: 'STANDARD', capacity: 0 });

  const hostelTypes = [
    { label: 'Boys', value: 'BOYS' },
    { label: 'Girls', value: 'GIRLS' },
    { label: 'Co-ed', value: 'COED' }
  ];

  const handleCreateHostel = (e: React.FormEvent) => {
    e.preventDefault();
    createHostelMutation.mutate(hostelForm, {
      onSuccess: () => {
        setShowHostelDialog(false);
        setHostelForm({ name: '', type: 'BOYS', capacity: 0, address: '' });
        toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Hostel created successfully', life: 3000 });
      },
      onError: () => {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to create hostel', life: 3000 });
      }
    });
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHostel) return;
    createRoomMutation.mutate({ hostelId: selectedHostel.id, data: roomForm }, {
      onSuccess: () => {
        setShowRoomDialog(false);
        setRoomForm({ roomNo: '', type: 'STANDARD', capacity: 0 });
        toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Room created successfully', life: 3000 });
      },
      onError: () => {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to create room', life: 3000 });
      }
    });
  };

  const statusBodyTemplate = (rowData: any) => {
    const isFull = rowData.occupied >= rowData.capacity;
    return <Tag value={isFull ? 'Full' : 'Available'} severity={isFull ? 'danger' : 'success'} />;
  };

  if (isLoadingDashboard || isLoadingHostels) {
    return <div className="flex justify-content-center align-items-center h-full"><ProgressSpinner /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      <Toast ref={toast} />
      
      <div className="flex justify-content-between align-items-center mb-5">
        <h1 className="text-2xl font-semibold m-0 text-gray-800">Hostel Management</h1>
        <Button label="Add Hostel" icon="pi pi-plus" onClick={() => setShowHostelDialog(true)} />
      </div>

      <div className="grid mb-5">
        <div className="col-12 md:col-4">
          <Card className="shadow-1">
            <div className="flex justify-content-between align-items-center">
              <div>
                <p className="text-gray-500 m-0 mb-2">Total Hostels</p>
                <h2 className="m-0 text-2xl text-blue-600">{dashboard?.totalHostels || 0}</h2>
              </div>
              <i className="pi pi-building text-3xl text-blue-200"></i>
            </div>
          </Card>
        </div>
        <div className="col-12 md:col-4">
          <Card className="shadow-1">
            <div className="flex justify-content-between align-items-center">
              <div>
                <p className="text-gray-500 m-0 mb-2">Total Capacity</p>
                <h2 className="m-0 text-2xl text-green-600">{dashboard?.totalCapacity || 0}</h2>
              </div>
              <i className="pi pi-users text-3xl text-green-200"></i>
            </div>
          </Card>
        </div>
        <div className="col-12 md:col-4">
          <Card className="shadow-1">
            <div className="flex justify-content-between align-items-center">
              <div>
                <p className="text-gray-500 m-0 mb-2">Total Occupied</p>
                <h2 className="m-0 text-2xl text-orange-600">{dashboard?.totalOccupied || 0}</h2>
              </div>
              <i className="pi pi-user-plus text-3xl text-orange-200"></i>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid">
        <div className="col-12 md:col-6">
          <Card title="Hostels">
            <DataTable value={Array.isArray(hostels) ? hostels : (hostels?.data || [])} selectionMode="single" selection={selectedHostel} onSelectionChange={(e) => setSelectedHostel(e.value)} dataKey="id" emptyMessage="No hostels found." stripedRows className="p-datatable-sm">
              <Column field="name" header="Name" sortable></Column>
              <Column field="type" header="Type" sortable></Column>
              <Column field="capacity" header="Capacity" sortable></Column>
            </DataTable>
          </Card>
        </div>
        <div className="col-12 md:col-6">
          <Card title={selectedHostel ? `Rooms in ${selectedHostel.name}` : 'Select a Hostel to view rooms'}>
            {selectedHostel && (
              <>
                <div className="flex justify-content-end mb-3">
                  <Button label="Add Room" icon="pi pi-plus" size="small" onClick={() => setShowRoomDialog(true)} />
                </div>
                <DataTable value={Array.isArray(rooms) ? rooms : (rooms?.data || [])} loading={isLoadingRooms} emptyMessage="No rooms found." stripedRows className="p-datatable-sm">
                  <Column field="roomNo" header="Room No"></Column>
                  <Column field="type" header="Type"></Column>
                  <Column field="capacity" header="Capacity"></Column>
                  <Column field="occupied" header="Occupied"></Column>
                  <Column body={statusBodyTemplate} header="Status"></Column>
                </DataTable>
              </>
            )}
          </Card>
        </div>
      </div>

      <Dialog header="Add New Hostel" visible={showHostelDialog} style={{ width: '450px' }} onHide={() => setShowHostelDialog(false)}>
        <form onSubmit={handleCreateHostel} className="flex flex-column gap-3 mt-3">
          <div className="field">
            <label htmlFor="name">Name</label>
            <InputText id="name" value={hostelForm.name} onChange={(e) => setHostelForm({ ...hostelForm, name: e.target.value })} required className="w-full" />
          </div>
          <div className="field">
            <label htmlFor="type">Type</label>
            <Dropdown id="type" value={hostelForm.type} options={hostelTypes} onChange={(e) => setHostelForm({ ...hostelForm, type: e.value })} className="w-full" />
          </div>
          <div className="field">
            <label htmlFor="capacity">Capacity</label>
            <InputNumber id="capacity" value={hostelForm.capacity} onValueChange={(e) => setHostelForm({ ...hostelForm, capacity: e.value })} required className="w-full" />
          </div>
          <div className="field">
            <label htmlFor="address">Address</label>
            <InputText id="address" value={hostelForm.address} onChange={(e) => setHostelForm({ ...hostelForm, address: e.target.value })} className="w-full" />
          </div>
          <div className="flex justify-content-end mt-2">
            <Button type="submit" label="Save" loading={createHostelMutation.isPending} />
          </div>
        </form>
      </Dialog>

      <Dialog header="Add New Room" visible={showRoomDialog} style={{ width: '450px' }} onHide={() => setShowRoomDialog(false)}>
        <form onSubmit={handleCreateRoom} className="flex flex-column gap-3 mt-3">
          <div className="field">
            <label htmlFor="roomNo">Room Number</label>
            <InputText id="roomNo" value={roomForm.roomNo} onChange={(e) => setRoomForm({ ...roomForm, roomNo: e.target.value })} required className="w-full" />
          </div>
          <div className="field">
            <label htmlFor="roomType">Room Type</label>
            <InputText id="roomType" value={roomForm.type} onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })} required className="w-full" />
          </div>
          <div className="field">
            <label htmlFor="roomCapacity">Capacity</label>
            <InputNumber id="roomCapacity" value={roomForm.capacity} onValueChange={(e) => setRoomForm({ ...roomForm, capacity: e.value })} required className="w-full" />
          </div>
          <div className="flex justify-content-end mt-2">
            <Button type="submit" label="Save" loading={createRoomMutation.isPending} />
          </div>
        </form>
      </Dialog>
    </div>
  );
}
