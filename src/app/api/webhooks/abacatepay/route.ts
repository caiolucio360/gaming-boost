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

/**
 * Processa pagamento confirmado (billing.paid)
 * Suporta tanto billing quanto pixQrCode
 */
async function handlePaymentPaid(data: Record<string, unknown>): Promise<{ processed: boolean; message: string }> {
    // O evento billing.paid pode conter dados de billing ou pixQrCode
    const pixQrCode = data.pixQrCode as Record<string, unknown> | undefined
    const billing = data.billing as Record<string, unknown> | undefined

    // Determinar o ID do provedor (prefere pixQrCode se disponível)
    const providerId = (pixQrCode?.id as string) || (billing?.id as string)

    if (!providerId) {
        console.warn('No provider ID found in webhook data')
        return { processed: false, message: 'No provider ID' }
    }

    console.log('Processing payment for providerId:', providerId)

    // Buscar pagamento pelo providerId
    const payment = await prisma.payment.findFirst({
        where: { providerId },
        include: { order: true }
    })

    if (!payment) {
        console.error('Payment not found for providerId:', providerId)

        // Log últimos pagamentos para debug
        const recentPayments = await prisma.payment.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, providerId: true, status: true, orderId: true }
        })
        console.error('Recent payments:', recentPayments)

        return { processed: false, message: 'Payment not found' }
    }

    // Idempotência: verificar se já foi processado
    if (payment.status === 'PAID') {
        console.log(`Payment ${payment.id} already processed, skipping`)
        return { processed: true, message: 'Already processed' }
    }

    // Atualizar pagamento em transação
    await prisma.$transaction(async (tx: any) => {
        // Atualizar pagamento
        await tx.payment.update({
            where: { id: payment.id },
            data: {
                status: 'PAID',
                paidAt: new Date(),
            },
        })

        // Atualizar pedido para PAID se estava PENDING
        if (payment.order.status === 'PENDING') {
            await tx.order.update({
                where: { id: payment.order.id },
                data: { status: 'PAID' },
            })

            // Criar notificação para o usuário
            await tx.notification.create({
                data: {
                    userId: payment.order.userId,
                    type: 'PAYMENT',
                    title: 'Pagamento Confirmado',
                    message: `O pagamento do pedido #${payment.order.id} foi confirmado e aguarda um booster.`,
                },
            })

            console.log(`Payment ${payment.id} confirmed, order ${payment.order.id} updated to PAID`)
        }
    })

    return { processed: true, message: 'Payment confirmed' }
}

/**
 * Processa saque concluído (withdraw.done)
 */
async function handleWithdrawDone(data: Record<string, unknown>): Promise<{ processed: boolean; message: string }> {
    const transaction = data.transaction as Record<string, unknown> | undefined
    const withdrawId = transaction?.id as string
    const externalId = transaction?.externalId as string

    console.log('Processing withdraw.done:', { withdrawId, externalId })

    if (!withdrawId && !externalId) {
        return { processed: false, message: 'No withdraw ID' }
    }

    // Atualizar saque pelo providerId ou externalId
    const updateResult = await prisma.withdrawal.updateMany({
        where: {
            OR: [
                { providerId: withdrawId },
                { externalId: externalId }
            ]
        },
        data: {
            status: 'COMPLETE',
            completedAt: new Date(),
        }
    })

    if (updateResult.count === 0) {
        console.warn('Withdrawal not found:', { withdrawId, externalId })
        return { processed: false, message: 'Withdrawal not found' }
    }

    console.log(`Withdrawal updated to COMPLETE: ${withdrawId || externalId}`)
    return { processed: true, message: 'Withdrawal completed' }
}

/**
 * Processa falha de saque (withdraw.failed)
 */
async function handleWithdrawFailed(data: Record<string, unknown>): Promise<{ processed: boolean; message: string }> {
    const transaction = data.transaction as Record<string, unknown> | undefined
    const withdrawId = transaction?.id as string
    const externalId = transaction?.externalId as string

    console.log('Processing withdraw.failed:', { withdrawId, externalId })

    if (!withdrawId && !externalId) {
        return { processed: false, message: 'No withdraw ID' }
    }

    // Atualizar saque para FAILED
    const updateResult = await prisma.withdrawal.updateMany({
        where: {
            OR: [
                { providerId: withdrawId },
                { externalId: externalId }
            ]
        },
        data: {
            status: 'FAILED',
        }
    })

    if (updateResult.count === 0) {
        console.warn('Withdrawal not found for failed event:', { withdrawId, externalId })
        return { processed: false, message: 'Withdrawal not found' }
    }

    console.log(`Withdrawal marked as FAILED: ${withdrawId || externalId}`)
    return { processed: true, message: 'Withdrawal failed' }
}

