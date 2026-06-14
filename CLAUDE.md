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

Full API + frontend conventions live in **`.claude/rules/code_patterns.md`** (loaded every session — follow it directly). It covers: `message` (never `error`) response shape + `code`/`detail` keys, `HttpStatus` constants, `verifyAuth`/`verifyAdmin`, `validateBody` + Zod, `withApiHandler` (and the `api-errors` transitive-Prisma caveat), the mandatory `@/lib/api-client` (`api.get/post/...`, no raw `fetch`), `router.replace()` for redirects, the `useLoading` hook, reading `data.message`, and the no-nested-sub-components rule.

## Skills — invoke proactively

Project skills live in `.claude/skills/`. Only each skill's one-line `description` is indexed in context; the full body loads **only when you invoke it** with the Skill tool. **Don't wait to be told to "use skill X"** — when the task matches a trigger below, invoke the skill **before** starting the work (match on intent, not exact keywords). It's the cheap, expected path; skipping a clearly-matching skill is a miss.

- **`git-flow`** — branching, committing, opening/merging PRs, bumping the version, or any PR conflict.
- **`tdd`** — writing tests, or implementing a feature test-first.
- **`frontend-design`** — building/styling any web UI, page, or component (distinctive, non-generic look).
- **`nextjs-shadcn`** — building Next.js UIs/pages/components with shadcn + Tailwind.
- **`shadcn`** — adding/searching/fixing shadcn components (anything touching `components.json`).
- **`web-design-guidelines`** — reviewing/auditing UI for accessibility, UX, or design compliance.
- **`next-best-practices`** — writing/reviewing App Router code (RSC boundaries, hydration, data, metadata, bundling).
- **`react-best-practices`** — React/Next performance (waterfalls, re-renders, bundle size, Server Components).
- **`cache-components`** — `'use cache'`, PPR, `cacheLife`/`cacheTag`/`revalidateTag`.
- **`nextjs-seo`** — SEO work: metadata, OG images, sitemap/robots, JSON-LD, Core Web Vitals.
- **`api-security`** — designing/reviewing API routes (BOLA, mass assignment, excessive exposure, SSRF).
- **`auth-hardening`** — auth/login, password policy, MFA, session vs JWT, lockout.
- **`nextjs-security`** — Next.js security review (middleware bypass, `NEXT_PUBLIC` leak, CSP, `next/image` SSRF).
- **`file-upload-security`** — any user file-upload endpoint.
- **`secret-hygiene`** — a leaked/committed secret, or credential rotation.
- **`dependency-supply-chain`** — adding a dependency or auditing the supply chain.
- **`postgres-hardening`** — Postgres roles/RLS/pg_hba/TLS/backup review.
- **`codebase-audit`** — auditing unfamiliar code or reviewing AI-generated code before shipping.
- **`chrome-devtools`** — live browser debugging (DOM, console, network, performance profiling).
- **`go`** — quick smoke test of recent UI in a real browser ("make sure it works").
- **`handoff`** — context is full / user says "handoff" / "/clear and continue".
- **`skill-creator`** — creating, modifying, or optimizing a skill.

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
- **System version:** single source = `package.json` `"version"` (injected via `next.config.js` → `NEXT_PUBLIC_APP_VERSION`, read by `src/lib/version.ts`; don't edit version.ts). **Bump it on every committed change** with `npm version <patch|minor|major> --no-git-tag-version` (semver per Conventional Commit type) — see the **`git-flow`** skill. Shown in the panel sidebar footer.
- **No raw `fetch` on the client:** use `@/lib/api-client` → `api.get/post/put/patch/delete` — see `.claude/rules/code_patterns.md` rule 6.

## Removed Features (MVP scope — do not re-add)

Dispute system, review system, booster public profiles (`/booster/[id]`), commission history audit trail, contact form, **booster application/onboarding flow** (no `/booster/apply`, no `BoosterProfile` model — admins promote users CLIENT↔BOOSTER directly via buttons on `/admin/users`).

## Design System

**Tailwind v4** — `@config "../../tailwind.config.js"` directive in `globals.css` is mandatory.

All styling is governed by **`.claude/rules/design_system.md`** (loaded every session — follow it directly): light/dark theme tokens for neutrals, the brand-purple palette for accents, `font-orbitron`/`font-rajdhani`, the build-failing design-system guard (no hex/arbitrary/raw-`gray-*`/fixed-neutral classes), and the email/Recharts hex exceptions. Prefer shadcn/ui components (`.claude/rules/components.md`) and reuse `src/components/common/`.

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
