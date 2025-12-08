import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'
import { simulatePixPayment } from '@/lib/abacatepay'

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
        const body = await request.json()
        const { paymentId } = body

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

        // Verificar se o pagamento está pendente
        if (payment.status !== 'PENDING') {
            return NextResponse.json(
                { message: `Pagamento já está ${payment.status}`, payment },
                { status: 400 }
            )
        }

        // Verificar se tem providerId
        if (!payment.providerId) {
            return NextResponse.json(
                { message: 'Pagamento sem ID do provedor' },
                { status: 400 }
            )
        }

        try {
            console.log('========== SIMULATING PIX PAYMENT ==========')
            console.log('Payment ID:', payment.id)
            console.log('Provider ID:', payment.providerId)
            console.log('============================================')

            // Simular pagamento no AbacatePay
            const result = await simulatePixPayment(payment.providerId)

            console.log('Simulation result:', result.status)

            // Atualizar pagamento no banco
            const updatedPayment = await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: result.status,
                    paidAt: result.status === 'PAID' ? new Date() : null,
                }
            })

            // Se foi pago, atualizar o pedido também
            if (result.status === 'PAID') {
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
                            title: 'Pagamento Confirmado (Simulação)',
                            message: `O pagamento do pedido #${payment.order.id} foi confirmado via simulação.`,
                        }
                    })
                })
            }

            return NextResponse.json({
                success: true,
                status: result.status,
                payment: updatedPayment,
                message: 'Pagamento simulado com sucesso!'
            })
        } catch (error) {
            console.error('Erro ao simular pagamento:', error)

            // Erro específico para quando não está em dev mode
            if (error instanceof Error && error.message.includes('dev')) {
                return NextResponse.json(
                    { message: 'Simulação só funciona em ambiente de desenvolvimento' },
                    { status: 400 }
                )
            }

            return NextResponse.json(
                {
                    message: 'Erro ao simular pagamento',
                    error: error instanceof Error ? error.message : 'Erro desconhecido'
                },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error('Erro na rota de simulação:', error)
        return NextResponse.json(
            { message: 'Erro ao processar simulação' },
            { status: 500 }
        )
    }
}
