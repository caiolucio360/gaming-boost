import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import { authRateLimiter, getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit'
import { createApiErrorResponse, ErrorMessages } from '@/lib/api-errors'
import { HttpStatus } from '@/lib/http-status'
import { RateLimits } from '@/lib/rate-limit-config'
import crypto from 'crypto'

/** Generic message returned regardless of whether the email exists — prevents enumeration. */
const GENERIC_RECOVERY_MESSAGE = 'Se o email estiver cadastrado, você receberá instruções de recuperação'

/**
 * POST /api/auth/forgot-password
 * Sends password reset email with token
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 password reset requests per 15 minutes per IP
    const identifier = getIdentifier(request)
    const rateLimitResult = await authRateLimiter.check(identifier, RateLimits.AUTH_FORGOT_PASSWORD)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { message: ErrorMessages.RATE_LIMIT_PASSWORD_RECOVERY },
        { status: HttpStatus.TOO_MANY_REQUESTS, headers: createRateLimitHeaders(rateLimitResult) }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ message: ErrorMessages.AUTH_EMAIL_REQUIRED }, { status: HttpStatus.BAD_REQUEST })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    // Always return success even if user not found / inactive (prevents email enumeration)
    if (!user || !user.active) {
      console.log(`Password reset requested for non-existent or inactive email: ${email}`)
      return NextResponse.json({ message: GENERIC_RECOVERY_MESSAGE }, { status: HttpStatus.OK })
    }

    // Generate reset token (32 random bytes = 64 hex characters)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Store hashed token so even a DB compromise can't reuse it
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    // Update user with reset token (stored in metadata as JSON)
    let metadata: Record<string, unknown> = {}
    try {
      if (user.metadata) {
        metadata = JSON.parse(user.metadata as string)
      }
    } catch {
      metadata = {}
    }
    metadata.resetToken = hashedToken
    metadata.resetTokenExpiry = resetTokenExpiry.toISOString()

    await prisma.user.update({
      where: { id: user.id },
      data: { metadata: JSON.stringify(metadata) },
    })

    // Send email with unhashed token (only the user receives this)
    const emailSent = await sendPasswordResetEmail(user.email, resetToken)
    if (!emailSent) {
      // Still return success to the user (don't reveal internal issues)
      console.error(`Failed to send password reset email to ${email}`)
    } else {
      console.log(`✅ Password reset email sent to ${email}`)
    }

    return NextResponse.json(
      { message: GENERIC_RECOVERY_MESSAGE },
      { status: HttpStatus.OK, headers: createRateLimitHeaders(rateLimitResult) }
    )
  } catch (error) {
    return createApiErrorResponse(error, ErrorMessages.AUTH_FORGOT_PASSWORD_FAILED, 'POST /api/auth/forgot-password')
  }
}
