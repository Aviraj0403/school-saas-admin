import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappService } from '@/services/whatsapp.service';

export function useWhatsAppConfig() {
  return useQuery({
    queryKey: ['whatsapp-config'],
    queryFn: () => whatsappService.getConfig(),
  });
}

export function useUpdateWhatsAppConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => whatsappService.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
    },
  });
}

export function useWhatsAppTemplates() {
  return useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: () => whatsappService.getTemplates(),
  });
}

export function useWhatsAppSessions(page: number, limit: number) {
  return useQuery({
    queryKey: ['whatsapp-sessions', { page, limit }],
    queryFn: () => whatsappService.getSessions(page, limit),
    placeholderData: (previousData) => previousData,
  });
}

export function useWhatsAppBroadcasts(page: number, limit: number) {
  return useQuery({
    queryKey: ['whatsapp-broadcasts', { page, limit }],
    queryFn: () => whatsappService.getBroadcasts(page, limit),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateBroadcast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof whatsappService.createBroadcast>[0]) => whatsappService.createBroadcast(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-broadcasts'] });
    },
  });
}

export function useSendBroadcast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => whatsappService.sendBroadcast(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-broadcasts'] });
    },
  });
}
