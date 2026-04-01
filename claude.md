# EastPark Frontend — Session Context

> Claude Code loads this file automatically when invoked in `eastpark-frontend/`.
> Root project context: see `/mnt/c/Unite/EastPark-App/CLAUDE.md`.

## Status

✅ All 7 phases + all 38 AppGaps + 20 deep-audit fixes + FE-BE wiring resolved.
Last commit: `10e5b67`. Branch: main.

## Stack (locked — do not change)

| Layer | Choice |
|---|---|
| Framework | Expo SDK 54 + React Native 0.81.5, Hermes + New Architecture |
| Language | TypeScript strict |
| Navigation | Expo Router 6 (file-based routing) |
| State | Redux Toolkit + redux-persist (NOT Zustand) |
| Server state | TanStack React Query v5 |
| Forms | React Hook Form + Zod (NOT TanStack Form) |
| Auth tokens | expo-secure-store (NOT MMKV, NOT AsyncStorage) |
| Lists | @shopify/flash-list — NEVER FlatList, NEVER View+.map() for lists |
| Styling | NativeWind v4 + Gluestack UI v2 |
| Icons | Phosphor Icons — NEVER emoji, NEVER unicode arrows |
| i18n | expo-localization + i18n-js — AR RTL primary, EN LTR secondary |
| Animation | react-native-reanimated + lottie-react-native |
| Bottom Sheet | @gorhom/bottom-sheet |
| API client | Axios (src/services/api/client.ts) with 401 silent refresh queue interceptor |
| Push | expo-notifications + Expo Push Service |
| Real-time | socket.io-client |
| Build | EAS Build/Submit |

## Project Structure (actual)

```
src/
├── app/                         # Expo Router routes — all screens live here
│   ├── _layout.tsx              # Root providers: Redux, Query, i18n, Gluestack, PersistGate
│   ├── (tabs)/
│   │   ├── index.tsx            # Home feed
│   │   ├── directory/           # Shop list + [shopId]/ (detail+reviews) + menu
│   │   ├── orders/              # Order history + [orderId] detail (Socket.io live status)
│   │   ├── community/           # Announcements + reports + governance + feedback
│   │   └── profile/             # Profile or guest CTA
│   ├── (auth)/                  # login, register, verify-otp, forgot-password, reset-password, accept-invitation
│   ├── (admin)/                 # Admin dashboard + invitations management
│   ├── (merchant)/              # Merchant dashboard + menu CRUD + orders
│   ├── checkout/                # cart, address, payment, confirmation (Lottie)
│   └── notifications/           # In-app notification feed
├── components/ui/               # Skeleton, ErrorState, AuthWallSheet, CartConflictSheet
├── lib/
│   ├── hooks/                   # useAuthGuard, useAuthRehydration, useFonts
│   └── formatCurrency.ts        # Intl.NumberFormat with locale support
├── services/
│   ├── api/                     # client.ts, auth.ts, shops.ts, users.ts, notifications.ts, orders.ts, merchant.ts, admin.ts
│   └── push/index.ts            # Push token registration (requestPermissionsAsync + getExpoPushTokenAsync)
├── store/
│   ├── index.ts                 # Redux store + persistor (blacklist: accessToken, refreshToken)
│   └── slices/                  # authSlice, cartSlice, preferencesSlice
├── theme/tokens.ts              # BRAND, DARK, SEMANTIC, FONT, SPACING, RADIUS
└── translations/                # en.json, ar.json — all UI strings, no hardcoded text ever
assets/animations/               # success.json (Lottie — used in checkout/confirmation.tsx)
```

## Key Patterns

**No hardcoded strings.** Always `t('key')` via `useTranslation()`.

**No hardcoded currency.** Always `formatCurrency(amount)` — never `EGP ${price}`.

**Design tokens.** Import from `@/theme/tokens`:
- Colors: `BRAND.gold` (#b8966a), `DARK.bg` (#0d0c0b), `DARK.card` (#221f1c), `DARK.elevated` (#2e2a26), `DARK.text`, `DARK.textMuted`, `DARK.border`
- Semantic: `SEMANTIC.success`, `SEMANTIC.warning`, `SEMANTIC.error`, `SEMANTIC.info`
- `FONT.sans` (Cairo), `FONT.display` (Cormorant Garamond — display English only, never Arabic)
- `SPACING.xs/sm/md/base/lg/xl/2xl/3xl`, `RADIUS.sm/md/lg/full`

**Auth-wall.** Guest action → `requireAuth(() => { ... })` from `useAuthGuard()` hook → dispatches `showAuthWall` → `<AuthWallSheet />` shows → after login, action auto-replays.

**Cursor pagination.** All list screens:
```typescript
useInfiniteQuery({
  initialPageParam: undefined,
  queryFn: ({ pageParam }) => api.getItems({ cursor: pageParam, limit: 20 }),
  getNextPageParam: (last) => last.data.data.nextCursor ?? undefined,
})
// FlashList onEndReached → fetchNextPage()
```

**After login:** Always `await api.patch('/auth/push-token', { pushToken })`.

**RTL:** `I18nManager.forceRTL(true/false)` on language switch + restart prompt.

**Motion:** Spring physics via reanimated. Lottie on key moments (order confirmed, payment success). Skeleton shimmer (never spinners). Haptics on interactive taps.

## Commit Convention

Format: `[AhmedMuhammedElsaid][feat|fix|chore|docs]: description`
Always `--no-verify` (WSL cannot run node/pnpm hooks). Branch: main.

## Env Vars

```
EXPO_PUBLIC_API_URL=http://localhost:3000       # dev — do NOT add /v1, Axios client appends it
EXPO_PUBLIC_API_URL=https://api.eastpark.app    # prod
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000    # dev
```
> Android emulator: use `http://10.0.2.2:3000`. Physical device: use your LAN IP (`http://192.168.x.x:3000`).

## Commands

```bash
pnpm start              # Start dev server
pnpm ios / pnpm android # Run on platform
pnpm lint               # ESLint
pnpm type-check         # TypeScript
pnpm test               # Jest
pnpm build:production:ios   # EAS production iOS
```

## Known Environment Notes

- All commits use `--no-verify` — WSL cannot run node/pnpm, pre-commit hook always fails
- `eas init` must be run manually to get `EAS_PROJECT_ID` (paste into `app.config.ts`)
- `eastpark-frontend/` is its own git repo — commits must be made from inside this directory
