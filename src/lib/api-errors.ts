/**
 * API Error Response Utilities
 *
 * Uses Prisma error types and Node.js error codes — never string matching on messages.
 * All error codes and messages imported from @/lib/error-constants.
 */

import { NextResponse } from 'next/server'
import { Prisma } from '@/generated/prisma/client'
import { ErrorCodes, ErrorMessages } from '@/lib/error-constants'
import { HttpStatus } from '@/lib/http-status'

// Re-export so existing imports from '@/lib/api-errors' keep working
export { ErrorMessages } from '@/lib/error-constants'

/**
 * Creates a standardized error response with helpful messages
 */
export function createApiErrorResponse(
  error: unknown,
  defaultMessage: string,
  endpoint: string
): NextResponse {
  console.error(`Error in ${endpoint}:`, error)

  // Prisma known request errors (unique constraint, foreign key, not found, etc.)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = error as Prisma.PrismaClientKnownRequestError
    switch (prismaError.code) {
      case 'P2002':
        return NextResponse.json(
          { message: ErrorMessages.DATABASE_DUPLICATE_ENTRY, error: ErrorCodes.DUPLICATE_ENTRY },
          { status: HttpStatus.BAD_REQUEST }
        )
      case 'P2003':
        return NextResponse.json(
          { message: ErrorMessages.DATABASE_FOREIGN_KEY, error: ErrorCodes.FOREIGN_KEY_VIOLATION },
          { status: HttpStatus.BAD_REQUEST }
        )
      case 'P2025':
        return NextResponse.json(
          { message: ErrorMessages.DATABASE_NOT_FOUND, error: ErrorCodes.NOT_FOUND },
          { status: HttpStatus.NOT_FOUND }
        )
    }
  }

  // Prisma initialization / connection errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      { message: ErrorMessages.DATABASE_CONNECTION, error: ErrorCodes.DATABASE_CONNECTION_ERROR },
      { status: HttpStatus.SERVICE_UNAVAILABLE }
    )
  }

  // Prisma validation errors (invalid query input)
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      { message: ErrorMessages.DATABASE_VALIDATION, error: ErrorCodes.VALIDATION_ERROR },
      { status: HttpStatus.BAD_REQUEST }
    )
  }

  // Node.js-level connection errors (ECONNREFUSED, ETIMEDOUT, etc.)
  if (error instanceof Error && 'code' in error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') {
      return NextResponse.json(
        { message: ErrorMessages.DATABASE_CONNECTION, error: ErrorCodes.DATABASE_CONNECTION_ERROR },
        { status: HttpStatus.SERVICE_UNAVAILABLE }
      )
    }
  }

  // Default 500 Internal Server Error
  const isDev = process.env.NODE_ENV !== 'production'
  return NextResponse.json(
    { 
      message: isDev && error instanceof Error ? `${defaultMessage} (Dev Debug: ${error.message})` : defaultMessage, 
      error: ErrorCodes.INTERNAL_SERVER_ERROR 
    },
    { status: HttpStatus.INTERNAL_SERVER_ERROR }
  )
}
