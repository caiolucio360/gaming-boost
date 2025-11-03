import { handleServiceHire, createOrder } from '@/lib/cart-utils'
import { CartItem } from '@/types'

// Mock do fetch
global.fetch = jest.fn()

describe('cart-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('handleServiceHire', () => {
    const mockItem: CartItem = {
      serviceId: 'service123',
      game: 'CS2',
      serviceName: 'Boost CS2 Premier: 10K → 15K',
      price: 89.90,
      metadata: {
        mode: 'PREMIER',
      },
    }

    const mockAddToCart = jest.fn().mockReturnValue({ success: true })
    const mockRedirectToLogin = jest.fn()

    it('deve adicionar ao carrinho e redirecionar para login se não estiver logado', async () => {
      await handleServiceHire(
        mockItem,
        false, // não logado
        mockAddToCart,
        mockRedirectToLogin
      )

      expect(mockAddToCart).toHaveBeenCalledWith(mockItem)
      expect(mockRedirectToLogin).toHaveBeenCalled()
    })

    it('deve criar order diretamente se estiver logado e tiver serviceId', async () => {
      // Mock fetch para verificar orders (sem orders ativas)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ orders: [] }),
      })
      
      // Mock fetch para criar order
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Solicitação criada com sucesso',
          order: { id: 'order123' },
        }),
      })

      const result = await handleServiceHire(
        mockItem,
        true, // logado
        mockAddToCart,
        mockRedirectToLogin
      )

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith('/api/orders')
      expect(mockAddToCart).not.toHaveBeenCalled()
      expect(mockRedirectToLogin).not.toHaveBeenCalled()
    })

    it('deve adicionar ao carrinho mesmo logado se não tiver serviceId', async () => {
      const itemWithoutServiceId: CartItem = {
        game: 'CS2',
        serviceName: 'Boost CS2 Premier: 10K → 15K',
        price: 89.90,
      }

      const result = await handleServiceHire(
        itemWithoutServiceId,
        true, // logado
        mockAddToCart,
        mockRedirectToLogin
      )

      expect(result).toBe(false)
      expect(mockAddToCart).toHaveBeenCalledWith(itemWithoutServiceId)
    })

    it('deve verificar orders pendentes antes de criar quando logado com modalidade', async () => {
      // Mock fetch para retornar orders vazias (não há order ativa)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orders: [],
        }),
      })
      
      // Mock fetch para criar order
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Solicitação criada com sucesso',
          order: { id: 'order123' },
        }),
      })

      const result = await handleServiceHire(
        mockItem,
        true, // logado
        mockAddToCart,
        mockRedirectToLogin
      )

      expect(global.fetch).toHaveBeenCalledWith('/api/orders')
      expect(result).toBe(true)
    })

    it('deve lançar erro se já existir order ativa para a mesma modalidade', async () => {
      // Mock fetch para retornar order ativa existente
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orders: [
            {
              id: 'existing-order',
              status: 'PENDING',
              gameMode: 'PREMIER',
            },
          ],
        }),
      })

      await expect(
        handleServiceHire(
          mockItem,
          true, // logado
          mockAddToCart,
          mockRedirectToLogin
        )
      ).rejects.toThrow('já possui um boost de rank Premier')
    })

    it('deve permitir criar order se order existente estiver COMPLETED', async () => {
      // Mock fetch para retornar order COMPLETED (não ativa)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orders: [
            {
              id: 'completed-order',
              status: 'COMPLETED',
              gameMode: 'PREMIER',
            },
          ],
        }),
      })
      
      // Mock fetch para criar order
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Solicitação criada com sucesso',
          order: { id: 'order123' },
        }),
      })

      const result = await handleServiceHire(
        mockItem,
        true, // logado
        mockAddToCart,
        mockRedirectToLogin
      )

      expect(result).toBe(true)
    })
  })

  describe('createOrder', () => {
    it('deve criar order com sucesso', async () => {
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

      await createOrder('service123', 89.90)

      expect(global.fetch).toHaveBeenCalledWith('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: 'service123',
          total: 89.90,
        }),
      })
    })

    it('deve criar order com metadados quando fornecidos', async () => {
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

      await createOrder('service123', 89.90, {
        currentRank: '10K',
        targetRank: '15K',
        currentRating: 10000,
        targetRating: 15000,
        gameMode: 'PREMIER',
        gameType: 'CS2_PREMIER',
      })

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
          gameType: 'CS2_PREMIER',
        }),
      })
    })

    it('deve lançar erro se a API retornar erro', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: 'Erro ao criar solicitação',
        }),
      })

      await expect(createOrder('service123', 49.90)).rejects.toThrow(
        'Erro ao criar solicitação'
      )
    })
  })
})

