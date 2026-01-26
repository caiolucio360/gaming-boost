/**
 * Authentication Service
 * Contains business logic for user authentication
 *
 * Uses Result<T> pattern for consistent error handling
 */

import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import type { RegisterInput, LoginInput } from '@/schemas/auth'
import { sendWelcomeEmail } from '@/lib/email'
import { Result, success, failure } from './types'

// ============================================================================
// Types
// ============================================================================

interface SafeUser {
  id: number
  name: string
  email: string
  role: string
  active?: boolean
}

interface AuthenticatedUser extends SafeUser {
  active: boolean
}

// ============================================================================
// AuthService
// ============================================================================

/**
 * AuthService handles all authentication-related business logic
 * Separating this from API routes makes the code more testable and reusable
 */
export const AuthService = {
  /**
   * Register a new user
   */
  async registerUser(input: RegisterInput): Promise<Result<SafeUser>> {
    const { name, email, password } = input

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return failure('Email já cadastrado', 'VALIDATION_ERROR')
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      })

      // Send welcome email (don't await - send in background)
      sendWelcomeEmail(user.email, user.name || 'Usuário', user.role)
        .then((sent) => {
          if (sent) {
            console.log(`✅ Welcome email sent to ${user.email}`)
          } else {
            console.error(`❌ Failed to send welcome email to ${user.email}`)
          }
        })
        .catch((error) => {
          console.error(`❌ Error sending welcome email to ${user.email}:`, error)
        })

      return success({
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        role: user.role,
      })
    } catch (error) {
      console.error('Error registering user:', error)
      return failure('Erro ao criar usuário', 'DATABASE_ERROR')
    }
  },

  /**
   * Validate user credentials for login
   */
  async validateCredentials(input: LoginInput): Promise<Result<AuthenticatedUser>> {
    const { email, password } = input

    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        return failure('Credenciais inválidas', 'UNAUTHORIZED')
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password || '')

      if (!isPasswordValid) {
        return failure('Credenciais inválidas', 'UNAUTHORIZED')
      }

      return success({
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        role: user.role,
        active: user.active,
      })
    } catch (error) {
      console.error('Error validating credentials:', error)
      return failure('Erro ao validar credenciais', 'DATABASE_ERROR')
    }
  },

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<Result<SafeUser | null>> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      })

      if (!user) {
        return success(null)
      }

      return success({
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        role: user.role,
      })
    } catch (error) {
      console.error('Error getting user by ID:', error)
      return failure('Erro ao buscar usuário', 'DATABASE_ERROR')
    }
  },

  /**
   * Get user by email (for password reset, etc.)
   */
  async getUserByEmail(email: string): Promise<Result<SafeUser | null>> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      })

      if (!user) {
        return success(null)
      }

      return success({
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        role: user.role,
      })
    } catch (error) {
      console.error('Error getting user by email:', error)
      return failure('Erro ao buscar usuário', 'DATABASE_ERROR')
    }
  },

  /**
   * Update user password (for password reset)
   */
  async updatePassword(userId: number, newPassword: string): Promise<Result<boolean>> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      })

      return success(true)
    } catch (error) {
      console.error('Error updating password:', error)
      return failure('Erro ao atualizar senha', 'DATABASE_ERROR')
    }
  },
}
