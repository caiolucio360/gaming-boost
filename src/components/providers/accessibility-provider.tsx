'use client'

import { useEffect } from 'react'
import React from 'react'
import ReactDOM from 'react-dom'

/**
 * Provider de acessibilidade que inicializa o axe-core/react
 * Apenas em ambiente de desenvolvimento para auditoria de acessibilidade
 * 
 * O axe-core detecta problemas de acessibilidade e os exibe no console
 * durante o desenvolvimento, ajudando a identificar e corrigir problemas
 * antes de ir para produção.
 * 
 * @see https://github.com/dequelabs/axe-core-npm/tree/develop/packages/react
 */
export function AccessibilityProvider() {
  useEffect(() => {
    // Apenas carregar em desenvolvimento e no cliente
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
      return
    }

    // Carregar dinamicamente para não incluir no bundle de produção
    import('@axe-core/react')
      .then((axe) => {
        // Inicializar axe com configurações padrão
        // Delay de 1000ms para garantir que o DOM esteja pronto
        axe.default(React, ReactDOM, 1000, {
          // Configurações do axe
          rules: {
            // Regras específicas que queremos verificar
            'color-contrast': { enabled: true },
            'keyboard-navigation': { enabled: true },
            'aria-required-attr': { enabled: true },
            'aria-valid-attr': { enabled: true },
            'button-name': { enabled: true },
            'image-alt': { enabled: true },
            'link-name': { enabled: true },
            'heading-order': { enabled: true },
            'landmark-one-main': { enabled: true },
            'page-has-heading-one': { enabled: true },
            'region': { enabled: true },
          } as Record<string, { enabled: boolean }>,
          // Tags para verificar (WCAG 2.1 Level A e AA)
          tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
        } as any)
      })
      .catch((error) => {
        // Silenciosamente falhar se não conseguir carregar
        // Isso pode acontecer se o pacote não estiver instalado
        console.warn('Failed to load @axe-core/react:', error)
      })
  }, [])

  return null
}
