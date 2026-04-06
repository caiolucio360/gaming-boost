/**
 * @jest-environment node
 */
import bcrypt from 'bcryptjs'

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    order: {
      count: jest.fn(),
    },
  },
}))

jest.mock('@/services/verification.service', () => ({
  VerificationService: {
    generateCode: jest.fn().mockResolvedValue({ success: true, data: '123456' }),
  },
}))

jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
}))

import { prisma } from '@/lib/db'
import { AuthService } from '@/services/auth.service'
import { ErrorCodes, ErrorMessages } from '@/lib/error-constants'

const mockFindUnique = prisma.user.findUnique as jest.Mock
const mockCreate = prisma.user.create as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

// ============================================================================
// AuthService.registerUser
// ============================================================================

describe('AuthService.registerUser', () => {
  const validInput = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  }

  it('returns failure when email already exists', async () => {
    mockFindUnique.mockResolvedValue({
      id: 1,
      name: 'Existing User',
      email: 'test@example.com',
      role: 'CLIENT',
      active: true,
    })

    const result = await AuthService.registerUser(validInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe(ErrorMessages.AUTH_EMAIL_ALREADY_EXISTS)
      expect(result.code).toBe(ErrorCodes.VALIDATION_ERROR)
    }
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('creates user with hashed password and returns safe user object without password', async () => {
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue({
      id: 42,
      name: 'Test User',
      email: 'test@example.com',
      role: 'CLIENT',
      active: false,
    })

    const result = await AuthService.registerUser(validInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe(42)
      expect(result.data.name).toBe('Test User')
      expect(result.data.email).toBe('test@example.com')
      expect(result.data.role).toBe('CLIENT')
      // Password must NOT be present in the returned object
      expect((result.data as Record<string, unknown>).password).toBeUndefined()
    }

    // Verify bcrypt was used — the stored password must differ from the plain text
    const createCall = mockCreate.mock.calls[0][0]
    expect(createCall.data.password).not.toBe(validInput.password)
    const isHashed = await bcrypt.compare(validInput.password, createCall.data.password)
    expect(isHashed).toBe(true)
  })

  it('returns failure on database error', async () => {
    mockFindUnique.mockRejectedValue(new Error('DB connection failed'))

    const result = await AuthService.registerUser(validInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe(ErrorCodes.DATABASE_ERROR)
    }
  })
})

// ============================================================================
// AuthService.validateCredentials
// ============================================================================

describe('AuthService.validateCredentials', () => {
  const validInput = {
    email: 'user@example.com',
    password: 'correct-password',
  }

  it('returns failure when user is not found', async () => {
    mockFindUnique.mockResolvedValue(null)

    const result = await AuthService.validateCredentials(validInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe(ErrorMessages.AUTH_CREDENTIALS_INVALID)
      expect(result.code).toBe(ErrorCodes.UNAUTHORIZED)
    }
  })

  it('returns failure when password is wrong', async () => {
    const hashedPassword = await bcrypt.hash('correct-password', 10)
    mockFindUnique.mockResolvedValue({
      id: 1,
      name: 'User',
      email: 'user@example.com',
      password: hashedPassword,
      role: 'CLIENT',
      active: true,
    })

    const result = await AuthService.validateCredentials({
      email: 'user@example.com',
      password: 'wrong-password',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe(ErrorMessages.AUTH_CREDENTIALS_INVALID)
      expect(result.code).toBe(ErrorCodes.UNAUTHORIZED)
    }
  })

  it('returns failure when account is not active', async () => {
    const hashedPassword = await bcrypt.hash('correct-password', 10)
    mockFindUnique.mockResolvedValue({
      id: 1,
      name: 'Inactive User',
      email: 'user@example.com',
      password: hashedPassword,
      role: 'CLIENT',
      active: false,
    })

    const result = await AuthService.validateCredentials(validInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe(ErrorMessages.AUTH_NOT_VERIFIED)
      expect(result.code).toBe(ErrorCodes.USER_NOT_VERIFIED)
    }
  })

  it('returns authenticated user on valid credentials', async () => {
    const hashedPassword = await bcrypt.hash('correct-password', 10)
    mockFindUnique.mockResolvedValue({
      id: 7,
      name: 'Active User',
      email: 'user@example.com',
      password: hashedPassword,
      role: 'CLIENT',
      active: true,
    })

    const result = await AuthService.validateCredentials(validInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe(7)
      expect(result.data.name).toBe('Active User')
      expect(result.data.email).toBe('user@example.com')
      expect(result.data.role).toBe('CLIENT')
      expect(result.data.active).toBe(true)
      // Password must NOT be present
      expect((result.data as Record<string, unknown>).password).toBeUndefined()
    }
  })

  it('returns failure on database error', async () => {
    mockFindUnique.mockRejectedValue(new Error('DB timeout'))

    const result = await AuthService.validateCredentials(validInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe(ErrorCodes.DATABASE_ERROR)
    }
  })
})
