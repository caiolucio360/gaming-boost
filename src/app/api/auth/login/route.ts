import { NextRequest, NextResponse } from 'next/server'
import { generateToken } from '@/lib/jwt'
import { LoginSchema } from '@/schemas/auth'
import { validateBody } from '@/lib/validate'
import { AuthService } from '@/services'
import { authRateLimiter, getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 login attempts per 15 minutes per IP
    const identifier = getIdentifier(request)
    const rateLimitResult = await authRateLimiter.check(identifier, 5)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          message: 'Muitas tentativas de login. Tente novamente mais tarde.',
          error: 'RATE_LIMIT_EXCEEDED'
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult)
        }
      )
    }

    const body = await request.json()

    // Validate with Zod schema
    const validation = validateBody(LoginSchema, body)

    if (!validation.success) {
      if (!body.email || !body.password) {
        return NextResponse.json(
          { message: 'Email e senha são obrigatórios' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { message: 'Dados inválidos', errors: validation.errors },
        { status: 400 }
      )
    }

    // Use AuthService for credential validation
    const result = await AuthService.validateCredentials(validation.data)

    if (!result.success) {
      return NextResponse.json(
        { message: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    const user = result.data

    // Check if user is active
    if (!user.active) {
      return NextResponse.json(
        { message: 'Conta desativada. Entre em contato com o suporte.' },
        { status: 403 }
      )
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'CLIENT' | 'BOOSTER' | 'ADMIN',
    })

    // Calculate redirect path based on role
    let redirectPath = '/dashboard'
    if (user.role === 'ADMIN') {
      redirectPath = '/admin'
    } else if (user.role === 'BOOSTER') {
      redirectPath = '/booster'
    }

    return NextResponse.json(
      {
        message: 'Login realizado com sucesso',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        redirectPath,
      },
      {
        status: 200,
        headers: createRateLimitHeaders(rateLimitResult)
      }
    )
  } catch (error) {
    console.error('Erro ao fazer login:', error)

    // Check for specific database errors
    if (error instanceof Error) {
      if (error.message.includes('connect') || error.message.includes('timeout')) {
        return NextResponse.json(
          { message: 'Erro de conexão com o banco de dados. Tente novamente em instantes.' },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      { message: 'Ocorreu um erro inesperado ao processar seu login. Por favor, tente novamente.' },
      { status: 500 }
    )
  }
}
