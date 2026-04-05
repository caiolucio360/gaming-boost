# Client Retention System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Option B retention mechanics — streak discounts (5/10/15%), progress bar in client dashboard, in-app notification on completion, expanded completion email, and reactivation email cron after 14 days.

**Architecture:** Pure utility functions in `src/lib/retention.ts` handle all milestone/discount math. Service layer (`order.service.ts`) injects discount at order creation and updates streak on completion. A new React component renders the progress bar. A daily cron job triggers reactivation emails.

**Tech Stack:** Prisma ORM, Next.js 15 App Router, Resend email, existing notification system (`prisma.notification.create`), existing cron auth pattern (`CRON_SECRET`), Tailwind brand palette.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `prisma/schema.prisma` | Modify | Add 6 User fields + 2 Order fields |
| `src/lib/retention.ts` | Create | Pure functions: milestone, progress %, streak discount, streak update |
| `src/services/order.service.ts` | Modify | Apply discount in `createOrder`; update streak + notification in `completeOrder` |
| `src/lib/email.ts` | Modify | Expand `sendOrderCompletedEmail`; add `sendReactivationEmail` |
| `src/components/common/retention-progress.tsx` | Create | Progress bar + order timeline UI component |
| `src/app/dashboard/page.tsx` | Modify | Render `<RetentionProgress>` below stats section |
| `src/app/api/cron/reactivation/route.ts` | Create | Daily cron — find inactive users, send reactivation email |
| `vercel.json` | Modify | Add reactivation cron schedule |

---

## Task 1: Prisma Schema — New Fields

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add fields to `User` model**

Open `prisma/schema.prisma`. Find the `User` model and add these 6 fields (after the existing `image` field or near the end of User):

```prisma
completedOrdersStreak         Int       @default(0)
streakLastOrderAt             DateTime?
currentDiscountPct            Float     @default(0)
emailMarketing                Boolean   @default(true)
reactivationDiscountPct       Float     @default(0)
reactivationDiscountExpiresAt DateTime?
```

- [ ] **Step 2: Add fields to `Order` model**

In the same file, find the `Order` model and add these 2 fields (near the other price fields like `total`):

```prisma
discountApplied Boolean @default(false)
discountPct     Float   @default(0)
```

- [ ] **Step 3: Push schema and regenerate client**

```bash
npm run db:push
npm run db:generate
```

Expected: Migration applied successfully. Prisma Client regenerated.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add retention fields to User and Order models"
```

---

## Task 2: Retention Utility Library

**Files:**
- Create: `src/lib/retention.ts`

- [ ] **Step 1: Create the file with all pure functions**

```typescript
import prisma from '@/lib/db'

// ─── Milestone tables ────────────────────────────────────────────────────────

const PREMIER_MILESTONES = [5000, 10000, 15000, 20000, 26000]
const GC_MILESTONES = [6, 11, 16, 20]

export function getNextMilestone(
  currentRating: number,
  gameMode: 'PREMIER' | 'GC'
): number | null {
  const milestones = gameMode === 'PREMIER' ? PREMIER_MILESTONES : GC_MILESTONES
  const next = milestones.find((m) => m > currentRating)
  return next ?? null // null = already at max
}

export function isAtMax(currentRating: number, gameMode: 'PREMIER' | 'GC'): boolean {
  return getNextMilestone(currentRating, gameMode) === null
}

// ─── Progress calculation ─────────────────────────────────────────────────────

/**
 * Returns progress percentage (0-100) between start and next milestone.
 * start = targetRating of the oldest completed order in this streak of milestones.
 */
export function calculateProgressPct(
  current: number,
  start: number,
  next: number
): number {
  if (next <= start) return 100
  const progress = ((current - start) / (next - start)) * 100
  return Math.min(100, Math.max(0, Math.round(progress)))
}

// ─── Streak discounts ─────────────────────────────────────────────────────────

const STREAK_DISCOUNT_TABLE: Record<number, number> = {
  1: 0,
  2: 0.05,
  3: 0.10,
}
const STREAK_DISCOUNT_MAX = 0.15

export function getStreakDiscount(streak: number): number {
  if (streak <= 1) return 0
  if (streak === 2) return 0.05
  if (streak === 3) return 0.10
  return STREAK_DISCOUNT_MAX
}

