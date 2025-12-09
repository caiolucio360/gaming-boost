/**
 * Tests for order Zod schemas
 * TDD: Write tests first, then implement
 */

import {
    CreateOrderSchema,
    UpdateOrderStatusSchema,
    OrderFilterSchema,
} from '@/schemas/order'

describe('Order Schemas', () => {
    describe('CreateOrderSchema', () => {
        const validData = {
            serviceId: 'clh4ptu8g0000ym2x6qwt2xp3',
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
                notes: 'Please rush',
            }
            const result = CreateOrderSchema.safeParse(dataWithOptional)
            expect(result.success).toBe(true)
        })

        it('should reject missing serviceId', () => {
            const data = { total: 99.90 }
            const result = CreateOrderSchema.safeParse(data)
            expect(result.success).toBe(false)
        })

        it('should reject missing total', () => {
            const data = { serviceId: 'clh4ptu8g0000ym2x6qwt2xp3' }
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
