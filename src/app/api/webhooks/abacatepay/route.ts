import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

/**
 * Valida a assinatura do webhook do AbacatePay
 * NOTA: AbacatePay pode enviar assinatura no header 'x-signature' ou similar
 * Verifique a documentação oficial para o formato exato
 */
function validateWebhookSignature(
    body: string,
    signature: string | null,
    secret: string
): boolean {
    if (!signature || !secret) {
        console.warn('Webhook signature validation skipped: missing signature or secret')
        // Em desenvolvimento, pode retornar true se não houver secret configurado
        // Em produção, isso deve ser obrigatório
        return process.env.NODE_ENV !== 'production'
    }

    try {
        // AbacatePay geralmente usa HMAC SHA256
        // Ajuste conforme a documentação oficial
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex')

        // Comparação segura para evitar timing attacks
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        )
    } catch (error) {
        console.error('Error validating webhook signature:', error)
        return false
    }
}

export async function POST(request: NextRequest) {
    try {
        // Ler o body como texto para validação de assinatura
        const bodyText = await request.text()
        
        let body: any
        try {
            body = JSON.parse(bodyText)
        } catch (parseError) {
            console.error('Invalid JSON in webhook body:', parseError)
            return NextResponse.json(
                { error: 'Invalid JSON' },
                { status: 400 }
            )
        }
        
        const { eventId, data } = body

        // Validar assinatura do webhook (se configurado)
        const signature = request.headers.get('x-signature') || request.headers.get('x-abacatepay-signature')
        const webhookSecret = process.env.ABACATEPAY_WEBHOOK_SECRET

        if (webhookSecret && !validateWebhookSignature(bodyText, signature, webhookSecret)) {
            console.error('Invalid webhook signature')
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            )
        }

        // Check for event type (AbacatePay standard) or fallback to data.status
        const eventType = body.event || body.type

        console.log('Webhook received:', { 
            eventType, 
            eventId,
            dataId: data?.id,
            timestamp: new Date().toISOString()
        })

        if (eventType === 'billing.paid' || (data && data.status === 'PAID')) {
            if (data && data.id) {
                // Verificar idempotência: buscar pagamento
                const payment = await prisma.payment.findFirst({
                    where: { providerId: data.id },
                    include: { order: true }
                })

                if (!payment) {
                    console.warn(`Payment not found for providerId: ${data.id}`)
                    return NextResponse.json({ received: true, message: 'Payment not found' })
                }

                // Idempotência: verificar se já foi processado
                if (payment.status === 'PAID') {
                    console.log(`Payment ${payment.id} already processed, skipping`)
                    return NextResponse.json({ received: true, message: 'Already processed' })
                }

                // Atualizar pagamento em transação
                await prisma.$transaction(async (tx) => {
                    // Atualizar pagamento
                    await tx.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'PAID',
                            paidAt: new Date(),
                        },
                    })

                    // Atualizar pedido para IN_PROGRESS se estava PENDING
                    if (payment.order.status === 'PENDING') {
                        await tx.order.update({
                            where: { id: payment.order.id },
                            data: { status: 'IN_PROGRESS' },
                        })

                        // Criar notificação para o usuário
                        await tx.notification.create({
                            data: {
                                userId: payment.order.userId,
                                type: 'PAYMENT',
                                title: 'Pagamento Confirmado',
                                message: `O pagamento do pedido #${payment.order.id} foi confirmado.`,
                            },
                        })

                        console.log(`Payment ${payment.id} confirmed, order ${payment.order.id} updated to IN_PROGRESS`)
                    }
                })
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
        else if (data && data.id) {
            const payment = await prisma.payment.findFirst({
                where: { providerId: data.id },
                include: { order: true }
            })

            if (!payment) {
                console.warn(`Payment not found for providerId: ${data.id}`)
                return NextResponse.json({ received: true, message: 'Payment not found' })
            }

            // Processar REFUNDED
            if (data.status === 'REFUNDED' && payment.status !== 'REFUNDED') {
                await prisma.$transaction(async (tx) => {
                    await tx.payment.update({
                        where: { id: payment.id },
                        data: { status: 'REFUNDED' },
                    })

                    // Cancelar pedido se for reembolsado
                    if (payment.order.status !== 'CANCELLED') {
                        await tx.order.update({
                            where: { id: payment.order.id },
                            data: { status: 'CANCELLED' },
                        })

                        await tx.notification.create({
                            data: {
                                userId: payment.order.userId,
                                type: 'PAYMENT',
                                title: 'Pagamento Reembolsado',
                                message: `O pagamento do pedido #${payment.order.id} foi reembolsado e o pedido cancelado.`,
                            },
                        })

                        console.log(`Payment ${payment.id} refunded, order ${payment.order.id} cancelled`)
                    }
                })
            }
            // Processar EXPIRED ou CANCELLED
            else if ((data.status === 'EXPIRED' || data.status === 'CANCELLED') && payment.status === 'PENDING') {
                await prisma.$transaction(async (tx) => {
                    await tx.payment.update({
                        where: { id: payment.id },
                        data: { status: data.status },
                    })

                    await tx.notification.create({
                        data: {
                            userId: payment.order.userId,
                            type: 'PAYMENT',
                            title: `Pagamento ${data.status === 'EXPIRED' ? 'Expirado' : 'Cancelado'}`,
                            message: `O pagamento do pedido #${payment.order.id} foi ${data.status === 'EXPIRED' ? 'expirado' : 'cancelado'}.`,
                        },
                    })

                    console.log(`Payment ${payment.id} ${data.status}`)
                })
            } else {
                console.log(`Payment ${payment.id} status ${data.status} already processed or invalid transition`)
            }
        } else {
            console.log('Webhook received but no actionable data:', { eventType, hasData: !!data })
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Webhook Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
