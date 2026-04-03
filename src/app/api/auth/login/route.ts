import { NextRequest, NextResponse } from 'next/server'
import { generateToken } from '@/lib/jwt'
import { LoginSchema } from '@/schemas/auth'
import { validateBody } from '@/lib/validate'
import { AuthService } from '@/services'
import { authRateLimiter, getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit'
import { createApiErrorResponse, ErrorMessages } from '@/lib/api-errors'
import { ErrorCodes } from '@/lib/error-constants'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 login attempts per 15 minutes per IP
    const identifier = getIdentifier(request)
    const rateLimitResult = await authRateLimiter.check(identifier, 5)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          message: ErrorMessages.RATE_LIMIT_LOGIN,
          error: ErrorCodes.RATE_LIMIT_EXCEEDED
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
          { message: ErrorMessages.AUTH_EMAIL_PASSWORD_REQUIRED },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { message: ErrorMessages.INVALID_DATA, errors: validation.errors },
        { status: 400 }
      )
    }

    // Use AuthService for credential validation
    const result = await AuthService.validateCredentials(validation.data)

    if (!result.success) {
      if (result.code === ErrorCodes.USER_NOT_VERIFIED) {
        return NextResponse.json(
          { message: ErrorMessages.AUTH_NOT_VERIFIED, code: ErrorCodes.USER_NOT_VERIFIED },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { message: ErrorMessages.AUTH_CREDENTIALS_INVALID },
        { status: 401 }
      )
    }

    const user = result.data

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
    return createApiErrorResponse(error, ErrorMessages.AUTH_LOGIN_FAILED, 'POST /api/auth/login')
  }
}
