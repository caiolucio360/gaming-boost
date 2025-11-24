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
        let isClosed = false
        let pollTimeout: NodeJS.Timeout | null = null

        // Função para enviar evento
        const sendEvent = (event: string, data: any) => {
          if (isClosed) return // Não enviar se stream está fechado

          // Verificar se controller ainda está ativo
          if (controller.desiredSize === null) {
            isClosed = true
            return
          }

          try {
            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
            controller.enqueue(encoder.encode(message))
          } catch (error) {
            // Controller fechado - comportamento esperado quando cliente desconecta
            isClosed = true
          }
        }

        // Enviar evento de conexão
        sendEvent('connected', { userId, role: userRole, timestamp: Date.now() })

        // Estado local para rastrear mudanças
        let lastAvailableCount = -1
        let lastMyOrdersCount = -1
        let lastPendingCount = -1
        let lastInProgressCount = -1
        let lastAdminPendingOrders = -1
        let lastAdminPendingPayments = -1
        let lastNotificationId = -1 // Rastrear última notificação enviada para evitar duplicatas

        // Função de polling recursiva
        const poll = async () => {
          if (isClosed) return

          let nextPollDelay = 2000 // Delay padrão

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

              // Enviar evento apenas quando houver mudança real
              if (lastAvailableCount === -1 || lastMyOrdersCount === -1 ||
                  availableOrders !== lastAvailableCount || myOrders !== lastMyOrdersCount) {
                sendEvent('orders-update', {
                  available: availableOrders,
                  myOrders,
                })
                lastAvailableCount = availableOrders
                lastMyOrdersCount = myOrders
              }

              // Se há pedidos disponíveis, aumentar frequência de polling
              if (availableOrders > 0) {
                nextPollDelay = 1000
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

              if (lastPendingCount === -1 || lastInProgressCount === -1 ||
                pendingOrders !== lastPendingCount || inProgressOrders !== lastInProgressCount) {
                sendEvent('orders-update', {
                  pending: pendingOrders,
                  inProgress: inProgressOrders,
                })
                lastPendingCount = pendingOrders
                lastInProgressCount = inProgressOrders
              }

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

              if (lastAdminPendingOrders === -1 || lastAdminPendingPayments === -1 ||
                pendingOrders !== lastAdminPendingOrders ||
                pendingPayments !== lastAdminPendingPayments) {
                sendEvent('admin-update', {
                  pendingOrders,
                  pendingPayments,
                })
                lastAdminPendingOrders = pendingOrders
                lastAdminPendingPayments = pendingPayments
              }
            }

            // Verificar novas notificações (comum a todos)
            // Buscar apenas notificações não lidas criadas recentemente
            const notificationCutoff = new Date(Date.now() - 10000) // Últimos 10 segundos
            const recentNotification = await prisma.notification.findFirst({
              where: {
                userId,
                createdAt: {
                  gt: notificationCutoff
                },
                read: false,
                // Evitar enviar a mesma notificação duas vezes
                ...(lastNotificationId > 0 ? { id: { gt: lastNotificationId } } : {})
              },
              orderBy: {
                createdAt: 'desc'
              }
            })

            if (recentNotification && recentNotification.id !== lastNotificationId) {
              sendEvent('notification', {
                id: recentNotification.id,
                type: recentNotification.type,
                title: recentNotification.title,
                message: recentNotification.message,
                createdAt: recentNotification.createdAt,
              })
              lastNotificationId = recentNotification.id
            }

          } catch (error) {
            if (!isClosed) {
              console.error('Erro no polling SSE:', error)
            }
          }

          // Agendar próximo poll se a conexão ainda estiver ativa
          if (!isClosed) {
            pollTimeout = setTimeout(poll, nextPollDelay)
          }
        }

        // Iniciar loop de polling
        poll()

        // Heartbeat para manter conexão viva (a cada 30s)
        const heartbeatInterval = setInterval(() => {
          if (isClosed) {
            clearInterval(heartbeatInterval)
            return
          }
          try {
            sendEvent('heartbeat', { timestamp: Date.now() })
          } catch (error) {
            isClosed = true
            clearInterval(heartbeatInterval)
          }
        }, 30000)

        // Cleanup
        const cleanup = () => {
          isClosed = true
          if (pollTimeout) clearTimeout(pollTimeout)
          clearInterval(heartbeatInterval)
          try {
            controller.close()
          } catch (e) {
            // Ignorar erro se já estiver fechado
          }
        }

        request.signal.addEventListener('abort', cleanup)
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
