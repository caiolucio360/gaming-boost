import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth-middleware'

/**
 * Server-Sent Events (SSE) para atualizações em tempo real
 * Mais leve que WebSockets, ideal para atualizações unidirecionais
 * 
 * Uso: EventSource('/api/realtime')
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    // Primeiro tenta via header (padrão), depois via query string (para SSE)
    let authResult = await verifyAuth(request)
    
    // Se não autenticado via header, tentar via query string (para EventSource)
    if (!authResult.authenticated) {
      const { searchParams } = new URL(request.url)
      const token = searchParams.get('token')
      
      if (token) {
        // Criar request temporário com token no header
        const tempRequest = new NextRequest(request.url, {
          headers: {
            ...Object.fromEntries(request.headers.entries()),
            'Authorization': `Bearer ${token}`,
          },
        })
        authResult = await verifyAuth(tempRequest)
      }
    }
    
    if (!authResult.authenticated || !authResult.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const userId = authResult.user.id
    const userRole = authResult.user.role

  // Criar stream SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Função para enviar evento
      const sendEvent = (event: string, data: any) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      // Enviar evento de conexão
      sendEvent('connected', { userId, role: userRole, timestamp: Date.now() })

      // Polling otimizado: verificar mudanças a cada 1 segundo para boosters (quando há pedidos)
      // e 2 segundos para outros casos
      let isClosed = false
      let lastAvailableCount = -1
      let pollInterval: NodeJS.Timeout | null = null
      let currentPollDelay = 2000 // Delay atual do polling
      
      const poll = async () => {
        if (isClosed) {
          if (pollInterval) clearInterval(pollInterval)
          return
        }
        try {
          // Verificar mudanças baseado no role do usuário
          if (userRole === 'BOOSTER') {
            // Para boosters: verificar pedidos disponíveis e atribuídos
            const availableOrders = await prisma.order.count({
              where: {
                status: 'PENDING',
                boosterId: null,
              },
            })

            const myOrders = await prisma.order.count({
              where: {
                boosterId: userId,
                status: { in: ['IN_PROGRESS', 'PENDING'] },
              },
            })

            // Enviar evento sempre que houver mudança ou na primeira vez
            if (lastAvailableCount === -1 || availableOrders !== lastAvailableCount) {
              sendEvent('orders-update', {
                available: availableOrders,
                myOrders,
              })
              lastAvailableCount = availableOrders
            }

            // Ajustar intervalo: 1s se há pedidos disponíveis, 2s caso contrário
            const pollDelay = availableOrders > 0 ? 1000 : 2000
            
            // Recriar intervalo apenas se o delay mudou
            if (pollDelay !== currentPollDelay) {
              if (pollInterval) {
                clearInterval(pollInterval)
              }
              currentPollDelay = pollDelay
              pollInterval = setInterval(poll, pollDelay)
            }
          } else if (userRole === 'CLIENT') {
            // Para clientes: verificar status dos seus pedidos
            const pendingOrders = await prisma.order.count({
              where: {
                userId,
                status: 'PENDING',
              },
            })

            const inProgressOrders = await prisma.order.count({
              where: {
                userId,
                status: 'IN_PROGRESS',
              },
            })

            sendEvent('orders-update', {
              pending: pendingOrders,
              inProgress: inProgressOrders,
            })
          } else if (userRole === 'ADMIN') {
            // Para admins: verificar pedidos pendentes e pagamentos
            const pendingOrders = await prisma.order.count({
              where: {
                status: 'PENDING',
              },
            })

            const pendingPayments = await prisma.payment.count({
              where: {
                status: 'PENDING',
              },
            })

            sendEvent('admin-update', {
              pendingOrders,
              pendingPayments,
            })
          }
        } catch (error) {
          if (isClosed) {
            if (pollInterval) clearInterval(pollInterval)
            return
          }
          try {
            console.error('Erro no polling SSE:', error)
            sendEvent('error', { message: 'Erro ao verificar atualizações' })
          } catch (sendError) {
            // Stream pode estar fechado
            isClosed = true
            if (pollInterval) clearInterval(pollInterval)
          }
        }
      }
      
      // Iniciar polling imediatamente e depois em intervalos
      await poll()
      
      // Para roles não-BOOSTER, usar intervalo fixo de 2 segundos
      if (userRole !== 'BOOSTER') {
        pollInterval = setInterval(poll, 2000)
      }

      // Manter conexão viva com heartbeat
      const heartbeatInterval = setInterval(() => {
        if (isClosed) {
          clearInterval(heartbeatInterval)
          return
        }
        try {
          sendEvent('heartbeat', { timestamp: Date.now() })
        } catch (error) {
          // Stream pode estar fechado
          isClosed = true
          clearInterval(heartbeatInterval)
        }
      }, 30000) // Heartbeat a cada 30 segundos

      // Limpar intervalos quando conexão for fechada
      const cleanup = () => {
        isClosed = true
        if (pollInterval) clearInterval(pollInterval)
        clearInterval(heartbeatInterval)
        try {
          controller.close()
        } catch (error) {
          // Controller já pode estar fechado
        }
      }

      request.signal.addEventListener('abort', cleanup)

      // Também limpar quando stream for cancelado
      if (request.signal.aborted) {
        cleanup()
      }
    },
  })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Desabilitar buffering no Nginx
      },
    })
  } catch (error) {
    console.error('Erro na rota SSE:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}


