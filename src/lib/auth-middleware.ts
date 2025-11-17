import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth-config'

/**
 * Resultado da verificação de autenticação
 */
export interface AuthResult {
  authenticated: boolean
  user?: {
    id: number
    email: string
    role: 'CLIENT' | 'BOOSTER' | 'ADMIN'
  }
  error?: string
}

/**
 * Middleware para verificar autenticação em rotas protegidas
 * Usa getServerSession do NextAuth
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return {
        authenticated: false,
        error: 'Não autenticado',
      }
    }

    return {
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
    }
  } catch (error) {
    return {
      authenticated: false,
      error: 'Erro ao verificar autenticação',
    }
  }
}

/**
 * Middleware para verificar se o usuário tem um role específico
 */
export async function verifyRole(
  request: NextRequest,
  allowedRoles: Array<'CLIENT' | 'BOOSTER' | 'ADMIN'>
): Promise<AuthResult> {
  const authResult = await verifyAuth(request)

  if (!authResult.authenticated || !authResult.user) {
    return authResult
  }

  if (!allowedRoles.includes(authResult.user.role)) {
    return {
      authenticated: false,
      error: 'Acesso negado. Permissão insuficiente.',
    }
  }

  return authResult
}

/**
 * Helper para criar resposta de erro de autenticação
 */
export function createAuthErrorResponse(message: string, status: number = 401): NextResponse {
  return NextResponse.json(
    { message },
    { status }
  )
}

/**
 * Helper para criar resposta de erro baseado no resultado de autenticação
 * Retorna 403 se for erro de permissão, 401 caso contrário
 */
export function createAuthErrorResponseFromResult(authResult: AuthResult): NextResponse {
  const isPermissionError = authResult.error?.includes('Acesso negado') || 
                           authResult.error?.includes('Permissão') ||
                           authResult.error?.includes('insuficiente')
  const status = isPermissionError ? 403 : 401
  return createAuthErrorResponse(
    authResult.error || 'Não autenticado',
    status
  )
}

/**
 * Helper para verificar se é admin
 */
export async function verifyAdmin(request: NextRequest): Promise<AuthResult> {
  return verifyRole(request, ['ADMIN'])
}

/**
 * Helper para verificar se é booster
 */
export async function verifyBooster(request: NextRequest): Promise<AuthResult> {
  return verifyRole(request, ['BOOSTER'])
}
