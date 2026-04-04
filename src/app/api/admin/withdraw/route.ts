import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'
import { createWithdrawal, PixKeyType } from '@/lib/abacatepay'
import crypto from 'crypto'

// POST - Criar um novo saque (Admin)
export async function POST(request: NextRequest) {
    try {
        const authResult = await verifyAuth(request)

        if (!authResult.authenticated || !authResult.user) {
            return createAuthErrorResponse(
                authResult.error || 'Não autenticado',
                401
            )
        }

        // Verificar se é ADMIN
        if (authResult.user.role !== 'ADMIN') {
            return NextResponse.json(
                { message: 'Apenas admins podem solicitar saques' },
                { status: 403 }
            )
        }

        const userId = authResult.user.id
        const body = await request.json()
        const { amount, pixKeyType, pixKey, description } = body

        // Validações
        if (!amount || amount < 350) {
            return NextResponse.json(
                { message: 'Valor mínimo para saque é R$ 3,50' },
                { status: 400 }
            )
        }

        if (!pixKeyType || !pixKey) {
            return NextResponse.json(
                { message: 'Tipo de chave PIX e chave são obrigatórios' },
                { status: 400 }
            )
        }

        // Validar tipo de chave PIX
        const validPixKeyTypes: PixKeyType[] = ['CPF', 'CNPJ', 'PHONE', 'EMAIL', 'RANDOM', 'BR_CODE']
        if (!validPixKeyTypes.includes(pixKeyType)) {
            return NextResponse.json(
                { message: 'Tipo de chave PIX inválido' },
                { status: 400 }
            )
        }

        // Gerar ID externo único antes da transação
        const externalId = `withdraw-admin-${userId}-${crypto.randomUUID()}`

        // Atomicamente verificar saldo + criar registro provisional
        // Isto previne que duas requisições simultâneas passem na verificação de saldo
        let provisional: { id: number }
        try {
            provisional = await prisma.$transaction(async (tx: any) => {
                // Re-verificar saldo dentro da transação
                const agg = await tx.adminRevenue.aggregate({
                    where: { adminId: userId, status: 'PAID' },
                    _sum: { amount: true },
                })
                const available = Math.round((agg._sum.amount || 0) * 100)
                if (amount > available) {
                    const err: any = new Error('Saldo insuficiente')
                    err.code = 'INSUFFICIENT'
                    err.availableBalance = available
                    throw err
                }

                // Re-verificar saques pendentes dentro da transação
                const pending = await tx.withdrawal.findFirst({
                    where: { userId, status: { in: ['PENDING', 'PROCESSING'] } },
                })
                if (pending) {
                    const err: any = new Error('Você já tem um saque pendente. Aguarde a conclusão.')
                    err.code = 'PENDING_EXISTS'
                    throw err
                }

                // Criar registro provisional (sem providerId — será preenchido após AbacatePay)
                return tx.withdrawal.create({
                    data: {
                        userId,
                        externalId,
                        amount,
                        pixKeyType,
                        pixKey,
                        status: 'PENDING',
                        description: description || `Saque de receitas - Admin #${userId}`,
                    },
                })
            })
        } catch (err: any) {
            if (err.code === 'INSUFFICIENT') {
                return NextResponse.json(
                    { message: err.message, availableBalance: err.availableBalance, requestedAmount: amount },
                    { status: 400 }
                )
            }
            if (err.code === 'PENDING_EXISTS') {
                return NextResponse.json({ message: err.message }, { status: 400 })
            }
            throw err
        }

        // Chamar AbacatePay fora da transação (operação externa)
        try {
            const withdrawResult = await createWithdrawal({
                externalId,
                amount,
                pix: { type: pixKeyType as PixKeyType, key: pixKey },
                description: description || `Saque de receitas - Admin #${userId}`,
            })

            // Atualizar registro com dados do provedor
            const withdrawal = await prisma.withdrawal.update({
                where: { id: provisional.id },
                data: {
                    providerId: withdrawResult.id,
                    platformFee: withdrawResult.platformFee,
                    receiptUrl: withdrawResult.receiptUrl,
                },
            })

            return NextResponse.json({
                success: true,
                withdrawal,
                message: 'Saque solicitado com sucesso!'
            }, { status: 201 })
        } catch (error) {
            // AbacatePay falhou — remover registro provisional para não bloquear futuros saques
            await prisma.withdrawal.delete({ where: { id: provisional.id } }).catch(() => {})
            console.error('Erro ao criar saque:', error)
            return NextResponse.json(
                {
                    message: 'Erro ao processar saque',
                    error: error instanceof Error ? error.message : 'Erro desconhecido'
                },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error('Erro na rota de saque:', error)
        return NextResponse.json(
            { message: 'Erro ao processar solicitação' },
            { status: 500 }
        )
    }
}

// GET - Listar saques do admin
export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyAuth(request)

        if (!authResult.authenticated || !authResult.user) {
            return createAuthErrorResponse(
                authResult.error || 'Não autenticado',
                401
            )
        }

        // Verificar se é ADMIN
        if (authResult.user.role !== 'ADMIN') {
            return NextResponse.json(
                { message: 'Apenas admins podem ver seus saques' },
                { status: 403 }
            )
        }

        const userId = authResult.user.id

        // Buscar saques do admin
        const withdrawals = await prisma.withdrawal.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        })

        // Calcular estatísticas
        const stats = {
            totalWithdrawals: withdrawals.length,
            pendingWithdrawals: withdrawals.filter((w: any) => w.status === 'PENDING' || w.status === 'PROCESSING').length,
            completedWithdrawals: withdrawals.filter((w: any) => w.status === 'COMPLETE').length,
            totalWithdrawn: withdrawals
                .filter((w: any) => w.status === 'COMPLETE')
                .reduce((acc: any, w: any) => acc + w.amount, 0),
        }

        // Calcular saldo disponível (revenues marcadas como PAID estão disponíveis para saque)
        const paidRevenues = await prisma.adminRevenue.aggregate({
            where: {
                adminId: userId,
                status: 'PAID',
            },
            _sum: {
                amount: true,
            },
        })

        const availableBalance = (paidRevenues._sum.amount || 0) * 100 // Em centavos

        return NextResponse.json({
            withdrawals,
            stats,
            availableBalance,
        })
    } catch (error) {
        console.error('Erro ao listar saques:', error)
        return NextResponse.json(
            { message: 'Erro ao buscar saques' },
            { status: 500 }
        )
    }
}
