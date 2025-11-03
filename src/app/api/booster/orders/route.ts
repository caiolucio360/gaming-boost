import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

// GET - Listar pedidos disponíveis e atribuídos ao booster
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { message: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se é booster
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user || user.role !== 'BOOSTER') {
      return NextResponse.json(
        { message: 'Acesso negado. Apenas boosters.' },
        { status: 403 }
      )
    }

    // Buscar parâmetros de query
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'available' | 'assigned' | 'completed'
    const status = searchParams.get('status')

    let where: any = {}

    if (type === 'available') {
      // Pedidos disponíveis: PENDING e sem booster atribuído
      where = {
        status: 'PENDING',
        boosterId: null,
      }
    } else if (type === 'assigned') {
      // Pedidos atribuídos ao booster
      where = {
        boosterId: userId,
        status: 'IN_PROGRESS',
      }
    } else if (type === 'completed') {
      // Pedidos completos do booster
      where = {
        boosterId: userId,
        status: 'COMPLETED',
      }
    } else {
      // Todos os pedidos relacionados ao booster
      where = {
        OR: [
          { boosterId: userId }, // Pedidos atribuídos
          { status: 'PENDING', boosterId: null }, // Pedidos disponíveis
        ],
      }
    }

    if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      where.status = status
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        service: true,
        booster: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calcular estatísticas
    const stats = {
      available: await prisma.order.count({
        where: {
          status: 'PENDING',
          boosterId: null,
          service: {
            game: 'CS2',
          },
        },
      }),
      assigned: await prisma.order.count({
        where: {
          boosterId: userId,
          status: 'IN_PROGRESS',
          service: {
            game: 'CS2',
          },
        },
      }),
      completed: await prisma.order.count({
        where: {
          boosterId: userId,
          status: 'COMPLETED',
          service: {
            game: 'CS2',
          },
        },
      }),
      totalEarnings: await prisma.order.aggregate({
        where: {
          boosterId: userId,
          status: 'COMPLETED',
          service: {
            game: 'CS2',
          },
        },
        _sum: {
          total: true,
        },
      }),
    }

    return NextResponse.json(
      { orders, stats },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao buscar pedidos do booster:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar pedidos' },
      { status: 500 }
    )
  }
}

