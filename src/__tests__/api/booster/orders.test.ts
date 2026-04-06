/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

// ---- Mocks ----

jest.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      $transaction: jest.fn(),
    },
    boosterCommission: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }),
    },
    $transaction: jest.fn().mockResolvedValue([[], 0]),
  },
  db: {},
}))

jest.mock('@/lib/auth-middleware', () => ({
  verifyBooster: jest.fn().mockResolvedValue({
    authenticated: true,
    user: { id: 5, email: 'booster@test.com', role: 'BOOSTER', isDevAdmin: false },
  }),
  createAuthErrorResponse: jest.fn((m: string, s: number) =>
    Response.json({ message: m }, { status: s })
  ),
}))

jest.mock('@/lib/api-errors', () => ({
  createApiErrorResponse: jest.fn((_err: unknown, message: string) =>
    Response.json({ message }, { status: 500 })
  ),
  ErrorMessages: {
    AUTH_UNAUTHENTICATED: 'Não autenticado',
    ORDER_FETCH_FAILED: 'Não foi possível carregar seus pedidos.',
  },
}))

// ---- Imports ----

import { GET } from '@/app/api/booster/orders/route'
import { prisma } from '@/lib/db'
import { verifyBooster } from '@/lib/auth-middleware'

const mockVerifyBooster = verifyBooster as jest.Mock
const mockTransaction = prisma.$transaction as jest.Mock

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/booster/orders', {
    method: 'GET',
  })
}

beforeEach(() => {
  jest.clearAllMocks()

  // Default: authenticated booster
  mockVerifyBooster.mockResolvedValue({
    authenticated: true,
    user: { id: 5, email: 'booster@test.com', role: 'BOOSTER', isDevAdmin: false },
  })

  // Default transaction returns empty results
  mockTransaction.mockResolvedValue([[], 0])

  // Default aggregates
  ;(prisma.boosterCommission.aggregate as jest.Mock).mockResolvedValue({
    _sum: { amount: null },
  })
  ;(prisma.order.count as jest.Mock).mockResolvedValue(0)
})

// ============================================================================
// GET /api/booster/orders
// ============================================================================

describe('GET /api/booster/orders', () => {
  it('returns 401 when unauthenticated', async () => {
    mockVerifyBooster.mockResolvedValue({
      authenticated: false,
      error: 'Não autenticado',
    })

    const req = makeRequest()
    const res = await GET(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data).toHaveProperty('message')
  })

  it('returns 401 when authenticated as CLIENT (verifyBooster rejects non-boosters)', async () => {
    mockVerifyBooster.mockResolvedValue({
      authenticated: false,
      error: 'Acesso negado. Permissão insuficiente.',
    })

    const req = makeRequest()
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 200 with orders and stats for authenticated BOOSTER', async () => {
    mockTransaction.mockResolvedValue([
      [
        {
          id: 10,
          status: 'PAID',
          total: 200,
          game: 'CS2',
          gameMode: 'PREMIER',
          serviceType: 'RANK_BOOST',
          currentRating: 5000,
          targetRating: 8000,
          boosterId: null,
          user: { id: 1, email: 'client@test.com', name: 'Client' },
          booster: null,
          commission: null,
        },
      ],
      1,
    ])

    ;(prisma.order.count as jest.Mock).mockResolvedValue(1)
    ;(prisma.boosterCommission.aggregate as jest.Mock).mockResolvedValue({
      _sum: { amount: 500 },
    })

    const req = makeRequest()
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('orders')
    expect(data).toHaveProperty('stats')
    expect(data).toHaveProperty('pagination')
    expect(Array.isArray(data.orders)).toBe(true)
    expect(data.orders[0]).toHaveProperty('service')
  })

  it('returns empty orders list when no orders exist', async () => {
    mockTransaction.mockResolvedValue([[], 0])
    ;(prisma.order.count as jest.Mock).mockResolvedValue(0)
    ;(prisma.boosterCommission.aggregate as jest.Mock).mockResolvedValue({
      _sum: { amount: null },
    })

    const req = makeRequest()
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.orders).toHaveLength(0)
    expect(data.pagination.total).toBe(0)
    expect(data.stats.totalEarnings).toBe(0)
  })
})
