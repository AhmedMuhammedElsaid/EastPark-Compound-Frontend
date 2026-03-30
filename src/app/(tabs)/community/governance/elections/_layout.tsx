import { Stack } from 'expo-router';

import { DARK } from '@/theme/tokens';

export default function ElectionsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: DARK.bg } }} />
  );
}
