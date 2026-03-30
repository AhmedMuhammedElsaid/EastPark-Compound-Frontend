import { client } from './client';

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'PAYMOB';

export interface OrderItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  productNameArSnapshot: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  totalAmount: number;
  notes: string | null;
  cancelledAt: string | null;
  createdAt: string;
  shop: { id: string; name: string; nameAr: string };
  items: OrderItem[];
}

export interface PlaceOrderPayload {
  shopId: string;
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export const ordersApi = {
  placeOrder: (payload: PlaceOrderPayload) =>
    client.post<{ data: Order }>('/orders', payload),

  getOrders: (params?: { cursor?: string; limit?: number }) =>
    client.get<{ data: { data: Order[]; nextCursor: string | null } }>('/orders', { params }),

  getOrder: (orderId: string) =>
    client.get<{ data: Order }>(`/orders/${orderId}`),

  cancelOrder: (orderId: string) =>
    client.patch<{ data: Order }>(`/orders/${orderId}/cancel`),

  initiatePaymobPayment: (orderId: string) =>
    client.post<{ data: { paymentKey: string; orderId: string } }>(`/orders/${orderId}/pay`),
};
