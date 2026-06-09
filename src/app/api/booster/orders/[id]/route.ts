import { NextRequest, NextResponse } from 'next/server'
import { withApiHandler, parseIntParam } from '@/lib/api-handler'
import { ErrorMessages } from '@/lib/api-errors'
import { getStatusForError } from '@/lib/error-constants'
import { HttpStatus } from '@/lib/http-status'
import { OrderService } from '@/services'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Valida que a URL do comprovante aponta para o nosso storage (Vercel Blob),
 * impedindo que um booster registre uma URL externa arbitraria como "prova".
 */
function isValidProofUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.public.blob.vercel-storage.com')
  } catch {
    return false
  }
}

// POST - Accept an available order
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withApiHandler(
    async ({ user }) => {
      const { id } = await params
      const orderId = parseIntParam(id)
      if (orderId === null) {
        return NextResponse.json({ message: 'ID do pedido inválido' }, { status: HttpStatus.BAD_REQUEST })
      }

      const result = await OrderService.acceptOrder({ orderId, boosterId: user.id })
      if (!result.success) {
        const status = result.code ? getStatusForError(result.code) : HttpStatus.INTERNAL_SERVER_ERROR
        return NextResponse.json({ message: result.error, code: result.code }, { status })
      }

      return NextResponse.json({ message: 'Pedido aceito com sucesso', order: result.data }, { status: HttpStatus.OK })
    },
    { auth: { roles: ['BOOSTER'] }, errorMessage: ErrorMessages.BOOSTER_ACCEPT_ORDER_FAILED, endpoint: 'POST /api/booster/orders/[id]' }
  )(request)
}

// PUT - Update order status (mark as in progress / complete)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withApiHandler(
    async ({ request, user }) => {
      const { id } = await params
      const orderId = parseIntParam(id)
      if (orderId === null) {
        return NextResponse.json({ message: 'ID do pedido inválido' }, { status: HttpStatus.BAD_REQUEST })
      }

      const { status, completionProofUrl } = await request.json()

      if (!status || !['IN_PROGRESS', 'COMPLETED'].includes(status)) {
        return NextResponse.json(
          { message: 'Status inválido. Use IN_PROGRESS ou COMPLETED' },
          { status: HttpStatus.BAD_REQUEST }
        )
      }

      // Require proof screenshot when completing — must be a URL from our storage
      // (Vercel Blob), never an arbitrary external URL submitted by the booster.
      if (status === 'COMPLETED') {
        if (!completionProofUrl || typeof completionProofUrl !== 'string' || !isValidProofUrl(completionProofUrl)) {
          return NextResponse.json(
            { message: 'É obrigatório enviar um print comprovando o rank atingido para concluir o pedido.' },
            { status: HttpStatus.BAD_REQUEST }
          )
        }
      }

      let result
      if (status === 'COMPLETED') {
        result = await OrderService.completeOrder({ orderId, boosterId: user.id, completionProofUrl })
      } else {
        // For other status updates, verify ownership first
        const orderResult = await OrderService.getOrderById(orderId)
        if (!orderResult.success || !orderResult.data) {
          return NextResponse.json({ message: ErrorMessages.ORDER_NOT_FOUND }, { status: HttpStatus.NOT_FOUND })
        }
        if (orderResult.data.boosterId !== user.id) {
          return NextResponse.json({ message: ErrorMessages.ORDER_ACCESS_DENIED }, { status: HttpStatus.FORBIDDEN })
        }
        result = await OrderService.updateOrderStatus(orderId, status)
      }

      if (!result.success) {
        const statusCode = result.code ? getStatusForError(result.code) : HttpStatus.INTERNAL_SERVER_ERROR
        return NextResponse.json({ message: result.error, code: result.code }, { status: statusCode })
      }

      return NextResponse.json({ message: 'Status atualizado com sucesso', order: result.data }, { status: HttpStatus.OK })
    },
    { auth: { roles: ['BOOSTER'] }, errorMessage: ErrorMessages.BOOSTER_UPDATE_ORDER_FAILED, endpoint: 'PUT /api/booster/orders/[id]' }
  )(request)
}