// ─── Streak updater (called on order COMPLETED) ───────────────────────────────

const STREAK_WINDOW_DAYS = 30

export async function updateUserStreak(userId: number): Promise<{
  newStreak: number
  newDiscountPct: number
  leveledUp: boolean
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { completedOrdersStreak: true, streakLastOrderAt: true, currentDiscountPct: true },
  })

  if (!user) throw new Error(`User ${userId} not found`)

  const now = new Date()
  const windowMs = STREAK_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const isWithinWindow =
    user.streakLastOrderAt !== null &&
    now.getTime() - user.streakLastOrderAt.getTime() <= windowMs

  const newStreak = isWithinWindow ? user.completedOrdersStreak + 1 : 1
  const newDiscountPct = getStreakDiscount(newStreak)
  const leveledUp = newDiscountPct > user.currentDiscountPct

  await prisma.user.update({
    where: { id: userId },
    data: {
      completedOrdersStreak: newStreak,
      streakLastOrderAt: now,
      currentDiscountPct: newDiscountPct,
    },
  })

  return { newStreak, newDiscountPct, leveledUp }
}

// ─── Reactivation discount helpers ───────────────────────────────────────────

export function isReactivationDiscountValid(
  expiresAt: Date | null
): boolean {
  if (!expiresAt) return false
  return expiresAt > new Date()
}

export function bestAvailableDiscount(
  currentDiscountPct: number,
  reactivationDiscountPct: number,
  reactivationDiscountExpiresAt: Date | null
): number {
  const reactivationValid = isReactivationDiscountValid(reactivationDiscountExpiresAt)
  const reactivation = reactivationValid ? reactivationDiscountPct : 0
  return Math.max(currentDiscountPct, reactivation)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/retention.ts
git commit -m "feat: add retention utility library (milestones, streak, discount)"
```

---

## Task 3: Apply Discount in `createOrder`

**Files:**
- Modify: `src/services/order.service.ts`

- [ ] **Step 1: Read the current createOrder function**

Open `src/services/order.service.ts` and locate `createOrder` (around line 337). Note the block that builds `orderData` and calls `prisma.order.create`. The `total` field is set from `pricing.total`.

- [ ] **Step 2: Add discount logic before order creation**

Add this import at the top of the file (with other imports):

```typescript
import { bestAvailableDiscount } from '@/lib/retention'
```

Then inside `createOrder`, after the pricing calculation and before `prisma.order.create`, add:

```typescript
// Apply streak or reactivation discount
const discountPct = bestAvailableDiscount(
  user.currentDiscountPct ?? 0,
  user.reactivationDiscountPct ?? 0,
  user.reactivationDiscountExpiresAt ?? null
)
const discountedTotal = discountPct > 0
  ? Math.round(pricing.total * (1 - discountPct))
  : pricing.total
```

- [ ] **Step 3: Pass discount fields to `prisma.order.create`**

In the `prisma.order.create` call, change the `total` field and add discount fields:

```typescript
// Before:
total: pricing.total,

// After:
total: discountedTotal,
discountApplied: discountPct > 0,
discountPct: discountPct,
```

- [ ] **Step 4: Clear reactivation discount if it was used**

After `prisma.order.create` succeeds (inside the same transaction or immediately after), clear the reactivation discount if it was the one used:

```typescript
if (discountPct > 0 && (user.reactivationDiscountPct ?? 0) > 0) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      reactivationDiscountPct: 0,
      reactivationDiscountExpiresAt: null,
    },
  })
}
```

- [ ] **Step 5: Run build to check for TypeScript errors**

```bash
npm run build
```

Expected: No new TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/services/order.service.ts src/lib/retention.ts
git commit -m "feat: apply streak/reactivation discount at order creation"
```

---

## Task 4: Update Streak + Notification in `completeOrder`

**Files:**
- Modify: `src/services/order.service.ts`

- [ ] **Step 1: Locate `completeOrder`**

In `src/services/order.service.ts`, find `completeOrder` (around line 559). Locate the block that creates the in-app `notification` — it uses `prisma.notification.create` with `type: 'ORDER_UPDATE'`, `title`, and `body`.

- [ ] **Step 2: Add streak update call**

After the order status is set to COMPLETED and before or after the notification block, add:

