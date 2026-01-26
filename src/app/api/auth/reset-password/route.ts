import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { authRateLimiter, getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit'

/**
 * POST /api/auth/reset-password
 * Resets password using token from email
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 password reset attempts per 15 minutes per IP
    const identifier = getIdentifier(request)
    const rateLimitResult = await authRateLimiter.check(identifier, 5)

    if (!rateLimitResult.success) {
      return Response.json(
        {
          error: 'Muitas tentativas. Tente novamente mais tarde.'
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult)
        }
      )
    }

    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return Response.json({
        error: 'Token e senha são obrigatórios'
      }, { status: 400 })
    }

    if (password.length < 6) {
      return Response.json({
        error: 'A senha deve ter no mínimo 6 caracteres'
      }, { status: 400 })
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    // Find all users and check metadata for matching token
    // (not ideal for scale, but works for MVP - consider adding a PasswordResetToken table later)
    const users = await db.user.findMany({
      where: {
        metadata: {
          contains: hashedToken,
        },
      },
    })

    if (users.length === 0) {
      return Response.json({
        error: 'Token inválido ou expirado'
      }, { status: 400 })
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
      } catch (e) {
        // Invalid JSON, skip
        continue
      }
    }

    if (!targetUser) {
      return Response.json({
        error: 'Token inválido ou expirado'
      }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update password and clear reset token
    const metadata = JSON.parse(targetUser.metadata || '{}')
    delete metadata.resetToken
    delete metadata.resetTokenExpiry

    await db.user.update({
      where: { id: targetUser.id },
      data: {
        password: hashedPassword,
        metadata: JSON.stringify(metadata),
      },
    })

    console.log(`✅ Password reset successfully for user ${targetUser.email}`)

    return Response.json(
      {
        message: 'Senha redefinida com sucesso'
      },
      {
        status: 200,
        headers: createRateLimitHeaders(rateLimitResult)
      }
    )
  } catch (error) {
    console.error('Error in reset-password:', error)

    // Check for specific errors
    if (error instanceof Error) {
      if (error.message.includes('connect') || error.message.includes('timeout')) {
        return Response.json({
          error: 'Erro de conexão temporário. Por favor, tente novamente em instantes.'
        }, { status: 503 })
      }
    }

    return Response.json({
      error: 'Não foi possível redefinir sua senha no momento. Por favor, solicite um novo link de recuperação.'
    }, { status: 500 })
  }
}
