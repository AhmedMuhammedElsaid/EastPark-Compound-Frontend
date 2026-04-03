import { getSecureItem } from '@/lib/secure-storage';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';

import { SECURE_KEY_ACCESS, SECURE_KEY_REFRESH } from '@/services/api/client';
import { usersApi } from '@/services/api/users';
import { useAppDispatch } from '@/store';
import { login } from '@/store/slices/authSlice';

/**
 * Reads persisted tokens from SecureStore on cold launch.
 * If valid tokens are found, fetches the user profile and rehydrates Redux auth state.
 * Always calls SplashScreen.hideAsync() in the finally block so the splash is dismissed.
 */
export function useAuthRehydration(): void {
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    async function rehydrate() {
      try {
        const accessToken = await getSecureItem(SECURE_KEY_ACCESS);
        const refreshToken = await getSecureItem(SECURE_KEY_REFRESH);
        if (accessToken && refreshToken) {
          const { data } = await usersApi.getProfile();
          dispatch(login({ user: data.data, accessToken, refreshToken }));
        }
      }
      catch {
        // expired / invalid — the 401 interceptor handles logout + SecureStore cleanup
      }
      finally {
        SplashScreen.hideAsync();
      }
    }
    rehydrate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
