'use client'

import { useState, useCallback } from 'react'

interface UseLoadingOptions {
  initialLoading?: boolean
}

interface UseLoadingReturn {
  loading: boolean
  refreshing: boolean
  setLoading: (loading: boolean) => void
  setRefreshing: (refreshing: boolean) => void
  withLoading: <T>(fn: () => Promise<T>, isRefresh?: boolean) => Promise<T>
}

/**
 * Hook para gerenciar estados de loading de forma consistente
 * 
 * @example
 * const { loading, refreshing, withLoading } = useLoading()
 * 
 * const fetchData = () => withLoading(async () => {
 *   const data = await apiGet('/api/data')
 *   return data
 * })
 */
export function useLoading(options: UseLoadingOptions = {}): UseLoadingReturn {
  const { initialLoading = false } = options
  const [loading, setLoading] = useState(initialLoading)
  const [refreshing, setRefreshing] = useState(false)

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>, isRefresh = false): Promise<T> => {
      try {
        if (isRefresh) {
          setRefreshing(true)
        } else {
          setLoading(true)
        }
        return await fn()
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    []
  )

  return {
    loading,
    refreshing,
    setLoading,
    setRefreshing,
    withLoading,
  }
}

