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
      const result = await handleServiceHire(
        mockItem,
        false, // não logado
        mockAddToCart,
        mockRedirectToLogin
      )

      expect(mockAddToCart).toHaveBeenCalledWith(mockItem)
      expect(mockRedirectToLogin).toHaveBeenCalled()
      expect(result.orderCreated).toBe(false)
    })

    it('deve criar order diretamente se estiver logado', async () => {
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
          order: { id: 123 },
        }),
      })

      const result = await handleServiceHire(
        mockItem,
        true, // logado
        mockAddToCart,
        mockRedirectToLogin
      )

      expect(result.orderCreated).toBe(true)
      expect(result.orderId).toBe(123)
      expect(global.fetch).toHaveBeenCalledWith('/api/orders')
      expect(mockAddToCart).not.toHaveBeenCalled()
      expect(mockRedirectToLogin).not.toHaveBeenCalled()
    })

    it('deve criar order mesmo sem metadados de modalidade', async () => {
      const itemWithoutMode: CartItem = {
        game: 'CS2',
        serviceName: 'Boost CS2 Premier: 10K → 15K',
        price: 89.90,
      }

      // Mock fetch para criar order (sem verificação de duplicatas pois sem metadata.mode)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Solicitação criada com sucesso',
          order: { id: 456 },
        }),
      })

      const result = await handleServiceHire(
        itemWithoutMode,
        true, // logado
        mockAddToCart,
        mockRedirectToLogin
      )

      expect(result.orderCreated).toBe(true)
      expect(result.orderId).toBe(456)
      expect(mockAddToCart).not.toHaveBeenCalled()
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
          order: { id: 123 },
        }),
      })

      const result = await handleServiceHire(
        mockItem,
        true, // logado
        mockAddToCart,
        mockRedirectToLogin
      )

      expect(global.fetch).toHaveBeenCalledWith('/api/orders')
      expect(result.orderCreated).toBe(true)
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
          order: { id: 123 },
        }),
      })

      const result = await handleServiceHire(
        mockItem,
        true, // logado
        mockAddToCart,
        mockRedirectToLogin
      )

      expect(result.orderCreated).toBe(true)
    })
  })

  describe('createOrder', () => {
    it('deve criar order com sucesso', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Solicitação criada com sucesso',
          order: {
            id: 123,
            game: 'CS2',
            total: 89.90,
          },
        }),
      })

      const orderId = await createOrder('CS2', 89.90)

      expect(orderId).toBe(123)
      expect(global.fetch).toHaveBeenCalledWith('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game: 'CS2',
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
            id: 456,
            game: 'CS2',
            total: 89.90,
          },
        }),
      })

      await createOrder('CS2', 89.90, {
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
          game: 'CS2',
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

      await expect(createOrder('CS2', 49.90)).rejects.toThrow(
        'Erro ao criar solicitação'
      )
    })
  })
})
