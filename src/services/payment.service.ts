/**
 * Payment Service
 * Contains business logic for payment processing
 */

import { prisma } from '@/lib/db'
import type { CreatePixInput } from '@/schemas/payment'

type PaymentResult<T> =
    | { success: true; payment: T }
    | { success: false; error: string }

interface CreatePaymentInput extends CreatePixInput {
    total: number
    userId: number
}

/**
 * PaymentService handles all payment-related business logic
 */
export const PaymentService = {
    /**
     * Calculate commission split between booster and platform
     */
    calculateCommission(orderTotal: number, commissionRate: number = 0.70) {
        const boosterAmount = orderTotal * commissionRate
        const platformFee = orderTotal * (1 - commissionRate)

        return {
            boosterAmount: Math.round(boosterAmount * 100) / 100,
            platformFee: Math.round(platformFee * 100) / 100,
            total: orderTotal,
        }
    },

    /**
     * Validate payment status transition
     */
    canTransitionStatus(from: string, to: string): boolean {
        const validTransitions: Record<string, string[]> = {
            PENDING: ['PAID', 'EXPIRED', 'CANCELLED'],
            PAID: ['REFUNDED'],
            EXPIRED: [],
            REFUNDED: [],
            CANCELLED: [],
        }

        return validTransitions[from]?.includes(to) ?? false
    },

    /**
     * Get payment by ID
     */
    async getPaymentById(paymentId: number) {
        return prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                order: {
                    select: { id: true, status: true, total: true },
                },
            },
        })
    },

    /**
     * Get payments for an order
     */
    async getPaymentsByOrderId(orderId: number) {
        return prisma.payment.findMany({
            where: { orderId },
            orderBy: { createdAt: 'desc' },
        })
    },

    /**
     * Create a new payment record
     */
    async createPayment(input: CreatePaymentInput): Promise<PaymentResult<unknown>> {
        const { orderId, total, userId } = input

        // Verify order exists and belongs to user
        const order = await prisma.order.findUnique({
            where: { id: parseInt(orderId) },
        })

        if (!order) {
            return { success: false, error: 'Pedido não encontrado' }
        }

        if (order.userId !== userId) {
            return { success: false, error: 'Pedido não pertence ao usuário' }
        }

        // Create payment record
        const payment = await prisma.payment.create({
            data: {
                orderId: parseInt(orderId),
                total,
                status: 'PENDING',
                method: 'PIX',
            },
        })

        return { success: true, payment }
    },

    /**
     * Update payment status
     */
    async updatePaymentStatus(
        paymentId: number,
        status: string
    ): Promise<PaymentResult<unknown>> {
        const existingPayment = await prisma.payment.findUnique({
            where: { id: paymentId },
        })

        if (!existingPayment) {
            return { success: false, error: 'Pagamento não encontrado' }
        }

        if (!this.canTransitionStatus(existingPayment.status, status)) {
            return {
                success: false,
                error: `Transição de ${existingPayment.status} para ${status} não permitida`
            }
        }

        const payment = await prisma.payment.update({
            where: { id: paymentId },
            data: { status },
        })

        return { success: true, payment }
    },
}
