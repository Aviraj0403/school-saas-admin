'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Bus,
  ExternalLink,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  UserCog,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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
  inr,
  tabFromLocation,
} from '@/components/ops/OpsKit';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useAddStop,
  useAssignDriver,
  useAssignStudent,
  useCreateRoute,
  useCreateVehicle,
  useDeleteRoute,
  useDeleteStop,
  useDeleteVehicle,
  useDrivers,
  useTransportAssignments,
  useTransportRoutes,
  useUnassignStudent,
  useUpdateRoute,
  useUpdateStop,
  useUpdateVehicle,
  useVehicleLocation,
  useVehicles,
} from '@/hooks/queries/useTransport';
import { useStaffLite } from '@/hooks/queries/useStaffLite';
import { useClasses } from '@/hooks/queries/useAcademics';
import { useStudentsList } from '@/hooks/queries/useStudents';
import { asList } from '@/lib/utils';

type TabKey = 'vehicles' | 'routes' | 'students' | 'live';
const blankVehicle = { vehicleNo: '', type: 'bus', capacity: '', gpsDeviceId: '' };
const blankRoute = { vehicleId: '', name: '', description: '', morningStart: '', eveningStart: '' };
const blankStop = { name: '', sequence: '1', lat: '', lng: '', morningTime: '', eveningTime: '' };

const mapsLink = (lat: number, lng: number) =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
const embedSrc = (lat: number, lng: number) => {
  const d = 0.004;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
};

