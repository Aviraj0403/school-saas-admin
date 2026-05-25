import { api } from './api';

export const transportService = {
  getRoutes: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/transport/routes');
    return response.data.data;
  },

  createRoute: async (data: { name: string; startPoint: string; endPoint: string; stops: string[] }) => {
    const response = await api.post<{ success: boolean; data: any }>('/transport/routes', data);
    return response.data;
  },

  getBuses: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/transport/buses');
    return response.data.data;
  },

  createBus: async (data: { registrationNo: string; capacity: number; routeId?: string; driverName?: string; driverPhone?: string }) => {
    const response = await api.post<{ success: boolean; data: any }>('/transport/buses', data);
    return response.data;
  },

  getBusLocations: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/transport/locations');
    return response.data.data;
  },

  assignStudentToRoute: async (data: { studentId: string; routeId: string; stopName: string }) => {
    const response = await api.post<{ success: boolean; data: any }>('/transport/assign', data);
    return response.data;
  },

  getStudentsByRoute: async (routeId: string) => {
    const response = await api.get<{ success: boolean; data: any[] }>(`/transport/routes/${routeId}/students`);
    return response.data.data;
  },
};
