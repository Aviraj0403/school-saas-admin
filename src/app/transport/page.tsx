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

  const routeOptions = Array.isArray(routes) ? routes.map((r: any) => ({ label: r.name, value: r.id })) : [];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transport Management</h1>
            <p className="text-gray-500 mt-1">Manage bus routes, vehicles, GPS tracking, and student assignments.</p>
          </div>
          <div className="flex gap-2">
            <Button label="Assign Student" icon="pi pi-user-plus" className="p-button-secondary bg-slate-700 text-white p-2 px-4" onClick={() => setShowAssignDialog(true)} />
            <Button label="Add Bus" icon="pi pi-car" className="p-button-secondary bg-slate-600 text-white p-2 px-4" onClick={() => setShowBusDialog(true)} />
            <Button label="Add Route" icon="pi pi-map" className="bg-primary text-white p-2 px-4" onClick={() => setShowRouteDialog(true)} />
          </div>
        </div>

        {/* Live GPS status bar */}
        <Card className="shadow-sm border border-gray-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">Live GPS Tracking</span>
            </div>
            <span className="text-sm text-gray-500">
              {Array.isArray(locations) ? locations.length : 0} buses reporting location · Powered by Uber H3 hexagonal indexing
            </span>
            <Tag value="LIVE" severity="success" className="ml-auto" />
          </div>
        </Card>

        <Card className="shadow-sm border border-gray-100 dark:border-slate-800">
          <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
            <TabPanel header="Routes">
              <DataTable
                value={Array.isArray(routes) ? routes : []}
                loading={loadingRoutes}
                className="p-datatable-sm mt-3"
                emptyMessage="No routes configured yet."
                stripedRows
              >
                <Column field="name" header="Route Name" sortable />
                <Column field="startPoint" header="Start Point" />
                <Column field="endPoint" header="End Point" />
                <Column
                  field="stops"
                  header="Stops"
                  body={(d) => (
                    <div className="flex flex-wrap gap-1">
                      {(d.stops || []).map((s: string, i: number) => (
                        <span key={i} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                />
              </DataTable>
            </TabPanel>

            <TabPanel header="Buses">
              <DataTable
                value={Array.isArray(buses) ? buses : []}
                loading={loadingBuses}
                className="p-datatable-sm mt-3"
                emptyMessage="No buses registered yet."
                stripedRows
              >
                <Column field="registrationNo" header="Reg. No." sortable />
                <Column field="capacity" header="Capacity" />
                <Column field="routeName" header="Assigned Route" body={(d) => d.routeName || '—'} />
                <Column field="driverName" header="Driver" body={(d) => d.driverName || '—'} />
                <Column field="driverPhone" header="Driver Phone" body={(d) => d.driverPhone || '—'} />
              </DataTable>
            </TabPanel>

            <TabPanel header="Live Locations">
              <div className="mt-3">
                {Array.isArray(locations) && locations.length > 0 ? (
                  <DataTable value={locations} className="p-datatable-sm" stripedRows>
                    <Column field="busRegistrationNo" header="Bus" />
                    <Column field="routeName" header="Route" />
                    <Column field="lat" header="Latitude" body={(d) => d.lat?.toFixed(6)} />
                    <Column field="lng" header="Longitude" body={(d) => d.lng?.toFixed(6)} />
                    <Column field="speed" header="Speed (km/h)" body={(d) => d.speed ? `${d.speed} km/h` : '—'} />
                    <Column field="updatedAt" header="Last Update" body={(d) => d.updatedAt ? new Date(d.updatedAt).toLocaleTimeString('en-IN') : '—'} />
                  </DataTable>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <i className="pi pi-map-marker text-4xl mb-3"></i>
                    <p>No live GPS data available. Buses will appear here when active.</p>
                  </div>
                )}
              </div>
            </TabPanel>
          </TabView>
        </Card>
      </div>

      {/* Dialog: Add Route */}
      <Dialog header="Add Bus Route" visible={showRouteDialog} style={{ width: '460px' }} modal onHide={() => setShowRouteDialog(false)}>
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Route Name *</label>
            <InputText value={routeForm.name} onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="e.g. Route A — North Campus" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Start Point *</label>
              <InputText value={routeForm.startPoint} onChange={(e) => setRouteForm({ ...routeForm, startPoint: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="e.g. School Gate" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">End Point *</label>
              <InputText value={routeForm.endPoint} onChange={(e) => setRouteForm({ ...routeForm, endPoint: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="e.g. City Center" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Stops (comma-separated)</label>
            <InputText value={routeForm.stops} onChange={(e) => setRouteForm({ ...routeForm, stops: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="Stop 1, Stop 2, Stop 3" />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowRouteDialog(false)} />
            <Button label="Create Route" icon="pi pi-check" loading={createRouteMutation.isPending} className="bg-primary text-white p-2 px-4" onClick={() => createRouteMutation.mutate(routeForm)} />
          </div>
        </div>
      </Dialog>

      {/* Dialog: Add Bus */}
      <Dialog header="Register Bus" visible={showBusDialog} style={{ width: '440px' }} modal onHide={() => setShowBusDialog(false)}>
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Registration Number *</label>
            <InputText value={busForm.registrationNo} onChange={(e) => setBusForm({ ...busForm, registrationNo: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="e.g. MH-12-AB-1234" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Seating Capacity</label>
            <InputNumber value={busForm.capacity} onValueChange={(e) => setBusForm({ ...busForm, capacity: e.value || 40 })} className="border border-gray-200 rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Assign Route</label>
            <Dropdown value={busForm.routeId} options={routeOptions} onChange={(e) => setBusForm({ ...busForm, routeId: e.value })} placeholder="Select route" className="border border-gray-200 rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Driver Name</label>
              <InputText value={busForm.driverName} onChange={(e) => setBusForm({ ...busForm, driverName: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="Driver full name" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Driver Phone</label>
              <InputText value={busForm.driverPhone} onChange={(e) => setBusForm({ ...busForm, driverPhone: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="+91 98765 43210" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowBusDialog(false)} />
            <Button label="Register Bus" icon="pi pi-check" loading={createBusMutation.isPending} className="bg-primary text-white p-2 px-4" onClick={() => createBusMutation.mutate(busForm)} />
          </div>
        </div>
      </Dialog>

      {/* Dialog: Assign Student */}
      <Dialog header="Assign Student to Route" visible={showAssignDialog} style={{ width: '420px' }} modal onHide={() => setShowAssignDialog(false)}>
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Student ID *</label>
            <InputText value={assignForm.studentId} onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="Student UUID or Admission No" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Route *</label>
            <Dropdown value={assignForm.routeId} options={routeOptions} onChange={(e) => setAssignForm({ ...assignForm, routeId: e.value })} placeholder="Select route" className="border border-gray-200 rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">Boarding Stop *</label>
            <InputText value={assignForm.stopName} onChange={(e) => setAssignForm({ ...assignForm, stopName: e.target.value })} className="p-2 border border-gray-200 rounded-md" placeholder="e.g. City Center Stop" />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button label="Cancel" className="p-button-text p-2" onClick={() => setShowAssignDialog(false)} />
            <Button label="Assign" icon="pi pi-check" loading={assignMutation.isPending} className="bg-primary text-white p-2 px-4" onClick={() => assignMutation.mutate(assignForm)} />
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