/**
 * Processa status de pagamento (REFUNDED, EXPIRED, CANCELLED)
 */
async function handlePaymentStatus(
    providerId: string,
    newStatus: string
): Promise<{ processed: boolean; message: string }> {
    const payment = await prisma.payment.findFirst({
        where: { providerId },
        include: { order: true }
    })

    if (!payment) {
        console.warn(`Payment not found for providerId: ${providerId}`)
        return { processed: false, message: 'Payment not found' }
    }

    // Processar REFUNDED
    if (newStatus === 'REFUNDED' && payment.status !== 'REFUNDED') {
        await prisma.$transaction(async (tx: any) => {
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
        return { processed: true, message: 'Payment refunded' }
    }

    // Processar EXPIRED ou CANCELLED
    if ((newStatus === 'EXPIRED' || newStatus === 'CANCELLED') && payment.status === 'PENDING') {
        await prisma.$transaction(async (tx: any) => {
            await tx.payment.update({
                where: { id: payment.id },
                data: { status: newStatus },
            })

            await tx.notification.create({
                data: {
                    userId: payment.order.userId,
                    type: 'PAYMENT',
                    title: `Pagamento ${newStatus === 'EXPIRED' ? 'Expirado' : 'Cancelado'}`,
                    message: `O pagamento do pedido #${payment.order.id} foi ${newStatus === 'EXPIRED' ? 'expirado' : 'cancelado'}.`,
                },
            })

            console.log(`Payment ${payment.id} ${newStatus}`)
        })
        return { processed: true, message: `Payment ${newStatus.toLowerCase()}` }
    }

    console.log(`Payment ${payment.id} status ${newStatus} already processed or invalid transition`)
    return { processed: true, message: 'No action needed' }
}

export async function POST(request: NextRequest) {
    try {
        // Ler o body como texto para validação de assinatura
        const bodyText = await request.text()

        let body: Record<string, unknown>
        try {
            body = JSON.parse(bodyText)
        } catch (parseError) {
            console.error('Invalid JSON in webhook body:', parseError)
            return NextResponse.json(
                { error: 'Invalid JSON' },
                { status: 400 }
            )
        }

        const data = body.data as Record<string, unknown> | undefined

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
        const eventType = body.event as string | undefined

        // Log completo do webhook recebido para debug
        console.log('========== WEBHOOK RECEIVED ==========')
        console.log('Event Type:', eventType)
        console.log('Full Body:', JSON.stringify(body, null, 2))
        console.log('Headers:', {
            'x-signature': request.headers.get('x-signature'),
            'x-abacatepay-signature': request.headers.get('x-abacatepay-signature'),
            'content-type': request.headers.get('content-type'),
            'user-agent': request.headers.get('user-agent'),
        })
        console.log('Timestamp:', new Date().toISOString())
        console.log('=====================================')

        let result: { processed: boolean; message: string } = { processed: false, message: 'Unknown event' }

        // Processar eventos
        switch (eventType) {
            case 'billing.paid':
                // Este evento é usado tanto para billing quanto para pixQrCode
                result = await handlePaymentPaid(data || {})
                break

            case 'withdraw.done':
                result = await handleWithdrawDone(data || {})
                break

            case 'withdraw.failed':
                result = await handleWithdrawFailed(data || {})
                break

            default:
                // Tentar processar por status do billing/pixQrCode
                const pixQrCode = data?.pixQrCode as Record<string, unknown> | undefined
                const billing = data?.billing as Record<string, unknown> | undefined
                const providerId = (pixQrCode?.id as string) || (billing?.id as string)
                const status = (pixQrCode?.status as string) || (billing?.status as string)

                if (providerId && status) {
                    if (status === 'PAID') {
                        result = await handlePaymentPaid(data || {})
                    } else if (['REFUNDED', 'EXPIRED', 'CANCELLED'].includes(status)) {
                        result = await handlePaymentStatus(providerId, status)
                    }
                } else {
                    console.warn('========== WEBHOOK RECEIVED BUT NO ACTION ==========')
                    console.warn('Event Type:', eventType)
                    console.warn('Data:', JSON.stringify(data, null, 2))
                    console.warn('This might indicate:')
                    console.warn('1. Event format is different than expected')
                    console.warn('2. Event type is not handled')
                    console.warn('3. Data structure is different')
                    console.warn('====================================================')
                }
        }

        return NextResponse.json({
            received: true,
            ...result,
            eventType,
        })
    } catch (error) {
        console.error('Webhook Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}

