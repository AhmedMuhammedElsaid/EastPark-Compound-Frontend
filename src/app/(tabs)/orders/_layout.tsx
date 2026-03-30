import { Redirect, Stack } from 'expo-router';

import { useAppSelector } from '@/store';
import { DARK } from '@/theme/tokens';

/**
 * Orders stack — auth-guarded.
 * Guests who tap the Orders tab are redirected to the auth wall via login screen.
 */
export default function OrdersLayout() {
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: DARK.bg },
      }}
    />
  );
}
