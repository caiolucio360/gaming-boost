'use client'

import { useEffect, useRef } from 'react'
import { useCart } from '@/contexts/cart-context'

// Componente que integra o contexto de carrinho com o contexto de autenticação
export function CartAuthIntegration() {
  const { processCartAfterLogin } = useCart()
  const callbackRef = useRef(processCartAfterLogin)

  // Atualizar ref quando a função mudar
  useEffect(() => {
    callbackRef.current = processCartAfterLogin
  }, [processCartAfterLogin])

  useEffect(() => {
    // Configurar o callback para processar o carrinho após login
    if (typeof window !== 'undefined') {
      (window as any).__setAuthLoginCallback = async () => {
        await callbackRef.current()
      }
    }
  }, [])

  return null
}