```typescript
import { updateUserStreak } from '@/lib/retention'

// After order is marked COMPLETED:
const streakResult = await updateUserStreak(order.userId)
```

Note: `updateUserStreak` is already imported from the Task 2 import addition in `retention.ts`. Add the import at the top of the file alongside the other retention import.

- [ ] **Step 3: Update the in-app notification content**

Find the `prisma.notification.create` call inside `completeOrder`. Update `title` and `body` to use the streak-aware content:

```typescript
await prisma.notification.create({
  data: {
    userId: order.userId,
    type: 'ORDER_UPDATE',
    title: `Boost concluído! Você chegou a ${order.targetRating ?? order.targetRank} pts`,
    body: streakResult.newDiscountPct > 0
      ? `Seus rivais não param. Garanta ${Math.round(streakResult.newDiscountPct * 100)}% off no próximo boost — oferta válida por 48h.`
      : `Continue subindo — contrate o próximo boost e ganhe 5% de desconto.`,
    link: '/dashboard',
    read: false,
  },
})
```

If there's no `link` field in the Notification model, omit that field.

- [ ] **Step 4: Add STREAK_UNLOCK notification when level goes up**

After the ORDER_UPDATE notification, add:

```typescript
if (streakResult.leveledUp) {
  await prisma.notification.create({
    data: {
      userId: order.userId,
      type: 'SYSTEM',
      title: `Fidelidade desbloqueada! ${Math.round(streakResult.newDiscountPct * 100)}% de desconto`,
      body: `Você completou ${streakResult.newStreak} pedidos consecutivos. Seu desconto subiu para ${Math.round(streakResult.newDiscountPct * 100)}%!`,
      read: false,
    },
  })
}
```

- [ ] **Step 5: Run build**

```bash
npm run build
```

Expected: No TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/services/order.service.ts
git commit -m "feat: update streak and send retention notifications on order completion"
```

---

## Task 5: Email Templates

**Files:**
- Modify: `src/lib/email.ts`

- [ ] **Step 1: Read the current `sendOrderCompletedEmail` signature**

Open `src/lib/email.ts`. Find `sendOrderCompletedEmail`. Note its current signature: `(to: string, orderId: number, serviceName: string)`.

- [ ] **Step 2: Extend `sendOrderCompletedEmail` with optional retention params**

Change the signature to accept optional retention data:

```typescript
export async function sendOrderCompletedEmail(
  to: string,
  orderId: number,
  serviceName: string,
  retention?: {
    currentRating: number
    nextMilestone: number | null
    progressPct: number
    discountPct: number   // 0 if none
    gameMode: 'PREMIER' | 'GC'
  }
): Promise<void>
```

Inside the function, find the HTML template string. After the existing completion message, append a retention section when `retention` is provided:

```typescript
const retentionBlock = retention
  ? `
    <div style="margin:24px 0;padding:16px;background:#1A1A1A;border-radius:8px;border:1px solid rgba(124,58,237,0.3)">
      <p style="color:#A855F7;font-size:13px;font-weight:700;margin:0 0 8px">PRÓXIMO MARCO</p>
      ${retention.nextMilestone
        ? `<p style="color:#fff;font-size:14px;margin:0 0 6px">Você está em <strong>${retention.currentRating}</strong> — faltam <strong>${retention.nextMilestone - retention.currentRating}</strong> pts para o próximo marco.</p>
           <div style="background:#374151;border-radius:4px;height:6px;overflow:hidden">
             <div style="background:#7C3AED;height:100%;width:${retention.progressPct}%"></div>
           </div>`
        : `<p style="color:#10B981;font-size:14px;margin:0">🏆 Você chegou ao rating máximo!</p>`
      }
      ${retention.discountPct > 0
        ? `<p style="color:#D1D5DB;font-size:13px;margin:12px 0 0">Você tem <strong style="color:#A855F7">${Math.round(retention.discountPct * 100)}% de desconto</strong> disponível por 48h para o próximo pedido.</p>`
        : `<p style="color:#D1D5DB;font-size:13px;margin:12px 0 0">Complete o próximo boost e ganhe 5% de desconto de fidelidade.</p>`
      }
    </div>
    <div style="text-align:center;margin:20px 0">
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard"
         style="background:#7C3AED;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700">
        ${retention.discountPct > 0 ? 'Garantir meu desconto agora' : 'Continuar subindo'}
      </a>
    </div>
  `
  : ''
