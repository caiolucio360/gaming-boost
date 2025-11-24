import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'

// POST /api/disputes - Create a dispute
export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyAuth(request)

        if (!authResult.authenticated || !authResult.user) {
            return createAuthErrorResponse(
                authResult.error || 'Não autenticado',
                401
            )
        }

        const userId = authResult.user.id
        const { orderId, reason } = await request.json()

        if (!orderId || !reason) {
            return NextResponse.json(
                { message: 'orderId e reason são obrigatórios' },
                { status: 400 }
            )
        }

        // Verify order exists and belongs to user
        const order = await prisma.order.findUnique({
            where: { id: parseInt(orderId) },
            include: { dispute: true },
        })

        if (!order) {
            return NextResponse.json(
                { message: 'Pedido não encontrado' },
                { status: 404 }
            )
        }

        if (order.userId !== userId && order.boosterId !== userId) {
            return NextResponse.json(
                { message: 'Não autorizado' },
                { status: 403 }
            )
        }

        if (order.dispute) {
            return NextResponse.json(
                { message: 'Já existe uma disputa para este pedido' },
                { status: 400 }
            )
        }

        // Create dispute
        const dispute = await prisma.dispute.create({
            data: {
                orderId: order.id,
                creatorId: userId,
                reason,
                status: 'OPEN',
            },
            include: {
                creator: {
                    select: { id: true, name: true, email: true },
                },
                order: {
                    select: { id: true, total: true, status: true },
                },
            },
        })

        // Create notification for the other party
        const otherPartyId = order.userId === userId ? order.boosterId : order.userId
        if (otherPartyId) {
            await prisma.notification.create({
                data: {
                    userId: otherPartyId,
                    type: 'SYSTEM',
                    title: 'Nova Disputa',
                    message: `Uma disputa foi aberta para o pedido #${order.id}.`,
                    metadata: JSON.stringify({ disputeId: dispute.id }),
                },
            })
        }

        return NextResponse.json({ dispute }, { status: 201 })
    } catch (error) {
        console.error('Erro ao criar disputa:', error)
        return NextResponse.json(
            { message: 'Erro ao criar disputa' },
            { status: 500 }
        )
    }
}

// GET /api/disputes - List disputes
export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyAuth(request)

        if (!authResult.authenticated || !authResult.user) {
            return createAuthErrorResponse(
                authResult.error || 'Não autenticado',
                401
            )
        }

        const userId = authResult.user.id
        const isAdmin = authResult.user.role === 'ADMIN'

        // Admin can see all disputes, users only see their own
        const disputes = await prisma.dispute.findMany({
            where: isAdmin
                ? {}
                : {
                    OR: [
                        { creatorId: userId },
                        { order: { userId } },
                        { order: { boosterId: userId } },
                    ],
                },
            include: {
                creator: {
                    select: { id: true, name: true, email: true },
                },
                order: {
                    select: {
                        id: true,
                        total: true,
                        status: true,
                        user: { select: { id: true, name: true } },
                        booster: { select: { id: true, name: true } },
                    },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ disputes }, { status: 200 })
    } catch (error) {
        console.error('Erro ao buscar disputas:', error)
        return NextResponse.json(
            { message: 'Erro ao buscar disputas' },
            { status: 500 }
        )
    }
}
