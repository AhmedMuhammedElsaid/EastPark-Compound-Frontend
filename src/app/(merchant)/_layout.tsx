import type { RootState } from '@/store';
import { Redirect, Stack } from 'expo-router';
import { useSelector } from 'react-redux';

export default function MerchantLayout() {
  const role = useSelector((state: RootState) => state.auth.user?.role);
  if (role !== 'MERCHANT')
    return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
