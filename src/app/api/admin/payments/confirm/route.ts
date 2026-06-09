import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'
import { HttpStatus } from '@/lib/http-status'

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
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const orderIdNum = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId
    if (isNaN(orderIdNum)) {
      return NextResponse.json(
        { message: 'ID do pedido inválido' },
        { status: HttpStatus.BAD_REQUEST }
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
        { status: HttpStatus.NOT_FOUND }
      )
    }

    // Verificar se há pagamento confirmado
    const paidPayment = order.payments.find((p: { status: string }) => p.status === 'PAID')

    if (!paidPayment) {
      return NextResponse.json(
        { message: 'Nenhum pagamento confirmado encontrado para este pedido' },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Verificar se o pedido está concluído
    if (order.status !== 'COMPLETED') {
      return NextResponse.json(
        { message: 'O pedido precisa estar concluído para liberar os pagamentos' },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    // Using any due to Prisma custom output path type resolution issues
    await prisma.$transaction(async (tx: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
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
      const pendingRevenues = order.revenues.filter((r: { id: number; status: string }) => r.status === 'PENDING')
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
      { status: HttpStatus.OK }
    )
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error)
    return NextResponse.json(
      { message: 'Erro ao confirmar pagamento' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    )
  }
}
