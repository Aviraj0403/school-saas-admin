import { api } from './api';
import { ApiResponse, PaginatedResponse, WhatsAppConfig, WhatsAppTemplate, WhatsAppSession } from '@/types/api.types';

export const whatsappService = {
  getConfig: async () => {
    const response = await api.get<{ success: boolean; data: WhatsAppConfig }>('/whatsapp/config');
    return response.data;
  },

  updateConfig: async (data: Partial<WhatsAppConfig>) => {
    const response = await api.patch<{ success: boolean; data: WhatsAppConfig }>('/whatsapp/config', data);
    return response.data;
  },

  getTemplates: async () => {
    const response = await api.get<{ success: boolean; data: WhatsAppTemplate[] }>('/whatsapp/templates');
    return response.data;
  },

  seedTemplates: async () => {
    const response = await api.post<{ success: boolean }>('/whatsapp/templates/seed');
    return response.data;
  },

  getSessions: async (page = 1, limit = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    const response = await api.get<PaginatedResponse<WhatsAppSession>>(`/whatsapp/sessions?${params.toString()}`);
    return response.data;
  },

  getMessages: async (phone: string, page = 1, limit = 50) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    const response = await api.get<{ success: boolean; data: any[] }>(`/whatsapp/sessions/${phone}/messages?${params.toString()}`);
    return response.data.data;
  },

  getBroadcasts: async (page = 1, limit = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    const response = await api.get<PaginatedResponse<any>>(`/whatsapp/broadcasts?${params.toString()}`);
    return response.data;
  },

  createBroadcast: async (data: { name: string; templateName: string; parameters?: any }) => {
    const response = await api.post<{ success: boolean; data: any }>('/whatsapp/broadcasts', data);
    return response.data;
  },

  sendBroadcast: async (id: string) => {
    const response = await api.post<{ success: boolean }>(`/whatsapp/broadcasts/${id}/send`);
    return response.data;
  },

  getDeliveries: async (id: string) => {
    const response = await api.get<{ success: boolean; data: any[] }>(`/whatsapp/broadcasts/${id}/deliveries`);
    return response.data.data;
  },

  testRagChatbot: async (phone: string, question: string) => {
    const response = await api.post<{ success: boolean; message: string }>('/whatsapp/test/rag', { phone, question });
    return response.data;
  }
};
