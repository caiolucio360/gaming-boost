import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'

// POST - Confirmar pagamento de um pedido e liberar comissões/receitas
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponseFromResult(authResult)
    }

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { message: 'orderId é obrigatório' },
        { status: 400 }
      )
    }

    const orderIdNum = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId
    if (isNaN(orderIdNum)) {
      return NextResponse.json(
        { message: 'ID do pedido inválido' },
        { status: 400 }
      )
    }

    // Buscar pedido e pagamento
    const order = await prisma.order.findUnique({
      where: { id: orderIdNum },
      include: {
        payments: true,
        commission: true,
        revenues: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se há pagamento confirmado
    const paidPayment = order.payments.find((p: any) => p.status === 'PAID')

    if (!paidPayment) {
      return NextResponse.json(
        { message: 'Nenhum pagamento confirmado encontrado para este pedido' },
        { status: 400 }
      )
    }

    // Verificar se o pedido está concluído
    if (order.status !== 'COMPLETED') {
      return NextResponse.json(
        { message: 'O pedido precisa estar concluído para liberar os pagamentos' },
        { status: 400 }
      )
    }

    // Using any due to Prisma custom output path type resolution issues
    const result = await prisma.$transaction(async (tx: any) => {
      // Atualizar comissão do booster se existir e estiver pendente
      if (order.commission && order.commission.status === 'PENDING') {
        await tx.boosterCommission.update({
          where: { id: order.commission.id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        })
      }

      // Atualizar receitas dos admins se existirem e estiverem pendentes
      const pendingRevenues = order.revenues.filter((r: any) => r.status === 'PENDING')
      for (const revenue of pendingRevenues) {
        await tx.adminRevenue.update({
          where: { id: revenue.id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        })
      }

      return { success: true }
    })

    return NextResponse.json(
      {
        message: 'Pagamentos liberados com sucesso',
        orderId: orderIdNum,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error)
    return NextResponse.json(
      { message: 'Erro ao confirmar pagamento' },
      { status: 500 }
    )
  }
}
