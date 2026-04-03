# EastPark Frontend — Enhancement Plan

> Created: April 2026  
> Status: App is production-ready. This document tracks non-critical items deferred from the April 2026 audit, known UX improvements, and post-launch feature roadmap.  
> For completed fixes, see `Documentation/FixedBugs.md`.  
> For backend-dependent blockers, see the "Cannot Fix Without Backend Changes" section in `FixedBugs.md`.

---

## Section 1 — Technical Debt

Items surfaced during the April 2026 audit that were confirmed real but not critical enough to block the production release. Address these in the next maintenance pass.

### TD-1: `getSavedShops` URL Inconsistency
**File:** `src/services/api/shops.ts` line 73  
**Issue:** Uses `/users/me/saved-shops`. Every other authenticated user endpoint uses `/user/...` (e.g. `GET /user/profile`, `PUT /user`). This is either a backend inconsistency or a frontend typo.  
**Action:** Verify against backend routes. If the backend serves this at `/user/saved-shops`, update `shopsApi.getSavedShops` accordingly.  
**Risk if wrong:** The "Saved Shops" feature silently returns 404 for all users.

---

### TD-2: `use-auth-rehydration.ts` Bare Catch
**File:** `src/lib/hooks/use-auth-rehydration.ts`  
**Issue:** The `catch {}` block is empty. It cannot distinguish an expired token (401 → correct to clear and show login) from a network timeout (no connection → should retry, not log out). If the backend is unreachable on cold launch, the user appears logged out even though they have valid credentials.  
**Action:** Separate the 401 case from network errors:
```typescript
catch (err: any) {
  if (err?.response?.status === 401) {
    // legitimate expiry — tokens are already cleared by the 401 interceptor
  } else {
    // network error — don't clear tokens, let the user retry
    if (__DEV__) console.warn('[auth-rehydration] network error on startup', err);
  }
}
```

---

### TD-3: `registerPushToken` Silent Catch
**File:** `src/services/push/index.ts` line 26  
**Issue:** `catch {}` silently swallows all push registration errors. On a simulator, emulator, or when `EAS_PROJECT_ID` is wrong, push registration fails invisibly — no dev warning, no user feedback.  
**Action:** Add a dev-mode log:
```typescript
catch (err) {
  if (__DEV__) console.warn('[push] token registration failed', err);
}
```

---

### TD-4: Role Badge in `accept-invitation.tsx` Reads URL Param
**File:** `src/app/(auth)/accept-invitation.tsx` line 101  
**Issue:** The role badge (`MERCHANT` / `ADMIN`) reads from the URL query param `?role=ADMIN`. The actual role is returned by the backend in the `acceptInvitation` API response (`user.role`). If the URL param is missing or tampered with, the badge shows the wrong text (though navigation after success already correctly uses `user.role` from the API response).  
**Action:** Move the role badge inside the `onSubmit` success handler, or store the API-returned role in state after submission. Alternatively, show the badge only after the API call succeeds using `user.role`.

---

### TD-5: TypeScript `any` in Auth Form Props
**Files:** `login.tsx`, `register.tsx`, `reset-password.tsx`, `accept-invitation.tsx` sub-form components  
**Issue:** All sub-form components accept `control: any` and `errors: any`. This defeats TypeScript's ability to catch field name mismatches between the Zod schema and `Controller name` props.  
**Action:** Replace with inferred types:
```typescript
import type { Control, FieldErrors } from 'react-hook-form';

function LoginForm({ control, errors }: {
  control: Control<LoginFormData>;
  errors: FieldErrors<LoginFormData>;
}) { ... }
```

---

### TD-6: `forgot-password.tsx` No Retry Path
**File:** `src/app/(auth)/forgot-password.tsx`  
**Issue:** After submitting an email, the screen switches to a success card with only a "Back to Sign In" button. If the user typed the wrong email, they must navigate away and re-enter the forgot-password flow from scratch.  
**Action:** Add a "Try a different email" ghost button on the success card that resets `sent` state back to `false`.

---

### TD-7: `register.tsx` Generic Server Error Catch
**File:** `src/app/(auth)/register.tsx`  
**Issue:** Only `EMAIL_TAKEN` is handled with a specific message. All other backend errors (invalid phone format, invalid unit number, rate limit exceeded, etc.) show `t('common.error')` — no actionable information.  
**Action:** Map known server error codes to specific translation keys:
```typescript
const errorMap: Record<string, string> = {
  EMAIL_TAKEN: 'auth.errors.email_taken',
  INVALID_PHONE: 'auth.errors.invalid_phone',
  INVALID_UNIT: 'auth.errors.invalid_unit',
};
const key = errorMap[err?.response?.data?.message] ?? 'common.error';
showMessage({ message: t(key), type: 'danger' });
```
Add the corresponding translation keys to `en.json` and `ar.json`.

