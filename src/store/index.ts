import type { TypedUseSelectorHook } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import { storage } from '@/lib/storage';

import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import preferencesReducer from './slices/preferencesSlice';

// MMKV-backed storage adapter for redux-persist
const mmkvStorage = {
  setItem: (key: string, value: string) => {
    storage.set(key, value);
    return Promise.resolve(true);
  },
  getItem: (key: string) => {
    const value = storage.getString(key);
    return Promise.resolve(value ?? null);
  },
  removeItem: (key: string) => {
    storage.remove(key);
    return Promise.resolve();
  },
};

const authPersistConfig = {
  key: 'auth',
  storage: mmkvStorage,
  // Tokens kept in SecureStore; Redux holds in-memory copy only for interceptors.
  // We still persist user + isAuthenticated for UI state (tokens re-read from SecureStore on startup).
  blacklist: ['showAuthWall', 'authWallConfig'],
};

const cartPersistConfig = {
  key: 'cart',
  storage: mmkvStorage,
  // Don't persist conflict-sheet transient state
  blacklist: ['pendingItem', 'pendingShopId', 'pendingShopName', 'showConflictSheet'],
};

const preferencesPersistConfig = {
  key: 'preferences',
  storage: mmkvStorage,
};

export const store = configureStore({
  reducer: {
    auth: persistReducer(authPersistConfig, authReducer),
    cart: persistReducer(cartPersistConfig, cartReducer),
    preferences: persistReducer(preferencesPersistConfig, preferencesReducer),
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
