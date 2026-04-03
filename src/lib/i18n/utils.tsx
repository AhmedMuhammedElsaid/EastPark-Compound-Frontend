import type TranslateOptions from 'i18next';
import type { Language, resources } from './resources';
import type { RecursiveKeyOf } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import memoize from 'lodash.memoize';
import { useCallback } from 'react';
import { I18nManager, NativeModules, Platform } from 'react-native';

import RNRestart from 'react-native-restart';
import { store, useAppSelector } from '@/store';
import { setLanguage as setLanguageAction } from '@/store/slices/preferencesSlice';

type DefaultLocale = typeof resources.en.translation;
export type TxKeyPath = RecursiveKeyOf<DefaultLocale>;

export const LOCAL = 'local';

// Synchronous fallback — AsyncStorage is async so this returns null on init.
// i18n init falls back to getLocales()[0]?.languageTag which is correct.
export const getLanguage = (): Language | null => null;

export const translate = memoize(
  (key: TxKeyPath, options = undefined) =>
    i18n.t(key, options) as unknown as string,
  (key: TxKeyPath, options: typeof TranslateOptions) =>
    options ? key + JSON.stringify(options) : key,
);

export function changeLanguage(lang: Language) {
  i18n.changeLanguage(lang);
  // Persist in both Redux (redux-persist → AsyncStorage) and direct AsyncStorage for legacy reads
  store.dispatch(setLanguageAction(lang));
  AsyncStorage.setItem(LOCAL, lang);
  I18nManager.allowRTL(lang === 'ar');
  I18nManager.forceRTL(lang === 'ar');
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    if (__DEV__)
      NativeModules.DevSettings.reload();
    else RNRestart.restart();
  }
  else if (Platform.OS === 'web') {
    window.location.reload();
  }
}

export function useSelectedLanguage() {
  // Read from Redux — persisted via redux-persist, always in sync after rehydration.
  // This avoids the undefined flash that the old AsyncStorage useEffect caused.
  const language = useAppSelector(s => s.preferences.language);

  const setLanguage = useCallback(
    (lang: Language) => {
      changeLanguage(lang); // dispatches setLanguageAction to Redux + triggers restart
    },
    [],
  );

  return { language, setLanguage };
}
