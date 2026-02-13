import { NextRequest, NextResponse } from 'next/server'
import { VerificationService } from '@/services/verification.service'
import { z } from 'zod'
import { validateBody } from '@/lib/validate'
import { authRateLimiter, getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit'
import { prisma } from '@/lib/db'

const ResendSchema = z.object({
    email: z.string().email()
})

export async function POST(request: NextRequest) {
    try {
        // Rate limiting - stricter for resend
        const identifier = getIdentifier(request)
        const rateLimitResult = await authRateLimiter.check(identifier, 3) // 3 attempts per 15 min

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { message: 'Muitas tentativas. Aguarde antes de tentar novamente.' },
                { status: 429, headers: createRateLimitHeaders(rateLimitResult) }
            )
        }

        const body = await request.json()
        const validation = validateBody(ResendSchema, body)

        if (!validation.success) {
            return NextResponse.json(
                { message: 'Email inválido' },
                { status: 400 }
            )
        }

        const { email } = validation.data

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            // Don't reveal user existence? Or maybe yes for this specific flow?
            // Usually better to return success even if user not found for security, 
            // but for UX in registration flow it might be better to say user not found if we are sure they just registered.
            // Let's return success generic message to be safe.
            return NextResponse.json(
                { message: 'Se o email estiver cadastrado, um novo código será enviado.' },
                { status: 200, headers: createRateLimitHeaders(rateLimitResult) }
            )
        }

        if (user.active) {
            return NextResponse.json(
                { message: 'Conta já está verificada.' },
                { status: 400 }
            )
        }

        // Generate and send new code
        await VerificationService.generateCode(user.id, user.email)

        return NextResponse.json(
            { message: 'Código reenviado com sucesso.' },
            { status: 200, headers: createRateLimitHeaders(rateLimitResult) }
        )

    } catch (error) {
        console.error('Error resending code:', error)
        return NextResponse.json(
            { message: 'Erro ao reenviar código' },
            { status: 500 }
        )
    }
}
