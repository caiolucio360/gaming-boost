/**
 * @jest-environment node
 */

import { POST, PUT } from '@/app/api/booster/orders/[id]/route'
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
      findUnique: jest.fn(),
      update: jest.fn(),
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

describe('POST /api/booster/orders/[id] (aceitar pedido)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve aceitar pedido com sucesso', async () => {
    ;(verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'booster@test.com',
        role: 'BOOSTER',
      },
    })

    const existingOrder = {
      id: 1,
      userId: 1,
      serviceId: 1,
      status: 'PENDING',
      boosterId: null,
      total: 100,
    }

    const updatedOrder = {
      ...existingOrder,
      status: 'IN_PROGRESS',
      boosterId: 1,
    }

    ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(existingOrder)
    ;(prisma.order.update as jest.Mock).mockResolvedValue(updatedOrder)

    const request = new NextRequest('http://localhost:3000/api/booster/orders/1', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.order).toBeDefined()
    expect(data.order.status).toBe('IN_PROGRESS')
    expect(data.order.boosterId).toBe(1)
    expect(prisma.order.update).toHaveBeenCalled()
    // Verificar que foi chamado com os parâmetros corretos (pode incluir mais campos)
    const updateCall = (prisma.order.update as jest.Mock).mock.calls[0]
    expect(updateCall[0].where.id).toBe(1)
    expect(updateCall[0].data.status).toBe('IN_PROGRESS')
    expect(updateCall[0].data.boosterId).toBe(1)
  })

  it('deve retornar erro 404 se pedido não existir', async () => {
    ;(verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'booster@test.com',
        role: 'BOOSTER',
      },
    })

    ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/booster/orders/999', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: '999' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.message).toContain('não encontrado')
  })

  it('deve retornar erro 400 se pedido já foi aceito', async () => {
    ;(verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'booster@test.com',
        role: 'BOOSTER',
      },
    })

    const existingOrder = {
      id: 1,
      userId: 1,
      serviceId: 1,
      status: 'IN_PROGRESS',
      boosterId: 2,
      total: 100,
    }

    ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(existingOrder)

    const request = new NextRequest('http://localhost:3000/api/booster/orders/1', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toContain('não está disponível')
  })
})

describe('PUT /api/booster/orders/[id] (atualizar status)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve atualizar status do pedido para COMPLETED', async () => {
    ;(verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'booster@test.com',
        role: 'BOOSTER',
      },
    })

    const existingOrder = {
      id: 1,
      userId: 1,
      serviceId: 1,
      status: 'IN_PROGRESS',
      boosterId: 1,
      total: 100,
    }

    const updatedOrder = {
      ...existingOrder,
      status: 'COMPLETED',
    }

    ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(existingOrder)
    ;(prisma.order.update as jest.Mock).mockResolvedValue(updatedOrder)

    const request = new NextRequest('http://localhost:3000/api/booster/orders/1', {
      method: 'PUT',
      body: JSON.stringify({
        status: 'COMPLETED',
      }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.order).toBeDefined()
    expect(data.order.status).toBe('COMPLETED')
  })

  it('deve retornar erro 404 se pedido não existir', async () => {
    ;(verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'booster@test.com',
        role: 'BOOSTER',
      },
    })

    ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/booster/orders/999', {
      method: 'PUT',
      body: JSON.stringify({
        status: 'COMPLETED',
      }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: '999' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.message).toContain('não encontrado')
  })

  it('deve retornar erro 403 se pedido não pertence ao booster', async () => {
    ;(verifyBooster as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'booster@test.com',
        role: 'BOOSTER',
      },
    })

    const existingOrder = {
      id: 1,
      userId: 1,
      serviceId: 1,
      status: 'IN_PROGRESS',
      boosterId: 2,
      total: 100,
    }

    ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(existingOrder)

    const request = new NextRequest('http://localhost:3000/api/booster/orders/1', {
      method: 'PUT',
      body: JSON.stringify({
        status: 'COMPLETED',
      }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.message).toContain('não foi atribuído')
  })
})

