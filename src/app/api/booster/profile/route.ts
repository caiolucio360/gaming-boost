import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'
import { z } from 'zod'

const updateProfileSchema = z.object({
    bio: z.string().min(10).optional(),
    languages: z.array(z.string()).min(1).optional(),
})

export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyAuth(request)

        if (!authResult.authenticated || !authResult.user) {
            return createAuthErrorResponse(authResult.error || 'Não autenticado', 401)
        }

        const userId = authResult.user.id

        const profile = await prisma.boosterProfile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
        })

        if (!profile) {
            return NextResponse.json(
                { message: 'Perfil de booster não encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json({ profile }, { status: 200 })
    } catch (error) {
        console.error('Erro ao buscar perfil:', error)
        return NextResponse.json(
            { message: 'Erro interno ao buscar perfil' },
            { status: 500 }
        )
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const authResult = await verifyAuth(request)

        if (!authResult.authenticated || !authResult.user) {
            return createAuthErrorResponse(authResult.error || 'Não autenticado', 401)
        }

        const userId = authResult.user.id
        const body = await request.json()
        const validation = updateProfileSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { message: 'Dados inválidos', errors: validation.error.format() },
                { status: 400 }
            )
        }

        const { bio, languages } = validation.data

        const profile = await prisma.boosterProfile.update({
            where: { userId },
            data: {
                bio,
                languages,
            },
        })

        return NextResponse.json(
            { message: 'Perfil atualizado com sucesso', profile },
            { status: 200 }
        )
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error)
        return NextResponse.json(
            { message: 'Erro interno ao atualizar perfil' },
            { status: 500 }
        )
    }
}
