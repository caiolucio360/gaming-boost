import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withApiHandler, parseIntParam } from '@/lib/api-handler'
import { ErrorMessages } from '@/lib/api-errors'
import { HttpStatus } from '@/lib/http-status'

interface RouteParams {
  params: Promise<{ id: string }>
}

const orderInclude = {
  booster: { select: { id: true, email: true, name: true } },
} as const

// GET - Buscar pedido específico
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withApiHandler(
    async ({ user }) => {
      const { id } = await params
      const orderId = parseIntParam(id)
      if (orderId === null) {
        return NextResponse.json({ message: 'ID do pedido inválido' }, { status: HttpStatus.BAD_REQUEST })
      }

      const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude })
      if (!order) {
        return NextResponse.json({ message: ErrorMessages.ORDER_NOT_FOUND }, { status: HttpStatus.NOT_FOUND })
      }
      if (order.userId !== user.id) {
        return NextResponse.json(
          { message: 'Acesso negado. Este pedido não pertence a você.' },
          { status: HttpStatus.FORBIDDEN }
        )
      }

      return NextResponse.json({ order }, { status: HttpStatus.OK })
    },
    { auth: true, errorMessage: ErrorMessages.ORDER_FETCH_FAILED, endpoint: 'GET /api/orders/[id]' }
  )(request)
}

// PUT - Cancelar pedido (apenas para o dono do pedido)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withApiHandler(
    async ({ user }) => {
      const { id } = await params
      const orderId = parseIntParam(id)
      if (orderId === null) {
        return NextResponse.json({ message: 'ID do pedido inválido' }, { status: HttpStatus.BAD_REQUEST })
      }

      const order = await prisma.order.findUnique({ where: { id: orderId } })
      if (!order) {
        return NextResponse.json({ message: ErrorMessages.ORDER_NOT_FOUND }, { status: HttpStatus.NOT_FOUND })
      }
      if (order.userId !== user.id) {
        return NextResponse.json(
          { message: 'Acesso negado. Este pedido não pertence a você.' },
          { status: HttpStatus.FORBIDDEN }
        )
      }

      // Apenas pedidos PENDING podem ser cancelados pelo cliente
      if (order.status !== 'PENDING') {
        return NextResponse.json(
          {
            message: `Não é possível cancelar um pedido com status ${order.status}. Apenas pedidos pendentes podem ser cancelados.`,
          },
          { status: HttpStatus.BAD_REQUEST }
        )
      }

      const updatedOrder = await prisma.$transaction(async (tx: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        await tx.payment.updateMany({
          where: { orderId, status: 'PENDING' },
          data: { status: 'CANCELLED' },
        })

        return tx.order.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' },
          include: orderInclude,
        })
      })

      return NextResponse.json(
        { message: 'Pedido cancelado com sucesso', order: updatedOrder },
        { status: HttpStatus.OK }
      )
    },
    { auth: true, errorMessage: ErrorMessages.ORDER_CANCEL_FAILED, endpoint: 'PUT /api/orders/[id]' }
  )(request)
}
