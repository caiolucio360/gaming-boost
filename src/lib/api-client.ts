/**
 * Cliente API para fazer requisições autenticadas
 * Gerencia automaticamente o token JWT do localStorage
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

/**
 * Obtém o token do localStorage
 */
function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem('auth_token')
}

/**
 * Salva o token no localStorage
 */
export function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token)
  }
}

/**
 * Remove o token do localStorage
 */
export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token')
  }
}

/**
 * Obtém o token atual
 */
export function getAuthToken(): string | null {
  return getToken()
}

/**
 * Interface para opções de requisição
 */
interface RequestOptions extends RequestInit {
  requireAuth?: boolean // Se true, adiciona o token automaticamente
}

/**
 * Faz uma requisição autenticada
 * Adiciona automaticamente o header Authorization com o token
 */
export async function authenticatedFetch(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { requireAuth = true, headers = {}, ...restOptions } = options

  // Preparar headers
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  }

  // Adicionar token se necessário
  if (requireAuth) {
    const token = getToken()
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`
    }
  }

  // Fazer a requisição
  const response = await fetch(url, {
    ...restOptions,
    headers: requestHeaders,
  })

  // Se receber 401, o token pode estar expirado
  if (response.status === 401 && requireAuth) {
    // Remover token inválido
    removeToken()
    // Redirecionar para login apenas se não estiver já na página de login/register
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

/**
 * Helper para fazer requisições GET autenticadas
 */
export async function apiGet<T = any>(url: string, options?: RequestOptions): Promise<T> {
  const response = await authenticatedFetch(url, {
    ...options,
    method: 'GET',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro na requisição' }))
    throw new Error(error.message || 'Erro na requisição')
  }

  return response.json()
}

/**
 * Helper para fazer requisições POST autenticadas
 */
export async function apiPost<T = any>(
  url: string,
  data?: any,
  options?: RequestOptions
): Promise<T> {
  const response = await authenticatedFetch(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro na requisição' }))
    throw new Error(error.message || 'Erro na requisição')
  }

  return response.json()
}

/**
 * Helper para fazer requisições PUT autenticadas
 */
export async function apiPut<T = any>(
  url: string,
  data?: any,
  options?: RequestOptions
): Promise<T> {
  const response = await authenticatedFetch(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro na requisição' }))
    throw new Error(error.message || 'Erro na requisição')
  }

  return response.json()
}

/**
 * Helper para fazer requisições DELETE autenticadas
 */
export async function apiDelete<T = any>(url: string, options?: RequestOptions): Promise<T> {
  const response = await authenticatedFetch(url, {
    ...options,
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro na requisição' }))
    throw new Error(error.message || 'Erro na requisição')
  }

  return response.json()
}

