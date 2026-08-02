import { api } from './api';

export const transportService = {
  getRoutes: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/transport/routes');
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  createRoute: async (data: { name: string; startPoint: string; endPoint: string; stops: string[] }) => {
    const response = await api.post<{ success: boolean; data: any }>('/transport/routes', data);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  // No /transport/buses fallback: that route has never existed on the backend
  // (it is /transport/vehicles). Catching the real error and retrying against a
  // 404 turned every genuine 400/403 here into a misleading "not found".
  getBuses: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/transport/vehicles');
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  createBus: async (data: { registrationNo: string; capacity: number; routeId?: string; driverName?: string; driverPhone?: string }) => {
    // Map registrationNo to vehicleNo for the backend DTO
    const backendData = {
      vehicleNo: data.registrationNo,
      capacity: data.capacity,
      driverName: data.driverName,
      driverPhone: data.driverPhone,
    };
    const response = await api.post<{ success: boolean; data: any }>('/transport/vehicles', backendData);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  getBusLocations: async () => {
    try {
      const response = await api.get<{ success: boolean; data: any }>('/transport/dashboard');
      const data = ((response.data as any)?.data as any)?.items || response.data?.data;
      if (!data || !data.liveVehicles) return [];
      
      return data.liveVehicles.map((v: any) => ({
        busRegistrationNo: v.vehicleNo,
        routeName: 'Active Route',
        speed: v.lastLocation?.speed || 0,
        updatedAt: v.lastSeen
      }));
    } catch (e) {
      return [];
    }
  },

  assignStudentToRoute: async (data: { studentId: string; routeId: string; stopId?: string; academicYearId: string; feeAmount?: number }) => {
    const payload = {
      studentId: data.studentId,
      routeId: data.routeId,
      stopId: data.stopId,
      academicYearId: data.academicYearId,
      feeAmount: data.feeAmount || 0,
    };
    // Same as above — /transport/assign does not exist; the route is
    // /transport/students/assign and its failures need to reach the caller.
    const response = await api.post<{ success: boolean; data: any }>('/transport/students/assign', payload);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  getAssignments: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/transport/students');
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  // Derived from the assignment list: the backend has no
  // GET /transport/routes/:routeId/students endpoint, so the previous version
  // 404'd on every call.
  getStudentsByRoute: async (routeId: string) => {
    const assignments = await transportService.getAssignments();
    return (assignments ?? []).filter((a: any) => a?.route?.id === routeId || a?.routeId === routeId);
  },

  getStudentTransport: async (studentId: string) => {
    const response = await api.get<{ success: boolean; data: any }>(`/transport/students/${studentId}`);
    return response.data?.data ?? null;
  },

  unassignStudent: async (studentId: string) => {
    const response = await api.patch<{ success: boolean; data: any }>(`/transport/students/${studentId}/unassign`);
    return response.data?.data;
  },
};



