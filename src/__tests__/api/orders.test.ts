/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/orders/route'
import { NextRequest } from 'next/server'

// Mock OrderService
jest.mock('@/services', () => ({
  OrderService: {
    getUserCS2Orders: jest.fn(),
    createOrder: jest.fn(),
  },
}))

import { OrderService } from '@/services'

// Mock do auth-middleware
jest.mock('@/lib/auth-middleware', () => ({
  verifyAuth: jest.fn(),
  verifyRole: jest.fn(),
  verifyAdmin: jest.fn(),
  verifyBooster: jest.fn(),
  createAuthErrorResponse: jest.fn((message: string, status: number) => {
    const { NextResponse } = require('next/server')
    return NextResponse.json({ message }, { status })
  }),
}))

import { verifyAuth } from '@/lib/auth-middleware'

describe('GET /api/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar lista de pedidos do usuário autenticado', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'teste@teste.com',
        role: 'CLIENT',
      },
    })

    const mockOrders = [
      {
        id: 1,
        userId: 1,
        game: 'CS2',
        status: 'PENDING',
        total: 89.90,
        createdAt: new Date(),
      },
    ]

    ;(OrderService.getUserCS2Orders as jest.Mock).mockResolvedValue({
      success: true,
      data: mockOrders,
    })

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.orders).toBeDefined()
    expect(data.orders).toHaveLength(1)
    expect(data.orders[0].status).toBe('PENDING')
  })

  it('deve retornar erro 401 se o usuário não estiver autenticado', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: false,
      error: 'Não autenticado',
    })

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'GET',
      headers: {},
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toContain('Não autenticado')
  })
})

describe('POST /api/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve criar um novo pedido com sucesso', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'teste@teste.com',
        role: 'CLIENT',
      },
    })

    const mockOrder = {
      id: 1,
      userId: 1,
      game: 'CS2',
      status: 'PENDING',
      total: 89.90,
      createdAt: new Date(),
    }

    ;(OrderService.createOrder as jest.Mock).mockResolvedValue({
      success: true,
      data: mockOrder,
    })

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        game: 'CS2',
        total: 89.90,
        gameMode: 'PREMIER',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.order).toBeDefined()
    expect(data.order.status).toBe('PENDING')
    expect(data.order.total).toBe(89.90)
  })

  it('deve retornar erro 400 se já existir um pedido ativo para a mesma modalidade', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'teste@teste.com',
        role: 'CLIENT',
      },
    })

    ;(OrderService.createOrder as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Você já possui um boost de rank Premier pendente ou em andamento',
      code: 'DUPLICATE_ORDER',
    })

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        game: 'CS2',
        total: 89.90,
        gameMode: 'PREMIER',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toContain('já possui um boost de rank Premier')
    expect(OrderService.createOrder).toHaveBeenCalled()
  })

  it('deve retornar erro 400 se total estiver faltando', async () => {
    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game: 'CS2',
        // total faltando
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toContain('total')
  })

  it('deve retornar erro 401 se o usuário não estiver autenticado', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: false,
      error: 'Não autenticado',
    })

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game: 'CS2',
        total: 89.90,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toContain('Não autenticado')
  })
})
