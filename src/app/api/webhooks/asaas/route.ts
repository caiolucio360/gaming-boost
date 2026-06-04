import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/services/payment.service'
import { PaymentStatus } from '@/generated/prisma/client'

/**
 * Asaas Webhook Handler
 * Documentação: https://docs.asaas.com/docs/webhook-para-cobrancas
 *
 * Eventos de cobrança (PIX):
 *   PAYMENT_CREATED → cobrança criada (ignoramos)
 *   PAYMENT_RECEIVED → PIX pago e valor disponível na conta ✅
 *   PAYMENT_CONFIRMED → Bloqueio cautelar (PF), aguarda liberação
 *   PAYMENT_OVERDUE → cobrança vencida
 *   PAYMENT_REFUNDED → estorno completo
 *   PAYMENT_PARTIALLY_REFUNDED → estorno parcial
 *   PAYMENT_DELETED → cobrança removida
 *
 * Eventos de transferência (saques):
 *   TRANSFER_DONE → transferência concluída ✅
 *   TRANSFER_FAILED → transferência falhou
 *   TRANSFER_CANCELLED → transferência cancelada
 *
 * Payload: { event, payment: { id, status, ... } } ou { event, transfer: { id, status, ... } }
 */
export async function POST(request: NextRequest) {
  try {
    // Validar token do webhook
    const webhookToken = request.headers.get('asaas-access-token')

    if (!process.env.ASAAS_WEBHOOK_SECRET) {
      console.error('[ASAAS WEBHOOK] ASAAS_WEBHOOK_SECRET is not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    if (webhookToken !== process.env.ASAAS_WEBHOOK_SECRET) {
      console.warn('[ASAAS WEBHOOK] Unauthorized request - invalid token')
      return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 })
    }

    const payload = await request.json()
    const { event, payment, transfer } = payload

    console.log(`[ASAAS WEBHOOK] Event: ${event}`, payment?.id || transfer?.id || '')

    if (!event) {
      return NextResponse.json({ error: 'Missing event field' }, { status: 400 })
    }

    // ========================================================================
    // Eventos de COBRANÇA (payment)
    // ========================================================================

    switch (event) {
      // PIX pago — valor disponível na conta Asaas
      // Este é o evento DEFINITIVO para confirmar pagamento PIX
      case 'PAYMENT_RECEIVED': {
        if (!payment?.id) break
        await PaymentService.processWebhookEvent({
          event: 'billing.paid',
          data: {
            billing: {
              id: payment.id,
              status: 'PAID'
            }
          }
        })
        break
      }

      // Bloqueio cautelar (PF) — pode virar RECEIVED ou REFUNDED em até 72h
      // Para PIX, NÃO devemos marcar como pago aqui.
      // Apenas logamos e aguardamos o PAYMENT_RECEIVED definitivo.
      case 'PAYMENT_CONFIRMED': {
        if (!payment?.id) break
        console.log(`[ASAAS WEBHOOK] Payment ${payment.id} confirmed (awaiting final RECEIVED for PIX)`)
        // Se for cartão de crédito, CONFIRMED já é pagamento válido.
        // Mas como nosso sistema usa PIX, aguardamos RECEIVED.
        // Se quiser suportar cartão no futuro, descomente abaixo:
        // if (payment.billingType === 'CREDIT_CARD') {
        //   await PaymentService.processWebhookEvent({
        //     event: 'billing.paid',
        //     data: { billing: { id: payment.id, status: 'PAID' } }
        //   })
        // }
        break
      }

      // Cobrança vencida
      case 'PAYMENT_OVERDUE': {
        if (!payment?.id) break
        console.log(`[ASAAS WEBHOOK] Payment ${payment.id} overdue`)
        await PaymentService.handlePaymentStatusChange(payment.id, PaymentStatus.EXPIRED)
        break
      }

      // Estorno completo
      case 'PAYMENT_REFUNDED': {
        if (!payment?.id) break
        await PaymentService.handlePaymentStatusChange(payment.id, PaymentStatus.REFUNDED)
        break
      }

      // Estorno parcial — tratamos como estorno completo por simplicidade
      case 'PAYMENT_PARTIALLY_REFUNDED': {
        if (!payment?.id) break
        console.log(`[ASAAS WEBHOOK] Payment ${payment.id} partially refunded`)
        await PaymentService.handlePaymentStatusChange(payment.id, PaymentStatus.REFUNDED)
        break
      }

      // Estorno em processamento — apenas log
      case 'PAYMENT_REFUND_IN_PROGRESS': {
        if (!payment?.id) break
        console.log(`[ASAAS WEBHOOK] Payment ${payment.id} refund in progress`)
        break
      }

      // Cobrança removida/cancelada
      case 'PAYMENT_DELETED': {
        if (!payment?.id) break
        await PaymentService.handlePaymentStatusChange(payment.id, PaymentStatus.CANCELLED)
        break
      }

      // ====================================================================
      // Eventos de TRANSFERÊNCIA (saques para boosters)
      // ====================================================================

      // Transferência concluída com sucesso
      case 'TRANSFER_DONE': {
        if (!transfer?.id) break
        await PaymentService.processWebhookEvent({
          event: 'withdraw.done',
          data: {
            transaction: {
              id: transfer.id
            }
          }
        })
        break
      }

      // Transferência falhou
      case 'TRANSFER_FAILED': {
        if (!transfer?.id) break
        await PaymentService.processWebhookEvent({
          event: 'withdraw.failed',
          data: {
            transaction: {
              id: transfer.id
            }
          }
        })
        break
      }

      // Transferência cancelada
      case 'TRANSFER_CANCELLED': {
        if (!transfer?.id) break
        console.log(`[ASAAS WEBHOOK] Transfer ${transfer.id} cancelled`)
        await PaymentService.processWebhookEvent({
          event: 'withdraw.failed',
          data: {
            transaction: {
              id: transfer.id
            }
          }
        })
        break
      }

      // Eventos informativos — apenas logamos
      case 'PAYMENT_CREATED':
      case 'PAYMENT_UPDATED':
      case 'PAYMENT_RESTORED':
      case 'PAYMENT_CHECKOUT_VIEWED':
      case 'PAYMENT_BANK_SLIP_VIEWED':
      case 'TRANSFER_CREATED':
      case 'TRANSFER_PENDING':
      case 'TRANSFER_IN_BANK_PROCESSING':
      case 'TRANSFER_BLOCKED':
        console.log(`[ASAAS WEBHOOK] Informational event: ${event}`)
        break

      default:
        console.log(`[ASAAS WEBHOOK] Unhandled event: ${event}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('[ASAAS WEBHOOK] Processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
