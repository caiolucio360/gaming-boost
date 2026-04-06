/**
 * @jest-environment node
 */

jest.mock('@/lib/db', () => ({
  prisma: {
    verificationCode: {
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  },
}))
jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}))

import { prisma } from '@/lib/db'
import { VerificationService } from '@/services/verification.service'

const prismaMock = prisma as jest.Mocked<typeof prisma>

// ---------------------------------------------------------------------------
// generateCode
// ---------------------------------------------------------------------------

describe('VerificationService.generateCode', () => {
  beforeEach(() => jest.clearAllMocks())

  it('creates a verification code record and returns success', async () => {
    ;(prismaMock.verificationCode.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(prismaMock.verificationCode.create as jest.Mock).mockResolvedValue({ id: 1, code: '654321' })

    const result = await VerificationService.generateCode(1, 'test@test.com')

    expect(result.success).toBe(true)
    expect(prismaMock.verificationCode.create).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// validateCode
// ---------------------------------------------------------------------------

describe('VerificationService.validateCode', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns failure when code not found (invalid or already used)', async () => {
    ;(prismaMock.verificationCode.findFirst as jest.Mock).mockResolvedValue(null)

    const result = await VerificationService.validateCode(1, '000000')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/inválido|expirado/i)
  })

  it('activates user and marks code used when code is valid', async () => {
    const future = new Date(Date.now() + 10 * 60 * 1000)
    ;(prismaMock.verificationCode.findFirst as jest.Mock).mockResolvedValue({
      id: 1,
      userId: 1,
      code: '123456',
      expiresAt: future,
      usedAt: null,
    })
    ;(prismaMock.verificationCode.update as jest.Mock).mockResolvedValue({})
    ;(prismaMock.user.update as jest.Mock).mockResolvedValue({ id: 1, active: true })

    const result = await VerificationService.validateCode(1, '123456')

    expect(result.success).toBe(true)
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ active: true }) })
    )
    expect(prismaMock.verificationCode.update).toHaveBeenCalledTimes(1)
  })

  it('returns failure for expired code (findFirst returns null because of expiresAt filter)', async () => {
    // The service uses findFirst with expiresAt: { gt: new Date() }
    // An expired code won't be found — the DB query itself filters it out
    ;(prismaMock.verificationCode.findFirst as jest.Mock).mockResolvedValue(null)

    const result = await VerificationService.validateCode(1, '999999')

    expect(result.success).toBe(false)
  })
})
