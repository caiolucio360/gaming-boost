# Code Review Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 7 issues found during full project code review — 2 critical, 5 important.

**Architecture:** Targeted edits only. No new files needed. Each task is a single file (or two closely coupled files).

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma 7, Tailwind v4, Resend emails.

---

## File Map

| File | Action | Reason |
|------|--------|--------|
| `src/lib/retention.ts` | Modify | Re-export pure functions from `retention-utils` instead of redefining |
| `src/app/api/cron/reactivation/route.ts` | Modify | Eliminate N+1 query; fix `error` → `message` in responses |
| `src/components/common/retention-progress.tsx` | Modify | Anchor progress bar to `0` (same as email) |
| `src/lib/email.ts` | Modify | CTA URLs: `/dashboard` → `/games/cs2` for retention/reactivation emails |
| `src/app/booster/page.tsx` | Modify | Fix grid cols (5→4); remove unused `index` in map callbacks |
| `prisma/schema.prisma` | Modify | Add `@@index([role, emailMarketing, streakLastOrderAt])` on User |

---

## Task 1: Eliminate duplicate function definitions in retention.ts

**Files:**
- Modify: `src/lib/retention.ts`

**Context:** `getNextMilestone`, `isAtMax`, `calculateProgressPct`, `getStreakDiscount` are defined identically in both `retention.ts` and `retention-utils.ts`. If milestone values change in one file, the other diverges silently.

- [ ] **Step 1: Read retention.ts to confirm the duplicates**

Run: `head -45 src/lib/retention.ts`

Expected: Lines 5–41 contain `PREMIER_MILESTONES`, `GC_MILESTONES`, and the 4 pure functions.

- [ ] **Step 2: Replace the duplicated block with re-exports**

In `src/lib/retention.ts`, delete lines 5–41 (the constants and 4 function definitions) and replace with a single re-export line at the top of the file (after `import { prisma } from '@/lib/db'`):

```typescript
import { prisma } from '@/lib/db'

export {
  getNextMilestone,
  isAtMax,
  calculateProgressPct,
  getStreakDiscount,
} from '@/lib/retention-utils'
```

Keep everything from `// ─── Streak updater` onward unchanged.

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: No new TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/retention.ts
git commit -m "refactor: re-export pure functions from retention-utils to eliminate duplication"
```

---

## Task 2: Fix N+1 query and response format in reactivation cron

**Files:**
- Modify: `src/app/api/cron/reactivation/route.ts`

**Context:** The cron currently issues a separate `db.order.findFirst` per candidate user (up to 100 queries). It also uses `{ error: '...' }` in error responses instead of the project standard `{ message: '...' }`.

- [ ] **Step 1: Add `lastCompletedOrder` to the initial findMany select**

Find the `db.user.findMany` call. Add a nested relation inside the `select` block:

```typescript
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
  // Add this:
  completedOrders: {
    where: { status: 'COMPLETED' },
    orderBy: { updatedAt: 'desc' },
    select: { targetRating: true, gameMode: true },
    take: 1,
  },
},
```

Note: `completedOrders` is a relation alias — Prisma uses the actual relation name from schema. The User→Order relation is named `orders`. Use a different `where` filter to avoid conflict. The correct approach with a single relation is to include both filtered sets as separate named sub-relations using `include` syntax, but Prisma `select` doesn't support aliasing. Instead, use two separate `orders` entries — but Prisma doesn't allow duplicate keys.

The cleanest fix: remove the separate `db.order.findFirst` in the loop and instead fetch it via a single `db.order.findMany` call **outside** the loop, grouped by userId, before entering the for loop:

```typescript
// After the candidates query, fetch last completed order for all candidate IDs at once
const candidateIds = candidates.map((u) => u.id)
const lastCompletedOrders = await db.order.findMany({
  where: {
    userId: { in: candidateIds },
    status: 'COMPLETED',
    targetRating: { not: null },
  },
  orderBy: { updatedAt: 'desc' },
  select: { userId: true, targetRating: true, gameMode: true },
  distinct: ['userId'],
})

// Build a lookup map
const lastOrderByUser = new Map(
  lastCompletedOrders.map((o) => [o.userId, o])
)
```

Then inside the loop, replace the `db.order.findFirst` call with:

```typescript
const lastOrder = lastOrderByUser.get(user.id)
```

This reduces N+1 to exactly 2 queries total.

- [ ] **Step 2: Fix error response format**

Find both error responses that use `{ error: '...' }` and change to `{ message: '...' }`:

Line 26: `return NextResponse.json({ message: 'Cron secret not configured' }, { status: 500 })`
Line 35: `return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })`

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: No new TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/cron/reactivation/route.ts
git commit -m "fix: eliminate N+1 query in reactivation cron; use message instead of error in responses"
```

---

## Task 3: Align progress bar anchor between email and component

**Files:**
- Modify: `src/components/common/retention-progress.tsx`

