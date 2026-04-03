import { NextRequest, NextResponse } from 'next/server'
import { verifyBooster, createAuthErrorResponse } from '@/lib/auth-middleware'
import { createApiErrorResponse, ErrorMessages } from '@/lib/api-errors'
import { getStatusForError } from '@/lib/error-constants'
import { OrderService } from '@/services'

// POST - Accept an available order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyBooster(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || ErrorMessages.AUTH_UNAUTHENTICATED,
        401
      )
    }

    const { id } = await params
    const boosterId = authResult.user.id

    // Parse order ID
    const orderId = parseInt(id, 10)
    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: 'ID do pedido inválido' },
        { status: 400 }
      )
    }

    // Use OrderService to accept order
    const result = await OrderService.acceptOrder({ orderId, boosterId })

    if (!result.success) {
      // Map error codes to appropriate HTTP status
      const status = result.code ? getStatusForError(result.code) : 500

      return NextResponse.json(
        { message: result.error, code: result.code },
        { status }
      )
    }

    return NextResponse.json(
      { message: 'Pedido aceito com sucesso', order: result.data },
      { status: 200 }
    )
  } catch (error) {
    return createApiErrorResponse(error, ErrorMessages.BOOSTER_ACCEPT_ORDER_FAILED, 'POST /api/booster/orders/[id]')
  }
}

// PUT - Update order status (mark as complete)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyBooster(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || ErrorMessages.AUTH_UNAUTHENTICATED,
        401
      )
    }

    const { id } = await params
    const boosterId = authResult.user.id
    const body = await request.json()
    const { status, completionProofUrl } = body

    // Parse order ID
    const orderId = parseInt(id, 10)
    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: 'ID do pedido inválido' },
        { status: 400 }
      )
    }

    // Validate status
    if (!status || !['IN_PROGRESS', 'COMPLETED'].includes(status)) {
      return NextResponse.json(
        { message: 'Status inválido. Use IN_PROGRESS ou COMPLETED' },
        { status: 400 }
      )
    }

    // Require proof screenshot when completing
    if (status === 'COMPLETED') {
      if (!completionProofUrl || typeof completionProofUrl !== 'string' || !completionProofUrl.startsWith('http')) {
        return NextResponse.json(
          { message: 'É obrigatório enviar um print comprovando o rank atingido para concluir o pedido.' },
          { status: 400 }
        )
      }
    }

    // Use OrderService for status updates
    let result
    if (status === 'COMPLETED') {
      result = await OrderService.completeOrder({ orderId, boosterId, completionProofUrl })
    } else {
      // For other status updates, we need to verify ownership first
      const orderResult = await OrderService.getOrderById(orderId)
      if (!orderResult.success || !orderResult.data) {
        return NextResponse.json(
          { message: ErrorMessages.ORDER_NOT_FOUND },
          { status: 404 }
        )
      }
      if (orderResult.data.boosterId !== boosterId) {
        return NextResponse.json(
          { message: ErrorMessages.ORDER_ACCESS_DENIED },
          { status: 403 }
        )
      }
      result = await OrderService.updateOrderStatus(orderId, status)
    }

    if (!result.success) {
      // Map error codes to appropriate HTTP status
      const statusCode = result.code ? getStatusForError(result.code) : 500

      return NextResponse.json(
        { message: result.error, code: result.code },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      { message: 'Status atualizado com sucesso', order: result.data },
      { status: 200 }
    )
  } catch (error) {
    return createApiErrorResponse(error, ErrorMessages.BOOSTER_UPDATE_ORDER_FAILED, 'PUT /api/booster/orders/[id]')
  }
}
