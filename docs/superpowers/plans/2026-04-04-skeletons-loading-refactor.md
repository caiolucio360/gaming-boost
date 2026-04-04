# Skeletons & Loading States Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize all skeleton and loading states — refined shimmer, stagger animation on lists, unified Spinner component, and one consolidated skeleton library.

**Architecture:** Four layers of change applied in dependency order: (1) fix globals.css animation, (2) refine base Skeleton, (3) add Spinner + expand skeletons.tsx, (4) migrate all consumers. No logic changes — pure visual/consistency refactor.

**Tech Stack:** Next.js 15 App Router, React, TypeScript, Tailwind CSS v4, lucide-react

---

## File Map

| File | Change |
|------|--------|
| `src/app/globals.css` | Fix `.animate-fadeInUp` to actually run animation + remove duplicate keyframes |
| `src/components/ui/skeleton.tsx` | Refined shimmer gradient + `rounded-lg` default |
| `src/components/common/loading-spinner.tsx` | Add `Spinner` named export |
| `src/components/common/skeletons.tsx` | Add stagger props + new list containers + missing exports |
| `src/components/common/loading-skeletons.tsx` | **Delete** |
| `src/app/admin/page.tsx` | Update import |
| `src/app/admin/orders/page.tsx` | Update import |
| `src/app/admin/payments/page.tsx` | Update import |
| `src/app/admin/users/page.tsx` | Update import + rename `cols` → `columns` |
| `src/app/booster/page.tsx` | Update import |
| `src/app/booster/payments/page.tsx` | Update import |
| `src/app/dashboard/page.tsx` | Update import |
| `src/app/profile/page.tsx` | Update import |
| `src/components/common/page-loading-wrapper.tsx` | Update import |
| `src/components/games/cs2-calculator.tsx` | Replace 3× inline SVG spinner |
| `src/app/admin/pricing/page.tsx` | Replace inline SVG spinners |
| `src/app/admin/payments/page.tsx` | Replace inline SVG spinners |
| `src/app/cart/page.tsx` | Replace inline SVG spinners |
| `src/app/admin/users/page.tsx` | Replace inline SVG spinners |
| `src/app/booster/payments/page.tsx` | Replace inline SVG spinners |
| `src/app/booster/page.tsx` | Replace inline SVG spinners |
| `src/app/(auth)/login/page.tsx` | Replace inline SVG spinner |
| `src/app/(dashboard)/notifications/page.tsx` | Replace inline SVG spinner |
| `src/app/payment/page.tsx` | Replace inline SVG spinners |
| `src/components/payment/pix-payment-display.tsx` | Replace inline SVG spinners |
| `src/app/(auth)/reset-password/page.tsx` | Replace inline SVG spinner |
| `src/app/(auth)/register/page.tsx` | Replace inline SVG spinner |
| `src/app/(auth)/forgot-password/page.tsx` | Replace inline SVG spinner |

---

### Task 1: Fix `animate-fadeInUp` in globals.css

**Files:**
- Modify: `src/app/globals.css`

The `.animate-fadeInUp` class currently only sets `opacity: 1` (broken — the animation never runs). Fix it to actually run the animation. Also remove the duplicate `@keyframes fadeInUp` definition at the bottom of the file.

- [ ] **Step 1: Fix `.animate-fadeInUp` class**

  Find:
  ```css
  .animate-fadeInUp {
    opacity: 1;
  }
  ```
  Replace with:
  ```css
  .animate-fadeInUp {
    animation: fadeInUp 0.4s ease-out forwards;
  }
  ```

- [ ] **Step 2: Remove duplicate `@keyframes fadeInUp`**

  There are two `@keyframes fadeInUp` definitions — one around line 168 and one around line 512. Delete the second one (the one near line 512, just before the `/* Loading shimmer for skeleton states */` comment):
  ```css
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  ```
  Keep the first definition (around line 168). Only delete the duplicate.

