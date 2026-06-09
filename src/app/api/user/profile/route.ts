import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@/generated/prisma/client'
import { withApiHandler } from '@/lib/api-handler'
import { createApiErrorResponse, ErrorMessages } from '@/lib/api-errors'
import { HttpStatus } from '@/lib/http-status'
import bcrypt from 'bcryptjs'

// GET - Buscar perfil do usuário autenticado
export const GET = withApiHandler(
  async ({ user }) => {
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
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            boosterOrders: true,
          },
        },
      },
    })

    if (!dbUser) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: HttpStatus.NOT_FOUND }
      )
    }

    return NextResponse.json({ user: dbUser }, { status: HttpStatus.OK })
  },
  {
    auth: true,
    errorMessage: ErrorMessages.GENERIC_ERROR,
    endpoint: 'GET /api/user/profile',
  }
)

// PUT - Atualizar perfil do usuário autenticado
export const PUT = withApiHandler(
  async ({ request, user }) => {
    const body = await request.json()
    const { name, phone, currentPassword, newPassword } = body

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: HttpStatus.NOT_FOUND }
      )
    }

    // Preparar dados para atualização
    const updateData: Prisma.UserUpdateInput = {}

    if (name !== undefined && name.trim() !== '') {
      updateData.name = name.trim()
    }

    if (phone !== undefined) {
      updateData.phone = phone && phone.trim() !== '' ? phone.trim() : null
    }

    // Se forneceu senha nova, precisa fornecer a atual
    if (newPassword !== undefined && newPassword.trim() !== '') {
      if (!currentPassword) {
        return NextResponse.json(
          { message: 'Senha atual é obrigatória para alterar a senha' },
          { status: HttpStatus.BAD_REQUEST }
        )
      }

      // Verificar senha atual
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        existingUser.password
      )

      if (!isPasswordValid) {
        return NextResponse.json(
          { message: 'Senha atual incorreta' },
          { status: HttpStatus.BAD_REQUEST }
        )
      }

      // Validar nova senha
      if (newPassword.length < 8) {
        return NextResponse.json(
          { message: 'A nova senha deve ter no mínimo 8 caracteres' },
          { status: HttpStatus.BAD_REQUEST }
        )
      }

      updateData.password = await bcrypt.hash(newPassword, 10)
    }

    // Se não há nada para atualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'Nenhum dado para atualizar' },
        { status: HttpStatus.BAD_REQUEST }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(
      { message: 'Perfil atualizado com sucesso', user: updatedUser },
      { status: HttpStatus.OK }
    )
  },
  {
    auth: true,
    errorMessage: ErrorMessages.GENERIC_ERROR,
    endpoint: 'PUT /api/user/profile',
  }
)
