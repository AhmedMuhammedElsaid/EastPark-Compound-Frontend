import { Redirect, Stack } from 'expo-router';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

export default function AdminLayout() {
  const role = useSelector((state: RootState) => state.auth.user?.role);
  if (role !== 'ADMIN') return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
