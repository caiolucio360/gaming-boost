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

        const { data } = body

        // Extract billing data - AbacatePay nests it under data.billing
        const billing = data?.billing || data
        const billingId = billing?.id
        const billingStatus = billing?.status

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

        // Check for event type (AbacatePay standard)
        const eventType = body.event || body.type

        // Log completo do webhook recebido para debug
        console.log('========== WEBHOOK RECEIVED ==========')
        console.log('Event Type:', eventType)
        console.log('Billing ID:', billingId)
        console.log('Billing Status:', billingStatus)
        console.log('Full Body:', JSON.stringify(body, null, 2))
        console.log('Headers:', {
            'x-signature': request.headers.get('x-signature'),
            'x-abacatepay-signature': request.headers.get('x-abacatepay-signature'),
            'content-type': request.headers.get('content-type'),
            'user-agent': request.headers.get('user-agent'),
        })
        console.log('Timestamp:', new Date().toISOString())
        console.log('=====================================')

        if (eventType === 'billing.paid' || billingStatus === 'PAID') {
            if (billingId) {
                // Verificar idempotência: buscar pagamento
                const payment = await prisma.payment.findFirst({
                    where: { providerId: billingId },
                    include: { order: true }
                })

                if (!payment) {
                    console.error('========== PAYMENT NOT FOUND ==========')
                    console.error('Provider ID from webhook:', billingId)
                    console.error('Searching for payment with providerId:', billingId)
                    console.error('Available payments (last 5):', await prisma.payment.findMany({
                        take: 5,
                        orderBy: { createdAt: 'desc' },
                        select: { id: true, providerId: true, status: true, orderId: true }
                    }))
                    console.error('======================================')
                    return NextResponse.json({
                        received: true,
                        message: 'Payment not found',
                        providerId: billingId
                    })
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
        }
        else if (eventType === 'withdraw.failed') {
            console.log('Webhook: Falha no saque', data)
            // TODO: Implementar lógica de falha de saque
        }
        // Handle other statuses (REFUNDED, EXPIRED, CANCELLED) via billingStatus fallback
        else if (billingId) {
            const payment = await prisma.payment.findFirst({
                where: { providerId: billingId },
                include: { order: true }
            })

            if (!payment) {
                console.warn(`Payment not found for providerId: ${billingId}`)
                return NextResponse.json({ received: true, message: 'Payment not found' })
            }

            // Processar REFUNDED
            if (billingStatus === 'REFUNDED' && payment.status !== 'REFUNDED') {
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
            else if ((billingStatus === 'EXPIRED' || billingStatus === 'CANCELLED') && payment.status === 'PENDING') {
                await prisma.$transaction(async (tx) => {
                    await tx.payment.update({
                        where: { id: payment.id },
                        data: { status: billingStatus },
                    })

                    await tx.notification.create({
                        data: {
                            userId: payment.order.userId,
                            type: 'PAYMENT',
                            title: `Pagamento ${billingStatus === 'EXPIRED' ? 'Expirado' : 'Cancelado'}`,
                            message: `O pagamento do pedido #${payment.order.id} foi ${billingStatus === 'EXPIRED' ? 'expirado' : 'cancelado'}.`,
                        },
                    })

                    console.log(`Payment ${payment.id} ${billingStatus}`)
                })
            } else {
                console.log(`Payment ${payment.id} status ${billingStatus} already processed or invalid transition`)
            }
        } else {
            console.warn('========== WEBHOOK RECEIVED BUT NO ACTION ==========')
            console.warn('Event Type:', eventType)
            console.warn('Billing ID:', billingId)
            console.warn('Billing Status:', billingStatus)
            console.warn('Full Body:', JSON.stringify(body, null, 2))
            console.warn('This might indicate:')
            console.warn('1. Event format is different than expected')
            console.warn('2. Event type is not handled')
            console.warn('3. Data structure is different')
            console.warn('====================================================')
        }

        return NextResponse.json({
            received: true,
            processed: true,
            eventType,
            billingId
        })
    } catch (error) {
        console.error('Webhook Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
