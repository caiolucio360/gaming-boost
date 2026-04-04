# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GameBoost is a full-stack platform connecting players who need game boosting services with professional boosters. Built with Next.js 15 App Router, TypeScript, Prisma ORM, and AbacatePay for PIX payments.

**Key Roles:**
- **CLIENT** - Users who purchase boost services
- **BOOSTER** - Users who perform boost services and earn commissions
- **ADMIN** - Platform administrators who manage the system and receive revenue
- **Dev-Admin** - Special admin (`isDevAdmin: true`) who receives a fixed percentage off-the-top before the regular admin profit split

## Development Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Production build (runs Prisma generate + Next.js build)
npm start                # Start production server

# Database (Prisma)
npm run db:generate      # Generate Prisma Client (run after schema changes)
npm run db:push          # Push schema changes to database (dev workflow)
npm run db:studio        # Open Prisma Studio GUI at http://localhost:5555
npm run db:seed          # Seed database with initial data (uses tsx)

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

## Architecture

### Authentication & Authorization

**NextAuth.js with JWT Strategy:**
- Credentials provider using email/password with bcrypt hashing
- Session stored as JWT (7-day expiration)
- `src/lib/auth-config.ts` - NextAuth configuration
- `src/lib/jwt.ts` - JWT utilities with issuer/audience validation
- `src/lib/auth-middleware.ts` - API route authentication middleware
- `src/middleware.ts` - Route protection and RBAC enforcement

**Middleware Route Protection:**
- `/admin/*` - ADMIN only
- `/booster/*` - BOOSTER and ADMIN (except `/booster/apply` which CLIENTs can access)
- `/dashboard/*`, `/cart/*`, `/payment/*` - Authenticated users only

**Custom JWT system** (separate from NextAuth) exists in `src/lib/jwt.ts` for API authentication.

**Email Verification Flow:**
- Users register with `active: false` status
- Registration triggers a 6-digit verification code email
- Code stored in `VerificationCode` model with expiration
- `/api/auth/verify` POST validates the code and activates the account
- `/api/auth/resend-code` POST allows resending the code
- `src/services/verification.service.ts` contains the business logic

### Database Schema (Prisma)

**Critical Models:**
- `User` - All user types (role: CLIENT, BOOSTER, ADMIN)
  - `active` - Boolean, requires email verification to activate
  - `boosterCommissionPercentage` - Custom commission rate per booster (overrides global)
  - `adminProfitShare` - Percentage of profit split for admins
  - `isDevAdmin` - Boolean, dev-admin receives percentage before the regular split
  - `pixKey` - PIX key for payments (BOOSTER/ADMIN)
  - `phone`, `taxId` - Contact and CPF/CNPJ for payments
  - `steamProfileUrl`, `steamId` - Steam integration data
  - `image` - Avatar URL
  - `metadata` - JSON field for additional metadata

- `Order` - Boost service orders
  - Stores both `current` and `target` rank/rating (string and numeric)
  - `steamCredentials` - Encrypted Steam credentials (AES-256-GCM)
  - `gameMode`, `gameType` - Game mode info (e.g., "PREMIER", "CS2_PREMIER")
  - Status flow: PENDING → PAID → IN_PROGRESS → COMPLETED/CANCELLED

- `Payment` - PIX payment tracking
  - Links to Order
  - Stores `providerId` (AbacatePay ID), `pixCode`, `qrCode`

- `BoosterCommission` - Booster earnings per order
- `AdminRevenue` - Admin earnings per order (supports multiple admins per order)
- `DevAdminRevenue` - Dev-admin earnings per order (unique per order)
- `CommissionConfig` - Global commission percentages (includes `devAdminPercentage`)
- `Withdrawal` - PIX withdrawal requests from boosters/admins
- `PricingConfig` - Dynamic pricing tiers per game mode (admin-configurable)
  - Stores price ranges (e.g., Premier 0-5K = R$25/1000 pts)
  - Progressive pricing tiers
  - Managed via `/admin/pricing` panel

- `VerificationCode` - Email verification codes
  - 6-digit code with expiration
  - Linked to User

- `BoosterProfile` - Extended booster information (bio, CS2 stats, verification status)
- `Notification` - User notifications (types: ORDER_UPDATE, PAYMENT, SYSTEM, CHAT, BOOSTER_ASSIGNED, COMMISSION)

- `Service` - Available boost services (e.g., "CS2 Premier Rank Boost")
  - Links to Game and ServiceType
  - **IMPORTANT**: Services are NOT managed via admin UI for MVP simplicity
  - Managed via database seeding: `npm run db:seed`
  - To add/modify services: Update `prisma/seed.ts` and re-run seeding

**Important Indexes:**
- Orders indexed by `[userId, gameMode, status]` to prevent duplicate active orders in same game mode
- Orders also indexed by `[userId, status]`, `[boosterId, status]`, `[status]`
- Commissions/revenues indexed by `[userId, status]` for dashboard queries

