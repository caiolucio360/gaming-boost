import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { eventId, data } = body

        // TODO: Verificar assinatura do webhook se disponível no futuro
        // Por enquanto, confiamos no ID da transação

        if (data) {
            const payment = await prisma.payment.findFirst({
                where: { providerId: data.id },
                include: { order: true }
            })

            if (payment) {
                // Handle PAID status
                if (data.status === 'PAID' && payment.status !== 'PAID') {
                    // Atualizar pagamento
                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'PAID',
                            paidAt: new Date(),
                        },
                    })

                    // Atualizar pedido para IN_PROGRESS se estava PENDING
                    if (payment.order.status === 'PENDING') {
                        await prisma.order.update({
                            where: { id: payment.order.id },
                            data: { status: 'IN_PROGRESS' },
                        })

                        // Criar notificação para o usuário
                        await prisma.notification.create({
                            data: {
                                userId: payment.order.userId,
                                type: 'PAYMENT',
                                title: 'Pagamento Confirmado',
                                message: `O pagamento do pedido #${payment.order.id} foi confirmado.`,
                            },
                        })
                    }
                }
                // Handle REFUNDED status
                else if (data.status === 'REFUNDED' && payment.status !== 'REFUNDED') {
                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: { status: 'REFUNDED' },
                    })

                    // Cancelar pedido se for reembolsado
                    if (payment.order.status !== 'CANCELLED') {
                        await prisma.order.update({
                            where: { id: payment.order.id },
                            data: { status: 'CANCELLED' },
                        })

                        await prisma.notification.create({
                            data: {
                                userId: payment.order.userId,
                                type: 'PAYMENT',
                                title: 'Pagamento Reembolsado',
                                message: `O pagamento do pedido #${payment.order.id} foi reembolsado e o pedido cancelado.`,
                            },
                        })
                    }
                }
                // Handle EXPIRED or CANCELLED status
                else if ((data.status === 'EXPIRED' || data.status === 'CANCELLED') && payment.status === 'PENDING') {
                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: { status: data.status },
                    })

                    // Se o pedido ainda estiver pendente, podemos cancelar ou apenas notificar
                    // Por enquanto, mantemos o pedido como PENDING para permitir nova tentativa de pagamento
                    // ou podemos cancelar se a lógica de negócio exigir

                    await prisma.notification.create({
                        data: {
                            userId: payment.order.userId,
                            type: 'PAYMENT',
                            title: `Pagamento ${data.status === 'EXPIRED' ? 'Expirado' : 'Cancelado'}`,
                            message: `O pagamento do pedido #${payment.order.id} foi ${data.status === 'EXPIRED' ? 'expirado' : 'cancelado'}.`,
                        },
                    })
                }
            }
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Webhook Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
