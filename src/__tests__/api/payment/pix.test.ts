/**
 * @jest-environment node
 */

import { POST } from '@/app/api/payment/pix/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth-middleware'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findUnique: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
  },
}))

// Mock do auth-middleware
jest.mock('@/lib/auth-middleware', () => ({
  verifyAuth: jest.fn(),
  verifyRole: jest.fn(),
  verifyAdmin: jest.fn(),
  verifyBooster: jest.fn(),
  createAuthErrorResponse: jest.fn((message, status) => {
    const { NextResponse } = require('next/server')
    return NextResponse.json({ message }, { status })
  }),
}))

// Mock do AbacatePay
jest.mock('@/lib/abacatepay', () => ({
  createAbacatePayCharge: jest.fn(),
}))

import { createAbacatePayCharge } from '@/lib/abacatepay'

// As funções generatePixCode e generateQRCodeBase64 são funções internas do módulo
// Não precisamos mocká-las, pois são chamadas diretamente dentro do POST

describe('POST /api/payment/pix', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve gerar código PIX com sucesso', async () => {
    ; (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'teste@teste.com',
        name: 'Teste',
        role: 'CLIENT',
      },
    })

    const mockOrder = {
      id: 1,
      userId: 1,
      serviceId: 1,
      total: 100,
      status: 'PENDING',
      user: { name: 'Teste', email: 'teste@teste.com' },
      service: { name: 'Boost Service' },
    }

    const mockPayment = {
      id: 1,
      orderId: mockOrder.id,
      total: 100,
      pixCode: 'pix-code-123',
      qrCode: 'qr-code-url',
      status: 'PENDING',
      method: 'PIX',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      providerId: 'charge-123',
    }

    const mockAbacatePayResponse = {
      data: {
        id: 'charge-123',
        amount: 10000,
        status: 'PENDING',
        pix: {
          code: 'pix-code-123',
          qrCode: 'qr-code-url',
        },
        url: 'payment-url',
      }
    }

      ; (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
      ; (prisma.payment.create as jest.Mock).mockResolvedValue(mockPayment)
      ; (createAbacatePayCharge as jest.Mock).mockResolvedValue(mockAbacatePayResponse)

    const request = new NextRequest('http://localhost:3000/api/payment/pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: 1,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.payment).toBeDefined()
    expect(data.payment.orderId).toBe(mockOrder.id)
    expect(createAbacatePayCharge).toHaveBeenCalled()
    expect(prisma.payment.create).toHaveBeenCalled()
  })

  it('deve retornar erro 400 se orderId não for fornecido', async () => {
    const request = new NextRequest('http://localhost:3000/api/payment/pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toContain('obrigatório')
  })

  it('deve retornar erro 404 se order não existir', async () => {
    ; (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'teste@teste.com',
        role: 'CLIENT',
      },
    })

      ; (prisma.order.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/payment/pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: 999,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.message).toContain('não encontrada')
  })

  it('deve retornar erro 403 se order não pertencer ao usuário', async () => {
    ; (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        email: 'teste@teste.com',
        role: 'CLIENT',
      },
    })

    const mockOrder = {
      id: 1,
      userId: 2, // Diferente do usuário autenticado
      serviceId: 1,
      total: 100,
      status: 'PENDING',
      user: { name: 'Other', email: 'other@test.com' },
      service: { name: 'Service' },
    }

      ; (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)

    const request = new NextRequest('http://localhost:3000/api/payment/pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: 1,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.message).toContain('Não autorizado')
  })

  it('deve retornar erro 401 se não autenticado', async () => {
    ; (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: false,
      error: 'Não autenticado',
    })

    const request = new NextRequest('http://localhost:3000/api/payment/pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: 1,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toContain('Não autenticado')
  })
})

