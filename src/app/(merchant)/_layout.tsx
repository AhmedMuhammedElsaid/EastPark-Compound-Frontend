import { Redirect, Stack } from 'expo-router';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

export default function MerchantLayout() {
  const role = useSelector((state: RootState) => state.auth.user?.role);
  if (role !== 'MERCHANT') return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
