import { client } from './client';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getNotifications: (params?: { cursor?: string; limit?: number }) =>
    client.get<{ data: { data: AppNotification[]; nextCursor: string | null } }>('/notifications', { params }),

  markRead: (notificationId: string) =>
    client.patch<{ data: AppNotification }>(`/notifications/${notificationId}/read`),

  markAllRead: () =>
    client.patch<{ data: { success: boolean } }>('/notifications/read-all'),
};