**Order Duplication Prevention:**
- Backend validation: API prevents duplicate PENDING/PAID/IN_PROGRESS orders in same game mode (see `/api/orders/route.ts`)
- Frontend warning: CS2 calculator displays prominent warning when user has active order in selected mode
- UX flow: Warning banner + disabled "CONTRATAR AGORA" button + link to dashboard
- Real-time check: Calculator fetches user's orders on mount and mode change via `/api/orders` GET endpoint

**Prisma Client Location:**
- Generated at `src/generated/prisma` (custom output path)
- Import via `@/lib/db` which exports configured PrismaClient singleton

### Service Layer

Business logic is separated into service files under `src/services/`:

| Service | Purpose |
|---------|---------|
| `auth.service.ts` | Authentication business logic (login, register) |
| `order.service.ts` | Order creation, status updates, validation |
| `payment.service.ts` | Payment processing, refunds |
| `steam.service.ts` | Steam profile integration and validation |
| `user.service.ts` | User management, profile updates |
| `verification.service.ts` | Email verification code generation/validation |
| `types.ts` | Service layer type definitions |

Import services via `@/services` (barrel export in `index.ts`).

### Validation Schemas (Zod)

Centralized Zod schemas in `src/schemas/`:

| Schema | Purpose |
|--------|---------|
| `auth.ts` | Login, register, password reset validation |
| `order.ts` | Order creation and update validation |
| `payment.ts` | Payment request validation |
| `steam.ts` | Steam profile URL and credentials validation |
| `common.ts` | Shared schemas (pagination, IDs, etc.) |

Import via `@/schemas` (barrel export in `index.ts`).

**Validation in API Routes:**
```typescript
import { validateBody, createValidationErrorResponse } from '@/lib/validate'
import { orderSchema } from '@/schemas'

const validation = validateBody(body, orderSchema)
if (!validation.success) {
  return createValidationErrorResponse(validation.error)
}
```

### Game Configuration System

**IMPORTANT:** Game configuration and pricing are now separated:
- `src/lib/games-config.ts` - Game metadata ONLY (no pricing logic)
- `PricingConfig` database model - All pricing data (dynamic, admin-configurable)

**CS2 Game Modes:**
1. **Premier** - Rating-based (1K-26K points)
2. **Gamers Club** - Level-based (1-20)

**Pricing System (Database-Driven):**
- All pricing stored in `PricingConfig` table
- Configured via `/admin/pricing` admin panel
- Price calculation via `/api/pricing/calculate` endpoint
- `src/lib/pricing.ts` contains calculation logic with safety guards (MAX_ITERATIONS: 1000, gap detection)
- Progressive pricing by tier (prices increase at higher ratings/levels)
- Default values seeded via `npm run db:seed`

**Why Database-Driven Pricing:**
- Admins can change prices without code deployments
- Historical pricing preserved (can track changes over time)
- No need to redeploy when adjusting market rates
- Single source of truth (no dual config)

### Payment Integration (AbacatePay)

`src/lib/abacatepay.ts` wraps AbacatePay API:

**PIX Payment Flow:**
1. Create PIX QR Code via `createPixQrCode()` - returns `brCode` (copy-paste) and `brCodeBase64` (QR image)
2. Store payment with `providerId` in database
3. AbacatePay webhook (`/api/webhooks/abacatepay/route.ts`) receives payment confirmation
4. Update order status to PAID and create commission/revenue records

**PIX Withdrawal Flow:**
1. Booster/Admin requests withdrawal via `createWithdrawal()`
2. Minimum R$3.50 (350 centavos)
3. Supports multiple PIX key types: CPF, CNPJ, EMAIL, PHONE, RANDOM, BR_CODE
4. Endpoints: `/api/booster/withdraw` and `/api/admin/withdraw`

**Auto-Refund System:**
- Orders in PAID status without booster assignment are auto-refunded after configured timeout
- Timeout configured via `ORDER_TIMEOUT_HOURS` environment variable (default: 24 hours)
- Cron job runs daily at 6 AM UTC: `/api/cron/auto-refund/route.ts`
- Vercel Cron configured in `vercel.json` with schedule `0 6 * * *`
- Secured with `CRON_SECRET` bearer token
- Automatic email notification sent to customer on refund
- Order status changes: PAID → CANCELLED
- Payment status changes: PAID → REFUNDED
- Uses `refundPixPayment()` from AbacatePay wrapper

**Client-Initiated Cancellation & Refund:**
- Clients can cancel orders via `/api/orders/[id]/cancel` (POST)
- Only PENDING and PAID orders can be cancelled
- IN_PROGRESS and COMPLETED orders cannot be cancelled (contact support)
- PAID orders automatically trigger refund processing
- Refund processed synchronously - if it fails, cancellation is blocked
- Order ownership verified before allowing cancellation
- Email notification sent to client on successful cancellation
- UI available in client dashboard with dynamic messaging
- Rate limited: 5 cancellation attempts per minute per IP

