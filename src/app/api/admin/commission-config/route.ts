import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'

// GET - Obter configuração de comissão ativa
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponseFromResult(authResult)
    }

    // Buscar configuração ativa
    let config = await prisma.commissionConfig.findFirst({
      where: { enabled: true },
    })

    // Se não houver configuração, criar uma padrão
    if (!config) {
      config = await prisma.commissionConfig.create({
        data: {
          boosterPercentage: 0.70,
          adminPercentage: 0.30,
          enabled: true,
        },
      })
    }

    return NextResponse.json({ config }, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar configuração de comissão:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar configuração de comissão' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar configuração de comissão
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponseFromResult(authResult)
    }

    const body = await request.json()
    const { boosterPercentage, adminPercentage } = body

    // Validar porcentagens
    if (
      boosterPercentage === undefined ||
      adminPercentage === undefined ||
      boosterPercentage < 0 ||
      boosterPercentage > 1 ||
      adminPercentage < 0 ||
      adminPercentage > 1
    ) {
      return NextResponse.json(
        { message: 'Porcentagens devem estar entre 0 e 1 (0% e 100%)' },
        { status: 400 }
      )
    }

    // Validar que a soma seja 1 (100%)
    const sum = boosterPercentage + adminPercentage
    if (Math.abs(sum - 1.0) > 0.01) {
      return NextResponse.json(
        { message: 'A soma das porcentagens deve ser 100%' },
        { status: 400 }
      )
    }

    // Desabilitar configurações antigas e criar nova
    const config = await prisma.$transaction(async (tx) => {
      // Desabilitar todas as configurações existentes
      await tx.commissionConfig.updateMany({
        where: { enabled: true },
        data: { enabled: false },
      })

      // Criar nova configuração ativa
      const newConfig = await tx.commissionConfig.create({
        data: {
          boosterPercentage,
          adminPercentage,
          enabled: true,
        },
      })

      return newConfig
    })

    return NextResponse.json(
      { message: 'Configuração de comissão atualizada com sucesso', config },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao atualizar configuração de comissão:', error)
    return NextResponse.json(
      { message: 'Erro ao atualizar configuração de comissão' },
      { status: 500 }
    )
  }
}