- [ ] **Step 3: Verify build passes**

  Run: `npm run build`

  Expected: Zero TypeScript errors. Build completes.

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/globals.css
  git commit -m "fix: animate-fadeInUp now runs animation with forwards fill mode"
  ```

---

### Task 2: Refine base Skeleton component

**Files:**
- Modify: `src/components/ui/skeleton.tsx`

- [ ] **Step 1: Update the Skeleton component**

  Replace the entire file content with:

  ```tsx
  import { cn } from "@/lib/utils"

  function Skeleton({
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) {
    return (
      <div
        className={cn(
          "rounded-lg bg-gradient-to-r from-white/5 via-brand-purple/15 to-white/5 bg-[length:200%_100%] animate-shimmer",
          className
        )}
        {...props}
      />
    )
  }

  // Specialized skeleton for text lines
  function SkeletonText({
    lines = 1,
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
    return (
      <div className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "h-4",
              i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
            )}
          />
        ))}
      </div>
    )
  }

  // Skeleton for avatar/profile images
  function SkeletonAvatar({
    size = "md",
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    size?: "sm" | "md" | "lg"
  }) {
    const sizeClasses = {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-16 w-16",
    }

    return (
      <Skeleton
        className={cn("rounded-full", sizeClasses[size], className)}
        {...props}
      />
    )
  }

  // Skeleton for buttons
  function SkeletonButton({
    size = "default",
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    size?: "sm" | "default" | "lg"
  }) {
    const sizeClasses = {
      sm: "h-8 w-20",
      default: "h-10 w-24",
      lg: "h-12 w-32",
    }

    return (
      <Skeleton
        className={cn("rounded-lg", sizeClasses[size], className)}
        {...props}
      />
    )
  }

  export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton }
  ```

  Key changes from current: gradient is `from-white/5 via-brand-purple/15 to-white/5`, default radius is `rounded-lg` (was `rounded-md`).

- [ ] **Step 2: Verify build passes**

  Run: `npm run build`

  Expected: Zero TypeScript errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/ui/skeleton.tsx
  git commit -m "refactor: refined shimmer gradient and rounded-lg default on Skeleton"
  ```

---

### Task 3: Add `Spinner` component to loading-spinner.tsx

**Files:**
- Modify: `src/components/common/loading-spinner.tsx`

- [ ] **Step 1: Add the Spinner export**

  Open the file. At the top, the imports already include `Loader2` from `lucide-react` and `cn` from `@/lib/utils`.

  Add the `spinnerSizes` map and `Spinner` component **before** the `LoadingSpinner` function. Find the line:
  ```tsx
  const sizeClasses = {
  ```
  And insert immediately before it:
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

