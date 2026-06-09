import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { PaymentProvider } from '@/generated/prisma/client'
import { verifyAuth, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'
import { createAsaasPixCharge } from '@/lib/asaas'
import { createAbacatePixCharge } from '@/lib/abacatepay'
import { CreatePixSchema } from '@/schemas/payment'
import { validateBody } from '@/lib/validate'
import { paymentRateLimiter, getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit'
import { createApiErrorResponse, ErrorMessages } from '@/lib/api-errors'
import { ErrorCodes } from '@/lib/error-constants'
import { HttpStatus } from '@/lib/http-status'
import { RateLimits } from '@/lib/rate-limit-config'

/**
 * GET /api/payment/pix?orderId=123
 *
 * Returns the order's currently active PIX charge (status PENDING and not yet
 * expired), so the payment page can reopen it on refresh/return instead of
 * generating a new one through the provider. Expired pending charges are
 * marked EXPIRED and treated as "no active payment". Returns { payment: null }
 * when there's nothing to reopen.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)

    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponseFromResult(authResult)
    }

    const userId = authResult.user.id
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ message: 'orderId é obrigatório' }, { status: HttpStatus.BAD_REQUEST })
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { payments: true },
    })

    if (!order) {
      return NextResponse.json({ message: ErrorMessages.ORDER_NOT_FOUND }, { status: HttpStatus.NOT_FOUND })
    }

    if (order.userId !== userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: HttpStatus.FORBIDDEN })
    }

    // Already paid — surface it so the page can confirm instead of re-charging
    const paidPayment = order.payments.find((p: { status: string }) => p.status === 'PAID')
    if (paidPayment) {
      return NextResponse.json({ payment: paidPayment }, { status: HttpStatus.OK })
    }

    const now = new Date()
    const activePayment = order.payments.find(
      (p: { status: string; expiresAt: Date | null }) =>
        p.status === 'PENDING' && p.expiresAt !== null && new Date(p.expiresAt) > now
    )

    if (activePayment) {
      return NextResponse.json({ payment: activePayment }, { status: HttpStatus.OK })
    }

    // Clean up any stale pending charge so the UI shows the form to regenerate
    const stalePending = order.payments.filter(
      (p: { status: string; expiresAt: Date | null }) =>
        p.status === 'PENDING' && (p.expiresAt === null || new Date(p.expiresAt) <= now)
    )
    if (stalePending.length > 0) {
      await prisma.payment.updateMany({
        where: { id: { in: stalePending.map((p: { id: number }) => p.id) } },
        data: { status: 'EXPIRED' },
      })
    }

    return NextResponse.json({ payment: null }, { status: HttpStatus.OK })
  } catch (error) {
    return createApiErrorResponse(error, ErrorMessages.PAYMENT_PIX_FAILED, 'GET /api/payment/pix')
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 PIX generation attempts per minute per IP (strict)
    const identifier = getIdentifier(request)
    const rateLimitResult = await paymentRateLimiter.check(identifier, RateLimits.PAYMENT_PIX)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          message: 'Muitas tentativas de pagamento. Aguarde um momento.',
          error: ErrorCodes.RATE_LIMIT_EXCEEDED
        },
        {
          status: HttpStatus.TOO_MANY_REQUESTS,
          headers: createRateLimitHeaders(rateLimitResult)
        }
      )
    }

    const authResult = await verifyAuth(request)

    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponseFromResult(authResult)
    }

    const userId = authResult.user.id
    const body = await request.json()

    // Validate with Zod schema
    const validation = validateBody(CreatePixSchema, body)

    if (!validation.success) {
      const missingFields = {
        orderId: !body.orderId,
        phone: !body.phone,
        taxId: !body.taxId,
      }

      if (missingFields.orderId) {
        return NextResponse.json(
          { message: 'orderId é obrigatório' },
          { status: HttpStatus.BAD_REQUEST }
        )
      }

      if (missingFields.phone || missingFields.taxId) {
        return NextResponse.json(
          {
            message: 'Dados incompletos para pagamento',
            error: 'Para realizar pagamentos via PIX, informe seu telefone e CPF.',
            missingFields
          },
          { status: HttpStatus.BAD_REQUEST }
        )
      }

      return NextResponse.json(
        { message: 'Dados inválidos', errors: validation.errors },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const { orderId, phone, taxId, provider } = validation.data
    const selectedProvider = provider || process.env.ACTIVE_PAYMENT_PROVIDER || 'ASAAS'

    // Valor mínimo de cobrança PIX exigido por cada gateway (em R$).
    // O gateway rejeita valores abaixo disso, então validamos aqui para
    // devolver uma mensagem clara em vez de um 500 vindo do provider.
    const MIN_PIX_AMOUNT: Record<string, number> = {
      ASAAS: 5,
      ABACATEPAY: 1,
    }

    // Buscar pedido
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        user: true,
        payments: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { message: ErrorMessages.ORDER_NOT_FOUND },
        { status: HttpStatus.NOT_FOUND }
      )
    }

    if (order.userId !== userId) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: HttpStatus.FORBIDDEN }
      )
    }

    // Verificar se já existe pagamento pendente válido
    const existingPayment = order.payments.find(
      (p: { status: string; expiresAt: Date | null }) => p.status === 'PENDING' && p.expiresAt && new Date(p.expiresAt) > new Date()
    )

    if (existingPayment) {
      return NextResponse.json({
        payment: existingPayment,
        message: 'Pagamento PIX já existente'
      }, { status: HttpStatus.OK })
    }

    // Verificar se já existe pagamento pago
    const paidPayment = order.payments.find((p: { status: string }) => p.status === 'PAID')
    if (paidPayment) {
      return NextResponse.json(
        { message: 'Este pedido já foi pago', payment: paidPayment },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Validar valor mínimo exigido pelo gateway antes de tentar gerar a cobrança
    const minAmount = MIN_PIX_AMOUNT[selectedProvider] ?? 5
    if (order.total < minAmount) {
      const formatBRL = (v: number) =>
        v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      return NextResponse.json(
        {
          message: `O valor mínimo para pagamento via PIX é ${formatBRL(minAmount)}. O total deste pedido é ${formatBRL(order.total)}.`,
        },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Gerar PIX QR Code no provider selecionado
    try {
      console.log(`========== CREATING ${selectedProvider} PIX QR CODE PAYMENT ==========`)
      console.log('Order ID:', order.id)
      console.log('Order Total:', order.total)
      console.log('Amount:', order.total)
      console.log('Customer CPF:', taxId.substring(0, 3) + '...' + taxId.substring(taxId.length - 2))
      console.log('Customer Phone:', phone)
      console.log('========================================================')

      let pixData: { id: string, payload?: string, encodedImage?: string, status: string, expirationDate?: string | Date }

      if (selectedProvider === 'ABACATEPAY') {
        const abacateResponse = await createAbacatePixCharge({
          amount: order.total,
          description: `Pedido #${order.id}`,
          customer: {
            name: order.user.name || 'Cliente',
            email: order.user.email,
            taxId: taxId,
            cellphone: phone,
          },
          externalReference: order.id.toString()
        })
        pixData = {
          id: abacateResponse.data.id,
          payload: undefined, // AbacatePay SDK response might not return payload directly here depending on struct
          encodedImage: undefined, // Or needs fetching later
          status: abacateResponse.data.status,
          expirationDate: undefined
        }
      } else {
        const asaasResponse = await createAsaasPixCharge({
          amount: order.total,
          description: `Pedido #${order.id}`,
          customer: {
            name: order.user.name || 'Cliente',
            email: order.user.email,
            cpfCnpj: taxId,
            phone: phone,
          },
          externalReference: order.id.toString()
        })
        pixData = {
          id: asaasResponse.id,
          payload: asaasResponse.payload,
          encodedImage: asaasResponse.encodedImage,
          status: asaasResponse.status,
          expirationDate: asaasResponse.expirationDate
        }
      }

      console.log('========== PIX QR CODE CREATED SUCCESSFULLY ==========')
      console.log('PIX ID:', pixData.id)
      console.log('Status:', pixData.status)
      console.log('Provider:', selectedProvider)
      console.log('======================================================')

      // Salvar informação de pagamento no banco
      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: selectedProvider as PaymentProvider,
          providerId: pixData.id,
          pixCode: pixData.payload,
          qrCode: pixData.encodedImage,
          status: 'PENDING',
          total: order.total,
          expiresAt: pixData.expirationDate ? new Date(pixData.expirationDate) : undefined,
        },
      })

      return NextResponse.json(
        {
          payment,
          message: 'PIX gerado com sucesso'
        },
        {
          status: HttpStatus.CREATED,
          headers: createRateLimitHeaders(rateLimitResult)
        }
      )
    } catch (error) {
      // Detalhe técnico fica só no log do servidor — nunca vai pro cliente
      console.error('Erro ao gerar PIX QR Code:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }

      return NextResponse.json(
        {
          message: ErrorMessages.PAYMENT_PIX_FAILED,
          error: ErrorCodes.PAYMENT_PROVIDER_ERROR,
        },
        { status: HttpStatus.BAD_GATEWAY }
      )
    }
  } catch (error) {
    return createApiErrorResponse(error, ErrorMessages.PAYMENT_PIX_FAILED, 'POST /api/payment/pix')
  }
}
