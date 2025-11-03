/**
 * @jest-environment node
 */

import { POST } from '@/app/api/payment/pix/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

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

// Mock de cookies do Next.js
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn((key: string) => {
      if (key === 'userId') {
        return { value: 'user123' }
      }
      return null
    }),
  })),
}))

// As funções generatePixCode e generateQRCodeBase64 são funções internas do módulo
// Não precisamos mocká-las, pois são chamadas diretamente dentro do POST

describe('POST /api/payment/pix', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve gerar código PIX com sucesso', async () => {
    const mockOrder = {
      id: 'order123',
      userId: 'user123',
      serviceId: 'service1',
      total: 100,
      status: 'PENDING',
    }

    const mockPayment = {
      id: 'payment123',
      orderId: 'order123',
      total: 100,
      pixCode: '00020126360014BR.GOV.BCB.PIX01111234567890204000053039865802BR5925TESTE DO MERCADO6008BRASILIA62070503***6304',
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
      status: 'PENDING',
      method: 'PIX',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    }

    ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
    ;(prisma.payment.create as jest.Mock).mockResolvedValue(mockPayment)

    const request = new NextRequest('http://localhost:3000/api/payment/pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: 'order123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.payment).toBeDefined()
    expect(data.payment.orderId).toBe('order123')
    expect(data.payment.total).toBe(100)
    expect(data.payment.pixCode).toBeDefined()
    expect(data.payment.qrCode).toBeDefined()
    expect(data.payment.expiresAt).toBeDefined()
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
    ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/payment/pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: 'orderinexistente',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.message).toContain('não encontrada')
  })

  it('deve retornar erro 403 se order não pertencer ao usuário', async () => {
    const mockOrder = {
      id: 'order123',
      userId: 'outrouser',
      serviceId: 'service1',
      total: 100,
      status: 'PENDING',
    }

    ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)

    const request = new NextRequest('http://localhost:3000/api/payment/pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: 'order123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.message).toContain('Não autorizado')
  })

  it('deve retornar erro 401 se não autenticado', async () => {
    const { cookies } = require('next/headers')
    cookies.mockReturnValueOnce({
      get: jest.fn(() => null),
    })

    const request = new NextRequest('http://localhost:3000/api/payment/pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: 'order123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toContain('Não autenticado')
  })
})

