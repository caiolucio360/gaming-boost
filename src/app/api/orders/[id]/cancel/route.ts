/**
 * Order Cancellation Endpoint (Client-Initiated)
 *
 * Allows clients to cancel their orders and request refunds.
 * Only PENDING and PAID orders can be cancelled.
 * Orders that are IN_PROGRESS or COMPLETED cannot be cancelled (use dispute system instead).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'
import { refundAsaasPayment } from '@/lib/asaas'
import { refundAbacatePayment } from '@/lib/abacatepay'
import { sendOrderCancelledEmail } from '@/lib/email'
import { apiRateLimiter, getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit'
import { ChatService } from '@/services'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Rate limiting: 5 cancellation attempts per minute per IP
    const identifier = getIdentifier(request)
    const rateLimitResult = await apiRateLimiter.check(identifier, 5)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          message: 'Muitas tentativas. Aguarde um momento.',
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      )
    }

    // Verify authentication
    const authResult = await verifyAuth(request)

    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Não autenticado',
        401
      )
    }

    const userId = authResult.user.id

    // Get order ID from params
    const { id } = await context.params
    const orderId = parseInt(id, 10)

    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: 'ID de pedido inválido' },
        { status: 400 }
      )
    }

    // Get cancellation reason from request body (optional)
    const body = await request.json().catch(() => ({}))
    const cancellationReason = body.reason || 'Cancelado pelo cliente'

    // Fetch the order with all necessary relations
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        payments: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        booster: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Verify ownership: only the order owner can cancel
    if (order.userId !== userId) {
      return NextResponse.json(
        { message: 'Você não tem permissão para cancelar este pedido' },
        { status: 403 }
      )
    }

    // Check if order can be cancelled
    if (order.status === 'CANCELLED') {
      return NextResponse.json(
        { message: 'Este pedido já foi cancelado' },
        { status: 400 }
      )
    }

    if (order.status === 'COMPLETED') {
      return NextResponse.json(
        { message: 'Pedidos já concluídos não podem ser cancelados. Entre em contato com o suporte se houver algum problema.' },
        { status: 400 }
      )
    }

    if (order.status === 'IN_PROGRESS') {
      return NextResponse.json(
        { message: 'Este pedido já está em andamento e não pode ser cancelado. Entre em contato com o suporte.' },
        { status: 400 }
      )
    }

    // At this point, order can be cancelled (PENDING or PAID)
    console.log(`📦 Processing cancellation for order #${orderId}`)
    console.log(`   Status: ${order.status}`)
    console.log(`   User: ${order.user.email}`)
    console.log(`   Reason: ${cancellationReason}`)

    let refundProcessed = false
    let refundNotFound = false

    // Get the first payment (orders typically have one payment)
    const payment = order.payments[0]

    // If order was paid, process refund
    if (order.status === 'PAID' && payment) {
      console.log(`💰 Processing refund for payment ${payment.providerId} (${payment.provider})`)

      try {
        if (payment.provider === 'ABACATEPAY') {
          await refundAbacatePayment(payment.providerId)
        } else {
          await refundAsaasPayment(payment.providerId)
        }
        refundProcessed = true
        console.log(`✅ Refund processed successfully`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`❌ Failed to process refund:`, error)

        // "Not found" means the payment doesn't exist in Gateway
        // (e.g. simulated/dev payment or already expired). Allow cancellation.
        if (errorMessage === 'Not found' || errorMessage.includes('not found')) {
          refundNotFound = true
          console.warn(`⚠️ Payment ${payment.providerId} not found in ${payment.provider} — cancelling order without refund`)
        } else {
          // Detalhe técnico (ex.: "Saldo insuficiente") já vai pro log acima;
          // o cliente recebe apenas a mensagem amigável.
          return NextResponse.json(
            {
              message: 'Não foi possível processar o reembolso automaticamente. Entre em contato com o suporte.',
            },
            { status: 500 }
          )
        }
      }
    }

    // Update order and payment status atomically in a transaction
    let metadata: Record<string, unknown> = {}
    try {
      if (order.metadata) {
        metadata = JSON.parse(order.metadata as string)
      }
    } catch {
      metadata = {}
    }
    const { updatedOrder } = await db.$transaction(async (tx: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          metadata: JSON.stringify({
            ...metadata,
            cancelledAt: new Date().toISOString(),
            cancelledBy: 'CLIENT',
            cancellationReason,
            refundProcessed,
            ...(refundNotFound && { refundNote: 'Payment not found in AbacatePay — no refund issued' }),
          }),
        },
      })

      if (payment && (refundProcessed || refundNotFound)) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: refundProcessed ? 'REFUNDED' : 'CANCELLED' },
        })
      }

      return { updatedOrder: updated }
    })

    // Wipe Steam credentials from chat (non-blocking, best-effort)
    ChatService.wipeSteamCredentials(orderId).catch((error) => {
      console.error(`Failed to wipe Steam credentials for order #${orderId}:`, error)
    })

    // Send cancellation email to client
    console.log(`📧 Sending cancellation email to ${order.user.email}`)
    sendOrderCancelledEmail(
      order.user.email,
      order.id,
      order.serviceName || 'Boost',
      order.total
    ).catch((error) => {
      console.error(`❌ Failed to send cancellation email:`, error)
    })

    console.log(`✅ Order #${orderId} cancelled successfully`)

    return NextResponse.json(
      {
        message: refundProcessed
          ? 'Pedido cancelado e reembolso processado com sucesso. O valor será devolvido em até 5 dias úteis.'
          : refundNotFound
            ? 'Pedido cancelado com sucesso.'
            : 'Pedido cancelado com sucesso.',
        order: {
          id: updatedOrder.id,
          status: updatedOrder.status,
          refundProcessed,
        },
      },
      {
        status: 200,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    )
  } catch (error) {
    console.error('❌ Error cancelling order:', error)

    return NextResponse.json(
      {
        message: 'Erro ao cancelar pedido. Tente novamente ou entre em contato com o suporte.',
      },
      { status: 500 }
    )
  }
}
