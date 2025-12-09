/**
 * @jest-environment node
 */

import { z } from 'zod'
import { validateBody, ValidationResult } from '@/lib/validate'

describe('validateBody', () => {
    const TestSchema = z.object({
        name: z.string().min(1, 'Nome é obrigatório'),
        email: z.string().email('Email inválido'),
        age: z.number().min(18, 'Deve ser maior de idade'),
    })

    it('should return success with parsed data when valid', () => {
        const body = { name: 'João', email: 'joao@test.com', age: 25 }

        const result = validateBody(TestSchema, body)

        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data).toEqual(body)
        }
    })

    it('should return error response when missing required field', () => {
        const body = { email: 'joao@test.com', age: 25 } // missing name

        const result = validateBody(TestSchema, body)

        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    field: 'name',
                })
            )
        }
    })

    it('should return error response when email is invalid', () => {
        const body = { name: 'João', email: 'invalid-email', age: 25 }

        const result = validateBody(TestSchema, body)

        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    field: 'email',
                    message: 'Email inválido',
                })
            )
        }
    })

    it('should return multiple errors when multiple fields are invalid', () => {
        const body = { name: '', email: 'invalid', age: 10 }

        const result = validateBody(TestSchema, body)

        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.errors.length).toBe(3)
        }
    })

    it('should handle nested paths correctly', () => {
        const NestedSchema = z.object({
            user: z.object({
                profile: z.object({
                    name: z.string().min(1, 'Nome obrigatório'),
                }),
            }),
        })

        const body = { user: { profile: { name: '' } } }

        const result = validateBody(NestedSchema, body)

        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.errors).toContainEqual(
                expect.objectContaining({
                    field: 'user.profile.name',
                })
            )
        }
    })
})
