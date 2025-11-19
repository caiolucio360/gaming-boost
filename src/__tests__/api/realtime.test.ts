/**
 * @jest-environment node
 */

import { GET } from '@/app/api/realtime/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth-middleware'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    order: {
      count: jest.fn(),
    },
    payment: {
      count: jest.fn(),
    },
  },
}))

// Mock do auth-middleware
jest.mock('@/lib/auth-middleware', () => ({
  verifyAuth: jest.fn(),
}))

describe('GET /api/realtime (Server-Sent Events)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar 401 se não autenticado', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: false,
      user: null,
    })

    const request = new NextRequest('http://localhost:3000/api/realtime')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('deve autenticar via query string token', async () => {
    // Primeira tentativa sem autenticação
    ;(verifyAuth as jest.Mock)
      .mockResolvedValueOnce({
        authenticated: false,
        user: null,
      })
      .mockResolvedValueOnce({
        authenticated: true,
        user: {
          id: 1,
          role: 'BOOSTER',
        },
      })

    const request = new NextRequest('http://localhost:3000/api/realtime?token=test-token')
    const response = await GET(request)

    // Deve tentar autenticar via query string
    expect(verifyAuth).toHaveBeenCalledTimes(2)
  })

  it('deve criar stream SSE para booster autenticado', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 1,
        role: 'BOOSTER',
      },
    })

    ;(prisma.order.count as jest.Mock)
      .mockResolvedValueOnce(5) // availableOrders
      .mockResolvedValueOnce(2) // myOrders

    const abortController = new AbortController()
    const request = new NextRequest('http://localhost:3000/api/realtime', {
      signal: abortController.signal,
    })

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/event-stream')
    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-transform')
    expect(response.headers.get('Connection')).toBe('keep-alive')

    // Cancelar imediatamente para limpar intervalos
    abortController.abort()
    
    // Limpar o stream
    const reader = response.body?.getReader()
    if (reader) {
      await reader.cancel()
    }
  })

  it('deve criar stream SSE para cliente autenticado', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 2,
        role: 'CLIENT',
      },
    })

    ;(prisma.order.count as jest.Mock)
      .mockResolvedValueOnce(3) // pendingOrders
      .mockResolvedValueOnce(1) // inProgressOrders

    const abortController = new AbortController()
    const request = new NextRequest('http://localhost:3000/api/realtime', {
      signal: abortController.signal,
    })

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/event-stream')

    // Cancelar imediatamente
    abortController.abort()
    
    // Limpar o stream
    const reader = response.body?.getReader()
    if (reader) {
      await reader.cancel()
    }
  })

  it('deve criar stream SSE para admin autenticado', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 3,
        role: 'ADMIN',
      },
    })

    ;(prisma.order.count as jest.Mock).mockResolvedValueOnce(10) // pendingOrders
    ;(prisma.payment.count as jest.Mock).mockResolvedValueOnce(5) // pendingPayments

    const abortController = new AbortController()
    const request = new NextRequest('http://localhost:3000/api/realtime', {
      signal: abortController.signal,
    })

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/event-stream')

    // Cancelar imediatamente
    abortController.abort()
    
    // Limpar o stream
    const reader = response.body?.getReader()
    if (reader) {
      await reader.cancel()
    }
  })

  it('deve retornar 500 em caso de erro', async () => {
    ;(verifyAuth as jest.Mock).mockRejectedValue(new Error('Erro de autenticação'))

    const request = new NextRequest('http://localhost:3000/api/realtime')
    const response = await GET(request)

    expect(response.status).toBe(500)
  })
})

