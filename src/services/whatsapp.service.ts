import { api } from './api';
import { WhatsAppConfig, WhatsAppTemplate, WhatsAppSession } from '@/types/api.types';

export const whatsappService = {
  getConfig: async () => {
    const response = await api.get<{ success: boolean; data: WhatsAppConfig }>('/whatsapp/config');
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  updateConfig: async (data: Partial<WhatsAppConfig>) => {
    const response = await api.patch<{ success: boolean; data: WhatsAppConfig }>('/whatsapp/config', data);
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  getTemplates: async () => {
    const response = await api.get<{ success: boolean; data: WhatsAppTemplate[] }>('/whatsapp/templates');
    return ((response.data as any)?.data as any)?.items || (response.data?.data ?? []);
  },

  seedTemplates: async () => {
    const response = await api.post<{ success: boolean }>('/whatsapp/templates/seed');
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  getSessions: async (page = 1, limit = 20) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    const response = await api.get<{ success: boolean; data: WhatsAppSession[]; meta: any }>(`/whatsapp/sessions?${params}`);
    const items = (response.data.data as any)?.items ?? [];
    const meta = (response.data.data as any)?.meta ?? { total: 0, page, limit, totalPages: 0 };
    return { items, meta, data: { items, meta } };
  },

  getMessages: async (phone: string, page = 1, limit = 50) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    const response = await api.get<{ success: boolean; data: any[] }>(`/whatsapp/sessions/${phone}/messages?${params}`);
    return ((response.data as any)?.data as any)?.items || (response.data?.data ?? []);
  },

  getBroadcasts: async (page = 1, limit = 20) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    const response = await api.get<{ success: boolean; data: any[]; meta: any }>(`/whatsapp/broadcasts?${params}`);
    const items = (response.data.data as any)?.items ?? [];
    const meta = (response.data.data as any)?.meta ?? { total: 0, page, limit, totalPages: 0 };
    return { items, meta, data: { items, meta } };
  },

  createBroadcast: async (data: { name: string; templateName: string; parameters?: any }) => {
    const response = await api.post<{ success: boolean; data: any }>('/whatsapp/broadcasts', data);
    return ((response.data as any)?.data as any)?.items || response.data?.data;
  },

  sendBroadcast: async (id: string) => {
    const response = await api.post<{ success: boolean }>(`/whatsapp/broadcasts/${id}/send`);
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },

  testRagChatbot: async (phone: string, question: string) => {
    const response = await api.post<{ success: boolean; message: string }>('/whatsapp/test/rag', { phone, question });
    return ((response.data as any)?.data as any)?.items || (response.data as any)?.data || response.data;
  },
};




