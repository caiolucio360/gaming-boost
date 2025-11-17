'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * Skeleton para card de pedido/order
 */
export function OrderCardSkeleton() {
  return (
    <Card className="bg-black/30 backdrop-blur-md border-purple-500/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-20" />
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
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
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
    <Card className="bg-black/30 backdrop-blur-md border-purple-500/50">
      <CardContent className="pt-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
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
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-10 w-full" />
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
    <Card className="bg-black/30 backdrop-blur-md border-purple-500/50">
      <CardHeader>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton para página completa
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 bg-purple-500/20" />
          <Skeleton className="h-4 w-96 bg-purple-500/10" />
        </div>
        <StatsGridSkeleton count={4} />
        <OrdersListSkeleton count={3} />
      </div>
    </div>
  )
}

