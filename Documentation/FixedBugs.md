# EastPark Frontend — Bug Fix Log

> Recorded after a comprehensive two-pass audit (April 2026).
> All bugs were fixed in commits on branch `main`.
> Last commits: `085f3ed`, `81140a4`.

---

## Cannot Fix Without Backend Changes

These are known gaps that require backend work before the frontend feature works end-to-end.

| Issue | Frontend Status | Backend Requirement |
|---|---|---|
| **Delete account self-service** | Frontend calls `DELETE /user` correctly via `usersApi.deleteAccount()` | Backend currently exposes this route as admin-only (`DELETE /admin/user/:id`). Needs a resident self-service `DELETE /user` endpoint |
| **Merchant pending order count** | Dashboard fetches `limit: 5` and shows `.length` — accurate only when ≤5 pending orders exist | Needs a count endpoint (e.g. `GET /merchant/orders/count?status=PLACED`) or `totalCount` field in list response |

---

## P0 — Critical Bugs Fixed

### Theme + Language Reactivity (Root Cause)
**Problem:** All screens used `StyleSheet.create({ color: DARK.textColor })` at module level. This captures token values at import time and never updates when the user switches theme or language.

**Fix:**
- Created `src/lib/hooks/use-app-colors.ts` — new reactive hook reading `useUniwind()` and returning the correct DARK or LIGHT token set
- Converted all 49 screens + 10 shared components to `useStyles()` + `useAppColors()` pattern:
  ```typescript
  function useStyles() {
    const colors = useAppColors();
    return React.useMemo(() => StyleSheet.create({ ... }), [colors]);
  }
  ```
- Added `LIGHT.elevated` token to `src/theme/tokens.ts` (was DARK-only)
- Zero static `DARK.*` references remain in screen files

### Language Switching Broken
**Problem:** `useSelectedLanguage()` read language from AsyncStorage via `useEffect` — always returned `undefined` initially, then settled on wrong value. `changeLanguage()` didn't persist to Redux. RTL was applied from device locale on init, overriding the saved preference.

**Fix:**
- `src/lib/i18n/utils.tsx`: `changeLanguage()` now dispatches `setLanguageAction` to Redux; `useSelectedLanguage()` reads `useAppSelector(s => s.preferences.language)` directly
- `src/lib/i18n/index.tsx`: removed incorrect `I18nManager.forceRTL` calls from init (was overriding saved RTL state with device locale)
- `src/app/_layout.tsx`: added `useEffect([savedLanguage])` that applies `i18n.changeLanguage` + `I18nManager` after redux-persist rehydration

### Theme Switching Broken
**Problem:** `useSelectedTheme()` tried to read from AsyncStorage via `useEffect` — suffered same timing issue. `Uniwind.setTheme()` was called but Redux state wasn't updated.

**Fix:**
- `src/lib/hooks/use-selected-theme.tsx`: `persistedTheme` now reads `useAppSelector(s => s.preferences.theme)`; `setSelectedTheme` dispatches to Redux AND calls `Uniwind.setTheme()`

### PersistGate Not Blocking Render
**Problem:** `<PersistGate>` had no `loading` prop, so it rendered children immediately with the initial (empty) Redux state before rehydration completed.

**Fix:** `src/app/_layout.tsx`: `<PersistGate persistor={persistor} loading={null}>` — blocks render until persist rehydrates

### 401 Forced Logout Not Navigating
**Problem:** Axios 401 interceptor dispatched `logout()` but never navigated to login. User stayed on the current screen seeing an infinite error loop.

**Fix:** `src/services/api/client.ts`: catch block now calls `queryClient.clear()` + `dispatch(logout())` + `router.replace('/(auth)/login')`

### Merchant Layout Missing Auth Guard
**Problem:** `(merchant)/_layout.tsx` only checked `role !== 'MERCHANT'` — unauthenticated users (role = undefined) were redirected to `/(tabs)` instead of `/(auth)/login`.

**Fix:** Added `if (!isAuthenticated) return <Redirect href="/(auth)/login" />` before the role check

### Profile Logout Incomplete
**Problem:** `handleLogout` deleted tokens from SecureStore and dispatched Redux `logout()`, but never called `authApi.logout(refreshToken)` (server session remained active) or `queryClient.clear()` (stale data remained in cache) or navigated to login.

**Fix:** `src/app/(tabs)/profile/index.tsx`: `handleLogout` now calls `authApi.logout(refreshToken)` (fire-and-forget) + `queryClient.clear()` + `router.replace('/(auth)/login')`; `deleteAccount.onSuccess` also calls `queryClient.clear()` + `router.replace('/(auth)/login')`; added `onError` handler with flash message

### Stale Query Cache On Login (Cross-User Privacy)
**Problem:** When a different user logged in on the same device, cached data from the previous user (orders, profile, saved shops) was served immediately from persisted AsyncStorage cache.

**Fix:** `src/app/(auth)/login.tsx` + `src/app/(auth)/verify-otp.tsx`: call `queryClient.clear()` before `dispatch(login(...))` to wipe previous user's cache