**Context:** The completion email uses `calculateProgressPct(currentRating, 0, nextMilestone)` (anchored at 0). The UI component uses `firstRating` (the user's first ever order rating) as the start. This causes different percentages to be shown in email vs. UI. Standardise both to `0`.

- [ ] **Step 1: Fix the start value in RetentionProgress component**

In `src/components/common/retention-progress.tsx`, find:

```typescript
const firstRating = orders[0].targetRating ?? 0
const progressPct = nextMilestone
  ? calculateProgressPct(currentRating, firstRating, nextMilestone)
  : 100
```

Replace with:

```typescript
const progressPct = nextMilestone
  ? calculateProgressPct(currentRating, 0, nextMilestone)
  : 100
```

Delete the `firstRating` variable — it is no longer used.

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/common/retention-progress.tsx
git commit -m "fix: align progress bar anchor to 0 in component (matches email)"
```

---

## Task 4: Update retention email CTAs to /games/cs2

**Files:**
- Modify: `src/lib/email.ts`

**Context:** The retention block in `sendOrderCompletedEmail` (line ~299) and the `sendReactivationEmail` (lines ~487,495) point to `/dashboard`. The discount is only redeemable during order creation at `/games/cs2`. The route exists (`src/app/games/cs2`).

- [ ] **Step 1: Fix CTA in sendOrderCompletedEmail retention block**

In `src/lib/email.ts`, find the retention block CTA (around line 299):

```typescript
<a href="${appUrl}/dashboard"
```

Change to:

```typescript
<a href="${appUrl}/games/cs2"
```

- [ ] **Step 2: Fix CTA and text fallback in sendReactivationEmail**

Find the reactivation email CTA (around line 487):

```typescript
<a href="${appUrl}/dashboard"
```

Change to:

```typescript
<a href="${appUrl}/games/cs2"
```

Also update the plain-text fallback (line ~495):

```typescript
// Before:
Garanta ${discountLabel}% de desconto em: ${appUrl}/dashboard

// After:
Garanta ${discountLabel}% de desconto em: ${appUrl}/games/cs2
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: No TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/email.ts
git commit -m "fix: point retention email CTAs to /games/cs2 where discount is applied"
```

---

## Task 5: Fix booster dashboard grid and unused variables

**Files:**
- Modify: `src/app/booster/page.tsx`

**Context:** The stats grid declares `lg:grid-cols-5` but only renders 4 cards (the 5th "Ganhos Totais" was removed). Lines 487 and 568 use `(order, index)` in map callbacks but `index` is never read.

- [ ] **Step 1: Fix the grid columns**

In `src/app/booster/page.tsx`, find:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8">
```

Change `lg:grid-cols-5` to `lg:grid-cols-4`:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
```

- [ ] **Step 2: Remove unused index from map callbacks**

Find line 487:
```tsx
{orders.map((order, index) => {
```
Change to:
```tsx
{orders.map((order) => {
```

Find line 568:
```tsx
{orders.map((order, index) => {
```
Change to:
```tsx
{orders.map((order) => {
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: No TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/booster/page.tsx
git commit -m "fix: correct booster dashboard grid to 4 cols; remove unused index variables"
```

---

## Task 6: Add DB index for reactivation cron query

**Files:**
- Modify: `prisma/schema.prisma`

**Context:** The cron queries `User` filtered on `{ role, emailMarketing, streakLastOrderAt }`. No index exists on these fields. At scale this is a full table scan.

- [ ] **Step 1: Add composite index to User model**

In `prisma/schema.prisma`, find the `User` model's `@@index` lines near the bottom of the model. Add:

```prisma
@@index([role, emailMarketing, streakLastOrderAt])
```

- [ ] **Step 2: Push and regenerate**

```bash
npm run db:push && npm run db:generate
```

Expected: Schema synced. Prisma Client regenerated.

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: No TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "perf: add composite index on User(role, emailMarketing, streakLastOrderAt) for cron query"
```

---

## Self-Review

**Spec coverage:**
- [x] Critical: Duplicate functions eliminated (Task 1)
- [x] Critical: N+1 query eliminated (Task 2)
- [x] Important: `error` → `message` in cron responses (Task 2)
- [x] Important: Progress bar anchor unified to 0 (Task 3)
- [x] Important: Email CTAs → `/games/cs2` (Task 4)
- [x] Important: Grid cols 5→4 (Task 5)
- [x] Minor: Unused `index` removed (Task 5)
- [x] Schema: Composite index added (Task 6)

**Not in scope (conscious decisions):**
- `streakLastOrderAt` dual-role → documented in code already; separate field is future work
- `take: 100` pagination cap → acceptable for current scale; tracked in cron file comment
- GC mode in dashboard → acknowledged comment already in code

**Type consistency:**
- Task 2 introduces `lastOrderByUser: Map<number, { userId: number, targetRating: number | null, gameMode: string | null }>` — the `userId` field is selected explicitly to build the map. The loop uses `.get(user.id)` which returns this shape, compatible with the existing `lastOrder` usage below.
- No new exports or changed signatures in any other task.
