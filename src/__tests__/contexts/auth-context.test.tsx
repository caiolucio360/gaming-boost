/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import React from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

// Mock do next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock do fetch
global.fetch = jest.fn()

// Mock do window.location
const mockLocation = {
  href: '',
  pathname: '/',
  replace: jest.fn(),
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocation.href = ''
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('deve iniciar com usuário null e loading true quando não há sessão', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
  })

  it('deve iniciar com usuário quando há sessão', async () => {
    const mockSession = {
      user: {
        id: 1,
        email: 'teste@teste.com',
        name: 'Teste',
        role: 'CLIENT',
      },
    }

    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.user).toEqual({
        id: 1,
        email: 'teste@teste.com',
        name: 'Teste',
        role: 'CLIENT',
      })
    })
  })

  it('deve fazer login com sucesso usando NextAuth', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({
      user: {
        id: 1,
        email: 'teste@teste.com',
        name: 'Teste',
        role: 'CLIENT',
      },
    })

    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: mockUpdate,
    })

    ;(signIn as jest.Mock).mockResolvedValue({
      ok: true,
      error: null,
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.login('teste@teste.com', '123456')
    })

    expect(signIn).toHaveBeenCalledWith('credentials', {
      email: 'teste@teste.com',
      password: '123456',
      redirect: false,
    })

    expect(mockUpdate).toHaveBeenCalled()
  })

  it('deve lançar erro quando login falha', async () => {
    const mockUpdate = jest.fn()

    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: mockUpdate,
    })

    ;(signIn as jest.Mock).mockResolvedValue({
      ok: false,
      error: 'Credenciais inválidas',
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await expect(
      act(async () => {
        await result.current.login('teste@teste.com', 'senhaerrada')
      })
    ).rejects.toThrow('Credenciais inválidas')
  })

  it('deve fazer registro com sucesso e fazer login automaticamente', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({
      user: {
        id: 1,
        email: 'novo@teste.com',
        name: 'Novo Usuário',
        role: 'CLIENT',
      },
    })

    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: mockUpdate,
    })

    // Mock para registro
    const registerResponse = {
      ok: true,
      status: 201,
      json: async () => ({
        message: 'Conta criada com sucesso',
      }),
    }
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(registerResponse)

    // Mock para login após registro
    ;(signIn as jest.Mock).mockResolvedValue({
      ok: true,
      error: null,
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

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

    expect(signIn).toHaveBeenCalledWith('credentials', {
      email: 'novo@teste.com',
      password: '123456',
      redirect: false,
    })
  })

  it('deve fazer logout usando NextAuth', async () => {
    const mockSession = {
      user: {
        id: 1,
        email: 'teste@teste.com',
        name: 'Teste',
        role: 'CLIENT',
      },
    }

    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    })

    ;(signOut as jest.Mock).mockResolvedValue(undefined)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.logout()
    })

    expect(signOut).toHaveBeenCalledWith({
      redirect: true,
      callbackUrl: '/login',
    })
  })

  it('deve atualizar usuário quando refreshUser é chamado', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({
      user: {
        id: 1,
        email: 'teste@teste.com',
        name: 'Teste Atualizado',
        role: 'CLIENT',
      },
    })

    const mockSession = {
      user: {
        id: 1,
        email: 'teste@teste.com',
        name: 'Teste',
        role: 'CLIENT',
      },
    }

    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: mockUpdate,
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.refreshUser()
    })

    expect(mockUpdate).toHaveBeenCalled()
  })
})
