'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton, SkeletonAvatar, SkeletonButton } from '@/components/ui/skeleton'
import { StatsGrid } from '@/components/common/stats-grid'
import { cn } from '@/lib/utils'

// Stats card skeleton (for dashboard stats)
export function SkeletonStatsCard({ className, index = 0 }: { className?: string; index?: number }) {
  return (
    <Card
      className={cn("animate-fadeInUp opacity-0", className)}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

// Order card skeleton (for order lists)
export function SkeletonOrderCard({ className, index = 0 }: { className?: string; index?: number }) {
  return (
    <Card
      className={cn("animate-fadeInUp opacity-0", className)}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Header: título + descrição + status badge (espelha OrderCardShell/DashboardCard) */}
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      </CardHeader>
      {/* Content: grid de infos (3 col) + linha de ações */}
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <SkeletonButton />
          <SkeletonButton />
        </div>
      </CardContent>
    </Card>
  )
}

// Revenue card skeleton — mirrors the revenue/payment Card on /admin/payments and
// /booster/payments: header (title + description + status badge) and a 3-column grid
// of label/value info items. Keeps layout aligned with the real content (no shift).
export function SkeletonRevenueCard({ className, index = 0 }: { className?: string; index?: number }) {
  return (
    <Card
      className={cn("animate-fadeInUp opacity-0", className)}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// List of revenue cards with stagger — mirrors the `grid gap-4 lg:gap-6` wrapper.
export function SkeletonRevenueList({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRevenueCard key={i} index={i} />
      ))}
    </div>
  )
}

// User card skeleton — mirrors the user Card on /admin/users: left text block
// (name + role badge, email, meta line) and a right-side action button row.
export function SkeletonUserCard({ className, index = 0 }: { className?: string; index?: number }) {
  return (
    <Card
      className={cn("animate-fadeInUp opacity-0", className)}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <SkeletonButton size="sm" />
            <SkeletonButton size="sm" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// List of user cards with stagger — mirrors the `grid gap-4` wrapper on /admin/users.
export function SkeletonUserList({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonUserCard key={i} index={i} />
      ))}
    </div>
  )
}

// Table skeleton (for admin tables)
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div className={cn("w-full overflow-hidden rounded-lg border border-border", className)}>
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={cn(
            "px-4 py-3 flex items-center gap-4",
            rowIndex !== rows - 1 && "border-b border-border"
          )}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn(
                "h-4 flex-1",
                colIndex === 0 && "max-w-[120px]"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// Profile card skeleton
export function SkeletonProfileCard({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <SkeletonAvatar size="lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Profile page skeleton — mirrors the "Informações da Conta" + "Alterar Senha" form cards and
// the save/cancel button row on /profile. (The avatar-style SkeletonProfileCard above doesn't
// match that layout; use this on the profile page.)
export function SkeletonProfileForm() {
  const fieldRows = (n: number) =>
    Array.from({ length: n }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    ))

  return (
    <div className="grid gap-6">
      {/* Account info card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          {fieldRows(3)}
          <div className="border-t border-border" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Change password card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">{fieldRows(3)}</CardContent>
      </Card>

      {/* Save / cancel buttons */}
      <div className="flex justify-end gap-4">
        <SkeletonButton />
        <SkeletonButton />
      </div>
    </div>
  )
}

// Payment/PIX card skeleton
export function SkeletonPaymentCard({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="text-center pb-2">
        <Skeleton className="h-7 w-48 mx-auto" />
        <Skeleton className="h-5 w-32 mx-auto mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status badge */}
        <div className="flex justify-center">
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>
        {/* Timer */}
        <div className="flex justify-center">
          <Skeleton className="h-5 w-32" />
        </div>
        {/* QR Code */}
        <div className="flex justify-center">
          <Skeleton className="w-48 h-48 md:w-64 md:h-64 rounded-xl" />
        </div>
        {/* Copy code section */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-40 mx-auto" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <SkeletonButton size="lg" className="w-full" />
        </div>
        {/* Verify button */}
        <SkeletonButton size="default" className="w-full" />
      </CardContent>
    </Card>
  )
}

// Calculator/service card skeleton
export function SkeletonCalculatorCard({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <Skeleton className="h-8 w-56 mx-auto" />
        <Skeleton className="h-4 w-72 mx-auto mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 justify-center">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        {/* Sliders/inputs */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
        {/* Price display */}
        <div className="bg-card rounded-lg p-4 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-32" />
        </div>
        {/* CTA Button */}
        <SkeletonButton size="lg" className="w-full" />
      </CardContent>
    </Card>
  )
}

// Form skeleton
export function SkeletonForm({
  fields = 3,
  className,
}: {
  fields?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <SkeletonButton size="lg" className="w-full mt-6" />
    </div>
  )
}

// Dashboard page skeleton
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
      </div>
      {/* Orders section */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-32" />
        <SkeletonOrderCard />
        <SkeletonOrderCard />
        <SkeletonOrderCard />
      </div>
    </div>
  )
}

// Admin dashboard skeleton
export function SkeletonAdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
      </div>
      {/* Table section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-7 w-40" />
          <SkeletonButton />
        </div>
        <SkeletonTable rows={5} columns={5} />
      </div>
    </div>
  )
}

// Chart card skeleton — header (title + description) plus a chart-area block.
// `height` mirrors the real ResponsiveContainer height so layout doesn't shift.
export function SkeletonChart({
  height = 220,
  className,
  index = 0,
}: {
  height?: number
  className?: string
  index?: number
}) {
  return (
    <Card
      className={cn("animate-fadeInUp opacity-0", className)}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full rounded-lg" style={{ height }} />
      </CardContent>
    </Card>
  )
}

// Admin charts skeleton — mirrors the chart grid on /admin (area chart, bar + donut row,
// users bar chart) so the loading state lines up with the real content.
export function SkeletonAdminCharts() {
  return (
    <div className="space-y-6">
      {/* Revenue area chart */}
      <SkeletonChart height={220} index={0} />

      {/* Orders bar + status donut row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart height={200} index={1} />

        {/* Status donut */}
        <Card className="animate-fadeInUp opacity-0" style={{ animationDelay: '120ms' }}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-[55%] flex justify-center">
                <Skeleton className="h-40 w-40 rounded-full" />
              </div>
              <div className="flex-1 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="h-2.5 w-2.5 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-4 w-6" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New users bar chart */}
      <SkeletonChart height={180} index={3} />
    </div>
  )
}

// List skeleton with configurable items
export function SkeletonList({
  items = 3,
  className,
}: {
  items?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border"
        >
          <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      ))}
    </div>
  )
}

// Grid of stats cards with stagger — mirrors the real StatsGrid layout so the
// skeleton lines up with the content it replaces (no layout shift).
export function SkeletonStatsGrid({ count = 4, columns }: { count?: number; columns?: 2 | 3 | 4 | 5 }) {
  const cols = columns ?? (Math.min(Math.max(count, 2), 5) as 2 | 3 | 4 | 5)
  return (
    <StatsGrid columns={cols}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatsCard key={i} index={i} />
      ))}
    </StatsGrid>
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
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
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
