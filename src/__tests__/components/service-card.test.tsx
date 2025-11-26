/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ServiceCard } from '@/components/games/service-card'
import { Service } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/contexts/cart-context'

// Mock dos contextos
jest.mock('@/contexts/auth-context')
jest.mock('@/contexts/cart-context')
const mockRouterPush = jest.fn()
const mockRouterReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
  }),
}))

const mockService: Service = {
  id: 'service123',
  game: 'CS2',
  type: 'RANK_BOOST',
  name: 'Boost CS2 Premier: 10K → 15K',
  description: 'Boost profissional no Counter-Strike 2 Premier',
  price: 89.90,
  duration: '3-6 dias',
}

describe('ServiceCard', () => {
  const mockAddItem = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockRouterPush.mockClear()
    mockRouterReplace.mockClear()
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
    })
    ;(useCart as jest.Mock).mockReturnValue({
      addItem: mockAddItem,
    })
  })

  it('deve renderizar o card com informações do serviço', () => {
    render(<ServiceCard service={mockService} />)

    expect(screen.getByText('Boost CS2 Premier: 10K → 15K')).toBeInTheDocument()
    expect(screen.getByText('Boost profissional no Counter-Strike 2 Premier')).toBeInTheDocument()
    expect(screen.getByText('R$ 89,90')).toBeInTheDocument()
  })

  it('deve adicionar ao carrinho e redirecionar para login se não estiver logado', async () => {
    mockAddItem.mockReturnValue({ success: true })
    
    render(<ServiceCard service={mockService} />)

    const button = screen.getByText('Contratar Agora')
    fireEvent.click(button)

    // Aguardar que handleServiceHire seja chamado (que chama addItem e depois redirectToLogin)
    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalled()
    }, { timeout: 3000 })
    
    // Aguardar que o redirect seja chamado
    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/login')
    }, { timeout: 3000 })
  })

  it('deve criar order diretamente se estiver logado', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: {
        id: 'user123',
        email: 'teste@teste.com',
        role: 'CLIENT',
      },
    })

    // Mock fetch para verificar orders (sem orders ativas)
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ orders: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Solicitação criada com sucesso',
          order: {
            id: 'order123',
          },
        }),
      })

    render(<ServiceCard service={mockService} />)

    const button = screen.getByText('Contratar Agora')
    fireEvent.click(button)

    await waitFor(() => {
      // Verificar que foi chamado para criar order (POST)
      expect(global.fetch).toHaveBeenCalledWith('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"serviceId":'),
      })
      // Verificar redirecionamento para dashboard
      expect(mockRouterReplace).toHaveBeenCalledWith('/dashboard')
    }, { timeout: 3000 })
  })
})

