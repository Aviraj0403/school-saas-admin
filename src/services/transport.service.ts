import { api } from './api';
import { asList, unwrap } from '@/lib/utils';

export interface VehicleInput {
  vehicleNo: string;
  type?: string;
  capacity: number;
  driverName?: string;
  driverPhone?: string;
  attendantName?: string;
  attendantPhone?: string;
  gpsDeviceId?: string;
}

export interface RouteInput {
  vehicleId: string;
  name: string;
  description?: string;
  morningStart?: string;
  eveningStart?: string;
}

export interface StopInput {
  name: string;
  sequence: number;
  lat?: number;
  lng?: number;
  morningTime?: string;
  eveningTime?: string;
}

const list = (res: any) => asList<any>(unwrap(res));

export const transportService = {
  getVehicles: async () => list(await api.get('/transport/vehicles')),
  createVehicle: async (data: VehicleInput) => unwrap(await api.post('/transport/vehicles', data)),
  updateVehicle: async (id: string, data: Partial<VehicleInput>) =>
    unwrap(await api.patch(`/transport/vehicles/${id}`, data)),
  deleteVehicle: async (id: string) => unwrap(await api.delete(`/transport/vehicles/${id}`)),

  getDrivers: async () => list(await api.get('/transport/drivers')),
  /** driverUserId null unlinks the driver's login. */
  assignDriver: async (
    vehicleId: string,
    data: {
      driverUserId?: string | null;
      driverName?: string | null;
      driverPhone?: string | null;
      attendantName?: string | null;
      attendantPhone?: string | null;
    }
  ) => unwrap(await api.patch(`/transport/vehicles/${vehicleId}/driver`, data)),

  getRoutes: async () => list(await api.get('/transport/routes')),
  createRoute: async (data: RouteInput) => unwrap(await api.post('/transport/routes', data)),
  updateRoute: async (id: string, data: Partial<RouteInput>) =>
    unwrap(await api.patch(`/transport/routes/${id}`, data)),
  deleteRoute: async (id: string) => unwrap(await api.delete(`/transport/routes/${id}`)),

  addStop: async (routeId: string, data: StopInput) =>
    unwrap(await api.post(`/transport/routes/${routeId}/stops`, data)),
  updateStop: async (stopId: string, data: Partial<StopInput>) =>
    unwrap(await api.patch(`/transport/stops/${stopId}`, data)),
  deleteStop: async (stopId: string) => unwrap(await api.delete(`/transport/stops/${stopId}`)),

  getAssignments: async () => list(await api.get('/transport/students')),
  assignStudent: async (data: {
    studentId: string;
    routeId: string;
    stopId?: string;
    academicYearId: string;
    feeAmount?: number;
  }) => unwrap(await api.post('/transport/students/assign', data)),
  /** Alias kept for the admissions form. */
  assignStudentToRoute: async (data: {
    studentId: string;
    routeId: string;
    stopId?: string;
    academicYearId: string;
    feeAmount?: number;
  }) => unwrap(await api.post('/transport/students/assign', data)),
  unassignStudent: async (studentId: string) =>
    unwrap(await api.patch(`/transport/students/${studentId}/unassign`)),

  /** Last-known GPS fix; the backend answers 404 when the vehicle has never reported. */
  getVehicleLocation: async (vehicleId: string) => {
    try {
      return unwrap<any>(await api.get(`/transport/vehicles/${vehicleId}/location`));
    } catch (e: any) {
      if (e?.response?.status === 404) return null;
      throw e;
    }
  },
};
