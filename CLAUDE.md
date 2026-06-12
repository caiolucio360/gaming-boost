# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlautasBoost is a full-stack platform connecting players with professional boosters for game ranking services. Built with Next.js 15 App Router, TypeScript, Prisma ORM, and AbacatePay for PIX payments.

**User roles:** CLIENT (buys boosts) · BOOSTER (performs boosts, earns commissions) · ADMIN (manages platform, receives revenue) · Dev-Admin (`isDevAdmin: true`, receives a fixed % off-the-top before the regular admin split).

## Commands

```bash
# Development
npm run dev              # Start dev server (Turbopack)
npm run build            # Production build (runs Prisma generate + Next.js build)
npm run lint:fix         # Auto-fix ESLint issues

# Database
npm run db:generate      # Regenerate Prisma Client after schema changes
npm run db:push          # Push schema to database (dev workflow)
npm run db:seed          # Seed initial data
npm run db:studio        # Prisma Studio at http://localhost:5555

# Testing
npm test                 # Run all tests
npm run test:coverage    # Coverage report
```

## Architecture

**Stack:** Next.js 15 App Router · Prisma (PostgreSQL) · NextAuth.js (JWT, 7-day) · AbacatePay (PIX) · Resend (email) · Zod · react-hook-form · Sonner (toasts)

**Layer structure:**
- `src/app/api/` — Thin API route controllers
- `src/services/` — Business logic (`auth`, `order`, `payment`, `steam`, `user`, `verification`)
- `src/schemas/` — Zod schemas (barrel export via `@/schemas`)
- `src/lib/` — Utilities: `db.ts` (Prisma singleton), `auth-middleware.ts`, `pricing.ts`, `abacatepay.ts`, `encryption.ts`, `email.ts`, `rate-limit.ts`, `api-errors.ts`
- `src/components/common/` — Shared UI components (StatCard, PageHeader, EmptyState, etc.)

**Route protection** (`src/middleware.ts`):
- `/admin/*` — ADMIN only
- `/booster/*` — BOOSTER + ADMIN
- `/dashboard/*`, `/cart/*`, `/payment/*` — authenticated users only

**Pricing** is entirely database-driven via `PricingConfig` model. Never add calculation logic to `src/lib/games-config.ts` (metadata only). Use `/api/pricing/calculate` for price calculations.

**Order status flow:** PENDING → PAID → IN_PROGRESS → COMPLETED / CANCELLED

**Commission flow:** On order creation, `DevAdminRevenue` + `AdminRevenue` records are snapshotted. On booster acceptance, `BoosterCommission` is created. On completion, all become PENDING; admin approves to PAID.

## Key Patterns

> Full conventions live in `.claude/rules/code_patterns.md` (API + frontend) and `.claude/rules/design_system.md` (styling, incl. the email/Recharts hex **exceptions**). The summary below is the quick reference.

### API Routes

```typescript
// Always "message", never "error" key in error responses
return Response.json({ message: 'description' }, { status: 400 })

// Auth middleware
import { verifyAuth, verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'
const authResult = await verifyAuth(request)
if (!authResult.authenticated) return createAuthErrorResponseFromResult(authResult)

// Error handling — use createApiErrorResponse for catch blocks
import { createApiErrorResponse, ErrorMessages } from '@/lib/api-errors'
return createApiErrorResponse(error, ErrorMessages.ORDER_CREATE_FAILED, 'POST /api/orders')

// Input validation
import { validateBody, createValidationErrorResponse } from '@/lib/validate'
const validation = validateBody(body, schema)
if (!validation.success) return createValidationErrorResponse(validation.error)
```

### Frontend

```typescript
// API calls: NEVER raw fetch() to /api — use the `api` client (@/lib/api-client). It adds auth,
// parses JSON, throws ApiError on non-2xx, and handles FormData. (Exceptions: SSE/EventSource, external APIs.)
import { api, ApiError } from '@/lib/api-client'
const data = await api.get<{ orders: Order[] }>('/api/orders')   // api.get/post/put/patch/delete
try { await api.put(`/api/admin/users/${id}`, { active: true }) } catch (e) { /* e instanceof ApiError */ }

// Auth redirects: always replace(), never push() — prevents back-navigation to protected pages
router.replace('/login')

// Page-level loading: always useLoading hook, never manual useState(true/false)
const { loading, withLoading } = useLoading({ initialLoading: true })

// Frontend reads data.message from API — never data.error
```

```tsx
// React remounting gotcha: never define sub-components inside another component body
// BAD:  const Foo = () => <div>...</div>  (inside parent component — remounts every render)
// GOOD: const foo = <div>...</div>        (JSX variable, not a component)
```