**Important:**
- All amounts in AbacatePay are in **centavos** (cents), not reais
- PIX codes expire (default 30 minutes)
- Dev mode allows `simulatePixPayment()` for testing (via `/api/payment/pix/simulate`)

### Encryption & Security

**Steam Credentials Encryption** (`src/lib/encryption.ts`):
- AES-256-GCM encryption for sensitive data
- Requires `ENCRYPTION_KEY` env var (64 hex chars = 256 bits)
- Format: IV + AuthTag + Ciphertext (base64 encoded)

**Rate Limiting** (`src/lib/rate-limit.ts`):
- In-memory rate limiting to prevent abuse and DDoS attacks
- Can be upgraded to Redis-based for multi-instance deployments
- Returns standard rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**Rate Limit Configurations:**
1. **Authentication Endpoints** (`authRateLimiter`):
   - Window: 15 minutes
   - Login: 5 attempts per window
   - Register: 3 attempts per window
   - Forgot Password: 3 attempts per window
   - Reset Password: 5 attempts per window

2. **Payment Endpoints** (`paymentRateLimiter`):
   - Window: 1 minute
   - PIX Generation: 5 attempts per window (very strict)

3. **Order Creation** (`apiRateLimiter`):
   - Window: 1 minute
   - Create Order: 10 attempts per window

4. **Webhooks** (`webhookRateLimiter`):
   - Window: 1 minute
   - Webhook Calls: 100 attempts per window (lenient for legitimate services)

**Rate Limit Response:**
```json
{
  "message": "Muitas tentativas. Aguarde um momento.",
  "error": "RATE_LIMIT_EXCEEDED"
}
```
HTTP Status: 429 (Too Many Requests)

**Brazilian Document Validation** (`src/lib/brazilian.ts`):
- CPF/CNPJ validation and formatting
- Phone number validation and masking
- Tax ID validation for payment eligibility

**Environment Validation** (`src/lib/env.ts`):
- Validates required env vars on startup
- Throws errors if critical vars missing or malformed

**Required Environment Variables:**
```
# Critical (required)
DATABASE_URL              # PostgreSQL connection string
NEXTAUTH_SECRET           # NextAuth session secret
NEXT_PUBLIC_API_URL       # Public API URL
JWT_SECRET                # JWT signing secret
ENCRYPTION_KEY            # 64 hex chars for AES-256

# Optional but recommended
ABACATEPAY_API_KEY        # AbacatePay API key (required for payments)
RESEND_API_KEY            # Resend email service (required for emails)
EMAIL_FROM                # Sender email address
ORDER_TIMEOUT_HOURS       # Auto-refund timeout in hours (default: 24)
CRON_SECRET               # Secret for securing cron endpoints
LEETIFY_API_KEY           # Leetify API for CS2 stats (optional)
NEXT_PUBLIC_SITE_URL      # Public site URL for SEO (default: gaming-boost.vercel.app)
NEXT_PUBLIC_APP_URL       # App URL for email templates (default: localhost:3000)
```

### Commission System

**How Commissions Work:**
1. When order is created → `DevAdminRevenue` record created (if dev-admin exists) with dev-admin's percentage off-the-top
2. When order is created → `AdminRevenue` records created for each regular admin with their profit share of the remaining admin portion
3. When booster accepts order → `BoosterCommission` record created with booster's percentage
4. Percentages are snapshotted at creation time (from `CommissionConfig` or user overrides)
5. When order completes → commissions marked as PENDING
6. Admin approves payouts → commissions marked as PAID

**Dev-Admin Commission:**
- Dev-admin (`isDevAdmin: true`) receives a fixed percentage before the regular profit split
- Configured via `CommissionConfig.devAdminPercentage` (e.g., 0.10 = 10%)
- Example: If booster gets 60%, dev gets 10%, remaining 30% is split among regular admins by `adminProfitShare`
- Tracked in `DevAdminRevenue` model (unique per order)

**Custom Commission Rates:**
- Global defaults in `CommissionConfig` table
- Per-booster override via `User.boosterCommissionPercentage`

### Email System

**Email utility** (`src/lib/email.ts`) uses Resend API:
- HTML email templates with brand colors and responsive design
- Text fallback generated by stripping HTML tags
- Falls back to console logging in development if `RESEND_API_KEY` not configured

**Available email templates:**
- `sendWelcomeEmail` - Welcome + verification code
- `sendPasswordResetEmail` - Password reset link
- `sendPaymentConfirmationEmail` - Payment received confirmation
- `sendOrderAcceptedEmail` - Order accepted by booster
- `sendOrderCompletedEmail` - Order completed notification
- `sendNewOrderAvailableEmail` - New order available for boosters
- `sendOrderCancelledEmail` - Order cancelled / refund notification

