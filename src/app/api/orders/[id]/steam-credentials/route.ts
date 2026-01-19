import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth, createAuthErrorResponse } from '@/lib/auth-middleware'
import { ClientSteamCredentialsSchema } from '@/schemas/steam'
import { encryptCredentials, decryptCredentials, validateSteamProfileUrl, validateConsentGiven } from '@/services/steam.service'

interface RouteParams {
    params: Promise<{ id: string }>
}

/**
 * POST - Save Steam credentials for an order (client only)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await verifyAuth(request)

        if (!authResult.authenticated || !authResult.user) {
            return createAuthErrorResponse(authResult.error || 'Não autenticado', 401)
        }

        const { id } = await params
        const orderId = parseInt(id)

        if (isNaN(orderId)) {
            return NextResponse.json(
                { message: 'ID do pedido inválido' },
                { status: 400 }
            )
        }

        // Verify order exists and belongs to user
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                userId: true,
                steamCredentials: true,
            },
        })

        if (!order) {
            return NextResponse.json(
                { message: 'Pedido não encontrado' },
                { status: 404 }
            )
        }

        if (order.userId !== authResult.user.id) {
            return NextResponse.json(
                { message: 'Você não tem permissão para modificar este pedido' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const validation = ClientSteamCredentialsSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { message: 'Dados inválidos', errors: validation.error.format() },
                { status: 400 }
            )
        }

        const { steamProfileUrl, credentials, consent } = validation.data

        // Validate Steam profile URL
        const urlValidation = validateSteamProfileUrl(steamProfileUrl)
        if (!urlValidation.valid) {
            return NextResponse.json(
                { message: urlValidation.error },
                { status: 400 }
            )
        }

        // Validate consent
        const consentValidation = validateConsentGiven(consent)
        if (!consentValidation.valid) {
            return NextResponse.json(
                { message: consentValidation.error },
                { status: 400 }
            )
        }

        // Encrypt credentials
        const encryptedCredentials = encryptCredentials(credentials)

        // Update order with Steam credentials
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                steamCredentials: encryptedCredentials,
                steamProfileUrl,
                steamConsent: true,
                steamConsentAt: new Date(consent.timestamp),
            },
            select: {
                id: true,
                steamProfileUrl: true,
                steamConsent: true,
                steamConsentAt: true,
            },
        })

        return NextResponse.json({
            message: 'Credenciais Steam salvas com sucesso',
            order: updatedOrder,
        })
    } catch (error) {
        console.error('Erro ao salvar credenciais Steam:', error)
        return NextResponse.json(
            { message: 'Erro interno ao salvar credenciais' },
            { status: 500 }
        )
    }
}

/**
 * GET - Retrieve Steam credentials for an order (assigned booster only)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await verifyAuth(request)

        if (!authResult.authenticated || !authResult.user) {
            return createAuthErrorResponse(authResult.error || 'Não autenticado', 401)
        }

        const { id } = await params
        const orderId = parseInt(id)

        if (isNaN(orderId)) {
            return NextResponse.json(
                { message: 'ID do pedido inválido' },
                { status: 400 }
            )
        }

        // Verify order exists
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                userId: true,
                boosterId: true,
                steamCredentials: true,
                steamProfileUrl: true,
                steamConsent: true,
            },
        })

        if (!order) {
            return NextResponse.json(
                { message: 'Pedido não encontrado' },
                { status: 404 }
            )
        }

        // Only assigned booster or admin can view credentials
        const isBooster = order.boosterId === authResult.user.id
        const isAdmin = authResult.user.role === 'ADMIN'

        if (!isBooster && !isAdmin) {
            return NextResponse.json(
                { message: 'Você não tem permissão para visualizar estas credenciais' },
                { status: 403 }
            )
        }

        if (!order.steamCredentials) {
            return NextResponse.json(
                { message: 'Credenciais Steam não fornecidas pelo cliente' },
                { status: 404 }
            )
        }

        if (!order.steamConsent) {
            return NextResponse.json(
                { message: 'Cliente não consentiu o compartilhamento de credenciais' },
                { status: 403 }
            )
        }

        // Decrypt credentials
        const credentials = decryptCredentials(order.steamCredentials)

        return NextResponse.json({
            steamProfileUrl: order.steamProfileUrl,
            credentials,
        })
    } catch (error) {
        console.error('Erro ao buscar credenciais Steam:', error)
        return NextResponse.json(
            { message: 'Erro interno ao buscar credenciais' },
            { status: 500 }
        )
    }
}