```

Insert `${retentionBlock}` into the HTML template string after the main completion paragraph and before the closing `</body>`.

- [ ] **Step 3: Add `sendReactivationEmail`**

Add this new function at the bottom of `email.ts`:

```typescript
export async function sendReactivationEmail(
  to: string,
  data: {
    currentRating: number
    currentRatingLabel: string   // e.g. "12.500 pts" or "Nível 8"
    nextMilestone: number
    nextMilestoneLabel: string   // e.g. "15.000 pts" or "Nível 11"
    discountPct: number          // e.g. 0.05 → 5%
    discountExpiresAt: Date
  }
): Promise<void> {
  const discountLabel = Math.round(data.discountPct * 100)
  const expiresFormatted = data.discountExpiresAt.toLocaleDateString('pt-BR')
  const gap = data.nextMilestone - data.currentRating

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="background:#0A0A0A;color:#fff;font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto">
      <h1 style="font-size:20px;font-weight:700;margin-bottom:16px">
        Seus rivais estão subindo. Você parou em ${data.currentRatingLabel}.
      </h1>
      <p style="color:#9CA3AF;font-size:14px;line-height:1.6">
        Você parou em ${data.currentRatingLabel} há 14 dias. Faltam só <strong style="color:#fff">${gap}</strong> para ${data.nextMilestoneLabel}.
      </p>
      <div style="margin:24px 0;padding:16px;background:#1A1A1A;border-radius:8px;border:1px solid rgba(124,58,237,0.3)">
        <p style="color:#A855F7;font-weight:700;margin:0 0 8px;font-size:13px">OFERTA ESPECIAL</p>
        <p style="color:#fff;font-size:16px;font-weight:700;margin:0 0 4px">${discountLabel}% de desconto</p>
        <p style="color:#9CA3AF;font-size:13px;margin:0">Válido até ${expiresFormatted}</p>
      </div>
      <div style="text-align:center;margin:20px 0">
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard"
           style="background:#7C3AED;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:700">
          Garantir meu desconto agora
        </a>
      </div>
    </body>
    </html>
  `

  await sendEmail({
    to,
    subject: `Seus rivais estão subindo. Você parou em ${data.currentRatingLabel}.`,
    html,
    text: `Você parou em ${data.currentRatingLabel} há 14 dias. Faltam só ${gap} para ${data.nextMilestoneLabel}. Garanta ${discountLabel}% de desconto.`,
  })
}
```

Note: `sendEmail` is the internal helper already in `email.ts`. Use the same pattern as the existing email functions.

- [ ] **Step 4: Run build**

```bash
npm run build
```

Expected: No TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/email.ts
git commit -m "feat: expand completion email with retention block; add reactivation email"
```

---

## Task 6: RetentionProgress UI Component

**Files:**
- Create: `src/components/common/retention-progress.tsx`

- [ ] **Step 1: Create the component**

```typescript
'use client'

import { getNextMilestone, calculateProgressPct, isAtMax } from '@/lib/retention'

interface CompletedOrderEntry {
  id: number
  targetRating: number | null
  targetRank: string | null
  gameMode: string
  completedAt: Date | string
}

interface RetentionProgressProps {
  completedOrders: CompletedOrderEntry[]
  currentDiscountPct: number
  gameMode: 'PREMIER' | 'GC'
}

function formatRating(value: number, gameMode: 'PREMIER' | 'GC'): string {
  if (gameMode === 'GC') return `Nível ${value}`
  return `${value.toLocaleString('pt-BR')} pts`
}

export function RetentionProgress({
  completedOrders,
  currentDiscountPct,
  gameMode,
}: RetentionProgressProps) {
  // Filter to this gameMode only
  const orders = completedOrders
    .filter((o) => o.gameMode === gameMode || o.gameMode === `CS2_${gameMode}`)
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())

  if (orders.length === 0) return null

  const latest = orders[orders.length - 1]
  const currentRating = latest.targetRating ?? 0
  const nextMilestone = getNextMilestone(currentRating, gameMode)
  const firstRating = orders[0].targetRating ?? 0
  const startForProgress = nextMilestone
    ? orders.find((o) => (o.targetRating ?? 0) < nextMilestone)?.targetRating ?? firstRating
    : firstRating
  const progressPct = nextMilestone
    ? calculateProgressPct(currentRating, startForProgress, nextMilestone)
    : 100
  const atMax = isAtMax(currentRating, gameMode)
  const discountLabel = currentDiscountPct > 0
    ? `${Math.round(currentDiscountPct * 100)}% de desconto`
    : null

  return (
    <div className="bg-brand-black-light border border-brand-purple/20 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-orbitron text-sm font-bold tracking-wide">
          PROGRESSÃO
        </h3>
        {discountLabel && (
          <span className="text-xs font-semibold bg-brand-purple/20 text-brand-purple-light border border-brand-purple/40 rounded-full px-2 py-0.5">
            {discountLabel} disponível
          </span>
        )}
      </div>

      {/* Rating display */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-brand-gray-500 mb-0.5">Rating atual</p>
          <p className="text-2xl font-orbitron text-white">{formatRating(currentRating, gameMode)}</p>
        </div>
        {!atMax && nextMilestone && (
          <div className="text-right">
            <p className="text-xs text-brand-gray-500 mb-0.5">Próximo marco</p>
            <p className="text-lg font-orbitron text-brand-purple-light">{formatRating(nextMilestone, gameMode)}</p>
          </div>
        )}
        {atMax && (
          <p className="text-green-400 text-sm font-semibold">🏆 Rating máximo!</p>
        )}
      </div>

      {/* Progress bar */}
      {!atMax && (
        <div>
          <div className="flex justify-between text-xs text-brand-gray-500 mb-1.5">
            <span>{progressPct}% concluído</span>
            {nextMilestone && <span>Faltam {formatRating(nextMilestone - currentRating, gameMode)}</span>}
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-purple to-brand-purple-light rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <p className="text-xs text-brand-gray-500 font-semibold uppercase tracking-wider">Histórico</p>
        {orders.slice(-4).map((order, i) => (
          <div key={order.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-purple-light" />
              <span className="text-brand-gray-300">{formatRating(order.targetRating ?? 0, gameMode)}</span>
            </div>
            <span className="text-brand-gray-500 text-xs">
              {new Date(order.completedAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        ))}
        {!atMax && (
          <div className="flex items-center gap-2 text-sm text-brand-gray-500 opacity-50">
            <div className="w-1.5 h-1.5 rounded-full border border-brand-purple-light" />
            <span>Próximo</span>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/common/retention-progress.tsx
git commit -m "feat: add RetentionProgress component for client dashboard"
```

---

## Task 7: Integrate RetentionProgress in Client Dashboard

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Read the dashboard page to find the right insertion point**

Open `src/app/dashboard/page.tsx`. Find where `orders` is already fetched from the API. Note the stats grid section. We'll add `<RetentionProgress>` after the stats grid and before the orders table.

- [ ] **Step 2: Add the import**

At the top of the file with other imports:

```typescript
import { RetentionProgress } from '@/components/common/retention-progress'
```

- [ ] **Step 3: Derive completedOrders from existing orders state**

After the orders state is available (not inside JSX), derive the completed orders:

```typescript
const completedOrders = orders
  .filter((o) => o.status === 'COMPLETED' && o.targetRating != null)
  .map((o) => ({
    id: o.id,
    targetRating: o.targetRating as number,
    targetRank: o.targetRank ?? null,
    gameMode: o.gameMode,
    completedAt: o.updatedAt ?? o.createdAt,
  }))
```

Note: check the actual field names in the `Order` type returned by the dashboard API. Use `o.updatedAt` for completedAt if available, otherwise `o.createdAt`.

- [ ] **Step 4: Render the component**

Find the stats grid (`<div className="grid ...">` with stat cards). After the closing `</div>` of the stats grid and before the orders table section, add:

```tsx
{completedOrders.length > 0 && (
  <RetentionProgress
    completedOrders={completedOrders}
    currentDiscountPct={user?.currentDiscountPct ?? 0}
    gameMode="PREMIER"
  />
)}
```

Note: `user` comes from the `useAuth()` hook or the `me` API call already in the page. Check which user object is available. The `currentDiscountPct` field was added in Task 1 — it'll be available after regenerating the Prisma client and updating the user API response.

- [ ] **Step 5: Ensure `currentDiscountPct` is returned from `/api/auth/me`**

Open `src/app/api/auth/me/route.ts`. Find the `select` or `findUnique` call that returns user data. Add `currentDiscountPct: true` to the select object.

- [ ] **Step 6: Run build**

```bash
npm run build
```

Expected: No TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboard/page.tsx src/app/api/auth/me/route.ts
git commit -m "feat: integrate RetentionProgress into client dashboard"
```

---

## Task 8: Reactivation Cron Job

**Files:**
- Create: `src/app/api/cron/reactivation/route.ts`

- [ ] **Step 1: Create the cron route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { sendReactivationEmail } from '@/lib/email'
import { getNextMilestone } from '@/lib/retention'

export async function POST(request: NextRequest) {
  // Auth guard (same pattern as auto-refund)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[CRON:REACTIVATION] CRON_SECRET not configured')
    return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[CRON:REACTIVATION] Unauthorized access attempt', {
      ip: request.headers.get('x-forwarded-for'),
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
  const fortyEightHours = 48 * 60 * 60 * 1000

  // Find users whose last completed order was 14-15 days ago
  // and who have no new order since then
  // and who have emailMarketing = true
  const candidates = await prisma.user.findMany({
    where: {
      emailMarketing: true,
      role: 'CLIENT',
      streakLastOrderAt: {
        gte: fifteenDaysAgo,
        lte: fourteenDaysAgo,
      },
    },
    select: {
      id: true,
      email: true,
      currentDiscountPct: true,
      reactivationDiscountExpiresAt: true,
      orders: {
        where: {
          createdAt: { gte: fourteenDaysAgo },
          status: { not: 'CANCELLED' },
        },
        select: { id: true },
        take: 1,
      },
    },
  })

  let sent = 0
  let skipped = 0

  for (const user of candidates) {
    // Skip if user already created a new order in the window
    if (user.orders.length > 0) {
      skipped++
      continue
    }

    // Skip if a reactivation discount is still active (already sent)
    if (
      user.reactivationDiscountExpiresAt &&
      user.reactivationDiscountExpiresAt > now
    ) {
      skipped++
      continue
    }

    // Get their most recent completed order for context
    const lastOrder = await prisma.order.findFirst({
      where: { userId: user.id, status: 'COMPLETED' },
      orderBy: { updatedAt: 'desc' },
      select: { targetRating: true, gameMode: true },
    })

    if (!lastOrder || lastOrder.targetRating == null) {
      skipped++
      continue
    }

    const currentRating = lastOrder.targetRating
    const gameMode = lastOrder.gameMode?.includes('GC') ? 'GC' : 'PREMIER'
    const nextMilestone = getNextMilestone(currentRating, gameMode)

    if (!nextMilestone) {
      // At max rating — skip reactivation
      skipped++
      continue
    }

    const discountPct = Math.max(user.currentDiscountPct, 0.05) // minimum 5%
    const expiresAt = new Date(now.getTime() + fortyEightHours)

    // Store reactivation discount
    await prisma.user.update({
      where: { id: user.id },
      data: {
        reactivationDiscountPct: discountPct,
        reactivationDiscountExpiresAt: expiresAt,
      },
    })

    // Send email
    await sendReactivationEmail(user.email, {
      currentRating,
      currentRatingLabel: gameMode === 'GC'
        ? `Nível ${currentRating}`
        : `${currentRating.toLocaleString('pt-BR')} pts`,
      nextMilestone,
      nextMilestoneLabel: gameMode === 'GC'
        ? `Nível ${nextMilestone}`
        : `${nextMilestone.toLocaleString('pt-BR')} pts`,
      discountPct,
      discountExpiresAt: expiresAt,
    })

    sent++
  }

  console.log(`[CRON:REACTIVATION] Processed ${candidates.length} candidates: ${sent} sent, ${skipped} skipped`)

  return NextResponse.json({
    success: true,
    processed: candidates.length,
    sent,
    skipped,
  })
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cron/reactivation/route.ts
git commit -m "feat: add reactivation cron job endpoint"
```

---

## Task 9: Register Cron in Vercel Config

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Read the current vercel.json**

Open `vercel.json`. It should have an existing cron for auto-refund (`0 6 * * *`).

- [ ] **Step 2: Add reactivation cron**

Add a new cron entry in the `crons` array (runs daily at 7 AM UTC, offset from auto-refund):

```json
{
  "path": "/api/cron/reactivation",
  "schedule": "0 7 * * *"
}
```

The full `crons` array should look like:

```json
"crons": [
  {
    "path": "/api/cron/auto-refund",
    "schedule": "0 6 * * *"
  },
  {
    "path": "/api/cron/reactivation",
    "schedule": "0 7 * * *"
  }
]
```

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "feat: register reactivation cron in Vercel config"
```

---

## Task 10: Wire `updateUserStreak` + Completion Email in `completeOrder`

**Files:**
- Modify: `src/services/order.service.ts`

This task specifically wires the expanded `sendOrderCompletedEmail` call with retention data.

- [ ] **Step 1: Find the `sendOrderCompletedEmail` call in `completeOrder`**

In `src/services/order.service.ts`, find the existing call to `sendOrderCompletedEmail`. Note what arguments it currently receives.

- [ ] **Step 2: Add retention email imports**

Add to imports at top of file:

```typescript
import { getNextMilestone, calculateProgressPct } from '@/lib/retention'
import { sendReactivationEmail } from '@/lib/email'  // already imported? check
```

- [ ] **Step 3: Update the `sendOrderCompletedEmail` call**

After `streakResult` is available (from Task 4), update the call:

```typescript
const currentRating = order.targetRating ?? 0
const gameMode = order.gameMode?.includes('GC') ? 'GC' : 'PREMIER'
const nextMilestone = getNextMilestone(currentRating, gameMode)
const firstOrderRating = 0  // simplified — use currentRating as start
const progressPct = nextMilestone
  ? calculateProgressPct(currentRating, firstOrderRating, nextMilestone)
  : 100

// Fire completion email with retention block (2 min delay is handled by Resend — just call async)
sendOrderCompletedEmail(
  order.user.email,
  order.id,
  order.service?.name ?? 'Boost CS2',
  {
    currentRating,
    nextMilestone,
    progressPct,
    discountPct: streakResult.newDiscountPct,
    gameMode,
  }
).catch((err) => console.error('[completeOrder] Email error:', err))
```

Note: `order.user.email` — check the actual shape of the order object returned from the Prisma query in `completeOrder`. It may be `order.user?.email` or require adding `user: { select: { email: true } }` to the include.

- [ ] **Step 4: Run build**

```bash
npm run build
```

Expected: No TypeScript errors.

- [ ] **Step 5: Final commit**

```bash
git add src/services/order.service.ts
git commit -m "feat: send expanded retention email on order completion"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Streak discount table (0/5/10/15%) — Task 2 `getStreakDiscount`
- [x] Discount applied at order creation — Task 3
- [x] `discountApplied` / `discountPct` on Order — Task 1 + Task 3
- [x] Streak update on COMPLETED — Task 4
- [x] Streak resets after 30 days — Task 2 `updateUserStreak`
- [x] Discount from platform profit (booster gets original) — enforced by applying discount only to `total`, not commission calculation
- [x] In-app notification updated — Task 4 Step 3
- [x] STREAK_UNLOCK notification — Task 4 Step 4
- [x] Progress bar component — Task 6
- [x] Dashboard integration — Task 7
- [x] Completion email with retention block — Task 5 + Task 10
- [x] Reactivation email 14 days — Task 8
- [x] Cron job with CRON_SECRET guard — Task 8
- [x] `emailMarketing` field — Task 1 (added to User schema)
- [x] `reactivationDiscountPct` / `reactivationDiscountExpiresAt` — Task 1 + Task 8
- [x] vercel.json cron registration — Task 9
- [x] Only fires once per inactivity period — Task 8 (checks `reactivationDiscountExpiresAt`)
- [x] Does not fire if new order created — Task 8 (filters `orders.length > 0`)
- [x] Max rating message — Task 6 (shows "Rating máximo!" + skipped in cron)

**Type consistency:**
- `RetentionProgressProps.completedOrders` uses `CompletedOrderEntry` interface defined in Task 6
- `gameMode: 'PREMIER' | 'GC'` used consistently in `retention.ts` and `RetentionProgress`
- `sendOrderCompletedEmail` optional 4th param matches what Task 10 passes
- `updateUserStreak` returns `{ newStreak, newDiscountPct, leveledUp }` used in Tasks 4 and 10
