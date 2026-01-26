import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import { authRateLimiter, getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit'
import crypto from 'crypto'

/**
 * POST /api/auth/forgot-password
 * Sends password reset email with token
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 password reset requests per 15 minutes per IP
    const identifier = getIdentifier(request)
    const rateLimitResult = await authRateLimiter.check(identifier, 3)

    if (!rateLimitResult.success) {
      return Response.json(
        {
          error: 'Muitas tentativas de recuperação de senha. Tente novamente mais tarde.'
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult)
        }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return Response.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    // Always return success even if user not found (security best practice)
    // This prevents email enumeration attacks
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`)
      return Response.json({
        message: 'Se o email estiver cadastrado, você receberá instruções de recuperação'
      }, { status: 200 })
    }

    // Check if user is active
    if (!user.active) {
      console.log(`Password reset requested for inactive user: ${email}`)
      return Response.json({
        message: 'Se o email estiver cadastrado, você receberá instruções de recuperação'
      }, { status: 200 })
    }

    // Generate reset token (32 random bytes = 64 hex characters)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Store hashed token in database
    // We hash it so even if DB is compromised, tokens can't be used
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    // Update user with reset token (store in metadata as JSON)
    const metadata = user.metadata ? JSON.parse(user.metadata) : {}
    metadata.resetToken = hashedToken
    metadata.resetTokenExpiry = resetTokenExpiry.toISOString()

    await db.user.update({
      where: { id: user.id },
      data: {
        metadata: JSON.stringify(metadata),
      },
    })

    // Send email with unhashed token (only user receives this)
    const emailSent = await sendPasswordResetEmail(user.email, resetToken)

    if (!emailSent) {
      console.error(`Failed to send password reset email to ${email}`)
      // Still return success to user (don't reveal our internal issues)
    } else {
      console.log(`✅ Password reset email sent to ${email}`)
    }

    return Response.json(
      {
        message: 'Se o email estiver cadastrado, você receberá instruções de recuperação'
      },
      {
        status: 200,
        headers: createRateLimitHeaders(rateLimitResult)
      }
    )
  } catch (error) {
    console.error('Error in forgot-password:', error)
    return Response.json({
      error: 'Erro ao processar solicitação. Tente novamente.'
    }, { status: 500 })
  }
}
