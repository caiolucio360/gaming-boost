# Skeletons & Loading States Refactor — Design Spec
**Date:** 2026-04-04  
**Status:** Approved

---

## Problem

The project has four loading/skeleton issues:

1. **Duplicate skeleton libraries** — `loading-skeletons.tsx` and `skeletons.tsx` contain nearly identical components, requiring two import paths and causing divergence over time.
2. **Weak shimmer** — The current gradient (`brand-purple/10 via brand-purple/20`) is barely visible. The effect exists but isn't noticeable enough to feel polished.
3. **No stagger animation** — When lists of skeletons appear, all items animate in sync. This looks broken/mechanical. A cascading fadeIn per card creates a smooth, modern feel.
4. **Inline SVG spinners scattered across ~14 files** — Each page manually copies the same `<svg className="animate-spin">` block. No shared component, inconsistent styling.

---

## Solution

Four targeted changes:

### 1. Shimmer refinement (`src/components/ui/skeleton.tsx`)

Change the base `Skeleton` gradient from purple-tinted to a neutral white shimmer with a subtle purple highlight:

```
from-white/5 via-brand-purple/15 to-white/5
```

Keep `bg-[length:200%_100%] animate-shimmer`. The shimmer animation in `globals.css` stays unchanged (1.5s, background-position sweep).

Also change the default border radius from `rounded-md` to `rounded-lg` — matches the card-heavy UI of the project.

Background base color changes from implicit (transparent over parent) to explicit `bg-white/5` so skeletons are visible on any background.

### 2. Stagger animation for list skeletons

Add an optional `index?: number` prop to card-level skeleton components:
- `SkeletonOrderCard`
- `SkeletonStatsCard` / `SkeletonStatsCards` (the grid version)
- `SkeletonList` items
- `SkeletonTableRow` items

When `index` is provided, the outermost wrapper div gets:
```tsx
style={{ animationDelay: `${index * 80}ms` }}
className="animate-fadeInUp opacity-0"
```

`animate-fadeInUp` is already defined in `globals.css`. Add `animation-fill-mode: forwards` to it so the element stays visible after the animation ends (currently it may reset to opacity-0).

List containers (`SkeletonOrdersList`, `StatsGridSkeleton`, etc.) pass `index={i}` to each child skeleton.

### 3. Consolidate skeleton libraries

**Delete:** `src/components/common/loading-skeletons.tsx`

**Keep and expand:** `src/components/common/skeletons.tsx`

Migration map (from `loading-skeletons` → `skeletons`):

| `loading-skeletons` export | Replacement in `skeletons` |
|---|---|
| `OrderCardSkeleton` | `SkeletonOrderCard` (already exists, update to match) |
| `OrdersListSkeleton` | `SkeletonOrdersList` (rename from `SkeletonList` or add new) |
| `StatCardSkeleton` | `SkeletonStatsCard` (already exists) |
| `StatsGridSkeleton` | `SkeletonStatsGrid` (new, replaces grid in both files) |
| `TableSkeleton` | `SkeletonTable` (already exists) |
| `ProfileSkeleton` | `SkeletonProfileCard` (already exists) |
| `FormSkeleton` | `SkeletonForm` (already exists) |
| `PaymentSkeleton` | `SkeletonPaymentCard` (already exists) |
| `PageSkeleton` | `SkeletonPage` (new, replaces both `PageSkeleton` and `SkeletonDashboard`) |
| `CalculatorSkeleton` | `SkeletonCalculatorCard` (already exists) |

**9 files** that import from `loading-skeletons` must update their import to `skeletons`:
- `src/app/admin/page.tsx`
- `src/app/admin/orders/page.tsx`
- `src/app/admin/payments/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/booster/page.tsx`
- `src/app/booster/payments/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/profile/page.tsx`
- `src/components/common/page-loading-wrapper.tsx`

### 4. Unified `Spinner` component (`src/components/common/loading-spinner.tsx`)

Add a new named export `Spinner` to the existing file:

```tsx
const spinnerSizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export function Spinner({
  size = 'sm',
  className,
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <Loader2
      className={cn('animate-spin text-brand-purple', spinnerSizes[size], className)}
      aria-hidden="true"
    />
  )
}
```

**14 files** with inline `<svg className="animate-spin">` blocks replace them with `<Spinner size="sm" />` (or appropriate size). Exact files:

- `src/components/games/cs2-calculator.tsx`
- `src/app/admin/pricing/page.tsx`
- `src/app/admin/payments/page.tsx`
- `src/app/cart/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/booster/payments/page.tsx`
- `src/app/booster/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(dashboard)/notifications/page.tsx`
- `src/app/payment/page.tsx`
- `src/components/payment/pix-payment-display.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`

Files already using the component pattern (`refreshing-banner.tsx`, `button-loading.tsx`, `loading-spinner.tsx`, `status-badge.tsx`) are NOT touched — they already use `Loader2` correctly.

---

## globals.css change

`animate-fadeInUp` needs `animation-fill-mode: forwards` so staggered elements stay visible after their entrance. Find the `@keyframes fadeInUp` / `.animate-fadeInUp` definition and ensure it has `animation-fill-mode: forwards`.

---

## What Does NOT Change

- The shimmer `@keyframes` definition in `globals.css` — only the Tailwind classes applied in `skeleton.tsx` change
- `LoadingSpinner` component API — no breaking changes
- `button-loading.tsx`, `refreshing-banner.tsx` — already well-structured
- All non-loading UI code
- The `SkeletonText`, `SkeletonAvatar`, `SkeletonButton` sub-components in `skeleton.tsx`

---

## Out of Scope

- Converting page-level `LoadingSpinner` to skeletons (pages already use skeletons correctly)
- Sonner toast spinner (`src/components/ui/sonner.tsx`) — third-party, don't touch
