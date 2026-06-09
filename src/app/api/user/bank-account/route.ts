import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withApiHandler } from '@/lib/api-handler'
import { ErrorMessages } from '@/lib/api-errors'
import { HttpStatus } from '@/lib/http-status'

// GET - Obter conta bancária do usuário (boosters e admins)
export const GET = withApiHandler(
  async ({ user }) => {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, pixKey: true },
    })

    if (!dbUser) {
      return NextResponse.json({ message: ErrorMessages.USER_NOT_FOUND }, { status: HttpStatus.NOT_FOUND })
    }

    return NextResponse.json({ pixKey: dbUser.pixKey }, { status: HttpStatus.OK })
  },
  { auth: { roles: ['BOOSTER', 'ADMIN'] }, errorMessage: 'Erro ao buscar conta bancária', endpoint: 'GET /api/user/bank-account' }
)

// PUT - Atualizar conta bancária do usuário (boosters e admins)
export const PUT = withApiHandler(
  async ({ request, user }) => {
    const { pixKey } = await request.json()

    if (!pixKey || pixKey.trim() === '') {
      return NextResponse.json({ message: 'Chave PIX é obrigatória' }, { status: HttpStatus.BAD_REQUEST })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { pixKey: pixKey.trim() },
      select: { id: true, pixKey: true },
    })

    return NextResponse.json(
      { message: 'Chave PIX atualizada com sucesso', pixKey: updatedUser.pixKey },
      { status: HttpStatus.OK }
    )
  },
  { auth: { roles: ['BOOSTER', 'ADMIN'] }, errorMessage: 'Erro ao atualizar conta bancária', endpoint: 'PUT /api/user/bank-account' }
)
