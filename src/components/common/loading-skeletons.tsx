'use client'

import { Skeleton, SkeletonButton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * Skeleton para card de pedido/order
 */
export function OrderCardSkeleton() {
  return (
    <Card className="bg-brand-black-light/30 backdrop-blur-md border-brand-purple/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-6 w-40" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <SkeletonButton size="default" className="w-full md:w-auto" />
            <SkeletonButton size="default" className="w-full md:w-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton para lista de pedidos
 */
export function OrdersListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton para card de estatísticas
 */
export function StatCardSkeleton() {
  return (
    <Card className="bg-brand-black-light/30 backdrop-blur-md border-brand-purple/50">
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

/**
 * Skeleton para grid de estatísticas
 */
export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton para tabela
 */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-brand-purple/50">
      {/* Header */}
      <div className="bg-brand-black-light border-b border-brand-purple/30 px-4 py-3">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={`px-4 py-3 grid gap-4 ${rowIndex !== rows - 1 ? 'border-b border-brand-purple/20' : ''}`}
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-6 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton para perfil de usuário
 */
export function ProfileSkeleton() {
  return (
    <Card className="bg-brand-black-light/30 backdrop-blur-md border-brand-purple/50">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <SkeletonButton size="lg" className="w-full mt-2" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton para formulário
 */
export function FormSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <SkeletonButton size="lg" className="w-full mt-2" />
    </div>
  )
}

/**
 * Skeleton para card de pagamento PIX
 */
export function PaymentSkeleton() {
  return (
    <Card className="bg-brand-black-light/30 backdrop-blur-md border-brand-purple/50">
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

/**
 * Skeleton para página completa
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-brand-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <StatsGridSkeleton count={4} />
        <OrdersListSkeleton count={3} />
      </div>
    </div>
  )
}

/**
 * Skeleton para card de calculadora/serviço
 */
export function CalculatorSkeleton() {
  return (
    <Card className="bg-brand-black-light/30 backdrop-blur-md border-brand-purple/50">
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
        <div className="bg-brand-black-light rounded-lg p-4 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-32" />
        </div>
        {/* CTA Button */}
        <SkeletonButton size="lg" className="w-full" />
      </CardContent>
    </Card>
  )
}

