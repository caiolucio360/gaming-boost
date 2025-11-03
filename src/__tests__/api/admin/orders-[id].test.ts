/**
 * @jest-environment node
 */

import { GET, PUT } from '@/app/api/admin/orders/[id]/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock de cookies do Next.js
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn((key: string) => {
      if (key === 'userId') {
        return { value: 'admin123' }
      }
      return null
    }),
  })),
}))

describe('GET /api/admin/orders/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar pedido específico para admin', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin123',
      role: 'ADMIN',
    })

    const mockOrder = {
      id: 'order1',
      userId: 'user1',
      serviceId: 'service1',
      status: 'PENDING',
      total: 100,
      createdAt: new Date(),
      user: {
        id: 'user1',
        email: 'user1@test.com',
        name: 'User 1',
      },
      service: {
        id: 'service1',
        name: 'Boost CS2',
        game: 'CS2',
      },
    }

    ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)

    const request = new NextRequest('http://localhost:3000/api/admin/orders/order1', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({ id: 'order1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.order).toBeDefined()
    expect(data.order.id).toBe('order1')
    expect(data.order.status).toBe('PENDING')
  })

  it('deve retornar erro 404 se pedido não existir', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin123',
      role: 'ADMIN',
    })

    ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/admin/orders/orderinexistente', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({ id: 'orderinexistente' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.message).toContain('não encontrado')
  })
})

describe('PUT /api/admin/orders/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve atualizar status do pedido com sucesso', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin123',
      role: 'ADMIN',
    })

    const existingOrder = {
      id: 'order1',
      userId: 'user1',
      serviceId: 'service1',
      status: 'PENDING',
      total: 100,
    }

    const updatedOrder = {
      ...existingOrder,
      status: 'IN_PROGRESS',
    }

    ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(existingOrder)
    ;(prisma.order.update as jest.Mock).mockResolvedValue(updatedOrder)

    const request = new NextRequest('http://localhost:3000/api/admin/orders/order1', {
      method: 'PUT',
      body: JSON.stringify({
        status: 'IN_PROGRESS',
      }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: 'order1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.order).toBeDefined()
    expect(data.order.status).toBe('IN_PROGRESS')
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order1' },
      data: { status: 'IN_PROGRESS' },
      include: {
        user: { select: { id: true, email: true, name: true } },
        service: true,
        booster: { select: { id: true, email: true, name: true } },
      },
    })
  })

  it('deve retornar erro ao tentar atualizar pedido inexistente', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin123',
      role: 'ADMIN',
    })

    // A API não verifica se o pedido existe antes de atualizar
    // Ela simplesmente tenta atualizar e pode retornar erro
    ;(prisma.order.update as jest.Mock).mockRejectedValue(
      new Error('Record to update not found')
    )

    const request = new NextRequest('http://localhost:3000/api/admin/orders/orderinexistente', {
      method: 'PUT',
      body: JSON.stringify({
        status: 'IN_PROGRESS',
      }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: 'orderinexistente' }) })
    
    // A API retorna erro 500 quando o update falha
    expect(response.status).toBeGreaterThanOrEqual(400)
  })
})

