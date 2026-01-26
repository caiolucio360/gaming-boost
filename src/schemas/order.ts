/**
 * Order Zod schemas
 * Provides validation for order creation, updates, and filtering
 */

import { z } from 'zod'
import { PaginationSchema, MoneySchema } from './common'

/**
 * Valid order statuses
 */
export const OrderStatusEnum = z.enum([
    'PENDING',
    'PAID',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'DISPUTED',
])

export type OrderStatus = z.infer<typeof OrderStatusEnum>

/**
 * Valid games
 */
export const GameEnum = z.enum(['CS2'])

/**
 * Schema for creating a new order
 */
export const CreateOrderSchema = z.object({
    game: GameEnum.default('CS2'),
    total: MoneySchema,
    currentRank: z.string().optional(),
    targetRank: z.string().optional(),
    currentRating: z.number().optional(),
    targetRating: z.number().optional(),
    gameMode: z.string().optional(),
    gameType: z.string().optional(),
    boosterId: z.string().optional(),
})

/**
 * Schema for updating order status
 */
export const UpdateOrderStatusSchema = z.object({
    status: OrderStatusEnum,
})

/**
 * Schema for filtering orders
 */
export const OrderFilterSchema = PaginationSchema.extend({
    status: OrderStatusEnum.optional(),
    boosterId: z.string().optional(),
    userId: z.string().optional(),
})

/**
 * Inferred types from schemas
 */
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>
export type OrderFilterInput = z.infer<typeof OrderFilterSchema>
