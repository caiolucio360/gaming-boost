'use client'

import { CartItem } from '@/types'
import { GameId } from '@/lib/games-config'

/**
 * Resultado da contratação de serviço
 */
export interface HireResult {
  /** Se o pedido foi criado (true) ou adicionado ao carrinho (false) */
  orderCreated: boolean
  /** ID do pedido criado (se orderCreated for true) */
  orderId?: number
  /** Preço do pedido */
  price: number
}

/**
 * Função para contratar um serviço
 * Se o usuário estiver logado, cria a order diretamente e retorna o ID
 * Se não estiver, adiciona ao carrinho e redireciona para login
 *
 * @returns Objeto com informações do resultado
 */
export async function handleServiceHire(
  item: CartItem,
  isLoggedIn: boolean,
  addToCart: (item: CartItem) => { success: boolean; error?: string },
  redirectToLogin: () => void
): Promise<HireResult> {
  if (!isLoggedIn) {
    // Adicionar ao carrinho e redirecionar para login
    const result = addToCart(item)
    if (!result.success) {
      throw new Error(result.error || 'Erro ao adicionar ao carrinho')
    }
    redirectToLogin()
    return { orderCreated: false, price: item.price }
  }

  // Se estiver logado, verificar se já existe uma order ativa (PENDING ou IN_PROGRESS) para a mesma modalidade
  // Só pode pedir outro quando o anterior for COMPLETED ou CANCELLED
  if (item.metadata?.mode && (item.metadata.mode === 'PREMIER' || item.metadata.mode === 'GAMERS_CLUB')) {
    try {
      const ordersResponse = await fetch('/api/orders')
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        const existingOrder = ordersData.orders?.find((o: any) =>
          (o.status === 'PENDING' || o.status === 'IN_PROGRESS') && o.gameMode === item.metadata?.mode
        )

        if (existingOrder) {
          const modeName = item.metadata.mode === 'PREMIER' ? 'Premier' : 'Gamers Club'
          const statusName = existingOrder.status === 'PENDING' ? 'pendente' : 'em andamento'
          throw new Error(`Você já possui um boost de rank ${modeName} ${statusName}. Finalize ou cancele o pedido anterior antes de criar um novo.`)
        }
      }
    } catch (error) {
      // Se o erro já é uma mensagem de validação, re-lançar
      if (error instanceof Error && error.message.includes('já possui')) {
        throw error
      }
      // Se for outro erro, continuar (não bloquear por erro de rede)
      console.error('Erro ao verificar orders pendentes:', error)
    }
  }

  // Se estiver logado, criar order diretamente
  try {
    const metadata = item.metadata || {}
    const orderId = await createOrder(
      item.game,
      item.price,
      {
        currentRank: item.currentRank,
        targetRank: item.targetRank,
        currentRating: metadata.currentRating,
        targetRating: metadata.targetRating,
        gameMode: metadata.mode,
        gameType: metadata.gameType,
        metadata: metadata,
      }
    )
    return { orderCreated: true, orderId, price: item.price }
  } catch (error) {
    console.error('Erro ao criar order:', error)
    throw error
  }
}

/**
 * Função auxiliar para criar uma order
 * @returns O ID da order criada
 */
export async function createOrder(
  game: GameId = 'CS2',
  total: number,
  metadata?: {
    currentRank?: string
    targetRank?: string
    currentRating?: number
    targetRating?: number
    gameMode?: string
    gameType?: string
    metadata?: Record<string, any>
  }
): Promise<number> {
  const body: any = {
    game,
    total,
  }

  // Adicionar metadados se fornecidos
  if (metadata) {
    if (metadata.currentRank) body.currentRank = metadata.currentRank
    if (metadata.targetRank) body.targetRank = metadata.targetRank
    if (metadata.currentRating !== undefined) body.currentRating = metadata.currentRating
    if (metadata.targetRating !== undefined) body.targetRating = metadata.targetRating
    if (metadata.gameMode) body.gameMode = metadata.gameMode
    if (metadata.gameType) body.gameType = metadata.gameType
    if (metadata.metadata) body.metadata = metadata.metadata
  }

  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erro ao criar solicitação')
  }

  const data = await response.json()
  return data.order.id
}
