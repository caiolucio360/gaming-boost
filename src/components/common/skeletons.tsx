'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Stats card skeleton (for dashboard stats)
export function SkeletonStatsCard({ className }: { className?: string }) {
  return (
    <Card className={cn("bg-surface-card/30 backdrop-blur-md border-border-ds-brand/50", className)}>
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
export function SkeletonOrderCard({ className }: { className?: string }) {
  return (
    <Card className={cn("bg-surface-card/30 backdrop-blur-md border-border-ds-brand/50", className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-6 w-24" />
            <SkeletonButton size="sm" />
          </div>
        </div>
      </CardContent>
    </Card>
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
    <div className={cn("w-full overflow-hidden rounded-lg border border-border-ds-brand/50", className)}>
      {/* Header */}
      <div className="bg-surface-subtle border-b border-border-ds-brand/30 px-4 py-3">
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
            rowIndex !== rows - 1 && "border-b border-border-ds-brand/20"
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
    <Card className={cn("bg-surface-card/30 backdrop-blur-md border-border-ds-brand/50", className)}>
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

// Payment/PIX card skeleton
export function SkeletonPaymentCard({ className }: { className?: string }) {
  return (
    <Card className={cn("bg-surface-card/30 backdrop-blur-md border-border-ds-brand/50", className)}>
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
    <Card className={cn("bg-surface-card/30 backdrop-blur-md border-border-ds-brand/50", className)}>
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
        <div className="bg-surface-subtle rounded-lg p-4 space-y-2">
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
          className="flex items-center gap-4 p-4 rounded-lg bg-surface-card/30 border border-border-ds-brand/30"
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
