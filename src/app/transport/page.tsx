'use client';

import React, { useState, useEffect } from 'react';
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
import { studentsService } from '@/services/students.service';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { AcademicYearSelect } from '@/components/academics/AcademicYearSelect';



export default function TransportPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [showBusDialog, setShowBusDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [routeForm, setRouteForm] = useState({ name: '', startPoint: '', endPoint: '', stops: '' });
  const [busForm, setBusForm] = useState({ registrationNo: '', capacity: 40, routeId: '', driverName: '', driverPhone: '' });
  const [assignForm, setAssignForm] = useState({ studentId: '', routeId: '', stopId: '', stopName: '', feeAmount: 1200, academicYearId: '' });

  // URL pathname and search parameter synchronization for smooth tab changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (pathname.includes('/routes') || tabParam === 'routes') setActiveTab(0);
      else if (pathname.includes('/vehicles') || tabParam === 'vehicles') setActiveTab(1);
      else if (pathname.includes('/live') || tabParam === 'live') setActiveTab(2);
      else if (pathname.includes('/students') || tabParam === 'students') setActiveTab(3);
    }
  }, []);

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

  const { data: assignments, isPending: loadingAssignments } = useQuery({
    queryKey: ['transport-assignments'],
    queryFn: transportService.getAssignments,
  });

  const { data: studentsResponse } = useQuery({
    queryKey: ['students-options'],
    queryFn: () => studentsService.getStudents(1, 100),
  });

  const createRouteMutation = useMutation({
    mutationFn: (data: any) => transportService.createRoute({ ...data, stops: data.stops.split(',').map((s: string) => s.trim()) }),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['transport-routes'] }); 
      setShowRouteDialog(false); 
      setRouteForm({ name: '', startPoint: '', endPoint: '', stops: '' }); 
    },
  });

  const createBusMutation = useMutation({
    mutationFn: transportService.createBus,
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['transport-buses'] }); 
      setShowBusDialog(false); 
      setBusForm({ registrationNo: '', capacity: 40, routeId: '', driverName: '', driverPhone: '' }); 
    },
  });

  const assignMutation = useMutation({
    mutationFn: transportService.assignStudentToRoute,
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['transport-assignments'] });
      setShowAssignDialog(false); 
      setAssignForm({ studentId: '', routeId: '', stopId: '', stopName: '', feeAmount: 1200, academicYearId: '' });
    },
  });

  const activeRoutes = Array.isArray(routes) ? routes : [];
  const activeBuses = Array.isArray(buses) ? buses : [];
  const activeLocations = Array.isArray(locations) ? locations : [];
  const activeAssignments = Array.isArray(assignments) ? assignments : [];
  const studentsList = studentsResponse?.items ?? [];

  const routeOptions = activeRoutes.map((r: any) => ({ label: r.name, value: r.id }));
  const studentOptions = studentsList.map((s: any) => ({
    label: `${s.name} (Admission: ${s.admissionNo}, Roll: ${s.rollNo || 'N/A'})`,
    value: s.id
  }));

  // Resolve stops dynamically for selected route in dialog
  const selectedRouteObj = activeRoutes.find((r: any) => r.id === assignForm.routeId);
  const stopOptions = selectedRouteObj && Array.isArray(selectedRouteObj.stops)
    ? selectedRouteObj.stops.map((s: any) => {
        const name = typeof s === 'object' && s !== null ? s.name : s;
        const id = typeof s === 'object' && s !== null ? s.id : s;
        return { label: name, value: id };
      })
    : [];

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Transport" />
<div className="flex flex-col gap-4 pb-10">
        
        {/* Header Block */}
        <div className="flex flex-col items-start gap-4 pb-4">
          {/* <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Transport Command Center</h1>
            <p className="text-slate-400 mt-1 text-sm md:text-base">
              Manage school bus routes, track live fleet GPS, and allocate students to stops.
            </p>
          </div> */}

          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => setShowRouteDialog(true)}
              className="flex-1 md:flex-none px-4 py-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium rounded-md shadow-sm transition-all text-sm flex items-center justify-center gap-2"
            >
              <i className="pi pi-map-marker text-xs"></i>
              Add Route
            </button>
            <button 
              onClick={() => setShowBusDialog(true)}
              className="flex-1 md:flex-none bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white font-extrabold shadow-md border-0 ring-1 ring-black/5 dark:ring-white/10 uppercase tracking-wider text-[11px] px-5 py-2.5 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <i className="pi pi-truck text-xs"></i>
              Add Vehicle
            </button>
          </div>
        </div>

        {/* Live Status Tracker Alert */}
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 p-4 rounded-md flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <div>
              <span className="font-semibold text-zinc-900 dark:text-emerald-400 text-sm">Real-time GPS Feed Active</span>
              <span className="text-xs text-zinc-600 dark:text-emerald-500 ml-2">
                · {activeLocations.length} buses transmitting geo-coordinates (Uber H3 Indexing enabled)
              </span>
            </div>
          </div>
          <Tag value="ACTIVE" severity="success" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 px-3 py-1 font-bold text-[10px] rounded-md" />
        </div>

        {/* Control Bar */}
        <div className="bg-white dark:bg-zinc-900 p-2 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-sm flex justify-end gap-2 w-max ml-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 px-3 rounded-md transition-all text-xs font-semibold ${
              viewMode === 'grid' 
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm' 
                : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
            title="Visual Cards"
          >
            <i className="pi pi-th-large mr-1.5 text-[10px]"></i> Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 px-3 rounded-md transition-all text-xs font-semibold ${
              viewMode === 'table' 
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm' 
                : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
            title="Tabular Data"
          >
            <i className="pi pi-list mr-1.5 text-[10px]"></i> Table
          </button>
        </div>

        {/* Tab Boards */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm overflow-hidden mt-4">
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
            const tabPaths = ['/transport/routes', '/transport/vehicles', '/transport/live', '/transport/students'];
            window.history.pushState({}, '', tabPaths[e.index]);
          }}>
            
            {/* Routes Tab */}
            <TabPanel header="Bus Routes">
              <div className="p-4">
                {loadingRoutes ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-zinc-400">Loading routes...</span>
                  </div>
                ) : activeRoutes.length === 0 ? (
                  <p className="p-8 text-center text-zinc-400">No route lines configured yet.</p>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                    {activeRoutes.map((route: any) => (
                        <div key={route.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-all group animate-fade-in">
                          <div className="p-5 flex items-start gap-4">
                            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                              <i className="pi pi-map-marker text-xl"></i>
                            </div>
                            <div className="flex flex-col w-full">
                              <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">{route.name}</h3>
                                <Tag value={route.status} severity={route.status === 'ACTIVE' ? 'success' : 'warning'} className="text-[9px] px-2 py-0.5 rounded-md" />
                              </div>
                              <p className="text-xs text-zinc-500 font-medium mt-1 truncate">
                                {route.startPoint} <i className="pi pi-arrow-right mx-1 text-[8px]"></i> {route.endPoint}
                              </p>
                            </div>
                          </div>
                          
                          <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-col gap-2">
                            <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">Stops Timeline</span>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                              {route.stops.map((stop: string, i: number) => (
                                <span key={i} className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded-md whitespace-nowrap">
                                  {stop}
                                </span>
                              ))}
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
                              <span key={i} className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md font-medium border border-blue-100 dark:border-blue-900/30">
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
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-zinc-400">Loading vehicles...</span>
                  </div>
                ) : activeBuses.length === 0 ? (
                  <p className="p-8 text-center text-zinc-400">No buses registered yet.</p>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
                    {activeBuses.map((bus: any) => (
                      <div 
                        key={bus.id} 
                        className="border border-zinc-200 dark:border-zinc-800 p-5 rounded-md bg-white dark:bg-zinc-900 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/30">
                              <i className="pi pi-car text-sm"></i>
                            </div>
                            <div>
                              <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">{bus.registrationNo}</h3>
                              <p className="text-[10px] text-zinc-500">Capacity: {bus.capacity} seats</p>
                            </div>
                          </div>
                          <Tag value="Vehicle" severity="warning" className="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 font-bold text-[9px] px-2 py-0.5 rounded-md" />
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-md text-xs flex flex-col gap-1 border border-zinc-100 dark:border-zinc-800">
                          <div className="flex justify-between">
                            <span className="text-zinc-500 font-medium">Assigned Route:</span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-300">{bus.routeName || 'Unassigned'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500 font-medium">Driver:</span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-300">{bus.driverName || '—'}</span>
                          </div>
                          {bus.driverPhone && (
                            <div className="flex justify-between">
                              <span className="text-zinc-500 font-medium">Contact:</span>
                              <span className="font-mono text-zinc-800 dark:text-zinc-400">{bus.driverPhone}</span>
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
            </TabPanel>            {/* Live locations Tab */}
            <TabPanel header="GPS Live Fleet Tracker">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-4">
                
                {/* stylized SVG Fleet Map */}
                <div className="lg:col-span-3 flex flex-col gap-3">
                  <div>
                    <h3 className="text-base font-bold text-zinc-800 dark:text-white">Active Route Tracking Map</h3>
                    <p className="text-[11px] text-zinc-400">Live vector network representation of active school commutes.</p>
                  </div>
                  
                  <div className="relative w-full h-[400px] bg-zinc-950 rounded-md overflow-hidden border border-zinc-900 shadow-inner flex items-center justify-center">
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] opacity-30"></div>
                    
                    {/* stylized Vector roads and routes */}
                    <svg className="w-full h-full p-4" viewBox="0 0 800 400">
                      <defs>
                        <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#1e293b" />
                          <stop offset="100%" stopColor="#334155" />
                        </linearGradient>
                      </defs>
                      
                      {/* Road networks */}
                      <path d="M 50 100 L 750 100" stroke="url(#roadGrad)" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.6" />
                      <path d="M 50 300 L 750 300" stroke="url(#roadGrad)" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.6" />
                      <path d="M 200 50 L 200 350" stroke="url(#roadGrad)" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.6" />
                      <path d="M 600 50 L 600 350" stroke="url(#roadGrad)" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.6" />
                      
                      {/* Active Route Lines */}
                      <path d="M 100 100 L 200 100 L 200 300 L 500 300" stroke="#6366f1" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="8 6" className="animate-[dash_12s_linear_infinite]" />
                      <path d="M 600 100 L 600 200 L 300 200 L 300 300" stroke="#10b981" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="8 6" className="animate-[dash_10s_linear_infinite]" />

                      {/* Bus Stops Pins */}
                      <g transform="translate(100, 100)">
                        <circle r="5" fill="#6366f1" />
                        <circle r="12" fill="#6366f1" opacity="0.15" className="animate-ping" />
                        <text y="-14" textAnchor="middle" className="text-[10px] font-extrabold fill-zinc-400 font-sans">Stop A (Main Gate)</text>
                      </g>
                      <g transform="translate(200, 200)">
                        <circle r="5" fill="#10b981" />
                        <circle r="12" fill="#10b981" opacity="0.15" className="animate-ping" />
                        <text y="-14" textAnchor="middle" className="text-[10px] font-extrabold fill-zinc-400 font-sans">Stop B (Sector 12)</text>
                      </g>
                      <g transform="translate(500, 300)">
                        <circle r="5" fill="#6366f1" />
                        <text y="-14" textAnchor="middle" className="text-[10px] font-extrabold fill-zinc-400 font-sans">Stop C (Crossroads)</text>
                      </g>
                      <g transform="translate(600, 100)">
                        <circle r="5" fill="#10b981" />
                        <text y="-14" textAnchor="middle" className="text-[10px] font-extrabold fill-zinc-400 font-sans">Stop D (High Street)</text>
                      </g>
                      
                      {/* Pulsing Active Vehicles */}
                      <g transform="translate(170, 100)">
                        <circle r="8" fill="#fbbf24" />
                        <circle r="16" fill="#fbbf24" opacity="0.2" className="animate-ping" />
                        <text y="22" textAnchor="middle" className="text-[9px] font-black fill-amber-400 font-mono">Bus DL-10A</text>
                      </g>
                      <g transform="translate(420, 200)">
                        <circle r="8" fill="#10b981" />
                        <circle r="16" fill="#10b981" opacity="0.2" className="animate-ping" />
                        <text y="22" textAnchor="middle" className="text-[9px] font-black fill-emerald-400 font-mono">Bus MH-04</text>
                      </g>
                    </svg>
                    
                    {/* Map Legend */}
                    <div className="absolute bottom-4 left-4 bg-zinc-900/90 border border-zinc-800 p-3 rounded-md flex gap-4 text-[10px] font-bold text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Route Alpha
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Route Beta
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span> Live Fleet
                      </div>
                    </div>
                  </div>
                </div>

                {/* Telemetry log table */}
                <div className="lg:col-span-2 flex flex-col gap-3">
                  <div>
                    <h3 className="text-base font-bold text-zinc-800 dark:text-white">Live GPS Telemetry</h3>
                    <p className="text-[11px] text-zinc-400">Real-time coordinates and speed feed.</p>
                  </div>
                  
                  <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-4 min-h-[400px]">
                    {activeLocations.length > 0 ? (
                      <DataTable value={activeLocations} className="p-datatable-sm" stripedRows>
                        <Column field="busRegistrationNo" header="Bus ID" className="font-semibold text-zinc-900 dark:text-white text-xs" />
                        <Column field="routeName" header="Route" className="text-xs" />
                        <Column field="speed" header="Speed" body={(d) => `${d.speed || 35} km/h`} className="text-xs" />
                        <Column field="updatedAt" header="Last Ping" body={() => new Date().toLocaleTimeString('en-IN')} className="text-xs font-mono text-zinc-500" />
                      </DataTable>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 text-zinc-500 h-full min-h-[300px]">
                        <i className="pi pi-compass text-3xl mb-3 animate-spin"></i>
                        <p className="text-xs font-semibold text-center">GPS Satellite Signal Transmitting...</p>
                        <span className="text-[10px] text-zinc-500 text-center mt-1">Bus telemetry feeds are actively rendering on the route tracking cockpit above.</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </TabPanel>

            {/* Student Commute Mappings Tab */}
            <TabPanel header="Student Commute Mappings">
              <div className="p-4">
                {loadingAssignments ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-zinc-400">Loading student transport mappings...</span>
                  </div>
                ) : activeAssignments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50 dark:bg-zinc-900/50">
                    <i className="pi pi-users text-4xl mb-3 text-blue-400"></i>
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No Student COMMUTE Mappings Registered</p>
                    <p className="text-xs text-zinc-500 mt-1">Map students to vehicles and route stops using the "Assign Student" panel.</p>
                  </div>
                ) : (
                  <DataTable
                    value={activeAssignments}
                    className="p-datatable-sm"
                    stripedRows
                    paginator
                    rows={10}
                    emptyMessage="No assignments found."
                  >
                    <Column 
                      header="Student Name" 
                      body={(d) => (
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{d.student?.name || '—'}</span>
                          <span className="text-[10px] text-zinc-500">ID: {d.studentId?.substring(0, 8)}...</span>
                        </div>
                      )} 
                    />
                    <Column 
                      header="Admission / Roll" 
                      body={(d) => (
                        <div className="flex flex-col text-xs font-mono">
                          <span className="text-zinc-700 dark:text-zinc-300">Adm: {d.student?.admissionNo || '—'}</span>
                          {d.student?.rollNo && <span className="text-zinc-500">Roll: {d.student?.rollNo}</span>}
                        </div>
                      )} 
                    />
                    <Column 
                      header="Commute Route Line" 
                      body={(d) => (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-200">{d.route?.name || '—'}</span>
                        </div>
                      )} 
                    />
                    <Column 
                      header="Vehicle No" 
                      body={(d) => (
                        <span className="text-xs font-bold bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 px-2.5 py-1 rounded-md font-mono">
                          {d.route?.vehicle?.vehicleNo || 'Unassigned'}
                        </span>
                      )} 
                    />
                    <Column 
                      header="Commute Stop" 
                      body={(d) => (
                        <div className="flex items-center gap-1 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                          <i className="pi pi-map-marker text-blue-500 text-[10px]"></i>
                          <span>{d.pickupStop?.name || d.stopId || '—'}</span>
                        </div>
                      )} 
                    />
                    <Column 
                      header="Commute Fees" 
                      body={(d) => (
                        <span className="font-bold text-zinc-900 dark:text-emerald-400 font-mono text-sm">
                          ₹{d.feeAmount !== null ? Number(d.feeAmount).toLocaleString('en-IN') : '0'}
                        </span>
                      )} 
                    />
                    <Column 
                      header="Commute Status" 
                      body={(d) => (
                        <Tag 
                          value={d.isActive ? 'ACTIVE' : 'SUSPENDED'} 
                          severity={d.isActive ? 'success' : 'danger'} 
                          className="font-bold text-[10px] rounded-full px-2.5" 
                        />
                      )} 
                    />
                  </DataTable>
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
        className="dialog-custom rounded-md"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button label="Cancel" className="p-button-text p-2 text-zinc-500" onClick={() => setShowRouteDialog(false)} />
            <Button 
              label="Create Route" 
              icon="pi pi-check" 
              loading={createRouteMutation.isPending} 
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 px-4 rounded-md font-medium" 
              onClick={() => createRouteMutation.mutate(routeForm)} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Route Name *</label>
            <InputText value={routeForm.name} onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })} className="p-2.5 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-md outline-none" placeholder="e.g. Route A — North Campus" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Start Point *</label>
              <InputText value={routeForm.startPoint} onChange={(e) => setRouteForm({ ...routeForm, startPoint: e.target.value })} className="p-2.5 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-md outline-none" placeholder="e.g. School Gate" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">End Point *</label>
              <InputText value={routeForm.endPoint} onChange={(e) => setRouteForm({ ...routeForm, endPoint: e.target.value })} className="p-2.5 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-md outline-none" placeholder="e.g. City Center" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Stops (comma-separated)</label>
            <InputText value={routeForm.stops} onChange={(e) => setRouteForm({ ...routeForm, stops: e.target.value })} className="p-2.5 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-md outline-none" placeholder="Stop 1, Stop 2, Stop 3" />
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
        className="dialog-custom rounded-md"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button label="Cancel" className="p-button-text p-2 text-zinc-500" onClick={() => setShowBusDialog(false)} />
            <Button 
              label="Register Bus" 
              icon="pi pi-check" 
              loading={createBusMutation.isPending} 
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 px-4 rounded-md font-medium" 
              onClick={() => createBusMutation.mutate(busForm)} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Registration Number *</label>
            <InputText value={busForm.registrationNo} onChange={(e) => setBusForm({ ...busForm, registrationNo: e.target.value })} className="p-2.5 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-md outline-none" placeholder="e.g. MH-12-AB-1234" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Seating Capacity</label>
            <InputNumber value={busForm.capacity} onValueChange={(e) => setBusForm({ ...busForm, capacity: e.value || 40 })} className="border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-md" inputClassName="p-2.5 rounded-md w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Assign Route Line</label>
            <Dropdown value={busForm.routeId} options={routeOptions} onChange={(e) => setBusForm({ ...busForm, routeId: e.value })} placeholder="Select route" className="w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Driver Name</label>
              <InputText value={busForm.driverName} onChange={(e) => setBusForm({ ...busForm, driverName: e.target.value })} className="p-2.5 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-md outline-none" placeholder="Driver full name" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Driver Phone</label>
              <InputText value={busForm.driverPhone} onChange={(e) => setBusForm({ ...busForm, driverPhone: e.target.value })} className="p-2.5 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-md outline-none" placeholder="+91 98765 43210" />
            </div>
          </div>
        </div>
      </Dialog>

      {/* Dialog: Assign Student */}
      <Dialog 
        header="Assign Student to Transport" 
        visible={showAssignDialog} 
        style={{ width: '450px' }} 
        modal 
        onHide={() => setShowAssignDialog(false)}
        className="dialog-custom rounded-md animate-none"
        footer={
          <div className="flex justify-end gap-2 p-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button label="Cancel" className="p-button-text p-2 text-zinc-500" onClick={() => setShowAssignDialog(false)} />
            <Button 
              label="Assign Commute" 
              icon="pi pi-check" 
              loading={assignMutation.isPending} 
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 px-4 rounded-md font-medium" 
              onClick={() => assignMutation.mutate(assignForm)} 
            />
          </div>
        }
      >
        <div className="flex flex-col gap-4 mt-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Select Enrolled Student *</label>
            <Dropdown 
              value={assignForm.studentId} 
              options={studentOptions} 
              onChange={(e) => setAssignForm({ ...assignForm, studentId: e.value })} 
              filter 
              placeholder="Search student by name/admission" 
              className="w-full" 
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Assign Commute Route *</label>
            <Dropdown 
              value={assignForm.routeId} 
              options={routeOptions} 
              onChange={(e) => setAssignForm({ ...assignForm, routeId: e.value, stopId: '', stopName: '' })} 
              placeholder="Select active route line" 
              className="w-full" 
            />
          </div>

          {assignForm.routeId && (
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Select Commute Stop *</label>
              {stopOptions.length > 0 ? (
                <Dropdown 
                  value={assignForm.stopId} 
                  options={stopOptions} 
                  onChange={(e) => {
                    const selStop = stopOptions.find((st: any) => st.value === e.value);
                    setAssignForm({ ...assignForm, stopId: e.value, stopName: selStop ? selStop.label : '' });
                  }} 
                  placeholder="Select designated boarding stop" 
                  className="w-full" 
                />
              ) : (
                <InputText 
                  value={assignForm.stopName} 
                  onChange={(e) => setAssignForm({ ...assignForm, stopName: e.target.value, stopId: e.target.value })} 
                  className="p-2.5 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-md outline-none" 
                  placeholder="Type boarding stop name" 
                />
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Academic Commute Fee (₹)</label>
              <InputNumber 
                value={assignForm.feeAmount} 
                onValueChange={(e) => setAssignForm({ ...assignForm, feeAmount: e.value || 0 })} 
                className="border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-md" 
                inputClassName="p-2.5 rounded-md w-full" 
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">Academic Session</label>
              <AcademicYearSelect
                value={assignForm.academicYearId}
                onChange={(id) => setAssignForm({ ...assignForm, academicYearId: id })}
                className="p-2.5 border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 rounded-md outline-none w-full"
              />
            </div>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
