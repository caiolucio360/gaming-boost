/**
 * Common Zod schemas used across the application
 * Provides reusable validation patterns for common data types
 */

import { z } from 'zod'
import { validateCPF, validatePhone } from '@/lib/brazilian'

/**
 * Schema for validating IDs (accepts string or number, coerces to string)
 */
export const IdSchema = z.union([
    z.string().min(1, 'ID é obrigatório'),
    z.number().int().positive()
]).transform((val) => String(val))

/**
 * Schema for pagination parameters
 */
export const PaginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
})

/**
 * Schema for validating and normalizing email addresses
 */
export const EmailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .email('Email inválido')

/**
 * Schema for validating Brazilian phone numbers
 * Uses brazilian.ts validatePhone for proper validation
 */
export const PhoneSchema = z
    .string()
    .transform((val) => val.replace(/\D/g, ''))
    .refine(validatePhone, { message: 'Telefone inválido. Use: (XX) 9XXXX-XXXX' })

/**
 * Schema for validating Brazilian CPF
 * Uses brazilian.ts validateCPF with check digit validation
 */
export const TaxIdSchema = z
    .string()
    .transform((val) => val.replace(/\D/g, ''))
    .refine(validateCPF, { message: 'CPF inválido' })

/**
 * Schema for positive monetary values
 */
export const MoneySchema = z
    .number()
    .positive('Valor deve ser positivo')

/**
 * Schema for optional string that converts empty strings to undefined
 */
export const OptionalStringSchema = z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val))