### AuthUser Type — Non-Optional unitNumber/phone
**Problem:** `AuthUser.unitNumber: string` and `phone: string` were required, but MERCHANT/ADMIN users have no unit number or phone. TypeScript held `undefined` in a field typed as `string`.

**Fix:** `src/store/slices/authSlice.ts`: changed to `unitNumber?: string` and `phone?: string`

---

## P1 — Required Feature Fixes

### Push Token Not Registered After Invitation
**Problem:** `accept-invitation.tsx` dispatched `login()` and navigated but never called `registerPushToken()`. Merchants/admins who onboard via invitation never received push notifications.

**Fix:** Added `await registerPushToken()` before navigation in `onSubmit`

### Password Visibility Toggle Missing
**Problem:** `reset-password.tsx` and `accept-invitation.tsx` had no show/hide toggle on password fields. `login.tsx` and `register.tsx` used emoji (`👁`/`🙈`) instead of Phosphor icons.

**Fix:**
- `reset-password.tsx`: added `showPwd`/`showConfirm` state + `Eye`/`EyeSlash` Phosphor rightSlot
- `accept-invitation.tsx`: same pattern for both password fields
- `login.tsx` + `register.tsx`: replaced emoji with `Eye`/`EyeSlash` from `phosphor-react-native`

### verify-otp.tsx — Missing Email Null Guard + Keyboard Not Dismissed
**Problem:** `email` from `useLocalSearchParams` could be `undefined` if navigated to directly. `handleVerify()` did not dismiss the keyboard before submitting.

**Fix:** Added `useEffect` redirect if `!email`; `handleVerify()` calls `Keyboard.dismiss()` at start

### Auth-Wall Sheet Not Showing Context Message
**Problem:** `showAuthWall({ message })` was dispatched but `AuthWallSheet` never read or displayed `authWallConfig.message`.

**Fix:** `src/components/auth/auth-wall-sheet.tsx`: reads `authWallConfig` from Redux and renders `.message` as subtitle when present; button gap changed to `SPACING.sm` (was too tight at `SPACING.xs`)

### auth-input.tsx Unconditional Right Padding
**Problem:** All `AuthInput` components had 48px right padding even without a `rightSlot`, pushing text unnecessarily left.

**Fix:** `src/components/auth/auth-input.tsx`: `paddingRight` is now conditional: `hasRightSlot ? SPACING['4xl'] : SPACING.base`

### Feedback Query Runs Unauthenticated
**Problem:** `useInfiniteQuery` in feedback/index.tsx ran even for guests, causing 401 errors on mount.

**Fix:** Added `enabled: isAuthenticated` to the query

### Governance Queries Both Running on Mount
**Problem:** Both polls and elections queries fired on mount regardless of which tab was active.

**Fix:** `governance/index.tsx`: `pollsQuery` has `enabled: tab === 'polls'`; `electionsQuery` has `enabled: tab === 'elections'`

### Poll/Election Vote Percentage Wrong
**Problem:** Percentages were calculated using `maxVotes` (max allowed votes) as denominator instead of `totalVotes` (actual cast votes).

**Fix:** Changed denominator to `poll.totalVotes` with `totalVotes > 0` guard. Added `showMessage` toast on successful vote submission.

### Socket.io Cleanup Leak in Order Detail
**Problem:** Socket handler was an anonymous function — `socket.off('order_status_updated', handler)` couldn't remove it. Room was not left on unmount.

**Fix:** `orders/[orderId].tsx`: named `handler` function + `socketRef.off('order_status_updated', handler)` + `leaveOrderRoom(orderId)` in cleanup

### Cart Conflict Sheet Showed Wrong Shop Name
**Problem:** Conflict message said "Your cart has items from [new shop]" — should say "Your cart has items from [existing cart's shop]".

