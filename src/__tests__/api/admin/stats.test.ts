/**
 * @jest-environment node
 */

import { GET } from '@/app/api/admin/stats/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth-middleware'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    order: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    service: {
      count: jest.fn(),
    },
  },
}))

// Mock do auth-middleware
jest.mock('@/lib/auth-middleware', () => ({
  verifyAdmin: jest.fn(),
  createAuthErrorResponse: jest.fn((message: string, status: number) => {
    return new Response(JSON.stringify({ message }), { status })
  }),
  createAuthErrorResponseFromResult: jest.fn((authResult: any) => {
    const isPermissionError = authResult.error?.includes('Acesso negado') || 
                             authResult.error?.includes('Permissão') ||
                             authResult.error?.includes('insuficiente') ||
                             authResult.error?.includes('administradores')
    const status = isPermissionError ? 403 : 401
    return new Response(JSON.stringify({ message: authResult.error || 'Não autenticado' }), { status })
  }),
}))

describe('GET /api/admin/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar estatísticas do admin', async () => {
    // Mock admin user
    ;(verifyAdmin as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'admin@test.com',
        role: 'ADMIN',
      },
    })

    // Mock counts
    ;(prisma.user.count as jest.Mock)
      .mockResolvedValueOnce(10) // totalUsers
      .mockResolvedValueOnce(7) // totalClients
      .mockResolvedValueOnce(2) // totalBoosters
      .mockResolvedValueOnce(1) // totalAdmins

    ;(prisma.order.count as jest.Mock)
      .mockResolvedValueOnce(25) // totalOrders
      .mockResolvedValueOnce(5) // pendingOrders
      .mockResolvedValueOnce(10) // inProgressOrders
      .mockResolvedValueOnce(8) // completedOrders
      .mockResolvedValueOnce(2) // cancelledOrders

    ;(prisma.service.count as jest.Mock).mockResolvedValue(3)

    ;(prisma.order.aggregate as jest.Mock).mockResolvedValue({
      _sum: { total: 5000 },
    })

    ;(prisma.order.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        status: 'PENDING',
        total: 100,
        createdAt: new Date('2024-01-01'),
        user: { email: 'user@test.com', name: 'User' },
        service: { name: 'Boost CS2', game: 'CS2' },
      },
    ])

    const request = new NextRequest('http://localhost:3000/api/admin/stats', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.stats).toBeDefined()
    expect(data.stats.users.total).toBe(10)
    expect(data.stats.users.clients).toBe(7)
    expect(data.stats.users.boosters).toBe(2)
    expect(data.stats.users.admins).toBe(1)
    expect(data.stats.orders.total).toBe(25)
    expect(data.stats.revenue.total).toBe(5000)
    expect(data.stats.recentOrders).toHaveLength(1)
  })

  it('deve retornar erro 401 se o usuário não estiver autenticado', async () => {
    ;(verifyAdmin as jest.Mock).mockResolvedValue({
      authenticated: false,
      error: 'Não autenticado',
    })

    const request = new NextRequest('http://localhost:3000/api/admin/stats', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toContain('Não autenticado')
  })

  it('deve retornar erro 403 se o usuário não for admin', async () => {
    ;(verifyAdmin as jest.Mock).mockResolvedValue({
      authenticated: false,
      error: 'Acesso negado. Permissão insuficiente.',
    })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 123,
      role: 'CLIENT',
    })

    const request = new NextRequest('http://localhost:3000/api/admin/stats', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.message).toContain('Acesso negado')
  })
})

