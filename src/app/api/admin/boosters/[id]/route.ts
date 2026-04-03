/**
 * PATCH /api/admin/boosters/[id]
 * Approve or reject a booster application
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAdmin, createAuthErrorResponseFromResult } from '@/lib/auth-middleware'
import { z } from 'zod'

const updateSchema = z.object({
    status: z.enum(['VERIFIED', 'REJECTED']),
    reason: z.string().optional(),
})

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await verifyAdmin(request)

        if (!authResult.authenticated || !authResult.user) {
            return createAuthErrorResponseFromResult(authResult)
        }

        const { id } = await params
        const profileId = parseInt(id)

        if (isNaN(profileId)) {
            return NextResponse.json(
                { message: 'ID inválido' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const validation = updateSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { message: 'Dados inválidos', errors: validation.error.format() },
                { status: 400 }
            )
        }

        const { status, reason } = validation.data

        // Find the application
        const profile = await prisma.boosterProfile.findUnique({
            where: { id: profileId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true },
                },
            },
        })

        if (!profile) {
            return NextResponse.json(
                { message: 'Aplicação não encontrada' },
                { status: 404 }
            )
        }

        // Update the profile status
        const updatedProfile = await prisma.boosterProfile.update({
            where: { id: profileId },
            data: { verificationStatus: status },
        })

        // If approved, change user role to BOOSTER
        if (status === 'VERIFIED') {
            await prisma.user.update({
                where: { id: profile.userId },
                data: { role: 'BOOSTER' },
            })
        }

        // Create notification for the user
        const notificationMessage = status === 'VERIFIED'
            ? '🎉 Parabéns! Sua aplicação para booster foi aprovada. Você agora pode aceitar pedidos!'
            : `❌ Sua aplicação para booster foi rejeitada.${reason ? ` Motivo: ${reason}` : ''}`

        await prisma.notification.create({
            data: {
                userId: profile.userId,
                type: 'SYSTEM',
                title: status === 'VERIFIED' ? 'Aplicação Aprovada!' : 'Aplicação Rejeitada',
                message: notificationMessage,
                read: false,
            },
        })

        return NextResponse.json({
            message: status === 'VERIFIED' ? 'Booster aprovado com sucesso' : 'Aplicação rejeitada',
            profile: updatedProfile,
            userRoleUpdated: status === 'VERIFIED',
        })
    } catch (error) {
        console.error('Error updating booster application:', error)
        return NextResponse.json(
            { message: 'Erro ao atualizar aplicação' },
            { status: 500 }
        )
    }
}