### Client-Side API Pattern

**Typed API Client** (`src/lib/api.ts`):
- Result<T> pattern (Success/Failure union types) instead of throwing errors
- Type guards: `isSuccess<T>()`, `isFailure<T>()`
- Auto token management and 401 redirect handling
- Pre-typed endpoints object for common operations

**Toast Notifications** (`src/lib/toast.ts`):
- Wrapper around Sonner library
- Functions: `showSuccess`, `showError`, `showInfo`, `showWarning`, `showLoading`, `handleApiError`, `handleApiResponse`

**Cart Utilities** (`src/lib/cart-utils.ts`):
- `handleServiceHire` - Service hire flow with duplicate order prevention
- `createOrder` - Order creation logic

**SEO Utilities** (`src/lib/seo.ts`):
- `generateMetadata` - Returns Next.js Metadata object for pages

## Code Organization

```
src/
├── app/
│   ├── (auth)/              # Auth route group (login, register, forgot-password, reset-password, verify)
│   ├── (dashboard)/         # Dashboard route group (notifications)
│   ├── admin/               # Admin panel pages
│   ├── booster/             # Booster dashboard pages
│   ├── api/                 # API routes
│   │   ├── auth/            # Authentication (login, register, verify, resend-code, forgot-password, reset-password, logout, me, [...nextauth])
│   │   ├── orders/          # Order management ([id], [id]/cancel, [id]/steam-credentials)
│   │   ├── payment/         # Payment endpoints (pix, pix/simulate, pix/status)
│   │   ├── pricing/         # Pricing calculation (calculate)
│   │   ├── webhooks/        # External webhooks (abacatepay, abacatepay/debug)
│   │   ├── admin/           # Admin-only (orders, orders/[id], payments, payments/confirm, users, users/[id], boosters, boosters/[id], stats, pricing, pricing/[id], commission-config, withdraw)
│   │   ├── booster/         # Booster-only (orders, orders/[id], payments, apply, profile, withdraw)
│   │   ├── user/            # User endpoints (profile, bank-account, delete)
│   │   ├── realtime/        # Real-time polling endpoint
│   │   ├── notifications/   # Notification management
│   │   └── cron/            # Scheduled tasks (auto-refund)
│   └── ...                  # Public pages
├── components/
│   ├── ui/                  # Base components (shadcn/ui)
│   ├── common/              # Shared components
│   ├── layout/              # Layout components (header, footer, hero, sections, mobile-bottom-nav)
│   ├── providers/           # Context providers (auth, toast, analytics, cart-auth-integration)
│   └── ...                  # Feature-specific components (games/, etc.)
├── contexts/
│   ├── auth-context.tsx     # Authentication state
│   └── cart-context.tsx     # Shopping cart state
├── hooks/
│   ├── use-loading.ts       # Loading state management
│   ├── use-realtime.ts      # Real-time updates (polling)
│   ├── use-orders.ts        # Order data fetching
│   ├── use-user.ts          # User data fetching
│   ├── use-payment.ts       # Payment state management
│   └── index.ts             # Barrel export
├── lib/
│   ├── db.ts                # Prisma client singleton
│   ├── auth-config.ts       # NextAuth configuration
│   ├── auth-middleware.ts    # API route auth middleware
│   ├── jwt.ts               # JWT utilities
│   ├── encryption.ts        # AES-256-GCM encryption
│   ├── abacatepay.ts        # AbacatePay API wrapper
│   ├── games-config.ts      # Game modes metadata (NO pricing logic)
│   ├── pricing.ts           # Price calculation logic
│   ├── env.ts               # Environment validation
│   ├── api-errors.ts        # API error response utilities
│   ├── api.ts               # Typed API client (Result<T> pattern)
│   ├── api-client.ts        # API client utilities
│   ├── validate.ts          # Zod validation utilities (validateBody, createValidationErrorResponse)
│   ├── brazilian.ts         # Brazilian document/phone validation (CPF, CNPJ)
│   ├── cart-utils.ts        # Shopping cart utilities
│   ├── seo.ts               # SEO metadata generation
│   ├── toast.ts             # Toast notification utilities (Sonner wrapper)
│   ├── email.ts             # Email sending via Resend API
│   ├── rate-limit.ts        # In-memory rate limiting
│   └── utils.ts             # General utilities (cn, etc.)
├── schemas/                 # Zod validation schemas
│   ├── auth.ts              # Auth validation schemas
│   ├── order.ts             # Order validation schemas
│   ├── payment.ts           # Payment validation schemas
│   ├── steam.ts             # Steam profile validation schemas
│   ├── common.ts            # Shared schemas
│   └── index.ts             # Barrel export
├── services/                # Business logic layer
│   ├── auth.service.ts      # Authentication logic
│   ├── order.service.ts     # Order management logic
│   ├── payment.service.ts   # Payment processing logic
│   ├── steam.service.ts     # Steam integration logic
│   ├── user.service.ts      # User management logic
│   ├── verification.service.ts # Email verification logic
│   ├── types.ts             # Service type definitions
│   └── index.ts             # Barrel export
├── types/
│   ├── index.ts             # Shared TypeScript types
│   └── next-auth.d.ts       # NextAuth type extensions
└── __tests__/               # Jest tests
    ├── api/                 # API route tests (auth/, admin/, booster/, orders/, user/, webhooks/)
    ├── lib/                 # Library utility tests
    ├── schemas/             # Validation schema tests
    ├── services/            # Service layer tests
    ├── app/                 # Page/app tests (robots, sitemap)
    ├── security-controls.test.ts  # Security testing
    └── utils/               # Test utilities (ignored by test runner)

prisma/
├── schema.prisma            # Database schema
├── migrations/              # Migration history
└── seed.ts                  # Database seeding script
```

