import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'
import { apiRateLimiter, getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit'
import { createApiErrorResponse, ErrorMessages } from '@/lib/api-errors'
import { OrderService } from '@/services'
import { z } from 'zod'

// Schema for order creation
const CreateOrderSchema = z.object({
  game: z.enum(['CS2']).default('CS2'),
  total: z.number().or(z.string().transform(Number)),
  currentRank: z.string().optional(),
  targetRank: z.string().optional(),
  currentRating: z.number().or(z.string().transform(Number)).optional(),
  targetRating: z.number().or(z.string().transform(Number)).optional(),
  gameMode: z.string().optional(),
  gameType: z.string().optional(),
  metadata: z.string().or(z.record(z.string(), z.unknown()).transform(obj => JSON.stringify(obj))).optional(),
  steamCredentials: z.string().optional(),
  steamProfileUrl: z.string().optional(),
  steamConsent: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)

    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Não autenticado',
        401
      )
    }

    const userId = authResult.user.id

    // Use OrderService to get user's CS2 orders
    const result = await OrderService.getUserCS2Orders(userId)

    if (!result.success) {
      return NextResponse.json(
        { message: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ orders: result.data }, { status: 200 })
  } catch (error) {
    return createApiErrorResponse(error, ErrorMessages.ORDER_FETCH_FAILED, 'GET /api/orders')
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 order creation attempts per minute per IP
    const identifier = getIdentifier(request)
    const rateLimitResult = await apiRateLimiter.check(identifier, 10)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          message: 'Muitas tentativas. Aguarde um momento e tente novamente.',
          error: 'RATE_LIMIT_EXCEEDED'
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult)
        }
      )
    }

    // Verify authentication
    const authResult = await verifyAuth(request)

    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Não autenticado',
        401
      )
    }

    const userId = authResult.user.id
    const body = await request.json()

    // Validate with Zod
    const parseResult = CreateOrderSchema.safeParse(body)

    if (!parseResult.success) {
      if (!body.total) {
        return NextResponse.json(
          { message: 'total é obrigatório' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { message: 'Dados inválidos' },
        { status: 400 }
      )
    }

    const data = parseResult.data

    // Use OrderService to create order
    const result = await OrderService.createOrder({
      userId,
      game: data.game,
      total: typeof data.total === 'number' ? data.total : parseFloat(String(data.total)),
      currentRank: data.currentRank,
      targetRank: data.targetRank,
      currentRating: data.currentRating,
      targetRating: data.targetRating,
      gameMode: data.gameMode,
      gameType: data.gameType,
      metadata: data.metadata,
      steamCredentials: data.steamCredentials,
      steamProfileUrl: data.steamProfileUrl,
      steamConsent: data.steamConsent,
    })

    if (!result.success) {
      // Map error codes to appropriate HTTP status
      const statusMap: Record<string, number> = {
        'DUPLICATE_ORDER': 400,
        'VALIDATION_ERROR': 400,
      }
      const status = result.code ? statusMap[result.code] || 500 : 500

      return NextResponse.json(
        { message: result.error, code: result.code },
        { status, headers: createRateLimitHeaders(rateLimitResult) }
      )
    }

    return NextResponse.json(
      {
        message: 'Solicitação criada com sucesso',
        order: result.data,
      },
      {
        status: 201,
        headers: createRateLimitHeaders(rateLimitResult)
      }
    )
  } catch (error) {
    return createApiErrorResponse(error, ErrorMessages.ORDER_CREATE_FAILED, 'POST /api/orders')
  }
}
