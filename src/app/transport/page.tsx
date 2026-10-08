'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transportService } from '@/services/transport.service';
import { studentsService } from '@/services/students.service';
import { AcademicYearSelect } from '@/components/academics/AcademicYearSelect';
import { toast } from 'sonner';
import { Bus, MapPin, Plus, UserPlus, Navigation, LayoutGrid, List, Radio } from 'lucide-react';

export default function TransportPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [showBusDialog, setShowBusDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [routeForm, setRouteForm] = useState({ name: '', startPoint: '', endPoint: '', stops: '' });
  const [busForm, setBusForm] = useState({
    registrationNo: '',
    capacity: 40,
    routeId: '',
    driverName: '',
    driverPhone: '',
  });
  const [assignForm, setAssignForm] = useState({
    studentId: '',
    routeId: '',
    stopId: '',
    stopName: '',
    feeAmount: 1200,
    academicYearId: '',
  });

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
    refetchInterval: 30000,
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
    mutationFn: (data: any) =>
      transportService.createRoute({
        ...data,
        stops: data.stops ? data.stops.split(',').map((s: string) => s.trim()) : [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-routes'] });
      setShowRouteDialog(false);
      setRouteForm({ name: '', startPoint: '', endPoint: '', stops: '' });
      toast.success('Bus route line created.');
    },
    onError: () => toast.error('Failed to create route line.'),
  });

  const createBusMutation = useMutation({
    mutationFn: transportService.createBus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-buses'] });
      setShowBusDialog(false);
      setBusForm({
        registrationNo: '',
        capacity: 40,
        routeId: '',
        driverName: '',
        driverPhone: '',
      });
      toast.success('Bus vehicle registered.');
    },
    onError: () => toast.error('Failed to register bus vehicle.'),
  });

  const assignMutation = useMutation({
    mutationFn: transportService.assignStudentToRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-assignments'] });
      setShowAssignDialog(false);
      setAssignForm({
        studentId: '',
        routeId: '',
        stopId: '',
        stopName: '',
        feeAmount: 1200,
        academicYearId: '',
      });
      toast.success('Student transport assignment recorded.');
    },
    onError: () => toast.error('Failed to assign student to transport route.'),
  });

  const activeRoutes = Array.isArray(routes) ? routes : [];
  const activeBuses = Array.isArray(buses) ? buses : [];
  const activeLocations = Array.isArray(locations) ? locations : [];
  const activeAssignments = Array.isArray(assignments) ? assignments : [];
  const studentsList = studentsResponse?.items ?? [];

  const routeOptions = [
    { label: 'Select Route Line...', value: '' },
    ...activeRoutes.map((r: any) => ({ label: r.name, value: r.id })),
  ];
  const studentOptions = [
    { label: 'Select Student...', value: '' },
    ...studentsList.map((s: any) => ({
      label: `${s.name} (Adm: ${s.admissionNo})`,
      value: s.id,
    })),
  ];

  const selectedRouteObj = activeRoutes.find((r: any) => r.id === assignForm.routeId);
  const stopOptions =
    selectedRouteObj && Array.isArray(selectedRouteObj.stops)
      ? [
          { label: 'Select Boarding Stop...', value: '' },
          ...selectedRouteObj.stops.map((s: any) => {
            const name = typeof s === 'object' && s !== null ? s.name : s;
            const id = typeof s === 'object' && s !== null ? s.id : s;
            return { label: name, value: id };
          }),
        ]
      : [];

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Fleet & Transport" />

      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        {/* Header Block */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Bus className="w-6 h-6 text-brand" />
              Transport Command Center
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Manage bus routes, track live fleet GPS, and allocate student commutes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowAssignDialog(true)}>
              <UserPlus className="w-4 h-4 mr-2" /> Assign Student
            </Button>
            <Button variant="outline" onClick={() => setShowRouteDialog(true)}>
              <MapPin className="w-4 h-4 mr-2" /> Add Route
            </Button>
            <Button onClick={() => setShowBusDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> Register Vehicle
            </Button>
          </div>
        </div>

        {/* Live Status Tracker Alert */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                Real-Time GPS Fleet Feed Active
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">
                · {activeLocations.length} buses transmitting geo-coordinates (Uber H3 Indexing
                enabled)
              </span>
            </div>
          </div>
          <Badge variant="success">ACTIVE FEED</Badge>
        </div>

        {/* Control & Tab Bar */}
        <div className="flex justify-between items-center flex-wrap gap-4 bg-white dark:bg-zinc-900/60 backdrop-blur-xl p-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex p-0.5 rounded-lg flex-wrap gap-1">
            <button
              onClick={() => {
                setActiveTab(0);
                window.history.pushState({}, '', '/transport/routes');
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 0
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Bus Routes
            </button>
            <button
              onClick={() => {
                setActiveTab(1);
                window.history.pushState({}, '', '/transport/vehicles');
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 1
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Vehicles & Drivers
            </button>
            <button
              onClick={() => {
                setActiveTab(2);
                window.history.pushState({}, '', '/transport/live');
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 2
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              GPS Live Fleet Tracker
            </button>
            <button
              onClick={() => {
                setActiveTab(3);
                window.history.pushState({}, '', '/transport/students');
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 3
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Student Commute Mappings
            </button>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-900 text-brand shadow-sm'
                  : 'text-zinc-400'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-900 text-brand shadow-sm'
                  : 'text-zinc-400'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Boards */}
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm">
          {/* Tab 0: Routes */}
          {activeTab === 0 && (
            <div>
              {loadingRoutes ? (
                <div className="p-12 text-center text-zinc-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                  <p className="text-xs">Loading route lines...</p>
                </div>
              ) : activeRoutes.length === 0 ? (
                <div className="p-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    No Bus Routes Configured
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {activeRoutes.map((route: any) => (
                    <div
                      key={route.id}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                            {route.name}
                          </h3>
                          <p className="text-xs text-zinc-500 mt-1 font-medium">
                            {route.startPoint} → {route.endPoint}
                          </p>
                        </div>
                        <Badge variant={route.status === 'ACTIVE' ? 'success' : 'warning'}>
                          {route.status || 'ACTIVE'}
                        </Badge>
                      </div>

                      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                          Stops Timeline
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {route.stops.map((stop: any, i: number) => {
                            const stopName =
                              typeof stop === 'object' && stop !== null ? stop.name : stop;
                            return (
                              <span
                                key={i}
                                className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md font-medium"
                              >
                                {stopName}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-4 py-3">Route Name</th>
                        <th className="px-4 py-3">Start Point</th>
                        <th className="px-4 py-3">End Point</th>
                        <th className="px-4 py-3">Stops</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {activeRoutes.map((r: any) => (
                        <tr key={r.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                            {r.name}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                            {r.startPoint}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                            {r.endPoint}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {(r.stops || []).map((s: any, i: number) => (
                                <Badge key={i} variant="secondary">
                                  {typeof s === 'object' ? s.name : s}
                                </Badge>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 1: Vehicles */}
          {activeTab === 1 && (
            <div>
              {loadingBuses ? (
                <div className="p-12 text-center text-zinc-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                  <p className="text-xs">Loading vehicles...</p>
                </div>
              ) : activeBuses.length === 0 ? (
                <div className="p-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <Bus className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    No Vehicles Registered
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {activeBuses.map((bus: any) => (
                    <div
                      key={bus.id}
                      className="border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-xl bg-white dark:bg-zinc-900 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm font-mono">
                            {bus.registrationNo}
                          </h3>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {bus.capacity} Seats Capacity
                          </p>
                        </div>
                        <Badge variant="info">Vehicle</Badge>
                      </div>

                      <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg text-xs flex flex-col gap-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-500">
                        <div className="flex justify-between">
                          <span>Route:</span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {bus.routeName || 'Unassigned'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Driver:</span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {bus.driverName || '—'}
                          </span>
                        </div>
                        {bus.driverPhone && (
                          <div className="flex justify-between">
                            <span>Phone:</span>
                            <span className="font-mono text-zinc-700 dark:text-zinc-300">
                              {bus.driverPhone}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-4 py-3">Reg. No</th>
                        <th className="px-4 py-3">Capacity</th>
                        <th className="px-4 py-3">Assigned Route</th>
                        <th className="px-4 py-3">Driver</th>
                        <th className="px-4 py-3">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {activeBuses.map((d: any) => (
                        <tr key={d.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="px-4 py-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                            {d.registrationNo}
                          </td>
                          <td className="px-4 py-3 font-mono">{d.capacity}</td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                            {d.routeName || '—'}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                            {d.driverName || '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-zinc-500">
                            {d.driverPhone || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: GPS Live Tracker */}
          {activeTab === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 flex flex-col gap-3">
                <div className="relative w-full h-[360px] bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 shadow-inner flex items-center justify-center">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"></div>
                  <div className="relative text-center p-6 text-zinc-400">
                    <Radio className="w-12 h-12 mx-auto mb-3 text-emerald-500 animate-pulse" />
                    <p className="text-sm font-bold text-zinc-200">Live GPS Vector Radar Display</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {activeLocations.length} Active Telemetry Signals Transmitting
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col gap-3 bg-zinc-50/50 dark:bg-zinc-900/30">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Live GPS Telemetry Log
                </h3>
                <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-3 py-2">Bus ID</th>
                        <th className="px-3 py-2">Speed</th>
                        <th className="px-3 py-2">Ping Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {activeLocations.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-3 py-6 text-center text-zinc-500">
                            Transmitting signal...
                          </td>
                        </tr>
                      ) : (
                        activeLocations.map((loc: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                              {loc.busRegistrationNo}
                            </td>
                            <td className="px-3 py-2 font-mono text-emerald-500">
                              {loc.speed || 35} km/h
                            </td>
                            <td className="px-3 py-2 font-mono text-zinc-400">
                              {new Date().toLocaleTimeString('en-IN')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Student Commute Mappings */}
          {activeTab === 3 && (
            <div>
              {loadingAssignments ? (
                <div className="p-12 text-center text-zinc-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent mb-2" />
                  <p className="text-xs">Loading mappings...</p>
                </div>
              ) : activeAssignments.length === 0 ? (
                <div className="p-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <UserPlus className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    No Student Commute Mappings
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <tr>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Admission No</th>
                        <th className="px-4 py-3">Route Line</th>
                        <th className="px-4 py-3">Boarding Stop</th>
                        <th className="px-4 py-3">Commute Fee</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {activeAssignments.map((d: any, idx: number) => (
                        <tr
                          key={d.id || idx}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                        >
                          <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                            {d.student?.name || '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-zinc-500">
                            {d.student?.admissionNo || '—'}
                          </td>
                          <td className="px-4 py-3 font-medium text-brand">
                            {d.route?.name || '—'}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                            {d.pickupStop?.name || d.stopId || '—'}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold">
                            ₹{Number(d.feeAmount || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={d.isActive ? 'success' : 'danger'}>
                              {d.isActive ? 'ACTIVE' : 'SUSPENDED'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialog: Add Route */}
      <Dialog
        isOpen={showRouteDialog}
        onClose={() => setShowRouteDialog(false)}
        title="Create Bus Route"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Route Name *
            </label>
            <Input
              value={routeForm.name}
              onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
              placeholder="e.g. Route A — North Campus"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Start Point *
              </label>
              <Input
                value={routeForm.startPoint}
                onChange={(e) => setRouteForm({ ...routeForm, startPoint: e.target.value })}
                placeholder="e.g. School Gate"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                End Point *
              </label>
              <Input
                value={routeForm.endPoint}
                onChange={(e) => setRouteForm({ ...routeForm, endPoint: e.target.value })}
                placeholder="e.g. City Center"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Stops (comma-separated)
            </label>
            <Input
              value={routeForm.stops}
              onChange={(e) => setRouteForm({ ...routeForm, stops: e.target.value })}
              placeholder="Stop 1, Stop 2, Stop 3"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowRouteDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createRouteMutation.mutate(routeForm)}
            isLoading={createRouteMutation.isPending}
          >
            Create Route
          </Button>
        </div>
      </Dialog>

      {/* Dialog: Add Bus */}
      <Dialog
        isOpen={showBusDialog}
        onClose={() => setShowBusDialog(false)}
        title="Register Bus Vehicle"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Registration Number *
            </label>
            <Input
              value={busForm.registrationNo}
              onChange={(e) => setBusForm({ ...busForm, registrationNo: e.target.value })}
              placeholder="e.g. MH-12-AB-1234"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Seating Capacity
            </label>
            <Input
              type="number"
              value={busForm.capacity}
              onChange={(e) => setBusForm({ ...busForm, capacity: Number(e.target.value) })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Assign Route Line
            </label>
            <Select
              value={busForm.routeId}
              options={routeOptions}
              onChange={(e) => setBusForm({ ...busForm, routeId: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Driver Name
              </label>
              <Input
                value={busForm.driverName}
                onChange={(e) => setBusForm({ ...busForm, driverName: e.target.value })}
                placeholder="Driver full name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Driver Phone
              </label>
              <Input
                value={busForm.driverPhone}
                onChange={(e) => setBusForm({ ...busForm, driverPhone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowBusDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createBusMutation.mutate(busForm)}
            isLoading={createBusMutation.isPending}
          >
            Register Bus
          </Button>
        </div>
      </Dialog>

      {/* Dialog: Assign Student */}
      <Dialog
        isOpen={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        title="Assign Student to Transport"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Select Student *
            </label>
            <Select
              value={assignForm.studentId}
              options={studentOptions}
              onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              Assign Commute Route *
            </label>
            <Select
              value={assignForm.routeId}
              options={routeOptions}
              onChange={(e) =>
                setAssignForm({ ...assignForm, routeId: e.target.value, stopId: '', stopName: '' })
              }
            />
          </div>

          {assignForm.routeId && (
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Select Commute Stop *
              </label>
              {stopOptions.length > 0 ? (
                <Select
                  value={assignForm.stopId}
                  options={stopOptions}
                  onChange={(e) => {
                    const selStop = stopOptions.find((st: any) => st.value === e.target.value);
                    setAssignForm({
                      ...assignForm,
                      stopId: e.target.value,
                      stopName: selStop ? selStop.label : '',
                    });
                  }}
                />
              ) : (
                <Input
                  value={assignForm.stopName}
                  onChange={(e) =>
                    setAssignForm({
                      ...assignForm,
                      stopName: e.target.value,
                      stopId: e.target.value,
                    })
                  }
                  placeholder="Type boarding stop name..."
                />
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Commute Fee (₹)
              </label>
              <Input
                type="number"
                value={assignForm.feeAmount}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, feeAmount: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                Academic Session
              </label>
              <AcademicYearSelect
                value={assignForm.academicYearId}
                onChange={(id) => setAssignForm({ ...assignForm, academicYearId: id })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => assignMutation.mutate(assignForm)}
            isLoading={assignMutation.isPending}
          >
            Assign Commute
          </Button>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
