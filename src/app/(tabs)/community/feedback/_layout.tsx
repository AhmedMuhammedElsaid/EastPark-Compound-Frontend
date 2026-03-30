import { Redirect, Stack } from 'expo-router';

import { useAppSelector } from '@/store';
import { DARK } from '@/theme/tokens';

export default function FeedbackLayout() {
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);

  if (!isAuthenticated)
    return <Redirect href="/(auth)/login" />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: DARK.bg } }} />
  );
}
