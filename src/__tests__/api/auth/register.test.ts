/**
 * @jest-environment node
 */

import { POST } from '@/app/api/auth/register/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Mock do prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve registrar um novo usuário com sucesso', async () => {
    // Mock: usuário não existe
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    
    // Mock: criação bem-sucedida
    ;(prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'user123',
      email: 'novo@teste.com',
      name: 'Novo Usuário',
      role: 'CLIENT',
      password: 'hashed',
    })

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Novo Usuário',
        email: 'novo@teste.com',
        password: '123456',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe('novo@teste.com')
    expect(data.user.role).toBe('CLIENT')
    expect(data.user.password).toBeUndefined()
    expect(prisma.user.create).toHaveBeenCalled()
  })

  it('deve retornar erro 400 se o email já existe', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user123',
      email: 'existente@teste.com',
    })

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Usuário',
        email: 'existente@teste.com',
        password: '123456',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toContain('já cadastrado')
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('deve retornar erro 400 se a senha for muito curta', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Usuário',
        email: 'teste@teste.com',
        password: '123', // Senha muito curta
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toContain('6 caracteres')
  })

  it('deve retornar erro 400 para campos faltando', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Usuário',
        // email e password faltando
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toContain('obrigatórios')
  })
})

