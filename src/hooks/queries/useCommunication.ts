import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationService, type EventInput } from '@/services/communication.service';
import { useAuthStore } from '@/store/useAuthStore';
import { CreateAnnouncementDto } from '@/types/api.types';

export function useAnnouncements(page: number, limit: number, targetRole?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['announcements', { page, limit, targetRole }],
    queryFn: () => communicationService.getAnnouncements(page, limit, targetRole),
    enabled: isAuthenticated,
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAnnouncementDto & { type?: string; targetRoles?: string[] }) =>
      communicationService.createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communicationService.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

export function useEvents(month?: number, year?: number) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['school-events', { month, year }],
    queryFn: () => communicationService.getEvents(month, year),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EventInput) => communicationService.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-events'] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communicationService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-events'] });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { title?: string; content?: string; type?: string; targetRoles?: string[] };
    }) => communicationService.updateAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EventInput> }) =>
      communicationService.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-events'] });
    },
  });
}
