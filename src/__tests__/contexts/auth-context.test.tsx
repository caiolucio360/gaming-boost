/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import React from 'react'

// Mock do fetch
global.fetch = jest.fn()

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('deve iniciar com usuário null e loading true', async () => {
    // Mock do fetch para verificação de sessão
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Aguardar o useEffect terminar
    await waitFor(() => {
      expect(result.current.user).toBeNull()
    }, { timeout: 3000 })
  })

  it('deve fazer login com sucesso', async () => {
    const mockUser = {
      id: 'user123',
      email: 'teste@teste.com',
      name: 'Teste',
      role: 'CLIENT',
    }

    // Mock para verificação de sessão (primeiro call no useEffect)
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Não autenticado' }),
    })

    // Mock para login (segundo call)
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: mockUser,
        message: 'Login realizado com sucesso',
        redirectPath: '/dashboard',
      }),
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Aguardar verificação de sessão inicial
    await waitFor(() => {
      expect(result.current.user).toBeNull()
    }, { timeout: 3000 })

    await act(async () => {
      await result.current.login('teste@teste.com', '123456')
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teste@teste.com',
        password: '123456',
      }),
    })
  })

  it('deve fazer registro com sucesso', async () => {
    const mockUser = {
      id: 'user123',
      email: 'novo@teste.com',
      name: 'Novo Usuário',
      role: 'CLIENT',
    }

    // Mock para verificação de sessão (primeiro call)
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Não autenticado' }),
    })

    // Mock para registro (segundo call)
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: mockUser,
        message: 'Conta criada com sucesso',
      }),
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Aguardar verificação de sessão
    await waitFor(() => {
      expect(result.current.user).toBeNull()
    }, { timeout: 3000 })

    await act(async () => {
      await result.current.register('Novo Usuário', 'novo@teste.com', '123456')
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
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
  })

  it('deve fazer logout', async () => {
    // Mock para verificação de sessão (primeiro call)
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Não autenticado' }),
    })

    // Mock para logout (segundo call)
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Logout realizado com sucesso',
      }),
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Aguardar verificação de sessão
    await waitFor(() => {
      expect(result.current.user).toBeNull()
    }, { timeout: 3000 })

    await act(async () => {
      await result.current.logout()
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
    })
  })
})

