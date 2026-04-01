import * as Notifications from 'expo-notifications';

import { usersApi } from '@/services/api/users';

/**
 * Requests push notification permission (if not yet granted) then registers
 * the Expo push token with the backend.
 * Called after every successful login or OTP verification.
 */
export async function registerPushToken() {
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const result = await Notifications.requestPermissionsAsync();
      status = result.status;
    }
    if (status === 'granted') {
      const token = await Notifications.getExpoPushTokenAsync();
      await usersApi.updatePushToken(token.data);
    }
  }
  catch {}
}
