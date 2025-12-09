/**
 * Authentication Service
 * Contains business logic for user authentication
 */

import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import type { RegisterInput, LoginInput } from '@/schemas/auth'

type ServiceResult<T> =
    | { success: true; user: T }
    | { success: false; error: string }

type SafeUser = {
    id: number
    name: string
    email: string
    role: string
    active?: boolean
}

/**
 * AuthService handles all authentication-related business logic
 * Separating this from API routes makes the code more testable and reusable
 */
export const AuthService = {
    /**
     * Register a new user
     * @param input - Validated registration data
     * @returns ServiceResult with user data or error message
     */
    async registerUser(input: RegisterInput): Promise<ServiceResult<SafeUser>> {
        const { name, email, password } = input

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return { success: false, error: 'Email já cadastrado' }
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

        return {
            success: true,
            user: {
                id: user.id,
                name: user.name || '',
                email: user.email || '',
                role: user.role,
            },
        }
    },

    /**
     * Validate user credentials for login
     * @param input - Validated login data
     * @returns ServiceResult with user data (including active status) or error message
     */
    async validateCredentials(input: LoginInput): Promise<ServiceResult<SafeUser & { active: boolean }>> {
        const { email, password } = input

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            return { success: false, error: 'Credenciais inválidas' }
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password || '')

        if (!isPasswordValid) {
            return { success: false, error: 'Credenciais inválidas' }
        }

        return {
            success: true,
            user: {
                id: user.id,
                name: user.name || '',
                email: user.email || '',
                role: user.role,
                active: user.active,
            },
        }
    },

    /**
     * Get user by ID
     * @param userId - The user ID (number)
     * @returns User data or null if not found
     */
    async getUserById(userId: number): Promise<SafeUser | null> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        })

        if (!user) return null

        return {
            id: user.id,
            name: user.name || '',
            email: user.email || '',
            role: user.role,
        }
    },
}

