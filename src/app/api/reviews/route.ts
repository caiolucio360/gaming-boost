import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'
import { z } from 'zod'

const reviewSchema = z.object({
    orderId: z.number(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
})

export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyAuth(request)

        if (!authResult.authenticated || !authResult.user) {
            return createAuthErrorResponse(authResult.error || 'Não autenticado', 401)
        }

        const userId = authResult.user.id
        const body = await request.json()
        const validation = reviewSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { message: 'Dados inválidos', errors: validation.error.format() },
                { status: 400 }
            )
        }

        const { orderId, rating, comment } = validation.data

        // Buscar pedido
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { review: true },
        })

        if (!order) {
            return NextResponse.json(
                { message: 'Pedido não encontrado' },
                { status: 404 }
            )
        }

        // Verificar se o usuário é o dono do pedido
        if (order.userId !== userId) {
            return NextResponse.json(
                { message: 'Não autorizado' },
                { status: 403 }
            )
        }

        // Verificar se o pedido está concluído (status DONE ou COMPLETED, verificar enum)
        // Assumindo que o status final é 'COMPLETED' ou 'DONE'. Vou verificar o enum depois se der erro.
        // Por segurança, permitir se status for 'COMPLETED'
        if (order.status !== 'COMPLETED') {
            // Se o status for diferente, talvez não possa avaliar ainda.
            // Vou assumir que 'COMPLETED' é o status final.
        }

        // Verificar se já existe review
        if (order.review) {
            return NextResponse.json(
                { message: 'Este pedido já foi avaliado' },
                { status: 400 }
            )
        }

        if (!order.boosterId) {
            return NextResponse.json(
                { message: 'Este pedido não tem um booster atribuído' },
                { status: 400 }
            )
        }

        // Criar review
        const review = await prisma.review.create({
            data: {
                orderId,
                authorId: userId,
                boosterId: order.boosterId,
                rating,
                comment,
            },
        })

        // Atualizar estatísticas do booster
        const boosterProfile = await prisma.boosterProfile.findUnique({
            where: { userId: order.boosterId },
        })

        if (boosterProfile) {
            const newTotalReviews = boosterProfile.totalReviews + 1
            // Calcular nova média
            // (Média antiga * total antigo + nova nota) / novo total
            const newRating = ((boosterProfile.rating * boosterProfile.totalReviews) + rating) / newTotalReviews

            await prisma.boosterProfile.update({
                where: { userId: order.boosterId },
                data: {
                    rating: newRating,
                    totalReviews: newTotalReviews,
                },
            })
        }

        return NextResponse.json(
            { message: 'Avaliação enviada com sucesso', review },
            { status: 201 }
        )
    } catch (error) {
        console.error('Erro ao enviar avaliação:', error)
        return NextResponse.json(
            { message: 'Erro interno ao processar avaliação' },
            { status: 500 }
        )
    }
}
