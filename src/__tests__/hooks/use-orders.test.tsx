/**
 * Tests for React Query hooks
 * TDD: Write tests first (Red Phase)
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useOrders, useCreateOrder } from '@/hooks/use-orders'
import React from 'react'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useOrders Hook', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('deve retornar loading inicialmente', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useOrders(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.orders).toBeUndefined()
  })

  it('deve retornar orders após fetch bem sucedido', async () => {
    const mockOrders = [
      { id: 1, status: 'PENDING', total: 100 },
      { id: 2, status: 'COMPLETED', total: 200 },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ orders: mockOrders }),
    })

    const { result } = renderHook(() => useOrders(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.orders).toEqual(mockOrders)
    expect(result.current.error).toBeNull()
  })

  it('deve retornar erro quando fetch falha', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Erro interno' }),
    })

    const { result } = renderHook(() => useOrders(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
  })
})

describe('useCreateOrder Hook', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('deve criar order com sucesso', async () => {
    const newOrder = { id: 3, status: 'PENDING', total: 150 }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ order: newOrder }),
    })

    const { result } = renderHook(() => useCreateOrder(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(false)

    result.current.mutate({
      serviceId: 1,
      total: 150,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.order).toEqual(newOrder)
  })

  it('deve retornar erro quando criação falha', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'Dados inválidos' }),
    })

    const { result } = renderHook(() => useCreateOrder(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      serviceId: 1,
      total: 150,
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
