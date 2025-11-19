import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { getAuthToken } from '@/lib/api-client'

interface RealtimeEvent {
  event: string
  data: any
}

interface UseRealtimeOptions {
  enabled?: boolean
  onOrderUpdate?: (data: any) => void
  onPaymentUpdate?: (data: any) => void
  onError?: (error: Error) => void
}

/**
 * Hook para consumir Server-Sent Events (SSE) em tempo real
 * Mais leve que WebSockets, ideal para atualizações unidirecionais
 */
export function useRealtime(options: UseRealtimeOptions = {}) {
  const { enabled = true, onOrderUpdate, onPaymentUpdate, onError } = options
  const { user } = useAuth()
  const eventSourceRef = useRef<EventSource | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const connect = useCallback(() => {
    if (!user || !enabled) return

    // Fechar conexão anterior se existir
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // Criar nova conexão SSE
    // EventSource não suporta headers customizados, então passamos token via query string
    const token = getAuthToken()
    const url = token ? `/api/realtime?token=${encodeURIComponent(token)}` : '/api/realtime'
    
    const eventSource = new EventSource(url, {
      withCredentials: true,
    })

    eventSource.onopen = () => {
      setIsConnected(true)
      console.log('SSE conectado')
    }

    eventSource.onerror = (error) => {
      setIsConnected(false)
      console.error('Erro na conexão SSE:', error)
      
      // Tentar reconectar após 3 segundos
      setTimeout(() => {
        if (enabled && user) {
          connect()
        }
      }, 3000)
    }

    // Eventos customizados
    eventSource.addEventListener('connected', (e) => {
      const data = JSON.parse(e.data)
      console.log('SSE conectado:', data)
      setLastUpdate(new Date())
    })

    eventSource.addEventListener('orders-update', (e) => {
      const data = JSON.parse(e.data)
      setLastUpdate(new Date())
      onOrderUpdate?.(data)
    })

    eventSource.addEventListener('payment-update', (e) => {
      const data = JSON.parse(e.data)
      setLastUpdate(new Date())
      onPaymentUpdate?.(data)
    })

    eventSource.addEventListener('admin-update', (e) => {
      const data = JSON.parse(e.data)
      setLastUpdate(new Date())
      onOrderUpdate?.(data)
    })

    eventSource.addEventListener('heartbeat', (e) => {
      // Manter conexão viva
      setLastUpdate(new Date())
    })

    eventSource.addEventListener('error', (e: MessageEvent) => {
      // O evento 'error' customizado vem com data, mas o erro de conexão não
      if ('data' in e && e.data) {
        try {
          const data = JSON.parse(e.data)
          const error = new Error(data.message || 'Erro desconhecido')
          onError?.(error)
        } catch {
          // Se não conseguir parsear, usar erro genérico
          onError?.(new Error('Erro na conexão'))
        }
      }
    })

    eventSourceRef.current = eventSource
  }, [user, enabled, onOrderUpdate, onPaymentUpdate, onError])

  useEffect(() => {
    if (enabled && user) {
      connect()
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [enabled, user, connect])

  return {
    isConnected,
    lastUpdate,
    reconnect: connect,
  }
}

