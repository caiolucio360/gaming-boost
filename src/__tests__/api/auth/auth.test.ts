/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

// ---- Mocks (must be before imports) ----

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    verificationCode: {
      updateMany: jest.fn(),
      create: jest.fn(),
    },
  },
  db: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/services', () => ({
  AuthService: {
    registerUser: jest.fn(),
  },
}))

jest.mock('@/services/verification.service', () => ({
  VerificationService: {
    generateCode: jest.fn().mockResolvedValue({ success: true, data: '123456' }),
    validateCode: jest.fn(),
  },
}))

jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/jwt', () => ({
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
}))

jest.mock('@/lib/rate-limit', () => ({
  authRateLimiter: {
    check: jest.fn().mockResolvedValue({ success: true, remaining: 4 }),
  },
  getIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
  createRateLimitHeaders: jest.fn().mockReturnValue({}),
}))

jest.mock('@/lib/api-errors', () => ({
  createApiErrorResponse: jest.fn((_err: unknown, message: string) =>
    Response.json({ message }, { status: 500 })
  ),
  ErrorMessages: {
    AUTH_REGISTER_FAILED: 'Não foi possível criar sua conta no momento. Por favor, tente novamente.',
    AUTH_EMAIL_PASSWORD_REQUIRED: 'Email e senha são obrigatórios',
    AUTH_PASSWORD_TOO_SHORT: 'A senha deve ter pelo menos 6 caracteres',
    AUTH_INVALID_EMAIL: 'Email inválido',
    INVALID_DATA: 'Dados inválidos',
    AUTH_EMAIL_ALREADY_EXISTS: 'Email já cadastrado',
    AUTH_UNAUTHENTICATED: 'Não autenticado',
    RATE_LIMIT_REGISTER: 'Muitas tentativas de registro. Tente novamente mais tarde.',
  },
}))

jest.mock('@/lib/error-constants', () => ({
  ErrorCodes: {
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  },
  ErrorMessages: {
    AUTH_EMAIL_PASSWORD_REQUIRED: 'Email e senha são obrigatórios',
    AUTH_PASSWORD_TOO_SHORT: 'A senha deve ter pelo menos 6 caracteres',
    AUTH_INVALID_EMAIL: 'Email inválido',
    INVALID_DATA: 'Dados inválidos',
    AUTH_EMAIL_ALREADY_EXISTS: 'Email já cadastrado',
    RATE_LIMIT_REGISTER: 'Muitas tentativas de registro. Tente novamente mais tarde.',
  },
}))

// ---- Imports (after mocks) ----

import { POST as registerPost } from '@/app/api/auth/register/route'
import { POST as verifyPost } from '@/app/api/auth/verify/route'
import { prisma } from '@/lib/db'
import { AuthService } from '@/services'
import { VerificationService } from '@/services/verification.service'

const mockRegisterUser = AuthService.registerUser as jest.Mock
const mockValidateCode = VerificationService.validateCode as jest.Mock
const mockFindUnique = prisma.user.findUnique as jest.Mock

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeVerifyRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ============================================================================
// POST /api/auth/register
// ============================================================================

describe('POST /api/auth/register', () => {
  it('returns 400 when email is missing', async () => {
    const req = makeRequest({ password: 'secret123' })
    const res = await registerPost(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data).toHaveProperty('message')
  })

  it('returns 400 when password is missing', async () => {
    const req = makeRequest({ email: 'user@test.com' })
    const res = await registerPost(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data).toHaveProperty('message')
  })

  it('returns 400 when email and password are both missing', async () => {
    const req = makeRequest({})
    const res = await registerPost(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data).toHaveProperty('message')
  })

  it('returns 400 when AuthService signals email already exists', async () => {
    mockRegisterUser.mockResolvedValue({
      success: false,
      error: 'Email já cadastrado',
    })

    const req = makeRequest({
      name: 'Test User',
      email: 'existing@test.com',
      password: 'password123',
    })
    const res = await registerPost(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.message).toBe('Email já cadastrado')
  })

  it('returns 201 on successful registration', async () => {
    mockRegisterUser.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        name: 'Test User',
        email: 'new@test.com',
        role: 'CLIENT',
        active: false,
      },
    })

    const req = makeRequest({
      name: 'Test User',
      email: 'new@test.com',
      password: 'password123',
    })
    const res = await registerPost(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data).toHaveProperty('token')
    expect(data).toHaveProperty('user')
    expect(data.message).toBe('Conta criada com sucesso')
  })
})

// ============================================================================
// POST /api/auth/verify
// ============================================================================

describe('POST /api/auth/verify', () => {
  it('returns 400 when code is missing', async () => {
    const req = makeVerifyRequest({ email: 'user@test.com' })
    const res = await verifyPost(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data).toHaveProperty('message')
  })

  it('returns 400 when email is missing', async () => {
    const req = makeVerifyRequest({ code: '123456' })
    const res = await verifyPost(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data).toHaveProperty('message')
  })

  it('returns 404 when user is not found', async () => {
    mockFindUnique.mockResolvedValue(null)

    const req = makeVerifyRequest({ email: 'ghost@test.com', code: '123456' })
    const res = await verifyPost(req)
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.message).toBe('Usuário não encontrado')
  })

  it('returns 400 for invalid/expired verification code', async () => {
    mockFindUnique.mockResolvedValue({
      id: 1,
      email: 'user@test.com',
      role: 'CLIENT',
      active: false,
    })
    mockValidateCode.mockResolvedValue({
      success: false,
      error: 'Código inválido ou expirado',
    })

    const req = makeVerifyRequest({ email: 'user@test.com', code: '000000' })
    const res = await verifyPost(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.message).toBe('Código inválido ou expirado')
  })

  it('returns 200 with token on valid code', async () => {
    mockFindUnique.mockResolvedValue({
      id: 1,
      name: 'Test User',
      email: 'user@test.com',
      role: 'CLIENT',
      active: false,
    })
    mockValidateCode.mockResolvedValue({ success: true, data: undefined })

    const req = makeVerifyRequest({ email: 'user@test.com', code: '123456' })
    const res = await verifyPost(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.message).toBe('Conta verificada com sucesso')
    expect(data).toHaveProperty('token')
    expect(data.user.active).toBe(true)
  })
})
