'use client'

import { CartItem } from '@/types'

/**
 * Função para contratar um serviço
 * Se o usuário estiver logado, cria a order diretamente
 * Se não estiver, adiciona ao carrinho e redireciona para login
 * 
 * @returns true se o pedido foi criado com sucesso (usuário logado), false se foi adicionado ao carrinho (usuário não logado)
 */
export async function handleServiceHire(
  item: CartItem,
  isLoggedIn: boolean,
  addToCart: (item: CartItem) => { success: boolean; error?: string },
  redirectToLogin: () => void
): Promise<boolean> {
  if (!isLoggedIn) {
    // Adicionar ao carrinho e redirecionar para login
    const result = addToCart(item)
    if (!result.success) {
      throw new Error(result.error || 'Erro ao adicionar ao carrinho')
    }
    redirectToLogin()
    return false // Retorna false indicando que foi adicionado ao carrinho
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

  // Se estiver logado e tiver serviceId, criar order diretamente
  if (item.serviceId) {
    try {
      // Extrair metadados do item
      const metadata = item.metadata || {}
      // Usar a função createOrder local deste arquivo (não o parâmetro)
      await createOrder(
        item.serviceId, 
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
      // Retorna true indicando que o pedido foi criado
      // O redirecionamento será feito pelo componente que chama esta função
      return true
    } catch (error) {
      console.error('Erro ao criar order:', error)
      throw error
    }
  } else {
    // Se não tiver serviceId mas estiver logado, adicionar ao carrinho mesmo assim
    // (para serviços personalizados que podem ser processados depois)
    const result = addToCart(item)
    if (!result.success) {
      throw new Error(result.error || 'Erro ao adicionar ao carrinho')
    }
    // Retorna false indicando que foi adicionado ao carrinho
    // O redirecionamento será feito pelo componente que chama esta função
    return false
  }
}

/**
 * Função auxiliar para criar uma order
 */
export async function createOrder(
  serviceId: string, 
  total: number,
  metadata?: {
    currentRank?: string
    targetRank?: string
    currentRating?: number
    targetRating?: number
    gameMode?: string
    gameType?: string
    metadata?: Record<string, any>
    notes?: string
  }
): Promise<void> {
  const body: any = {
    serviceId,
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
    if (metadata.notes) body.notes = metadata.notes
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
}

