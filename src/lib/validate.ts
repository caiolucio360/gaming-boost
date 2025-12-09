/**
 * Validation utilities using Zod
 * Provides a consistent way to validate request bodies in API routes
 */

import { ZodSchema, ZodError } from 'zod'

/**
 * Validation error structure
 */
export interface ValidationError {
    field: string
    message: string
}

/**
 * Result of validation - either success with data or failure with errors
 */
export type ValidationResult<T> =
    | { success: true; data: T }
    | { success: false; errors: ValidationError[] }

/**
 * Validate a body against a Zod schema
 * Returns a discriminated union for type-safe handling
 * 
 * @example
 * const result = validateBody(UserSchema, body)
 * if (!result.success) {
 *   return NextResponse.json({ errors: result.errors }, { status: 400 })
 * }
 * // result.data is now typed as User
 */
export function validateBody<T>(
    schema: ZodSchema<T>,
    body: unknown
): ValidationResult<T> {
    try {
        const data = schema.parse(body)
        return { success: true, data }
    } catch (error) {
        if (error instanceof ZodError) {
            // Zod v4 uses 'issues' property
            const issues = error.issues || []
            const errors: ValidationError[] = issues.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }))
            return { success: false, errors }
        }
        // Re-throw unexpected errors
        throw error
    }
}

/**
 * Create a NextResponse for validation errors
 * Helper to standardize error responses across API routes
 */
export function createValidationErrorResponse(errors: ValidationError[]) {
    // Dynamically import to avoid issues in non-Next.js contexts
    const { NextResponse } = require('next/server')

    return NextResponse.json(
        {
            message: 'Dados inválidos',
            errors,
        },
        { status: 400 }
    )
}
