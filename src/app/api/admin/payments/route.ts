import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'

// GET - Listar receitas do admin
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponseFromResult(authResult)
    }

    const adminId = authResult.user.id

    // Buscar parâmetros de query
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // PENDING, PAID, CANCELLED

    const where: any = {
      adminId,
    }

    if (status && ['PENDING', 'PAID', 'CANCELLED'].includes(status)) {
      where.status = status
    }

    // Buscar receitas
    const revenues = await prisma.adminRevenue.findMany({
      where,
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
                game: true,
              },
            },
            booster: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calcular estatísticas
    const stats = {
      totalRevenue: await prisma.adminRevenue.aggregate({
        where: {
          adminId,
          status: 'PAID',
        },
        _sum: {
          amount: true,
        },
      }),
      pendingRevenue: await prisma.adminRevenue.aggregate({
        where: {
          adminId,
          status: 'PENDING',
        },
        _sum: {
          amount: true,
        },
      }),
      totalRevenues: await prisma.adminRevenue.count({
        where: {
          adminId,
        },
      }),
      paidRevenues: await prisma.adminRevenue.count({
        where: {
          adminId,
          status: 'PAID',
        },
      }),
      pendingRevenues: await prisma.adminRevenue.count({
        where: {
          adminId,
          status: 'PENDING',
        },
      }),
    }

    return NextResponse.json(
      {
        revenues,
        stats: {
          totalRevenue: stats.totalRevenue._sum.amount || 0,
          pendingRevenue: stats.pendingRevenue._sum.amount || 0,
          totalRevenues: stats.totalRevenues,
          paidRevenues: stats.paidRevenues,
          pendingRevenues: stats.pendingRevenues,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao buscar receitas do admin:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar receitas' },
      { status: 500 }
    )
  }
}

