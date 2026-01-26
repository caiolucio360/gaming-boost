# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GameBoost is a full-stack platform connecting players who need game boosting services with professional boosters. Built with Next.js 15 App Router, TypeScript, Prisma ORM, and AbacatePay for PIX payments.

**Key Roles:**
- **CLIENT** - Users who purchase boost services
- **BOOSTER** - Users who perform boost services and earn commissions
- **ADMIN** - Platform administrators who manage the system and receive revenue

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
npm run db:seed          # Seed database with initial data

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
- `src/middleware.ts` - Route protection and RBAC enforcement

**Middleware Route Protection:**
- `/admin/*` - ADMIN only
- `/booster/*` - BOOSTER and ADMIN (except `/booster/apply` which CLIENTs can access)
- `/dashboard/*`, `/cart/*`, `/payment/*` - Authenticated users only

**Custom JWT system** (separate from NextAuth) exists in `src/lib/jwt.ts` for API authentication.

### Database Schema (Prisma)

**Critical Models:**
- `User` - All user types (role: CLIENT, BOOSTER, ADMIN)
  - `boosterCommissionPercentage` - Custom commission rate per booster (overrides global)
  - `adminProfitShare` - Percentage of profit split for admins
  - `pixKey` - PIX key for payments (BOOSTER/ADMIN)
  - `steamProfileUrl`, `steamId` - Steam integration data

- `Order` - Boost service orders
  - Stores both `current` and `target` rank/rating
  - `steamCredentials` - Encrypted Steam credentials (AES-256-GCM)
  - `boosterCommission`, `adminRevenue` - Calculated when order accepted/created
  - Status flow: PENDING → PAID → IN_PROGRESS → COMPLETED/CANCELLED

- `Payment` - PIX payment tracking
  - Links to Order
  - Stores `providerId` (AbacatePay ID), `pixCode`, `qrCode`

- `BoosterCommission` - Booster earnings per order
- `AdminRevenue` - Admin earnings per order (supports multiple admins)
- `CommissionConfig` - Global commission percentages
- `Withdrawal` - PIX withdrawal requests from boosters/admins
- `PricingConfig` - Dynamic pricing tiers per game mode (admin-configurable)
  - Stores price ranges (e.g., Premier 0-5K = R$25/1000 pts)
  - Progressive pricing tiers
  - Managed via `/admin/pricing` panel

- `Service` - Available boost services (e.g., "CS2 Premier Rank Boost")
  - Links to Game and ServiceType
  - **IMPORTANT**: Services are NOT managed via admin UI for MVP simplicity
  - Managed via database seeding: `npm run db:seed`
  - To add/modify services: Update `prisma/seed.ts` and re-run seeding
  - Admin service CRUD was intentionally removed to reduce complexity

**Important Indexes:**
- Orders indexed by `[userId, gameMode, status]` to prevent duplicate active orders in same game mode
- Commissions/revenues indexed by `[userId, status]` for dashboard queries

**Order Duplication Prevention:**
- Backend validation: API prevents duplicate PENDING/PAID/IN_PROGRESS orders in same game mode (see `/api/orders/route.ts`)
- Frontend warning: CS2 calculator displays prominent warning when user has active order in selected mode
- UX flow: Warning banner + disabled "CONTRATAR AGORA" button + link to dashboard
- Real-time check: Calculator fetches user's orders on mount and mode change via `/api/orders` GET endpoint
- User guidance: Clear messaging directs users to finish/cancel existing order before creating new one

**Prisma Client Location:**
- Generated at `src/generated/prisma` (custom output path)
- Import via `@/lib/db` which exports configured PrismaClient singleton

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
- `src/lib/pricing.ts` contains calculation logic
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

**Auto-Refund System:**
- Orders in PAID status without booster assignment are auto-refunded after configured timeout
- Timeout configured via `ORDER_TIMEOUT_HOURS` environment variable (default: 24 hours)
- Cron job runs hourly: `/api/cron/auto-refund/route.ts`
- Vercel Cron configured in `vercel.json`
- Secured with `CRON_SECRET` bearer token
- Automatic email notification sent to customer on refund
- Order status changes: PAID → CANCELLED
- Payment status changes: PAID → REFUNDED
- Uses `refundPixPayment()` from AbacatePay wrapper

**Client-Initiated Cancellation & Refund:**
- Clients can cancel orders via `/api/orders/[id]/cancel` (POST)
- Only PENDING and PAID orders can be cancelled
- IN_PROGRESS and COMPLETED orders cannot be cancelled (must use dispute system)
- PAID orders automatically trigger refund processing
- Refund processed synchronously - if it fails, cancellation is blocked
- Order ownership verified before allowing cancellation
- Email notification sent to client on successful cancellation
- UI available in client dashboard with dynamic messaging
- Rate limited: 5 cancellation attempts per minute per IP

