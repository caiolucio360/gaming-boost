/**
 * Order Cancellation Endpoint (Client-Initiated)
 *
 * Allows clients to cancel their orders and request refunds.
 * Only PENDING and PAID orders can be cancelled.
 * Orders that are IN_PROGRESS or COMPLETED cannot be cancelled (use dispute system instead).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withApiHandler, parseIntParam } from '@/lib/api-handler'
import { ErrorMessages } from '@/lib/api-errors'
import { refundAsaasPayment } from '@/lib/asaas'
import { refundAbacatePayment } from '@/lib/abacatepay'
import { sendOrderCancelledEmail } from '@/lib/email'
import { apiRateLimiter, createRateLimitHeaders } from '@/lib/rate-limit'
import { ChatService } from '@/services'
import { HttpStatus } from '@/lib/http-status'
import { RateLimits } from '@/lib/rate-limit-config'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  return withApiHandler(
    async ({ request, user, rateLimitResult }) => {
      const userId = user.id

      const { id } = await context.params
      const orderId = parseIntParam(id)
      if (orderId === null) {
        return NextResponse.json({ message: 'ID de pedido inválido' }, { status: HttpStatus.BAD_REQUEST })
      }

      // Cancellation reason from request body (optional)
      const body = await request.json().catch(() => ({}))
      const cancellationReason = body.reason || 'Cancelado pelo cliente'

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          payments: true,
          user: { select: { id: true, email: true, name: true } },
          booster: { select: { id: true, email: true, name: true } },
        },
      })

      if (!order) {
        return NextResponse.json({ message: ErrorMessages.ORDER_NOT_FOUND }, { status: HttpStatus.NOT_FOUND })
      }

      // Ownership: only the order owner can cancel
      if (order.userId !== userId) {
        return NextResponse.json(
          { message: 'Você não tem permissão para cancelar este pedido' },
          { status: HttpStatus.FORBIDDEN }
        )
      }

      if (order.status === 'CANCELLED') {
        return NextResponse.json({ message: 'Este pedido já foi cancelado' }, { status: HttpStatus.BAD_REQUEST })
      }
      if (order.status === 'COMPLETED') {
        return NextResponse.json(
          { message: 'Pedidos já concluídos não podem ser cancelados. Entre em contato com o suporte se houver algum problema.' },
          { status: HttpStatus.BAD_REQUEST }
        )
      }
      if (order.status === 'IN_PROGRESS') {
        return NextResponse.json(
          { message: 'Este pedido já está em andamento e não pode ser cancelado. Entre em contato com o suporte.' },
          { status: HttpStatus.BAD_REQUEST }
        )
      }

      // At this point, order can be cancelled (PENDING or PAID)
      console.log(`📦 Processing cancellation for order #${orderId} (status: ${order.status})`)

      let refundProcessed = false
      let refundNotFound = false

      // Orders typically have one payment
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

          // "Not found" means the payment doesn't exist in the gateway
          // (e.g. simulated/dev payment or already expired). Allow cancellation.
          if (errorMessage === 'Not found' || errorMessage.includes('not found')) {
            refundNotFound = true
            console.warn(`⚠️ Payment ${payment.providerId} not found in ${payment.provider} — cancelling order without refund`)
          } else {
            return NextResponse.json(
              { message: 'Não foi possível processar o reembolso automaticamente. Entre em contato com o suporte.' },
              { status: HttpStatus.INTERNAL_SERVER_ERROR }
            )
          }
        }
      }

      // Update order and payment status atomically
      let metadata: Record<string, unknown> = {}
      try {
        if (order.metadata) {
          metadata = JSON.parse(order.metadata as string)
        }
      } catch {
        metadata = {}
      }

      const { updatedOrder } = await prisma.$transaction(async (tx: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
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

      // Send cancellation email to client (non-blocking)
      sendOrderCancelledEmail(order.user.email, order.id, order.serviceName || 'Boost', order.total).catch((error) => {
        console.error(`❌ Failed to send cancellation email:`, error)
      })

      console.log(`✅ Order #${orderId} cancelled successfully`)

      return NextResponse.json(
        {
          message: refundProcessed
            ? 'Pedido cancelado e reembolso processado com sucesso. O valor será devolvido em até 5 dias úteis.'
            : 'Pedido cancelado com sucesso.',
          order: { id: updatedOrder.id, status: updatedOrder.status, refundProcessed },
        },
        { status: HttpStatus.OK, headers: rateLimitResult ? createRateLimitHeaders(rateLimitResult) : undefined }
      )
    },
    {
      auth: true,
      rateLimit: { limiter: apiRateLimiter, max: RateLimits.ORDER_CANCEL },
      errorMessage: ErrorMessages.ORDER_CANCEL_FAILED,
      endpoint: 'POST /api/orders/[id]/cancel',
    }
  )(request)
}
