/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server'
import { HttpStatus } from '@/lib/http-status'

// Mock auth-middleware
const mockVerifyAuth = jest.fn()
const mockVerifyRole = jest.fn()
const mockCreateAuthErrorResponseFromResult = jest.fn()

jest.mock('@/lib/auth-middleware', () => ({
  verifyAuth: (...args: unknown[]) => mockVerifyAuth(...args),
  verifyRole: (...args: unknown[]) => mockVerifyRole(...args),
  createAuthErrorResponseFromResult: (...args: unknown[]) => mockCreateAuthErrorResponseFromResult(...args),
}))

// Mock rate-limit
const mockCheck = jest.fn()
const mockGetIdentifier = jest.fn()
const mockCreateRateLimitHeaders = jest.fn()

jest.mock('@/lib/rate-limit', () => ({
  getIdentifier: (...args: unknown[]) => mockGetIdentifier(...args),
  createRateLimitHeaders: (...args: unknown[]) => mockCreateRateLimitHeaders(...args),
}))

// Import after mocks
import { withApiHandler, parseIntParam } from '@/lib/api-handler'

function createMockRequest(method = 'GET', url = 'http://localhost/api/test'): NextRequest {
  return new NextRequest(url, { method })
}

const mockUser = {
  id: 1,
  email: 'test@test.com',
  role: 'CLIENT' as const,
  isDevAdmin: false,
}

const mockAuthSuccess = {
  authenticated: true,
  user: mockUser,
}

const mockAuthFailure = {
  authenticated: false,
  error: 'Não autenticado',
  code: 'UNAUTHENTICATED',
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetIdentifier.mockReturnValue('127.0.0.1')
  mockCreateRateLimitHeaders.mockReturnValue({
    'X-RateLimit-Limit': '10',
    'X-RateLimit-Remaining': '9',
    'X-RateLimit-Reset': '1234567890',
  })
  mockCreateAuthErrorResponseFromResult.mockReturnValue(
    NextResponse.json({ message: 'Não autenticado' }, { status: HttpStatus.UNAUTHORIZED })
  )
})

describe('withApiHandler', () => {
  describe('autenticação', () => {
    it('deve retornar 401 quando auth falha e requireAuth é true', async () => {
      mockVerifyAuth.mockResolvedValue(mockAuthFailure)

      const handler = withApiHandler(
        async () => NextResponse.json({ ok: true }),
        { auth: true, endpoint: 'GET /api/test' }
      )

      const response = await handler(createMockRequest())

      expect(mockVerifyAuth).toHaveBeenCalledTimes(1)
      expect(mockCreateAuthErrorResponseFromResult).toHaveBeenCalledWith(mockAuthFailure)
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
    })

    it('deve passar user para o handler quando autenticado', async () => {
      mockVerifyAuth.mockResolvedValue(mockAuthSuccess)

      let receivedUser: unknown = null
      const handler = withApiHandler(
        async (ctx) => {
          receivedUser = ctx.user
          return NextResponse.json({ ok: true })
        },
        { auth: true, endpoint: 'GET /api/test' }
      )

      await handler(createMockRequest())

      expect(receivedUser).toEqual(mockUser)
    })

    it('deve verificar roles quando auth tem roles especificados', async () => {
      mockVerifyRole.mockResolvedValue(mockAuthSuccess)

      const handler = withApiHandler(
        async () => NextResponse.json({ ok: true }),
        { auth: { roles: ['ADMIN'] }, endpoint: 'GET /api/admin/test' }
      )

      await handler(createMockRequest())

      expect(mockVerifyRole).toHaveBeenCalledWith(expect.anything(), ['ADMIN'])
    })

    it('deve pular auth quando auth não é configurado', async () => {
      const handler = withApiHandler(
        async () => NextResponse.json({ ok: true }),
        { endpoint: 'GET /api/public' }
      )

      const response = await handler(createMockRequest())

      expect(mockVerifyAuth).not.toHaveBeenCalled()
      expect(response.status).toBe(HttpStatus.OK)
    })
  })

  describe('rate limiting', () => {
    it('deve retornar 429 quando rate limit excedido', async () => {
      const rateLimitResult = {
        success: false,
        limit: 10,
        remaining: 0,
        reset: 1234567890,
      }
      mockCheck.mockResolvedValue(rateLimitResult)

      const mockLimiter = { check: mockCheck }

      const handler = withApiHandler(
        async () => NextResponse.json({ ok: true }),
        {
          rateLimit: { limiter: mockLimiter as any, max: 10 },
          rateLimitMessage: 'Muitas tentativas.',
          endpoint: 'POST /api/test',
        }
      )

      const response = await handler(createMockRequest('POST'))
      const body = await response.json()

      expect(response.status).toBe(HttpStatus.TOO_MANY_REQUESTS)
      expect(body.message).toBe('Muitas tentativas.')
    })

    it('deve passar rateLimitResult quando rate limit permitido', async () => {
      const rateLimitResult = {
        success: true,
        limit: 10,
        remaining: 9,
        reset: 1234567890,
      }
      mockCheck.mockResolvedValue(rateLimitResult)
      mockVerifyAuth.mockResolvedValue(mockAuthSuccess)

      const mockLimiter = { check: mockCheck }
      let receivedRateLimitResult: unknown = null

      const handler = withApiHandler(
        async (ctx) => {
          receivedRateLimitResult = ctx.rateLimitResult
          return NextResponse.json({ ok: true })
        },
        {
          auth: true,
          rateLimit: { limiter: mockLimiter as any, max: 10 },
          endpoint: 'POST /api/test',
        }
      )

      await handler(createMockRequest('POST'))

      expect(receivedRateLimitResult).toEqual(rateLimitResult)
    })
  })

  describe('tratamento de erros', () => {
    it('deve capturar erros do handler e retornar 500', async () => {
      const handler = withApiHandler(
        async () => { throw new Error('Unexpected') },
        {
          errorMessage: 'Falha no processamento',
          endpoint: 'GET /api/test',
          inlineCatch: true,
        }
      )

      const response = await handler(createMockRequest())
      const body = await response.json()

      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(body.message).toBe('Falha no processamento')
    })

    it('deve passar request original para o handler', async () => {
      let receivedRequest: unknown = null
      const handler = withApiHandler(
        async (ctx) => {
          receivedRequest = ctx.request
          return NextResponse.json({ ok: true })
        },
        { endpoint: 'GET /api/test' }
      )

      const request = createMockRequest()
      await handler(request)

      expect(receivedRequest).toBe(request)
    })
  })
})

describe('parseIntParam', () => {
  it('deve retornar número válido para string numérica', () => {
    const result = parseIntParam('123')
    expect(result).toBe(123)
  })

  it('deve retornar null para string não numérica', () => {
    const result = parseIntParam('abc')
    expect(result).toBeNull()
  })

  it('deve retornar null para string vazia', () => {
    const result = parseIntParam('')
    expect(result).toBeNull()
  })

  it('deve retornar null para undefined', () => {
    const result = parseIntParam(undefined as unknown as string)
    expect(result).toBeNull()
  })
})
