import { NextRequest, NextResponse } from 'next/server'
import { generateToken } from '@/lib/jwt'
import { RegisterSchema } from '@/schemas/auth'
import { validateBody } from '@/lib/validate'
import { AuthService } from '@/services'
import { authRateLimiter, getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit'
import { createApiErrorResponse, ErrorMessages } from '@/lib/api-errors'
import { ErrorCodes } from '@/lib/error-constants'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 registration attempts per 15 minutes per IP
    const identifier = getIdentifier(request)
    const rateLimitResult = await authRateLimiter.check(identifier, 3)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          message: ErrorMessages.RATE_LIMIT_REGISTER,
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
    const validation = validateBody(RegisterSchema, body)

    if (!validation.success) {
      const errors = validation.errors
      const hasEmailError = errors.some(e => e.field === 'email')
      const hasPasswordError = errors.some(e => e.field === 'password')

      if (!body.email || !body.password) {
        return NextResponse.json(
          { message: ErrorMessages.AUTH_EMAIL_PASSWORD_REQUIRED },
          { status: 400 }
        )
      }

      if (hasPasswordError) {
        return NextResponse.json(
          { message: ErrorMessages.AUTH_PASSWORD_TOO_SHORT },
          { status: 400 }
        )
      }

      if (hasEmailError) {
        return NextResponse.json(
          { message: ErrorMessages.AUTH_INVALID_EMAIL },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { message: ErrorMessages.INVALID_DATA, errors },
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
    return createApiErrorResponse(error, ErrorMessages.AUTH_REGISTER_FAILED, 'POST /api/auth/register')
  }
}
