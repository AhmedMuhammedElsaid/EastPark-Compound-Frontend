import type { AuthUser } from '@/store/slices/authSlice';

import { client } from './client';

export const usersApi = {
  getProfile: () =>
    client.get<{ data: AuthUser }>('/user/profile'),

  updateProfile: (data: Partial<Pick<AuthUser, 'name' | 'phone' | 'unitNumber' | 'avatarUrl'>>) =>
    client.put<{ data: AuthUser }>('/user', data),

  updatePushToken: (pushToken: string) =>
    client.patch<{ data: { success: boolean } }>('/auth/push-token', { pushToken }),

  deleteAccount: () =>
    client.delete<{ data: { success: boolean } }>('/user'),
};