---

### TD-8: Profile Screen `useStyles()` Called Per Sub-Component
**File:** `src/app/(tabs)/profile/index.tsx`  
**Issue:** `useStyles()` is called independently inside `ProfileScreen`, `GuestProfile`, `AuthenticatedProfile`, `UserAvatar`, `AccountSection`, `DangerSection`, and `ProfileRow` — roughly 7 separate `useMemo` computations per render cycle. This is low-overhead in practice (StyleSheet.create caches results) but is architecturally inconsistent with every other screen.  
**Action:** Either (a) call `useStyles()` once in `ProfileScreen` and pass `styles` + `colors` as props to all sub-components, or (b) create a `ProfileStylesContext` and consume it in each sub-component. Option (a) is simpler.

---

### TD-9: Merchant Order Status Progression Logic
**File:** `src/app/(merchant)/orders/[orderId].tsx`  
**Issue:** `NEXT_STATUS` maps `READY → ON_THE_WAY → DELIVERED`, giving merchants control over delivery/completion steps. Depending on the business model, delivery may be handled by a separate party (logistics) — merchants should only control `PLACED → CONFIRMED → PREPARING → READY`.  
**Action:** Confirm with product owner whether merchants should be able to advance beyond `READY`. If not, cap `NEXT_STATUS` at `READY` and add a note that `ON_THE_WAY`/`DELIVERED` are set by the delivery team or a webhook.

---

## Section 2 — UX Enhancements

Improvements to existing flows that are functional but could be more polished.

### UX-1: OTP Auto-Submit on 6th Digit
**File:** `src/app/(auth)/verify-otp.tsx`  
**Issue:** User fills all 6 OTP digits but must then tap "Confirm" manually. The expected mobile pattern is auto-submit when the last digit is entered.  
**Action:** Pass a callback to `OTPTextInput` that fires `handleVerify()` when `otp.length === 6`:
```typescript
<OTPTextInput
  handleTextChange={(code) => {
    setOtp(code);
    if (code.length === 6) handleVerify(code);
  }}
  ...
/>
```

---

### UX-2: Merchant Dashboard Pending Count Overflow Indicator
**File:** `src/app/(merchant)/dashboard.tsx`  
**Issue:** When there are more than 5 pending orders, the dashboard shows "5 new orders" because the query fetches `limit: 5`. The merchant doesn't know there are more.  
**Action:** Until the backend provides a count endpoint, show "5+" when `data.nextCursor !== null`:
```typescript
const pendingCount = ordersData?.data.data.data.length ?? 0;
const hasMore = !!ordersData?.data.data.nextCursor;
const displayCount = hasMore ? `${pendingCount}+` : `${pendingCount}`;
```

---

### UX-3: Additional Haptics on Auth Screen Interactive Elements
**File:** Multiple auth screens  
**Issue:** `GoldButton` now has haptics (fixed), but secondary interactive elements in auth screens — forgot password link, "don't have an account" link, language toggle in profile, theme segment buttons — still have no haptic feedback. CLAUDE.md requires haptics on every interactive tap.  
**Action:** Add `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` to `onPress` of all `Pressable` elements that perform navigation or state changes across auth and profile screens.

---

### UX-4: Cart Swipe-to-Delete
**File:** `src/app/checkout/cart.tsx`  
**Issue:** Removing an item requires tapping the minus button repeatedly until quantity hits 1, then tapping again (which shows a `Trash` icon). A swipe-to-delete gesture is the standard mobile pattern.  
**Action:** Wrap `CartItemRow` in a swipeable component (e.g. `react-native-gesture-handler` `Swipeable`) with a red delete action on the left swipe that dispatches `updateQuantity({ productId, quantity: 0 })`.

---

### UX-5: Empty States — More Contextual Messages
**Files:** Various list screens  
**Issue:** Several screens use the same generic `<ErrorState />` for both error and empty conditions. Each context deserves a specific illustration/message:
- Orders empty: "No orders yet — browse the directory to get started"
- Feedback empty: "You haven't submitted any feedback yet"
- Notifications empty: "You're all caught up"
- Saved shops empty: "No saved shops — tap the bookmark on any shop to save it"  

**Action:** Add a `variant` prop to the empty state component, or pass `title`/`body`/`icon` directly. Each screen should pass contextual copy via `t('...')` keys.

---

