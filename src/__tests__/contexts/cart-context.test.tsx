/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react'
import { CartProvider, useCart } from '@/contexts/cart-context'
import { CartItem } from '@/types'
import React from 'react'

describe('CartContext', () => {
  const mockItem: CartItem = {
    game: 'CS2',
    serviceName: 'Boost CS2 Premier: 10K → 15K',
    price: 89.90,
    currentRank: '10K',
    targetRank: '15K',
  }

  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('deve adicionar item ao carrinho', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    )

    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      const addResult = result.current.addItem(mockItem)
      expect(addResult.success).toBe(true)
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].serviceName).toBe('Boost CS2 Premier: 10K → 15K')
    expect(result.current.items[0].price).toBe(89.90)
  })

  it('deve impedir adicionar item duplicado da mesma modalidade ao carrinho', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    )

    const { result } = renderHook(() => useCart(), { wrapper })

    const premierItem: CartItem = {
      game: 'CS2',
      serviceName: 'Boost CS2 Premier: 10K → 15K',
      price: 89.90,
      metadata: {
        mode: 'PREMIER',
      },
    }

    const premierItem2: CartItem = {
      game: 'CS2',
      serviceName: 'Boost CS2 Premier: 15K → 20K',
      price: 129.90,
      metadata: {
        mode: 'PREMIER',
      },
    }

    act(() => {
      const result1 = result.current.addItem(premierItem)
      expect(result1.success).toBe(true)
    })

    expect(result.current.items).toHaveLength(1)

    act(() => {
      const result2 = result.current.addItem(premierItem2)
      expect(result2.success).toBe(false)
      expect(result2.error).toContain('já possui um boost de rank Premier')
    })

    // Não deve adicionar o segundo item
    expect(result.current.items).toHaveLength(1)
  })

  it('deve permitir adicionar itens de modalidades diferentes', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    )

    const { result } = renderHook(() => useCart(), { wrapper })

    const premierItem: CartItem = {
      game: 'CS2',
      serviceName: 'Boost CS2 Premier: 10K → 15K',
      price: 89.90,
      metadata: {
        mode: 'PREMIER',
      },
    }

    const gamersClubItem: CartItem = {
      game: 'CS2',
      serviceName: 'Boost CS2 Gamers Club: Nível 5 → 10',
      price: 99.90,
      metadata: {
        mode: 'GAMERS_CLUB',
      },
    }

    act(() => {
      const result1 = result.current.addItem(premierItem)
      expect(result1.success).toBe(true)
    })

    act(() => {
      const result2 = result.current.addItem(gamersClubItem)
      expect(result2.success).toBe(true)
    })

    // Deve ter ambos os itens (modalidades diferentes)
    expect(result.current.items).toHaveLength(2)
  })

  it('deve remover item do carrinho', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    )

    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem(mockItem)
      result.current.addItem({ ...mockItem, serviceName: 'Boost CS2', price: 89.90 })
    })

    expect(result.current.items).toHaveLength(2)

    act(() => {
      result.current.removeItem(0)
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].serviceName).toBe('Boost CS2')
  })

  it('deve limpar o carrinho', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    )

    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem(mockItem)
      result.current.addItem({ ...mockItem, serviceName: 'Boost CS2' })
    })

    expect(result.current.items).toHaveLength(2)

    act(() => {
      result.current.clearCart()
    })

    expect(result.current.items).toHaveLength(0)
  })

  it('deve persistir carrinho no localStorage', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    )

    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem(mockItem)
    })

    // Verificar se foi salvo no localStorage
    const saved = localStorage.getItem('gaming-boost-cart')
    expect(saved).toBeTruthy()
    
    const parsed = JSON.parse(saved || '[]')
    expect(parsed).toHaveLength(1)
    expect(parsed[0].serviceName).toBe('Boost CS2 Premier: 10K → 15K')
  })

  it('deve carregar carrinho do localStorage ao inicializar', () => {
    // Simular carrinho no localStorage
    localStorage.setItem('gaming-boost-cart', JSON.stringify([mockItem]))

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    )

    const { result } = renderHook(() => useCart(), { wrapper })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].serviceName).toBe('Boost CS2 Premier: 10K → 15K')
  })
})

