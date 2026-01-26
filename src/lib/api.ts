/**
 * Typed API Client with Result<T> Pattern
 *
 * Provides a type-safe way to make API requests with:
 * - Result<T> pattern (Success or Failure, no throwing)
 * - Automatic authentication handling
 * - Toast notifications for errors
 * - TypeScript inference for responses
 */

import { showError, showSuccess } from './toast'

// ============================================
// Result<T> Type Definitions
// ============================================

/**
 * Represents a successful API response
 */
export interface Success<T> {
  success: true
  data: T
}

/**
 * Represents a failed API response
 */
export interface Failure {
  success: false
  error: ApiError
}

/**
 * Structured API error with code and message
 */
export interface ApiError {
  code: ApiErrorCode
  message: string
  details?: Record<string, unknown>
}

/**
 * Known API error codes for type-safe error handling
 */
export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'DUPLICATE_ENTRY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR'

/**
 * Result type - either Success<T> or Failure
 */
export type Result<T> = Success<T> | Failure

// ============================================
// Type Guards
// ============================================

export function isSuccess<T>(result: Result<T>): result is Success<T> {
  return result.success === true
}

export function isFailure<T>(result: Result<T>): result is Failure {
  return result.success === false
}

// ============================================
// Helper Functions to Create Results
// ============================================

export function ok<T>(data: T): Success<T> {
  return { success: true, data }
}

export function fail(code: ApiErrorCode, message: string, details?: Record<string, unknown>): Failure {
  return { success: false, error: { code, message, details } }
}

// ============================================
// Token Management
// ============================================

const TOKEN_KEY = 'auth_token'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function getAuthToken(): string | null {
  return getToken()
}

// ============================================
// Request Configuration
// ============================================

export interface ApiRequestConfig {
  /** Skip authentication header (default: false) */
  skipAuth?: boolean
  /** Show error toast on failure (default: true) */
  showErrorToast?: boolean
  /** Show success toast on success (default: false) */
  showSuccessToast?: boolean
  /** Success message for toast */
  successMessage?: string
  /** Custom error message for toast */
  errorMessage?: string
  /** Custom headers */
  headers?: Record<string, string>
  /** Request timeout in ms (default: 30000) */
  timeout?: number
}

const DEFAULT_CONFIG: ApiRequestConfig = {
  skipAuth: false,
  showErrorToast: true,
  showSuccessToast: false,
  timeout: 30000,
}

// ============================================
// Core Request Function
// ============================================

async function request<T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown,
  config: ApiRequestConfig = {}
): Promise<Result<T>> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...mergedConfig.headers,
  }

  // Add auth token if needed
  if (!mergedConfig.skipAuth) {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), mergedConfig.timeout)

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Parse response
    let data: T | { message?: string; error?: string } | null = null
    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      try {
        data = await response.json()
      } catch {
        // Empty response body
        data = null
      }
    }

    // Handle HTTP errors
    if (!response.ok) {
      const errorResult = handleHttpError<T>(response.status, data, mergedConfig)
      return errorResult
    }

    // Success
    if (mergedConfig.showSuccessToast && mergedConfig.successMessage) {
      showSuccess(mergedConfig.successMessage)
    }

    return ok(data as T)

  } catch (error) {
    clearTimeout(timeoutId)

    // Network/timeout errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        const result = fail('NETWORK_ERROR', 'A requisição expirou. Tente novamente.')
        if (mergedConfig.showErrorToast) {
          showError('Tempo esgotado', result.error.message)
        }
        return result
      }

      const result = fail('NETWORK_ERROR', 'Erro de conexão. Verifique sua internet.')
      if (mergedConfig.showErrorToast) {
        showError('Erro de conexão', result.error.message)
      }
      return result
    }

    return fail('UNKNOWN_ERROR', 'Erro desconhecido')
  }
}

