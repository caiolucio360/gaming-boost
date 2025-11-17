'use client'

import { ReactNode } from 'react'
import { LoadingSpinner } from './loading-spinner'
import { PageSkeleton } from './loading-skeletons'

interface PageLoadingWrapperProps {
  loading: boolean
  children: ReactNode
  useSkeleton?: boolean
  skeletonType?: 'page' | 'orders' | 'stats' | 'profile' | 'table'
  skeletonCount?: number
}

/**
 * Wrapper para páginas que gerencia loading de forma consistente
 * 
 * @example
 * <PageLoadingWrapper loading={loading} useSkeleton skeletonType="orders">
 *   <OrdersList orders={orders} />
 * </PageLoadingWrapper>
 */
export function PageLoadingWrapper({
  loading,
  children,
  useSkeleton = false,
  skeletonType = 'page',
  skeletonCount = 3,
}: PageLoadingWrapperProps) {
  if (loading) {
    if (useSkeleton) {
      // Para carregamento inicial, usar skeleton específico
      switch (skeletonType) {
        case 'orders':
          return <>{/* OrdersListSkeleton será renderizado inline */}</>
        case 'stats':
          return <>{/* StatsGridSkeleton será renderizado inline */}</>
        case 'profile':
          return <>{/* ProfileSkeleton será renderizado inline */}</>
        case 'table':
          return <>{/* TableSkeleton será renderizado inline */}</>
        default:
          return <PageSkeleton />
      }
    }
    return <LoadingSpinner />
  }

  return <>{children}</>
}

