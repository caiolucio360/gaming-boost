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

        // Calcular saldo disponível do admin
        const pendingRevenues = await prisma.adminRevenue.aggregate({
            where: {
                adminId: userId,
                status: 'PENDING',
            },
            _sum: {
                amount: true,
            },
        })

        const availableBalance = pendingRevenues._sum.amount || 0

        // Converter valor para centavos
        const amountInCents = Math.round(amount)

        if (amountInCents > availableBalance * 100) {
            return NextResponse.json(
                {
                    message: 'Saldo insuficiente',
                    availableBalance: availableBalance,
                    requestedAmount: amount / 100
                },
                { status: 400 }
            )
        }

        // Verificar se há saques pendentes
        const pendingWithdrawal = await prisma.withdrawal.findFirst({
            where: {
                userId,
                status: { in: ['PENDING', 'PROCESSING'] }
            }
        })

        if (pendingWithdrawal) {
            return NextResponse.json(
                { message: 'Você já tem um saque pendente. Aguarde a conclusão.' },
                { status: 400 }
            )
        }

        try {
            // Gerar ID externo único
            const externalId = `withdraw-admin-${userId}-${crypto.randomUUID()}`

            // Criar saque no AbacatePay
            const withdrawResult = await createWithdrawal({
                externalId,
                amount: amountInCents,
                pix: {
                    type: pixKeyType as PixKeyType,
                    key: pixKey,
                },
                description: description || `Saque de receitas - Admin #${userId}`,
            })

            // Salvar saque no banco
            const withdrawal = await prisma.withdrawal.create({
                data: {
                    userId,
                    providerId: withdrawResult.id,
                    externalId,
                    amount: amountInCents,
                    platformFee: withdrawResult.platformFee,
                    pixKeyType,
                    pixKey,
                    status: 'PENDING',
                    receiptUrl: withdrawResult.receiptUrl,
                    description: description || `Saque de receitas - Admin #${userId}`,
                },
            })

            return NextResponse.json({
                success: true,
                withdrawal,
                message: 'Saque solicitado com sucesso!'
            }, { status: 201 })
        } catch (error) {
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

        // Calcular saldo disponível
        const pendingRevenues = await prisma.adminRevenue.aggregate({
            where: {
                adminId: userId,
                status: 'PENDING',
            },
            _sum: {
                amount: true,
            },
        })

        const availableBalance = (pendingRevenues._sum.amount || 0) * 100 // Em centavos

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
