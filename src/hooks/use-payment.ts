/**
 * React Query hook for Payments
 * Provides data fetching and mutations for payment operations
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orderKeys } from './use-orders'

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
    const response = await fetch('/api/payment/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao gerar PIX')
    }

    return response.json()
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
