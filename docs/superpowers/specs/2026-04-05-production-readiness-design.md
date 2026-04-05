# Production Readiness Design

**Date:** 2026-04-05  
**Goal:** Reach production quality across security hardening, service unit tests, API integration tests, and frontend component/smoke tests — implemented as 4 parallel streams.

---

## Architecture

4 independent streams that can be executed in parallel (Streams 2 and 4 are fully independent; Stream 3 depends on Stream 1 completing first so routes are clean before being tested).

```
Stream 1 (Security)   → Stream 3 (API tests)
Stream 2 (Service tests) ─ parallel ─┘
Stream 4 (Frontend tests) ─ parallel ─┘
```

---

## Stream 1: Security Fixes

**3 files, targeted changes only.**

### 1A — Env validation (`src/lib/env.ts`)

Add `ABACATEPAY_WEBHOOK_SECRET` and `CRON_SECRET` to the startup validation block. Currently missing — a misconfigured deploy fails silently at runtime instead of at boot.

### 1B — Rate limiting gaps

Two admin/chat mutation routes have no rate limiting:

| Route | Limiter | Limit |
|-------|---------|-------|
| `POST /api/admin/orders/[id]` | `apiRateLimiter` | 20 req/min |
| `POST /api/orders/[id]/chat` | `apiRateLimiter` | 30 req/min |

Use existing `apiRateLimiter`, `getIdentifier`, `createRateLimitHeaders` from `@/lib/rate-limit`. Same pattern as other rate-limited routes.

### 1C — Bare try/catch normalization

5 routes catch errors and return custom JSON instead of the standard `createApiErrorResponse`. Replace:

- `src/app/api/admin/stats/route.ts`
- `src/app/api/admin/pricing/route.ts`
- `src/app/api/booster/profile/route.ts`
- `src/app/api/user/profile/route.ts`
- `src/app/api/notifications/route.ts`

Each catch block becomes: `return createApiErrorResponse(error, ErrorMessages.GENERIC_ERROR, 'METHOD /api/path')`

---

## Stream 2: Service Unit Tests

**~40 tests. All use `jest.mock('@/lib/db')`. Files in `src/__tests__/services/`.**

### `auth.service.test.ts`
- login: correct credentials → session token returned
- login: wrong password → failure result
- login: inactive account → failure with activation message
- login: user not found → failure
- register: success → user created, verification email sent
- register: duplicate email → failure
- password reset: token generated and stored
- password reset: expired token → failure
- password reset: valid token → password updated, token invalidated

### `order.service.test.ts`
- createOrder: success → order created with correct amounts
- createOrder: duplicate PENDING order in same gameMode → BusinessError DUPLICATE_ORDER
- createOrder: discount > 0 → `discountApplied: true`, `discountPct` stored
- createOrder: discount = 0 → `discountApplied: false`
- completeOrder: streak incremented, `streakLastOrderAt` updated
- completeOrder: milestone reached → STREAK_UNLOCK notification created
- completeOrder: no milestone → no STREAK_UNLOCK notification

### `payment.service.test.ts`
- confirmPayment: first call → payment status PAID, order status PAID, notification created
- confirmPayment: duplicate call (already PAID) → `updateMany count === 0` → no-op, no duplicate notification
- refundPixPayment: success → payment REFUNDED, order CANCELLED, email sent
- refundPixPayment: payment not found → failure

### `verification.service.test.ts`
- valid code within expiry → user activated
- expired code → failure
- wrong code → failure
- resend: generates new code, invalidates previous
- resend: too many resends → rate limited

---

## Stream 3: API Integration Tests

**~70 tests. All use `jest.mock('@/lib/db')` + `jest.mock('@/lib/auth-middleware')`. Files in `src/__tests__/api/`.**

### Auth (`__tests__/api/auth/`) — ~16 tests
- POST `/api/auth/login` — success, wrong password, inactive account, validation error
- POST `/api/auth/register` — success, duplicate email, validation error, rate limited
- POST `/api/auth/verify` — valid code activates, expired code rejected
- POST `/api/auth/resend-code` — sends new code
- POST `/api/auth/forgot-password` — email sent, unknown email still 200 (no enumeration)
- POST `/api/auth/reset-password` — valid token → password updated, invalid token → 400
- GET `/api/auth/me` — authenticated → user data, unauthenticated → 401

### Orders (`__tests__/api/orders/`) — ~12 tests
- GET `/api/orders` — returns user's orders filtered by status
- POST `/api/orders` — success, duplicate active order → 409, validation error → 400
- GET `/api/orders/[id]` — own order → 200, other user's order → 403, not found → 404
- POST `/api/orders/[id]/cancel` — PENDING → cancelled 200, PAID → refund + cancelled, IN_PROGRESS → 400 blocked
- PUT `/api/orders/[id]/steam-credentials` — encrypts and stores credentials

### Payment (`__tests__/api/payment/`) — ~6 tests
- POST `/api/payment/pix` — creates QR code, returns brCode + qrCode
- GET `/api/payment/pix/status` — returns current payment status
- POST `/api/payment/pix/simulate` — works in test env, returns 403 in production

### Webhook (`__tests__/api/webhooks/`) — ~5 tests
- POST `/api/webhooks/abacatepay` — valid signature + billing.paid → order updated to PAID
- POST `/api/webhooks/abacatepay` — invalid signature → 401
- POST `/api/webhooks/abacatepay` — missing `ABACATEPAY_WEBHOOK_SECRET` → 500
- POST `/api/webhooks/abacatepay` — duplicate billing.paid webhook → idempotent 200, no duplicate notification

