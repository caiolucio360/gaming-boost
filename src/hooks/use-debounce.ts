'use client'

import { useEffect, useState } from 'react'

/**
 * Retorna uma versão "atrasada" do valor: só atualiza após `delay` ms sem
 * mudanças. Útil para busca server-side sem disparar uma requisição a cada tecla.
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}
