import { Stack } from 'expo-router';

import { DARK } from '@/theme/tokens';

/**
 * Profile stack layout.
 * No hard redirect — profile shows a guest CTA when not authenticated.
 * This matches the design: guests can reach profile but see a sign-in prompt.
 */
export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: DARK.bg },
      }}
    />
  );
}
