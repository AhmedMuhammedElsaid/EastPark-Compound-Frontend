import type { AuthUser } from '@/store/slices/authSlice';

import { client } from './client';

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  unitNumber: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    client.post<{ data: { message: string } }>('/auth/register', payload),

  verifyOtp: (email: string, otp: string) =>
    client.post<{ data: AuthResponse }>('/auth/verify-otp', { email, otp }),

  resendOtp: (email: string) =>
    client.post<{ data: { message: string } }>('/auth/resend-otp', { email }),

  login: (payload: LoginPayload) =>
    client.post<{ data: AuthResponse }>('/auth/login', payload),

  logout: (refreshToken: string) =>
    client.post<{ data: { success: boolean } }>('/auth/logout', { refreshToken }),

  forgotPassword: (email: string) =>
    client.post<{ data: { message: string } }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    client.post<{ data: { message: string } }>('/auth/reset-password', { token, password }),

  acceptInvitation: (token: string, name: string, password: string) =>
    client.post<{ data: AuthResponse }>('/auth/accept-invitation', { token, name, password }),

  updatePushToken: (pushToken: string) =>
    client.patch<{ data: { success: boolean } }>('/auth/push-token', { pushToken }),
};