**Important:**
- All amounts in AbacatePay are in **centavos** (cents), not reais
- PIX codes expire (default 30 minutes)
- Dev mode allows `simulatePixPayment()` for testing

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
```

### Commission System

**How Commissions Work:**
1. When order is created → `AdminRevenue` record created with admin's percentage
2. When booster accepts order → `BoosterCommission` record created with booster's percentage
3. Percentages are snapshotted at creation time (from `CommissionConfig` or user overrides)
4. When order completes → commissions marked as PENDING
5. Admin approves payouts → commissions marked as PAID

**Custom Commission Rates:**
- Global defaults in `CommissionConfig` table
- Per-booster override via `User.boosterCommissionPercentage`
- Historical tracking in `BoosterCommissionHistory`

## Code Organization

```
src/
├── app/
│   ├── (auth)/              # Auth route group
│   ├── (dashboard)/         # Dashboard route group
│   ├── admin/               # Admin panel pages
│   ├── booster/             # Booster dashboard pages
│   ├── api/                 # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── orders/          # Order management
│   │   ├── payment/         # Payment endpoints
│   │   ├── webhooks/        # External webhooks (AbacatePay)
│   │   ├── admin/           # Admin-only endpoints
│   │   ├── booster/         # Booster-only endpoints
│   │   └── disputes/        # Dispute system
│   └── ...                  # Public pages
├── components/
│   ├── ui/                  # Base components (shadcn/ui)
│   ├── common/              # Shared components
│   ├── layout/              # Layout components
│   ├── providers/           # Context providers
│   └── ...                  # Feature-specific components
├── contexts/
│   ├── auth-context.tsx     # Authentication state
│   └── cart-context.tsx     # Shopping cart state
├── hooks/
│   ├── use-loading.ts       # Loading state management
│   ├── use-realtime.ts      # Real-time updates (polling)
│   ├── use-orders.ts        # Order data fetching
│   └── ...
├── lib/
│   ├── db.ts                # Prisma client singleton
│   ├── auth-config.ts       # NextAuth configuration
│   ├── jwt.ts               # JWT utilities
│   ├── encryption.ts        # AES-256-GCM encryption
│   ├── abacatepay.ts        # AbacatePay API wrapper
│   ├── games-config.ts      # Game modes and pricing
│   ├── env.ts               # Environment validation
│   ├── api-errors.ts        # API error response utilities
│   └── ...
├── types/                   # TypeScript type definitions
└── __tests__/               # Jest tests

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
return Response.json({ error: 'message' }, { status: 400 })
```

**Authentication in API Routes:**
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

const session = await getServerSession(authOptions)
if (!session) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Role-Based Authorization:**
```typescript
if (session.user.role !== 'ADMIN') {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}
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
- Example pattern in form components

### Real-time Updates

`use-realtime.ts` hook provides polling-based real-time updates:
- Polls API endpoints at intervals
- Used for order status updates, notifications

## Testing

**Framework:** Jest + React Testing Library

**Test Organization:**
- Unit tests: `src/__tests__/`
- Test utilities: `src/__tests__/utils/` (ignored by test runner)
- Current coverage: 139+ tests

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

### Processing Webhooks

**AbacatePay Webhook** (`/api/webhooks/abacatepay/route.ts`):
- Receives payment confirmations
- Updates Payment and Order status
- Creates commission/revenue records
- Sends notifications

**Testing Webhooks Locally:**
- Use AbacatePay dev mode
- Use `simulatePixPayment()` to trigger webhook in test environment

## Notes for AI Assistants

- Prisma Client is imported from `@/lib/db`, not `@/generated/prisma`
- All monetary amounts in AbacatePay are in **centavos** (multiply reais by 100)
- Steam credentials must be encrypted before storing in database
- Order duplication is prevented by `[userId, gameMode, status]` index - don't allow multiple PENDING/PAID/IN_PROGRESS orders in same game mode
- Commission percentages are stored as decimals (0.70 = 70%, not 70)
- NextAuth session user object is extended with `id` and `role` fields via callbacks
- Middleware protects routes - check `src/middleware.ts` config before adding new protected routes
- **Pricing System:** All pricing is database-driven via `PricingConfig` model. NEVER add calculation functions to `games-config.ts`. Use `/api/pricing/calculate` endpoint for price calculations. Config only contains display metadata (pricingInfo.unit and pricingInfo.description)
