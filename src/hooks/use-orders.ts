/**
 * React Query hooks for Orders
 * Provides data fetching and mutations for order operations
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

// Types
interface Order {
    id: number
    status: string
    total: number
    game?: string
    gameMode?: string
    currentRank?: string
    targetRank?: string
    createdAt?: string
}

interface CreateOrderInput {
    game?: 'CS2'
    total: number
    currentRank?: string
    targetRank?: string
    gameMode?: string
}

interface OrdersResponse {
    orders: Order[]
}

interface CreateOrderResponse {
    order: Order
    message: string
}

// Query Keys
export const orderKeys = {
    all: ['orders'] as const,
    lists: () => [...orderKeys.all, 'list'] as const,
    list: (filters: string) => [...orderKeys.lists(), filters] as const,
    details: () => [...orderKeys.all, 'detail'] as const,
    detail: (id: number) => [...orderKeys.details(), id] as const,
}

/**
 * Fetch orders for current user
 */
async function fetchOrders(): Promise<OrdersResponse> {
    return api.get<OrdersResponse>('/api/orders')
}

/**
 * Create a new order
 */
async function createOrder(input: CreateOrderInput): Promise<CreateOrderResponse> {
    return api.post<CreateOrderResponse>('/api/orders', input)
}

/**
 * Hook to fetch user orders
 */
export function useOrders() {
    const query = useQuery({
        queryKey: orderKeys.lists(),
        queryFn: fetchOrders,
    })

    return {
        orders: query.data?.orders,
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    }
}

/**
 * Hook to create a new order
 */
export function useCreateOrder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createOrder,
        onSuccess: () => {
            // Invalidate orders list to refetch
            queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
        },
    })
}