### UX-6: Notification Deep Linking
**File:** `src/services/push/index.ts`, `src/app/notifications/index.tsx`  
**Issue:** Push notifications arrive but tapping them only opens the app — they don't navigate to the relevant screen (the specific order, announcement, or feedback thread that triggered the notification).  
**Action:** Add a `Notifications.addNotificationResponseReceivedListener` in the root layout. Parse the notification `data` payload and call `router.push()` to the correct route:
```typescript
Notifications.addNotificationResponseReceivedListener(response => {
  const { type, referenceId } = response.notification.request.content.data;
  if (type === 'ORDER_UPDATE') router.push(`/(tabs)/orders/${referenceId}`);
  if (type === 'ANNOUNCEMENT') router.push(`/(tabs)/community/${referenceId}`);
  // etc.
});
```

---

### UX-7: Merchant Product Image — Upload vs URL
**File:** `src/app/(merchant)/menu/[productId].tsx`  
**Issue:** Merchants enter a raw image URL in a text field. This requires the merchant to host images externally, which is impractical for most users.  
**Action (post-launch):** Replace the URL field with an image picker (`expo-image-picker`) that uploads to Supabase Storage via the backend (`POST /merchant/products/:id/image`) and receives a CDN URL back.

---

### UX-8: Merchant Shop Profile Editor
**File:** `src/app/(merchant)/` (missing screen)  
**Issue:** The quick-action "Shop profile" card was removed from the merchant dashboard because `/(merchant)/shop-profile` doesn't exist. Merchants currently cannot edit their shop's name, hours, or photos from the app.  
**Action:** Create `src/app/(merchant)/shop-profile.tsx` with fields for shop name, nameAr, description, phone, WhatsApp, and working hours. Wire to `PATCH /merchant/shop` backend endpoint (verify endpoint exists in backend).

---

### UX-9: Order Reorder (One-Tap)
**File:** `src/app/(tabs)/orders/[orderId].tsx`  
**Issue:** Users who want to repeat a previous order must navigate back to the shop, find the same products, and add them to cart individually.  
**Action (post-launch):** Add a "Reorder" button on the order detail screen that iterates `order.items`, checks each product is still available, and dispatches `addToCart` for each. Show a warning if any item is unavailable or from a different shop than the current cart.

---

## Section 3 — Post-Launch Feature Roadmap

Features outside the current scope. Do not implement until after the initial production launch is stable.

| # | Feature | Description | Priority |
|---|---|---|---|
| F-1 | **Biometric login** | Face ID / fingerprint for returning users via `expo-local-authentication` | High |
| F-2 | **Multiple delivery addresses** | Save and switch between multiple addresses at checkout | Medium |
| F-3 | **Saved shop notifications** | Opt-in push when a saved shop adds new products or has a promotion | Medium |
| F-4 | **Order history search + filter** | Filter orders by shop, status, date range | Medium |
| F-5 | **Community feedback voting** | Upvote/downvote feedback items — helps admin prioritize | Medium |
| F-6 | **Merchant analytics dashboard** | Sales by product, peak order times, revenue over time | Low |
| F-7 | **Admin bulk invitation** | Send invitations to multiple merchant emails at once via CSV | Low |
| F-8 | **Announcement comments** | Resident comments on announcements (reply thread) | Low |
| F-9 | **Light/dark mode schedule** | Auto-switch based on sunrise/sunset (respecting `prefers-reduced-motion`) | Low |
| F-10 | **Merchant menu categories** | Group products under custom categories within a shop menu | Low |

---

## Section 4 — Backend Requests

Frontend changes blocked until these backend endpoints or behaviors are added.

| # | What FE needs | Current backend state | Effort |
|---|---|---|---|
| B-1 | `DELETE /user` for self-delete | Admin-only `DELETE /admin/user/:id` exists. Frontend already calls `DELETE /user`. | Add resident-accessible self-delete route |
| B-2 | Order count endpoint | No count endpoint. Dashboard fetches `limit: 5` and guesses. | Add `GET /merchant/orders/count?status=PLACED` or include `totalCount` in list response |
| B-3 | Notification `data` payload for deep linking | Push payloads need `{ type, referenceId }` fields | Add structured data to all `sendPushNotification()` calls in backend |
| B-4 | `PATCH /merchant/shop` — shop profile edit | Verify this endpoint exists and accepts name/hours/photos | Required before UX-8 (shop profile screen) |
| B-5 | Single product fetch | No `GET /merchant/products/:id`. Edit screen fetches all 100 and filters client-side. | Add single-product endpoint for efficiency |

---

## How to Use This Document

- **Start a fix session:** Pick items from Section 1 (Technical Debt) in order. Each has a clear file, issue, and action.
- **Start a polish session:** Pick items from Section 2 (UX Enhancements) by priority.
- **Planning a sprint:** Use Sections 3 + 4 together — confirm backend availability before scheduling frontend F-items.
- **After fixing an item:** Move it to `FixedBugs.md` with the commit hash and remove it from this file.
- **After backend delivers an endpoint:** Move the B-item here from Section 4 and create the corresponding frontend work item.
