import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { ThemeProvider } from '@react-navigation/native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { AuthWallSheet } from '@/components/auth/auth-wall-sheet';
import { CartConflictSheet } from '@/components/cart/cart-conflict-sheet';

import { useThemeConfig } from '@/components/ui/use-theme-config';
import { loadSelectedTheme } from '@/lib/hooks/use-selected-theme';
import { injectStore } from '@/services/api/client';
import { asyncStoragePersister, queryClient } from '@/services/query/client';
import { persistor, store } from '@/store';
// Global CSS must be imported before other app modules
import '../global.css';

// Inject Redux store into the Axios client for 401 token refresh + logout dispatch
injectStore(store);

// Restore theme from MMKV before first render
loadSelectedTheme();

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 500, fade: true });

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  return (
    <ReduxProvider store={store}>
      <PersistGate persistor={persistor}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >
          <Providers>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(merchant)" options={{ headerShown: false }} />
              <Stack.Screen name="(admin)" options={{ headerShown: false }} />
              <Stack.Screen name="checkout" options={{ headerShown: false }} />
              <Stack.Screen name="notifications" options={{ headerShown: false }} />
            </Stack>
          </Providers>
        </PersistQueryClientProvider>
      </PersistGate>
    </ReduxProvider>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeConfig();
  return (
    <GestureHandlerRootView
      style={styles.container}
      // eslint-disable-next-line better-tailwindcss/no-unknown-classes
      className={theme.dark ? 'dark' : undefined}
    >
      <KeyboardProvider>
        <ThemeProvider value={theme}>
          <BottomSheetModalProvider>
            {children}
            <AuthWallSheet />
            <CartConflictSheet />
            <FlashMessage position="top" />
          </BottomSheetModalProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
