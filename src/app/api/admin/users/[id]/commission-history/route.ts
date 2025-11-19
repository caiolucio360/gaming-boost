import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'

// GET - Buscar histórico de mudanças de comissão de um booster
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdmin(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponseFromResult(authResult)
    }

    const { id } = await params

    // Converter id para número
    const userId = parseInt(id, 10)
    if (isNaN(userId)) {
      return NextResponse.json(
        { message: 'ID do usuário inválido' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe e é um booster
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    if (user.role !== 'BOOSTER') {
      return NextResponse.json(
        { message: 'Este usuário não é um booster' },
        { status: 400 }
      )
    }

    // Buscar histórico de mudanças
    const history = await prisma.boosterCommissionHistory.findMany({
      where: { boosterId: userId },
      include: {
        changedByUser: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ history }, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar histórico de comissão:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar histórico de comissão' },
      { status: 500 }
    )
  }
}