function LivePanel() {
  const vehicles = useVehicles();
  const [selected, setSelected] = useState('');
  const loc = useVehicleLocation(selected);
  const list = vehicles.data ?? [];

  if (vehicles.isPending) return <Spinner />;
  if (vehicles.error)
    return <ErrorState error={vehicles.error} onRetry={() => vehicles.refetch()} />;
  if (list.length === 0) return <EmptyState title="No vehicles registered" />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-3">
        {list.map((v: any) => {
          const last = v.locations?.[0];
          return (
            <button
              key={v.id}
              onClick={() => setSelected(v.id)}
              className={`text-left border rounded-xl p-4 flex flex-col gap-1 ${selected === v.id ? 'border-brand bg-brand/5' : 'border-zinc-200/80 dark:border-zinc-800/80'}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">{v.vehicleNo}</span>
                <Badge variant={last ? 'success' : 'secondary'}>
                  {last ? 'Reporting' : 'No GPS data'}
                </Badge>
              </div>
              {last ? (
                <p className="text-[11px] text-zinc-500">
                  Last seen {new Date(last.recordedAt).toLocaleString('en-IN')} ·{' '}
                  {last.speed != null ? `${Math.round(last.speed)} km/h` : 'speed n/a'}
                </p>
              ) : (
                <p className="text-[11px] text-zinc-500">
                  This vehicle has not reported a location yet.
                </p>
              )}
            </button>
          );
        })}
      </div>
      <div className="lg:col-span-3 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col gap-3 min-h-[320px]">
        {!selected ? (
          <EmptyState title="Select a vehicle" hint="Its last-known position will appear here." />
        ) : loc.isPending ? (
          <Spinner />
        ) : loc.error ? (
          <ErrorState error={loc.error} onRetry={() => loc.refetch()} />
        ) : !loc.data ? (
          <EmptyState
            title="No location data"
            hint="This vehicle has never reported a GPS position."
          />
        ) : (
          <>
            <div className="flex justify-between items-center flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-300">
              <span>
                {Number(loc.data.lat).toFixed(5)}, {Number(loc.data.lng).toFixed(5)} ·{' '}
                {new Date(loc.data.recordedAt).toLocaleString('en-IN')}
              </span>
              <a
                href={mapsLink(Number(loc.data.lat), Number(loc.data.lng))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand font-semibold"
              >
                Open in Maps <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <iframe
              title="Vehicle location"
              className="w-full h-72 rounded-lg border border-zinc-200 dark:border-zinc-800"
              src={embedSrc(Number(loc.data.lat), Number(loc.data.lng))}
              loading="lazy"
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function TransportPage() {
  const { isAdmin } = usePermissions();
  // Vehicle directory is admin-only in the nav; teachers get routes, students and live tracking (read-only).
  const tabs = useMemo(() => {
    const t: { key: TabKey; label: string }[] = [];
    if (isAdmin) t.push({ key: 'vehicles', label: 'Vehicles & Drivers' });
    t.push(
      { key: 'routes', label: 'Routes & Stops' },
      { key: 'students', label: 'Student Assignments' },
      { key: 'live', label: 'Live Tracking' }
    );
    return t;
  }, [isAdmin]);

  const [tabKey, setTabKey] = useState<TabKey>('vehicles');
  useEffect(() => {
    const idx = tabFromLocation({ vehicles: 0, routes: 1, students: 2, live: 3 });
    setTabKey((['vehicles', 'routes', 'students', 'live'] as TabKey[])[idx]);
  }, []);
  const activeKey: TabKey = tabs.some((t) => t.key === tabKey) ? tabKey : tabs[0].key;
  const switchTab = (i: number) => {
    setTabKey(tabs[i].key);
    window.history.pushState({}, '', `/transport/${tabs[i].key}`);
  };

  const vehiclesQ = useVehicles();
  const driversQ = useDrivers();
  const routesQ = useTransportRoutes();
  const assignmentsQ = useTransportAssignments();
  const staffQ = useStaffLite();
  const vehicles = vehiclesQ.data ?? [];
  const routes = routesQ.data ?? [];
  const driverByVehicle = useMemo(
    () => new Map((driversQ.data ?? []).map((d: any) => [d.vehicleId, d])),
    [driversQ.data]
  );

  const createVehicleM = useCreateVehicle();
  const updateVehicleM = useUpdateVehicle();
  const deleteVehicleM = useDeleteVehicle();
  const assignDriverM = useAssignDriver();
  const createRouteM = useCreateRoute();
  const updateRouteM = useUpdateRoute();
  const deleteRouteM = useDeleteRoute();
  const addStopM = useAddStop();
  const updateStopM = useUpdateStop();
  const deleteStopM = useDeleteStop();
  const assignStudentM = useAssignStudent();
  const unassignM = useUnassignStudent();

  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [vehicleForm, setVehicleForm] = useState({ ...blankVehicle });
  const [vehicleToDelete, setVehicleToDelete] = useState<any | null>(null);
  const [driverFor, setDriverFor] = useState<any | null>(null);
  const [driver, setDriver] = useState({
    userId: '',
    name: '',
    phone: '',
    attName: '',
    attPhone: '',
  });

  const [routeOpen, setRouteOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any | null>(null);
  const [routeForm, setRouteForm] = useState({ ...blankRoute });
  const [routeToDelete, setRouteToDelete] = useState<any | null>(null);
  const [stopRoute, setStopRoute] = useState<any | null>(null);
  const [editingStop, setEditingStop] = useState<any | null>(null);
  const [stopForm, setStopForm] = useState({ ...blankStop });
  const [stopToDelete, setStopToDelete] = useState<any | null>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assign, setAssign] = useState({
    classId: '',
    studentId: '',
    routeId: '',
    stopId: '',
    academicYearId: '',
    feeAmount: '',
  });
  const [toUnassign, setToUnassign] = useState<any | null>(null);
  const { data: classesData } = useClasses(1, 100);
  const classes = asList<any>(classesData);
  const { data: studentsData } = useStudentsList(1, 100, undefined, assign.classId || undefined);
  const students = asList<any>(studentsData);
  const assignRoute = routes.find((r: any) => r.id === assign.routeId);

  // ── Vehicles ─────────────────────────────────────────────────
  const closeVehicle = () => {
    setVehicleOpen(false);
    setEditingVehicle(null);
    setVehicleForm({ ...blankVehicle });
  };
  const startEditVehicle = (v: any) => {
    setEditingVehicle(v);
    setVehicleForm({
      vehicleNo: v.vehicleNo,
      type: v.type ?? 'bus',
      capacity: String(v.capacity),
      gpsDeviceId: v.gpsDeviceId ?? '',
    });
    setVehicleOpen(true);
  };
  const saveVehicle = () => {
    const capacity = Number(vehicleForm.capacity);
    if (!vehicleForm.vehicleNo.trim()) return toast.error('Vehicle number is required.');
    if (!Number.isInteger(capacity) || capacity < 1)
      return toast.error('Capacity must be a whole number of at least 1.');
    const payload = {
      vehicleNo: vehicleForm.vehicleNo.trim(),
      type: vehicleForm.type,
      capacity,
      gpsDeviceId: vehicleForm.gpsDeviceId.trim() || undefined,
    };
    const done = {
      onSuccess: () => {
        toast.success(editingVehicle ? 'Vehicle updated.' : 'Vehicle added.');
        closeVehicle();
      },
      onError: (e: any) => toast.error(errMsg(e, 'Could not save the vehicle.')),
    };
    if (editingVehicle) updateVehicleM.mutate({ id: editingVehicle.id, data: payload }, done);
    else createVehicleM.mutate(payload, done);
  };
  const startDriver = (v: any) => {
    const d: any = driverByVehicle.get(v.id);
    setDriverFor(v);
    setDriver({
      userId: d?.driverUser?.id ?? '',
      name: v.driverName ?? '',
      phone: v.driverPhone ?? '',
      attName: v.attendantName ?? '',
      attPhone: v.attendantPhone ?? '',
    });
  };
  const saveDriver = () => {
    assignDriverM.mutate(
      {
        vehicleId: driverFor.id,
        data: {
          driverUserId: driver.userId || null,
          driverName: driver.userId ? null : driver.name.trim() || null,
          driverPhone: driver.userId ? null : driver.phone.trim() || null,
          attendantName: driver.attName.trim() || null,
          attendantPhone: driver.attPhone.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toast.success('Driver details saved.');
          setDriverFor(null);
        },
        onError: (e: any) => toast.error(errMsg(e, 'Could not update the driver.')),
      }
    );
  };

  // ── Routes & stops ───────────────────────────────────────────
  const closeRoute = () => {
    setRouteOpen(false);
    setEditingRoute(null);
    setRouteForm({ ...blankRoute });
  };
  const startEditRoute = (r: any) => {
    setEditingRoute(r);
    setRouteForm({
      vehicleId: r.vehicleId ?? '',
      name: r.name,
      description: r.description ?? '',
      morningStart: r.morningStart ?? '',
      eveningStart: r.eveningStart ?? '',
    });
    setRouteOpen(true);
  };
  const saveRoute = () => {
    if (!routeForm.name.trim()) return toast.error('Route name is required.');
    if (!routeForm.vehicleId) return toast.error('Choose the vehicle that runs this route.');
    const payload = {
      vehicleId: routeForm.vehicleId,
      name: routeForm.name.trim(),
      description: routeForm.description.trim() || undefined,
      morningStart: routeForm.morningStart || undefined,
      eveningStart: routeForm.eveningStart || undefined,
    };
    const done = {
      onSuccess: () => {
        toast.success(editingRoute ? 'Route updated.' : 'Route created.');
        closeRoute();
      },
      onError: (e: any) => toast.error(errMsg(e, 'Could not save the route.')),
    };
    if (editingRoute) updateRouteM.mutate({ id: editingRoute.id, data: payload }, done);
    else createRouteM.mutate(payload, done);
  };

  const closeStop = () => {
    setStopRoute(null);
    setEditingStop(null);
    setStopForm({ ...blankStop });
  };
  const startAddStop = (r: any) => {
    setStopRoute(r);
    setEditingStop(null);
    setStopForm({ ...blankStop, sequence: String((r.stops?.length ?? 0) + 1) });
  };
  const startEditStop = (r: any, s: any) => {
    setStopRoute(r);
    setEditingStop(s);
    setStopForm({
      name: s.name,
      sequence: String(s.sequence),
      lat: s.lat == null ? '' : String(s.lat),
      lng: s.lng == null ? '' : String(s.lng),
      morningTime: s.morningTime ?? '',
      eveningTime: s.eveningTime ?? '',
    });
  };
  const saveStop = () => {
    const sequence = Number(stopForm.sequence);
    if (!stopForm.name.trim()) return toast.error('Stop name is required.');
    if (!Number.isInteger(sequence) || sequence < 1)
      return toast.error('Stop order must be a whole number of at least 1.');
    const payload = {
      name: stopForm.name.trim(),
      sequence,
      lat: stopForm.lat === '' ? undefined : Number(stopForm.lat),
      lng: stopForm.lng === '' ? undefined : Number(stopForm.lng),
      morningTime: stopForm.morningTime || undefined,
      eveningTime: stopForm.eveningTime || undefined,
    };
    const done = {
      onSuccess: () => {
        toast.success(editingStop ? 'Stop updated.' : 'Stop added.');
        closeStop();
      },
      onError: (e: any) => toast.error(errMsg(e, 'Could not save the stop.')),
    };
    if (editingStop) updateStopM.mutate({ stopId: editingStop.id, data: payload }, done);
    else addStopM.mutate({ routeId: stopRoute.id, data: payload }, done);
  };

  // ── Assignments ──────────────────────────────────────────────
  const submitAssign = () => {
    if (!assign.studentId || !assign.routeId || !assign.academicYearId)
      return toast.error('Student, route and academic year are required.');
    assignStudentM.mutate(
      {
        studentId: assign.studentId,
        routeId: assign.routeId,
        stopId: assign.stopId || undefined,
        academicYearId: assign.academicYearId,
        feeAmount: assign.feeAmount === '' ? undefined : Number(assign.feeAmount),
      },
      {
        onSuccess: () => {
          toast.success('Student assigned to the route.');
          setAssignOpen(false);
          setAssign({
            classId: '',
            studentId: '',
            routeId: '',
            stopId: '',
            academicYearId: '',
            feeAmount: '',
          });
        },
        onError: (e: any) => toast.error(errMsg(e, 'Could not assign the student.')),
      }
    );
  };

  return (
    <DashboardLayout>
      <PageBreadcrumb title="Transport Management" />
      <div className="flex flex-col gap-6 pb-10 animate-fade-in">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Bus className="w-6 h-6 text-brand" /> Transport Management
            </h1>
            <p className="text-sm text-zinc-500">
              Vehicles, routes, stops, student assignments and live tracking
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="outline" onClick={() => setAssignOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" /> Assign Student
              </Button>
              <Button variant="outline" onClick={() => setRouteOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Route
              </Button>
              <Button onClick={() => setVehicleOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Vehicle
              </Button>
            </div>
          )}
        </div>

        <TabBar
          tabs={tabs.map((t) => t.label)}
          active={Math.max(
            0,
            tabs.findIndex((t) => t.key === activeKey)
          )}
          onChange={switchTab}
        />

        <Panel>
          {activeKey === 'vehicles' &&
            (vehiclesQ.isPending ? (
              <Spinner />
            ) : vehiclesQ.error ? (
              <ErrorState error={vehiclesQ.error} onRetry={() => vehiclesQ.refetch()} />
            ) : vehicles.length === 0 ? (
              <EmptyState title="No vehicles registered" />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800/80">
                    <tr>
                      <th className="px-4 py-3">Vehicle</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Seats</th>
                      <th className="px-4 py-3">Driver</th>
                      <th className="px-4 py-3">Routes</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                    {vehicles.map((v: any) => {
                      const d: any = driverByVehicle.get(v.id);
                      return (
                        <tr key={v.id}>
                          <td className="px-4 py-3 font-semibold">{v.vehicleNo}</td>
                          <td className="px-4 py-3">{v.type}</td>
                          <td className="px-4 py-3 font-mono">{v.capacity}</td>
                          <td className="px-4 py-3">
                            {d?.driverName ?? <span className="text-zinc-400">Not assigned</span>}
                            {d?.driverPhone && (
                              <span className="block text-[10px] text-zinc-400 font-mono">
                                {d.driverPhone}
                              </span>
                            )}
                            {d?.hasLogin && <Badge variant="info">Has login</Badge>}
                          </td>
                          <td className="px-4 py-3">
                            {(v.routes ?? []).map((r: any) => r.name).join(', ') || '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label="Assign driver"
                              onClick={() => startDriver(v)}
                            >
                              <UserCog className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label="Edit vehicle"
                              onClick={() => startEditVehicle(v)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label="Delete vehicle"
                              onClick={() => setVehicleToDelete(v)}
                            >
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}

          {activeKey === 'routes' &&
            (routesQ.isPending ? (
              <Spinner />
            ) : routesQ.error ? (
              <ErrorState error={routesQ.error} onRetry={() => routesQ.refetch()} />
            ) : routes.length === 0 ? (
              <EmptyState title="No routes yet" />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {routes.map((r: any) => (
                  <div
                    key={r.id}
                    className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-bold text-base">{r.name}</h3>
                        <p className="text-xs text-zinc-500">
                          {r.vehicle?.vehicleNo ?? 'No vehicle'} · {r._count?.students ?? 0}{' '}
                          students
                          {r.morningStart ? ` · AM ${r.morningStart}` : ''}
                          {r.eveningStart ? ` · PM ${r.eveningStart}` : ''}
                        </p>
                      </div>
                      {isAdmin && (
                        <div className="flex">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Edit route"
                            onClick={() => startEditRoute(r)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Delete route"
                            onClick={() => setRouteToDelete(r)}
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {(r.stops ?? []).length === 0 && (
                        <p className="text-xs text-zinc-400">No stops added.</p>
                      )}
                      {(r.stops ?? []).map((s: any) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between text-xs border-b border-zinc-100 dark:border-zinc-800 py-1.5"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-brand/10 text-brand flex items-center justify-center text-[10px] font-bold">
                              {s.sequence}
                            </span>
                            <MapPin className="w-3 h-3 text-zinc-400" /> {s.name}
                            <span className="text-zinc-400">
                              {[s.morningTime, s.eveningTime].filter(Boolean).join(' / ')}
                            </span>
                          </span>
                          {isAdmin && (
                            <span>
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                aria-label="Edit stop"
                                onClick={() => startEditStop(r, s)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                aria-label="Delete stop"
                                onClick={() => setStopToDelete(s)}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              </Button>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {isAdmin && (
                      <div>
                        <Button size="sm" variant="outline" onClick={() => startAddStop(r)}>
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add stop
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}

          {activeKey === 'students' &&
            (assignmentsQ.isPending ? (
              <Spinner />
            ) : assignmentsQ.error ? (
              <ErrorState error={assignmentsQ.error} onRetry={() => assignmentsQ.refetch()} />
            ) : (assignmentsQ.data ?? []).length === 0 ? (
              <EmptyState title="No students assigned to transport" />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800/80">
                    <tr>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Route</th>
                      <th className="px-4 py-3">Vehicle</th>
                      <th className="px-4 py-3">Pickup stop</th>
                      <th className="px-4 py-3">Fee</th>
                      {isAdmin && <th className="px-4 py-3 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                    {(assignmentsQ.data ?? []).map((a: any) => (
                      <tr key={a.id}>
                        <td className="px-4 py-3 font-semibold">
                          {a.student?.name}
                          <span className="block text-[10px] font-normal text-zinc-400">
                            {a.student?.admissionNo}
                          </span>
                        </td>
                        <td className="px-4 py-3">{a.route?.name}</td>
                        <td className="px-4 py-3">{a.route?.vehicle?.vehicleNo ?? '—'}</td>
                        <td className="px-4 py-3">{a.pickupStop?.name ?? '—'}</td>
                        <td className="px-4 py-3 font-mono">
                          {a.feeAmount != null ? inr(a.feeAmount) : '—'}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-center">
                            <Button size="sm" variant="outline" onClick={() => setToUnassign(a)}>
                              <UserMinus className="w-3.5 h-3.5 mr-1" /> Unassign
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {activeKey === 'live' && <LivePanel />}
        </Panel>
      </div>

      <Dialog
        isOpen={vehicleOpen}
        onClose={closeVehicle}
        title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
      >
        <div className="flex flex-col gap-4 py-2">
          <Field label="Vehicle number *">
            <Input
              value={vehicleForm.vehicleNo}
              onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNo: e.target.value })}
              placeholder="MH-12-AB-1234"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select
                value={vehicleForm.type}
                options={[
                  { label: 'Bus', value: 'bus' },
                  { label: 'Van', value: 'van' },
                  { label: 'Auto', value: 'auto' },
                ]}
                onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })}
              />
            </Field>
            <Field label="Seats *">
              <Input
                type="number"
                min={1}
                value={vehicleForm.capacity}
                onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })}
              />
            </Field>
          </div>
          <Field label="GPS device ID">
            <Input
              value={vehicleForm.gpsDeviceId}
              onChange={(e) => setVehicleForm({ ...vehicleForm, gpsDeviceId: e.target.value })}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeVehicle}>
            Cancel
          </Button>
          <Button
            onClick={saveVehicle}
            isLoading={createVehicleM.isPending || updateVehicleM.isPending}
          >
            {editingVehicle ? 'Save changes' : 'Add vehicle'}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        isOpen={!!driverFor}
        onClose={() => setDriverFor(null)}
        title={`Driver — ${driverFor?.vehicleNo ?? ''}`}
      >
        <div className="flex flex-col gap-4 py-2">
          <Field label="Driver with a login (staff)">
            <Select
              value={driver.userId}
              disabled={staffQ.isPending}
              options={[
                { label: 'None — enter details below', value: '' },
                ...(staffQ.data ?? []).map((s) => ({
                  label: `${s.name}${s.designation ? ` — ${s.designation}` : ''}`,
                  value: s.id,
                })),
              ]}
              onChange={(e) => setDriver({ ...driver, userId: e.target.value })}
            />
          </Field>
          {!driver.userId && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Driver name">
                <Input
                  value={driver.name}
                  onChange={(e) => setDriver({ ...driver, name: e.target.value })}
                />
              </Field>
              <Field label="Driver phone">
                <Input
                  value={driver.phone}
                  onChange={(e) => setDriver({ ...driver, phone: e.target.value })}
                />
              </Field>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Attendant name">
              <Input
                value={driver.attName}
                onChange={(e) => setDriver({ ...driver, attName: e.target.value })}
              />
            </Field>
            <Field label="Attendant phone">
              <Input
                value={driver.attPhone}
                onChange={(e) => setDriver({ ...driver, attPhone: e.target.value })}
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDriverFor(null)}>
            Cancel
          </Button>
          <Button onClick={saveDriver} isLoading={assignDriverM.isPending}>
            Save
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        isOpen={routeOpen}
        onClose={closeRoute}
        title={editingRoute ? 'Edit Route' : 'Add Route'}
      >
        <div className="flex flex-col gap-4 py-2">
          <Field label="Route name *">
            <Input
              value={routeForm.name}
              onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
              placeholder="Route A — North Zone"
            />
          </Field>
          <Field label="Vehicle *">
            <Select
              value={routeForm.vehicleId}
              options={[
                { label: 'Select vehicle...', value: '' },
                ...vehicles.map((v: any) => ({
                  label: `${v.vehicleNo} (${v.capacity} seats)`,
                  value: v.id,
                })),
              ]}
              onChange={(e) => setRouteForm({ ...routeForm, vehicleId: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Morning start">
              <Input
                type="time"
                value={routeForm.morningStart}
                onChange={(e) => setRouteForm({ ...routeForm, morningStart: e.target.value })}
              />
            </Field>
            <Field label="Evening start">
              <Input
                type="time"
                value={routeForm.eveningStart}
                onChange={(e) => setRouteForm({ ...routeForm, eveningStart: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Description">
            <Input
              value={routeForm.description}
              onChange={(e) => setRouteForm({ ...routeForm, description: e.target.value })}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeRoute}>
            Cancel
          </Button>
          <Button onClick={saveRoute} isLoading={createRouteM.isPending || updateRouteM.isPending}>
            {editingRoute ? 'Save changes' : 'Create route'}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        isOpen={!!stopRoute}
        onClose={closeStop}
        title={editingStop ? 'Edit Stop' : `Add stop to ${stopRoute?.name ?? ''}`}
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="Stop name *">
                <Input
                  value={stopForm.name}
                  onChange={(e) => setStopForm({ ...stopForm, name: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Order *">
              <Input
                type="number"
                min={1}
                value={stopForm.sequence}
                onChange={(e) => setStopForm({ ...stopForm, sequence: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Morning pickup">
              <Input
                type="time"
                value={stopForm.morningTime}
                onChange={(e) => setStopForm({ ...stopForm, morningTime: e.target.value })}
              />
            </Field>
            <Field label="Evening drop">
              <Input
                type="time"
                value={stopForm.eveningTime}
                onChange={(e) => setStopForm({ ...stopForm, eveningTime: e.target.value })}
              />
            </Field>
            <Field label="Latitude">
              <Input
                type="number"
                step="any"
                value={stopForm.lat}
                onChange={(e) => setStopForm({ ...stopForm, lat: e.target.value })}
              />
            </Field>
            <Field label="Longitude">
              <Input
                type="number"
                step="any"
                value={stopForm.lng}
                onChange={(e) => setStopForm({ ...stopForm, lng: e.target.value })}
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeStop}>
            Cancel
          </Button>
          <Button onClick={saveStop} isLoading={addStopM.isPending || updateStopM.isPending}>
            {editingStop ? 'Save changes' : 'Add stop'}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign Student to Route"
      >
        <div className="flex flex-col gap-4 py-2">
          <Field label="Class *">
            <Select
              value={assign.classId}
              options={[
                { label: 'Select class...', value: '' },
                ...classes.map((c: any) => ({ label: `${c.name} - ${c.section}`, value: c.id })),
              ]}
              onChange={(e) => setAssign({ ...assign, classId: e.target.value, studentId: '' })}
            />
          </Field>
          <Field label="Student *">
            <Select
              value={assign.studentId}
              disabled={!assign.classId}
              options={[
                { label: 'Select student...', value: '' },
                ...students.map((s: any) => ({
                  label: `${s.name} (${s.admissionNo})`,
                  value: s.id,
                })),
              ]}
              onChange={(e) => setAssign({ ...assign, studentId: e.target.value })}
            />
          </Field>
          <Field label="Route *">
            <Select
              value={assign.routeId}
              options={[
                { label: 'Select route...', value: '' },
                ...routes.map((r: any) => ({ label: r.name, value: r.id })),
              ]}
              onChange={(e) => setAssign({ ...assign, routeId: e.target.value, stopId: '' })}
            />
          </Field>
          <Field label="Pickup stop">
            <Select
              value={assign.stopId}
              disabled={!assign.routeId}
              options={[
                { label: 'No specific stop', value: '' },
                ...(assignRoute?.stops ?? []).map((s: any) => ({ label: s.name, value: s.id })),
              ]}
              onChange={(e) => setAssign({ ...assign, stopId: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Academic year *">
              <AcademicYearSelect
                value={assign.academicYearId}
                onChange={(id) => setAssign({ ...assign, academicYearId: id })}
                className="w-full"
              />
            </Field>
            <Field label="Transport fee (₹)">
              <Input
                type="number"
                min={0}
                value={assign.feeAmount}
                onChange={(e) => setAssign({ ...assign, feeAmount: e.target.value })}
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAssignOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submitAssign} isLoading={assignStudentM.isPending}>
            Assign
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog
        open={!!vehicleToDelete}
        title="Delete vehicle"
        message={`Delete vehicle ${vehicleToDelete?.vehicleNo ?? ''}?`}
        loading={deleteVehicleM.isPending}
        onConfirm={() =>
          vehicleToDelete &&
          deleteVehicleM.mutate(vehicleToDelete.id, {
            onSuccess: () => {
              toast.success('Vehicle deleted.');
              setVehicleToDelete(null);
            },
            onError: (e: any) => {
              toast.error(errMsg(e, 'Could not delete the vehicle.'));
              setVehicleToDelete(null);
            },
          })
        }
        onClose={() => setVehicleToDelete(null)}
      />
      <ConfirmDialog
        open={!!routeToDelete}
        title="Delete route"
        message={`Delete route "${routeToDelete?.name ?? ''}"?`}
        loading={deleteRouteM.isPending}
        onConfirm={() =>
          routeToDelete &&
          deleteRouteM.mutate(routeToDelete.id, {
            onSuccess: () => {
              toast.success('Route deleted.');
              setRouteToDelete(null);
            },
            onError: (e: any) => {
              toast.error(errMsg(e, 'Could not delete the route.'));
              setRouteToDelete(null);
            },
          })
        }
        onClose={() => setRouteToDelete(null)}
      />
      <ConfirmDialog
        open={!!stopToDelete}
        title="Delete stop"
        message={`Delete stop "${stopToDelete?.name ?? ''}"?`}
        loading={deleteStopM.isPending}
        onConfirm={() =>
          stopToDelete &&
          deleteStopM.mutate(stopToDelete.id, {
            onSuccess: () => {
              toast.success('Stop deleted.');
              setStopToDelete(null);
            },
            onError: (e: any) => {
              toast.error(errMsg(e, 'Could not delete the stop.'));
              setStopToDelete(null);
            },
          })
        }
        onClose={() => setStopToDelete(null)}
      />
      <ConfirmDialog
        open={!!toUnassign}
        title="Unassign student"
        message={`Remove ${toUnassign?.student?.name ?? 'this student'} from ${toUnassign?.route?.name ?? 'the route'}?`}
        confirmLabel="Unassign"
        loading={unassignM.isPending}
        onConfirm={() =>
          toUnassign &&
          unassignM.mutate(toUnassign.studentId ?? toUnassign.student?.id, {
            onSuccess: () => {
              toast.success('Student unassigned.');
              setToUnassign(null);
            },
            onError: (e: any) => {
              toast.error(errMsg(e, 'Could not unassign the student.'));
              setToUnassign(null);
            },
          })
        }
        onClose={() => setToUnassign(null)}
      />
    </DashboardLayout>
  );
}
