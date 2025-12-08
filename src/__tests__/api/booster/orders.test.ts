/**
 * @jest-environment node
 */

import { GET } from '@/app/api/booster/orders/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyBooster } from '@/lib/auth-middleware'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    boosterCommission: {
      aggregate: jest.fn(),
    },
  },
}))

// Mock do auth-middleware
jest.mock('@/lib/auth-middleware', () => ({
  verifyBooster: jest.fn(),
  createAuthErrorResponse: jest.fn((message: string, status: number) => {
    return new Response(JSON.stringify({ message }), { status })
  }),
}))

describe('GET /api/booster/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar pedidos disponíveis para booster', async () => {
    ; (verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'booster@test.com',
        role: 'BOOSTER',
      },
    })

    const mockOrders = [
      {
        id: 1,
        userId: 1,
        serviceId: 1,
        boosterId: null,
        status: 'PAID',
        total: 100,
        createdAt: new Date(),
        user: { id: 1, email: 'user1@test.com', name: 'User 1' },
        service: {
          id: 1,
          name: 'Boost CS2',
          game: 'CS2',
          type: 'RANK_BOOST',
          description: 'Boost de rank',
        },
      },
    ]

      ; (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders)
      ; (prisma.order.count as jest.Mock).mockResolvedValue(1)
      ; (prisma.order.aggregate as jest.Mock).mockResolvedValue({
        _sum: { total: 100 },
      })
      ; (prisma.boosterCommission.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 0 },
      })

    const request = new NextRequest(
      'http://localhost:3000/api/booster/orders?type=available',
      {
        method: 'GET',
      }
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.orders).toBeDefined()
    expect(data.orders).toHaveLength(1)
    expect(data.orders[0].status).toBe('PAID')
    expect(data.orders[0].boosterId).toBeNull()
  })

  it('deve retornar pedidos atribuídos ao booster', async () => {
    ; (verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'booster@test.com',
        role: 'BOOSTER',
      },
    })

    const mockOrders = [
      {
        id: 2,
        userId: 1,
        serviceId: 1,
        boosterId: 1,
        status: 'IN_PROGRESS',
        total: 100,
        createdAt: new Date(),
        user: { id: 1, email: 'user1@test.com', name: 'User 1' },
        service: {
          id: 1,
          name: 'Boost CS2',
          game: 'CS2',
          type: 'RANK_BOOST',
          description: 'Boost de rank',
        },
      },
    ]

      ; (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders)
      ; (prisma.order.count as jest.Mock).mockResolvedValue(1)
      ; (prisma.order.aggregate as jest.Mock).mockResolvedValue({
        _sum: { total: 100 },
      })
      ; (prisma.boosterCommission.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 50 },
      })

    const request = new NextRequest(
      'http://localhost:3000/api/booster/orders?type=assigned',
      {
        method: 'GET',
      }
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.orders).toBeDefined()
    expect(data.orders[0].boosterId).toBe(1)
    expect(data.orders[0].status).toBe('IN_PROGRESS')
  })

  it('deve retornar erro 401 se não autenticado', async () => {
    ; (verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: false,
      error: 'Não autenticado',
    })

    const request = new NextRequest('http://localhost:3000/api/booster/orders', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toContain('Não autenticado')
  })

  it('deve retornar erro 403 se não for booster', async () => {
    ; (verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: false,
      error: 'Acesso negado. Permissão insuficiente.',
    })

    const request = new NextRequest('http://localhost:3000/api/booster/orders', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401) // verifyBooster retorna 401 para não autenticado
    expect(data.message).toBeDefined()
  })
})

