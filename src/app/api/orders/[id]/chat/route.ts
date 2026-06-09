import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, createRateLimitHeaders } from '@/lib/rate-limit'
import { withApiHandler, parseIntParam } from '@/lib/api-handler'
import { ErrorMessages } from '@/lib/api-errors'
import { getStatusForError } from '@/lib/error-constants'
import { ChatService } from '@/services'
import { SendMessageSchema, SendCredentialsSchema, ChatQuerySchema } from '@/schemas'
import { HttpStatus } from '@/lib/http-status'
import { RateLimits } from '@/lib/rate-limit-config'

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
  return withApiHandler(
    async ({ user }) => {
      const { id } = await params
      const orderId = parseIntParam(id)

      if (orderId === null) {
        return NextResponse.json(
          { message: 'ID do pedido inválido' },
          { status: HttpStatus.BAD_REQUEST }
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
        userId: user.id,
        limit,
        before,
      })

      if (!result.success) {
        const status = result.code ? getStatusForError(result.code) : HttpStatus.INTERNAL_SERVER_ERROR
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
    },
    {
      auth: true,
      errorMessage: ErrorMessages.ORDER_FETCH_FAILED,
      endpoint: 'GET /api/orders/[id]/chat',
    }
  )(request)
}

/**
 * POST /api/orders/[id]/chat - Send a message in the order chat
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withApiHandler(
    async ({ user }) => {
      const { id } = await params
      const orderId = parseIntParam(id)

      if (orderId === null) {
        return NextResponse.json(
          { message: 'ID do pedido inválido' },
          { status: HttpStatus.BAD_REQUEST }
        )
      }

      // Rate limiting: 30 messages per minute per user per order
      const identifier = `chat:${user.id}:${orderId}`
      const rateLimitResult = await chatRateLimiter.check(identifier, RateLimits.CHAT_MESSAGE)

      if (!rateLimitResult.success) {
        return NextResponse.json(
          {
            message: 'Muitas mensagens. Aguarde um momento.',
            error: 'RATE_LIMIT_EXCEEDED',
          },
          {
            status: HttpStatus.TOO_MANY_REQUESTS,
            headers: createRateLimitHeaders(rateLimitResult),
          }
        )
      }

      // Parse and validate request body
      const body = await request.json()

      // Route to appropriate handler based on messageType
      if (body?.messageType === 'STEAM_CREDENTIALS') {
        const parseResult = SendCredentialsSchema.safeParse(body)
        if (!parseResult.success) {
          return NextResponse.json(
            { message: parseResult.error.issues[0]?.message || 'Dados inválidos' },
            { status: HttpStatus.BAD_REQUEST, headers: createRateLimitHeaders(rateLimitResult) }
          )
        }

        const { credentials } = parseResult.data
        const result = await ChatService.sendMessage({
          orderId,
          authorId: user.id,
          messageType: 'STEAM_CREDENTIALS',
          credentials,
        })

        if (!result.success) {
          const status = result.code ? getStatusForError(result.code) : HttpStatus.INTERNAL_SERVER_ERROR
          return NextResponse.json(
            { message: result.error, code: result.code },
            { status, headers: createRateLimitHeaders(rateLimitResult) }
          )
        }

        return NextResponse.json(
          { message: result.data },
          { status: HttpStatus.CREATED, headers: createRateLimitHeaders(rateLimitResult) }
        )
      }

      const parseResult = SendMessageSchema.safeParse(body)

      if (!parseResult.success) {
        return NextResponse.json(
          { message: parseResult.error.issues[0]?.message || 'Dados inválidos' },
          { status: HttpStatus.BAD_REQUEST, headers: createRateLimitHeaders(rateLimitResult) }
        )
      }

      const { content } = parseResult.data

      // Send message
      const result = await ChatService.sendMessage({
        orderId,
        authorId: user.id,
        content,
      })

      if (!result.success) {
        const status = result.code ? getStatusForError(result.code) : HttpStatus.INTERNAL_SERVER_ERROR
        return NextResponse.json(
          { message: result.error, code: result.code },
          { status, headers: createRateLimitHeaders(rateLimitResult) }
        )
      }

      return NextResponse.json(
        { message: result.data },
        { status: HttpStatus.CREATED, headers: createRateLimitHeaders(rateLimitResult) }
      )
    },
    {
      auth: true,
      errorMessage: ErrorMessages.ORDER_CREATE_FAILED,
      endpoint: 'POST /api/orders/[id]/chat',
    }
  )(request)
}
