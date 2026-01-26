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
import { refundPixPayment } from '@/lib/abacatepay'
import { sendOrderCancelledEmail } from '@/lib/email'
import { apiRateLimiter, getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit'

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
          error: 'Muitas tentativas. Aguarde um momento.',
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
        { error: 'ID de pedido inválido' },
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
        service: {
          select: {
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
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Verify ownership: only the order owner can cancel
    if (order.userId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para cancelar este pedido' },
        { status: 403 }
      )
    }

    // Check if order can be cancelled
    if (order.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Este pedido já foi cancelado' },
        { status: 400 }
      )
    }

    if (order.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Pedidos já concluídos não podem ser cancelados. Use o sistema de disputas se houver algum problema.' },
        { status: 400 }
      )
    }

    if (order.status === 'IN_PROGRESS') {
      return NextResponse.json(
        {
          error: 'Este pedido já está em andamento e não pode ser cancelado. Entre em contato com o suporte ou abra uma disputa se necessário.',
          canDispute: true,
        },
        { status: 400 }
      )
    }

    // At this point, order can be cancelled (PENDING or PAID)
    console.log(`📦 Processing cancellation for order #${orderId}`)
    console.log(`   Status: ${order.status}`)
    console.log(`   User: ${order.user.email}`)
    console.log(`   Reason: ${cancellationReason}`)

    let refundProcessed = false
    let refundError: string | null = null

    // Get the first payment (orders typically have one payment)
    const payment = order.payments[0]

    // If order was paid, process refund
    if (order.status === 'PAID' && payment) {
      console.log(`💰 Processing refund for payment ${payment.providerId}`)

      try {
        await refundPixPayment(payment.providerId)
        refundProcessed = true
        console.log(`✅ Refund processed successfully`)
      } catch (error) {
        console.error(`❌ Failed to process refund:`, error)
        refundError = error instanceof Error ? error.message : 'Unknown error'

        // If refund fails, we should not cancel the order
        // Let admin handle it manually
        return NextResponse.json(
          {
            error: 'Não foi possível processar o reembolso automaticamente. Entre em contato com o suporte.',
            details: refundError,
          },
          { status: 500 }
        )
      }
    }

    // Update order status
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        metadata: JSON.stringify({
          ...(order.metadata ? JSON.parse(order.metadata as string) : {}),
          cancelledAt: new Date().toISOString(),
          cancelledBy: 'CLIENT',
          cancellationReason,
          refundProcessed,
        }),
      },
      include: {
        service: true,
        user: true,
      },
    })

    // Update payment status if refund was processed
    if (payment && refundProcessed) {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
        },
      })
    }

    // Send cancellation email to client
    console.log(`📧 Sending cancellation email to ${order.user.email}`)
    sendOrderCancelledEmail(
      order.user.email,
      order.id,
      order.service.name,
      order.total
    ).catch((error) => {
      console.error(`❌ Failed to send cancellation email:`, error)
    })

    console.log(`✅ Order #${orderId} cancelled successfully`)

    return NextResponse.json(
      {
        message: refundProcessed
          ? 'Pedido cancelado e reembolso processado com sucesso. O valor será devolvido em até 5 dias úteis.'
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
        error: 'Erro ao cancelar pedido. Tente novamente ou entre em contato com o suporte.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
