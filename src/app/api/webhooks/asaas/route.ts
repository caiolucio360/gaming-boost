import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/services/payment.service'

export async function POST(request: NextRequest) {
  try {
    // Validação opcional: Verificar token de acesso do webhook se o Asaas estiver enviando
    const webhookToken = request.headers.get('asaas-access-token')
    
    if (!process.env.ASAAS_WEBHOOK_SECRET) {
      console.error('ASAAS_WEBHOOK_SECRET is not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    if (webhookToken !== process.env.ASAAS_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 })
    }

    const payload = await request.json()
    console.log('Asaas Webhook Payload:', JSON.stringify(payload, null, 2))

    const { event, payment } = payload

    if (!event || !payment) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Mapeando os eventos do Asaas para processWebhookEvent do PaymentService
    switch (event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        await PaymentService.processWebhookEvent({
          event: 'billing.paid', // Simulando o evento antigo ou você pode adaptar o PaymentService depois
          data: {
            billing: {
              id: payment.id,
              status: 'PAID'
            }
          }
        })
        break

      case 'PAYMENT_REFUNDED':
        await PaymentService.handlePaymentStatusChange(payment.id, 'REFUNDED' as any)
        break

      case 'PAYMENT_OVERDUE':
      case 'PAYMENT_DELETED':
        await PaymentService.handlePaymentStatusChange(payment.id, 'CANCELLED' as any)
        break

      // Eventos de transferência (saque)
      case 'TRANSFER_CONFIRMED':
        await PaymentService.processWebhookEvent({
          event: 'withdraw.done',
          data: {
            transaction: {
              id: payload.transfer?.id
            }
          }
        })
        break

      case 'TRANSFER_FAILED':
        await PaymentService.processWebhookEvent({
          event: 'withdraw.failed',
          data: {
            transaction: {
              id: payload.transfer?.id
            }
          }
        })
        break
        
      default:
        console.log(`Unhandled Asaas event: ${event}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Asaas Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
