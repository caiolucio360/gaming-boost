/**
 * Tests for authentication Zod schemas
 * TDD: Write tests first, then implement
 */

import { z } from 'zod'
import {
    RegisterSchema,
    LoginSchema,
    UpdateProfileSchema,
} from '@/schemas/auth'

describe('Auth Schemas', () => {
    describe('RegisterSchema', () => {
        const validData = {
            name: 'João Silva',
            email: 'joao@example.com',
            password: '12345678',
        }

        it('should validate valid registration data', () => {
            const result = RegisterSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('should reject missing name', () => {
            const data = { ...validData, name: undefined }
            const result = RegisterSchema.safeParse(data)
            expect(result.success).toBe(false)
        })

        it('should reject empty name', () => {
            const data = { ...validData, name: '' }
            const result = RegisterSchema.safeParse(data)
            expect(result.success).toBe(false)
        })

        it('should reject invalid email', () => {
            const data = { ...validData, email: 'not-an-email' }
            const result = RegisterSchema.safeParse(data)
            expect(result.success).toBe(false)
        })

        it('should reject short password (less than 6 chars)', () => {
            const data = { ...validData, password: '12345' }
            const result = RegisterSchema.safeParse(data)
            expect(result.success).toBe(false)
        })

        it('should normalize email to lowercase', () => {
            const data = { ...validData, email: 'Joao@EXAMPLE.com' }
            const result = RegisterSchema.parse(data)
            expect(result.email).toBe('joao@example.com')
        })

        it('should trim name', () => {
            const data = { ...validData, name: '  João Silva  ' }
            const result = RegisterSchema.parse(data)
            expect(result.name).toBe('João Silva')
        })
    })

    describe('LoginSchema', () => {
        const validData = {
            email: 'joao@example.com',
            password: '12345678',
        }

        it('should validate valid login data', () => {
            const result = LoginSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('should reject missing email', () => {
            const data = { password: validData.password }
            const result = LoginSchema.safeParse(data)
            expect(result.success).toBe(false)
        })

        it('should reject missing password', () => {
            const data = { email: validData.email }
            const result = LoginSchema.safeParse(data)
            expect(result.success).toBe(false)
        })

        it('should normalize email to lowercase', () => {
            const data = { ...validData, email: 'JOAO@EXAMPLE.COM' }
            const result = LoginSchema.parse(data)
            expect(result.email).toBe('joao@example.com')
        })
    })

    describe('UpdateProfileSchema', () => {
        it('should allow updating name only', () => {
            const result = UpdateProfileSchema.safeParse({ name: 'Novo Nome' })
            expect(result.success).toBe(true)
        })

        it('should allow updating phone only', () => {
            const result = UpdateProfileSchema.safeParse({ phone: '1199999888' })
            expect(result.success).toBe(true)
        })

        it('should allow empty object (no updates)', () => {
            const result = UpdateProfileSchema.safeParse({})
            expect(result.success).toBe(true)
        })

        it('should reject invalid phone format', () => {
            const result = UpdateProfileSchema.safeParse({ phone: '123' })
            expect(result.success).toBe(false)
        })
    })
})
