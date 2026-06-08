import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/services/payment.service'

/**
 * Endpoint de Webhook para o AbacatePay
 * Recebe notificações sobre pagamentos (PIX), saques, etc.
 *
 * Autenticação: o AbacatePay envia o segredo configurado no painel como query param
 * `?webhookSecret=...` na URL do webhook. Validamos contra ABACATEPAY_WEBHOOK_SECRET.
 * Mesmo padrão de segurança do webhook Asaas (500 se não configurado, 401 se inválido).
 */
export async function POST(request: NextRequest) {
  try {
    // Validação de autenticação do webhook — NUNCA processar sem verificar o segredo
    if (!process.env.ABACATEPAY_WEBHOOK_SECRET) {
      console.error('[WEBHOOK ABACATEPAY] ABACATEPAY_WEBHOOK_SECRET não configurado')
      return NextResponse.json({ message: 'Webhook secret not configured' }, { status: 500 })
    }

    const providedSecret = request.nextUrl.searchParams.get('webhookSecret')
    if (providedSecret !== process.env.ABACATEPAY_WEBHOOK_SECRET) {
      console.warn('[WEBHOOK ABACATEPAY] Requisição não autorizada — segredo inválido')
      return NextResponse.json({ message: 'Unauthorized webhook request' }, { status: 401 })
    }

    const rawBody = await request.text()

    if (!rawBody) {
      return NextResponse.json({ message: 'Empty body' }, { status: 400 })
    }

    let payload
    try {
      payload = JSON.parse(rawBody)
    } catch (e) {
      return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 })
    }

    // Log apenas evento/ID — nunca o payload completo (dados de transação)
    console.log('[WEBHOOK ABACATEPAY] Evento:', payload?.event, payload?.data?.billing?.id || payload?.data?.pixQrCode?.id || '')

    // Processa o evento com o PaymentService (que aceita o padrão de WebhookData)
    const result = await PaymentService.processWebhookEvent(payload)

    if (result.success) {
      return NextResponse.json({ received: true, ...result.data }, { status: 200 })
    } else {
      console.error('[WEBHOOK ABACATEPAY] Falha ao processar:', result.error)
      // Retornamos 200 mesmo em erros de processamento interno para o provedor não ficar repetindo
      return NextResponse.json({ message: result.error, code: result.code }, { status: 200 })
    }
  } catch (error) {
    console.error('[WEBHOOK ABACATEPAY] Erro fatal no processamento:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
