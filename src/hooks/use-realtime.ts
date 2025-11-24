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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isReconnectingRef = useRef(false)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Usar refs para callbacks para evitar recriações desnecessárias
  const callbacksRef = useRef({ onOrderUpdate, onPaymentUpdate, onError })
  
  // Atualizar refs quando callbacks mudarem
  useEffect(() => {
    callbacksRef.current = { onOrderUpdate, onPaymentUpdate, onError }
  }, [onOrderUpdate, onPaymentUpdate, onError])

  const connect = useCallback(() => {
    if (!user || !enabled) return

    // Evitar múltiplas tentativas de reconexão simultâneas
    if (isReconnectingRef.current) {
      return
    }

    // Fechar conexão anterior se existir
    if (eventSourceRef.current) {
      try {
        eventSourceRef.current.close()
      } catch (e) {
        // Ignorar erro se já estiver fechado
      }
      eventSourceRef.current = null
    }

    // Limpar timeout de reconexão anterior
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Criar nova conexão SSE
    // EventSource não suporta headers customizados, então passamos token via query string
    const token = getAuthToken()
    const url = token ? `/api/realtime?token=${encodeURIComponent(token)}` : '/api/realtime'
    
    try {
      const eventSource = new EventSource(url, {
        withCredentials: true,
      })

      eventSource.onopen = () => {
        setIsConnected(true)
        isReconnectingRef.current = false
        console.log('SSE conectado')
      }

      eventSource.onerror = (error) => {
        setIsConnected(false)
        
        // Verificar se é um erro de conexão (readyState === 2 = CLOSED)
        if (eventSource.readyState === EventSource.CLOSED) {
          console.warn('SSE desconectado, tentando reconectar...')
          
          // Fechar conexão atual
          try {
            eventSource.close()
          } catch (e) {
            // Ignorar erro
          }
          
          // Tentar reconectar após delay, mas apenas se não estiver já reconectando
          if (!isReconnectingRef.current && enabled && user) {
            isReconnectingRef.current = true
            reconnectTimeoutRef.current = setTimeout(() => {
              isReconnectingRef.current = false
              connect()
            }, 3000)
          }
        } else {
          // Erro temporário, não fazer nada (EventSource tenta reconectar automaticamente)
          console.warn('Erro temporário na conexão SSE:', error)
        }
      }

      // Eventos customizados
      eventSource.addEventListener('connected', (e) => {
        try {
          const data = JSON.parse(e.data)
          console.log('SSE conectado:', data)
          setLastUpdate(new Date())
        } catch (err) {
          console.error('Erro ao parsear evento connected:', err)
        }
      })

      eventSource.addEventListener('orders-update', (e) => {
        try {
          const data = JSON.parse(e.data)
          setLastUpdate(new Date())
          callbacksRef.current.onOrderUpdate?.(data)
        } catch (err) {
          console.error('Erro ao processar orders-update:', err)
        }
      })

      eventSource.addEventListener('payment-update', (e) => {
        try {
          const data = JSON.parse(e.data)
          setLastUpdate(new Date())
          callbacksRef.current.onPaymentUpdate?.(data)
        } catch (err) {
          console.error('Erro ao processar payment-update:', err)
        }
      })

      eventSource.addEventListener('admin-update', (e) => {
        try {
          const data = JSON.parse(e.data)
          setLastUpdate(new Date())
          callbacksRef.current.onOrderUpdate?.(data)
        } catch (err) {
          console.error('Erro ao processar admin-update:', err)
        }
      })

      eventSource.addEventListener('notification', (e) => {
        try {
          const data = JSON.parse(e.data)
          setLastUpdate(new Date())
          // Notificações podem ser tratadas via onOrderUpdate se necessário
          callbacksRef.current.onOrderUpdate?.(data)
        } catch (err) {
          console.error('Erro ao processar notification:', err)
        }
      })

      eventSource.addEventListener('heartbeat', (e) => {
        // Manter conexão viva
        setLastUpdate(new Date())
      })

      eventSource.addEventListener('error', (e: MessageEvent) => {
        // O evento 'error' customizado vem com data
        if ('data' in e && e.data) {
          try {
            const data = JSON.parse(e.data)
            const error = new Error(data.message || 'Erro desconhecido')
            callbacksRef.current.onError?.(error)
          } catch {
            // Se não conseguir parsear, usar erro genérico
            callbacksRef.current.onError?.(new Error('Erro na conexão'))
          }
        }
      })

      eventSourceRef.current = eventSource
    } catch (error) {
      console.error('Erro ao criar EventSource:', error)
      isReconnectingRef.current = false
      
      // Tentar reconectar após delay
      if (enabled && user) {
        reconnectTimeoutRef.current = setTimeout(() => {
          isReconnectingRef.current = false
          connect()
        }, 5000)
      }
    }
  }, [user, enabled])

  useEffect(() => {
    if (enabled && user) {
      connect()
    }

    return () => {
      // Cleanup
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      
      if (eventSourceRef.current) {
        try {
          eventSourceRef.current.close()
        } catch (e) {
          // Ignorar erro
        }
        eventSourceRef.current = null
      }
      
      isReconnectingRef.current = false
    }
  }, [enabled, user, connect])

  return {
    isConnected,
    lastUpdate,
    reconnect: connect,
  }
}

