import { Stack } from 'expo-router';

import { DARK } from '@/theme/tokens';

export default function MerchantOrdersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: DARK.bg } }} />
  );
}