## Important Patterns

### API Route Structure

**Standard Response Pattern:**
```typescript
return Response.json({ data: ... }, { status: 200 })
return Response.json({ message: 'error description' }, { status: 400 })  // always "message", never "error"
```

**Authentication in API Routes:**
```typescript
import { verifyAuth, verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'

// For user-facing routes:
const authResult = await verifyAuth(request)
if (!authResult.authenticated) return createAuthErrorResponseFromResult(authResult)

// For admin-only routes:
const authResult = await verifyAdmin(request)
if (!authResult.authenticated) return createAuthErrorResponseFromResult(authResult)
```

**Role-Based Authorization:**
```typescript
// Use verifyAdmin() directly — it handles the role check internally
// Only call verifyAuth() + manual role check when you need the user object for further logic
```

**Error Handling (IMPORTANT):**
```typescript
import { createApiErrorResponse, ErrorMessages } from '@/lib/api-errors'

export async function POST(request: NextRequest) {
  try {
    // ... route logic
  } catch (error) {
    // Automatically handles database connection errors, unique constraints, etc.
    // Returns Portuguese error messages with appropriate HTTP status codes
    return createApiErrorResponse(error, ErrorMessages.ORDER_CREATE_FAILED, 'POST /api/orders')
  }
}
```

Error handling utility provides:
- Automatic detection of database connection errors (503 Service Unavailable)
- Unique constraint violation detection (400 Bad Request)
- Foreign key violation detection (400 Bad Request)
- User-friendly Portuguese error messages
- Consistent error response format across all endpoints
- Proper logging with endpoint context

### Server Components vs Client Components

- **Default:** Server Components (faster, better SEO)
- **Use Client Components when:** Need hooks, event handlers, browser APIs
- Mark client components with `'use client'` directive

### Form Validation

- **react-hook-form** + **Zod** for type-safe validation
- Define Zod schema → use with `zodResolver`
- Centralized schemas in `src/schemas/`

### Real-time Updates

`use-realtime.ts` hook provides polling-based real-time updates:
- Polls API endpoints at intervals
- Used for order status updates, notifications
- `/api/realtime` endpoint serves as polling target

## Testing

**Framework:** Jest + React Testing Library

**Test Organization:**
- API route tests: `src/__tests__/api/` (organized by domain)
- Library tests: `src/__tests__/lib/`
- Schema tests: `src/__tests__/schemas/`
- Service tests: `src/__tests__/services/`
- App tests: `src/__tests__/app/`
- Security tests: `src/__tests__/security-controls.test.ts`
- Test utilities: `src/__tests__/utils/` (ignored by test runner)

**Running Tests:**
```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode for TDD
npm run test:coverage     # Generate coverage report
```

## Common Workflows

### Adding a New Game

1. Add game to `Game` enum in `prisma/schema.prisma`
2. Add game config to `GAMES_CONFIG` in `src/lib/games-config.ts` (metadata only, NO pricing logic)
3. Define game modes and display info (pricingInfo.unit and pricingInfo.description)
4. Run `npm run db:push` to update database
5. Configure pricing tiers via `/admin/pricing` admin panel (or add to seed.ts)
6. Add game-specific components in `src/components/games/`

**Note:** Pricing is now database-driven. Do NOT add calculation functions to games-config.ts.

### Adding a New Service Type

1. Add to `ServiceType` enum in `prisma/schema.prisma`
2. Update `supportedServiceTypes` in game config
3. Run `npm run db:push`

### Modifying Database Schema

1. Edit `prisma/schema.prisma`
2. Run `npm run db:push` (dev) or create migration (production)
3. Run `npm run db:generate` to update Prisma Client types
4. Restart dev server to pick up new types

### Adding a New API Endpoint

