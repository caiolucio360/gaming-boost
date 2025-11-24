import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'
import { createAbacatePayCharge } from '@/lib/abacatepay'

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

    // Verificar se já existe pagamento
    const existingPayment = order.payments.find(
      (p) => p.status === 'PENDING' || p.status === 'PAID'
    )

    if (existingPayment) {
      return NextResponse.json({ payment: existingPayment }, { status: 200 })
    }

    // Verificar API Key
    if (!process.env.ABACATEPAY_API_KEY) {
      console.error('ABACATEPAY_API_KEY não configurada')
      return NextResponse.json(
        { message: 'Erro de configuração no servidor (API Key ausente)' },
        { status: 500 }
      )
    }

    // Gerar cobrança no AbacatePay
    try {
      console.log('========== CREATING PIX PAYMENT ==========')
      console.log('Order ID:', order.id)
      console.log('Order Total:', order.total)
      console.log('Amount in cents:', Math.round(order.total * 100))
      console.log('Customer Phone:', phone)
      console.log('Customer CPF:', taxId.substring(0, 3) + '...' + taxId.substring(taxId.length - 2))
      console.log('===========================================')

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const returnUrl = `${baseUrl}/dashboard`

      const charge = await createAbacatePayCharge({
        amount: order.total * 100, // Converter para centavos
        description: `Pedido #${order.id} - ${order.service.name}`,
        customer: {
          name: order.user.name || 'Cliente',
          email: order.user.email,
          taxId: taxId,           // Use CPF provided in request
          cellphone: phone,       // Use phone provided in request
        },
        returnUrl: returnUrl,
        completionUrl: returnUrl,
      })

      console.log('========== CHARGE CREATED SUCCESSFULLY ==========')
      console.log('Billing ID:', charge.id)
      console.log('Payment URL:', charge.url)
      console.log('Full Charge Data:', JSON.stringify(charge, null, 2))

      // NOTA: O SDK da AbacatePay retorna um objeto IBilling que não inclui dados do PIX diretamente
      // Para obter o QR Code PIX, você precisa usar o pixQrCode.create() separadamente
      // Por enquanto, vamos armazenar a URL de pagamento
      const paymentUrl = charge.url
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos

      // Salvar informação de pagamento no banco (SEM salvar phone/taxId)
      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          method: 'PIX',
          providerId: charge.id,
          pixCode: paymentUrl, // Armazenar URL de pagamento ao invés do código PIX diretamente
          qrCode: paymentUrl, // URL do QR Code
          status: 'PENDING',
          total: order.total,
          expiresAt,
        },
      })

      return NextResponse.json({ payment }, { status: 201 })
    } catch (error) {
      console.error('Erro ao gerar cobrança AbacatePay:', error)

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
