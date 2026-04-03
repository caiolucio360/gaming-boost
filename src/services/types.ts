/**
 * Shared types for service layer
 *
 * Uses the Result<T> pattern for consistent error handling across all services.
 * This pattern provides type-safe success/failure responses without exceptions.
 */

import type { ErrorCode } from '@/lib/error-constants'

// ============================================================================
// Core Result Type
// ============================================================================

/**
 * Success result with data
 */
export interface Success<T> {
  success: true
  data: T
}

/**
 * Error result with message and optional code
 */
export interface Failure {
  success: false
  error: string
  code?: ErrorCode
}

/**
 * Union type for service results
 * Use this pattern for all service methods that can fail
 */
export type Result<T> = Success<T> | Failure

// ============================================================================
// Error Codes — re-exported from the single source of truth
// ============================================================================

export { ErrorCodes, type ErrorCode } from '@/lib/error-constants'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a success result
 */
export function success<T>(data: T): Success<T> {
  return { success: true, data }
}

/**
 * Create a failure result
 */
export function failure(error: string, code?: ErrorCode): Failure {
  return { success: false, error, code }
}

/**
 * Type guard to check if result is success
 */
export function isSuccess<T>(result: Result<T>): result is Success<T> {
  return result.success === true
}

/**
 * Type guard to check if result is failure
 */
export function isFailure<T>(result: Result<T>): result is Failure {
  return result.success === false
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Create a paginated success result
 */
export function paginatedSuccess<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): Success<PaginatedResult<T>> {
  return success({
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
}