function handleHttpError<T>(
  status: number,
  data: unknown,
  config: ApiRequestConfig
): Failure {
  const message = extractErrorMessage(data, config.errorMessage)

  let result: Failure

  switch (status) {
    case 401:
      result = fail('UNAUTHORIZED', message || 'Sessão expirada. Faça login novamente.')
      // Clear token and redirect
      removeToken()
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login'
        }
      }
      break

    case 403:
      result = fail('FORBIDDEN', message || 'Você não tem permissão para esta ação.')
      break

    case 404:
      result = fail('NOT_FOUND', message || 'Recurso não encontrado.')
      break

    case 400:
      const errorCode = extractErrorCode(data)
      if (errorCode === 'DUPLICATE_ENTRY') {
        result = fail('DUPLICATE_ENTRY', message || 'Este registro já existe.')
      } else {
        result = fail('VALIDATION_ERROR', message || 'Dados inválidos.')
      }
      break

    case 429:
      result = fail('RATE_LIMIT_EXCEEDED', message || 'Muitas tentativas. Aguarde um momento.')
      break

    case 500:
    case 502:
    case 503:
    case 504:
      result = fail('SERVER_ERROR', message || 'Erro no servidor. Tente novamente.')
      break

    default:
      result = fail('UNKNOWN_ERROR', message || 'Ocorreu um erro inesperado.')
  }

  if (config.showErrorToast && status !== 401) {
    showError('Erro', result.error.message)
  }

  return result
}

function extractErrorMessage(data: unknown, fallback?: string): string | undefined {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.message === 'string') return obj.message
    if (typeof obj.error === 'string') return obj.error
  }
  return fallback
}

function extractErrorCode(data: unknown): string | undefined {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.error === 'string') return obj.error
  }
  return undefined
}

// ============================================
// HTTP Method Shortcuts
// ============================================

export const api = {
  /**
   * GET request
   */
  get: <T>(url: string, config?: ApiRequestConfig) =>
    request<T>(url, 'GET', undefined, config),

  /**
   * POST request
   */
  post: <T>(url: string, body?: unknown, config?: ApiRequestConfig) =>
    request<T>(url, 'POST', body, config),

  /**
   * PUT request
   */
  put: <T>(url: string, body?: unknown, config?: ApiRequestConfig) =>
    request<T>(url, 'PUT', body, config),

  /**
   * PATCH request
   */
  patch: <T>(url: string, body?: unknown, config?: ApiRequestConfig) =>
    request<T>(url, 'PATCH', body, config),

  /**
   * DELETE request
   */
  delete: <T>(url: string, config?: ApiRequestConfig) =>
    request<T>(url, 'DELETE', undefined, config),
}

// ============================================
// Typed API Endpoints
// ============================================

// Define response types for better IntelliSense
export interface User {
  id: string
  email: string
  name: string
  role: 'CLIENT' | 'BOOSTER' | 'ADMIN'
  pixKey?: string
  steamProfileUrl?: string
}

export interface Order {
  id: string
  userId: string
  game: string
  gameMode: string
  currentRank?: string
  targetRank?: string
  currentRating?: number
  targetRating?: number
  price: number
  status: 'PENDING' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED'
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  orderId: string
  amount: number
  status: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED'
  pixCode?: string
  qrCode?: string
  createdAt: string
}

export interface PricingCalculation {
  price: number
  pricePerUnit: number
  breakdown: Array<{
    tier: string
    units: number
    pricePerUnit: number
    subtotal: number
  }>
}

/**
 * Pre-typed API endpoints for common operations
 */
