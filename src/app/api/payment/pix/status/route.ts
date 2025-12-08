import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'
import { checkPixStatus } from '@/lib/abacatepay'

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
        const { searchParams } = new URL(request.url)
        const paymentId = searchParams.get('paymentId')

        if (!paymentId) {
            return NextResponse.json(
                { message: 'paymentId é obrigatório' },
                { status: 400 }
            )
        }

        // Buscar pagamento
        const payment = await prisma.payment.findUnique({
            where: { id: parseInt(paymentId) },
            include: {
                order: {
                    include: { user: true }
                }
            },
        })

        if (!payment) {
            return NextResponse.json(
                { message: 'Pagamento não encontrado' },
                { status: 404 }
            )
        }

        // Verificar se o usuário é dono do pedido
        if (payment.order.userId !== userId) {
            return NextResponse.json(
                { message: 'Não autorizado' },
                { status: 403 }
            )
        }

        // Se o pagamento já foi confirmado ou cancelado, retornar status do banco
        if (payment.status !== 'PENDING') {
            return NextResponse.json({
                status: payment.status,
                payment,
                message: `Pagamento ${payment.status === 'PAID' ? 'confirmado' : payment.status.toLowerCase()}`
            })
        }

        // Verificar se expirou localmente
        if (payment.expiresAt && new Date(payment.expiresAt) < new Date()) {
            // Atualizar status para expirado
            await prisma.payment.update({
                where: { id: payment.id },
                data: { status: 'EXPIRED' }
            })

            return NextResponse.json({
                status: 'EXPIRED',
                payment: { ...payment, status: 'EXPIRED' },
                message: 'Pagamento expirado'
            })
        }

        // Verificar status no AbacatePay
        if (payment.providerId) {
            try {
                const pixStatus = await checkPixStatus(payment.providerId)

                // Se o status mudou, atualizar no banco
                if (pixStatus.status !== payment.status) {
                    const updatedPayment = await prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: pixStatus.status,
                            paidAt: pixStatus.status === 'PAID' ? new Date() : null,
                        }
                    })

                    // Se foi pago, atualizar o pedido também
                    if (pixStatus.status === 'PAID') {
                        await prisma.$transaction(async (tx) => {
                            // Atualizar pedido para IN_PROGRESS
                            await tx.order.update({
                                where: { id: payment.order.id },
                                data: { status: 'IN_PROGRESS' }
                            })

                            // Criar notificação
                            await tx.notification.create({
                                data: {
                                    userId: payment.order.userId,
                                    type: 'PAYMENT',
                                    title: 'Pagamento Confirmado',
                                    message: `O pagamento do pedido #${payment.order.id} foi confirmado.`,
                                }
                            })
                        })
                    }

                    return NextResponse.json({
                        status: pixStatus.status,
                        payment: { ...updatedPayment },
                        message: pixStatus.status === 'PAID' ? 'Pagamento confirmado!' : `Status: ${pixStatus.status}`
                    })
                }

                return NextResponse.json({
                    status: payment.status,
                    payment,
                    expiresAt: pixStatus.expiresAt,
                    message: 'Aguardando pagamento'
                })
            } catch (error) {
                console.error('Erro ao verificar status no AbacatePay:', error)
                // Em caso de erro na API, retornar status do banco
                return NextResponse.json({
                    status: payment.status,
                    payment,
                    message: 'Status recuperado do banco de dados'
                })
            }
        }

        return NextResponse.json({
            status: payment.status,
            payment,
            message: 'Aguardando pagamento'
        })
    } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error)
        return NextResponse.json(
            { message: 'Erro ao verificar status do pagamento' },
            { status: 500 }
        )
    }
}
