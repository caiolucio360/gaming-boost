import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'
import { ErrorCodes, ErrorMessages, getStatusForError } from '@/lib/error-constants'
import { ChatService, OrderService } from '@/services'
import { rateLimit, getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit'
import { HttpStatus } from '@/lib/http-status'
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
        { status: HttpStatus.BAD_REQUEST }
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
        { status: HttpStatus.NOT_FOUND }
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

    return NextResponse.json({ order }, { status: HttpStatus.OK })
  } catch (error) {
    console.error('Error in GET /api/admin/orders/[id]:', error)
    return NextResponse.json({ message: 'Erro ao buscar pedido' }, { status: HttpStatus.INTERNAL_SERVER_ERROR })
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
        { status: HttpStatus.TOO_MANY_REQUESTS, headers: createRateLimitHeaders(rateLimitResult) }
      )
    }

    const { id } = await params
    const body = await request.json()

    const validation = UpdateOrderSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ message: 'Dados inválidos' }, { status: HttpStatus.BAD_REQUEST })
    }
    const { status, boosterId } = validation.data

    // Converter id para número
    const orderIdNum = parseInt(id, 10)
    if (isNaN(orderIdNum)) {
      return NextResponse.json(
        { message: 'ID do pedido inválido' },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Booster assignment is delegated to OrderService so it also snapshots
    // commission/revenue (admin override — mirrors what acceptOrder does).
    // Run it before any status change so a subsequent COMPLETED can release
    // the freshly-created commission.
    let assignedOrder:
      | Extract<Awaited<ReturnType<typeof OrderService.assignBooster>>, { success: true }>['data']
      | null = null
    if (boosterId !== undefined) {
      const assignResult = await OrderService.assignBooster({ orderId: orderIdNum, boosterId })
      if (!assignResult.success) {
        const statusCode = assignResult.code ? getStatusForError(assignResult.code) : HttpStatus.INTERNAL_SERVER_ERROR
        return NextResponse.json(
          { message: assignResult.error, code: assignResult.code },
          { status: statusCode }
        )
      }
      assignedOrder = assignResult.data
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
          { message: ErrorMessages.ORDER_NOT_FOUND, code: ErrorCodes.ORDER_NOT_FOUND },
          { status: HttpStatus.NOT_FOUND }
        )
      }

      const allowed = VALID_TRANSITIONS[currentOrder.status]
      if (!allowed || !allowed.includes(status)) {
        // Explain *why* the transition is blocked instead of a generic message.
        // The most common case: trying to complete a PAID order that no booster
        // has started yet — it must pass through IN_PROGRESS first.
        let message: string = ErrorMessages.ADMIN_INVALID_STATUS_TRANSITION
        if (status === 'COMPLETED' && currentOrder.status === 'PAID') {
          message =
            'Não é possível concluir um pedido que ainda está PAGO. ' +
            'Atribua um booster e mova o pedido para EM ANDAMENTO antes de marcá-lo como CONCLUÍDO.'
        }

        return NextResponse.json(
          {
            message,
            code: ErrorCodes.INVALID_STATUS_TRANSITION,
            currentStatus: currentOrder.status,
            requestedStatus: status,
          },
          { status: HttpStatus.BAD_REQUEST }
        )
      }

      // COMPLETED requires an assigned booster
      if (status === 'COMPLETED' && !currentOrder.boosterId && !boosterId) {
        return NextResponse.json(
          {
            message: ErrorMessages.ADMIN_ORDER_REQUIRES_BOOSTER,
            code: ErrorCodes.INVALID_STATUS_TRANSITION,
          },
          { status: HttpStatus.BAD_REQUEST }
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

        await prisma.devAdminRevenue.updateMany({
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

    if (Object.keys(updateData).length === 0) {
      // Booster-only update already persisted by OrderService.assignBooster
      if (assignedOrder) {
        return NextResponse.json(
          { message: 'Booster atualizado com sucesso', order: assignedOrder },
          { status: HttpStatus.OK }
        )
      }
      return NextResponse.json(
        { message: 'Nenhum campo para atualizar' },
        { status: HttpStatus.BAD_REQUEST }
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
      { status: HttpStatus.OK }
    )
  } catch (error) {
    console.error('Error in PUT /api/admin/orders/[id]:', error)
    return NextResponse.json({ message: 'Erro ao atualizar pedido' }, { status: HttpStatus.INTERNAL_SERVER_ERROR })
  }
}

