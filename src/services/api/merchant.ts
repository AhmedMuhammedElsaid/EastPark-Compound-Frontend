import { client } from './client';

export interface MerchantShop {
  id: string;
  name: string;
  nameAr: string;
  description: string | null;
  descriptionAr: string | null;
  isOpen: boolean;
  phone: string | null;
}

export interface Product {
  id: string;
  name: string;
  nameAr: string;
  description: string | null;
  descriptionAr: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
}

export interface MerchantOrder {
  id: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    productNameSnapshot: string;
    productNameArSnapshot: string;
    quantity: number;
    totalPrice: number;
  }>;
  user: { name: string; unitNumber: string };
}

export const merchantApi = {
  // Shop
  getMyShop: () =>
    client.get<{ data: MerchantShop }>('/merchant/shop'),

  toggleShopOpen: (isOpen: boolean) =>
    client.patch<{ data: MerchantShop }>('/merchant/shop', { isOpen }),

  // Products
  getMyProducts: (params?: { cursor?: string; limit?: number; includeUnavailable?: boolean }) =>
    client.get<{ data: { data: Product[]; nextCursor: string | null } }>('/merchant/products', { params }),

  createProduct: (data: {
    name: string;
    nameAr: string;
    description?: string;
    descriptionAr?: string;
    price: number;
    imageUrl?: string;
  }) => client.post<{ data: Product }>('/merchant/products', data),

  updateProduct: (productId: string, data: Partial<{
    name: string;
    nameAr: string;
    description: string;
    descriptionAr: string;
    price: number;
    imageUrl: string;
    isAvailable: boolean;
  }>) => client.patch<{ data: Product }>(`/merchant/products/${productId}`, data),

  deleteProduct: (productId: string) =>
    client.delete(`/merchant/products/${productId}`),

  // Orders (incoming to my shop)
  getIncomingOrders: (params?: { cursor?: string; limit?: number; status?: string }) =>
    client.get<{ data: { data: MerchantOrder[]; nextCursor: string | null } }>('/merchant/orders', { params }),

  getOrder: (orderId: string) =>
    client.get<{ data: MerchantOrder }>(`/merchant/orders/${orderId}`),

  updateOrderStatus: (orderId: string, status: string) =>
    client.patch<{ data: MerchantOrder }>(`/orders/${orderId}/status`, { status }),
};