## Critical Gotchas

- **Prisma Client:** import from `@/lib/db`, not `@/generated/prisma`
- **Money:** AbacatePay amounts are in **centavos** (reais × 100)
- **Commission percentages:** stored as decimals — `0.70` = 70%, not `70`
- **Steam credentials:** must be AES-256-GCM encrypted before storing (`src/lib/encryption.ts`, requires `ENCRYPTION_KEY` env var: 64 hex chars)
- **Order duplication:** index `[userId, gameMode, status]` prevents duplicate PENDING/PAID/IN_PROGRESS orders per game mode — never bypass this
- **User activation:** new users have `active: false` until they verify email via 6-digit code
- **`api-errors.ts` has a transitive Prisma import** — adding `createApiErrorResponse` to routes whose Jest tests already pass will break those tests. Use inline `{ message: '...' }` handlers in those routes instead
- **Webhook idempotency:** `confirmPayment` uses atomic `updateMany` with `status=PENDING` guard — duplicate webhooks are safe no-ops
- **Withdrawal:** both withdraw routes use a provisional-record pattern (DB record created before AbacatePay call) to prevent TOCTOU overdraft
- **Webhook security:** `ABACATEPAY_WEBHOOK_SECRET` missing → 500 (not 200)
- **Cron security:** `CRON_SECRET` enforced in all environments
- **Payment simulate:** `/api/payment/pix/simulate` returns 403 in production
- **`JSON.parse(*.metadata)`:** always wrap in try-catch returning `{}` — the field is free JSON and may be corrupted
- **Stats queries:** dashboard routes (booster/payments, admin/payments, booster/orders) use `Promise.all` for 5 aggregate/count queries
- **`UpdateOrderSchema`:** admin `PUT /api/admin/orders/[id]` validates body with this schema; booster re-approval rejected with 409 if `verificationStatus === 'VERIFIED'`
- **System version:** single source = `package.json` `"version"` (injected via `next.config.js` → `NEXT_PUBLIC_APP_VERSION`, read by `src/lib/version.ts`; don't edit version.ts). **Bump it on every committed change** with `npm version <patch|minor|major> --no-git-tag-version` (semver per Conventional Commit type) — see `.claude/rules/git-flow.md`. Shown in the panel sidebar footer.
- **No raw `fetch` on the client:** use `@/lib/api-client` → `api.get/post/put/patch/delete` — see `.claude/rules/code_patterns.md` rule 6.

## Removed Features (MVP scope — do not re-add)

Dispute system, review system, booster public profiles (`/booster/[id]`), commission history audit trail, contact form, **booster application/onboarding flow** (no `/booster/apply`, no `BoosterProfile` model — admins promote users CLIENT↔BOOSTER directly via buttons on `/admin/users`).

## Design System

**Tailwind v4** — `@config "../../tailwind.config.js"` directive in `globals.css` is mandatory.

Styling is governed by `.claude/rules/design_system.md` (loaded every session). The app supports **light/dark mode** (`next-themes`, `.dark` class on `<html>`, shadcn CSS-variable tokens in `globals.css`): use **theme tokens** for neutral surfaces/text/borders (`bg-background`, `bg-card`, `bg-popover`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, `border-input`) so both themes work; use the **brand-purple** palette for accents. Never hex values, arbitrary Tailwind values, raw `gray-*`, or fixed neutral classes (`bg-brand-black`, `bg-brand-black-light`, `border-white/10`, `text-brand-gray-300/400/500`) — the design-system guard fails the build on these. `text-white` is allowed only for text on a solid colored background. Titles use `font-orbitron`, body/UI uses `font-rajdhani` (no inline `style` fallback). Components: prefer shadcn/ui (`.claude/rules/components.md`).

## Environment Variables

```bash
# Required
DATABASE_URL              # PostgreSQL connection string
NEXTAUTH_SECRET           # NextAuth session secret
JWT_SECRET                # JWT signing secret
ENCRYPTION_KEY            # 64 hex chars for AES-256-GCM
NEXT_PUBLIC_API_URL       # Public API URL

# Required for payments/email
ABACATEPAY_API_KEY
ABACATEPAY_WEBHOOK_SECRET
RESEND_API_KEY
EMAIL_FROM
CRON_SECRET

# Optional
ORDER_TIMEOUT_HOURS       # Auto-refund timeout (default: 24)
LEETIFY_API_KEY           # CS2 stats (optional)
NEXT_PUBLIC_SITE_URL      # SEO (default: gaming-boost.vercel.app)
NEXT_PUBLIC_APP_URL       # Email templates (default: localhost:3000)
```
