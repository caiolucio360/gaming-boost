/**
 * @jest-environment node
 */

import { POST } from '@/app/api/auth/login/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock do JWT
jest.mock('@/lib/jwt', () => ({
  generateToken: jest.fn((payload) => `mock-token-${payload.userId}`),
  verifyToken: jest.fn(),
  decodeToken: jest.fn(),
  extractTokenFromHeader: jest.fn(),
}))

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve fazer login com credenciais válidas', async () => {
    const hashedPassword = await bcrypt.hash('123456', 10)
    
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'teste@teste.com',
      name: 'Teste',
      password: hashedPassword,
      role: 'CLIENT',
      active: true, // Conta ativa
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teste@teste.com',
        password: '123456',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.token).toBeDefined()
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe('teste@teste.com')
    expect(data.user.role).toBe('CLIENT')
    expect(data.user.password).toBeUndefined() // Senha não deve ser retornada
    expect(data.redirectPath).toBe('/dashboard')
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'teste@teste.com' },
    })
  })

  it('deve retornar erro 403 para conta desativada', async () => {
    const hashedPassword = await bcrypt.hash('123456', 10)
    
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'teste@teste.com',
      name: 'Teste',
      password: hashedPassword,
      role: 'CLIENT',
      active: false, // Conta desativada
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teste@teste.com',
        password: '123456',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.message).toContain('desativada')
  })

  it('deve retornar erro 401 para credenciais inválidas', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teste@teste.com',
        password: 'senhaerrada',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toContain('Email ou senha incorretos')
    expect(prisma.user.findUnique).toHaveBeenCalled()
  })

  it('deve retornar erro 401 para senha incorreta', async () => {
    const hashedPassword = await bcrypt.hash('123456', 10)
    
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'teste@teste.com',
      name: 'Teste',
      password: hashedPassword,
      role: 'CLIENT',
      active: true, // Conta ativa
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teste@teste.com',
        password: 'senhaerrada',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toContain('Email ou senha incorretos')
    expect(prisma.user.findUnique).toHaveBeenCalled()
  })

  it('deve retornar erro 400 para campos faltando', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teste@teste.com',
        // password faltando
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toContain('obrigatórios')
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })
})

