import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withApiHandler } from '@/lib/api-handler'
import { HttpStatus } from '@/lib/http-status'

export const GET = withApiHandler(
  async ({ user }) => {
    // Buscar dados completos do usuário no banco
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        active: true,
        createdAt: true,
        currentDiscountPct: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: HttpStatus.NOT_FOUND }
      )
    }

    // Verificar se o usuário está ativo
    if (!dbUser.active) {
      return NextResponse.json(
        { message: 'Conta desativada' },
        { status: HttpStatus.FORBIDDEN }
      )
    }

    return NextResponse.json({ user: dbUser }, { status: HttpStatus.OK })
  },
  {
    auth: true,
    errorMessage: 'Erro ao verificar sessão',
    endpoint: 'GET /api/auth/me',
  }
)
