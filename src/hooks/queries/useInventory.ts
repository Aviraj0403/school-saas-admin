import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService, CreateAssetItemDto, CheckoutItemDto } from '@/services/inventory.service';

export const useInventoryItems = (categoryId?: string) => {
  return useQuery({
    queryKey: ['inventory-items', categoryId],
    queryFn: () => inventoryService.listItems(categoryId),
  });
};

export const useInventoryCategories = () => {
  return useQuery({
    queryKey: ['inventory-categories'],
    queryFn: () => inventoryService.listCategories(),
  });
};

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAssetItemDto) => inventoryService.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    },
  });
};

export const useCheckoutItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CheckoutItemDto) => inventoryService.checkoutItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    },
  });
};
