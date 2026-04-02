import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';
import { Uniwind, useUniwind } from 'uniwind';

const SELECTED_THEME = 'SELECTED_THEME';
export type ColorSchemeType = 'light' | 'dark' | 'system';

export function useSelectedTheme() {
  const { theme: _theme } = useUniwind();
  const [theme, setThemeState] = React.useState<ColorSchemeType>('system');

  React.useEffect(() => {
    AsyncStorage.getItem(SELECTED_THEME).then((val) => {
      if (val) setThemeState(val as ColorSchemeType);
    });
  }, []);

  const setSelectedTheme = React.useCallback((t: ColorSchemeType) => {
    Uniwind.setTheme(t);
    setThemeState(t);
    AsyncStorage.setItem(SELECTED_THEME, t);
  }, []);

  return { selectedTheme: theme, setSelectedTheme } as const;
}

// Called from RootLayout useEffect to restore theme before first meaningful render
export async function loadSelectedTheme() {
  const theme = await AsyncStorage.getItem(SELECTED_THEME);
  if (theme) {
    Uniwind.setTheme(theme as ColorSchemeType);
  }
}
