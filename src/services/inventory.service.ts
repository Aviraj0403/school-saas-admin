import { api } from './api';
import { asList, unwrap } from '@/lib/utils';

export interface AssetCategory {
  id: string;
  name: string;
  description?: string | null;
}

export interface AssetItem {
  id: string;
  categoryId: string;
  category?: AssetCategory;
  name: string;
  sku?: string | null;
  quantity: number;
  unit: string;
  location?: string | null;
  price?: number | string | null;
  status: string;
}

export interface AssetCheckout {
  id: string;
  itemId: string;
  item?: { id: string; name: string; sku?: string | null; unit: string };
  issuedToId: string;
  issuedType: string;
  quantity: number;
  checkoutDate: string;
  expectedReturn?: string | null;
  returnDate?: string | null;
  status: 'ISSUED' | 'RETURNED' | 'LOST';
  notes?: string | null;
}

export interface CreateAssetItemDto {
  categoryId: string;
  name: string;
  sku?: string;
  quantity: number;
  unit?: string;
  location?: string;
  purchasePrice?: number;
  status?: string;
}

export interface CheckoutItemDto {
  itemId: string;
  issuedToId: string;
  issuedType: 'STUDENT' | 'STAFF';
  quantity?: number;
  expectedReturn?: string;
  notes?: string;
}

export const inventoryService = {
  listItems: async (categoryId?: string): Promise<AssetItem[]> =>
    asList<AssetItem>(
      unwrap(
        await api.get('/inventory/items', {
          params: { limit: 100, ...(categoryId ? { categoryId } : {}) },
        })
      )
    ),

  listCategories: async (): Promise<AssetCategory[]> =>
    asList<AssetCategory>(
      unwrap(await api.get('/inventory/categories', { params: { limit: 50 } }))
    ),

  createCategory: async (data: { name: string; description?: string }) =>
    unwrap(await api.post('/inventory/categories', data)),

  createItem: async (data: CreateAssetItemDto) => unwrap(await api.post('/inventory/items', data)),

  updateItem: async (id: string, data: Partial<CreateAssetItemDto>) =>
    unwrap(await api.patch(`/inventory/items/${id}`, data)),

  retireItem: async (id: string) => unwrap(await api.delete(`/inventory/items/${id}`)),

  checkoutItem: async (data: CheckoutItemDto) =>
    unwrap(await api.post('/inventory/checkout', data)),

  listCheckouts: async (status?: string): Promise<AssetCheckout[]> =>
    asList<AssetCheckout>(
      unwrap(await api.get('/inventory/checkouts', { params: status ? { status } : {} }))
    ),

  checkin: async (id: string, data: { lost?: boolean; notes?: string } = {}) =>
    unwrap(await api.patch(`/inventory/checkouts/${id}/checkin`, data)),
};
