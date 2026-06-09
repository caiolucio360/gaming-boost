import { NextResponse } from 'next/server'
import { generateToken } from '@/lib/jwt'
import { RegisterSchema } from '@/schemas/auth'
import { validateBody } from '@/lib/validate'
import { AuthService } from '@/services'
import { authRateLimiter, createRateLimitHeaders } from '@/lib/rate-limit'
import { withApiHandler } from '@/lib/api-handler'
import { ErrorMessages } from '@/lib/api-errors'
import { HttpStatus } from '@/lib/http-status'
import { RateLimits } from '@/lib/rate-limit-config'

export const POST = withApiHandler(
  async ({ request, rateLimitResult }) => {
    const body = await request.json()

    // Validate with Zod schema
    const validation = validateBody(RegisterSchema, body)

    if (!validation.success) {
      const errors = validation.errors
      const hasEmailError = errors.some(e => e.field === 'email')
      const hasPasswordError = errors.some(e => e.field === 'password')

      if (!body.email || !body.password) {
        return NextResponse.json(
          { message: ErrorMessages.AUTH_EMAIL_PASSWORD_REQUIRED },
          { status: HttpStatus.BAD_REQUEST }
        )
      }

      if (hasPasswordError) {
        return NextResponse.json(
          { message: ErrorMessages.AUTH_PASSWORD_TOO_SHORT },
          { status: HttpStatus.BAD_REQUEST }
        )
      }

      if (hasEmailError) {
        return NextResponse.json(
          { message: ErrorMessages.AUTH_INVALID_EMAIL },
          { status: HttpStatus.BAD_REQUEST }
        )
      }

      return NextResponse.json(
        { message: ErrorMessages.INVALID_DATA, errors },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Use AuthService for business logic
    const result = await AuthService.registerUser(validation.data)

    if (!result.success) {
      return NextResponse.json(
        { message: result.error },
        { status: HttpStatus.BAD_REQUEST }
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
        status: HttpStatus.CREATED,
        headers: rateLimitResult
          ? createRateLimitHeaders(rateLimitResult)
          : undefined,
      }
    )
  },
  {
    rateLimit: { limiter: authRateLimiter, max: RateLimits.AUTH_REGISTER },
    rateLimitMessage: ErrorMessages.RATE_LIMIT_REGISTER,
    errorMessage: ErrorMessages.AUTH_REGISTER_FAILED,
    endpoint: 'POST /api/auth/register',
  }
)
