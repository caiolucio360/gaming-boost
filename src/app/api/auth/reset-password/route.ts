import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { authRateLimiter, getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit'
import { createApiErrorResponse, ErrorMessages } from '@/lib/api-errors'
import { HttpStatus } from '@/lib/http-status'
import { RateLimits } from '@/lib/rate-limit-config'

/**
 * POST /api/auth/reset-password
 * Resets password using token from email
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 password reset attempts per 15 minutes per IP
    const identifier = getIdentifier(request)
    const rateLimitResult = await authRateLimiter.check(identifier, RateLimits.AUTH_RESET_PASSWORD)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          message: ErrorMessages.RATE_LIMIT_PASSWORD_RESET
        },
        {
          status: HttpStatus.TOO_MANY_REQUESTS,
          headers: createRateLimitHeaders(rateLimitResult)
        }
      )
    }

    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({
        message:ErrorMessages.AUTH_TOKEN_AND_PASSWORD_REQUIRED
      }, { status: HttpStatus.BAD_REQUEST })
    }

    if (password.length < 8) {
      return NextResponse.json({
        message:ErrorMessages.AUTH_PASSWORD_TOO_SHORT
      }, { status: HttpStatus.BAD_REQUEST })
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    // Find all users and check metadata for matching token
    // (not ideal for scale, but works for MVP - consider adding a PasswordResetToken table later)
    const users = await prisma.user.findMany({
      where: {
        metadata: {
          contains: hashedToken,
        },
      },
    })

    if (users.length === 0) {
      return NextResponse.json({
        message:ErrorMessages.AUTH_TOKEN_INVALID_OR_EXPIRED
      }, { status: HttpStatus.BAD_REQUEST })
    }

    // Find the user with matching token that hasn't expired
    let targetUser = null
    for (const user of users) {
      if (!user.metadata) continue

      try {
        const metadata = JSON.parse(user.metadata)
        if (
          metadata.resetToken === hashedToken &&
          metadata.resetTokenExpiry &&
          new Date(metadata.resetTokenExpiry) > new Date()
        ) {
          targetUser = user
          break
        }
      } catch {
        // Invalid JSON, skip
        continue
      }
    }

    if (!targetUser) {
      return NextResponse.json({
        message:ErrorMessages.AUTH_TOKEN_INVALID_OR_EXPIRED
      }, { status: HttpStatus.BAD_REQUEST })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update password and clear reset token
    const metadata = JSON.parse(targetUser.metadata || '{}')
    delete metadata.resetToken
    delete metadata.resetTokenExpiry

    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        password: hashedPassword,
        metadata: JSON.stringify(metadata),
      },
    })

    console.log(`✅ Password reset successfully for user ${targetUser.email}`)

    return NextResponse.json(
      {
        message: 'Senha redefinida com sucesso'
      },
      {
        status: HttpStatus.OK,
        headers: createRateLimitHeaders(rateLimitResult)
      }
    )
  } catch (error) {
    return createApiErrorResponse(error, ErrorMessages.AUTH_RESET_PASSWORD_FAILED, 'POST /api/auth/reset-password')
  }
}
