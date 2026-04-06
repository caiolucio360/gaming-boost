/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

// ---- Mocks ----

jest.mock('@/lib/auth-middleware', () => ({
  verifyAuth: jest.fn().mockResolvedValue({
    authenticated: true,
    user: { id: 1, email: 'user@test.com', role: 'CLIENT', name: 'Test' },
  }),
  createAuthErrorResponse: jest.fn((m: string, s: number) =>
    Response.json({ message: m }, { status: s })
  ),
  createAuthErrorResponseFromResult: jest.fn(() =>
    Response.json({ message: 'Unauthorized' }, { status: 401 })
  ),
}))

jest.mock('@/services', () => ({
  OrderService: {
    getUserCS2Orders: jest.fn(),
    createOrder: jest.fn(),
  },
}))

jest.mock('@/lib/rate-limit', () => ({
  apiRateLimiter: {
    check: jest.fn().mockResolvedValue({ success: true, remaining: 9 }),
  },
  getIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
  createRateLimitHeaders: jest.fn().mockReturnValue({}),
}))

jest.mock('@/lib/api-errors', () => ({
  createApiErrorResponse: jest.fn((_err: unknown, message: string) =>
    Response.json({ message }, { status: 500 })
  ),
  ErrorMessages: {
    AUTH_UNAUTHENTICATED: 'Não autenticado',
    ORDER_FETCH_FAILED: 'Não foi possível carregar seus pedidos.',
    ORDER_CREATE_FAILED: 'Não foi possível criar seu pedido.',
    RATE_LIMIT_GENERIC: 'Muitas tentativas. Aguarde um momento.',
    INVALID_DATA: 'Dados inválidos',
  },
}))

jest.mock('@/lib/error-constants', () => ({
  ErrorCodes: {
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    DUPLICATE_ORDER: 'DUPLICATE_ORDER',
  },
  getStatusForError: jest.fn().mockReturnValue(409),
}))

// ---- Imports ----

import { GET, POST } from '@/app/api/orders/route'
import { OrderService } from '@/services'
import { verifyAuth } from '@/lib/auth-middleware'

const mockGetUserCS2Orders = OrderService.getUserCS2Orders as jest.Mock
const mockCreateOrder = OrderService.createOrder as jest.Mock
const mockVerifyAuth = verifyAuth as jest.Mock

function makeRequest(
  method: 'GET' | 'POST',
  body?: Record<string, unknown>
): NextRequest {
  return new NextRequest('http://localhost/api/orders', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  jest.clearAllMocks()

  // Default: authenticated client
  mockVerifyAuth.mockResolvedValue({
    authenticated: true,
    user: { id: 1, email: 'user@test.com', role: 'CLIENT', name: 'Test' },
  })
})

// ============================================================================
// GET /api/orders
// ============================================================================

describe('GET /api/orders', () => {
  it('returns 401 when unauthenticated', async () => {
    mockVerifyAuth.mockResolvedValue({
      authenticated: false,
      error: 'Não autenticado',
    })

    const req = makeRequest('GET')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 200 with orders list for authenticated user', async () => {
    mockGetUserCS2Orders.mockResolvedValue({
      success: true,
      data: [
        { id: 1, status: 'PENDING', total: 100, game: 'CS2' },
        { id: 2, status: 'COMPLETED', total: 150, game: 'CS2' },
      ],
    })

    const req = makeRequest('GET')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('orders')
    expect(Array.isArray(data.orders)).toBe(true)
    expect(data.orders).toHaveLength(2)
  })

  it('returns 500 when OrderService fails', async () => {
    mockGetUserCS2Orders.mockResolvedValue({
      success: false,
      error: 'Database error',
    })

    const req = makeRequest('GET')
    const res = await GET(req)
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data).toHaveProperty('message')
  })
})

// ============================================================================
// POST /api/orders
// ============================================================================

describe('POST /api/orders', () => {
  it('returns 400 when total is missing (validation error)', async () => {
    const req = makeRequest('POST', { game: 'CS2', gameMode: 'PREMIER' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data).toHaveProperty('message')
    expect(data.message).toMatch(/total/i)
  })

  it('returns 409 when duplicate active order exists in same gameMode', async () => {
    mockCreateOrder.mockResolvedValue({
      success: false,
      error: 'Você já possui um pedido ativo neste modo de jogo.',
      code: 'DUPLICATE_ORDER',
    })

    const req = makeRequest('POST', {
      total: 100,
      game: 'CS2',
      gameMode: 'PREMIER',
      currentRating: 5000,
      targetRating: 10000,
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data).toHaveProperty('message')
    expect(data).toHaveProperty('code', 'DUPLICATE_ORDER')
  })

  it('returns 201 on successful order creation', async () => {
    mockCreateOrder.mockResolvedValue({
      success: true,
      data: {
        id: 42,
        status: 'PENDING',
        total: 100,
        game: 'CS2',
        gameMode: 'PREMIER',
      },
    })

    const req = makeRequest('POST', {
      total: 100,
      game: 'CS2',
      gameMode: 'PREMIER',
      currentRating: 5000,
      targetRating: 10000,
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data).toHaveProperty('order')
    expect(data.order.id).toBe(42)
    expect(data.message).toBe('Solicitação criada com sucesso')
  })
})
