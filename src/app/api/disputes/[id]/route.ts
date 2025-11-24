import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/disputes/[id] - Get dispute details with messages
export async function GET(
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
        const isAdmin = authResult.user.role === 'ADMIN'

        const dispute = await prisma.dispute.findUnique({
            where: { id: disputeId },
            include: {
                creator: {
                    select: { id: true, name: true, email: true, image: true },
                },
                order: {
                    select: {
                        id: true,
                        total: true,
                        status: true,
                        user: { select: { id: true, name: true, image: true } },
                        booster: { select: { id: true, name: true, image: true } },
                    },
                },
                messages: {
                    include: {
                        author: {
                            select: { id: true, name: true, image: true },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        })

        if (!dispute) {
            return NextResponse.json(
                { message: 'Disputa não encontrada' },
                { status: 404 }
            )
        }

        // Check authorization
        if (
            !isAdmin &&
            dispute.creatorId !== userId &&
            dispute.order.user.id !== userId &&
            dispute.order.booster?.id !== userId
        ) {
            return NextResponse.json(
                { message: 'Não autorizado' },
                { status: 403 }
            )
        }

        return NextResponse.json({ dispute }, { status: 200 })
    } catch (error) {
        console.error('Erro ao buscar disputa:', error)
        return NextResponse.json(
            { message: 'Erro ao buscar disputa' },
            { status: 500 }
        )
    }
}

// PATCH /api/disputes/[id] - Resolve dispute (Admin only)
export async function PATCH(
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

        if (authResult.user.role !== 'ADMIN') {
            return NextResponse.json(
                { message: 'Apenas administradores podem resolver disputas' },
                { status: 403 }
            )
        }

        const { id } = await params
        const disputeId = parseInt(id)
        const { status, resolution } = await request.json()

        if (!status || !['RESOLVED_REFUND', 'RESOLVED_PAYOUT', 'RESOLVED_PARTIAL', 'CANCELLED'].includes(status)) {
            return NextResponse.json(
                { message: 'Status inválido' },
                { status: 400 }
            )
        }

        const dispute = await prisma.dispute.update({
            where: { id: disputeId },
            data: { status },
            include: {
                order: {
                    select: {
                        id: true,
                        userId: true,
                        boosterId: true,
                    },
                },
            },
        })

        // Send notification to involved parties
        const notificationMessage = `A disputa do pedido #${dispute.orderId} foi resolvida: ${status}`

        await prisma.notification.createMany({
            data: [
                {
                    userId: dispute.order.userId,
                    type: 'SYSTEM',
                    title: 'Disputa Resolvida',
                    message: notificationMessage,
                },
                ...(dispute.order.boosterId
                    ? [{
                        userId: dispute.order.boosterId,
                        type: 'SYSTEM' as const,
                        title: 'Disputa Resolvida',
                        message: notificationMessage,
                    }]
                    : []),
            ],
        })

        // Optionally add a resolution message
        if (resolution) {
            await prisma.disputeMessage.create({
                data: {
                    disputeId: dispute.id,
                    authorId: authResult.user.id,
                    content: `[RESOLUÇÃO ADMIN] ${resolution}`,
                },
            })
        }

        return NextResponse.json({ dispute }, { status: 200 })
    } catch (error) {
        console.error('Erro ao resolver disputa:', error)
        return NextResponse.json(
            { message: 'Erro ao resolver disputa' },
            { status: 500 }
        )
    }
}
