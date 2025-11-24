import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'
import { z } from 'zod'

const applySchema = z.object({
    bio: z.string().min(10, 'Bio deve ter pelo menos 10 caracteres'),
    languages: z.array(z.string()).min(1, 'Selecione pelo menos um idioma'),
    portfolioUrl: z.string().url('URL inválida').optional(),
})

export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyAuth(request)

        if (!authResult.authenticated || !authResult.user) {
            return createAuthErrorResponse(authResult.error || 'Não autenticado', 401)
        }

        const userId = authResult.user.id

        // Verificar se já existe perfil
        const existingProfile = await prisma.boosterProfile.findUnique({
            where: { userId },
        })

        if (existingProfile) {
            return NextResponse.json(
                { message: 'Você já possui um perfil de booster' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const validation = applySchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { message: 'Dados inválidos', errors: validation.error.format() },
                { status: 400 }
            )
        }

        const { bio, languages } = validation.data

        // Criar perfil de booster
        const profile = await prisma.boosterProfile.create({
            data: {
                userId,
                bio,
                languages,
                verificationStatus: 'PENDING',
            },
        })

        // Criar notificação para admins (opcional, futuro)

        return NextResponse.json(
            { message: 'Aplicação enviada com sucesso', profile },
            { status: 201 }
        )
    } catch (error) {
        console.error('Erro ao aplicar para booster:', error)
        return NextResponse.json(
            { message: 'Erro interno ao processar aplicação' },
            { status: 500 }
        )
    }
}
