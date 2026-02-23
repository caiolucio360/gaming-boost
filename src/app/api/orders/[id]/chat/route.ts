import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'
import { rateLimit, getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit'
import { createApiErrorResponse, ErrorMessages } from '@/lib/api-errors'
import { ChatService } from '@/services'
import { SendMessageSchema, ChatQuerySchema } from '@/schemas'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Rate limiter for chat messages: 30 messages per minute per user
const chatRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 1000,
})

/**
 * GET /api/orders/[id]/chat - Get chat messages for an order
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await verifyAuth(request)

    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Não autenticado',
        401
      )
    }

    const { id } = await params
    const orderId = parseInt(id)
    const userId = authResult.user.id

    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: 'ID do pedido inválido' },
        { status: 400 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryResult = ChatQuerySchema.safeParse({
      limit: searchParams.get('limit'),
      before: searchParams.get('before'),
    })

    const limit = queryResult.success ? queryResult.data.limit : 50
    const before = queryResult.success ? queryResult.data.before : undefined

    // Get messages
    const result = await ChatService.getMessages({
      orderId,
      userId,
      limit,
      before,
    })

    if (!result.success) {
      const statusMap: Record<string, number> = {
        'ORDER_NOT_FOUND': 404,
        'USER_NOT_FOUND': 404,
        'CHAT_ACCESS_DENIED': 403,
      }
      const status = result.code ? statusMap[result.code] || 500 : 500

      return NextResponse.json(
        { message: result.error, code: result.code },
        { status }
      )
    }

    // Check if chat is enabled (for UI state)
    const enabledResult = await ChatService.isChatEnabled(orderId)
    const chatEnabled = enabledResult.success && enabledResult.data.enabled

    return NextResponse.json({
      chat: result.data,
      chatEnabled,
      disabledReason: enabledResult.success && !enabledResult.data.enabled
        ? enabledResult.data.reason
        : null,
    })
  } catch (error) {
    return createApiErrorResponse(error, ErrorMessages.ORDER_FETCH_FAILED, 'GET /api/orders/[id]/chat')
  }
}

/**
 * POST /api/orders/[id]/chat - Send a message in the order chat
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await verifyAuth(request)

    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Não autenticado',
        401
      )
    }

    const { id } = await params
    const orderId = parseInt(id)
    const userId = authResult.user.id

    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: 'ID do pedido inválido' },
        { status: 400 }
      )
    }

    // Rate limiting: 30 messages per minute per user per order
    const identifier = `chat:${userId}:${orderId}`
    const rateLimitResult = await chatRateLimiter.check(identifier, 30)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          message: 'Muitas mensagens. Aguarde um momento.',
          error: 'RATE_LIMIT_EXCEEDED',
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const parseResult = SendMessageSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { message: parseResult.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400, headers: createRateLimitHeaders(rateLimitResult) }
      )
    }

    const { content } = parseResult.data

    // Send message
    const result = await ChatService.sendMessage({
      orderId,
      authorId: userId,
      content,
    })

    if (!result.success) {
      const statusMap: Record<string, number> = {
        'ORDER_NOT_FOUND': 404,
        'USER_NOT_FOUND': 404,
        'CHAT_ACCESS_DENIED': 403,
        'CHAT_DISABLED': 400,
        'ENCRYPTION_ERROR': 500,
      }
      const status = result.code ? statusMap[result.code] || 500 : 500

      return NextResponse.json(
        { message: result.error, code: result.code },
        { status, headers: createRateLimitHeaders(rateLimitResult) }
      )
    }

    return NextResponse.json(
      { message: result.data },
      { status: 201, headers: createRateLimitHeaders(rateLimitResult) }
    )
  } catch (error) {
    return createApiErrorResponse(error, ErrorMessages.ORDER_CREATE_FAILED, 'POST /api/orders/[id]/chat')
  }
}
