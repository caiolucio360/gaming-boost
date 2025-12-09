/**
 * Tests for common Zod schemas
 * TDD: Write tests first, then implement
 */

import { z } from 'zod'
import {
    IdSchema,
    PaginationSchema,
    EmailSchema,
    PhoneSchema,
    TaxIdSchema,
} from '@/schemas/common'

describe('Common Schemas', () => {
    describe('IdSchema', () => {
        it('should validate a valid CUID', () => {
            const validId = 'clh4ptu8g0000ym2x6qwt2xp3'
            const result = IdSchema.safeParse(validId)
            expect(result.success).toBe(true)
        })

        it('should reject empty string', () => {
            const result = IdSchema.safeParse('')
            expect(result.success).toBe(false)
        })

        it('should reject non-string values', () => {
            const result = IdSchema.safeParse(123)
            expect(result.success).toBe(false)
        })
    })

    describe('PaginationSchema', () => {
        it('should use default values when not provided', () => {
            const result = PaginationSchema.parse({})
            expect(result.page).toBe(1)
            expect(result.limit).toBe(10)
        })

        it('should accept valid page and limit', () => {
            const result = PaginationSchema.parse({ page: 2, limit: 20 })
            expect(result.page).toBe(2)
            expect(result.limit).toBe(20)
        })

        it('should reject negative page', () => {
            const result = PaginationSchema.safeParse({ page: -1 })
            expect(result.success).toBe(false)
        })

        it('should reject limit over 100', () => {
            const result = PaginationSchema.safeParse({ limit: 150 })
            expect(result.success).toBe(false)
        })
    })

    describe('EmailSchema', () => {
        it('should validate a valid email', () => {
            const result = EmailSchema.safeParse('test@example.com')
            expect(result.success).toBe(true)
        })

        it('should reject invalid email format', () => {
            const result = EmailSchema.safeParse('not-an-email')
            expect(result.success).toBe(false)
        })

        it('should trim whitespace from email', () => {
            const result = EmailSchema.parse('  test@example.com  ')
            expect(result).toBe('test@example.com')
        })

        it('should convert email to lowercase', () => {
            const result = EmailSchema.parse('Test@EXAMPLE.com')
            expect(result).toBe('test@example.com')
        })
    })

    describe('PhoneSchema', () => {
        it('should validate a valid Brazilian mobile phone', () => {
            const result = PhoneSchema.safeParse('11999998888')
            expect(result.success).toBe(true)
        })

        it('should accept phone with formatting', () => {
            const result = PhoneSchema.safeParse('(11) 99999-8888')
            expect(result.success).toBe(true)
        })

        it('should reject landline (not starting with 9)', () => {
            const result = PhoneSchema.safeParse('1133334444')
            expect(result.success).toBe(false)
        })
    })

    describe('TaxIdSchema (CPF)', () => {
        it('should validate a valid CPF with correct check digits', () => {
            // Valid CPF: 529.982.247-25
            const result = TaxIdSchema.safeParse('52998224725')
            expect(result.success).toBe(true)
        })

        it('should accept CPF with formatting', () => {
            const result = TaxIdSchema.safeParse('529.982.247-25')
            expect(result.success).toBe(true)
        })

        it('should reject CPF with invalid check digits', () => {
            const result = TaxIdSchema.safeParse('12345678900')
            expect(result.success).toBe(false)
        })

        it('should reject CPF with all same digits', () => {
            const result = TaxIdSchema.safeParse('11111111111')
            expect(result.success).toBe(false)
        })
    })
})
