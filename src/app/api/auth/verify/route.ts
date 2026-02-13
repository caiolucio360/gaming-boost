import { NextRequest, NextResponse } from 'next/server'
import { VerificationService } from '@/services/verification.service'
import { z } from 'zod'
import { validateBody } from '@/lib/validate'
import { authRateLimiter, getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit'
import { prisma } from '@/lib/db'
import { generateToken } from '@/lib/jwt'

const VerifySchema = z.object({
    email: z.string().email(),
    code: z.string().length(6)
})

export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const identifier = getIdentifier(request)
        const rateLimitResult = await authRateLimiter.check(identifier, 5) // 5 attempts per 15 min

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { message: 'Muitas tentativas. Tente novamente mais tarde.' },
                { status: 429, headers: createRateLimitHeaders(rateLimitResult) }
            )
        }

        const body = await request.json()
        const validation = validateBody(VerifySchema, body)

        if (!validation.success) {
            return NextResponse.json(
                { message: 'Dados inválidos', errors: validation.errors },
                { status: 400 }
            )
        }

        const { email, code } = validation.data

        // Find user to get ID
        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return NextResponse.json(
                { message: 'Usuário não encontrado' },
                { status: 404 }
            )
        }

        if (user.active) {
            return NextResponse.json(
                { message: 'Conta já verificada' },
                { status: 200 }
            )
        }

        // Validate code
        const result = await VerificationService.validateCode(user.id, code)

        if (!result.success) {
            return NextResponse.json(
                { message: result.error },
                { status: 400 }
            )
        }

        // Generate token for auto-login
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role
        })

        return NextResponse.json(
            {
                message: 'Conta verificada com sucesso',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    active: true
                }
            },
            { status: 200 }
        )

    } catch (error) {
        console.error('Error verifying code:', error)
        return NextResponse.json(
            { message: 'Erro ao verificar código' },
            { status: 500 }
        )
    }
}
