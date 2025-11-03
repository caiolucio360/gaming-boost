/**
 * @jest-environment node
 */

import { POST } from '@/app/api/auth/logout/route'
import { NextRequest } from 'next/server'

// Mock de cookies do Next.js
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}))

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve fazer logout com sucesso', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain('Logout realizado')
    // Verificar que o response foi criado corretamente
    expect(response).toBeDefined()
  })

  it('deve retornar sucesso mesmo sem cookie de userId', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain('Logout realizado')
  })
})

