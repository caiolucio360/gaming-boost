'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { CartItem } from '@/types'

interface ProcessCartResult {
  /** Se algum pedido foi criado */
  success: boolean
  /** ID do primeiro pedido criado (para redirecionamento) */
  orderId?: number
  /** Preço total do pedido */
  total?: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => { success: boolean; error?: string }
  removeItem: (index: number) => void
  clearCart: () => void
  processCartAfterLogin: () => Promise<ProcessCartResult>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'gaming-boost-cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Carregar carrinho do localStorage ao inicializar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY)
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart))
        } catch (error) {
          console.error('Erro ao carregar carrinho:', error)
        }
      }
    }
  }, [])

  // Salvar carrinho no localStorage sempre que mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items])

  const addItem = useCallback((item: CartItem): { success: boolean; error?: string } => {
    // Validar: não permitir mais de 1 boost de rank por modalidade no carrinho
    const itemGameMode = item.metadata?.mode
    if (itemGameMode && (itemGameMode === 'PREMIER' || itemGameMode === 'GAMERS_CLUB')) {
      // Verificar se já existe um item com a mesma modalidade no carrinho
      const existingItem = items.find((existing) => {
        const existingGameMode = existing.metadata?.mode
        return existingGameMode === itemGameMode
      })

      if (existingItem) {
        // Não adicionar - item duplicado por modalidade
        const modeName = itemGameMode === 'PREMIER' ? 'Premier' : 'Gamers Club'
        return {
          success: false,
          error: `Você já possui um boost de rank ${modeName} no carrinho. Finalize ou remova o anterior antes de adicionar um novo.`
        }
      }
    }

    setItems((prev) => [...prev, item])
    return { success: true }
  }, [items])

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CART_STORAGE_KEY)
    }
  }, [])

  const processCartAfterLogin = useCallback(async (): Promise<ProcessCartResult> => {
    // Esta função será chamada após o login
    // Ela processa o primeiro item do carrinho e cria a order
    // Retorna o ID da order para redirecionar para pagamento
    if (items.length === 0) return { success: false }

    // Processar apenas o primeiro item (fluxo direto para pagamento)
    const item = items[0]
    try {
      const body: any = {
        game: item.game,
        total: item.price,
      }

      // Adicionar metadados se existirem
      if (item.currentRank) body.currentRank = item.currentRank
      if (item.targetRank) body.targetRank = item.targetRank
      if (item.metadata) {
        if (item.metadata.currentRating !== undefined) body.currentRating = item.metadata.currentRating
        if (item.metadata.targetRating !== undefined) body.targetRating = item.metadata.targetRating
        if (item.metadata.mode) body.gameMode = item.metadata.mode
        if (item.metadata.gameType) body.gameType = item.metadata.gameType
        body.metadata = JSON.stringify(item.metadata)
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        console.error('Erro ao criar order para item:', item)
        clearCart()
        return { success: false }
      }

      const data = await response.json()
      const orderId = data.order?.id

      // Limpar carrinho após processar com sucesso
      clearCart()

      return {
        success: true,
        orderId,
        total: item.price,
      }
    } catch (error) {
      console.error('Erro ao processar item do carrinho:', error)
      clearCart()
      return { success: false }
    }
  }, [items, clearCart])

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        processCartAfterLogin,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart deve ser usado dentro de um CartProvider')
  }
  return context
}
