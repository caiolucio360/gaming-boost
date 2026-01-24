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

**Important Indexes:**
- Orders indexed by `[userId, gameMode, status]` to prevent duplicate active orders in same game mode
- Commissions/revenues indexed by `[userId, status]` for dashboard queries

**Prisma Client Location:**
- Generated at `src/generated/prisma` (custom output path)
- Import via `@/lib/db` which exports configured PrismaClient singleton

### Game Configuration System

`src/lib/games-config.ts` defines all game modes and pricing:

**CS2 Game Modes:**
1. **Premier** - Rating-based (1K-26K points)
   - Progressive pricing by rating tier (R$25-90 per 1000 points)
   - Higher ratings = higher price per 1000 points

2. **Gamers Club** - Level-based (1-20)
   - Progressive pricing by level (R$20-120 per level)

**Pricing Calculation:**
- Each mode has a `calculation` function that computes total price from current → target
- Prices increase progressively in tiers (not linear)

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

**Important:**
- All amounts in AbacatePay are in **centavos** (cents), not reais
- PIX codes expire (default 30 minutes)
- Dev mode allows `simulatePixPayment()` for testing

### Encryption & Security

**Steam Credentials Encryption** (`src/lib/encryption.ts`):
- AES-256-GCM encryption for sensitive data
- Requires `ENCRYPTION_KEY` env var (64 hex chars = 256 bits)
- Format: IV + AuthTag + Ciphertext (base64 encoded)

**Environment Validation** (`src/lib/env.ts`):
- Validates required env vars on startup
- Throws errors if critical vars missing or malformed

**Required Environment Variables:**
```
DATABASE_URL           # PostgreSQL connection string
NEXTAUTH_SECRET        # NextAuth session secret
NEXT_PUBLIC_API_URL    # Public API URL
JWT_SECRET             # JWT signing secret
ENCRYPTION_KEY         # 64 hex chars for AES-256
ABACATEPAY_API_KEY     # AbacatePay API key (optional in dev)
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
│   ├── (auth)/              # Auth route group (login, register, forgot-password)
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
2. Add game config to `GAMES_CONFIG` in `src/lib/games-config.ts`
3. Define game modes and pricing calculation functions
4. Run `npm run db:push` to update database
5. Add game-specific components in `src/components/games/`

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
