/**
 * User Service
 * Contains business logic for user management
 *
 * Uses Result<T> pattern for consistent error handling
 */

import { prisma } from '@/lib/db'
import { Role } from '@/generated/prisma/client'
import type { UpdateProfileInput } from '@/schemas/auth'
import { Result, success, failure } from './types'

// ============================================================================
// Types
// ============================================================================

interface UserProfile {
  id: number
  name: string | null
  email: string
  role: string
  phone: string | null
  pixKey: string | null
  createdAt?: Date
}

// ============================================================================
// UserService
// ============================================================================

/**
 * UserService handles all user-related business logic
 */
export const UserService = {
  /**
   * Valid user roles
   */
  validRoles: ['CLIENT', 'BOOSTER', 'ADMIN'] as const,

  /**
   * Check if role promotion is allowed
   */
  canPromoteRole(from: Role, to: Role): boolean {
    if (from === Role.CLIENT && to === Role.BOOSTER) return true
    if (from === Role.BOOSTER && to === Role.ADMIN) return true
    if (from === Role.CLIENT && to === Role.ADMIN) return true
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
  async getUserById(userId: number): Promise<Result<UserProfile | null>> {
    try {
      const user = await prisma.user.findUnique({
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

      if (!user) {
        return success(null)
      }

      return success(user)
    } catch (error) {
      console.error('Error getting user by ID:', error)
      return failure('Erro ao buscar usuário', 'DATABASE_ERROR')
    }
  },

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<Result<UserProfile | null>> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          pixKey: true,
        },
      })

      if (!user) {
        return success(null)
      }

      return success(user)
    } catch (error) {
      console.error('Error getting user by email:', error)
      return failure('Erro ao buscar usuário', 'DATABASE_ERROR')
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(
    userId: number,
    input: UpdateProfileInput
  ): Promise<Result<UserProfile>> {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!existingUser) {
        return failure('Usuário não encontrado', 'USER_NOT_FOUND')
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

      return success(user)
    } catch (error) {
      console.error('Error updating profile:', error)
      return failure('Erro ao atualizar perfil', 'DATABASE_ERROR')
    }
  },

  /**
   * Update user role
   */
  async updateRole(
    userId: number,
    newRole: Role
  ): Promise<Result<UserProfile>> {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!existingUser) {
        return failure('Usuário não encontrado', 'USER_NOT_FOUND')
      }

      if (!this.canPromoteRole(existingUser.role, newRole)) {
        return failure(
          `Promoção de ${existingUser.role} para ${newRole} não permitida`,
          'FORBIDDEN'
        )
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          pixKey: true,
        },
      })

      return success(user)
    } catch (error) {
      console.error('Error updating role:', error)
      return failure('Erro ao atualizar role', 'DATABASE_ERROR')
    }
  },

  /**
   * Activate or deactivate user
   */
  async setUserActive(userId: number, active: boolean): Promise<Result<boolean>> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { active },
      })

      return success(true)
    } catch (error) {
      console.error('Error updating user active status:', error)
      return failure('Erro ao atualizar status do usuário', 'DATABASE_ERROR')
    }
  },

  /**
   * Check if user can apply to be a booster
   */
  canApplyAsBooster(currentRole: Role): boolean {
    return currentRole === Role.CLIENT
  },

  /**
   * Get all users with pagination (admin only)
   */
  async getAllUsers(page: number = 1, limit: number = 20): Promise<Result<{ users: UserProfile[]; total: number }>> {
    try {
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            pixKey: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.user.count(),
      ])

      return success({ users, total })
    } catch (error) {
      console.error('Error getting all users:', error)
      return failure('Erro ao buscar usuários', 'DATABASE_ERROR')
    }
  },
}
