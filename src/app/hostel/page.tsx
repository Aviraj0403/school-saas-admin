'use client';

import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { StatCard } from '@/components/ui/StatCard';
import { useHostelDashboard, useHostels, useCreateHostel, useHostelRooms, useCreateHostelRoom, useAdmitBoarder, useDischargeBoarder, useAllBoarders } from '@/hooks/queries/useHostel';

export default function HostelPage() {
  const toast = useRef<Toast>(null);
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
  
  const hostelList = Array.isArray(hostels) ? hostels : (hostels?.data || []);

  const wardensList = hostelList.map((h: any) => ({
    id: h.id,
    name: h.wardenId || 'Unassigned',
    hostelBlock: h.name,
    phone: h.wardenPhone || 'N/A',
    email: 'N/A',
    status: 'ON_DUTY'
  }));

  const wardenLogs: any[] = []; // Logs UI telemetry, waiting on backend logs module

  const boardersList = (allBoardersData || []).map((b: any) => ({
    id: b.studentId, // We use studentId for discharge action
    studentName: b.student?.name || 'Unknown',
    hostelName: b.room?.hostel?.name || 'Unknown',
    roomNo: b.room?.roomNo || 'Unknown',
    academicYear: b.academicYear,
    joinDate: b.joinDate ? new Date(b.joinDate).toISOString().split('T')[0] : 'N/A',
  }));

  const dischargeBoarderMutation = useDischargeBoarder();

  const handleDischarge = (studentId: string, academicYear: string) => {
    if (confirm('Are you sure you want to discharge this resident boarder?')) {
      dischargeBoarderMutation.mutate({ studentId, academicYear }, {
        onSuccess: () => {
          toast.current?.show({ severity: 'success', summary: 'Discharged', detail: 'Resident boarder discharged successfully', life: 3000 });
        }
      });
    }
  };

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

  const roomList = Array.isArray(rooms) ? rooms : (rooms?.data || []);

  return (
    <DashboardLayout>
      <Toast ref={toast} />
      <div className="flex flex-col gap-8 pb-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Hostel & Residences</h1>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <StatCard
            label="Total Hostels"
            value={dashboard?.totalHostels ?? hostelList.length}
            icon="pi pi-building"
            gradientClass="from-blue-500 to-indigo-500"
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

        {/* Tabbed view for Hostel registry sections */}
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
            const tabPaths = ['/hostel/rooms', '/hostel/allocations', '/hostel/wardens'];
            window.history.pushState({}, '', tabPaths[e.index]);
          }}>
            
            {/* Tab 0: Hostel Rooms & Blocks split board */}
            <TabPanel header="Hostel Rooms & Blocks">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-4">
                {/* Hostel list panel */}
                <div className="lg:col-span-3 bg-slate-50/30 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
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
                <div className="lg:col-span-2 bg-slate-50/30 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
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
            </TabPanel>

            {/* Tab 1: Room Allocations list & management */}
            <TabPanel header="Room Allocations">
              <div className="p-4 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Active Resident Boarders</h2>
                    <p className="text-xs text-slate-400">Manage all student allocations across residential block beds.</p>
                  </div>
                </div>

                <DataTable value={boardersList} className="p-datatable-sm" emptyMessage="No resident boarders found.">
                  <Column field="studentName" header="Student Name" className="font-semibold text-slate-800 dark:text-white" />
                  <Column field="hostelName" header="Hostel Block" />
                  <Column field="roomNo" header="Room No" className="font-mono" />
                  <Column field="academicYear" header="Academic Term" />
                  <Column field="joinDate" header="Admission Date" />
                  <Column 
                    header="Actions" 
                    align="center"
                    body={(d) => (
                      <Button 
                        label="Discharge" 
                        icon="pi pi-sign-out" 
                        size="small" 
                        severity="danger" 
                        className="bg-rose-600 text-white p-1 px-2.5 text-xs rounded-xl"
                        onClick={() => handleDischarge(d.id, d.academicYear)}
                      />
                    )}
                  />
                </DataTable>
              </div>
            </TabPanel>

            {/* Tab 2: Warden Logbook */}
            <TabPanel header="Warden Logbook & Entry Logs">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-4">
                
                {/* Wardens List */}
                <div className="lg:col-span-2 bg-slate-50/30 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-white">Hostel Wardens</h2>
                    <p className="text-[11px] text-slate-400">Assigned wardens for safety & oversight.</p>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {wardensList.map(warden => (
                      <div key={warden.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white text-xs">{warden.name}</h4>
                          <span className="text-[10px] text-slate-450">{warden.hostelBlock}</span>
                          <div className="text-[9px] text-slate-400 mt-1 flex flex-col">
                            <span>Phone: {warden.phone}</span>
                            <span>Email: {warden.email}</span>
                          </div>
                        </div>
                        <Tag 
                          value={warden.status === 'ON_DUTY' ? 'On Duty' : 'Off Duty'} 
                          className={warden.status === 'ON_DUTY' ? 'bg-emerald-500/10 text-emerald-650 font-bold text-[9px]' : 'bg-slate-500/10 text-slate-500 font-bold text-[9px]'}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Entry/Exit logs */}
                <div className="lg:col-span-3 bg-slate-50/30 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-white">Access Entry & Exit Logbook</h2>
                    <p className="text-[11px] text-slate-400">Real-time gate check logs managed by wardens.</p>
                  </div>
                  
                  <DataTable value={wardenLogs} className="p-datatable-sm" emptyMessage="No gate logs recorded today.">
                    <Column field="boarderName" header="Student" className="font-bold text-slate-850 dark:text-white text-xs" />
                    <Column field="roomNo" header="Room" className="font-mono text-xs" />
                    <Column 
                      field="action" 
                      header="Action" 
                      body={(d) => (
                        <Tag 
                          value={d.action} 
                          className={`font-bold text-[9px] px-2 py-0.5 rounded-full ${
                            d.action === 'CHECK_IN' ? 'bg-emerald-500/10 text-emerald-650' : 'bg-amber-500/10 text-amber-650'
                          }`}
                        />
                      )}
                    />
                    <Column field="time" header="Time Logged" className="text-slate-450 text-[10px]" />
                    <Column field="remarks" header="Remarks" className="text-slate-450 text-[10px]" />
                  </DataTable>
                </div>
              </div>
            </TabPanel>

          </TabView>
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
