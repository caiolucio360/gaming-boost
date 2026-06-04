import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/services/payment.service'

/**
 * Endpoint de Webhook para o AbacatePay
 * Recebe notificações sobre pagamentos (PIX), saques, etc.
 */
export async function POST(request: NextRequest) {
  try {
    // Validação opcional: Verificar token se o AbacatePay suportar
    // (Pode adicionar verificações de cabeçalho específicas do AbacatePay aqui)

    const rawBody = await request.text()
    
    if (!rawBody) {
      return NextResponse.json({ error: 'Empty body' }, { status: 400 })
    }

    let payload
    try {
      payload = JSON.parse(rawBody)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    console.log('[WEBHOOK ABACATEPAY] Recebido:', JSON.stringify(payload, null, 2))

    // Processa o evento com o PaymentService (que aceita o padrão de WebhookData)
    const result = await PaymentService.processWebhookEvent(payload)

    if (result.success) {
      return NextResponse.json({ received: true, ...result.data }, { status: 200 })
    } else {
      console.error('[WEBHOOK ABACATEPAY] Falha ao processar:', result.error)
      // Retornamos 200 mesmo em erros de processamento interno para o provedor não ficar repetindo
      // se não for um erro tratável do nosso lado, mas podemos mudar para 400 se o payload for inválido
      return NextResponse.json({ error: result.error, code: result.code }, { status: 200 })
    }
  } catch (error) {
    console.error('[WEBHOOK ABACATEPAY] Erro fatal no processamento:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