1. Create route file in `src/app/api/`
2. Add Zod schema in `src/schemas/` for request validation
3. Add business logic in `src/services/` (if non-trivial)
4. Use `validateBody` from `@/lib/validate` for input validation
5. Use `createApiErrorResponse` for error handling
6. Add rate limiting if needed (`@/lib/rate-limit`)
7. Add tests in `src/__tests__/api/`

### Processing Webhooks

**AbacatePay Webhook** (`/api/webhooks/abacatepay/route.ts`):
- Receives payment confirmations
- Updates Payment and Order status
- Creates commission/revenue records
- Sends notifications
- Debug endpoint at `/api/webhooks/abacatepay/debug`

**Testing Webhooks Locally:**
- Use AbacatePay dev mode
- Use `simulatePixPayment()` via `/api/payment/pix/simulate`

## Frontend Page Patterns

### Auth Guard (all protected pages)
```typescript
useEffect(() => {
  if (!authLoading && !user) {
    router.replace('/login')
  } else if (user && user.role !== 'ADMIN') {
    router.replace(user.role === 'BOOSTER' ? '/booster' : '/dashboard')
  }
}, [user, authLoading, router])
```
- Always use `router.replace()` for auth redirects (not `push`) — prevents going back to the protected page
- Admin pages redirect to `/login` when unauthenticated, to `/booster` or `/dashboard` when wrong role
- Booster pages redirect to `/dashboard` for CLIENT, `/admin` for ADMIN

### Loading State
- **Always use `useLoading` hook** from `@/hooks/use-loading` — never manual `useState(true/false)` for page-level loading
- `useLoading({ initialLoading: true })` → returns `{ loading, refreshing, withLoading }`
- `withLoading(async () => { ... })` wraps fetch calls automatically

### API Error Key
- Frontend always reads `data.message` from API responses — **never `data.error`**
- API routes always return `{ message: '...' }` for errors — **never `{ error: '...' }`**

### Admin Pages (current structure)
- `/admin` — Dashboard overview
- `/admin/orders` + `/admin/orders/[id]` — Order management
- `/admin/users` — User management (roles, custom commissions)
- `/admin/boosters` — Booster application approval
- `/admin/pricing` — Dynamic pricing configuration
- `/admin/payments` — Tabbed: Receitas | Saques | Configurações (commission config merged here)

### Booster Pages (current structure)
- `/booster` — Dashboard
- `/booster/payments` — Tabbed: Comissões | Saques (withdraw merged here)
- `/booster/apply` — Application form

## Notes for AI Assistants

