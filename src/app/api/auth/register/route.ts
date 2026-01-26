import { NextRequest, NextResponse } from 'next/server'
import { generateToken } from '@/lib/jwt'
import { RegisterSchema } from '@/schemas/auth'
import { validateBody } from '@/lib/validate'
import { AuthService } from '@/services'
import { authRateLimiter, getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 registration attempts per 15 minutes per IP
    const identifier = getIdentifier(request)
    const rateLimitResult = await authRateLimiter.check(identifier, 3)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          message: 'Muitas tentativas de registro. Tente novamente mais tarde.',
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
    const validation = validateBody(RegisterSchema, body)

    if (!validation.success) {
      const errors = validation.errors
      const hasEmailError = errors.some(e => e.field === 'email')
      const hasPasswordError = errors.some(e => e.field === 'password')

      if (!body.email || !body.password) {
        return NextResponse.json(
          { message: 'Email e senha são obrigatórios' },
          { status: 400 }
        )
      }

      if (hasPasswordError) {
        return NextResponse.json(
          { message: 'A senha deve ter pelo menos 6 caracteres' },
          { status: 400 }
        )
      }

      if (hasEmailError) {
        return NextResponse.json(
          { message: 'Email inválido' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { message: 'Dados inválidos', errors },
        { status: 400 }
      )
    }

    // Use AuthService for business logic
    const result = await AuthService.registerUser(validation.data)

    if (!result.success) {
      return NextResponse.json(
        { message: result.error },
        { status: 400 }
      )
    }

    const user = result.data

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'CLIENT' | 'BOOSTER' | 'ADMIN',
    })

    return NextResponse.json(
      {
        message: 'Conta criada com sucesso',
        token,
        user,
      },
      {
        status: 201,
        headers: createRateLimitHeaders(rateLimitResult)
      }
    )
  } catch (error) {
    console.error('Erro ao registrar usuário:', error)

    // Check for specific database errors
    if (error instanceof Error) {
      if (error.message.includes('connect') || error.message.includes('timeout')) {
        return NextResponse.json(
          { message: 'Erro de conexão com o banco de dados. Tente novamente em instantes.' },
          { status: 503 }
        )
      }
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { message: 'Este email já está cadastrado. Tente fazer login ou use outro email.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { message: 'Não foi possível criar sua conta no momento. Por favor, tente novamente.' },
      { status: 500 }
    )
  }
}
