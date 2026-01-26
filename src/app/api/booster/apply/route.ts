import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'
import { z } from 'zod'
import { SteamProfileUrlSchema } from '@/schemas/steam'
import { validateSteamProfileUrl, fetchCS2Stats, extractSteam64Id } from '@/services/steam.service'

const applySchema = z.object({
    bio: z.string().min(10, 'Bio deve ter pelo menos 10 caracteres'),
    languages: z.array(z.string()).min(1, 'Selecione pelo menos um idioma'),
    portfolioUrl: z.union([z.literal(''), z.string().url('URL inválida')]).optional(),
    // Steam profile fields
    steamProfileUrl: SteamProfileUrlSchema,
    cs2PremierRating: z.number().int().min(0).max(50000).optional(),
    cs2Rank: z.string().max(50).optional(),
    cs2Hours: z.number().int().min(0).optional(),
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

        const { bio, languages, steamProfileUrl, cs2PremierRating, cs2Rank, cs2Hours } = validation.data

        // Validate and extract Steam ID
        const steamValidation = validateSteamProfileUrl(steamProfileUrl)
        if (!steamValidation.valid) {
            return NextResponse.json(
                { message: steamValidation.error },
                { status: 400 }
            )
        }

        const steamId = extractSteam64Id(steamProfileUrl)

        // Update user with Steam profile info and create booster profile
        const [updatedUser, profile] = await prisma.$transaction([
            // Store Steam info on User model
            prisma.user.update({
                where: { id: userId },
                data: {
                    steamProfileUrl,
                    steamId,
                },
            }),
            // Create booster profile with CS2 stats (Steam profile URL/ID now on User)
            prisma.boosterProfile.create({
                data: {
                    userId,
                    bio,
                    languages,
                    verificationStatus: 'PENDING',
                    cs2PremierRating,
                    cs2Rank,
                    cs2Hours,
                },
            }),
        ])

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
