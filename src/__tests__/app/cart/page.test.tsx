/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import CartPage from '@/app/cart/page'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/contexts/cart-context'
import { apiPost } from '@/lib/api-client'

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

// Mock do api-client
jest.mock('@/lib/api-client', () => ({
  apiPost: jest.fn(),
}))

// Mock do toast
jest.mock('@/lib/toast', () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showWarning: jest.fn(),
  showLoading: jest.fn(() => 'toast-id'),
  updateToSuccess: jest.fn(),
  updateToError: jest.fn(),
  handleApiError: jest.fn(),
}))

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
    expect(screen.getByText('Explorar Jogos')).toBeInTheDocument()
  })

  it('deve renderizar itens do carrinho quando há itens', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, email: 'test@test.com', role: 'CLIENT' },
      loading: false,
    })
    ;(useCart as jest.Mock).mockReturnValue({
      items: [
        {
          serviceId: 123,
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
          serviceId: 123,
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
      user: { id: 1, email: 'test@test.com', role: 'CLIENT' },
      loading: false,
    })
    ;(useCart as jest.Mock).mockReturnValue({
      items: [
        {
          serviceId: 123,
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

    // Mock apiPost para criar order
    ;(apiPost as jest.Mock).mockResolvedValueOnce({
      message: 'Solicitação criada com sucesso',
      order: {
        id: 123,
        serviceId: 123,
        total: 89.90,
      },
    })

    // Mock setTimeout para executar imediatamente
    jest.useFakeTimers()

    render(<CartPage />)

    const button = screen.getByText('Finalizar Compra')
    fireEvent.click(button)

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith('/api/orders', expect.objectContaining({
        serviceId: 123,
        total: 89.90,
        currentRank: '10K',
        targetRank: '15K',
        currentRating: 10000,
        targetRating: 15000,
        gameMode: 'PREMIER',
      }))
    })

    // Avançar o timer para executar o setTimeout
    jest.advanceTimersByTime(1500)

    await waitFor(() => {
      expect(mockClearCart).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/payment?orderId=123')
    })

    jest.useRealTimers()
  })

  it('deve exibir erro se não conseguir criar orders', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, email: 'test@test.com', role: 'CLIENT' },
      loading: false,
    })
    ;(useCart as jest.Mock).mockReturnValue({
      items: [
        {
          serviceId: 123,
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
      expect(screen.getByText(/Erro ao criar pedidos|não foi possível criar/i)).toBeInTheDocument()
    })
  })
})

