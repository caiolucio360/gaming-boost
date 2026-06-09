import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'
import { WithdrawalService, mapWithdrawalCreateError } from '@/services'
import { HttpStatus } from '@/lib/http-status'

// POST - Criar um novo saque (Booster)
export const POST = withApiHandler(
  async ({ request, user }) => {
    const { amount, pixKeyType, pixKey, description } = await request.json()

    const result = await WithdrawalService.create({
      userId: user.id,
      source: 'BOOSTER',
      amount,
      pixKeyType,
      pixKey,
      description,
    })

    if (!result.ok) {
      const { status, body } = mapWithdrawalCreateError(result, amount)
      return NextResponse.json(body, { status })
    }

    return NextResponse.json(
      { success: true, withdrawal: result.withdrawal, message: 'Saque solicitado com sucesso!' },
      { status: HttpStatus.CREATED }
    )
  },
  { auth: { roles: ['BOOSTER'] }, errorMessage: 'Erro ao processar solicitação', endpoint: 'POST /api/booster/withdraw' }
)

// GET - Listar saques do booster
export const GET = withApiHandler(
  async ({ user }) => {
    const data = await WithdrawalService.getBoosterWithdrawals(user.id)
    return NextResponse.json(data, { status: HttpStatus.OK })
  },
  { auth: { roles: ['BOOSTER'] }, errorMessage: 'Erro ao buscar saques', endpoint: 'GET /api/booster/withdraw' }
)
