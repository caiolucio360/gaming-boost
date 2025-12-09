/**
 * Tests for payment Zod schemas
 * TDD: Write tests first, then implement
 */

import {
    CreatePixSchema,
    WithdrawRequestSchema,
} from '@/schemas/payment'

describe('Payment Schemas', () => {
    describe('CreatePixSchema', () => {
        const validData = {
            orderId: 'clh4ptu8g0000ym2x6qwt2xp3',
            phone: '11999998888',
            taxId: '12345678909',
        }

        it('should validate valid PIX data', () => {
            const result = CreatePixSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('should accept formatted phone and taxId', () => {
            const data = {
                orderId: validData.orderId,
                phone: '(11) 99999-8888',
                taxId: '123.456.789-09',
            }
            const result = CreatePixSchema.safeParse(data)
            expect(result.success).toBe(true)
        })

        it('should reject missing orderId', () => {
            const data = { phone: validData.phone, taxId: validData.taxId }
            const result = CreatePixSchema.safeParse(data)
            expect(result.success).toBe(false)
        })

        it('should reject missing phone', () => {
            const data = { orderId: validData.orderId, taxId: validData.taxId }
            const result = CreatePixSchema.safeParse(data)
            expect(result.success).toBe(false)
        })

        it('should reject missing taxId', () => {
            const data = { orderId: validData.orderId, phone: validData.phone }
            const result = CreatePixSchema.safeParse(data)
            expect(result.success).toBe(false)
        })

        it('should reject invalid phone format', () => {
            const data = { ...validData, phone: '123' }
            const result = CreatePixSchema.safeParse(data)
            expect(result.success).toBe(false)
        })

        it('should reject invalid taxId format', () => {
            const data = { ...validData, taxId: '12345' }
            const result = CreatePixSchema.safeParse(data)
            expect(result.success).toBe(false)
        })
    })

    describe('WithdrawRequestSchema', () => {
        const validData = {
            amount: 100.00,
            pixKey: 'email@example.com',
        }

        it('should validate valid withdraw data', () => {
            const result = WithdrawRequestSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('should reject negative amount', () => {
            const data = { ...validData, amount: -50 }
            const result = WithdrawRequestSchema.safeParse(data)
            expect(result.success).toBe(false)
        })

        it('should reject zero amount', () => {
            const data = { ...validData, amount: 0 }
            const result = WithdrawRequestSchema.safeParse(data)
            expect(result.success).toBe(false)
        })

        it('should reject missing pixKey', () => {
            const data = { amount: 100 }
            const result = WithdrawRequestSchema.safeParse(data)
            expect(result.success).toBe(false)
        })

        it('should reject empty pixKey', () => {
            const data = { ...validData, pixKey: '' }
            const result = WithdrawRequestSchema.safeParse(data)
            expect(result.success).toBe(false)
        })
    })
})
