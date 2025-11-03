/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import CartPage from '@/app/cart/page'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/contexts/cart-context'

// Mock dos contextos e hooks
jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/contexts/cart-context', () => ({
  useCart: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock do fetch
global.fetch = jest.fn()

describe('CartPage', () => {
  const mockPush = jest.fn()
  const mockRemoveItem = jest.fn()
  const mockClearCart = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(useCart as jest.Mock).mockReturnValue({
      items: [],
      removeItem: mockRemoveItem,
      clearCart: mockClearCart,
    })
  })

  it('deve renderizar carrinho vazio quando não há itens', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    })

    render(<CartPage />)

    expect(screen.getByText('Carrinho vazio')).toBeInTheDocument()
    expect(screen.getByText('Explorar Serviços')).toBeInTheDocument()
  })

  it('deve renderizar itens do carrinho quando há itens', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user1', email: 'test@test.com', role: 'CLIENT' },
      loading: false,
    })
    ;(useCart as jest.Mock).mockReturnValue({
      items: [
        {
          serviceId: 'service123',
          game: 'CS2',
          serviceName: 'Boost CS2 Premier: 10K → 15K',
          description: 'Boost profissional',
          currentRank: '10K',
          targetRank: '15K',
          price: 89.90,
          duration: '3-6 dias',
          metadata: {
            mode: 'PREMIER',
          },
        },
      ],
      removeItem: mockRemoveItem,
      clearCart: mockClearCart,
    })

    render(<CartPage />)

    expect(screen.getByText('Boost CS2 Premier: 10K → 15K')).toBeInTheDocument()
    // Pode haver múltiplos elementos com o mesmo preço (item e total), usar getAllByText
    expect(screen.getAllByText('R$ 89,90').length).toBeGreaterThan(0)
    expect(screen.getByText('Finalizar Compra')).toBeInTheDocument()
  })

  it('deve redirecionar para login quando clicar em finalizar compra sem estar logado', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    })
    ;(useCart as jest.Mock).mockReturnValue({
      items: [
        {
          serviceId: 'service123',
          game: 'CS2',
          serviceName: 'Boost CS2 Premier',
          price: 89.90,
        },
      ],
      removeItem: mockRemoveItem,
      clearCart: mockClearCart,
    })

    render(<CartPage />)

    // Quando não logado, o botão é um Link que redireciona
    const link = screen.getByText('Fazer Login para Continuar')
    expect(link.closest('a')).toHaveAttribute('href', '/login')
  })

  it('deve criar orders e redirecionar para pagamento quando finalizar compra estando logado', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user1', email: 'test@test.com', role: 'CLIENT' },
      loading: false,
    })
    ;(useCart as jest.Mock).mockReturnValue({
      items: [
        {
          serviceId: 'service123',
          game: 'CS2',
          serviceName: 'Boost CS2 Premier: 10K → 15K',
          price: 89.90,
          currentRank: '10K',
          targetRank: '15K',
          metadata: {
            mode: 'PREMIER',
            currentRating: 10000,
            targetRating: 15000,
          },
        },
      ],
      removeItem: mockRemoveItem,
      clearCart: mockClearCart,
    })

    // Mock fetch para criar order
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Solicitação criada com sucesso',
        order: {
          id: 'order123',
          serviceId: 'service123',
          total: 89.90,
        },
      }),
    })

    render(<CartPage />)

    const button = screen.getByText('Finalizar Compra')
    fireEvent.click(button)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: 'service123',
          total: 89.90,
          currentRank: '10K',
          targetRank: '15K',
          currentRating: 10000,
          targetRating: 15000,
          gameMode: 'PREMIER',
          metadata: '{"mode":"PREMIER","currentRating":10000,"targetRating":15000}',
        }),
      })
      expect(mockClearCart).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/payment?orderId=order123')
    })
  })

  it('deve exibir erro se não conseguir criar orders', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user1', email: 'test@test.com', role: 'CLIENT' },
      loading: false,
    })
    ;(useCart as jest.Mock).mockReturnValue({
      items: [
        {
          serviceId: 'service123',
          game: 'CS2',
          serviceName: 'Boost CS2 Premier',
          price: 89.90,
        },
      ],
      removeItem: mockRemoveItem,
      clearCart: mockClearCart,
    })

    // Mock fetch para retornar erro
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        message: 'Erro ao criar pedido',
      }),
    })

    render(<CartPage />)

    const button = screen.getByText('Finalizar Compra')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText(/Erro ao criar pedido|não foi possível criar/i)).toBeInTheDocument()
    })
  })
})

