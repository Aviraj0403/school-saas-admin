'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dropdown } from 'primereact/dropdown';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transportService } from '@/services/transport.service';

export default function TransportPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [showBusDialog, setShowBusDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [routeForm, setRouteForm] = useState({ name: '', startPoint: '', endPoint: '', stops: '' });
  const [busForm, setBusForm] = useState({ registrationNo: '', capacity: 40, routeId: '', driverName: '', driverPhone: '' });
  const [assignForm, setAssignForm] = useState({ studentId: '', routeId: '', stopName: '' });

  const { data: routes, isPending: loadingRoutes } = useQuery({
    queryKey: ['transport-routes'],
    queryFn: transportService.getRoutes,
  });

  const { data: buses, isPending: loadingBuses } = useQuery({
    queryKey: ['transport-buses'],
    queryFn: transportService.getBuses,
  });

  const { data: locations } = useQuery({
    queryKey: ['transport-locations'],
    queryFn: transportService.getBusLocations,
    refetchInterval: 30000, // refresh every 30s for live tracking
  });

  const createRouteMutation = useMutation({
    mutationFn: (data: any) => transportService.createRoute({ ...data, stops: data.stops.split(',').map((s: string) => s.trim()) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transport-routes'] }); setShowRouteDialog(false); setRouteForm({ name: '', startPoint: '', endPoint: '', stops: '' }); },
  });

  const createBusMutation = useMutation({
    mutationFn: transportService.createBus,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transport-buses'] }); setShowBusDialog(false); setBusForm({ registrationNo: '', capacity: 40, routeId: '', driverName: '', driverPhone: '' }); },
  });

  const assignMutation = useMutation({
    mutationFn: transportService.assignStudentToRoute,
    onSuccess: () => { setShowAssignDialog(false); setAssignForm({ studentId: '', routeId: '', stopName: '' }); },
  });

  const activeRoutes = Array.isArray(routes) ? routes : [];
  const activeBuses = Array.isArray(buses) ? buses : [];
  const activeLocations = Array.isArray(locations) ? locations : [];
  const routeOptions = activeRoutes.map((r: any) => ({ label: r.name, value: r.id }));

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto p-1">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 rounded-2xl shadow-xl text-white">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Transport Management</h1>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              Monitor student commutes, manage routes, register buses, and track GPS feeds.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setShowAssignDialog(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all active:scale-95 text-xs md:text-sm"
            >
              Assign Student
            </button>
            <button 
              onClick={() => setShowBusDialog(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all active:scale-95 text-xs md:text-sm"
            >
              Register Bus
            </button>
            <button 
              onClick={() => setShowRouteDialog(true)}
              className="px-5 py-2 bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs md:text-sm"
            >
              Create Route
            </button>
          </div>
        </div>

        {/* Live Status Tracker Alert */}
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-2xl flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-emerald-300 text-sm">Real-time GPS Feed Active</span>
              <span className="text-xs text-slate-500 dark:text-emerald-400/70 ml-2">
                · {activeLocations.length} buses transmitting geo-coordinates (Uber H3 Indexing enabled)
              </span>
            </div>
          </div>
          <Tag value="ACTIVE" severity="success" className="bg-emerald-500 text-white px-3 py-1 font-bold text-[10px] rounded-full" />
        </div>

        {/* Control Bar */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex justify-end gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid' 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
            }`}
            title="Visual Cards"
          >
            <i className="pi pi-th-large text-lg"></i>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'table' 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
            }`}
            title="Tabular Data"
          >
            <i className="pi pi-list text-lg"></i>
          </button>
        </div>

        {/* Tab panels board */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
            
            {/* Routes Tab */}
            <TabPanel header="Bus Routes">
              <div className="p-4">
                {loadingRoutes ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-slate-400">Loading routes...</span>
                  </div>
                ) : activeRoutes.length === 0 ? (
                  <p className="p-8 text-center text-slate-400">No route lines configured yet.</p>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                    {activeRoutes.map((route: any) => (
                      <div 
                        key={route.id} 
                        className="border border-slate-100 dark:border-slate-800/80 p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-extrabold text-slate-800 dark:text-white text-base">{route.name}</h3>
                          <Tag value="Route Line" className="bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 px-2.5 py-1 text-[10px] font-bold rounded-full" />
                        </div>
                        
                        {/* Stops Timeline Visualizer */}
                        <div className="flex flex-col gap-2 relative pl-4 mt-2">
                          <div className="absolute left-1.5 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-850"></div>
                          
                          <div className="flex items-center gap-2 relative">
                            <span className="absolute -left-[14px] w-2 h-2 rounded-full bg-blue-500 border border-white"></span>
                            <span className="text-xs font-semibold text-slate-400">Start Point:</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-350">{route.startPoint}</span>
                          </div>

                          {(route.stops || []).map((stop: any, index: number) => {
                            const name = typeof stop === 'object' && stop !== null ? stop.name : stop;
                            return (
                              <div key={index} className="flex items-center gap-2 relative my-1">
                                <span className="absolute -left-[14px] w-2 h-2 rounded-full bg-slate-300 border border-white"></span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{name}</span>
                              </div>
                            );
                          })}

                          <div className="flex items-center gap-2 relative">
                            <span className="absolute -left-[14px] w-2 h-2 rounded-full bg-violet-600 border border-white"></span>
                            <span className="text-xs font-semibold text-slate-400">End Point:</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-350">{route.endPoint}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <DataTable
                    value={activeRoutes}
                    className="p-datatable-sm mt-1"
                    emptyMessage="No routes configured."
                  >
                    <Column field="name" header="Route Name" sortable className="font-semibold" />
                    <Column field="startPoint" header="Start Point" />
                    <Column field="endPoint" header="End Point" />
                    <Column
                      field="stops"
                      header="Stops"
                      body={(d) => (
                        <div className="flex flex-wrap gap-1">
                          {(d.stops || []).map((s: any, i: number) => {
                            const name = typeof s === 'object' && s !== null ? s.name : s;
                            return (
                              <span key={i} className="text-[10px] bg-blue-50 dark:bg-blue-900/35 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                                {name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    />
                  </DataTable>
                )}
              </div>
            </TabPanel>

            {/* Buses Tab */}
            <TabPanel header="Vehicles & Drivers">
              <div className="p-4">
                {loadingBuses ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-slate-400">Loading vehicles...</span>
                  </div>
                ) : activeBuses.length === 0 ? (
                  <p className="p-8 text-center text-slate-400">No buses registered yet.</p>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
                    {activeBuses.map((bus: any) => (
                      <div 
                        key={bus.id} 
                        className="border border-slate-105 dark:border-slate-800 p-5 rounded-3xl bg-slate-50/30 dark:bg-slate-900/40 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                              <i className="pi pi-car text-sm"></i>
                            </div>
                            <div>
                              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">{bus.registrationNo}</h3>
                              <p className="text-[10px] text-slate-450">Capacity: {bus.capacity} seats</p>
                            </div>
                          </div>
                          <Tag value="Vehicle" severity="warning" className="bg-amber-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full" />
                        </div>

                        <div className="bg-slate-100/50 dark:bg-slate-850 p-3 rounded-2xl text-xs flex flex-col gap-1 border border-slate-150/40">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Assigned Route:</span>
                            <span className="font-bold text-slate-850 dark:text-slate-300">{bus.routeName || 'Unassigned'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Driver:</span>
                            <span className="font-bold text-slate-850 dark:text-slate-300">{bus.driverName || '—'}</span>
                          </div>
                          {bus.driverPhone && (
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-medium">Contact:</span>
                              <span className="font-mono text-slate-800 dark:text-slate-450">{bus.driverPhone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <DataTable
                    value={activeBuses}
                    className="p-datatable-sm mt-1"
                    emptyMessage="No buses registered."
                  >
                    <Column field="registrationNo" header="Reg. No." sortable className="font-semibold" />
                    <Column field="capacity" header="Capacity" />
                    <Column field="routeName" header="Assigned Route" body={(d) => d.routeName || '—'} />
                    <Column field="driverName" header="Driver" body={(d) => d.driverName || '—'} />
                    <Column field="driverPhone" header="Driver Phone" body={(d) => d.driverPhone || '—'} />
                  </DataTable>
                )}
              </div>
            </TabPanel>

            {/* Live locations Tab */}
            <TabPanel header="GPS Live Feeds">
              <div className="p-4">
                {activeLocations.length > 0 ? (
                  <DataTable value={activeLocations} className="p-datatable-sm" stripedRows>
                    <Column field="busRegistrationNo" header="Bus ID" className="font-semibold" />
                    <Column field="routeName" header="Active Route" />
                    <Column field="lat" header="Latitude" body={(d) => d.lat?.toFixed(6)} className="font-mono text-xs text-slate-500" />
                    <Column field="lng" header="Longitude" body={(d) => d.lng?.toFixed(6)} className="font-mono text-xs text-slate-500" />
                    <Column field="speed" header="Speed (km/h)" body={(d) => d.speed ? `${d.speed} km/h` : '0 km/h'} />
                    <Column field="updatedAt" header="Last GPS Ping" body={(d) => d.updatedAt ? new Date(d.updatedAt).toLocaleTimeString('en-IN') : '—'} />
                  </DataTable>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-slate-400 dark:text-slate-500">
                    <i className="pi pi-map-marker text-4xl mb-3 animate-bounce"></i>
                    <p className="text-sm font-semibold">No live GPS feeds active.</p>
                    <p className="text-xs text-slate-400 mt-1">Feeds will connect when driver devices begin routes.</p>
                  </div>
                )}
              </div>
            </TabPanel>

          </TabView>
        </div>

      </div>

      {/* Dialog: Add Route */}
      <Dialog 
        header="Create Bus Route" 
        visible={showRouteDialog} 
        style={{ width: '460px' }} 
        modal 
        onHide={() => setShowRouteDialog(false)}
        className="dialog-custom rounded-3xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowRouteDialog(false)} />
            <Button 
              label="Create Route" 
              icon="pi pi-check" 
              loading={createRouteMutation.isPending} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" 
              onClick={() => createRouteMutation.mutate(routeForm)} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Route Name *</label>
            <InputText value={routeForm.name} onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })} className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="e.g. Route A — North Campus" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Start Point *</label>
              <InputText value={routeForm.startPoint} onChange={(e) => setRouteForm({ ...routeForm, startPoint: e.target.value })} className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="e.g. School Gate" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">End Point *</label>
              <InputText value={routeForm.endPoint} onChange={(e) => setRouteForm({ ...routeForm, endPoint: e.target.value })} className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="e.g. City Center" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Stops (comma-separated)</label>
            <InputText value={routeForm.stops} onChange={(e) => setRouteForm({ ...routeForm, stops: e.target.value })} className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="Stop 1, Stop 2, Stop 3" />
          </div>
        </div>
      </Dialog>

      {/* Dialog: Add Bus */}
      <Dialog 
        header="Register Bus Vehicle" 
        visible={showBusDialog} 
        style={{ width: '440px' }} 
        modal 
        onHide={() => setShowBusDialog(false)}
        className="dialog-custom rounded-3xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowBusDialog(false)} />
            <Button 
              label="Register Bus" 
              icon="pi pi-check" 
              loading={createBusMutation.isPending} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" 
              onClick={() => createBusMutation.mutate(busForm)} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Registration Number *</label>
            <InputText value={busForm.registrationNo} onChange={(e) => setBusForm({ ...busForm, registrationNo: e.target.value })} className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="e.g. MH-12-AB-1234" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Seating Capacity</label>
            <InputNumber value={busForm.capacity} onValueChange={(e) => setBusForm({ ...busForm, capacity: e.value || 40 })} className="border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Assign Route Line</label>
            <Dropdown value={busForm.routeId} options={routeOptions} onChange={(e) => setBusForm({ ...busForm, routeId: e.value })} placeholder="Select route" className="border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl animate-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Driver Name</label>
              <InputText value={busForm.driverName} onChange={(e) => setBusForm({ ...busForm, driverName: e.target.value })} className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="Driver full name" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Driver Phone</label>
              <InputText value={busForm.driverPhone} onChange={(e) => setBusForm({ ...busForm, driverPhone: e.target.value })} className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="+91 98765 43210" />
            </div>
          </div>
        </div>
      </Dialog>

      {/* Dialog: Assign Student */}
      <Dialog 
        header="Assign Student to Route" 
        visible={showAssignDialog} 
        style={{ width: '420px' }} 
        modal 
        onHide={() => setShowAssignDialog(false)}
        className="dialog-custom rounded-3xl"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowAssignDialog(false)} />
            <Button 
              label="Assign" 
              icon="pi pi-check" 
              loading={assignMutation.isPending} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 rounded-xl" 
              onClick={() => assignMutation.mutate(assignForm)} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Student ID *</label>
            <InputText value={assignForm.studentId} onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })} className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="Student UUID or Admission No" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Select Route *</label>
            <Dropdown value={assignForm.routeId} options={routeOptions} onChange={(e) => setAssignForm({ ...assignForm, routeId: e.value })} placeholder="Select route" className="border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-slate-500 dark:text-slate-400">Boarding Stop *</label>
            <InputText value={assignForm.stopName} onChange={(e) => setAssignForm({ ...assignForm, stopName: e.target.value })} className="p-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl" placeholder="e.g. City Center Stop" />
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
