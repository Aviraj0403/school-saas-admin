import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  inventoryService,
  CreateAssetItemDto,
  CheckoutItemDto,
} from '@/services/inventory.service';
import { useAuthStore } from '@/store/useAuthStore';

function useAuthed() {
  return useAuthStore((s) => s.isAuthenticated);
}

export const useInventoryItems = (categoryId?: string) => {
  const ok = useAuthed();
  return useQuery({
    queryKey: ['inventory-items', categoryId],
    queryFn: () => inventoryService.listItems(categoryId),
    enabled: ok,
    retry: false,
  });
};

export const useInventoryCategories = () => {
  const ok = useAuthed();
  return useQuery({
    queryKey: ['inventory-categories'],
    queryFn: () => inventoryService.listCategories(),
    enabled: ok,
    retry: false,
  });
};

export const useInventoryCheckouts = (status?: string) => {
  const ok = useAuthed();
  return useQuery({
    queryKey: ['inventory-checkouts', status],
    queryFn: () => inventoryService.listCheckouts(status),
    enabled: ok,
    retry: false,
  });
};

function useInvalidateInventory() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['inventory-items'] });
    qc.invalidateQueries({ queryKey: ['inventory-checkouts'] });
    qc.invalidateQueries({ queryKey: ['inventory-categories'] });
  };
}

export const useCreateInventoryItem = () => {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (data: CreateAssetItemDto) => inventoryService.createItem(data),
    onSuccess: invalidate,
  });
};

export const useUpdateInventoryItem = () => {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAssetItemDto> }) =>
      inventoryService.updateItem(id, data),
    onSuccess: invalidate,
  });
};

export const useRetireInventoryItem = () => {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (id: string) => inventoryService.retireItem(id),
    onSuccess: invalidate,
  });
};

export const useCreateInventoryCategory = () => {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      inventoryService.createCategory(data),
    onSuccess: invalidate,
  });
};

export const useCheckoutItem = () => {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (data: CheckoutItemDto) => inventoryService.checkoutItem(data),
    onSuccess: invalidate,
  });
};

export const useCheckinItem = () => {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: ({ id, lost, notes }: { id: string; lost?: boolean; notes?: string }) =>
      inventoryService.checkin(id, { lost, notes }),
    onSuccess: invalidate,
  });
};