### Admin (`__tests__/api/admin/`) — ~18 tests
- Non-admin requests → 401 on all admin routes
- GET `/api/admin/orders` — returns all orders with pagination
- PUT `/api/admin/orders/[id]` — valid transition succeeds, invalid transition → 400
- GET `/api/admin/users` — returns users list
- PATCH `/api/admin/users/[id]` — updates role/commission
- GET `/api/admin/boosters` — returns booster applications
- PATCH `/api/admin/boosters/[id]` — approve/reject
- GET `/api/admin/stats` — returns revenue + order stats
- GET/POST/PATCH/DELETE `/api/admin/pricing` — CRUD on pricing tiers
- GET/PATCH `/api/admin/commission-config` — read and update global config
- POST `/api/admin/withdraw` — creates withdrawal with provisional-record pattern

### Booster (`__tests__/api/booster/`) — ~8 tests
- Non-booster → 401 on all booster routes
- GET `/api/booster/orders` — returns assigned orders
- PATCH `/api/booster/orders/[id]` — accept order, complete with proof URL required
- GET `/api/booster/payments` — returns commissions
- POST `/api/booster/apply` — submits application, rate limited
- GET/PATCH `/api/booster/profile` — read and update profile
- POST `/api/booster/withdraw` — provisional-record pattern, insufficient balance → 400

### Crons (`__tests__/api/cron/`) — ~5 tests
- POST `/api/cron/auto-refund` — no auth → 401, valid auth → refunds PAID timed-out orders
- POST `/api/cron/reactivation` — sends email to eligible users, skips if discount active, skips if at max rating

---

## Stream 4: Frontend Tests

**~26 tests. React Testing Library + mocked auth context + mocked fetch. Files in `src/__tests__/components/` and `src/__tests__/app/`.**

### `RetentionProgress` (`__tests__/components/retention-progress.test.tsx`) — ~6 tests
- Renders progress bar with correct percentage
- Shows "MAX" badge when user is at highest milestone
- Renders order timeline dots (last 4 orders)
- Handles empty orders array gracefully (no crash)
- Shows correct discount label for streak level
- Does not render when no completed orders

### PIX Payment component (`__tests__/components/pix-payment.test.tsx`) — ~5 tests
- Renders QR code image when brCodeBase64 provided
- Copy button copies brCode to clipboard
- Shows expiry countdown timer
- Shows "Aguardando pagamento" polling state
- Shows success state when payment confirmed

### Auth forms (`__tests__/components/auth-forms.test.tsx`) — ~8 tests
- Login form: shows validation error on empty submit
- Login form: submit calls API with credentials
- Login form: shows error toast on wrong password
- Login form: disables button while loading
- Register form: shows validation errors for weak password
- Register form: shows validation error for duplicate email
- Register form: submit calls API with all fields
- Register form: shows success state after registration

### Page smoke tests (`__tests__/app/`) — ~7 tests
- `/dashboard` — renders without crashing when authenticated
- `/dashboard` — shows skeleton during loading
- `/dashboard` — redirects to `/login` when unauthenticated
- `/admin` — renders without crashing as ADMIN
- `/admin` — redirects non-admin to `/dashboard`
- `/booster` — renders without crashing as BOOSTER
- `/booster` — redirects CLIENT to `/dashboard`

---

## Files Modified / Created

### Stream 1 (edits)
| File | Change |
|------|--------|
| `src/lib/env.ts` | Add `ABACATEPAY_WEBHOOK_SECRET`, `CRON_SECRET` to validation |
| `src/app/api/admin/orders/[id]/route.ts` | Add rate limiting to POST handler |
| `src/app/api/orders/[id]/chat/route.ts` | Add rate limiting to POST handler |
| `src/app/api/admin/stats/route.ts` | Normalize catch block |
| `src/app/api/admin/pricing/route.ts` | Normalize catch block |
| `src/app/api/booster/profile/route.ts` | Normalize catch block |
| `src/app/api/user/profile/route.ts` | Normalize catch block |
| `src/app/api/notifications/route.ts` | Normalize catch block |

### Streams 2–4 (new test files)
| File | Tests |
|------|-------|
| `src/__tests__/services/auth.service.test.ts` | ~9 |
| `src/__tests__/services/order.service.test.ts` | ~7 |
| `src/__tests__/services/payment.service.test.ts` | ~4 |
| `src/__tests__/services/verification.service.test.ts` | ~5 |
| `src/__tests__/api/auth/*.test.ts` | ~16 |
| `src/__tests__/api/orders/*.test.ts` | ~12 |
| `src/__tests__/api/payment/*.test.ts` | ~6 |
| `src/__tests__/api/webhooks/*.test.ts` | ~5 |
| `src/__tests__/api/admin/*.test.ts` | ~18 |
| `src/__tests__/api/booster/*.test.ts` | ~8 |
| `src/__tests__/api/cron/*.test.ts` | ~5 |
| `src/__tests__/components/retention-progress.test.tsx` | ~6 |
| `src/__tests__/components/pix-payment.test.tsx` | ~5 |
| `src/__tests__/components/auth-forms.test.tsx` | ~8 |
| `src/__tests__/app/dashboard.test.tsx` | ~3 |
| `src/__tests__/app/admin.test.tsx` | ~2 |
| `src/__tests__/app/booster.test.tsx` | ~2 |

**Total: ~136 new tests + 8 security edits**

---

## Verification

- `npm run build` — no TypeScript errors after Stream 1
- `npm test` — all ~136 new tests pass
- Manual: env validation throws on startup if `ABACATEPAY_WEBHOOK_SECRET` missing
- Manual: POST to admin/orders/[id] more than 20x/min → 429
- Manual: duplicate webhook → no duplicate notification in DB
