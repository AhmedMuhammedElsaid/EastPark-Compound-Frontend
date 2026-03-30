import type { AuthUser } from '@/store/slices/authSlice';

import { client } from './client';

export interface NotificationPreference {
  type: string;
  enabled: boolean;
}

export const usersApi = {
  getProfile: () =>
    client.get<{ data: AuthUser }>('/user/profile'),

  updateProfile: (data: Partial<Pick<AuthUser, 'name' | 'phone' | 'unitNumber' | 'avatarUrl'>>) =>
    client.put<{ data: AuthUser }>('/user', data),

  updatePushToken: (pushToken: string) =>
    client.patch<{ data: { success: boolean } }>('/users/me/push-token', { pushToken }),

  getNotificationPreferences: () =>
    client.get<{ data: NotificationPreference[] }>('/users/me/notification-preferences'),

  updateNotificationPreferences: (preferences: NotificationPreference[]) =>
    client.patch<{ data: NotificationPreference[] }>('/users/me/notification-preferences', { preferences }),

  deleteAccount: () =>
    client.delete<{ data: { success: boolean } }>('/users/me'),
};
