# EastPark Frontend — Session Context

> Claude Code loads this file automatically when invoked in `eastpark-frontend/`.
> Root project context: see `/mnt/c/Unite/EastPark-App/CLAUDE.md`.

## Status

✅ All 7 phases + all 38 AppGaps + deep-audit passes + FE-BE wiring resolved.
Last commits: `3ea3f75` → `8e8634c` (continuation pass). Branch: main.

## User Roles

| Role | Registration Flow |
|---|---|
| Guest | No auth. Read-only: directory, announcements, governance. |
| Resident | Email + unit number + password → Email OTP → verified |
| Merchant | Admin email invitation → one-time token → `accept-invitation` deep link → name + password |
| Admin | Admin email invitation → one-time token → `accept-invitation` deep link → name + password |

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
| Icons | Phosphor Icons — NEVER emoji, NEVER unicode arrows/chevrons |
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
│   ├── api/                     # client.ts, auth.ts, shops.ts, users.ts, notifications.ts, orders.ts, merchant.ts, admin.ts, community.ts, governance.ts
│   └── push/index.ts            # Push token registration (requestPermissionsAsync + getExpoPushTokenAsync + projectId)
├── store/
│   ├── index.ts                 # Redux store + persistor (blacklist: accessToken, refreshToken, showAuthWall, authWallConfig)
│   └── slices/                  # authSlice, cartSlice, preferencesSlice
├── theme/tokens.ts              # BRAND, DARK, SEMANTIC, FONT, SPACING, RADIUS
└── translations/                # en.json, ar.json — all UI strings, no hardcoded text ever
assets/animations/               # success.json (Lottie — used in checkout/confirmation.tsx)
```

## Key Patterns

**No hardcoded strings.** Always `t('key')` via `useTranslation()`.

**No hardcoded currency.** Always `formatCurrency(amount)` — never `EGP ${price}` or `amount.toFixed(2)`.

**Design tokens only.** Import from `@/theme/tokens`:
- Colors: `BRAND.gold` (#b8966a), `DARK.bg` (#0d0c0b), `DARK.card` (#221f1c), `DARK.elevated` (#2e2a26), `DARK.text`, `DARK.textMuted`, `DARK.border`
- Semantic: `SEMANTIC.success`, `SEMANTIC.warning`, `SEMANTIC.error`, `SEMANTIC.info`
- `FONT.sans` (Cairo), `FONT.display` (Cormorant Garamond — display English only, never Arabic)
- `SPACING.xs/sm/md/base/lg/xl/2xl/3xl`, `RADIUS.sm/md/lg/full`
- Transparent overlays: use token + hex suffix (e.g. `` `${BRAND.gold}22` `` = 13% opacity) — NEVER raw `rgba()`

**Icons.** Always Phosphor (`phosphor-react-native`). NEVER:
- Emoji literals (`🔔`, `📦`, `✏️`, etc.)
- Unicode arrows/chevrons (`←`, `→`, `›`, `‹`, `✕`)
- Use: `ArrowLeft`, `ArrowRight`, `CaretRight`, `CaretLeft`, `X`, `Plus`, `Trash`, `Bell`, `Package`, etc.

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

**N+1 fetch avoidance.** When a detail screen can reuse the list cache, use `initialData` + `initialDataUpdatedAt`:
```typescript
const { data } = useQuery({
  queryKey: ['item', id],
  queryFn: () => api.getAll({ limit: 100 }),
  select: res => res.data.data.data.find(i => i.id === id),
  initialData: () => queryClient.getQueryData(['items']),
  initialDataUpdatedAt: () => queryClient.getQueryState(['items'])?.dataUpdatedAt,
});
```

**After login:** Always `await authApi.updatePushToken(token)` → `PATCH /auth/push-token` (NOT `/users/me/push-token`).

**Push token registration:** Use `Constants.expoConfig?.extra?.eas?.projectId` in `getExpoPushTokenAsync({ projectId })`.

**Token storage:** expo-secure-store only (SECURE_KEY_ACCESS / SECURE_KEY_REFRESH). Blacklisted from redux-persist: `accessToken`, `refreshToken`, `showAuthWall`, `authWallConfig`.

**RTL:** `I18nManager.forceRTL(true/false)` on language switch + restart prompt.

**Motion:** Spring physics via reanimated. Lottie on key moments (order confirmed, payment success). Skeleton shimmer (never spinners). Haptics on interactive taps.

**Paymob flow (3 steps):**
1. `ordersApi.placeOrder(...)` → returns `orderId`
2. `ordersApi.initiatePaymobPayment(orderId)` → returns `iframeUrl`  (endpoint: `POST /orders/:id/pay/paymob`)
3. `Linking.openURL(iframeUrl)` — opens external browser
4. Clear cart + navigate to confirmation regardless (actual payment status confirmed via webhook)

**API service URL conventions (confirmed against backend):**
- Profile: `GET /user/profile`, update: `PUT /user`, delete: `DELETE /user`
- Push token: `PATCH /auth/push-token`
- Merchant order status: `PATCH /merchant/orders/:id/status`
- Notification prefs: `GET /notifications/preferences`, update: `PUT /notifications/preferences/:type`
- Paymob: `POST /orders/:id/pay/paymob`

## Design System (locked — never re-debate)

Full reference: `Documentation/DESIGN.md` (in this directory). Core rules:

| Token | Value | Rule |
|---|---|---|
| Primary gold | `#b8966a` | From logo. Use sparingly |
| Gold on light bg | `#7a5e38` | gold-500 fails WCAG AA on light — always use gold-700 |
| Dark bg | `#0d0c0b` | Warm near-black. Never pure #000 |
| Dark card | `#221f1c` | — |
| Dark elevated | `#2e2a26` | Modals, sheets |
| Light surface | `#faf8f5` | Warm off-white. Never cold zinc |
| Success | `#5A7A52` | Muted olive — not bright green |
| Warning | `#C48B2F` | Deep amber |
| Error | `#B03A2E` | Deep muted red |
| Info | `#4A6B8A` | Slate blue — informational banners |

