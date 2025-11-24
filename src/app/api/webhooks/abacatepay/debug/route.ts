import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Endpoint de debug para verificar status de pagamentos e webhooks
 * GET /api/webhooks/abacatepay/debug?providerId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')
    const orderId = searchParams.get('orderId')

    if (!providerId && !orderId) {
      return NextResponse.json(
        { error: 'Forneça providerId ou orderId' },
        { status: 400 }
      )
    }

    let payment
    if (providerId) {
      payment = await prisma.payment.findFirst({
        where: { providerId },
        include: {
          order: {
            include: {
              user: {
                select: { id: true, email: true, name: true }
              }
            }
          }
        }
      })
    } else if (orderId) {
      payment = await prisma.payment.findFirst({
        where: { orderId: parseInt(orderId) },
        include: {
          order: {
            include: {
              user: {
                select: { id: true, email: true, name: true }
              }
            }
          }
        }
      })
    }

    if (!payment) {
      return NextResponse.json(
        { 
          error: 'Pagamento não encontrado',
          providerId,
          orderId 
        },
        { status: 404 }
      )
    }

    // Buscar notificações relacionadas
    const notifications = await prisma.notification.findMany({
      where: {
        userId: payment.order.userId,
        type: 'PAYMENT',
        title: {
          contains: 'Pagamento'
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    return NextResponse.json({
      payment: {
        id: payment.id,
        providerId: payment.providerId,
        status: payment.status,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        total: payment.total,
      },
      order: {
        id: payment.order.id,
        status: payment.order.status,
        total: payment.order.total,
      },
      user: {
        id: payment.order.user.id,
        email: payment.order.user.email,
        name: payment.order.user.name,
      },
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
      })),
      webhookUrl: 'https://gaming-boost.vercel.app/api/webhooks/abacatepay',
      diagnostic: {
        paymentFound: !!payment,
        isPaid: payment.status === 'PAID',
        hasPaidAt: !!payment.paidAt,
        orderStatus: payment.order.status,
        hasNotifications: notifications.length > 0,
      }
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar informações', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

