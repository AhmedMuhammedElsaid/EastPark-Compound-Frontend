import type TranslateOptions from 'i18next';
import type { Language, resources } from './resources';
import type { RecursiveKeyOf } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import memoize from 'lodash.memoize';
import { useCallback, useEffect, useState } from 'react';
import { I18nManager, NativeModules, Platform } from 'react-native';

import RNRestart from 'react-native-restart';

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
  AsyncStorage.setItem(LOCAL, lang);
  if (lang === 'ar') {
    I18nManager.forceRTL(true);
  }
  else {
    I18nManager.forceRTL(false);
  }
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
  const [language, setLanguageState] = useState<Language | undefined>(undefined);

  useEffect(() => {
    AsyncStorage.getItem(LOCAL).then((val) => {
      if (val) setLanguageState(val as Language);
    });
  }, []);

  const setLanguage = useCallback(
    (lang: Language) => {
      setLanguageState(lang);
      changeLanguage(lang);
    },
    [],
  );

  return { language: language as Language, setLanguage };
}
