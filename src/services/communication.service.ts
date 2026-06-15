import { api } from './api';
import { Announcement, SchoolEvent, CreateAnnouncementDto } from '@/types/api.types';

export const communicationService = {
  getAnnouncements: async (page = 1, limit = 10, targetRole?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (targetRole) params.append('targetRole', targetRole);
    const response = await api.get<{ success: boolean; data: Announcement[]; meta: any }>(`/communication/announcements?${params}`);
    const items = (response.data.data as any)?.items ?? [];
    const meta = (response.data.data as any)?.meta ?? { total: 0, page, limit, totalPages: 0 };
    return { items, meta, data: { items, meta } };
  },

  createAnnouncement: async (data: CreateAnnouncementDto) => {
    const response = await api.post<{ success: boolean; data: Announcement }>('/communication/announcements', data);
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  deleteAnnouncement: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/communication/announcements/${id}`);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  getEvents: async (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    const response = await api.get<{ success: boolean; data: SchoolEvent[] }>(`/communication/events?${params}`);
    return ((response.data as any)?.data as any)?.items || (response.data?.data ?? []);
  },

  createEvent: async (data: { title: string; description?: string; startDate: string; endDate: string }) => {
    const response = await api.post<{ success: boolean; data: SchoolEvent }>('/communication/events', data);
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  deleteEvent: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/communication/events/${id}`);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },
};




