/**
 * Authentication Zod schemas
 * Provides validation for user registration, login, and profile updates
 */

import { z } from 'zod'
import { EmailSchema } from './common'

/**
 * Schema for user registration
 */
export const RegisterSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'Nome é obrigatório')
        .min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: EmailSchema,
    password: z
        .string()
        .min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

/**
 * Schema for user login
 */
export const LoginSchema = z.object({
    email: EmailSchema,
    password: z.string().min(1, 'Senha é obrigatória'),
})

/**
 * Schema for profile update (all fields optional)
 */
export const UpdateProfileSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Nome deve ter pelo menos 2 caracteres')
        .optional(),
    phone: z
        .string()
        .transform((val) => val.replace(/\D/g, ''))
        .refine(
            (val) => val.length >= 10 && val.length <= 11,
            { message: 'Telefone deve ter 10 ou 11 dígitos' }
        )
        .optional(),
    pixKey: z.string().optional(),
})

/**
 * Inferred types from schemas
 */
export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
