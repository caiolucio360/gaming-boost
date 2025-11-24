import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { eventId, data } = body

        // Check for event type (AbacatePay standard) or fallback to data.status
        const eventType = body.event || body.type

        console.log('Webhook received:', { eventType, dataId: data?.id })

        if (eventType === 'billing.paid' || (data && data.status === 'PAID')) {
            if (data) {
                const payment = await prisma.payment.findFirst({
                    where: { providerId: data.id },
                    include: { order: true }
                })

                if (payment && payment.status !== 'PAID') {
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
            }
        }
        else if (eventType === 'withdraw.done') {
            console.log('Webhook: Saque realizado com sucesso', data)
            // TODO: Implementar lógica de atualização de saque quando houver model de Saque/Withdrawal
            // Ex: await prisma.withdrawal.update({ where: { providerId: data.id }, data: { status: 'COMPLETED' } })
        }
        else if (eventType === 'withdraw.failed') {
            console.log('Webhook: Falha no saque', data)
            // TODO: Implementar lógica de falha de saque
            // Ex: await prisma.withdrawal.update({ where: { providerId: data.id }, data: { status: 'FAILED' } })
        }
        // Handle other statuses (REFUNDED, EXPIRED, CANCELLED) via data.status fallback if eventType is not specific
        else if (data) {
            const payment = await prisma.payment.findFirst({
                where: { providerId: data.id },
                include: { order: true }
            })

            if (payment) {
                if (data.status === 'REFUNDED' && payment.status !== 'REFUNDED') {
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
                else if ((data.status === 'EXPIRED' || data.status === 'CANCELLED') && payment.status === 'PENDING') {
                    await prisma.payment.update({
                        where: { id: payment.id },
                        data: { status: data.status },
                    })

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
