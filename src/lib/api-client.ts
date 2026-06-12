/**
 * Cliente HTTP do app — use SEMPRE `api.get/post/put/patch/delete` para falar com `/api/**`.
 * Nunca chame `fetch` direto no client (ver `.claude/rules/code_patterns.md` regra 6).
 *
 * O client:
 * - injeta o header Authorization (token do localStorage) automaticamente;
 * - usa `Content-Type: application/json` por padrão (e o ignora para uploads `FormData`);
 * - em 401 com `requireAuth`, limpa o token e redireciona para `/login`;
 * - faz `JSON.parse` da resposta e **lança `ApiError`** em status não-2xx — os call sites
 *   só precisam de `try/await/catch`.
 */

import { ErrorMessages } from '@/lib/error-constants'

/**
 * Erro de API com código estruturado.
 * Permite controle de fluxo via instanceof e error.code, sem string matching.
 */
export class ApiError extends Error {
  constructor(message: string, public code?: string, public status?: number) {
    super(message)
    this.name = 'ApiError'
  }
}

function throwApiError(errorData: { message?: string; code?: string }, status: number): never {
  throw new ApiError(
    errorData.message || ErrorMessages.CLIENT_REQUEST_ERROR,
    errorData.code,
    status
  )
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
// Core request
// ============================================

/**
 * Opções de requisição. Estende `RequestInit`, então `cache`, `signal`, `headers`, etc.
 * funcionam normalmente. `requireAuth: false` desliga o header de auth e o redirect em 401
 * (use em rotas públicas / fluxo de login onde um 401 é esperado).
 */
export interface RequestOptions extends RequestInit {
  requireAuth?: boolean
}

/**
 * Faz uma requisição autenticada e retorna o `Response` cru.
 * Use os métodos de `api` no lugar disso, salvo necessidade de streaming/headers especiais.
 */
export async function authenticatedFetch(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { requireAuth = true, headers = {}, ...restOptions } = options

  // FormData (uploads) must keep the browser-generated multipart Content-Type/boundary,
  // so we only default to JSON when the body isn't FormData.
  const isFormData = typeof FormData !== 'undefined' && restOptions.body instanceof FormData

  const requestHeaders: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(headers as Record<string, string>),
  }

  if (requireAuth) {
    const token = getToken()
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`
    }
  }

  const response = await fetch(url, {
    ...restOptions,
    headers: requestHeaders,
  })

  // 401 → token expirado/ausente: limpa e manda para o login (exceto nas próprias telas de auth).
  if (response.status === 401 && requireAuth) {
    removeToken()
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      const isAuthPage = currentPath === '/login' || currentPath === '/register'
      if (!isAuthPage) {
        window.location.href = '/login'
      }
    }
  }

  return response
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

async function request<T = unknown>(
  method: HttpMethod,
  url: string,
  data?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
  const response = await authenticatedFetch(url, {
    ...options,
    method,
    body:
      data === undefined
        ? options.body
        : isFormData
          ? (data as FormData)
          : JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: ErrorMessages.CLIENT_REQUEST_ERROR }))
    throwApiError(errorData, response.status)
  }

  return response.json()
}

// ============================================
// API — use `api.get / api.post / api.put / api.patch / api.delete`
// ============================================

export const api = {
  get: <T = unknown>(url: string, options?: RequestOptions) =>
    request<T>('GET', url, undefined, options),

  post: <T = unknown>(url: string, data?: unknown, options?: RequestOptions) =>
    request<T>('POST', url, data, options),

  put: <T = unknown>(url: string, data?: unknown, options?: RequestOptions) =>
    request<T>('PUT', url, data, options),

  patch: <T = unknown>(url: string, data?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', url, data, options),

  delete: <T = unknown>(url: string, options?: RequestOptions) =>
    request<T>('DELETE', url, undefined, options),
}
