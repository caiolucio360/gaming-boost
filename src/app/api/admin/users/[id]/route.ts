import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'
import bcrypt from 'bcryptjs'

// GET - Buscar usuário específico
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        boosterCommissionPercentage: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { orders: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar usuário' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdmin(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponseFromResult(authResult)
    }

    const { id } = await params
    const body = await request.json()
    const { name, email, role, password, boosterCommissionPercentage } = body

    // Converter id para número
    const userId = parseInt(id, 10)
    if (isNaN(userId)) {
      return NextResponse.json(
        { message: 'ID do usuário inválido' },
        { status: 400 }
      )
    }

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (email !== undefined) {
      // Verificar se email já existe em outro usuário
      const emailExists = await prisma.user.findUnique({
        where: { email },
      })
      if (emailExists && emailExists.id !== userId) {
        return NextResponse.json(
          { message: 'Email já está em uso' },
          { status: 400 }
        )
      }
      updateData.email = email
    }
    if (role !== undefined && ['CLIENT', 'BOOSTER', 'ADMIN'].includes(role)) {
      updateData.role = role
    }
    if (password !== undefined && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10)
    }
    
    // Permitir atualizar comissão do booster (apenas para usuários com role BOOSTER)
    if (boosterCommissionPercentage !== undefined) {
      // Validar se é um número entre 0 e 1
      const percentage = parseFloat(boosterCommissionPercentage)
      if (isNaN(percentage) || percentage < 0 || percentage > 1) {
        return NextResponse.json(
          { message: 'Porcentagem de comissão deve ser um número entre 0 e 1 (ex: 0.75 para 75%)' },
          { status: 400 }
        )
      }
      
      // Verificar se o usuário é um booster
      if (existingUser.role !== 'BOOSTER') {
        return NextResponse.json(
          { message: 'Apenas boosters podem ter comissão personalizada' },
          { status: 400 }
        )
      }
      
      const previousPercentage = existingUser.boosterCommissionPercentage
      
      // Registrar histórico se a comissão mudou
      // Comparar valores numéricos para evitar problemas de comparação
      const hasChanged = previousPercentage === null || previousPercentage === undefined 
        ? true 
        : Math.abs(previousPercentage - percentage) > 0.0001
      
      if (hasChanged) {
        const { reason } = body
        await prisma.boosterCommissionHistory.create({
          data: {
            boosterId: userId,
            previousPercentage: previousPercentage ?? null,
            newPercentage: percentage,
            changedBy: authResult.user.id,
            reason: reason || null,
          },
        })
      }
      
      updateData.boosterCommissionPercentage = percentage
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        boosterCommissionPercentage: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(
      { message: 'Usuário atualizado com sucesso', user: updatedUser },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json(
      { message: 'Erro ao atualizar usuário' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar usuário
export async function DELETE(
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

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Não permitir deletar o próprio admin
    const currentUserId = authResult.user.id
    if (currentUserId === userId) {
      return NextResponse.json(
        { message: 'Não é possível deletar seu próprio usuário' },
        { status: 400 }
      )
    }

    // Deletar usuário (pedidos serão deletados em cascade se configurado)
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json(
      { message: 'Usuário deletado com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json(
      { message: 'Erro ao deletar usuário' },
      { status: 500 }
    )
  }
}

