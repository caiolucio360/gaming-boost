import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'
import { createPixQrCode } from '@/lib/abacatepay'

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)

    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Não autenticado',
        401
      )
    }

    const userId = authResult.user.id
    const body = await request.json()
    const { orderId, phone, taxId } = body

    if (!orderId) {
      return NextResponse.json(
        { message: 'orderId é obrigatório' },
        { status: 400 }
      )
    }

    // Validar dados de pagamento fornecidos
    if (!phone || !taxId) {
      return NextResponse.json(
        {
          message: 'Dados incompletos para pagamento',
          error: 'Para realizar pagamentos via PIX, informe seu telefone e CPF.',
          missingFields: {
            phone: !phone,
            taxId: !taxId,
          }
        },
        { status: 400 }
      )
    }

    // Buscar pedido
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        user: true,
        service: true,
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
      (p) => p.status === 'PENDING' && p.expiresAt && new Date(p.expiresAt) > new Date()
    )

    if (existingPayment) {
      // Retornar pagamento existente com QR Code
      return NextResponse.json({
        payment: existingPayment,
        message: 'Pagamento PIX já existente'
      }, { status: 200 })
    }

    // Verificar se já existe pagamento pago
    const paidPayment = order.payments.find((p) => p.status === 'PAID')
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
      console.log('Customer Phone:', phone)
      console.log('Customer CPF:', taxId.substring(0, 3) + '...' + taxId.substring(taxId.length - 2))
      console.log('=================================================')

      const pixData = await createPixQrCode({
        amount: Math.round(order.total * 100), // Converter para centavos
        description: `Pedido #${order.id} - ${order.service.name}`,
        expiresIn: 1800, // 30 minutos
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
          pixCode: pixData.brCode,       // Código copia-e-cola
          qrCode: pixData.brCodeBase64,  // Imagem do QR Code em base64
          status: 'PENDING',
          total: order.total,
          expiresAt: new Date(pixData.expiresAt),
        },
      })

      return NextResponse.json({
        payment,
        message: 'PIX gerado com sucesso'
      }, { status: 201 })
    } catch (error) {
      console.error('Erro ao gerar PIX QR Code:', error)

      // Log detalhado do erro
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
    console.error('Erro na rota PIX:', error)
    return NextResponse.json(
      { message: 'Erro ao processar pagamento' },
      { status: 500 }
    )
  }
}

