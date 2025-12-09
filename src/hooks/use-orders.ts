/**
 * React Query hooks for Orders
 * Provides data fetching and mutations for order operations
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Types
interface Order {
    id: number
    status: string
    total: number
    serviceId?: number
    createdAt?: string
    service?: {
        id: number
        name: string
    }
}

interface CreateOrderInput {
    serviceId: number
    total: number
    currentRank?: string
    targetRank?: string
    gameMode?: string
    notes?: string
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
    const response = await fetch('/api/orders', {
        credentials: 'include',
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao buscar pedidos')
    }

    return response.json()
}

/**
 * Create a new order
 */
async function createOrder(input: CreateOrderInput): Promise<CreateOrderResponse> {
    const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao criar pedido')
    }

    return response.json()
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
