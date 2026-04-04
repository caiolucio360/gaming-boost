/**
 * Security controls tests
 * Verify critical security checks work correctly.
 * These test the guards that happen before any DB/external calls.
 */
import { NextRequest } from 'next/server'

// ─── /api/payment/pix/simulate ────────────────────────────────────────────────

describe('/api/payment/pix/simulate', () => {
  it('returns 403 in production', async () => {
    const original = process.env.NODE_ENV
    ;(process.env as any).NODE_ENV = 'production'

    // Re-require after env change so the module reads the updated value
    jest.resetModules()
    const { POST } = await import('@/app/api/payment/pix/simulate/route')
    const req = new NextRequest('http://localhost/api/payment/pix/simulate', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const res = await POST(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.message).toMatch(/produção/i)

    ;(process.env as any).NODE_ENV = original
    jest.resetModules()
  })
})

// ─── /api/cron/auto-refund ────────────────────────────────────────────────────

describe('/api/cron/auto-refund', () => {
  it('returns 500 when CRON_SECRET is not configured', async () => {
    const original = process.env.CRON_SECRET
    delete process.env.CRON_SECRET

    jest.resetModules()
    const { POST } = await import('@/app/api/cron/auto-refund/route')
    const req = new Request('http://localhost/api/cron/auto-refund', { method: 'POST' })

    const res = await POST(req)
    expect(res.status).toBe(500)

    process.env.CRON_SECRET = original
    jest.resetModules()
  })

  it('returns 401 when Bearer token is wrong', async () => {
    process.env.CRON_SECRET = 'correct-secret'

    jest.resetModules()
    const { POST } = await import('@/app/api/cron/auto-refund/route')
    const req = new Request('http://localhost/api/cron/auto-refund', {
      method: 'POST',
      headers: { authorization: 'Bearer wrong-secret' },
    })

    const res = await POST(req)
    expect(res.status).toBe(401)

    jest.resetModules()
  })

  it('returns 401 with no authorization header', async () => {
    process.env.CRON_SECRET = 'correct-secret'

    jest.resetModules()
    const { POST } = await import('@/app/api/cron/auto-refund/route')
    const req = new Request('http://localhost/api/cron/auto-refund', { method: 'POST' })

    const res = await POST(req)
    expect(res.status).toBe(401)

    jest.resetModules()
  })
})

// ─── /api/webhooks/abacatepay ─────────────────────────────────────────────────

describe('/api/webhooks/abacatepay', () => {
  beforeEach(() => {
    jest.resetModules()
    // Mock rate limiter to always pass so we reach the secret check
    jest.mock('@/lib/rate-limit', () => ({
      webhookRateLimiter: { check: jest.fn().mockResolvedValue({ success: true, remaining: 99, reset: Date.now() }) },
      getIdentifier: jest.fn().mockReturnValue('test-ip'),
      createRateLimitHeaders: jest.fn().mockReturnValue({}),
    }))
  })

  afterEach(() => {
    jest.resetModules()
  })

  it('returns 500 when ABACATEPAY_WEBHOOK_SECRET is not configured', async () => {
    const original = process.env.ABACATEPAY_WEBHOOK_SECRET
    delete process.env.ABACATEPAY_WEBHOOK_SECRET

    const { POST } = await import('@/app/api/webhooks/abacatepay/route')
    const req = new NextRequest('http://localhost/api/webhooks/abacatepay', {
      method: 'POST',
      body: JSON.stringify({ event: 'billing.paid', data: {} }),
    })

    const res = await POST(req)
    expect(res.status).toBe(500)

    if (original) process.env.ABACATEPAY_WEBHOOK_SECRET = original
    else delete process.env.ABACATEPAY_WEBHOOK_SECRET
  })

  it('returns 401 when signature is invalid', async () => {
    process.env.ABACATEPAY_WEBHOOK_SECRET = 'test-secret'

    const { POST } = await import('@/app/api/webhooks/abacatepay/route')
    const req = new NextRequest('http://localhost/api/webhooks/abacatepay', {
      method: 'POST',
      headers: { 'x-signature': 'invalidsignature' },
      body: JSON.stringify({ event: 'billing.paid', data: {} }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})
