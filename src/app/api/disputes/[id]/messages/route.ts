import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/disputes/[id]/messages - Send a message in a dispute
export async function POST(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const authResult = await verifyAuth(request)

        if (!authResult.authenticated || !authResult.user) {
            return createAuthErrorResponse(
                authResult.error || 'Não autenticado',
                401
            )
        }

        const { id } = await params
        const disputeId = parseInt(id)
        const userId = authResult.user.id
        const { content } = await request.json()

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { message: 'Conteúdo da mensagem é obrigatório' },
                { status: 400 }
            )
        }

        // Verify dispute exists and user has access
        const dispute = await prisma.dispute.findUnique({
            where: { id: disputeId },
            include: {
                order: {
                    select: { userId: true, boosterId: true },
                },
            },
        })

        if (!dispute) {
            return NextResponse.json(
                { message: 'Disputa não encontrada' },
                { status: 404 }
            )
        }

        const isAdmin = authResult.user.role === 'ADMIN'
        const isInvolved =
            dispute.creatorId === userId ||
            dispute.order.userId === userId ||
            dispute.order.boosterId === userId

        if (!isAdmin && !isInvolved) {
            return NextResponse.json(
                { message: 'Não autorizado' },
                { status: 403 }
            )
        }

        if (dispute.status !== 'OPEN') {
            return NextResponse.json(
                { message: 'Esta disputa já foi resolvida' },
                { status: 400 }
            )
        }

        // Create message
        const message = await prisma.disputeMessage.create({
            data: {
                disputeId: dispute.id,
                authorId: userId,
                content: content.trim(),
            },
            include: {
                author: {
                    select: { id: true, name: true, image: true },
                },
            },
        })

        // Send notification to other parties
        const recipientIds = [
            dispute.order.userId,
            dispute.order.boosterId,
            dispute.creatorId,
        ].filter((id): id is number => id !== null && id !== userId)

        if (recipientIds.length > 0) {
            await prisma.notification.createMany({
                data: recipientIds.map((recipientId) => ({
                    userId: recipientId,
                    type: 'SYSTEM' as const,
                    title: 'Nova Mensagem na Disputa',
                    message: `Nova mensagem na disputa #${dispute.id}`,
                    metadata: JSON.stringify({ disputeId: dispute.id }),
                })),
            })
        }

        return NextResponse.json({ message }, { status: 201 })
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error)
        return NextResponse.json(
            { message: 'Erro ao enviar mensagem' },
            { status: 500 }
        )
    }
}
