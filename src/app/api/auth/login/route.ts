import { NextResponse } from 'next/server'
import { generateToken } from '@/lib/jwt'
import { LoginSchema } from '@/schemas/auth'
import { validateBody } from '@/lib/validate'
import { AuthService } from '@/services'
import { authRateLimiter, createRateLimitHeaders } from '@/lib/rate-limit'
import { withApiHandler } from '@/lib/api-handler'
import { ErrorMessages } from '@/lib/api-errors'
import { ErrorCodes } from '@/lib/error-constants'
import { HttpStatus } from '@/lib/http-status'
import { RateLimits } from '@/lib/rate-limit-config'

export const POST = withApiHandler(
  async ({ request, rateLimitResult }) => {
    const body = await request.json()

    // Validate with Zod schema
    const validation = validateBody(LoginSchema, body)

    if (!validation.success) {
      if (!body.email || !body.password) {
        return NextResponse.json(
          { message: ErrorMessages.AUTH_EMAIL_PASSWORD_REQUIRED },
          { status: HttpStatus.BAD_REQUEST }
        )
      }

      return NextResponse.json(
        { message: ErrorMessages.INVALID_DATA, errors: validation.errors },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Use AuthService for credential validation
    const result = await AuthService.validateCredentials(validation.data)

    if (!result.success) {
      if (result.code === ErrorCodes.USER_NOT_VERIFIED) {
        return NextResponse.json(
          { message: ErrorMessages.AUTH_NOT_VERIFIED, code: ErrorCodes.USER_NOT_VERIFIED },
          { status: HttpStatus.FORBIDDEN }
        )
      }
      return NextResponse.json(
        { message: ErrorMessages.AUTH_CREDENTIALS_INVALID },
        { status: HttpStatus.UNAUTHORIZED }
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
        status: HttpStatus.OK,
        headers: rateLimitResult
          ? createRateLimitHeaders(rateLimitResult)
          : undefined,
      }
    )
  },
  {
    rateLimit: { limiter: authRateLimiter, max: RateLimits.AUTH_LOGIN },
    rateLimitMessage: ErrorMessages.RATE_LIMIT_LOGIN,
    errorMessage: ErrorMessages.AUTH_LOGIN_FAILED,
    endpoint: 'POST /api/auth/login',
  }
)
