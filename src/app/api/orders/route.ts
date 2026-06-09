import { NextResponse } from 'next/server'
import { apiRateLimiter, createRateLimitHeaders } from '@/lib/rate-limit'
import { withApiHandler } from '@/lib/api-handler'
import { ErrorMessages } from '@/lib/api-errors'
import { getStatusForError } from '@/lib/error-constants'
import { HttpStatus } from '@/lib/http-status'
import { RateLimits } from '@/lib/rate-limit-config'
import { OrderService } from '@/services'
import { z } from 'zod'

// Schema for order creation
const CreateOrderSchema = z.object({
  game: z.enum(['CS2']).default('CS2'),
  serviceType: z.enum(['RANK_BOOST', 'DUO_BOOST', 'COACHING']).default('RANK_BOOST'),
  total: z.number().positive().or(z.string().transform(Number).pipe(z.number().positive())),
  currentRank: z.string().optional(),
  targetRank: z.string().optional(),
  currentRating: z.number().or(z.string().transform(Number)).optional(),
  targetRating: z.number().or(z.string().transform(Number)).optional(),
  gameMode: z.string().optional(),
  gameType: z.string().optional(),
  metadata: z.string().or(z.record(z.string(), z.unknown()).transform(obj => JSON.stringify(obj))).optional(),
})

export const GET = withApiHandler(
  async ({ user }) => {
    // Use OrderService to get user's CS2 orders
    const result = await OrderService.getUserCS2Orders(user.id)

    if (!result.success) {
      return NextResponse.json(
        { message: result.error },
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
      )
    }

    return NextResponse.json({ orders: result.data }, { status: HttpStatus.OK })
  },
  {
    auth: true,
    errorMessage: ErrorMessages.ORDER_FETCH_FAILED,
    endpoint: 'GET /api/orders',
  }
)

export const POST = withApiHandler(
  async ({ request, user, rateLimitResult }) => {
    const body = await request.json()

    // Validate with Zod
    const parseResult = CreateOrderSchema.safeParse(body)

    if (!parseResult.success) {
      if (!body.total) {
        return NextResponse.json(
          { message: 'total é obrigatório' },
          { status: HttpStatus.BAD_REQUEST }
        )
      }
      return NextResponse.json(
        { message: ErrorMessages.INVALID_DATA },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const data = parseResult.data

    // Use OrderService to create order
    const result = await OrderService.createOrder({
      userId: user.id,
      game: data.game,
      serviceType: data.serviceType,
      total: typeof data.total === 'number' ? data.total : parseFloat(String(data.total)),
      currentRank: data.currentRank,
      targetRank: data.targetRank,
      currentRating: data.currentRating,
      targetRating: data.targetRating,
      gameMode: data.gameMode,
      gameType: data.gameType,
      metadata: data.metadata,
    })

    if (!result.success) {
      // Map error codes to appropriate HTTP status
      const status = result.code ? getStatusForError(result.code) : HttpStatus.INTERNAL_SERVER_ERROR

      return NextResponse.json(
        { message: result.error, code: result.code },
        { status, headers: rateLimitResult ? createRateLimitHeaders(rateLimitResult) : undefined }
      )
    }

    return NextResponse.json(
      {
        message: 'Solicitação criada com sucesso',
        order: result.data,
      },
      {
        status: HttpStatus.CREATED,
        headers: rateLimitResult ? createRateLimitHeaders(rateLimitResult) : undefined,
      }
    )
  },
  {
    auth: true,
    rateLimit: { limiter: apiRateLimiter, max: RateLimits.ORDER_CREATE },
    rateLimitMessage: ErrorMessages.RATE_LIMIT_GENERIC,
    errorMessage: ErrorMessages.ORDER_CREATE_FAILED,
    endpoint: 'POST /api/orders',
  }
)
