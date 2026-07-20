import { api } from './api';

export interface AssetCategory {
  id: string;
  name: string;
}

export interface AssetItem {
  id: string;
  tenantId: string;
  categoryId: string;
  category?: AssetCategory;
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  location?: string;
  status: string;
}

export interface CreateAssetItemDto {
  categoryId: string;
  name: string;
  sku: string;
  quantity: number;
  unit?: string;
  location?: string;
  status?: string;
}

export interface CheckoutItemDto {
  itemId: string;
  issuedToId: string;
  issuedType: string;
  quantity: number;
  expectedReturn?: string;
}

export const inventoryService = {
  listItems: async (categoryId?: string): Promise<AssetItem[]> => {
    const res = await api.get('/inventory/items', { params: { categoryId } });
    return res.data;
  },

  listCategories: async (): Promise<AssetCategory[]> => {
    const res = await api.get('/inventory/categories');
    return res.data;
  },

  createItem: async (data: CreateAssetItemDto): Promise<AssetItem> => {
    const res = await api.post('/inventory/items', data);
    return res.data;
  },

  checkoutItem: async (data: CheckoutItemDto): Promise<any> => {
    const res = await api.post('/inventory/checkout', data);
    return res.data;
  }
};
