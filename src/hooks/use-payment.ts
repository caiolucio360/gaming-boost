/**
 * React Query hook for Payments
 * Provides data fetching and mutations for payment operations
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orderKeys } from './use-orders'
import { api } from '@/lib/api-client'

// Types
interface CreatePixInput {
    orderId: string
    phone: string
    taxId: string
}

interface Payment {
    id: number
    orderId: number
    method: string
    status: string
    total: number
    pixCode?: string
    qrCode?: string
    expiresAt?: string
}

interface CreatePixResponse {
    payment: Payment
    message: string
}

/**
 * Create PIX payment
 */
async function createPixPayment(input: CreatePixInput): Promise<CreatePixResponse> {
    return api.post<CreatePixResponse>('/api/payment/pix', input)
}

/**
 * Hook to create PIX payment
 */
export function useCreatePixPayment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createPixPayment,
        onSuccess: () => {
            // Invalidate orders to refetch with updated payment status
            queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
        },
    })
}
