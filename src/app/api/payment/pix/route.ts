import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'
import { createPixQrCode } from '@/lib/abacatepay'
import { CreatePixSchema } from '@/schemas/payment'
import { validateBody } from '@/lib/validate'
import { paymentRateLimiter, getIdentifier, createRateLimitHeaders } from '@/lib/rate-limit'
import { createApiErrorResponse, ErrorMessages } from '@/lib/api-errors'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 PIX generation attempts per minute per IP (strict)
    const identifier = getIdentifier(request)
    const rateLimitResult = await paymentRateLimiter.check(identifier, 5)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          message: 'Muitas tentativas de pagamento. Aguarde um momento.',
          error: 'RATE_LIMIT_EXCEEDED'
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult)
        }
      )
    }

    const authResult = await verifyAuth(request)

    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Não autenticado',
        401
      )
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
          { status: 400 }
        )
      }

      if (missingFields.phone || missingFields.taxId) {
        return NextResponse.json(
          {
            message: 'Dados incompletos para pagamento',
            error: 'Para realizar pagamentos via PIX, informe seu telefone e CPF.',
            missingFields
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { message: 'Dados inválidos', errors: validation.errors },
        { status: 400 }
      )
    }

    const { orderId, phone, taxId } = validation.data

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
        { message: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    if (order.userId !== userId) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 403 }
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
      }, { status: 200 })
    }

    // Verificar se já existe pagamento pago
    const paidPayment = order.payments.find((p: { status: string }) => p.status === 'PAID')
    if (paidPayment) {
      return NextResponse.json(
        { message: 'Este pedido já foi pago', payment: paidPayment },
        { status: 400 }
      )
    }

    // Verificar API Key
    if (!process.env.ABACATEPAY_API_KEY) {
      console.error('ABACATEPAY_API_KEY não configurada')
      return NextResponse.json(
        { message: 'Erro de configuração no servidor (API Key ausente)' },
        { status: 500 }
      )
    }

    // Gerar PIX QR Code no AbacatePay
    try {
      console.log('========== CREATING PIX QR CODE PAYMENT ==========')
      console.log('Order ID:', order.id)
      console.log('Order Total:', order.total)
      console.log('Amount in cents:', Math.round(order.total * 100))
      console.log('Customer CPF:', taxId.substring(0, 3) + '...' + taxId.substring(taxId.length - 2))
      console.log('Customer Phone:', phone)
      console.log('=================================================')

      const pixData = await createPixQrCode({
        amount: Math.round(order.total * 100),
        description: `Pedido #${order.id} - ${order.serviceName || 'Boost'}`,
        expiresIn: 1800,
        customer: {
          name: order.user.name || 'Cliente',
          email: order.user.email,
          taxId: taxId,
          cellphone: phone,
        },
        metadata: {
          orderId: order.id.toString(),
        }
      })

      console.log('========== PIX QR CODE CREATED SUCCESSFULLY ==========')
      console.log('PIX ID:', pixData.id)
      console.log('Status:', pixData.status)
      console.log('BrCode length:', pixData.brCode?.length)
      console.log('Has QR Image:', !!pixData.brCodeBase64)
      console.log('Expires At:', pixData.expiresAt)
      console.log('======================================================')

      // Salvar informação de pagamento no banco
      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          method: 'PIX',
          providerId: pixData.id,
          pixCode: pixData.brCode,
          qrCode: pixData.brCodeBase64,
          status: 'PENDING',
          total: order.total,
          expiresAt: new Date(pixData.expiresAt),
        },
      })

      return NextResponse.json(
        {
          payment,
          message: 'PIX gerado com sucesso'
        },
        {
          status: 201,
          headers: createRateLimitHeaders(rateLimitResult)
        }
      )
    } catch (error) {
      console.error('Erro ao gerar PIX QR Code:', error)

      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }

      return NextResponse.json(
        {
          message: 'Erro ao gerar código PIX',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    return createApiErrorResponse(error, ErrorMessages.PAYMENT_PIX_FAILED, 'POST /api/payment/pix')
  }
}
