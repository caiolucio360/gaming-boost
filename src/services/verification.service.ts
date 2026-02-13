import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { Result, success, failure } from './types'

export const VerificationService = {
  /**
   * Generate a verification code for a user
   */
  async generateCode(userId: number, email: string): Promise<Result<string>> {
    try {
      // Deactivate any existing active codes for this user
      await prisma.verificationCode.updateMany({
        where: { 
          userId, 
          usedAt: null,
          expiresAt: { gt: new Date() }
        },
        data: { expiresAt: new Date() } // Expire them immediately
      })

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      
      // Set expiration (15 minutes)
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 15)

      // Save to database
      await prisma.verificationCode.create({
        data: {
          userId,
          code,
          expiresAt
        }
      })

      // Send email (async)
      // Note: We need to implement a specific email template for this
      // For now using a generic send function
      try {
        await sendEmail({
          to: email,
          subject: 'Seu código de verificação - Gaming Boost',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #7C3AED;">Verifique sua conta</h1>
              <p>Use o código abaixo para ativar sua conta na Gaming Boost:</p>
              <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000;">${code}</span>
              </div>
              <p>Este código expira em 15 minutos.</p>
              <p>Se você não solicitou este código, ignore este email.</p>
            </div>
          `
        })
      } catch (emailError) {
        console.error('Error sending verification email:', emailError)
        // We still return success because the code was generated, 
        // user can request resend if email fails
      }

      return success(code)
    } catch (error) {
      console.error('Error generating verification code:', error)
      return failure('Erro ao gerar código de verificação', 'DATABASE_ERROR')
    }
  },

  /**
   * Validate a verification code
   */
  async validateCode(userId: number, code: string): Promise<Result<boolean>> {
    try {
      const validCode = await prisma.verificationCode.findFirst({
        where: {
          userId,
          code,
          usedAt: null,
          expiresAt: { gt: new Date() }
        }
      })

      if (!validCode) {
        return failure('Código inválido ou expirado', 'INVALID_CODE')
      }

      // Mark code as used
      await prisma.verificationCode.update({
        where: { id: validCode.id },
        data: { usedAt: new Date() }
      })

      // Activate user
      await prisma.user.update({
        where: { id: userId },
        data: { active: true }
      })

      return success(true)
    } catch (error) {
      console.error('Error validating verification code:', error)
      return failure('Erro ao validar código', 'DATABASE_ERROR')
    }
  }
}
