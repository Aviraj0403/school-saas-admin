import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  transportService,
  VehicleInput,
  RouteInput,
  StopInput,
} from '@/services/transport.service';
import { useAuthStore } from '@/store/useAuthStore';

function useAuthed() {
  return useAuthStore((s) => s.isAuthenticated);
}

export function useVehicles() {
  const ok = useAuthed();
  return useQuery({
    queryKey: ['transport-vehicles'],
    queryFn: () => transportService.getVehicles(),
    enabled: ok,
    retry: false,
  });
}

export function useDrivers() {
  const ok = useAuthed();
  return useQuery({
    queryKey: ['transport-drivers'],
    queryFn: () => transportService.getDrivers(),
    enabled: ok,
    retry: false,
  });
}

export function useTransportRoutes() {
  const ok = useAuthed();
  return useQuery({
    queryKey: ['transport-routes'],
    queryFn: () => transportService.getRoutes(),
    enabled: ok,
    retry: false,
  });
}

export function useTransportAssignments() {
  const ok = useAuthed();
  return useQuery({
    queryKey: ['transport-assignments'],
    queryFn: () => transportService.getAssignments(),
    enabled: ok,
    retry: false,
  });
}

export function useVehicleLocation(vehicleId: string) {
  const ok = useAuthed();
  return useQuery({
    queryKey: ['transport-location', vehicleId],
    queryFn: () => transportService.getVehicleLocation(vehicleId),
    enabled: ok && !!vehicleId,
    refetchInterval: 30_000,
    retry: false,
  });
}

function useInvalidateTransport() {
  const qc = useQueryClient();
  return () => {
    for (const key of [
      'transport-vehicles',
      'transport-drivers',
      'transport-routes',
      'transport-assignments',
    ]) {
      qc.invalidateQueries({ queryKey: [key] });
    }
  };
}

export function useCreateVehicle() {
  const invalidate = useInvalidateTransport();
  return useMutation({
    mutationFn: (d: VehicleInput) => transportService.createVehicle(d),
    onSuccess: invalidate,
  });
}
export function useUpdateVehicle() {
  const invalidate = useInvalidateTransport();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VehicleInput> }) =>
      transportService.updateVehicle(id, data),
    onSuccess: invalidate,
  });
}
export function useDeleteVehicle() {
  const invalidate = useInvalidateTransport();
  return useMutation({
    mutationFn: (id: string) => transportService.deleteVehicle(id),
    onSuccess: invalidate,
  });
}
export function useAssignDriver() {
  const invalidate = useInvalidateTransport();
  return useMutation({
    mutationFn: ({
      vehicleId,
      data,
    }: {
      vehicleId: string;
      data: Parameters<typeof transportService.assignDriver>[1];
    }) => transportService.assignDriver(vehicleId, data),
    onSuccess: invalidate,
  });
}
export function useCreateRoute() {
  const invalidate = useInvalidateTransport();
  return useMutation({
    mutationFn: (d: RouteInput) => transportService.createRoute(d),
    onSuccess: invalidate,
  });
}
export function useUpdateRoute() {
  const invalidate = useInvalidateTransport();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RouteInput> }) =>
      transportService.updateRoute(id, data),
    onSuccess: invalidate,
  });
}
export function useDeleteRoute() {
  const invalidate = useInvalidateTransport();
  return useMutation({
    mutationFn: (id: string) => transportService.deleteRoute(id),
    onSuccess: invalidate,
  });
}
export function useAddStop() {
  const invalidate = useInvalidateTransport();
  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: StopInput }) =>
      transportService.addStop(routeId, data),
    onSuccess: invalidate,
  });
}
export function useUpdateStop() {
  const invalidate = useInvalidateTransport();
  return useMutation({
    mutationFn: ({ stopId, data }: { stopId: string; data: Partial<StopInput> }) =>
      transportService.updateStop(stopId, data),
    onSuccess: invalidate,
  });
}
export function useDeleteStop() {
  const invalidate = useInvalidateTransport();
  return useMutation({
    mutationFn: (stopId: string) => transportService.deleteStop(stopId),
    onSuccess: invalidate,
  });
}
export function useAssignStudent() {
  const invalidate = useInvalidateTransport();
  return useMutation({
    mutationFn: (d: Parameters<typeof transportService.assignStudent>[0]) =>
      transportService.assignStudent(d),
    onSuccess: invalidate,
  });
}
export function useUnassignStudent() {
  const invalidate = useInvalidateTransport();
  return useMutation({
    mutationFn: (studentId: string) => transportService.unassignStudent(studentId),
    onSuccess: invalidate,
  });
}
