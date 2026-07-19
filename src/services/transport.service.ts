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

  getBuses: async () => {
    try {
      const response = await api.get<{ success: boolean; data: any[] }>('/transport/vehicles');
      return ((response.data as any)?.data as any)?.items || response.data?.data;
    } catch (e) {
      const response = await api.get<{ success: boolean; data: any[] }>('/transport/buses').catch(() => ({ data: { data: [] } }));
      return ((response.data as any)?.data as any)?.items || response.data?.data;
    }
  },

  createBus: async (data: { registrationNo: string; capacity: number; routeId?: string; driverName?: string; driverPhone?: string }) => {
    // Map registrationNo to vehicleNo for the backend DTO
    const backendData = {
      vehicleNo: data.registrationNo,
      capacity: data.capacity,
      driverName: data.driverName,
      driverPhone: data.driverPhone,
    };
    try {
      const response = await api.post<{ success: boolean; data: any }>('/transport/vehicles', backendData);
      return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
    } catch (e) {
      const response = await api.post<{ success: boolean; data: any }>('/transport/buses', data);
      return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
    }
  },

  getBusLocations: async () => {
    try {
      const response = await api.get<{ success: boolean; data: any[] }>('/transport/locations');
      return ((response.data as any)?.data as any)?.items || response.data?.data;
    } catch (e) {
      return [];
    }
  },

  assignStudentToRoute: async (data: { studentId: string; routeId: string; stopId?: string; academicYear?: string; feeAmount?: number }) => {
    const payload = {
      studentId: data.studentId,
      routeId: data.routeId,
      stopId: data.stopId,
      academicYear: data.academicYear || '2025-2026',
      feeAmount: data.feeAmount || 0,
    };
    try {
      const response = await api.post<{ success: boolean; data: any }>('/transport/students/assign', payload);
      return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
    } catch (e) {
      const response = await api.post<{ success: boolean; data: any }>('/transport/assign', data);
      return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
    }
  },

  getAssignments: async () => {
    try {
      const response = await api.get<{ success: boolean; data: any[] }>('/transport/students');
      return ((response.data as any)?.data as any)?.items || response.data?.data;
    } catch (e) {
      return [];
    }
  },

  getStudentsByRoute: async (routeId: string) => {
    const response = await api.get<{ success: boolean; data: any[] }>(`/transport/routes/${routeId}/students`);
    return ((response.data as any)?.data as any)?.items || response.data?.data;
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



