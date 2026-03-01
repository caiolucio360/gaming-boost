/**
 * Tests for order Zod schemas
 */

import {
    CreateOrderSchema,
    UpdateOrderStatusSchema,
    OrderFilterSchema,
} from '@/schemas/order'

describe('Order Schemas', () => {
    describe('CreateOrderSchema', () => {
        const validData = {
            game: 'CS2' as const,
            total: 99.90,
        }

        it('should validate valid order data', () => {
            const result = CreateOrderSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('should accept optional fields', () => {
            const dataWithOptional = {
                ...validData,
                currentRank: 'Gold',
                targetRank: 'Platinum',
                gameMode: 'PREMIER',
            }
            const result = CreateOrderSchema.safeParse(dataWithOptional)
            expect(result.success).toBe(true)
        })

        it('should use default game CS2 when not provided', () => {
            const data = { total: 99.90 }
            const result = CreateOrderSchema.safeParse(data)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.game).toBe('CS2')
            }
        })

        it('should reject missing total', () => {
            const data = { game: 'CS2' }
            const result = CreateOrderSchema.safeParse(data)
            expect(result.success).toBe(false)
        })

        it('should reject negative total', () => {
            const data = { ...validData, total: -10 }
            const result = CreateOrderSchema.safeParse(data)
            expect(result.success).toBe(false)
        })

        it('should reject zero total', () => {
            const data = { ...validData, total: 0 }
            const result = CreateOrderSchema.safeParse(data)
            expect(result.success).toBe(false)
        })
    })

    describe('UpdateOrderStatusSchema', () => {
        it('should accept valid status', () => {
            const result = UpdateOrderStatusSchema.safeParse({ status: 'IN_PROGRESS' })
            expect(result.success).toBe(true)
        })

        it('should reject invalid status', () => {
            const result = UpdateOrderStatusSchema.safeParse({ status: 'INVALID_STATUS' })
            expect(result.success).toBe(false)
        })

        it('should accept COMPLETED status', () => {
            const result = UpdateOrderStatusSchema.safeParse({ status: 'COMPLETED' })
            expect(result.success).toBe(true)
        })

        it('should accept CANCELLED status', () => {
            const result = UpdateOrderStatusSchema.safeParse({ status: 'CANCELLED' })
            expect(result.success).toBe(true)
        })
    })

    describe('OrderFilterSchema', () => {
        it('should use default values when not provided', () => {
            const result = OrderFilterSchema.parse({})
            expect(result.page).toBe(1)
            expect(result.limit).toBe(10)
        })

        it('should accept status filter', () => {
            const result = OrderFilterSchema.safeParse({ status: 'PENDING' })
            expect(result.success).toBe(true)
        })

        it('should accept multiple filters', () => {
            const result = OrderFilterSchema.safeParse({
                status: 'COMPLETED',
                page: 2,
                limit: 20,
            })
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.status).toBe('COMPLETED')
                expect(result.data.page).toBe(2)
                expect(result.data.limit).toBe(20)
            }
        })
    })
})
