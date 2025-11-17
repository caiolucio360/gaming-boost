import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação via NextAuth
    const authResult = await verifyAuth(request)

    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(
        authResult.error || 'Não autenticado',
        401
      )
    }

    const userId = authResult.user.id

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { message: 'orderId é obrigatório' },
        { status: 400 }
      )
    }

    // Converter orderId para número
    const orderIdNum = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId
    if (isNaN(orderIdNum)) {
      return NextResponse.json(
        { message: 'ID do pedido inválido' },
        { status: 400 }
      )
    }

    // Buscar order
    const order = await prisma.order.findUnique({
      where: { id: orderIdNum },
      include: {
        service: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Solicitação não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se a order pertence ao usuário
    if (order.userId !== userId) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 403 }
      )
    }

    // Gerar código PIX (simulado - em produção, integrar com gateway de pagamento)
    const pixCode = generatePixCode(order.total)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
    const qrCodeBase64 = generateQRCodeBase64(pixCode)

    // Salvar informação de pagamento no banco
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        method: 'PIX',
        pixCode,
        qrCode: qrCodeBase64,
        status: 'PENDING',
        total: order.total,
        expiresAt,
      },
    })

    return NextResponse.json(
      {
        message: 'Código PIX gerado com sucesso',
        payment: {
          id: payment.id,
          orderId: order.id,
          total: order.total,
          pixCode,
          qrCode: `data:image/png;base64,${qrCodeBase64}`,
          expiresAt: expiresAt.toISOString(),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao gerar PIX:', error)
    return NextResponse.json(
      { message: 'Erro ao gerar código PIX' },
      { status: 500 }
    )
  }
}

function generatePixCode(total: number): string {
  // Formato simplificado de código PIX
  // Em produção, usar biblioteca adequada ou API de pagamento
  const payload = {
    key: '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865405' + total.toFixed(2) + '5802BR5925GAMING BOOST PRO LTDA6009SAO PAULO62070503***6304',
  }
  
  // Código PIX simplificado (em produção, gerar corretamente)
  return `00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865405${total.toFixed(2)}5802BR5925GAMING BOOST PRO LTDA6009SAO PAULO62070503***6304`
}

function generateQRCodeBase64(code: string): string {
  // Placeholder para QR Code
  // Em produção, usar biblioteca como qrcode para gerar o QR Code real
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
}

