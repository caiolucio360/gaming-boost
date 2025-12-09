/**
 * User Service
 * Contains business logic for user management
 */

import { prisma } from '@/lib/db'
import type { UpdateProfileInput } from '@/schemas/auth'

type UserResult<T> =
    | { success: true; user: T }
    | { success: false; error: string }

type UserRole = 'USER' | 'BOOSTER' | 'ADMIN'

/**
 * UserService handles all user-related business logic
 */
export const UserService = {
    /**
     * Valid user roles
     */
    validRoles: ['USER', 'BOOSTER', 'ADMIN'] as const,

    /**
     * Check if role promotion is allowed
     */
    canPromoteRole(from: UserRole, to: UserRole): boolean {
        if (from === 'USER' && to === 'BOOSTER') return true
        if (from === 'BOOSTER' && to === 'ADMIN') return true
        if (from === 'USER' && to === 'ADMIN') return true
        return false
    },

    /**
     * Normalize phone number (remove formatting)
     */
    normalizePhone(phone: string): string {
        return phone.replace(/\D/g, '')
    },

    /**
     * Get user by ID
     */
    async getUserById(userId: number) {
        return prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                pixKey: true,
                createdAt: true,
            },
        })
    },

    /**
     * Get user by email
     */
    async getUserByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        })
    },

    /**
     * Update user profile
     */
    async updateProfile(
        userId: number,
        input: UpdateProfileInput
    ): Promise<UserResult<unknown>> {
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!existingUser) {
            return { success: false, error: 'Usuário não encontrado' }
        }

        const updateData: Record<string, unknown> = {}

        if (input.name) {
            updateData.name = input.name.trim()
        }

        if (input.phone) {
            updateData.phone = this.normalizePhone(input.phone)
        }

        if (input.pixKey !== undefined) {
            updateData.pixKey = input.pixKey
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                pixKey: true,
            },
        })

        return { success: true, user }
    },

    /**
     * Update user role
     */
    async updateRole(
        userId: number,
        newRole: UserRole
    ): Promise<UserResult<unknown>> {
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!existingUser) {
            return { success: false, error: 'Usuário não encontrado' }
        }

        if (!this.canPromoteRole(existingUser.role as UserRole, newRole)) {
            return {
                success: false,
                error: `Promoção de ${existingUser.role} para ${newRole} não permitida`
            }
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { role: newRole as unknown as never },
        })

        return { success: true, user }
    },

    /**
     * Check if user can apply to be a booster
     */
    canApplyAsBooster(currentRole: string): boolean {
        return currentRole === 'USER'
    },
}