**Fix:** `cart-conflict-sheet.tsx`: `conflictingShop = shopName ?? pendingShopName ?? ''` (existing cart's shop first)

---

## P2 — Design, Quality, and Consistency Fixes

### formatCurrency Not Locale-Aware
**Problem:** Always formatted in `en-US` — Arabic users saw Latin numerals and wrong decimal format.

**Fix:** `src/lib/formatCurrency.ts`: `locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US'`

### Emoji Icons Used Instead of Phosphor
**Problem:** 30+ instances of emoji (`📦`, `🔔`, `✅`, etc.) and unicode arrows (`←`, `›`, `✕`) across screens. Violates design system and RTL rules.

**Fix:** Replaced all with appropriate Phosphor icons (`Package`, `Bell`, `Check`, `ArrowLeft`, `CaretRight`, `X`, etc.) across all affected files

### Raw rgba() Instead of Token + Hex Opacity
**Problem:** Several screens used `rgba(...)` directly, violating the token-only color rule.

**Fix:** Replaced all with token + hex suffix (e.g. `` `${BRAND.gold}22` `` for 13% opacity)

### Merchant Time Formatting Ignores Language
**Problem:** Merchant order screens hardcoded `'en-GB'` locale for time display.

**Fix:** `merchant/orders/index.tsx` + `merchant/orders/[orderId].tsx`: `locale = i18n.language === 'ar' ? 'ar-EG' : 'en-GB'`

### Merchant Mutations Missing onError Handlers
**Problem:** All merchant screen mutations (toggle availability, delete product, save product, update order status, reject order) had no `onError` callback — silent failures.

**Fix:** Added `onError: () => showMessage({ message: t('common.error'), type: 'danger' })` to all merchant mutations

### Edit Product Screen Nav Title Wrong
**Problem:** Edit product screen showed `t('common.save')` as the nav title instead of a descriptive title.

**Fix:** Nav title now uses `isNew ? t('merchant.new_product') : t('merchant.edit_product')`; added `merchant.edit_product` key to both `en.json` and `ar.json`

### Admin Dashboard Missing Quick Actions
**Problem:** Admin dashboard index had no navigation shortcuts.

**Fix:** `(admin)/index.tsx`: added Create Announcement (Megaphone), Create Poll (ChartBar), Create Election (Trophy) quick-action entries

### Merchant Dashboard Broken shop-profile Link
**Problem:** Quick-action "Shop profile" card navigated to `/(merchant)/shop-profile` which doesn't exist — would crash at runtime.

**Fix:** Removed the broken quick-action card from the merchant dashboard

### Paymob Error Doesn't Stop Navigation
**Problem:** If Paymob payment initiation threw, the catch block continued to clear cart and navigate to confirmation — leaving a broken order state.

**Fix:** `checkout/payment.tsx`: catch block now has `return` — on error shows toast and stops execution

### GoldButton Has No Haptics
**Problem:** CLAUDE.md requires haptics on every interactive tap. `GoldButton` (primary CTA used across the entire app) had none.

**Fix:** `src/components/auth/gold-button.tsx`: `onPressIn` calls `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`

### Cart Minus Icon Used Hardcoded DARK Token (Regression)
**Problem:** A previous audit pass re-introduced `DARK.textMuted` for the Minus icon color in `cart.tsx` — using a static token instead of the reactive `colors.textMuted`.

**Fix:** `checkout/cart.tsx`: `CartItemRow` now calls `useAppColors()` internally; Minus icon uses `colors.textMuted`; `DARK` removed from import

### profile/index.tsx Had Duplicate Return Statement
**Problem:** The `useStyles()` function in profile screen had both the memoized styles block and a trailing `return { styles, colors }` after the closing of `useMemo`. The code worked by luck (the second return was unreachable inside the function) but was confusing.

**Fix:** Cleaned up the function to have a single clean return

### profile/index.tsx Missing delete_account_error Translation
**Problem:** `deleteAccount.onError` called `t('profile.delete_account_error')` but the key didn't exist in translation files.

**Fix:** Added `profile.delete_account_error` to both `en.json` and `ar.json`

### Orphaned Legacy Auth Utility File
**Problem:** `src/lib/auth/utils.tsx` defined `getToken`/`setToken`/`removeToken` using AsyncStorage. Zero consumers remained — all token management uses `expo-secure-store` via `lib/secure-storage.ts`.

**Fix:** File deleted

---

## Files Changed Summary

| Category | Files |
|---|---|
| NEW | `src/lib/hooks/use-app-colors.ts` |
| DELETED | `src/lib/auth/utils.tsx` |
| Theme/Language | `src/lib/hooks/use-selected-theme.tsx`, `src/lib/i18n/utils.tsx`, `src/lib/i18n/index.tsx`, `src/app/_layout.tsx`, `src/theme/tokens.ts` |
| Auth screens | `src/app/(auth)/login.tsx`, `verify-otp.tsx`, `register.tsx`, `reset-password.tsx`, `accept-invitation.tsx` |
| Auth components | `src/components/auth/auth-wall-sheet.tsx`, `auth-input.tsx`, `gold-button.tsx` |
| Store | `src/store/slices/authSlice.ts` |
| API/Services | `src/services/api/client.ts`, `src/services/push/index.ts` |
| Profile | `src/app/(tabs)/profile/index.tsx` |
| Community | `src/app/(tabs)/community/feedback/index.tsx`, `governance/index.tsx`, `governance/polls/[pollId].tsx`, `governance/elections/[id].tsx` |
| Orders | `src/app/(tabs)/orders/[orderId].tsx` |
| Merchant | `src/app/(merchant)/_layout.tsx`, `dashboard.tsx`, `menu/index.tsx`, `menu/[productId].tsx`, `orders/index.tsx`, `orders/[orderId].tsx` |
| Admin | `src/app/(admin)/index.tsx` |
| Checkout/Cart | `src/app/checkout/cart.tsx`, `payment.tsx` |
| Cart conflict | `src/components/cart/cart-conflict-sheet.tsx` |
| i18n | `src/lib/formatCurrency.ts`, `src/translations/en.json`, `src/translations/ar.json` |
| All 49 screens + 10 components | Converted from static `DARK.*` to `useStyles()` + `useAppColors()` |