export const endpoints = {
  // Auth
  auth: {
    login: (data: { email: string; password: string }) =>
      api.post<{ user: User; token: string }>('/api/auth/login', data, {
        skipAuth: true,
        successMessage: 'Login realizado com sucesso!',
        showSuccessToast: true,
      }),

    register: (data: { name: string; email: string; password: string }) =>
      api.post<{ user: User; token: string }>('/api/auth/register', data, {
        skipAuth: true,
        successMessage: 'Conta criada com sucesso!',
        showSuccessToast: true,
      }),

    forgotPassword: (data: { email: string }) =>
      api.post<{ message: string }>('/api/auth/forgot-password', data, {
        skipAuth: true,
        successMessage: 'Email de recuperação enviado!',
        showSuccessToast: true,
      }),

    resetPassword: (data: { token: string; password: string }) =>
      api.post<{ message: string }>('/api/auth/reset-password', data, {
        skipAuth: true,
        successMessage: 'Senha redefinida com sucesso!',
        showSuccessToast: true,
      }),
  },

  // Orders
  orders: {
    list: () =>
      api.get<{ orders: Order[] }>('/api/orders'),

    get: (id: string) =>
      api.get<Order>(`/api/orders/${id}`),

    create: (data: {
      game: string
      gameMode: string
      currentRating?: number
      targetRating?: number
      currentRank?: string
      targetRank?: string
      steamUsername?: string
      steamPassword?: string
    }) =>
      api.post<Order>('/api/orders', data, {
        successMessage: 'Pedido criado com sucesso!',
        showSuccessToast: true,
      }),

    cancel: (id: string) =>
      api.post<Order>(`/api/orders/${id}/cancel`, undefined, {
        successMessage: 'Pedido cancelado com sucesso.',
        showSuccessToast: true,
      }),
  },

  // Payments
  payments: {
    createPix: (orderId: string) =>
      api.post<Payment>('/api/payment/pix', { orderId }),

    getStatus: (id: string) =>
      api.get<Payment>(`/api/payment/${id}`),
  },

  // Pricing
  pricing: {
    calculate: (data: {
      game: string
      gameMode: string
      currentValue: number
      targetValue: number
    }) =>
      api.post<PricingCalculation>('/api/pricing/calculate', data, {
        skipAuth: true,
        showErrorToast: false,
      }),
  },

  // Booster
  booster: {
    apply: (data: {
      pixKey: string
      pixKeyType: string
      steamProfileUrl: string
      discordUsername: string
      preferredGames: string[]
      experience: string
      availability: string
    }) =>
      api.post<{ message: string }>('/api/booster/apply', data, {
        successMessage: 'Candidatura enviada com sucesso!',
        showSuccessToast: true,
      }),

    orders: {
      list: () =>
        api.get<{ orders: Order[] }>('/api/booster/orders'),

      accept: (id: string) =>
        api.post<Order>(`/api/booster/orders/${id}`, { action: 'accept' }, {
          successMessage: 'Pedido aceito!',
          showSuccessToast: true,
        }),

      complete: (id: string) =>
        api.post<Order>(`/api/booster/orders/${id}`, { action: 'complete' }, {
          successMessage: 'Pedido concluído!',
          showSuccessToast: true,
        }),
    },
  },

  // Admin
  admin: {
    stats: () =>
      api.get<{
        totalOrders: number
        totalRevenue: number
        activeOrders: number
        pendingPayouts: number
      }>('/api/admin/stats'),

    pricing: {
      list: () =>
        api.get<{ configs: Array<{ id: string; game: string; gameMode: string; tiers: unknown[] }> }>('/api/admin/pricing'),

      update: (id: string, data: { tiers: unknown[] }) =>
        api.put<{ message: string }>(`/api/admin/pricing/${id}`, data, {
          successMessage: 'Preços atualizados!',
          showSuccessToast: true,
        }),
    },
  },
}

// ============================================
// Usage Example
// ============================================

/*
// Example 1: Using endpoints (recommended)
const result = await endpoints.auth.login({ email, password })
if (isSuccess(result)) {
  saveToken(result.data.token)
  console.log('Logged in as:', result.data.user.name)
} else {
  console.error('Login failed:', result.error.message)
}

// Example 2: Using api directly
const ordersResult = await api.get<{ orders: Order[] }>('/api/orders')
if (isSuccess(ordersResult)) {
  setOrders(ordersResult.data.orders)
}

// Example 3: With custom config
const result = await api.post<Order>('/api/orders', orderData, {
  successMessage: 'Pedido criado!',
  showSuccessToast: true,
  showErrorToast: false, // Handle error manually
})
*/
