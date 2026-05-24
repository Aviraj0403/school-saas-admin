import { api } from './api';
import { PaginatedResponse, Announcement, SchoolEvent, CreateAnnouncementDto } from '@/types/api.types';

export const communicationService = {
  getAnnouncements: async (page = 1, limit = 10, targetRole?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(targetRole ? { targetRole } : {})
    });
    const response = await api.get<PaginatedResponse<Announcement>>(`/communication/announcements?${params.toString()}`);
    return response.data;
  },

  createAnnouncement: async (data: CreateAnnouncementDto) => {
    const response = await api.post<{ success: boolean; data: Announcement }>('/communication/announcements', data);
    return response.data;
  },

  deleteAnnouncement: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/communication/announcements/${id}`);
    return response.data;
  },

  getEvents: async (month?: number, year?: number) => {
    const params = new URLSearchParams({
      ...(month ? { month: month.toString() } : {}),
      ...(year ? { year: year.toString() } : {})
    });
    const response = await api.get<{ success: boolean; data: SchoolEvent[] }>(`/communication/events?${params.toString()}`);
    return response.data;
  },

  createEvent: async (data: { title: string; description?: string; startDate: string; endDate: string }) => {
    const response = await api.post<{ success: boolean; data: SchoolEvent }>('/communication/events', data);
    return response.data;
  },

  deleteEvent: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/communication/events/${id}`);
    return response.data;
  }
};
