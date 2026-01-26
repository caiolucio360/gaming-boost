import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { webhookRateLimiter, getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit'
import { PaymentService } from '@/services'

/**
 * Validates webhook signature from AbacatePay
 * Uses HMAC SHA256 with timing-safe comparison
 */
function validateWebhookSignature(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    console.warn('Webhook signature validation failed: missing signature or secret')
    return false
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')

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
    // Rate limiting: 100 webhook calls per minute per IP
    const identifier = getIdentifier(request)
    const rateLimitResult = await webhookRateLimiter.check(identifier, 100)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many webhook requests' },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult)
        }
      )
    }

    // Read body as text for signature validation
    const bodyText = await request.text()

    let body: Record<string, unknown>
    try {
      body = JSON.parse(bodyText)
    } catch {
      console.error('Invalid JSON in webhook body')
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      )
    }

    // Validate webhook signature (if configured)
    const signature = request.headers.get('x-signature') || request.headers.get('x-abacatepay-signature')
    const webhookSecret = process.env.ABACATEPAY_WEBHOOK_SECRET

    if (webhookSecret && !validateWebhookSignature(bodyText, signature, webhookSecret)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Log webhook for debugging
    const eventType = body.event as string | undefined
    console.log('========== WEBHOOK RECEIVED ==========')
    console.log('Event Type:', eventType)
    console.log('Full Body:', JSON.stringify(body, null, 2))
    console.log('Timestamp:', new Date().toISOString())
    console.log('=====================================')

    // Process webhook through PaymentService (single entry point)
    const result = await PaymentService.processWebhookEvent({
      event: eventType,
      data: body.data as Record<string, unknown> | undefined,
    })

    if (!result.success) {
      console.error('Webhook processing failed:', result.error)
      return NextResponse.json(
        {
          received: true,
          processed: false,
          error: result.error,
          eventType,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      received: true,
      ...result.data,
      eventType,
    })
  } catch (error) {
    console.error('Webhook Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
