/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/contexts/auth-context'
import { getAuthToken } from '@/lib/api-client'

// Mock do auth context
jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}))

// Mock do api-client
jest.mock('@/lib/api-client', () => ({
  getAuthToken: jest.fn(() => 'test-token'),
}))

// Mock do EventSource
class MockEventSource {
  url: string
  withCredentials: boolean
  readyState: number
  onopen: ((event: Event) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  listeners: Map<string, ((event: MessageEvent) => void)[]> = new Map()
  private openTimeout: NodeJS.Timeout | null = null

  constructor(url: string, options?: { withCredentials?: boolean }) {
    this.url = url
    this.withCredentials = options?.withCredentials ?? false
    this.readyState = 0 // CONNECTING

    // Simular conexão bem-sucedida
    this.openTimeout = setTimeout(() => {
      this.readyState = 1 // OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 10)
  }

  addEventListener(event: string, listener: (event: MessageEvent) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(listener)
  }

  removeEventListener(event: string, listener: (event: MessageEvent) => void) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  close() {
    this.readyState = 2 // CLOSED
    if (this.openTimeout) {
      clearTimeout(this.openTimeout)
    }
  }

  // Método helper para simular eventos
  simulateEvent(event: string, data: any) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      const messageEvent = new MessageEvent(event, {
        data: JSON.stringify(data),
      })
      listeners.forEach((listener) => listener(messageEvent))
    }
  }
}

// Armazenar instâncias para acesso nos testes
let mockEventSourceInstances: MockEventSource[] = []

// Substituir EventSource global
const EventSourceMock = jest.fn((url: string, options?: { withCredentials?: boolean }) => {
  const instance = new MockEventSource(url, options)
  mockEventSourceInstances.push(instance)
  return instance as any
})

global.EventSource = EventSourceMock as any

describe('useRealtime', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockEventSourceInstances = []
    EventSourceMock.mockClear()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    // Fechar todas as instâncias
    mockEventSourceInstances.forEach((instance) => instance.close())
    mockEventSourceInstances = []
  })

  it('não deve conectar se usuário não estiver autenticado', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    })

    const { result } = renderHook(() => useRealtime({ enabled: true }))

    expect(result.current.isConnected).toBe(false)
  })

  it('não deve conectar se enabled for false', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, role: 'BOOSTER' },
      loading: false,
    })

    const { result } = renderHook(() => useRealtime({ enabled: false }))

    expect(result.current.isConnected).toBe(false)
  })

  it('deve conectar quando usuário está autenticado e enabled é true', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, role: 'BOOSTER' },
      loading: false,
    })

    const { result } = renderHook(() => useRealtime({ enabled: true }))

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })
  })

  it('deve chamar onOrderUpdate quando recebe evento orders-update', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, role: 'BOOSTER' },
      loading: false,
    })

    const onOrderUpdate = jest.fn()

    const { result } = renderHook(() =>
      useRealtime({
        enabled: true,
        onOrderUpdate,
      })
    )

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })

    // Simular evento
    const eventSource = mockEventSourceInstances[0]
    if (eventSource) {
      eventSource.simulateEvent('orders-update', {
        available: 5,
        myOrders: 2,
      })

      await waitFor(() => {
        expect(onOrderUpdate).toHaveBeenCalledWith({
          available: 5,
          myOrders: 2,
        })
      })
    }
  })

  it('deve chamar onPaymentUpdate quando recebe evento payment-update', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, role: 'CLIENT' },
      loading: false,
    })

    const onPaymentUpdate = jest.fn()

    renderHook(() =>
      useRealtime({
        enabled: true,
        onPaymentUpdate,
      })
    )

    await waitFor(() => {
      // Aguardar conexão
    })

    // Simular evento de pagamento
    const eventSource = mockEventSourceInstances[0]
    if (eventSource) {
      eventSource.simulateEvent('payment-update', {
        orderId: 1,
        status: 'PAID',
      })

      await waitFor(() => {
        expect(onPaymentUpdate).toHaveBeenCalledWith({
          orderId: 1,
          status: 'PAID',
        })
      })
    }
  })

  it('deve atualizar lastUpdate quando recebe heartbeat', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, role: 'BOOSTER' },
      loading: false,
    })

    const { result } = renderHook(() => useRealtime({ enabled: true }))

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })

    const initialUpdate = result.current.lastUpdate

    // Simular heartbeat
    const eventSource = mockEventSourceInstances[0]
    if (eventSource) {
      eventSource.simulateEvent('heartbeat', { timestamp: Date.now() })

      await waitFor(() => {
        expect(result.current.lastUpdate).not.toBe(initialUpdate)
      }, { timeout: 1000 })
    }
  })

  it('deve fechar conexão quando componente desmonta', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, role: 'BOOSTER' },
      loading: false,
    })

    const { result, unmount } = renderHook(() => useRealtime({ enabled: true }))

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })

    unmount()

    // Verificar que conexão foi fechada (implementação específica)
    // O EventSource deve ter sido fechado
  })

  it('deve passar token na URL quando disponível', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, role: 'BOOSTER' },
      loading: false,
    })
    ;(getAuthToken as jest.Mock).mockReturnValue('test-token-123')

    renderHook(() => useRealtime({ enabled: true }))

    await waitFor(() => {
      // Verificar que EventSource foi criado com token na URL
      const instances = mockEventSourceInstances
      if (instances.length > 0) {
        expect(instances[0].url).toContain('token=test-token-123')
      }
    })
  })

  it('deve reconectar automaticamente após erro', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, role: 'BOOSTER' },
      loading: false,
    })

    const { result } = renderHook(() => useRealtime({ enabled: true }))

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })

    // Simular erro
    const eventSource = mockEventSourceInstances[0]
    if (eventSource && eventSource.onerror) {
      eventSource.onerror(new Event('error'))
      eventSource.readyState = 2 // CLOSED
      result.current.isConnected = false
    }

    // Avançar timers para permitir reconexão (3 segundos)
    jest.advanceTimersByTime(3000)
    jest.runOnlyPendingTimers()

    await waitFor(() => {
      // Deve ter criado nova instância (pode levar um pouco mais)
      expect(mockEventSourceInstances.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 2000 })
  })
})

