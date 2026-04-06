/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import crypto from 'crypto'

// ---- Mocks ----

jest.mock('@/lib/rate-limit', () => ({
  webhookRateLimiter: {
    check: jest.fn().mockResolvedValue({ success: true, remaining: 99 }),
  },
  getIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
  createRateLimitHeaders: jest.fn().mockReturnValue({}),
}))

jest.mock('@/services', () => ({
  PaymentService: {
    processWebhookEvent: jest.fn().mockResolvedValue({
      success: true,
      data: { processed: true },
    }),
  },
}))

// ---- Imports ----

import { POST } from '@/app/api/webhooks/abacatepay/route'

function makeSignedRequest(
  body: Record<string, unknown>,
  secret: string | null,
  providedSignature?: string
): NextRequest {
  const bodyText = JSON.stringify(body)

  let signature: string
  if (providedSignature !== undefined) {
    signature = providedSignature
  } else if (secret) {
    signature = crypto.createHmac('sha256', secret).update(bodyText).digest('hex')
  } else {
    signature = ''
  }

  return new NextRequest('http://localhost/api/webhooks/abacatepay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-signature': signature,
    },
    body: bodyText,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  // Remove env var by default — individual tests set it
  delete process.env.ABACATEPAY_WEBHOOK_SECRET
})

afterEach(() => {
  delete process.env.ABACATEPAY_WEBHOOK_SECRET
})

// ============================================================================
// POST /api/webhooks/abacatepay
// ============================================================================

describe('POST /api/webhooks/abacatepay', () => {
  it('returns 500 when ABACATEPAY_WEBHOOK_SECRET is not configured', async () => {
    // env var deliberately absent
    const req = makeSignedRequest({ event: 'payment.paid' }, null, 'some-sig')
    const res = await POST(req)
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data).toHaveProperty('error')
    expect(data.error).toMatch(/not configured/i)
  })

  it('returns 401 when signature is missing', async () => {
    process.env.ABACATEPAY_WEBHOOK_SECRET = 'test-secret'

    const req = new NextRequest('http://localhost/api/webhooks/abacatepay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'payment.paid' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data).toHaveProperty('error')
  })

  it('returns 401 when signature is invalid', async () => {
    process.env.ABACATEPAY_WEBHOOK_SECRET = 'test-secret'

    const req = makeSignedRequest(
      { event: 'payment.paid' },
      'test-secret',
      'totally-wrong-signature-value-that-wont-match'
    )
    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data).toHaveProperty('error')
  })

  it('returns 200 when signature is valid', async () => {
    process.env.ABACATEPAY_WEBHOOK_SECRET = 'test-secret'

    const req = makeSignedRequest({ event: 'payment.paid', data: { id: 'pay_123' } }, 'test-secret')
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.received).toBe(true)
  })
})
