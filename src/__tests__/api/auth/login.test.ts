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

// Mock de cookies do Next.js
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}))

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve fazer login com credenciais válidas', async () => {
    const hashedPassword = await bcrypt.hash('123456', 10)
    
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user123',
      email: 'teste@teste.com',
      name: 'Teste',
      password: hashedPassword,
      role: 'CLIENT',
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
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe('teste@teste.com')
    expect(data.user.role).toBe('CLIENT')
    expect(data.user.password).toBeUndefined() // Senha não deve ser retornada
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'teste@teste.com' },
    })
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
      id: 'user123',
      email: 'teste@teste.com',
      name: 'Teste',
      password: hashedPassword,
      role: 'CLIENT',
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

