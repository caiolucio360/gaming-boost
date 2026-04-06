/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

// ---- Mocks ----

jest.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    boosterCommission: {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    adminRevenue: {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  },
  db: {},
}))

jest.mock('@/lib/auth-middleware', () => ({
  verifyAdmin: jest.fn().mockResolvedValue({
    authenticated: true,
    user: { id: 99, email: 'admin@test.com', role: 'ADMIN', isDevAdmin: false },
  }),
  createAuthErrorResponseFromResult: jest.fn(() =>
    Response.json({ message: 'Unauthorized' }, { status: 401 })
  ),
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(() => ({
    check: jest.fn().mockResolvedValue({ success: true, remaining: 19 }),
  })),
  getIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
  createRateLimitHeaders: jest.fn().mockReturnValue({}),
}))

jest.mock('@/lib/error-constants', () => ({
  ErrorCodes: {
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  },
  ErrorMessages: {
    ORDER_NOT_FOUND: 'Pedido não encontrado',
    ADMIN_INVALID_STATUS_TRANSITION: 'Transição de status inválida. Verifique o status atual do pedido.',
    ADMIN_ORDER_REQUIRES_BOOSTER: 'Não é possível concluir um pedido sem booster atribuído.',
  },
}))

jest.mock('@/services', () => ({
  ChatService: {
    wipeSteamCredentials: jest.fn().mockResolvedValue(undefined),
  },
}))

// ---- Imports ----

import { GET, PUT } from '@/app/api/admin/orders/[id]/route'
import { prisma } from '@/lib/db'
import { verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'

const mockFindUnique = prisma.order.findUnique as jest.Mock
const mockUpdate = prisma.order.update as jest.Mock
const mockVerifyAdmin = verifyAdmin as jest.Mock
const mockCreateAuthError = createAuthErrorResponseFromResult as jest.Mock

function makeGetRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost/api/admin/orders/${id}`, {
    method: 'GET',
  })
}

function makePutRequest(id: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(`http://localhost/api/admin/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()

  // Default: authenticated admin
  mockVerifyAdmin.mockResolvedValue({
    authenticated: true,
    user: { id: 99, email: 'admin@test.com', role: 'ADMIN', isDevAdmin: false },
  })

  mockCreateAuthError.mockReturnValue(
    Response.json({ message: 'Unauthorized' }, { status: 401 })
  )
})

// ============================================================================
// GET /api/admin/orders/[id]
// ============================================================================

describe('GET /api/admin/orders/[id]', () => {
  it('returns 401 when not authenticated as admin', async () => {
    mockVerifyAdmin.mockResolvedValue({
      authenticated: false,
      error: 'Não autenticado',
    })

    const req = makeGetRequest('1')
    const res = await GET(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 when order does not exist', async () => {
    mockFindUnique.mockResolvedValue(null)

    const req = makeGetRequest('999')
    const res = await GET(req, { params: Promise.resolve({ id: '999' }) })
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.message).toBe('Pedido não encontrado')
  })

  it('returns 400 for non-numeric order ID', async () => {
    const req = makeGetRequest('abc')
    const res = await GET(req, { params: Promise.resolve({ id: 'abc' }) })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.message).toMatch(/inválido/i)
  })

  it('returns 200 with order data for valid ID', async () => {
    const mockOrder = {
      id: 1,
      status: 'PENDING',
      total: 150,
      game: 'CS2',
      gameMode: 'PREMIER',
      user: { id: 1, email: 'client@test.com', name: 'Client' },
      booster: null,
      payments: [],
      commission: null,
      revenues: [],
    }
    mockFindUnique.mockResolvedValue(mockOrder)

    const req = makeGetRequest('1')
    const res = await GET(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('order')
    expect(data.order.id).toBe(1)
  })
})

// ============================================================================
// PUT /api/admin/orders/[id]
// ============================================================================

describe('PUT /api/admin/orders/[id]', () => {
  it('returns 401 when not authenticated as admin', async () => {
    mockVerifyAdmin.mockResolvedValue({
      authenticated: false,
      error: 'Não autenticado',
    })

    const req = makePutRequest('1', { status: 'PAID' })
    const res = await PUT(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid status transition PENDING → COMPLETED', async () => {
    // PENDING can only go to PAID or CANCELLED, not COMPLETED
    mockFindUnique.mockResolvedValue({
      status: 'PENDING',
      boosterId: null,
    })

    const req = makePutRequest('1', { status: 'COMPLETED' })
    const res = await PUT(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data).toHaveProperty('message')
    expect(data.message).toMatch(/inválida/i)
  })

  it('returns 200 for valid status transition PENDING → PAID', async () => {
    mockFindUnique.mockResolvedValue({
      status: 'PENDING',
      boosterId: null,
    })

    mockUpdate.mockResolvedValue({
      id: 1,
      status: 'PAID',
      total: 100,
      user: { id: 1, email: 'client@test.com', name: 'Client' },
      booster: null,
    })

    const req = makePutRequest('1', { status: 'PAID' })
    const res = await PUT(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.order.status).toBe('PAID')
    expect(data.message).toBe('Status atualizado com sucesso')
  })

  it('returns 404 when order does not exist during PUT', async () => {
    mockFindUnique.mockResolvedValue(null)

    const req = makePutRequest('999', { status: 'PAID' })
    const res = await PUT(req, { params: Promise.resolve({ id: '999' }) })
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.message).toBe('Pedido não encontrado')
  })
})