- [ ] **Step 2: Verify build passes**

  Run: `npm run build`

  Expected: Zero errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/common/loading-spinner.tsx
  git commit -m "feat: add Spinner component to loading-spinner.tsx"
  ```

---

### Task 4: Expand skeletons.tsx — stagger + new exports

**Files:**
- Modify: `src/components/common/skeletons.tsx`
- Delete: `src/components/common/loading-skeletons.tsx`

This task adds `index` stagger props to existing card skeletons, adds the missing list container exports (`SkeletonOrdersList`, `SkeletonStatsGrid`, `SkeletonPage`), and aligns with the naming used by importing files.

- [ ] **Step 1: Update SkeletonStatsCard to support stagger**

  Find:
  ```tsx
  export function SkeletonStatsCard({ className }: { className?: string }) {
    return (
      <Card className={cn("bg-brand-black-light/30 backdrop-blur-md border-brand-purple/50", className)}>
  ```
  Replace with:
  ```tsx
  export function SkeletonStatsCard({ className, index = 0 }: { className?: string; index?: number }) {
    return (
      <Card
        className={cn("bg-brand-black-light/30 backdrop-blur-md border-brand-purple/50 animate-fadeInUp opacity-0", className)}
        style={{ animationDelay: `${index * 60}ms` }}
      >
  ```

- [ ] **Step 2: Update SkeletonOrderCard to support stagger**

  Find:
  ```tsx
  export function SkeletonOrderCard({ className }: { className?: string }) {
    return (
      <Card className={cn("bg-brand-black-light/30 backdrop-blur-md border-brand-purple/50", className)}>
  ```
  Replace with:
  ```tsx
  export function SkeletonOrderCard({ className, index = 0 }: { className?: string; index?: number }) {
    return (
      <Card
        className={cn("bg-brand-black-light/30 backdrop-blur-md border-brand-purple/50 animate-fadeInUp opacity-0", className)}
        style={{ animationDelay: `${index * 80}ms` }}
      >
  ```

- [ ] **Step 3: Add missing list container exports**

  At the end of `src/components/common/skeletons.tsx`, add these new exports:

  ```tsx
  // Grid of stats cards with stagger
  export function SkeletonStatsGrid({ count = 4 }: { count?: number }) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonStatsCard key={i} index={i} />
        ))}
      </div>
    )
  }

  // List of order cards with stagger
  export function SkeletonOrdersList({ count = 3 }: { count?: number }) {
    return (
      <div className="grid gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonOrderCard key={i} index={i} />
        ))}
      </div>
    )
  }

  // Full page skeleton (stats grid + orders list)
  export function SkeletonPage() {
    return (
      <div className="min-h-screen bg-brand-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <SkeletonStatsGrid count={4} />
          <SkeletonOrdersList count={3} />
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 4: Delete loading-skeletons.tsx**

  ```bash
  git rm src/components/common/loading-skeletons.tsx
  ```

- [ ] **Step 5: Verify build — expect import errors**

  Run: `npm run build`

  Expected: Build **fails** with "Cannot find module '@/components/common/loading-skeletons'" errors in 9 files. That's correct — Task 5 fixes those.

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/common/skeletons.tsx
  git commit -m "refactor: stagger animation + consolidated list exports in skeletons.tsx, delete loading-skeletons.tsx"
  ```

---

### Task 5: Update all loading-skeletons imports to skeletons

**Files:**
- Modify: 9 files listed below

For each file, find the import from `loading-skeletons` and replace with the equivalent from `skeletons`. The naming mapping is:

| Old name | New name |
|---|---|
| `StatsGridSkeleton` | `SkeletonStatsGrid` |
| `OrdersListSkeleton` | `SkeletonOrdersList` |
| `TableSkeleton` | `SkeletonTable` |
| `ProfileSkeleton` | `SkeletonProfileCard` |
| `PageSkeleton` | `SkeletonPage` |

Apply JSX rename too (all usages, not just the import line).

- [ ] **Step 1: Update `src/app/admin/page.tsx`**

  Find:
  ```tsx
  import { StatsGridSkeleton } from '@/components/common/loading-skeletons'
  ```
  Replace with:
  ```tsx
  import { SkeletonStatsGrid } from '@/components/common/skeletons'
  ```
  Find in JSX: `<StatsGridSkeleton count={4} />`
  Replace with: `<SkeletonStatsGrid count={4} />`

- [ ] **Step 2: Update `src/app/admin/orders/page.tsx`**

  Find:
  ```tsx
  import { OrdersListSkeleton } from '@/components/common/loading-skeletons'
  ```
  Replace with:
  ```tsx
  import { SkeletonOrdersList } from '@/components/common/skeletons'
  ```
  Find in JSX: `<OrdersListSkeleton count={5} />`
  Replace with: `<SkeletonOrdersList count={5} />`

- [ ] **Step 3: Update `src/app/admin/payments/page.tsx`**

  Find:
  ```tsx
  import { OrdersListSkeleton, StatsGridSkeleton } from '@/components/common/loading-skeletons'
  ```
  Replace with:
  ```tsx
  import { SkeletonOrdersList, SkeletonStatsGrid } from '@/components/common/skeletons'
  ```
  Find all JSX: `<StatsGridSkeleton count={5} />` → `<SkeletonStatsGrid count={5} />`
  Find all JSX: `<OrdersListSkeleton count={3} />` → `<SkeletonOrdersList count={3} />`

- [ ] **Step 4: Update `src/app/admin/users/page.tsx`**

  Find:
  ```tsx
  import { TableSkeleton } from '@/components/common/loading-skeletons'
  ```
  Replace with:
  ```tsx
  import { SkeletonTable } from '@/components/common/skeletons'
  ```
  Find in JSX: `<TableSkeleton rows={8} cols={5} />`
  Replace with: `<SkeletonTable rows={8} columns={5} />`
  (Note: `cols` → `columns` — the prop name changed)

- [ ] **Step 5: Update `src/app/booster/page.tsx`**

  Find:
  ```tsx
  import { OrdersListSkeleton, StatsGridSkeleton } from '@/components/common/loading-skeletons'
  ```
  Replace with:
  ```tsx
  import { SkeletonOrdersList, SkeletonStatsGrid } from '@/components/common/skeletons'
  ```
  Replace all JSX: `StatsGridSkeleton` → `SkeletonStatsGrid`, `OrdersListSkeleton` → `SkeletonOrdersList`

- [ ] **Step 6: Update `src/app/booster/payments/page.tsx`**

  Find:
  ```tsx
  import { OrdersListSkeleton, StatsGridSkeleton } from '@/components/common/loading-skeletons'
  ```
  Replace with:
  ```tsx
  import { SkeletonOrdersList, SkeletonStatsGrid } from '@/components/common/skeletons'
  ```
  Replace all JSX: `StatsGridSkeleton` → `SkeletonStatsGrid`, `OrdersListSkeleton` → `SkeletonOrdersList`

- [ ] **Step 7: Update `src/app/dashboard/page.tsx`**

  Find:
  ```tsx
  import { OrdersListSkeleton } from '@/components/common/loading-skeletons'
  ```
  Replace with:
  ```tsx
  import { SkeletonOrdersList } from '@/components/common/skeletons'
  ```
  Find in JSX: `<OrdersListSkeleton count={3} />`
  Replace with: `<SkeletonOrdersList count={3} />`

- [ ] **Step 8: Update `src/app/profile/page.tsx`**

  Find:
  ```tsx
  import { ProfileSkeleton } from '@/components/common/loading-skeletons'
  ```
  Replace with:
  ```tsx
  import { SkeletonProfileCard } from '@/components/common/skeletons'
  ```
  Find in JSX: `<ProfileSkeleton />`
  Replace with: `<SkeletonProfileCard />`

- [ ] **Step 9: Update `src/components/common/page-loading-wrapper.tsx`**

  Find:
  ```tsx
  import { PageSkeleton } from './loading-skeletons'
  ```
  Replace with:
  ```tsx
  import { SkeletonPage } from './skeletons'
  ```
  Find in JSX: `<PageSkeleton />`
  Replace with: `<SkeletonPage />`

- [ ] **Step 10: Verify build passes**

  Run: `npm run build`

  Expected: Zero TypeScript errors. All import errors from Task 4 are now resolved.

- [ ] **Step 11: Commit**

  ```bash
  git add src/app/admin/page.tsx src/app/admin/orders/page.tsx src/app/admin/payments/page.tsx src/app/admin/users/page.tsx src/app/booster/page.tsx src/app/booster/payments/page.tsx src/app/dashboard/page.tsx src/app/profile/page.tsx src/components/common/page-loading-wrapper.tsx
  git commit -m "refactor: migrate all loading-skeletons imports to skeletons"
  ```

---

### Task 6: Replace all inline SVG spinners

**Files:**
- Modify: 14 files listed below

Every inline SVG spinner in the codebase follows this pattern (with minor size variations):
```tsx
<svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>
```

Replace with `<Spinner size="md" />` (or `size="sm"` if the svg had `h-4 w-4`, `size="lg"` if `h-8 w-8`).

**Import to add** to each file that doesn't already have it:
```tsx
import { Spinner } from '@/components/common/loading-spinner'
```

Apply to each file below. Read the file, find all SVG spinner blocks, replace with `<Spinner>`, add the import if missing.

- [ ] **Step 1: `src/components/games/cs2-calculator.tsx`**

  Has 3 inline SVGs (isCalculating spinner, isLoading spinner in price box, isLoading spinner in hire button). All are `h-5 w-5` → `<Spinner size="md" />`.

  Add import: `import { Spinner } from '@/components/common/loading-spinner'`

- [ ] **Step 2: `src/app/admin/pricing/page.tsx`**

  Find all inline `<svg className="animate-spin...">` blocks. Replace each with `<Spinner size="md" />`.
  Add import.

- [ ] **Step 3: `src/app/admin/payments/page.tsx`**

  Same pattern. Replace + add import.

- [ ] **Step 4: `src/app/cart/page.tsx`**

  Same pattern. Replace + add import.

- [ ] **Step 5: `src/app/admin/users/page.tsx`**

  Same pattern. Replace + add import.

- [ ] **Step 6: `src/app/booster/payments/page.tsx`**

  Same pattern. Replace + add import.

- [ ] **Step 7: `src/app/booster/page.tsx`**

  Same pattern. Replace + add import.

- [ ] **Step 8: `src/app/(auth)/login/page.tsx`**

  Find the form submit spinner. Replace with `<Spinner size="md" />`. Add import.

- [ ] **Step 9: `src/app/(dashboard)/notifications/page.tsx`**

  Replace + add import.

- [ ] **Step 10: `src/app/payment/page.tsx`**

  Replace + add import.

- [ ] **Step 11: `src/components/payment/pix-payment-display.tsx`**

  Replace + add import.

- [ ] **Step 12: `src/app/(auth)/reset-password/page.tsx`**

  Replace + add import.

- [ ] **Step 13: `src/app/(auth)/register/page.tsx`**

  Replace + add import.

- [ ] **Step 14: `src/app/(auth)/forgot-password/page.tsx`**

  Replace + add import.

- [ ] **Step 15: Verify build passes**

  Run: `npm run build`

  Expected: Zero TypeScript errors. No "Cannot find name 'svg'" or missing import errors.

- [ ] **Step 16: Commit**

  ```bash
  git add \
    src/components/games/cs2-calculator.tsx \
    src/app/admin/pricing/page.tsx \
    src/app/admin/payments/page.tsx \
    src/app/cart/page.tsx \
    src/app/admin/users/page.tsx \
    src/app/booster/payments/page.tsx \
    src/app/booster/page.tsx \
    "src/app/(auth)/login/page.tsx" \
    "src/app/(dashboard)/notifications/page.tsx" \
    src/app/payment/page.tsx \
    src/components/payment/pix-payment-display.tsx \
    "src/app/(auth)/reset-password/page.tsx" \
    "src/app/(auth)/register/page.tsx" \
    "src/app/(auth)/forgot-password/page.tsx"
  git commit -m "refactor: replace all inline SVG spinners with Spinner component"
  ```
