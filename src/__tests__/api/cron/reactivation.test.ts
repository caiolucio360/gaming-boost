/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

// ---- Mocks ----

jest.mock('@/lib/db', () => ({
  prisma: {},
  db: {
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
    order: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}))

jest.mock('@/lib/email', () => ({
  sendReactivationEmail: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/retention-utils', () => ({
  getNextMilestone: jest.fn().mockReturnValue(10000),
}))

// ---- Imports ----

import { POST } from '@/app/api/cron/reactivation/route'
import { db } from '@/lib/db'

const mockFindMany = db.user.findMany as jest.Mock
const mockOrderFindMany = db.order.findMany as jest.Mock

function makeRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {}
  if (authHeader) {
    headers['authorization'] = authHeader
  }
  return new NextRequest('http://localhost/api/cron/reactivation', {
    method: 'POST',
    headers,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  delete process.env.CRON_SECRET

  // Default: empty candidates
  mockFindMany.mockResolvedValue([])
  mockOrderFindMany.mockResolvedValue([])
})

afterEach(() => {
  delete process.env.CRON_SECRET
})

// ============================================================================
// POST /api/cron/reactivation
// ============================================================================

describe('POST /api/cron/reactivation', () => {
  it('returns 500 when CRON_SECRET is not configured', async () => {
    // CRON_SECRET deliberately absent
    const req = makeRequest('Bearer some-token')
    const res = await POST(req)
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.message).toMatch(/not configured/i)
  })

  it('returns 401 when no authorization header is provided', async () => {
    process.env.CRON_SECRET = 'correct-secret'

    const req = makeRequest() // no auth header
    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.message).toBe('Unauthorized')
  })

  it('returns 401 when wrong bearer token is provided', async () => {
    process.env.CRON_SECRET = 'correct-secret'

    const req = makeRequest('Bearer wrong-token')
    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.message).toBe('Unauthorized')
  })

  it('returns 200 with valid token and empty candidate list', async () => {
    process.env.CRON_SECRET = 'correct-secret'

    mockFindMany.mockResolvedValue([])
    mockOrderFindMany.mockResolvedValue([])

    const req = makeRequest('Bearer correct-secret')
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.processed).toBe(0)
    expect(data.sent).toBe(0)
    expect(data.skipped).toBe(0)
  })

  it('returns 200 and skips users who already have a new order', async () => {
    process.env.CRON_SECRET = 'correct-secret'

    mockFindMany.mockResolvedValue([
      {
        id: 'user-1',
        email: 'user@test.com',
        currentDiscountPct: 0.05,
        reactivationDiscountExpiresAt: null,
        orders: [{ id: 99 }], // has a recent order — should be skipped
      },
    ])
    mockOrderFindMany.mockResolvedValue([])

    const req = makeRequest('Bearer correct-secret')
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.processed).toBe(1)
    expect(data.sent).toBe(0)
    expect(data.skipped).toBe(1)
  })
})