- Prisma Client is imported from `@/lib/db`, not `@/generated/prisma`
- All monetary amounts in AbacatePay are in **centavos** (multiply reais by 100)
- Steam credentials must be encrypted before storing in database
- Order duplication is prevented by `[userId, gameMode, status]` index — don't allow multiple PENDING/PAID/IN_PROGRESS orders in same game mode
- Commission percentages are stored as decimals (0.70 = 70%, not 70)
- NextAuth session user object is extended with `id` and `role` fields via callbacks
- Middleware protects routes — check `src/middleware.ts` config before adding new protected routes
- **Pricing System:** All pricing is database-driven via `PricingConfig` model. NEVER add calculation functions to `games-config.ts`. Use `/api/pricing/calculate` endpoint for price calculations.
- **Service Layer:** Business logic belongs in `src/services/`, API routes should be thin controllers
- **Validation:** Use centralized Zod schemas from `src/schemas/` with `validateBody` from `@/lib/validate`
- **Dev-Admin:** The `isDevAdmin` flag on User designates a dev-admin who gets a cut before the regular admin split
- **User Activation:** New users are `active: false` until they verify their email via 6-digit code
- **Removed features (MVP scope cut):** Dispute system, review system, booster public profiles (`/booster/[id]`), commission history audit trail, and contact form were removed. Do not re-add these.
- **Webhook security:** `ABACATEPAY_WEBHOOK_SECRET` is mandatory — missing it returns 500, not 200
- **Cron security:** `CRON_SECRET` is enforced in all environments (not just production)
- **Payment simulate:** `/api/payment/pix/simulate` returns 403 in production (`NODE_ENV === 'production'`)
- **Withdrawal race condition:** Both withdraw routes use provisional-record pattern (DB record created before AbacatePay call) to prevent TOCTOU overdraft
- **Webhook idempotency:** `confirmPayment` uses atomic `updateMany` with `status=PENDING` guard — duplicate webhooks are safely no-ops

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` 15.x | React framework (App Router) |
| `next-auth` | Authentication (JWT strategy) |
| `prisma` / `@prisma/client` 7.x | Database ORM |
| `@prisma/adapter-pg` | PostgreSQL adapter for Prisma |
| `abacatepay-nodejs-sdk` | PIX payment processing |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT signing/verification |
| `zod` 4.x | Schema validation |
| `react-hook-form` | Form state management |
| `@hookform/resolvers` | Zod + react-hook-form bridge |
| `@tanstack/react-query` | Server state / data fetching |
| `sonner` | Toast notifications |
| `framer-motion` | Animations |
| `date-fns` | Date formatting |
| `next-themes` | Theme management |
| `lucide-react` | Icons |
| `@vercel/analytics` | Vercel analytics |
| `@vercel/speed-insights` | Vercel performance metrics |

## Design System

### Tailwind CSS v4 Configuration

**CRITICAL:** This project uses Tailwind CSS v4 with explicit config loading.

```css
/* src/app/globals.css - REQUIRED for Tailwind v4 */
@import "tailwindcss";
@config "../../tailwind.config.js";
```

The `@config` directive is mandatory in Tailwind v4 to load the configuration file.

### Brand Palette (THE ONLY SYSTEM)

This is the only color system. CSS variable tokens (`bg-surface-*`, `bg-action-*`, etc.) are removed. Always use brand palette classes — they work reliably with Tailwind v4.

**Background Colors:**
```
bg-brand-black        (#0A0A0A) - Main page backgrounds
bg-brand-black-light  (#1A1A1A) - Cards, elevated surfaces
```

**Purple Variants:**
```
text-brand-purple-dark    (#4C1D95) - Strong/deep purple
text-brand-purple         (#7C3AED) - Primary brand purple
text-brand-purple-light   (#A855F7) - Accent/hover purple
text-brand-purple-lighter (#C084FC) - Subtle purple
border-brand-purple       - Purple borders
bg-brand-purple           - Purple backgrounds
```

**Gray Variants:**
```
text-brand-gray-300  (#D1D5DB) - Secondary text
text-brand-gray-400  (#9CA3AF) - Muted text
text-brand-gray-500  (#6B7280) - Very muted text
```

**Status Colors (use standard Tailwind):**
```
green-500, green-300  - Success states
yellow-500, amber-500 - Warning states
red-500, red-300      - Error/danger states
```

### Color Mapping Reference

When refactoring from hardcoded colors to brand palette:

| Old Value | New Value |
|-----------|-----------|
| `purple-500` | `brand-purple` |
| `purple-600` | `brand-purple-dark` |
| `purple-400` / `purple-300` | `brand-purple-light` |
| `bg-black` / `#0A0A0A` | `bg-brand-black` |
| `bg-zinc-900` / `#1A1A1A` | `bg-brand-black-light` |
| `gray-400` / `gray-500` | `brand-gray-500` |
| `gray-300` | `brand-gray-300` |

### Quick Reference — What to Use

**Backgrounds:** `bg-brand-black` (page), `bg-brand-black-light` (cards/modals)

**Purple:** `bg-brand-purple` (buttons), `hover:bg-brand-purple-light` (hover), `bg-brand-purple-dark` (strong CTAs), `border-brand-purple` (focus/active)

**Text:** `text-white` (primary), `text-brand-gray-300` (secondary), `text-brand-gray-500` (muted), `text-brand-purple` (accent/links)

**Borders:** `border-white/10` (default), `border-brand-purple` (focus/active), `border-brand-purple/50` (hover)

**Status:** `bg-green-500/20 text-green-300` (success), `bg-yellow-500/20 text-yellow-300` (warning), `bg-red-500/20 text-red-300` (error)

**Effects:** `shadow-glow` / `shadow-glow-lg`, `.hover-glow`, `.animate-glow`, `.bg-gradient-brand`

**Fonts:** `font-orbitron` + `style={{ fontFamily: 'Orbitron, sans-serif' }}` (titles), `font-rajdhani` (labels/UI)

Full reference: `docs/design_system.md`

### Typography

**Fonts (loaded via Next.js):**
- **Orbitron** - Headings, titles, hero text (gaming/futuristic feel)
- **Rajdhani** - Body text, descriptions, UI elements

**Usage Pattern:**
```tsx
// Orbitron for titles
<h1 className="font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
  TÍTULO
</h1>

// Rajdhani for body
<p className="font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
  Descrição do conteúdo
</p>
```

**Note:** The inline `style` attribute ensures font fallback works correctly.

### Glassmorphism Patterns

Cards and surfaces use glassmorphism effect:

```tsx
// Standard card glassmorphism
<div className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50">

// Hero card glassmorphism
<div className="bg-white/5 backdrop-blur-xl border-white/10">

// Elevated surface
<div className="bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md">
```

### Touch-Friendly Sizing

Mobile-first design with touch target utilities:

```
min-h-touch     (44px) - iOS recommended touch target
min-h-touch-lg  (48px) - Android recommended touch target
min-w-touch     (44px)
min-w-touch-lg  (48px)
```

### Glow Shadows

Brand purple glow effects:

```
shadow-glow-sm    - Subtle glow (10px, 0.3 opacity)
shadow-glow       - Standard glow (20px, 0.5 opacity)
shadow-glow-lg    - Large glow (30px, 0.7 opacity)
shadow-glow-hover - Hover state glow
```

### Animations

**Built-in Animations (globals.css):**
```
animate-fadeIn           - Fade in
animate-fadeInUp         - Fade in with upward motion
animate-slideInFromLeft  - Slide from left
animate-slideInFromRight - Slide from right
animate-pulse            - Pulsing opacity
animate-float            - Floating up/down
animate-glow             - Pulsing purple glow
animate-cartShake        - Cart icon shake
animate-bellPulse        - Notification bell pulse
animate-neonGlow         - Neon glow effect
animate-shimmer          - Loading shimmer
```

**Tailwind Config Animations:**
```
animate-accordion-down/up - Accordion expand/collapse
animate-fade-in           - Simple fade
animate-fade-in-up        - Fade with motion
animate-slide-in-left/right - Slide animations
```

### Micro-Interactions (globals.css)

Utility classes for interactive elements:

```css
/* Lift effect - cards float up on hover */
.hover-lift

/* Glow effect - brand purple glow on hover */
.hover-glow

/* Scale effect - subtle scale up */
.hover-scale

/* Scale down on press */
.active-scale

/* Card interaction - combines lift + glow */
.card-interactive

/* Button press effect */
.btn-press

/* Icon bounce on hover */
.icon-bounce

/* Stagger children animation */
.stagger-children

/* Loading shimmer for skeletons */
.shimmer

/* Focus ring for accessibility */
.focus-ring
```

### Gradient Utilities

```css
.bg-gradient-brand        /* Black to purple gradient */
.bg-gradient-purple       /* Dark to light purple */
.bg-gradient-purple-light /* Light purple variations */
.bg-gradient-red          /* Red gradient for errors/danger */
```

### Common Component Patterns

**Stat Card Pattern:**
```tsx
<Card className="bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-purple-500/50 hover:border-purple-400/80">
  <CardHeader>
    <CardTitle className="text-gray-400 font-rajdhani">Title</CardTitle>
    <Icon className="text-brand-purple" />
  </CardHeader>
  <CardContent>
    <div className="text-white font-orbitron">Value</div>
  </CardContent>
</Card>
```

**Page Header Pattern:**
```tsx
<PageHeader
  highlight="HIGHLIGHTED"   // Purple text
  title="TITLE"             // White text
  description="Description" // Gray text
/>
```

**Status Badge Colors:**
```tsx
// Success (green)
<Badge className="bg-green-500/20 text-green-300 border-green-500/50">

// Warning (yellow)
<Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">

// Error (red)
<Badge className="bg-red-500/20 text-red-300 border-red-500/50">

// Info (purple)
<Badge className="bg-brand-purple/20 text-brand-purple-light border-brand-purple/50">
```

### Responsive Breakpoints

Custom breakpoints beyond Tailwind defaults:

```
notebook: 1024px  - Laptop screens
desktop:  1366px  - Desktop monitors
wide:     1920px  - Large displays
```

### Accessibility Features

**Built-in Support:**
- `prefers-reduced-motion` media query support
- `.reduce-motion` class for manual control
- `.sr-only` for screen reader text
- `.focus-ring` for visible focus states
- Proper cursor handling for interactive elements
- `SkipLink` component for keyboard navigation

```css
/* Reduced motion is automatically respected */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Common UI Components (src/components/common/)

| Component | Purpose |
|-----------|---------|
| `StatCard` | Dashboard statistics display |
| `PageHeader` | Consistent page headers |
| `EmptyState` | Empty data states |
| `LoadingSpinner` | Full-page loading |
| `ButtonLoading` | Button with loading state |
| `ActionButton` | Action button with loading states |
| `StatusBadge` | Order/payment status badges |
| `DashboardCard` | Dashboard content cards |
| `ConfirmDialog` | Confirmation modals |
| `OrderInfoItem` | Order detail display |
| `NotificationBell` | Header notification icon |
| `NotificationItem` | Individual notification display |
| `LoadingSkeletons` | Skeleton loading states |
| `Skeletons` | Additional skeleton components |
| `PageLoadingWrapper` | Page-level loading wrapper |
| `RefreshingBanner` | Banner shown during data refresh |
| `SkipLink` | Accessibility skip navigation |
| `LiveRegion` | Accessibility live region for announcements |

### shadcn/ui Components (src/components/ui/)

Base components from shadcn/ui (customized for brand):
- `Button`, `Card`, `Dialog`, `Input`, `Label`
- `Select`, `Tabs`, `Table`, `Badge`
- `Alert`, `AlertDialog`, `Tooltip`, `Popover`
- `DropdownMenu`, `NavigationMenu`, `Sheet`
- `Form`, `Checkbox`, `Textarea`, `Skeleton`
- `Switch`, `Separator`, `ScrollArea`, `Avatar`
- `Sonner` (toast notification wrapper)
