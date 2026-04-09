import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'
import { ErrorCodes, ErrorMessages } from '@/lib/error-constants'
import { ChatService } from '@/services'
import { rateLimit, getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit'
import { z } from 'zod'

const UpdateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  boosterId: z.union([z.number().int().positive(), z.null()]).optional(),
})

// Admin order mutations: isolated window, 20 req/min per IP
const adminOrderMutationLimiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 })

// GET - Buscar pedido específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdmin(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponseFromResult(authResult)
    }

    const { id } = await params

    // Converter id para número
    const orderId = parseInt(id, 10)
    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: 'ID do pedido inválido' },
        { status: 400 }
      )
    }

    const rawOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        booster: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        payments: {
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
        commission: {
          select: {
            id: true,
            amount: true,
            percentage: true,
            status: true,
          },
        },
        revenues: {
          where: {
            admin: {
              isDevAdmin: false,
            },
          },
          select: {
            id: true,
            amount: true,
            percentage: true,
            status: true,
            admin: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!rawOrder) {
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Mapear order para incluir service virtual
    const order = {
      ...rawOrder,
      service: {
        id: rawOrder.id,
        name: rawOrder.gameMode
          ? `${rawOrder.game} ${rawOrder.gameMode.replace('_', ' ')} Boost`
          : `${rawOrder.game} Boost`,
        game: rawOrder.game,
        type: rawOrder.gameMode || 'BOOST',
      },
    }

    return NextResponse.json({ order }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/admin/orders/[id]:', error)
    return NextResponse.json({ message: 'Erro ao buscar pedido' }, { status: 500 })
  }
}

// PUT - Atualizar status do pedido
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdmin(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponseFromResult(authResult)
    }

    const rateLimitResult = await adminOrderMutationLimiter.check(getIdentifier(request), 20)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { message: 'Muitas tentativas. Aguarde um momento.' },
        { status: 429, headers: createRateLimitHeaders(rateLimitResult) }
      )
    }

    const { id } = await params
    const body = await request.json()

    const validation = UpdateOrderSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ message: 'Dados inválidos' }, { status: 400 })
    }
    const { status, boosterId } = validation.data

    // Converter id para número
    const orderIdNum = parseInt(id, 10)
    if (isNaN(orderIdNum)) {
      return NextResponse.json(
        { message: 'ID do pedido inválido' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}

    // Validate status transition if status is being changed
    if (status) {
      const VALID_TRANSITIONS: Record<string, string[]> = {
        PENDING: ['PAID', 'CANCELLED'],
        PAID: ['IN_PROGRESS', 'CANCELLED'],
        IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
        COMPLETED: [],
        CANCELLED: [],
      }

      // Fetch current order to validate transition
      const currentOrder = await prisma.order.findUnique({
        where: { id: orderIdNum },
        select: { status: true, boosterId: true },
      })

      if (!currentOrder) {
        return NextResponse.json(
          { message: ErrorMessages.ORDER_NOT_FOUND, error: ErrorCodes.ORDER_NOT_FOUND },
          { status: 404 }
        )
      }

      const allowed = VALID_TRANSITIONS[currentOrder.status]
      if (!allowed || !allowed.includes(status)) {
        return NextResponse.json(
          {
            message: ErrorMessages.ADMIN_INVALID_STATUS_TRANSITION,
            error: ErrorCodes.INVALID_STATUS_TRANSITION,
            currentStatus: currentOrder.status,
            requestedStatus: status,
          },
          { status: 400 }
        )
      }

      // COMPLETED requires an assigned booster
      if (status === 'COMPLETED' && !currentOrder.boosterId && !boosterId) {
        return NextResponse.json(
          {
            message: ErrorMessages.ADMIN_ORDER_REQUIRES_BOOSTER,
            error: ErrorCodes.INVALID_STATUS_TRANSITION,
          },
          { status: 400 }
        )
      }

      updateData.status = status

      // Se estiver marcando como COMPLETED, liberar automaticamente as comissões/receitas
      if (status === 'COMPLETED') {
        await prisma.boosterCommission.updateMany({
          where: {
            orderId: orderIdNum,
            status: 'PENDING',
          },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        })

        await prisma.adminRevenue.updateMany({
          where: {
            orderId: orderIdNum,
            status: 'PENDING',
          },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        })
      }
    }

    if (boosterId !== undefined) {
      if (boosterId === null) {
        updateData.boosterId = null
      } else {
        // Verificar se o booster existe e tem role BOOSTER
        const booster = await prisma.user.findUnique({
          where: { id: boosterId },
          select: { role: true },
        })

        if (!booster) {
          return NextResponse.json(
            { message: 'Booster não encontrado' },
            { status: 404 }
          )
        }

        if (booster.role !== 'BOOSTER') {
          return NextResponse.json(
            { message: 'Usuário não é um booster' },
            { status: 400 }
          )
        }

        updateData.boosterId = boosterId
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'Nenhum campo para atualizar' },
        { status: 400 }
      )
    }

    const order = await prisma.order.update({
      where: { id: orderIdNum },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        booster: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    // Wipe Steam credentials when order closes
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      ChatService.wipeSteamCredentials(orderIdNum).catch((error) => {
        console.error('Failed to wipe Steam credentials:', error)
      })
    }

    return NextResponse.json(
      { message: 'Status atualizado com sucesso', order },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/admin/orders/[id]:', error)
    return NextResponse.json({ message: 'Erro ao atualizar pedido' }, { status: 500 })
  }
}

