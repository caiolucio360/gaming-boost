/**
 * Auto-Refund Cron Job
 *
 * This endpoint is designed to be called by Vercel Cron
 * It automatically refunds orders that have been in PAID status
 * for longer than the configured timeout period without a booster accepting them.
 *
 * Schedule: Runs every hour (configured in vercel.json)
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrderTimeoutHours } from '@/lib/env'
import { refundPixPayment } from '@/lib/abacatepay'
import { sendOrderCancelledEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Maximum execution time for this serverless function (60 seconds)

/**
 * POST /api/cron/auto-refund
 *
 * Security: This endpoint should be protected by Vercel Cron secret
 * or IP allowlist in production
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret (mandatory in all environments)
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('[CRON] CRON_SECRET not configured')
      return NextResponse.json(
        { message: 'Cron secret not configured' },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[CRON] Unauthorized access attempt', {
        ip: request.headers.get('x-forwarded-for'),
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if auto-refund is enabled
    const timeoutHours = getOrderTimeoutHours()
    if (!timeoutHours) {
      console.log('⏭️  Auto-refund disabled (ORDER_TIMEOUT_HOURS not configured)')
      return NextResponse.json({
        message: 'Auto-refund disabled',
        refunded: 0,
      })
    }

    console.log('🔄 Starting auto-refund cron job...')
    console.log(`⏱️  Timeout configured: ${timeoutHours} hours`)

    // Calculate cutoff time
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - timeoutHours)

    console.log(`📅 Cutoff time: ${cutoffTime.toISOString()}`)

    // Find orders that need to be refunded
    // - Status: PAID (payment received but not yet accepted by booster)
    // - boosterId: null (no booster assigned)
    // - updatedAt: older than cutoff time
    const ordersToRefund = await db.order.findMany({
      where: {
        status: 'PAID',
        boosterId: null,
        updatedAt: {
          lt: cutoffTime,
        },
      },
      include: {
        payments: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    })

    console.log(`📦 Found ${ordersToRefund.length} orders to refund`)

    if (ordersToRefund.length === 0) {
      return NextResponse.json({
        message: 'No orders to refund',
        refunded: 0,
      })
    }

    const results = {
      success: [] as number[],
      failed: [] as { orderId: number; error: string }[],
    }

    // Process each order
    for (const order of ordersToRefund) {
      try {
        console.log(`💰 Processing refund for order #${order.id}`)

        // Get payment info
        const payment = order.payments[0]
        if (!payment) {
          console.error(`❌ Order #${order.id} has no payment record`)
          results.failed.push({
            orderId: order.id,
            error: 'No payment record found',
          })
          continue
        }

        // Process refund via AbacatePay
        console.log(`🔄 Refunding payment ${payment.providerId}...`)
        await refundPixPayment(payment.providerId)

        // Update order status to CANCELLED
        let metadata: Record<string, unknown> = {}
        try {
          if (order.metadata) {
            metadata = JSON.parse(order.metadata as string)
          }
        } catch {
          metadata = {}
        }
        await db.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            metadata: JSON.stringify({
              ...metadata,
              cancelledReason: 'AUTO_TIMEOUT',
              cancelledAt: new Date().toISOString(),
              timeoutHours,
            }),
          },
        })

        // Update payment status to REFUNDED
        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: 'REFUNDED',
          },
        })

        // Send cancellation email
        console.log(`📧 Sending cancellation email to ${order.user.email}...`)
        sendOrderCancelledEmail(
          order.user.email,
          order.id,
          order.serviceName || 'Boost',
          order.total
        ).catch((error) => {
          console.error(`❌ Failed to send email for order #${order.id}:`, error)
        })

        console.log(`✅ Successfully refunded order #${order.id}`)
        results.success.push(order.id)
      } catch (error) {
        console.error(`❌ Failed to refund order #${order.id}:`, error)
        results.failed.push({
          orderId: order.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    console.log('🎯 Auto-refund cron job completed')
    console.log(`✅ Successfully refunded: ${results.success.length} orders`)
    console.log(`❌ Failed: ${results.failed.length} orders`)

    return NextResponse.json({
      message: 'Auto-refund completed',
      refunded: results.success.length,
      failed: results.failed.length,
      details: {
        success: results.success,
        failed: results.failed,
      },
    })
  } catch (error) {
    console.error('❌ Auto-refund cron job error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
