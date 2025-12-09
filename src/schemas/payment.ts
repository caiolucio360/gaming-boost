/**
 * Payment Zod schemas
 * Provides validation for PIX payments and withdrawals
 */

import { z } from 'zod'
import { IdSchema, PhoneSchema, TaxIdSchema, MoneySchema } from './common'

/**
 * Schema for creating a PIX payment
 */
export const CreatePixSchema = z.object({
    orderId: IdSchema,
    phone: PhoneSchema,
    taxId: TaxIdSchema,
})

/**
 * Schema for requesting a withdrawal
 */
export const WithdrawRequestSchema = z.object({
    amount: MoneySchema,
    pixKey: z.string().min(1, 'Chave PIX é obrigatória'),
})

/**
 * Schema for payment webhook
 */
export const PaymentWebhookSchema = z.object({
    data: z.object({
        id: z.string(),
        status: z.string(),
        billingId: z.string().optional(),
    }),
})

/**
 * Inferred types from schemas
 */
export type CreatePixInput = z.infer<typeof CreatePixSchema>
export type WithdrawRequestInput = z.infer<typeof WithdrawRequestSchema>
export type PaymentWebhookInput = z.infer<typeof PaymentWebhookSchema>
