import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'
import { WithdrawalService, mapWithdrawalCreateError } from '@/services'
import { HttpStatus } from '@/lib/http-status'

// POST - Criar um novo saque (Admin)
export const POST = withApiHandler(
  async ({ request, user }) => {
    const { amount, pixKeyType, pixKey, description } = await request.json()

    const result = await WithdrawalService.create({
      userId: user.id,
      source: 'ADMIN',
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
  { auth: { roles: ['ADMIN'] }, errorMessage: 'Erro ao processar solicitação', endpoint: 'POST /api/admin/withdraw' }
)

// GET - Listar saques do admin
export const GET = withApiHandler(
  async ({ user }) => {
    const data = await WithdrawalService.getAdminWithdrawals(user.id)
    return NextResponse.json(data, { status: HttpStatus.OK })
  },
  { auth: { roles: ['ADMIN'] }, errorMessage: 'Erro ao buscar saques', endpoint: 'GET /api/admin/withdraw' }
)