- **Fonts:** Cairo (all UI + all Arabic) · Cormorant Garamond (English display/hero only — never functional UI, never Arabic)
- **Dark mode is flagship** — light is a user toggle preference
- **Motion:** Rich and delightful — spring physics, Lottie on key moments (order placed, vote submitted, payment success, registration complete), skeleton shimmer (never spinners), haptics on every tap, respect `prefers-reduced-motion`
- **Accessibility:** WCAG AA — contrast ≥ 4.5:1 text, ≥ 3:1 large text. Touch targets 44dp min / 48dp preferred
- **Never:** pure #000/#fff surfaces · cold zinc grays · emerald green · neon colors · spinners

## Impeccable Skill Pack

21 design commands installed at project level.
- Source: `.agents/skills/` · Claude Code: `.claude/skills/`

**Per-screen workflow:** `/arrange → /typeset → /colorize → /critique → /polish`
**Before any PR:** `/audit → /harden → /clarify`
**Post-module:** `/normalize → /extract → /adapt`
**Pre-launch:** `/delight → /overdrive → /polish`

## FE Delivery Milestones (completed)

1. ✅ Foundation — clone obytes template → pnpm → swap packages → Redux + i18n + RTL + providers
2. ✅ Auth & Core Shell — register → OTP → login → JWT → auth-wall → tab nav → push token
3. ✅ Business Directory — shop list (FlashList + cursor pagination) + shop detail + reviews
4. ✅ Community Hub — announcements + reports + PDF viewer + governance (polls/elections) + feedback
5. ✅ Ordering — cart → checkout (COD + Paymob) → real-time tracking (Socket.io) + cancel
6. ✅ Merchant Tools — merchant dashboard + menu CRUD + order management
7. ✅ Polish & Launch prep — RTL QA + Lottie animations + EAS build config

## Commit Convention

Format: `[AhmedMuhammedElsaid][feat|fix|chore|docs]: description`
Always `--no-verify` (WSL cannot run node/pnpm hooks). Branch: main.

## Env Vars

```
EXPO_PUBLIC_API_URL=http://localhost:3000        # dev — NO /v1, Axios client appends it
EXPO_PUBLIC_API_URL=https://eastpark-backend.fly.dev  # prod — NO /v1
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000    # dev — no /v1, Socket.io uses root
```

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
- `deleteAccount` (`DELETE /user`) exists on backend but is admin-only route in current BE implementation — self-delete endpoint needs to be added to backend before this FE feature works end-to-end

## Deep Audit — What Was Fixed (reference)

All issues discovered across 3 audit passes on 2026-04-01:

### P0 — Ship-blockers (all fixed)
- `initiatePaymobPayment` URL: `/orders/:id/pay` → `/orders/:id/pay/paymob`
- `merchantApi.updateOrderStatus` URL: `/orders/:id/status` → `/merchant/orders/:id/status`
- Push token endpoint: `/users/me/push-token` → `/auth/push-token`
- Push token missing `projectId` in `getExpoPushTokenAsync()`
- `accessToken`/`refreshToken` persisted to MMKV — blacklisted from persist
- `payment.tsx` placed order but never called `initiatePaymobPayment` — full 3-step flow added
- `accept-invitation.tsx` sent ADMIN to `/(tabs)` — fixed to `/(admin)`
- `(admin)/_layout.tsx` sent unauthenticated to `/(tabs)` — fixed to `/(auth)/login`

### P1 — Required features (all fixed)
- `formatRelativeTime` in notifications used hardcoded Arabic — i18n'd with `t()` + 4 new translation keys
- Notifications FlashList missing `onRefresh`/`refreshing`
- Hardcoded `EGP X` in 3 screens — replaced with `formatCurrency()`
- `users.ts` had duplicate/wrong notification preference methods pointing to wrong URLs

### P2 — Design & quality (all fixed — 29+ files)
- `error-state.tsx` had 3 hardcoded English strings
- `formatCurrency.ts` used string concat — upgraded to `Intl.NumberFormat`
- Emoji icons replaced with Phosphor across all screens (30+ instances)
- Raw `←` / `›` / `✕` text arrows replaced with ArrowLeft/CaretRight/X from Phosphor
- Hardcoded `rgba(...)` colors replaced with token + hex opacity suffix
- `[shopId]/index.tsx` MenuTabContent: `View+.map()` → FlashList
- Reviews: `useQuery` capped at 20 → `useInfiniteQuery` + FlashList
- Merchant `[productId].tsx`: N+1 fetch (load all 100 to find 1) → `initialData` from list cache
