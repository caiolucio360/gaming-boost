import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'
import { createApiErrorResponse } from '@/lib/api-errors'

// GET - Fetch active commission config
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponseFromResult(authResult)
    }

    const config = await prisma.commissionConfig.findFirst({
      where: { enabled: true },
    })

    if (!config) {
      return NextResponse.json(
        { message: 'Configuração de comissão não encontrada. Execute o seed.' },
        { status: 404 }
      )
    }

    // Always derive adminPercentage — never trust the stored value
    const enriched = {
      ...config,
      adminPercentage: 1 - config.boosterPercentage,
    }

    return NextResponse.json({ config: enriched }, { status: 200 })
  } catch (error) {
    return createApiErrorResponse(error, 'Erro ao buscar configuração de comissão', 'GET /api/admin/commission-config')
  }
}

// PUT - Update commission config
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request)
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponseFromResult(authResult)
    }

    const body = await request.json()
    const { boosterPercentage, devAdminPercentage, withdrawalWaitingDays } = body

    if (boosterPercentage === undefined || devAdminPercentage === undefined) {
      return NextResponse.json(
        { message: 'boosterPercentage e devAdminPercentage são obrigatórios' },
        { status: 400 }
      )
    }

    if (boosterPercentage < 0 || boosterPercentage > 1) {
      return NextResponse.json(
        { message: 'boosterPercentage deve estar entre 0 e 1' },
        { status: 400 }
      )
    }

    if (devAdminPercentage < 0 || devAdminPercentage > 1) {
      return NextResponse.json(
        { message: 'devAdminPercentage deve estar entre 0 e 1' },
        { status: 400 }
      )
    }

    if (withdrawalWaitingDays !== undefined &&
        (!Number.isInteger(withdrawalWaitingDays) || withdrawalWaitingDays < 0)) {
      return NextResponse.json(
        { message: 'withdrawalWaitingDays deve ser um inteiro não negativo' },
        { status: 400 }
      )
    }

    // adminPercentage stored as 1 - boosterPercentage for DB compatibility
    const adminPercentage = 1 - boosterPercentage

    const config = await prisma.$transaction(async (tx: any) => {
      await tx.commissionConfig.updateMany({
        where: { enabled: true },
        data: { enabled: false },
      })

      return tx.commissionConfig.create({
        data: {
          boosterPercentage,
          adminPercentage,
          devAdminPercentage,
          ...(withdrawalWaitingDays !== undefined && { withdrawalWaitingDays }),
          enabled: true,
        },
      })
    })

    return NextResponse.json(
      {
        message: 'Configuração atualizada com sucesso',
        config: { ...config, adminPercentage: 1 - config.boosterPercentage },
      },
      { status: 200 }
    )
  } catch (error) {
    return createApiErrorResponse(error, 'Erro ao atualizar configuração de comissão', 'PUT /api/admin/commission-config')
  }
}
